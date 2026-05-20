#!/usr/bin/env bun

import { existsSync, mkdirSync, appendFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export {}

const ENTRYPOINT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(ENTRYPOINT_DIR, '..', '..')
const CLI_ENTRYPOINT = 'src/entrypoints/cli.tsx'
const SCRIPT_LAMMPS_EXECUTE = 'scripts/lammps-execute.ts'
const SCRIPT_LAMMPS_MODEL_ROUTE = 'scripts/lammps-model-route.ts'
const SCRIPT_LAMMPS_ATOMSK_RENDER = 'scripts/lammps-atomsk-render.ts'
const SCRIPT_LAMMPS_MODEL_EXECUTE = 'scripts/lammps-model-execute.ts'
const SCRIPT_LAMMPS_STRUCTURE_VALIDATE = 'scripts/lammps-structure-validate.ts'
const SCRIPT_LAMMPS_AUTO_REPAIR = 'scripts/lammps-auto-repair.ts'
const SCRIPT_LAMMPS_REPAIR_LOOP = 'scripts/lammps-repair-loop.ts'
const SCRIPT_LAMMPS_ERROR_SUMMARY = 'scripts/lammps-error-summary.ts'
const SCRIPT_LAMMPS_LOOKUP = 'scripts/lammps-lookup.ts'

type SessionMode = 'subcommand' | 'default' | 'interactive' | 'script'

interface SessionLog {
  id: string
  timestampStart: string
  timestampEnd?: string
  mode: SessionMode
  subcommand?: string
  agent?: string
  workingDirectory: string
  promptSummary?: string
  exitCode?: number
  complexity?: TaskComplexity
}

function getWorkLogPath(): string {
  return join(getSessionWorkdir(), '.lammps-project', 'work-log.md')
}

function getSessionWorkdir(): string {
  const pwd = process.env.PWD?.trim()
  if (pwd && existsSync(pwd)) {
    return pwd
  }
  return process.cwd()
}

function getSpawnEnv(baseEnv?: Record<string, string>): Record<string, string> {
  const workdir = getSessionWorkdir()
  return {
    ...process.env,
    ...baseEnv,
    PWD: workdir,
    CLAUDE_CODE_OVERRIDE_CWD: workdir,
  } as Record<string, string>
}

function getLauncherCwd(): string {
  return REPO_ROOT
}

function ensureWorkLog(): void {
  const logDir = join(getSessionWorkdir(), '.lammps-project')
  const logPath = getWorkLogPath()
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true })
  }
  if (!existsSync(logPath)) {
    writeFileSync(
      logPath,
      [
        '# LAMMPS Work Log',
        '',
        'This file is auto-maintained by the LAMMPS CLI wrapper.',
        'Every session (subcommand, interactive, or script) is recorded here.',
        'Agents may append a `work_summary` section during or after their run.',
        '',
        '---',
        '',
      ].join('\n'),
    )
  }
}

function generateSessionId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.toISOString().slice(11, 19).replace(/:/g, '')
  return `S-${date}-${time}`
}

function truncatePrompt(prompt: string, maxLen = 200): string {
  const singleLine = prompt.replace(/\n/g, ' ').trim()
  if (singleLine.length <= maxLen) return singleLine
  return singleLine.slice(0, maxLen - 1) + '…'
}

function appendSessionStart(log: SessionLog): void {
  ensureWorkLog()
  const lines: string[] = [
    `## ${log.id}`,
    '',
    `- **timestamp_start**: ${log.timestampStart}`,
  ]
  if (log.mode) lines.push(`- **mode**: ${log.mode}`)
  if (log.subcommand) lines.push(`- **subcommand**: ${log.subcommand}`)
  if (log.agent) lines.push(`- **agent**: ${log.agent}`)
  lines.push(`- **working_directory**: \`${log.workingDirectory}\``)
  if (log.promptSummary) {
    lines.push(`- **prompt_summary**: ${log.promptSummary}`)
  }
  if (log.complexity) lines.push(`- **complexity**: ${log.complexity}`)
  lines.push('')
  lines.push('<!-- work_summary placeholder: agent may fill this -->')
  lines.push('')
  appendFileSync(getWorkLogPath(), lines.join('\n'))
}

function appendSessionEnd(log: SessionLog): void {
  const lines: string[] = []
  if (log.timestampEnd) {
    lines.push(`- **timestamp_end**: ${log.timestampEnd}`)
  }
  if (log.exitCode !== undefined) {
    lines.push(
      `- **exit_code**: ${log.exitCode}${log.exitCode !== 0 ? ' ⚠' : ''}`,
    )
  }
  lines.push('')
  lines.push('---')
  lines.push('')
  appendFileSync(getWorkLogPath(), lines.join('\n'))
}

async function spawnAndLog(
  command: string[],
  options: {
    stdin?: 'inherit' | 'pipe'
    stdout?: 'inherit' | 'pipe' | 'ignore'
    stderr?: 'inherit' | 'pipe' | 'ignore'
    env?: Record<string, string>
  },
  session: SessionLog,
): Promise<number> {
  appendSessionStart(session)
  const proc = Bun.spawn(command, {
    stdin: options.stdin ?? 'inherit',
    stdout: options.stdout ?? 'inherit',
    stderr: options.stderr ?? 'inherit',
    env: getSpawnEnv(options.env),
    cwd: getLauncherCwd(),
  })
  const exitCode = await proc.exited
  session.timestampEnd = new Date().toISOString()
  session.exitCode = exitCode
  appendSessionEnd(session)
  return exitCode
}

type Subcommand =
  | 'build'
  | 'write'
  | 'review'
  | 'analyze'
  | 'debug'
  | 'lookup'
  | 'curate'
  | 'model'
  | 'model-render'
  | 'model-run'
  | 'model-check'
  | 'execute'
  | 'repair'
  | 'loop'
  | 'summarize-error'
  | 'learn'
  | 'scheme'
  | 'architect'
  | 'reason'
  | 'plot'
  | 'postproc'
  | 'team'

type TaskComplexity = 'simple' | 'complex'

const SUBCOMMAND_AGENT: Record<
  Exclude<
    Subcommand,
    | 'execute'
    | 'repair'
    | 'loop'
    | 'summarize-error'
    | 'model'
    | 'model-render'
    | 'model-run'
    | 'model-check'
    | 'team'
  >,
  string
> = {
  build: 'lammps-input-writer',
  write: 'lammps-input-writer',
  review: 'lammps-reviewer',
  analyze: 'lammps-data-analyst',
  debug: 'lammps-data-analyst',
  lookup: 'lammps-case-librarian',
  curate: 'lammps-kb-coordinator',
  learn: 'lammps-kb-coordinator',
  scheme: 'lammps-simulation-architect',
  architect: 'lammps-simulation-architect',
  reason: 'lammps-simulation-reasoner',
  plot: 'lammps-post-processor',
  postproc: 'lammps-post-processor',
}

export const HELP_TEXT = `LAMMPS CLI wrapper (V2)

Usage:
  bun run lammps
  bun run lammps --help
  bun run lammps --debug-routing [prompt]
  bun run lammps [prompt]
  bun run lammps scheme <prompt>
  bun run lammps architect <prompt>
  bun run lammps reason <prompt>
  bun run lammps plot [prompt]
  bun run lammps postproc [prompt]
  bun run lammps build <prompt>
  bun run lammps write <prompt>
  bun run lammps review <prompt>
  bun run lammps analyze <prompt>
  bun run lammps debug <prompt>
  bun run lammps lookup <prompt>
  bun run lammps curate <prompt>
  bun run lammps model [--prompt <text>] [--material <system>] [--family <family>]
  bun run lammps model-render [--packet <wf01.packet.json>] [--outputDir <dir>]
  bun run lammps model-run --script <atomsk.sh> [--workdir <dir>] [--command <atomsk>]
  bun run lammps model-check --file <structure.lmp>
  bun run lammps execute --input <in.lmp> [--workdir <dir>] [--mode local|hpc]
  bun run lammps repair [--run <run.json>] [--workdir <dir>]
  bun run lammps loop [--repair <repair.json>] [--workdir <dir>]
  bun run lammps summarize-error [--repair <repair.json>] [--loop <next-step.json>] [--rollback <WF-03A|WF-02|WF-01>]
  bun run lammps learn <prompt>
  bun run lammps team [prompt]
  bun run lammps team destroy

Modes:
  default      Start interactive mode with lammps-coordinator
  scheme       Design a simulation scheme with lammps-simulation-architect (WF-00)
  architect    Alias of scheme
  reason       Physical soundness review with lammps-simulation-reasoner (WF-R)
  plot         Generate figures and charts with lammps-post-processor (WF-05)
  postproc     Alias of plot
  build        One-shot input generation with lammps-input-writer
  write        Alias of build for script/input creation
  review       One-shot review with lammps-reviewer
  analyze      One-shot analysis with lammps-data-analyst
  debug        One-shot failure/debug analysis with lammps-data-analyst
  lookup       One-shot retrieval with lammps-case-librarian
  curate       One-shot knowledge curation with lammps-kb-coordinator
  model        Route WF-01 modeling work to case reuse vs Atomsk/manual path
  model-render Render an Atomsk task packet into executable modeling files
  model-run    Launch or dry-run an Atomsk modeling command/script
  model-check  Validate a generated LAMMPS structure/data file
  execute      Launch or dry-run a LAMMPS execution via the local executor
  repair       Analyze a run record and prepare the next repair step
  loop         Build the next bounded repair handoff (outputs next-step.json for Coordinator)
  summarize-error  Append a rollback/error digest into project state files
  learn        Alias of curate for lesson/knowledge handling
  team         Start interactive mode with agent teams enabled (team-lead coordinator)
  team destroy Destroy the current agent team and clean up

Notes:
  - Default mode keeps the original interactive CLI behavior and sets
    --agent lammps-coordinator.
  - If you pass a one-shot prompt without a subcommand, the wrapper now routes
    it to the most suitable LAMMPS agent automatically.
  - scheme/architect routes to lammps-simulation-architect for D1-D7 scheme design.
  - reason routes to lammps-simulation-reasoner for physical soundness review.
  - analyze/debug routes to lammps-data-analyst (renamed from lammps-analyst).
  - The --invoke flag has been removed from loop. Repair loop only outputs
    next-step.json for Coordinator to route.
  - lookup now uses the local evidence-first synthesis path before any agent loop,
    so retrieval answers are built from typed search results, checklists, and
    concrete evidence lines.
  - Subcommands run in print mode (-p) so parameter-style usage coexists with
    interactive usage.
  - Scheduled knowledge maintenance currently uses:
    bun run lammps:maintain-knowledge
  - HPC submission guidance is provided via the project skill:
    /lammps-hpc-submit
  - Runtime execution uses scripts/lammps-execute.ts and can run in dry-run mode
    when no LAMMPS binary is available (useful on Windows before Linux migration).
  - Auto-repair inspection uses scripts/lammps-auto-repair.ts to classify run
    results. V2: no longer sets requiredNextActor or updates project state.
  - Repair-loop planning uses scripts/lammps-repair-loop.ts to build the next
    bounded agent handoff. V2: no longer invokes agents directly.
  - Error summary writing uses scripts/lammps-error-summary.ts to append a
    rollback/error digest into stage summary and open issues.
  - Modeling route planning uses scripts/lammps-model-route.ts and may point to
    /lammps-atomsk-modeling when Atomsk is the right WF-01 tool.
  - Modeling packet rendering, execution, and structure checks use
    scripts/lammps-atomsk-render.ts, scripts/lammps-model-execute.ts, and
    scripts/lammps-structure-validate.ts.
  - Atomsk-based modeling is provided via the project skill:
    /lammps-atomsk-modeling
  - Visualization and OVITO scripting are provided via the project skill:
    /lammps-visualization
  - Extra Claude Code flags can be passed after --.
  - --team flag enables agent team mode (in-process teammates, shared tasks).
  - Wrapper debugging: --debug-routing prints routed agent, inferred task
    complexity, and selected effort before launch.
`

export function isSubcommand(value: string | undefined): value is Subcommand {
  return (
    value === 'build' ||
    value === 'write' ||
    value === 'review' ||
    value === 'analyze' ||
    value === 'debug' ||
    value === 'lookup' ||
    value === 'curate' ||
    value === 'model' ||
    value === 'model-render' ||
    value === 'model-run' ||
    value === 'model-check' ||
    value === 'execute' ||
    value === 'repair' ||
    value === 'loop' ||
    value === 'summarize-error' ||
    value === 'learn' ||
    value === 'scheme' ||
    value === 'architect' ||
    value === 'reason' ||
    value === 'plot' ||
    value === 'postproc' ||
    value === 'team'
  )
}

export function routePrompt(prompt: string): string {
  const normalized = prompt.toLowerCase()
  if (
    /完整workflow|完整 workflow|全流程|闭环|从零开始|wf-00|wf-01|wf-02|wf-03a|wf-04|wf-05/.test(
      normalized,
    )
  ) {
    return 'lammps-coordinator'
  }
  if (
    /知识库|入库|经验总结|沉淀|curate|review queue|候选知识|lesson|learn/.test(
      normalized,
    )
  ) {
    return 'lammps-kb-coordinator'
  }
  if (
    /仿真方案|scheme|设计.*仿真|模拟方案|architect|d1|d2|d3|d4|d5|d6|d7/.test(
      normalized,
    )
  ) {
    return 'lammps-simulation-architect'
  }
  if (
    /物理.*合理|合理性|reason|soundness|文献.*对照|基准.*检查/.test(normalized)
  ) {
    return 'lammps-simulation-reasoner'
  }
  if (
    /画图|可视化|plot|图表|渲染|后处理|postproc|visualization|ovito|matplotlib|figure|snapshot|曲线/.test(
      normalized,
    )
  ) {
    return 'lammps-post-processor'
  }
  if (/审查|review|检查|check/.test(normalized)) {
    return 'lammps-reviewer'
  }
  if (
    /log\.lammps|lost atoms|bond atoms missing|non-numeric|报错|错误|异常|debug|分析|analysis|thermo/.test(
      normalized,
    )
  ) {
    return 'lammps-data-analyst'
  }
  if (
    /写一个|生成|改写|新建输入|build|write|script|输入脚本|in\.lmp|input/.test(
      normalized,
    )
  ) {
    return 'lammps-input-writer'
  }
  if (
    /案例|case|经验|规则|怎么做|manual|手册|lookup|检索|查找|pair_coeff|pair_style|atom_style|fix |compute |delete_atoms|boundary|units|read_restart|read_data/.test(
      normalized,
    )
  ) {
    return 'lammps-case-librarian'
  }
  return 'lammps-coordinator'
}

function splitArgs(argv: string[]) {
  const doubleDashIndex = argv.indexOf('--')
  if (doubleDashIndex === -1) {
    return { mainArgs: argv, passthroughArgs: [] as string[] }
  }
  return {
    mainArgs: argv.slice(0, doubleDashIndex),
    passthroughArgs: argv.slice(doubleDashIndex + 1),
  }
}

function extractTargetCwd(argv: string[]): {
  args: string[]
  targetCwd: string | undefined
} {
  const nextArgs: string[] = []
  let targetCwd: string | undefined
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--cwd') {
      const value = argv[i + 1]
      if (value) {
        targetCwd = value
        i += 1
        continue
      }
    }
    if (arg?.startsWith('--cwd=')) {
      targetCwd = arg.slice('--cwd='.length)
      continue
    }
    if (arg) nextArgs.push(arg)
  }
  return { args: nextArgs, targetCwd }
}

function extractForwardedCliFlags(argv: string[]): {
  args: string[]
  forwarded: string[]
} {
  const nextArgs: string[] = []
  const forwarded: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--model' || arg === '--fallback-model') {
      const value = argv[i + 1]
      if (value) {
        forwarded.push(arg, value)
        i += 1
        continue
      }
    }
    if (arg?.startsWith('--model=') || arg?.startsWith('--fallback-model=')) {
      forwarded.push(arg)
      continue
    }
    if (arg) nextArgs.push(arg)
  }
  return { args: nextArgs, forwarded }
}

function getLammpsCliEnv(): Record<string, string> {
  const nextEnv: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >
  const existing =
    nextEnv.CLAUDE_CODE_SKIP_AUTO_MCP_SERVERS?.split(',')
      .map(name => name.trim())
      .filter(Boolean) ?? []
  if (!existing.includes('exa')) {
    existing.push('exa')
  }
  nextEnv.CLAUDE_CODE_SKIP_AUTO_MCP_SERVERS = existing.join(',')
  return nextEnv
}

function getLammpsProgressPreamble(): string {
  return [
    '[LAMMPS Progress Discipline]',
    'Maintain an explicit todo list from the start and keep exactly one item in_progress.',
    'Use these default stage labels unless the task is clearly narrower: Read references, Inspect case directory, Plan simulation, Build/repair inputs, Run simulation, Analyze outputs, Write report.',
    'If any path lookup or search strategy fails twice, stop repeating the same attempt. Switch to a corrected path or fallback strategy and state that switch in the todo/update.',
    'Before any long-running command or background task, update progress to the stage you are entering.',
    'After each meaningful milestone, emit a short progress update that names the current stage, the artifact just produced, and the next stage.',
    '',
  ].join('\n')
}

function hasExplicitPermissionFlags(args: string[]): boolean {
  return args.some(
    arg =>
      arg === '--dangerously-skip-permissions' ||
      arg === '--permission-mode' ||
      arg.startsWith('--permission-mode='),
  )
}

function withDefaultBypassPermissions(args: string[]): string[] {
  return hasExplicitPermissionFlags(args)
    ? args
    : ['--dangerously-skip-permissions', ...args]
}

function hasExplicitEffortFlag(args: string[]): boolean {
  return args.some(arg => arg === '--effort' || arg.startsWith('--effort='))
}

function withDefaultEffort(args: string[], effort = 'low'): string[] {
  return hasExplicitEffortFlag(args) ? args : ['--effort', effort, ...args]
}

function classifyTaskComplexity(
  subcommand: Subcommand | 'default',
  prompt: string,
): TaskComplexity {
  const normalized = prompt.toLowerCase()
  const complexSignals = [
    /wf-0[1-5]|全流程|闭环|完整案例|新建案例|独立案例|从头开始|完整输入脚本|完整可运行|review gate|repair|loop|rollback/,
    /pair_style|pair_coeff|atom_style|read_data|read_restart|fix npt|fix deform|fix qeq\/reax|reaxff|comb3/,
    /多晶|晶界|polycrystal|bicrystal|cif|atomsk|缺陷|取向|界面/,
    /执行|run lammps|真实运行|提交|hpc|ovito 渲染|动画|知识入库并提升|promote|dedup|merge mode/,
  ]
  const simpleSignals = [
    /只回答|只输出|一行|一个命令|一个变量|变量定义|pair_coeff 那一行|这个写法是否正确|是否正确|负 erate|简单判断/,
    /fix print|strain|stress|pair_coeff|语法|符号|冻结盒长|cl-007/,
  ]

  if (
    subcommand === 'execute' ||
    subcommand === 'repair' ||
    subcommand === 'loop' ||
    subcommand === 'model' ||
    subcommand === 'model-render' ||
    subcommand === 'model-run' ||
    subcommand === 'model-check' ||
    subcommand === 'summarize-error'
  ) {
    return 'complex'
  }

  if (complexSignals.some(pattern => pattern.test(normalized))) {
    return 'complex'
  }

  if (simpleSignals.some(pattern => pattern.test(normalized))) {
    return 'simple'
  }

  if (normalized.length <= 160) {
    return 'simple'
  }

  return 'complex'
}

function buildComplexityPrompt(
  complexity: TaskComplexity,
  prompt: string,
): string {
  if (complexity === 'simple') {
    return [
      getLammpsProgressPreamble(),
      '[Task Complexity: simple]',
      'Treat this as a narrow task. Consult only the minimum relevant local evidence needed to answer correctly.',
      'If evidence conflicts, scope expands, or you cannot answer confidently, escalate yourself to the full complex workflow instead of guessing.',
      'For simple write/review tasks, a correct bounded answer is preferred over exhaustive workflow narration.',
      '',
      prompt,
    ].join('\n')
  }

  return [
    getLammpsProgressPreamble(),
    '[Task Complexity: complex]',
    "Treat this as a full workflow or high-risk task. Use the repository's complete evidence and review process as needed.",
    '',
    prompt,
  ].join('\n')
}

function selectEffortForTask(
  complexity: TaskComplexity,
  subcommand: Subcommand | 'default',
): string {
  if (complexity === 'complex') return 'medium'
  if (subcommand === 'analyze' || subcommand === 'debug') return 'medium'
  if (
    subcommand === 'scheme' ||
    subcommand === 'architect' ||
    subcommand === 'reason'
  )
    return 'high'
  if (subcommand === 'plot' || subcommand === 'postproc') return 'medium'
  return 'low'
}

export async function main() {
  const extracted = extractTargetCwd(process.argv.slice(2))
  const forwardedFlags = extractForwardedCliFlags(extracted.args)
  const rawArgs = forwardedFlags.args
  if (extracted.targetCwd) {
    process.chdir(extracted.targetCwd)
    process.env.PWD = extracted.targetCwd
  }
  const { mainArgs, passthroughArgs } = splitArgs(rawArgs)
  const debugRouting = mainArgs.includes('--debug-routing')
  const useTeamMode = mainArgs.includes('--team')
  const filteredMainArgs = mainArgs.filter(
    arg => arg !== '--debug-routing' && arg !== '--team',
  )

  if (filteredMainArgs.includes('--help') || filteredMainArgs.includes('-h')) {
    process.stdout.write(HELP_TEXT)
    process.exit(0)
  }

  const firstArg = filteredMainArgs[0]
  const baseCommand = [
    process.execPath,
    'run',
    CLI_ENTRYPOINT,
    ...forwardedFlags.forwarded,
  ]

  if (isSubcommand(firstArg)) {
    if (firstArg === 'execute') {
      const command = [
        process.execPath,
        'run',
        SCRIPT_LAMMPS_EXECUTE,
        ...filteredMainArgs.slice(1),
      ]
      const proc = Bun.spawn(command, {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
        env: getSpawnEnv(getLammpsCliEnv()),
        cwd: getLauncherCwd(),
      })
      const exitCode = await proc.exited
      process.exit(exitCode)
    }
    if (firstArg === 'model') {
      const command = [
        process.execPath,
        'run',
        SCRIPT_LAMMPS_MODEL_ROUTE,
        ...filteredMainArgs.slice(1),
      ]
      const proc = Bun.spawn(command, {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
        env: getSpawnEnv(),
        cwd: getLauncherCwd(),
      })
      const exitCode = await proc.exited
      process.exit(exitCode)
    }
    if (firstArg === 'model-render') {
      const command = [
        process.execPath,
        'run',
        SCRIPT_LAMMPS_ATOMSK_RENDER,
        ...filteredMainArgs.slice(1),
      ]
      const proc = Bun.spawn(command, {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
        env: getSpawnEnv(),
        cwd: getLauncherCwd(),
      })
      const exitCode = await proc.exited
      process.exit(exitCode)
    }
    if (firstArg === 'model-run') {
      const command = [
        process.execPath,
        'run',
        SCRIPT_LAMMPS_MODEL_EXECUTE,
        ...filteredMainArgs.slice(1),
      ]
      const proc = Bun.spawn(command, {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
        env: getSpawnEnv(),
        cwd: getLauncherCwd(),
      })
      const exitCode = await proc.exited
      process.exit(exitCode)
    }
    if (firstArg === 'model-check') {
      const command = [
        process.execPath,
        'run',
        SCRIPT_LAMMPS_STRUCTURE_VALIDATE,
        ...filteredMainArgs.slice(1),
      ]
      const proc = Bun.spawn(command, {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
        env: getSpawnEnv(),
        cwd: getLauncherCwd(),
      })
      const exitCode = await proc.exited
      process.exit(exitCode)
    }
    if (firstArg === 'repair') {
      const command = [
        process.execPath,
        'run',
        SCRIPT_LAMMPS_AUTO_REPAIR,
        ...filteredMainArgs.slice(1),
      ]
      const proc = Bun.spawn(command, {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
        env: getSpawnEnv(),
        cwd: getLauncherCwd(),
      })
      const exitCode = await proc.exited
      process.exit(exitCode)
    }
    if (firstArg === 'loop') {
      const command = [
        process.execPath,
        'run',
        SCRIPT_LAMMPS_REPAIR_LOOP,
        ...filteredMainArgs.slice(1),
      ]
      const proc = Bun.spawn(command, {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
        env: getSpawnEnv(),
        cwd: getLauncherCwd(),
      })
      const exitCode = await proc.exited
      process.exit(exitCode)
    }
    if (firstArg === 'summarize-error') {
      const command = [
        process.execPath,
        'run',
        SCRIPT_LAMMPS_ERROR_SUMMARY,
        ...mainArgs.slice(1),
      ]
      const proc = Bun.spawn(command, {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
        env: getSpawnEnv(),
        cwd: getLauncherCwd(),
      })
      const exitCode = await proc.exited
      process.exit(exitCode)
    }
    if (firstArg === 'lookup') {
      const command = [
        process.execPath,
        'run',
        SCRIPT_LAMMPS_LOOKUP,
        ...filteredMainArgs.slice(1),
      ]
      const proc = Bun.spawn(command, {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
        env: getSpawnEnv(),
        cwd: getLauncherCwd(),
      })
      const exitCode = await proc.exited
      process.exit(exitCode)
    }

    if (firstArg === 'team') {
      const teamArgs = filteredMainArgs.slice(1)
      const destroyIdx = teamArgs.indexOf('destroy')
      if (destroyIdx !== -1) {
        const home = process.env.HOME || process.env.USERPROFILE || ''
        const teamDir = `${home}/.angsheng/teams/lammps`
        try {
          const rm = Bun.spawn(['rm', '-rf', teamDir], {
            stderr: 'inherit',
            env: getSpawnEnv(),
            cwd: getLauncherCwd(),
          })
          await rm.exited
          process.stderr.write('Team "lammps" destroyed.\n')
        } catch {
          process.stderr.write('No team to destroy.\n')
        }
        process.exit(0)
      }

      const hasPrompt = teamArgs.length > 0
      const initialPrompt = hasPrompt
        ? teamArgs.join(' ')
        : 'Initialize agent team mode: call TeamCreate to create a team named "lammps", then confirm you are ready. Do NOT spawn any teammates yet — wait for my instructions.'

      const env = {
        ...getLammpsCliEnv(),
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
      }

      process.stderr.write(
        '\n\x1b[32m=== Agent Team Mode (lammps) ===\x1b[0m\n',
      )
      process.stderr.write(
        '\x1b[2mTeam-lead: lammps-coordinator | Teammates: on demand\n\x1b[0m\n',
      )

      if (hasPrompt) {
        const command = [
          ...baseCommand,
          '-p',
          ...withDefaultBypassPermissions(passthroughArgs),
          '--agent',
          'lammps-coordinator',
          initialPrompt,
        ]
        const proc = Bun.spawn(command, {
          stdin: 'inherit',
          stdout: 'inherit',
          stderr: 'inherit',
          env: getSpawnEnv(env),
          cwd: getLauncherCwd(),
        })
        const exitCode = await proc.exited
        process.exit(exitCode)
      } else {
        const command = [
          ...baseCommand,
          ...withDefaultBypassPermissions(passthroughArgs),
          '--agent',
          'lammps-coordinator',
        ]
        const proc = Bun.spawn(command, {
          stdin: 'inherit',
          stdout: 'inherit',
          stderr: 'inherit',
          env: getSpawnEnv(env),
          cwd: getLauncherCwd(),
        })
        const exitCode = await proc.exited
        process.exit(exitCode)
      }
    }

    const agent = SUBCOMMAND_AGENT[firstArg as keyof typeof SUBCOMMAND_AGENT]
    const rawPrompt = filteredMainArgs.slice(1).join(' ')
    const complexity = classifyTaskComplexity(firstArg, rawPrompt)
    const effort = selectEffortForTask(complexity, firstArg)
    if (debugRouting) {
      process.stderr.write(
        `${JSON.stringify({ mode: 'subcommand', subcommand: firstArg, agent, complexity, effort })}\n`,
      )
    }
    const resolvedPrompt = rawPrompt
      ? buildComplexityPrompt(complexity, rawPrompt)
      : ''
    const command = [
      ...baseCommand,
      '-p',
      ...withDefaultEffort(
        withDefaultBypassPermissions(passthroughArgs),
        effort,
      ),
      '--agent',
      agent,
    ]
    const session: SessionLog = {
      id: generateSessionId(),
      timestampStart: new Date().toISOString(),
      mode: 'subcommand',
      subcommand: firstArg,
      agent,
      workingDirectory: getSessionWorkdir(),
      promptSummary: rawPrompt ? truncatePrompt(rawPrompt) : undefined,
      complexity,
    }
    appendSessionStart(session)
    const proc = Bun.spawn(command, {
      stdin: 'pipe',
      stdout: 'inherit',
      stderr: 'inherit',
      env: getSpawnEnv(getLammpsCliEnv()),
      cwd: getLauncherCwd(),
    })
    if (resolvedPrompt) proc.stdin.write(resolvedPrompt)
    proc.stdin.end()
    const exitCode = await proc.exited
    session.timestampEnd = new Date().toISOString()
    session.exitCode = exitCode
    appendSessionEnd(session)
    process.exit(exitCode)
  }

  if (filteredMainArgs.length > 0) {
    const prompt = filteredMainArgs.join(' ')
    const routedAgent = routePrompt(prompt)
    const complexity = classifyTaskComplexity('default', prompt)
    const effort = selectEffortForTask(complexity, 'default')
    if (debugRouting) {
      process.stderr.write(
        `${JSON.stringify({ mode: 'default', agent: routedAgent, complexity, effort })}\n`,
      )
    }
    const resolvedPrompt = buildComplexityPrompt(complexity, prompt)
    const command = [
      ...baseCommand,
      '-p',
      ...withDefaultEffort(
        withDefaultBypassPermissions(passthroughArgs),
        effort,
      ),
      '--agent',
      routedAgent,
    ]
    const session: SessionLog = {
      id: generateSessionId(),
      timestampStart: new Date().toISOString(),
      mode: 'default',
      agent: routedAgent,
      workingDirectory: getSessionWorkdir(),
      promptSummary: truncatePrompt(prompt),
      complexity,
    }
    appendSessionStart(session)
    const proc = Bun.spawn(command, {
      stdin: 'pipe',
      stdout: 'inherit',
      stderr: 'inherit',
      env: getSpawnEnv(),
      cwd: getLauncherCwd(),
    })
    proc.stdin.write(resolvedPrompt)
    proc.stdin.end()
    const exitCode = await proc.exited
    session.timestampEnd = new Date().toISOString()
    session.exitCode = exitCode
    appendSessionEnd(session)
    process.exit(exitCode)
  }

  const command = [
    ...baseCommand,
    ...withDefaultBypassPermissions(passthroughArgs),
    '--agent',
    'lammps-coordinator',
    ...filteredMainArgs,
  ]
  const env = useTeamMode
    ? {
        ...getLammpsCliEnv(),
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
      }
    : getLammpsCliEnv()

  if (useTeamMode) {
    process.stderr.write('\n\x1b[32m=== Agent Team Mode (lammps) ===\x1b[0m\n')
    process.stderr.write('\x1b[2mTeam-lead: lammps-coordinator\n')
    process.stderr.write(
      'Teammates will be spawned on demand by the coordinator.\x1b[0m\n\n',
    )
  }

  const session: SessionLog = {
    id: generateSessionId(),
    timestampStart: new Date().toISOString(),
    mode: 'interactive',
    agent: 'lammps-coordinator',
    workingDirectory: getSessionWorkdir(),
  }
  appendSessionStart(session)
  const proc = Bun.spawn(command, {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
    env: getSpawnEnv(env),
    cwd: getLauncherCwd(),
  })
  const exitCode = await proc.exited
  session.timestampEnd = new Date().toISOString()
  session.exitCode = exitCode
  appendSessionEnd(session)
  process.exit(exitCode)
}

if (import.meta.main) {
  await main()
}
