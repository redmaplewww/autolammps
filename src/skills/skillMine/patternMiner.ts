/**
 * LLM-driven pattern miner.
 *
 * Feeds a MiningDataset to a model with a structured-output prompt, asking
 * for SkillCandidate[] suggestions. Falls back to heuristics if the model
 * returns nothing usable.
 */
import { queryWithModel } from '../../services/api/anthropic.js'
import { extractTextContent } from '../../utils/messages.js'
import { getDefaultSonnetModel } from '../../utils/model/model.js'
import { logError } from '../../utils/log.js'
import { toError } from '../../utils/errors.js'
import { asSystemPrompt } from '../../utils/systemPromptType.js'
import type { MiningDataset } from './historyStore.js'
import type { SkillCandidate } from './stagingStore.js'

const SYSTEM_PROMPT = `You are a skill-mining assistant for the Aura CLI. Your job is to scan a user's recent prompts and session transcripts, then surface repeatable patterns that would make good reusable skills.

A good skill candidate is:
- Repeatable (the user has done this kind of thing multiple times, or it's a clear multi-step workflow)
- Worth saving (would the user benefit from invoking it with one slash command instead of typing the same instructions again?)
- Self-contained (a future session could execute it from a single prompt + arguments)
- Specific (not "general coding help" — that's not a skill)

Common skill archetypes:
- Repeated command sequences (e.g. /commit-and-push, /deploy-staging)
- Multi-step verification workflows (e.g. /verify-tests-and-lint)
- Domain-specific code generation (e.g. /new-react-component, /lammps-input-file)
- Investigation flows (e.g. /debug-memory-leak, /perf-profile)
- Boilerplate generators (e.g. /new-api-endpoint, /migration-template)
- Prompt templates the user keeps retyping (e.g. /explain-like-im-five, /code-review-strict)

Output ONLY a JSON object matching this schema (no prose, no markdown fences):
{
  "candidates": [
    {
      "slug": "kebab-case-name",
      "title": "Human-readable Title",
      "description": "One-sentence description for skill list (what it does)",
      "when_to_use": "Use when... [trigger phrases and example user messages]",
      "allowed_tools": ["Bash(git:*)", "Read", "Edit", "..."],
      "arguments": ["$arg1", "$arg2"],
      "argument_hint": "[optional hint text]",
      "body": "Full markdown body of the skill (without frontmatter). Include # Title, ## Goal, ## Steps, **Success criteria** on each step. Be specific and actionable.",
      "evidence": [
        {"source": "prompt"|"session", "snippet": "Short quote or summary from the data that justifies this candidate"}
      ],
      "rationale": "Why this is skill-worthy (1-2 sentences)",
      "frequency": "seen Nx across Y sessions",
      "proposed_scope": "user" | "project"
    }
  ]
}

Rules:
- Return 0-5 candidates. Quality over quantity. Don't invent patterns that aren't supported by the data.
- Prefer patterns with frequency >= 2 unless the workflow is clearly complex and worth saving once.
- Slugs must be lowercase kebab-case, 3-40 chars, unique within this batch.
- Don't propose skills that duplicate built-in commands (commit, review, mcp, doctor, etc.).
- If the data is sparse or low-signal, return {"candidates": []}.
- Bodies should be COMPLETE and runnable as a skill — never say "fill this in".`

/**
 * Compose the user-prompt payload from a dataset. Truncated to fit context.
 */
function buildUserPrompt(ds: MiningDataset): string {
  const lines: string[] = []
  lines.push(
    `# Mining dataset — window: ${new Date(ds.windowStart).toISOString()} → ${new Date(ds.collectedAt).toISOString()}`,
  )
  lines.push(`Prompts: ${ds.prompts.length}`)
  lines.push(`Sessions: ${ds.sessions.length}`)
  lines.push('')

  // Top prompt shapes — high signal, low tokens
  if (ds.topPromptShapes.length > 0) {
    lines.push('## Top prompt shapes (most-repeated, normalized)')
    for (const s of ds.topPromptShapes.slice(0, 20)) {
      lines.push(`- (x${s.count}) ${s.shape}`)
    }
    lines.push('')
  }

  // Distinct prompts (deduped by shape) — sample
  const seenShapes = new Set<string>()
  const distinctPrompts = ds.prompts.filter(p => {
    const shape = p.text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60)
    if (seenShapes.has(shape)) return false
    seenShapes.add(shape)
    return true
  })
  lines.push(`## Distinct prompts (sample of ${Math.min(distinctPrompts.length, 60)} of ${distinctPrompts.length})`)
  for (const p of distinctPrompts.slice(0, 60)) {
    lines.push(`- ${p.text.replace(/\n/g, ' ')}`)
  }
  lines.push('')

  // Sessions — compressed
  lines.push(`## Recent sessions (sample of ${Math.min(ds.sessions.length, 15)} of ${ds.sessions.length})`)
  for (const s of ds.sessions.slice(0, 15)) {
    lines.push(`### Session ${s.sessionId.slice(0, 8)} — project: ${s.project}`)
    lines.push(`First prompt: ${s.firstPrompt.replace(/\n/g, ' ')}`)
    lines.push(
      `User msgs: ${s.userMessageCount} | Tools: ${Object.entries(s.toolCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k, v]) => `${k}(${v})`)
        .join(', ')}`,
    )
    // Compact turn list — first 12 turns
    const turnLines = s.turns.slice(0, 12).map(t => {
      const tools = t.tools.length > 0 ? ` [${t.tools.join(',')}]` : ''
      const text = t.text ? ` ${truncate(t.text, 140)}` : ''
      return `  ${t.role === 'user' ? 'U' : 'A'}:${tools}${text}`
    })
    if (turnLines.length > 0) lines.push('Turns:')
    for (const tl of turnLines) lines.push(tl)
    lines.push('')
  }

  return lines.join('\n')
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…'
}

/**
 * Parse the LLM's JSON response into a list of partial SkillCandidate
 * payloads (caller fills in id/stagedAt/status/windowStart).
 */
function parseCandidates(
  raw: string,
  ds: MiningDataset,
): Array<Omit<SkillCandidate, 'id' | 'stagedAt' | 'status'>> {
  // Tolerant JSON extraction: model may wrap in prose/fences
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const jsonText = fenceMatch ? fenceMatch[1]! : raw
  const objMatch = jsonText.match(/\{[\s\S]*\}/)
  if (!objMatch) return []
  let parsed: { candidates?: unknown }
  try {
    parsed = JSON.parse(objMatch[0]) as typeof parsed
  } catch {
    return []
  }
  if (!parsed || !Array.isArray(parsed.candidates)) return []

  const seenSlugs = new Set<string>()
  const out: Array<Omit<SkillCandidate, 'id' | 'stagedAt' | 'status'>> = []
  for (const c of parsed.candidates) {
    if (!c || typeof c !== 'object') continue
    const obj = c as Record<string, unknown>
    const slugRaw = String(obj.slug ?? '').trim()
    const slug = sanitizeSlug(slugRaw)
    if (!slug || seenSlugs.has(slug)) continue
    seenSlugs.add(slug)

    const title = String(obj.title ?? slug).trim() || slug
    const description = String(obj.description ?? '').trim()
    if (!description) continue
    const whenToUse = String(obj.when_to_use ?? obj.whenToUse ?? '').trim()
    const allowedTools = Array.isArray(obj.allowed_tools ?? obj.allowedTools)
      ? (obj.allowed_tools as unknown[] ?? obj.allowedTools as unknown[])
          .map((t: unknown) => String(t))
          .filter(t => t.length > 0)
      : []
    const arguments_ = Array.isArray(obj.arguments)
      ? (obj.arguments as unknown[])
          .map((a: unknown) => String(a))
          .filter(a => a.length > 0)
      : []
    const argumentHint = String(obj.argument_hint ?? obj.argumentHint ?? '').trim()
    const body = String(obj.body ?? '').trim()
    if (!body) continue
    const evidence = Array.isArray(obj.evidence)
      ? obj.evidence
          .map((e: unknown) => {
            if (!e || typeof e !== 'object') return null
            const eo = e as Record<string, unknown>
            return {
              source:
                eo.source === 'session' ? 'session' : ('prompt' as const),
              snippet: String(eo.snippet ?? '').slice(0, 400),
            }
          })
          .filter((e: { snippet: string } | null): e is { source: 'prompt' | 'session'; snippet: string } => e !== null && e.snippet.length > 0)
      : []
    const rationale = String(obj.rationale ?? '').trim()
    const frequency = String(obj.frequency ?? '').trim()
    const proposedScope =
      obj.proposed_scope === 'project' || obj.proposedScope === 'project'
        ? 'project'
        : 'user'

    out.push({
      slug,
      title,
      description,
      whenToUse,
      allowedTools,
      arguments: arguments_,
      argumentHint,
      body,
      evidence,
      rationale,
      frequency,
      proposedScope,
      minedAt: ds.collectedAt,
      windowStart: ds.windowStart,
    })
  }
  return out
}

function sanitizeSlug(s: string): string {
  const cleaned = s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 40)
  // Must start with a letter
  return /^[a-z]/.test(cleaned) ? cleaned : ''
}

export type MineResult = {
  /** Successfully-parsed candidates from the LLM. */
  candidates: Array<Omit<SkillCandidate, 'id' | 'stagedAt' | 'status'>>
  /** Set when the LLM call itself failed (network, auth, etc.). */
  modelError?: string
  /** Raw model output length (for telemetry/debug). */
  rawChars: number
}

/**
 * Run the miner against a dataset. Returns 0+ parsed candidates. Never
 * throws — on model error, returns empty candidates + modelError.
 */
export async function minePatterns(ds: MiningDataset): Promise<MineResult> {
  const userPrompt = buildUserPrompt(ds)
  let rawText = ''
  try {
    const result = await queryWithModel({
      systemPrompt: asSystemPrompt([]),
      userPrompt: SYSTEM_PROMPT + '\n\n' + userPrompt,
      signal: new AbortController().signal,
      options: {
        model: getDefaultSonnetModel(),
        querySource: 'skill-mine',
        agents: [],
        isNonInteractiveSession: true,
        hasAppendSystemPrompt: false,
        mcpTools: [],
        maxOutputTokensOverride: 8192,
      },
    })
    rawText = extractTextContent(
      result.message.content as readonly { readonly type: string }[],
    )
  } catch (e: unknown) {
    const msg = toError(e).message
    logError(toError(e))
    return { candidates: [], modelError: msg, rawChars: 0 }
  }

  const candidates = parseCandidates(rawText, ds)
  return { candidates, rawChars: rawText.length }
}
