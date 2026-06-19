import type { Command } from '../types/command.js'
import {
  DEFAULT_WINDOW_MS,
  formatInterval,
  readSkillMineConfig,
  writeSkillMineConfig,
  MIN_WINDOW_MS,
} from '../skills/skillMine/config.js'
import { runSkillMine } from '../skills/skillMine/index.js'

const USAGE = `# Skill Mine — auto-detect reusable patterns from recent activity

## Usage

\`/skill-mine\`                — Run a scan over the last 7 days immediately.
\`/skill-mine --window=24h\`   — Scan only the last 24h (supports: 30m, 2h, 1d, 14d).
\`/skill-mine --set-window=3d\`— Change the default lookback window for future runs.
\`/skill-mine --status\`       — Show config, last run time, and pending candidate count.
\`/skill-mine --help\`         — Show this help.

Mining is **manual only** — it never runs automatically. Run it whenever
you want a fresh scan. After a scan, candidates are written to
\`~/.angsheng/skills-staging/\`. Review and install them with
\`/skill-mine-review\`.
`

function parseDuration(s: string): number | null {
  const m = /^(\d+)\s*([smhd])$/.exec(s.trim().toLowerCase())
  if (!m) return null
  const n = parseInt(m[1]!, 10)
  switch (m[2]) {
    case 's':
      return n * 1000
    case 'm':
      return n * 60 * 1000
    case 'h':
      return n * 60 * 60 * 1000
    case 'd':
      return n * 24 * 60 * 60 * 1000
    default:
      return null
  }
}

type ParsedArgs = {
  windowMs?: number
  setWindowMs?: number
  status?: boolean
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
    if (tok === '--status') {
      out.status = true
      continue
    }
    const winMatch = /^--window=(.+)$/.exec(tok)
    if (winMatch) {
      const ms = parseDuration(winMatch[1]!)
      if (ms) out.windowMs = ms
      continue
    }
    const setWinMatch = /^--set-window=(.+)$/.exec(tok)
    if (setWinMatch) {
      const ms = parseDuration(setWinMatch[1]!)
      if (ms) out.setWindowMs = ms
      continue
    }
  }
  return out
}

const skillMine: Command = {
  type: 'prompt',
  name: 'skill-mine',
  description: 'Mine recent prompts/sessions for reusable skills (manual)',
  aliases: ['skillmine'],
  argumentHint: '[--window=7d|--set-window=3d|--status]',
  source: 'builtin',
  contentLength: 0,
  progressMessage: 'mining for skills',
  async getPromptForCommand(args) {
    const parsed = parseArgs(args || '')

    if (parsed.showHelp) {
      return [{ type: 'text', text: USAGE }]
    }

    const cfg = await readSkillMineConfig()

    // Persist a new default window if requested.
    if (parsed.setWindowMs !== undefined) {
      if (parsed.setWindowMs < MIN_WINDOW_MS) {
        return [
          {
            type: 'text',
            text: `Window too small. Minimum is 1h. Got ${formatInterval(parsed.setWindowMs)}.`,
          },
        ]
      }
      await writeSkillMineConfig({ ...cfg, windowMs: parsed.setWindowMs })
      const lines = [
        '# Skill Mine — default window updated',
        '',
        `New default: **${formatInterval(parsed.setWindowMs)}**`,
        `Future \`/skill-mine\` runs (without \`--window\`) will use this.`,
      ]
      if (!parsed.status && parsed.windowMs === undefined) {
        return [{ type: 'text', text: lines.join('\n') }]
      }
    }

    // Status display only.
    if (parsed.status && parsed.windowMs === undefined) {
      const lines: string[] = ['# Skill Mine — status']
      lines.push('- Scheduling: **manual only** (no auto runs)')
      lines.push(`- Default window: ${formatInterval(cfg.windowMs)}`)
      if (cfg.lastRunAt > 0) {
        const ago = formatInterval(Date.now() - cfg.lastRunAt)
        lines.push(`- Last run: ${ago} ago`)
      } else {
        lines.push('- Last run: never')
      }
      lines.push(
        '- Run `/skill-mine` any time to scan. Candidates are reviewed with `/skill-mine-review`.',
      )
      return [{ type: 'text', text: lines.join('\n') }]
    }

    // Run the actual mining pass.
    const windowMs = Math.max(
      MIN_WINDOW_MS,
      parsed.windowMs ?? cfg.windowMs ?? DEFAULT_WINDOW_MS,
    )
    const result = await runSkillMine({ windowMs })

    const lines: string[] = []
    lines.push('# Skill Mine — scan complete')
    lines.push('')
    lines.push(
      `- Looked back: ${formatInterval(windowMs)} (since ${new Date(Date.now() - windowMs).toLocaleString()})`,
    )
    if (result.dataset) {
      lines.push(`- Prompts scanned: ${result.dataset.prompts.length}`)
      lines.push(`- Sessions scanned: ${result.dataset.sessions.length}`)
      lines.push(
        `- Distinct prompt shapes (>=2x): ${result.dataset.topPromptShapes.length}`,
      )
    }
    lines.push(`- New candidates staged: **${result.staged.length}**`)
    lines.push(`- Duration: ${(result.durationMs / 1000).toFixed(1)}s`)
    if (result.modelError) {
      lines.push(`- ⚠️ Model error: ${result.modelError}`)
      lines.push(
        '  No candidates were generated this pass. Check the error and retry.',
      )
    }
    if (result.staged.length > 0) {
      lines.push('')
      lines.push('## Staged candidates')
      for (const c of result.staged) {
        lines.push(`### \`${c.slug}\` — ${c.title}`)
        lines.push(`> ${c.description}`)
        if (c.frequency) lines.push(`- Frequency: ${c.frequency}`)
        if (c.rationale) lines.push(`- Why: ${c.rationale}`)
        if (c.proposedScope === 'project') {
          lines.push(`- Proposed scope: project (\`.angsheng/skills/${c.slug}\`)`)
        } else {
          lines.push(`- Proposed scope: user (\`~/.angsheng/skills/${c.slug}\`)`)
        }
      }
      lines.push('')
      lines.push(
        'Run **`/skill-mine-review`** to accept, edit, or reject each one.',
      )
    } else if (!result.modelError) {
      lines.push('')
      lines.push(
        'No new skill candidates were found in this window. The model may have decided your recent activity doesn\'t yet show a repeatable pattern worth saving. Try a longer window with `/skill-mine --window=14d`, or keep working — the miner learns as more history accumulates.',
      )
    }

    return [{ type: 'text', text: lines.join('\n') }]
  },
}

export default skillMine
