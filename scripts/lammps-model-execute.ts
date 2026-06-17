#!/usr/bin/env bun
// @ts-nocheck
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { spawn } from 'node:child_process'
import { delimiter, isAbsolute, join, resolve } from 'node:path'

type Args = {
  script?: string
  workdir?: string
  command?: string
  output?: string
  expected?: string
  dryRun?: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      args.dryRun = true
      continue
    }
    if (!arg.startsWith('--')) continue
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`)
    const key = arg.slice(2)
    if (key === 'script') args.script = value
    else if (key === 'workdir') args.workdir = value
    else if (key === 'command') args.command = value
    else if (key === 'output') args.output = value
    else if (key === 'expected') args.expected = value
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

async function readModelingConfig(workdir: string) {
  const path = resolve(workdir, '.lammps-project', 'modeling.json')
  if (await exists(path)) {
    return JSON.parse(await readFile(path, 'utf8'))
  }
  return {}
}

function splitCommand(command: string): string[] {
  return command.match(/(?:[^"]\S*|".+?")+/g)?.map(token => token.replace(/^"|"$/g, '')) ?? []
}

async function canExecute(command: string, cwd: string) {
  if (!command) return false
  if (isAbsolute(command) || command.includes('/') || command.includes('\\')) {
    try { await access(command, constants.X_OK); return true } catch {}
    try { await access(resolve(cwd, command), constants.X_OK); return true } catch {}
    return false
  }
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    if (!dir) continue
    const candidates = process.platform === 'win32'
      ? [join(dir, `${command}.exe`), join(dir, `${command}.bat`), join(dir, command)]
      : [join(dir, command)]
    for (const candidate of candidates) {
      try { await access(candidate, constants.X_OK); return true } catch {}
    }
  }
  return false
}

export async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.script) throw new Error('Usage: bun run scripts/lammps-model-execute.ts --script <atomsk.sh> [--workdir <dir>] [--command "atomsk"] [--dry-run]')
  const workdir = args.workdir ? resolve(process.cwd(), args.workdir) : process.cwd()
  const scriptPath = resolve(workdir, args.script)
  if (!(await exists(scriptPath))) throw new Error(`Modeling script not found: ${scriptPath}`)

  const config = await readModelingConfig(workdir)
  const platform = process.platform === 'win32' ? 'windows' : 'linux'
  const envCommand = process.env.ATOMSK_COMMAND?.trim()
  const atomskArgv = args.command
    ? splitCommand(args.command)
    : envCommand
      ? splitCommand(envCommand)
      : config.atomsk?.[platform] ?? []

  const scriptLaunch = scriptPath.endsWith('.sh')
    ? ['bash', scriptPath]
    : [scriptPath]
  const argv = scriptLaunch
  const cmd = argv[0] ?? ''
  const available = await canExecute(cmd, workdir)
  const dryRun = args.dryRun === true || !available || argv.length === 0
  const modelingDir = resolve(workdir, '.lammps-project', 'modeling')
  await mkdir(modelingDir, { recursive: true })
  const runId = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
  const metaPath = resolve(modelingDir, `${runId}.json`)

  const metadata: Record<string, unknown> = {
    run_id: runId,
    launched_at: new Date().toISOString(),
    workdir,
    script: scriptPath,
    command: argv,
    atomsk_command: atomskArgv,
    platform: process.platform,
    dry_run: dryRun,
    executable_available: available,
    notes: dryRun
      ? 'No runnable Atomsk executable detected; modeling execution interface validated in dry-run mode.'
      : 'Modeling command launched.',
    expected_outputs: args.expected ? splitCommand(args.expected) : [],
  }

  if (dryRun) {
    await writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8')
    process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`)
    return
  }

  const child = spawn(cmd, argv.slice(1), {
    cwd: workdir,
    shell: false,
    env: {
      ...process.env,
      ...(atomskArgv.length > 0 ? { ATOMSK_COMMAND: atomskArgv.join(' ') } : {}),
    },
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', chunk => { stdout += String(chunk); process.stdout.write(String(chunk)) })
  child.stderr.on('data', chunk => { stderr += String(chunk); process.stderr.write(String(chunk)) })
  const exitCode = await new Promise<number>((resolveExit, reject) => {
    child.on('error', reject)
    child.on('close', code => resolveExit(code ?? 1))
  })
  metadata.exit_code = exitCode
  metadata.stdout = stdout
  metadata.stderr = stderr
  metadata.status = exitCode === 0 ? 'completed' : 'failed'
  if (Array.isArray(metadata.expected_outputs) && metadata.expected_outputs.length > 0) {
    metadata.expected_output_status = await Promise.all(
      metadata.expected_outputs.map(async (entry: string) => ({
        file: resolve(workdir, entry),
        exists: await exists(resolve(workdir, entry)),
      })),
    )
  }
  await writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8')
  process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`)
  process.exit(exitCode)
}

if (import.meta.main) {
  await main()
}
