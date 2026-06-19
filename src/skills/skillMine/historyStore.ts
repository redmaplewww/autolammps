/**
 * History collection for skill-mining.
 *
 * Two sources:
 *  1. ~/.angsheng/history.jsonl — global prompt history (lightweight, one
 *     line per submitted prompt). Fast, but lacks tool-call context.
 *  2. ~/.angsheng/projects/<proj>/*.jsonl — full session transcripts
 *     (including assistant turns and tool calls). Slower, but enables
 *     detecting multi-step workflows.
 *
 * Both are filtered to `windowMs` (mtime-based) and deduped.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { getOriginalCwd } from '../../bootstrap/state.js'
import { getAppConfigHomeDir } from '../../utils/envUtils.js'
import { isENOENT, isFsInaccessible } from '../../utils/errors.js'
import { readLinesReverse } from '../../utils/fsOperations.js'
import { logForDebugging } from '../../utils/debug.js'
import { getProjectDir, getProjectsDir } from '../../utils/sessionStorage.js'
import { jsonStringify } from '../../utils/slowOperations.js'

export type PromptSample = {
  /** Truncated prompt text (≤ 500 chars). */
  text: string
  /** Project path (empty for global-only). */
  project: string
  /** Epoch ms when the prompt was submitted. */
  timestamp: number
}

export type SessionSample = {
  sessionId: string
  project: string
  /** First user prompt of the session. */
  firstPrompt: string
  /** Truncated user→assistant flow: up to 30 alternating turns, ≤ 300 chars each. */
  turns: Array<{ role: 'user' | 'assistant'; text: string; tools: string[] }>
  /** Epoch ms of the session's last activity. */
  modifiedAt: number
  /** Number of user messages (for ranking frequent workflows). */
  userMessageCount: number
  /** Tool frequency map within this session. */
  toolCounts: Record<string, number>
}

export type MiningDataset = {
  windowStart: number
  collectedAt: number
  prompts: PromptSample[]
  sessions: SessionSample[]
  /**
   * Top-N most-repeated prompt "shapes" (after lowercasing + trim). Used as
   * a fast signal to seed the LLM with high-frequency candidates.
   */
  topPromptShapes: Array<{ shape: string; count: number; example: string }>
}

const MAX_PROMPT_TEXT = 500
const MAX_TURN_TEXT = 300
const MAX_TURNS_PER_SESSION = 30
const MAX_PROMPTS = 2000
const MAX_SESSIONS = 50

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}

/**
 * Read prompt samples from history.jsonl (newest-first), filtering by window.
 */
export async function collectPromptsFromHistory(
  windowStart: number,
): Promise<PromptSample[]> {
  const historyPath = join(getAppConfigHomeDir(), 'history.jsonl')
  const out: PromptSample[] = []

  try {
    for await (const line of readLinesReverse(historyPath)) {
      if (out.length >= MAX_PROMPTS) break
      const trimmed = line.trim()
      if (!trimmed) continue
      let entry: {
        display?: string
        timestamp?: number
        project?: string
      }
      try {
        entry = jsonStringify(trimmed) ? (JSON.parse(trimmed) as typeof entry) : null!
      } catch {
        continue
      }
      if (!entry || typeof entry.display !== 'string') continue
      const ts = typeof entry.timestamp === 'number' ? entry.timestamp : 0
      if (ts && ts < windowStart) break // history.jsonl is append-ordered
      out.push({
        text: truncate(entry.display, MAX_PROMPT_TEXT),
        project: typeof entry.project === 'string' ? entry.project : '',
        timestamp: ts,
      })
    }
  } catch (e: unknown) {
    if (isENOENT(e)) return []
    logForDebugging(`[skill-mine] history.jsonl read failed: ${e}`)
    return []
  }

  return out
}

/**
 * Discover session .jsonl files across all known projects, filtered by
 * window. Returns up to MAX_SESSIONS newest files.
 */
async function discoverRecentSessionFiles(
  windowStart: number,
): Promise<Array<{ path: string; project: string; modifiedAt: number }>> {
  const projectsRoot = getProjectsDir()
  let dirNames: string[]
  try {
    dirNames = await readdir(projectsRoot)
  } catch (e: unknown) {
    if (isFsInaccessible(e)) return []
    throw e
  }

  const candidates: Array<{ path: string; project: string; modifiedAt: number }> =
    []

  await Promise.all(
    dirNames.map(async dirName => {
      const dirPath = join(projectsRoot, dirName)
      let st: Awaited<ReturnType<typeof stat>>
      try {
        st = await stat(dirPath)
      } catch {
        return
      }
      if (!st.isDirectory()) return

      let files: string[]
      try {
        files = await readdir(dirPath)
      } catch {
        return
      }
      await Promise.all(
        files.map(async f => {
          if (!f.endsWith('.jsonl')) return
          const fp = join(dirPath, f)
          try {
            const fst = await stat(fp)
            if (fst.mtime.getTime() < windowStart) return
            candidates.push({
              path: fp,
              project: dirName,
              modifiedAt: fst.mtime.getTime(),
            })
          } catch {
            // stat failed — skip
          }
        }),
      )
    }),
  )

  candidates.sort((a, b) => b.modifiedAt - a.modifiedAt)
  return candidates.slice(0, MAX_SESSIONS)
}

function emptyContent(): {
  text: string
  tools: string[]
} {
  return { text: '', tools: [] }
}

/**
 * Parse a session .jsonl into a SessionSample. Reads the file once and
 * extracts a compact turn-by-turn summary. Skips system/meta entries.
 */
async function parseSessionFile(
  path: string,
  project: string,
  modifiedAt: number,
): Promise<SessionSample | null> {
  let raw: string
  try {
    raw = await readFile(path, 'utf-8')
  } catch (e: unknown) {
    if (isENOENT(e)) return null
    return null
  }

  const lines = raw.split('\n').filter(l => l.trim().length > 0)
  const turns: SessionSample['turns'] = []
  const toolCounts: Record<string, number> = {}
  let firstPrompt = ''
  let userMessageCount = 0
  let sessionId = ''

  for (const line of lines) {
    let entry: {
      type?: string
      sessionId?: string
      message?: {
        role?: string
        content?:
          | string
          | Array<
              | { type: 'text'; text?: string }
              | { type: 'tool_use'; name?: string }
            >
      }
    }
    try {
      entry = JSON.parse(line) as typeof entry
    } catch {
      continue
    }
    if (!entry) continue
    if (typeof entry.sessionId === 'string' && !sessionId) {
      sessionId = entry.sessionId
    }
    if (entry.type !== 'user' && entry.type !== 'assistant') continue
    const msg = entry.message
    if (!msg) continue
    const role = msg.role === 'user' ? 'user' : 'assistant'
    const content = msg.content
    let text = ''
    const tools: string[] = []

    if (typeof content === 'string') {
      text = content
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text' && typeof block.text === 'string') {
          text += (text ? '\n' : '') + block.text
        } else if (block.type === 'tool_use' && typeof block.name === 'string') {
          tools.push(block.name)
          toolCounts[block.name] = (toolCounts[block.name] || 0) + 1
        }
      }
    }

    text = text.trim()
    if (role === 'user' && text) {
      userMessageCount++
      if (!firstPrompt) firstPrompt = text
    }
    // Skip empty turns, system reminders, and virtual tool results
    if (!text && tools.length === 0) continue
    if (text.startsWith('<system-reminder>')) continue
    if (turns.length >= MAX_TURNS_PER_SESSION) break

    turns.push({
      role,
      text: text ? truncate(text, MAX_TURN_TEXT) : '',
      tools,
    })
  }

  if (!firstPrompt && turns.length === 0) return null

  return {
    sessionId: sessionId || path,
    project,
    firstPrompt: truncate(firstPrompt || '(no prompt)', MAX_PROMPT_TEXT),
    turns,
    modifiedAt,
    userMessageCount,
    toolCounts,
  }
}

/**
 * Build the dataset used to mine skill candidates. Reads both sources in
 * parallel. `extraProjectHint` (typically getOriginalCwd()) is used to
 * prioritize the current project's sessions — but ALL projects in the
 * window are still scanned.
 */
export async function buildMiningDataset(
  windowMs: number,
  extraProjectHint?: string,
): Promise<MiningDataset> {
  const now = Date.now()
  const windowStart = now - windowMs
  const cwdHint = extraProjectHint ?? getOriginalCwd()

  const [prompts, sessionFiles] = await Promise.all([
    collectPromptsFromHistory(windowStart),
    discoverRecentSessionFiles(windowStart),
  ])

  const sessions = (
    await Promise.all(
      sessionFiles.map(sf => parseSessionFile(sf.path, sf.project, sf.modifiedAt)),
    )
  ).filter((s): s is SessionSample => s !== null)

  // Sort: current project's sessions first, then by recency
  sessions.sort((a, b) => {
    const aMatch = a.project === cwdHint ? 1 : 0
    const bMatch = b.project === cwdHint ? 1 : 0
    if (aMatch !== bMatch) return bMatch - aMatch
    return b.modifiedAt - a.modifiedAt
  })

  // Compute top prompt shapes for the LLM seed
  const shapeMap = new Map<string, { count: number; example: string }>()
  for (const p of prompts) {
    // Normalize: lowercase, collapse whitespace, strip surrounding quotes,
    // drop trailing punctuation. Keep first 80 chars to bucket variants.
    const shape = p.text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/^["'`]+|["'`.!?]+$/g, '')
      .trim()
      .slice(0, 80)
    if (!shape) continue
    const existing = shapeMap.get(shape)
    if (existing) {
      existing.count++
    } else {
      shapeMap.set(shape, { count: 1, example: p.text })
    }
  }
  const topPromptShapes = [...shapeMap.entries()]
    .map(([shape, v]) => ({ shape, count: v.count, example: v.example }))
    .filter(s => s.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)

  return {
    windowStart,
    collectedAt: now,
    prompts,
    sessions,
    topPromptShapes,
  }
}

/**
 * Optional: probe the current project's session directory directly. Used by
 * /skill-mine --project to restrict the scan to one project.
 */
export async function getCurrentProjectSessionDir(): Promise<string | null> {
  try {
    return getProjectDir(getOriginalCwd())
  } catch {
    return null
  }
}
