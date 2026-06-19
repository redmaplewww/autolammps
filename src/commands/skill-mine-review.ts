import type { Command } from '../types/command.js'
import {
  installCandidate,
  listStagedCandidates,
  rejectCandidate,
} from '../skills/skillMine/index.js'
import { renderSkillMarkdown } from '../skills/skillMine/stagingStore.js'

const USAGE = `# Skill Mine Review — accept, edit, or reject staged candidates

## Usage

\`/skill-mine-review\`              — Show all pending candidates and decide each.
\`/skill-mine-review <slug>\`       — Review one specific candidate by slug.
\`/skill-mine-review --accept-all\` — Accept every pending candidate to user scope.
\`/skill-mine-review --reject-all\` — Reject every pending candidate (purge).
\`/skill-mine-review --list\`       — Just list candidates without acting.

For each candidate, the model will use the AskUserQuestion tool to ask you:
- **Accept (user)**: install to \`~/.angsheng/skills/<slug>/\`
- **Accept (project)**: install to \`<cwd>/.angsheng/skills/<slug>/\`
- **Edit**: rewrite the candidate (you'll be prompted for changes)
- **Reject**: skip this candidate (kept on disk for history)
- **Skip**: defer to later

After accepting, run \`/reload\` or restart the CLI to load the new skill.
`

type ParsedArgs = {
  slug?: string
  list?: boolean
  acceptAll?: boolean
  rejectAll?: boolean
  showHelp?: boolean
}

function parseArgs(raw: string): ParsedArgs {
  const out: ParsedArgs = {}
  const tokens = raw.trim().split(/\s+/).filter(Boolean)
  for (const tok of tokens) {
    if (tok === '-h' || tok === '--help') {
      out.showHelp = true
      continue
    }
    if (tok === '--list') {
      out.list = true
      continue
    }
    if (tok === '--accept-all') {
      out.acceptAll = true
      continue
    }
    if (tok === '--reject-all') {
      out.rejectAll = true
      continue
    }
    if (!tok.startsWith('--') && !out.slug) {
      out.slug = tok
    }
  }
  return out
}

const skillMineReview: Command = {
  type: 'prompt',
  name: 'skill-mine-review',
  description: 'Review and install skill-mine candidates',
  aliases: ['skillmine-review'],
  argumentHint: '[<slug>|--list|--accept-all|--reject-all]',
  source: 'builtin',
  contentLength: 0,
  progressMessage: 'reviewing skill candidates',
  allowedTools: ['AskUserQuestion', 'Read', 'Write', 'Edit'],
  async getPromptForCommand(args) {
    const parsed = parseArgs(args || '')

    if (parsed.showHelp) {
      return [{ type: 'text', text: USAGE }]
    }

    const all = await listStagedCandidates('pending')

    if (all.length === 0) {
      return [
        {
          type: 'text',
          text: 'No skill candidates pending review. Run `/skill-mine` first to scan your recent activity.',
        },
      ]
    }

    // Filter by slug if provided
    let targets = all
    if (parsed.slug) {
      targets = all.filter(s => s.candidate.slug === parsed.slug)
      if (targets.length === 0) {
        const available = all.map(s => s.candidate.slug).join(', ')
        return [
          {
            type: 'text',
            text: `No pending candidate named \`${parsed.slug}\`. Available: ${available}`,
          },
        ]
      }
    }

    // --list: read-only display
    if (parsed.list) {
      const lines = [
        '# Pending skill candidates',
        '',
        ...targets.map(s => {
          const c = s.candidate
          return `## \`${c.slug}\` — ${c.title}\n> ${c.description}\n- ${c.frequency}\n- ${c.rationale}`
        }),
      ]
      return [{ type: 'text', text: lines.join('\n') }]
    }

    // --reject-all: bulk reject + purge
    if (parsed.rejectAll) {
      let n = 0
      for (const s of targets) {
        await rejectCandidate(s.id, true)
        n++
      }
      return [
        {
          type: 'text',
          text: `Rejected and purged ${n} candidate${n === 1 ? '' : 's'}.`,
        },
      ]
    }

    // --accept-all: bulk accept to user scope
    if (parsed.acceptAll) {
      const installed: string[] = []
      for (const s of targets) {
        try {
          const r = await installCandidate(s.id, 'user')
          installed.push(
            `  - \`${s.candidate.slug}\` → ${r.skillFile}`,
          )
        } catch (e: unknown) {
          installed.push(
            `  - ⚠️ \`${s.candidate.slug}\` failed: ${(e as Error).message}`,
          )
        }
      }
      return [
        {
          type: 'text',
          text: `Installed ${installed.length} skill${installed.length === 1 ? '' : 's'} to user scope:\n${installed.join('\n')}\n\nRun \`/reload\` or restart the CLI to load them.`,
        },
      ]
    }

    // Default: interactive review. Hand control to the model with the
    // candidate payloads so it can use AskUserQuestion one at a time.
    const candidateSummaries = targets.map(s => {
      const c = s.candidate
      return [
        `### ${s.id} — \`${c.slug}\` — ${c.title}`,
        `- Description: ${c.description}`,
        `- When to use: ${c.whenToUse || '(none)'}`,
        `- Frequency: ${c.frequency || 'unknown'}`,
        `- Why skill-worthy: ${c.rationale || '(not provided)'}`,
        `- Proposed scope: ${c.proposedScope}`,
        c.arguments.length > 0
          ? `- Arguments: ${c.arguments.join(', ')}`
          : '- Arguments: (none)',
        c.allowedTools.length > 0
          ? `- Allowed tools: ${c.allowedTools.join(', ')}`
          : '- Allowed tools: (none)',
        `- Evidence:`,
        ...c.evidence.map(
          e => `    - [${e.source}] ${e.snippet}`,
        ),
        '',
        'Full proposed SKILL.md:',
        '```markdown',
        renderSkillMarkdown(c),
        '```',
      ].join('\n')
    })

    const prompt = `# Skill Mine — interactive review

You are helping the user review ${targets.length} skill candidate${targets.length === 1 ? '' : 's'} staged by the auto-miner.

For EACH candidate below, in order:

1. Show the user a one-paragraph summary of what the candidate does and why it was proposed.
2. Use the **AskUserQuestion** tool to ask what they want to do. Provide these options:
   - **Accept (user)** — install to \`~/.angsheng/skills/<slug>/SKILL.md\` (cross-project, recommended for general workflows)
   - **Accept (project)** — install to \`<cwd>/.angsheng/skills/<slug>/SKILL.md\` (this project only)
   - **Edit** — let the user describe changes; you'll rewrite the candidate using Edit/Write before installing
   - **Reject** — skip and mark rejected
   - **Skip** — defer this one to later
3. Based on their choice:
   - **Accept (user)** or **Accept (project)**: use the \`Write\` tool to create the SKILL.md file at the chosen path. The full content is provided above for each candidate. Tell the user where you saved it.
   - **Edit**: ask via AskUserQuestion what to change (description, when_to_use, body, etc.), apply the edits to the SKILL.md content, then write the file.
   - **Reject**: skip without writing.
   - **Skip**: skip without writing.
4. After all candidates are processed, output a final summary listing what was installed vs. skipped.

CRITICAL: do NOT call any other tools (no Bash, no Read for files outside skill dirs). The SKILL.md content is already provided in full above — just write it verbatim unless the user edits it.

## Candidates to review

${candidateSummaries.join('\n\n---\n\n')}

Remember: use AskUserQuestion for the decision, then Write for the file. Begin with a brief overview of the ${targets.length} candidate${targets.length === 1 ? '' : 's'}, then proceed one at a time.`

    return [{ type: 'text', text: prompt }]
  },
}

export default skillMineReview
