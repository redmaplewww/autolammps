#!/usr/bin/env bun
// @ts-nocheck
import { access, readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Args = {
  run?: string
  workdir?: string
  input?: string
  output?: string
}

type RunMetadata = {
  run_id: string
  launched_at?: string
  completed_at?: string
  workdir: string
  input: string
  mode: string
  command_source?: string
  command?: string[]
  command_args?: string[]
  log_path?: string
  stdout_path?: string
  stderr_path?: string
  dry_run?: boolean
  executable_available?: boolean
  status?: string
  exit_code?: number
  notes?: string
  platform?: string
}

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`)
    }
    const key = arg.slice(2)
    if (key === 'run') args.run = value
    else if (key === 'workdir') args.workdir = value
    else if (key === 'input') args.input = value
    else if (key === 'output') args.output = value
    i += 1
  }
  return args
}

async function exists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function resolveRunMetadata(args: Args, workdir: string): Promise<{ path: string; data: RunMetadata }> {
  if (args.run) {
    const path = resolve(workdir, args.run)
    return { path, data: JSON.parse(await readFile(path, 'utf8')) as RunMetadata }
  }

  const runsDir = resolve(workdir, '.lammps-project', 'runs')
  const entries = await readdir(runsDir)
  const jsons = entries
    .filter(name => name.endsWith('.json') && !name.endsWith('.repair.json') && !name.endsWith('.next-step.json') && !name.endsWith('analysis-report.json'))
    .sort()
    .reverse()
  if (jsons.length === 0) {
    throw new Error(`No run metadata found in ${runsDir}`)
  }
  const path = resolve(runsDir, jsons[0])
  return { path, data: JSON.parse(await readFile(path, 'utf8')) as RunMetadata }
}

async function readOptional(path?: string) {
  if (!path) return ''
  if (!(await exists(path))) return ''
  return readFile(path, 'utf8')
}

type SuggestedActor = 'lammps-data-analyst' | 'lammps-input-writer' | 'lammps-reviewer' | 'lammps-simulation-reasoner' | 'lammps-coordinator'

function classify(metadata: RunMetadata, stdout: string, stderr: string, log: string) {
  const combined = `${stderr}\n${stdout}\n${log}`.toLowerCase()
  const issues: string[] = []
  const suggestedFixes: string[] = []
  let run_status = 'unknown'
  let suggested_actor: SuggestedActor = 'lammps-coordinator'
  let autoRepairEligible = false
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  let wf05Trigger = { generate_plots: false, reason: '' }

  if (metadata.dry_run) {
    run_status = 'dry_run_only'
    issues.push('No runnable LAMMPS executable is available in the current environment.')
    suggestedFixes.push('Configure `.lammps-project/execution.json` or `LAMMPS_COMMAND` with a Linux/HPC LAMMPS executable before rerunning.')
    suggested_actor = 'lammps-coordinator'
    confidence = 'high'
  } else if (metadata.exit_code === 0) {
    run_status = 'completed'
    suggested_actor = 'lammps-data-analyst'
    confidence = 'high'
    wf05Trigger = { generate_plots: true, reason: 'Run completed successfully, visualization may be useful.' }
  } else if (!metadata.log_path || !metadata.log_path.trim()) {
    run_status = 'launch_failed'
    issues.push('Run failed before a log path was established.')
    suggestedFixes.push('Check the resolved LAMMPS command and working directory.')
    suggested_actor = 'lammps-coordinator'
    confidence = 'high'
  } else if (combined.includes('cannot open') || combined.includes('no such file or directory')) {
    run_status = 'missing_artifact'
    issues.push('The run could not open a referenced file.')
    suggestedFixes.push('Verify `read_data`, `read_restart`, potential paths, and included scripts exist relative to the working directory.')
    suggested_actor = 'lammps-input-writer'
    autoRepairEligible = true
    confidence = 'high'
  } else if (combined.includes('unknown command') || combined.includes('illegal')) {
    run_status = 'input_syntax_failure'
    issues.push('LAMMPS reported an unknown or illegal command.')
    suggestedFixes.push('Review command spelling, package availability, and command ordering against the LAMMPS manual.')
    suggested_actor = 'lammps-reviewer'
    autoRepairEligible = true
    confidence = 'high'
  } else if (combined.includes('lost atoms')) {
    run_status = 'runtime_instability'
    issues.push('Run reported lost atoms.')
    suggestedFixes.push('Inspect timestep, thermostat/barostat settings, overlap, and boundary conditions before rerunning.')
    suggested_actor = 'lammps-data-analyst'
    autoRepairEligible = false
    confidence = 'high'
  } else if (combined.includes('bond atoms missing')) {
    run_status = 'bonding_failure'
    issues.push('Run reported missing bonded atoms.')
    suggestedFixes.push('Inspect geometry, force field topology, timestep, and high-strain behavior near the failure step.')
    suggested_actor = 'lammps-data-analyst'
    autoRepairEligible = false
    confidence = 'high'
  } else if (combined.includes('non-numeric')) {
    run_status = 'numerical_failure'
    issues.push('Run produced non-numeric thermo output.')
    suggestedFixes.push('Review initial structure quality, timestep, minimization, temperature ramp, and force-field consistency.')
    suggested_actor = 'lammps-data-analyst'
    autoRepairEligible = false
    confidence = 'high'
  } else {
    run_status = metadata.status === 'failed' ? 'runtime_failed' : 'unknown'
    issues.push('Run failed but no high-confidence signature was detected.')
    suggestedFixes.push('Inspect stderr and `log.lammps` sections with `lammps-data-analyst` before editing the input.')
    suggested_actor = 'lammps-data-analyst'
    confidence = 'medium'
  }

  const logSignals = collectSignals(log)
  if (logSignals.length > 0 && run_status === 'completed') {
    suggestedFixes.push('Even though the run completed, review warnings and thermo stability before trusting the result.')
    confidence = 'medium'
  }

  return {
    run_status,
    suggested_actor,
    auto_repair_eligible: autoRepairEligible,
    confidence,
    issues,
    suggested_fixes: [...new Set(suggestedFixes)],
    log_signals: logSignals,
    wf05_trigger: wf05Trigger,
  }
}

function collectSignals(log: string) {
  const signals: string[] = []
  const lower = log.toLowerCase()
  if (lower.includes('warning')) signals.push('warnings-present')
  if (lower.includes('error')) signals.push('errors-present')
  if (lower.includes('thermo')) signals.push('thermo-output-present')
  if (lower.includes('loop time')) signals.push('loop-time-present')
  return signals
}

export async function main() {
  const args = parseArgs(process.argv.slice(2))
  const workdir = args.workdir ? resolve(process.cwd(), args.workdir) : process.cwd()
  const { path: metadataPath, data: metadata } = await resolveRunMetadata(args, workdir)
  const stdout = await readOptional(metadata.stdout_path)
  const stderr = await readOptional(metadata.stderr_path)
  const log = await readOptional(metadata.log_path)

  const outputPath = args.output
    ? resolve(workdir, args.output)
    : resolve(workdir, '.lammps-project', 'runs', `${metadata.run_id}.repair.json`)

  const report = {
    run_id: metadata.run_id,
    input: metadata.input,
    mode: metadata.mode,
    metadata_path: metadataPath,
    repair_path: outputPath,
    log_path: metadata.log_path ?? null,
    stdout_path: metadata.stdout_path ?? null,
    stderr_path: metadata.stderr_path ?? null,
    launch_status: metadata.status ?? (metadata.dry_run ? 'dry_run' : 'unknown'),
    ...classify(metadata, stdout, stderr, log),
  }
  await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8')
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}

if (import.meta.main) {
  await main()
}
