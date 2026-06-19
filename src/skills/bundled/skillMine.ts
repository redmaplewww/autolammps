import { getOriginalCwd } from '../../bootstrap/state.js'
import { logForDebugging } from '../../utils/debug.js'
import { runSkillMine } from '../skillMine/index.js'
import { registerBundledSkill } from '../bundledSkills.js'

/**
 * Bundled, model-invocable wrapper around the skill-miner.
 *
 * Distinct from the /skill-mine slash command (which is user-typed and
 * returns a status report): this skill is what the model uses when it
 * notices "the user keeps asking me for the same kind of thing" and
 * decides to proactively surface candidates. Always returns the staged
 * candidate slugs in its prompt so the model can describe them to the
 * user.
 */
export function registerSkillMineSkill(): void {
      registerBundledSkill({
    name: 'mine-skills',
    description:
      'Scan recent user prompts/sessions for repeatable patterns and propose them as reusable skills. Stages candidates for review.',
    whenToUse:
      'Use when the user mentions wanting to automate a repeated workflow, save a prompt template, capture a multi-step process as a skill, or when you notice them retyping the same instructions multiple times. Also triggers on phrases like "make this a skill", "save this workflow", "I keep doing X", "turn this into a skill".',
    allowedTools: ['AskUserQuestion', 'Read', 'Write', 'Edit'],
    argumentHint: '[--window=7d]',
    userInvocable: false, // /skill-mine slash command handles user invocation
    async getPromptForCommand(args) {
      // Parse --window if present
      let windowMs: number | undefined
      const m = /--window=(\d+)([smhd])?/.exec(args || '')
      if (m) {
        const n = parseInt(m[1]!, 10)
        const unit = m[2] ?? 'd'
        const mult =
          unit === 's' ? 1000 :
          unit === 'm' ? 60_000 :
          unit === 'h' ? 3_600_000 :
          86_400_000
        windowMs = n * mult
      }

      logForDebugging(
        `[skill-mine skill] invoked (window=${windowMs ?? 'default'})`,
      )

      const result = await runSkillMine({
        windowMs,
        cwdHint: getOriginalCwd(),
      })

      const lines: string[] = []
      lines.push('# Skill Mine — model-invoked scan')
      lines.push('')
      if (result.dataset) {
        lines.push(
          `- Scanned ${result.dataset.prompts.length} prompts and ${result.dataset.sessions.length} sessions.`,
        )
      }
      lines.push(`- Found **${result.staged.length}** new candidate${result.staged.length === 1 ? '' : 's'}.`)
      if (result.modelError) {
        lines.push(`- ⚠️ Model error: ${result.modelError}`)
      }

      if (result.staged.length === 0) {
        lines.push('')
        lines.push(
          'No new candidates were staged. Tell the user that recent activity did not surface a strong repeatable pattern, and suggest they try `/skill-mine --window=14d` for a longer lookback or `/skill-mine --status` to inspect configuration.',
        )
        return [{ type: 'text', text: lines.join('\n') }]
      }

      lines.push('')
      lines.push('## Staged candidates (pending user review)')
      for (const c of result.staged) {
        lines.push(`### \`${c.slug}\` — ${c.title}`)
        lines.push(`> ${c.description}`)
        lines.push(`- ${c.frequency || 'frequency unknown'}`)
        lines.push(`- Why skill-worthy: ${c.rationale || '(no rationale)'}`)
      }
      lines.push('')
      lines.push(
        '## Your task',
      )
      lines.push(
        'Use **AskUserQuestion** to ask the user which candidates they want to install. For each they accept, choose user scope (`~/.angsheng/skills/<slug>/SKILL.md`) or project scope (`<cwd>/.angsheng/skills/<slug>/SKILL.md`). Use the **Write** tool to create the SKILL.md at the chosen path with this content:',
      )
      lines.push('')
      for (const c of result.staged) {
        const { renderSkillMarkdown } = await import('../skillMine/stagingStore.js')
        lines.push(`### SKILL.md for \`${c.slug}\``)
        lines.push('```markdown')
        lines.push(renderSkillMarkdown(c))
        lines.push('```')
        lines.push('')
      }
      lines.push(
        'After installing accepted skills, tell the user to run `/reload` or restart the CLI to load them.',
      )
      return [{ type: 'text', text: lines.join('\n') }]
    },
  })
}
