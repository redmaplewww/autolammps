#!/usr/bin/env bun
// @ts-nocheck
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

type Args = {
  packet?: string
  outputDir?: string
}

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`)
    const key = arg.slice(2)
    if (key === 'packet') args.packet = value
    else if (key === 'outputDir') args.outputDir = value
    i += 1
  }
  return args
}

function renderFromPacket(packet: any) {
  const route = packet.primary_route
  if (route === 'atomsk-cif-conversion') {
    const cif = packet.atomsk_plan?.required_inputs?.[0] ?? 'input.cif'
    return {
      scriptName: 'run-atomsk.sh',
      files: {
        'run-atomsk.sh': `#!/usr/bin/env bash
set -e
atomsk "${cif}" -orthogonal-cell tmp.xsf
atomsk tmp.xsf -alignx -unskew output.lmp
`,
      },
      expectedOutputs: ['output.lmp'],
    }
  }
  if (route === 'atomsk-polycrystal') {
    return {
      scriptName: 'run-atomsk.sh',
      files: {
        'poly.txt': `box 100 100 100
random 8
`,
        'run-atomsk.sh': `#!/usr/bin/env bash
set -e
atomsk --create fcc 3.615 Cu seed.xsf
atomsk --polycrystal seed.xsf poly.txt polycrystal.cfg lmp -wrap
`,
      },
      expectedOutputs: ['polycrystal.cfg', 'polycrystal.lmp'],
    }
  }
  return {
    scriptName: 'run-atomsk.sh',
    files: {
      'run-atomsk.sh': `#!/usr/bin/env bash
set -e
atomsk --create fcc 3.615 Cu -duplicate 10 10 10 output.lmp
`,
    },
    expectedOutputs: ['output.lmp'],
  }
}

export async function main() {
  const args = parseArgs(process.argv.slice(2))
  const packetPath = args.packet
    ? resolve(process.cwd(), args.packet)
    : resolve(process.cwd(), '.lammps-project', 'wf01.packet.json')
  const packet = JSON.parse(await readFile(packetPath, 'utf8'))
  const runId = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
  const outputDir = args.outputDir
    ? resolve(process.cwd(), args.outputDir)
    : resolve(process.cwd(), '.lammps-project', 'modeling', runId)
  await mkdir(outputDir, { recursive: true })
  const rendered = renderFromPacket(packet)
  for (const [name, content] of Object.entries(rendered.files)) {
    await writeFile(resolve(outputDir, name), content, 'utf8')
  }
  const manifest = {
    run_id: runId,
    packet: packetPath,
    route: packet.primary_route,
    source_type: 'atomsk',
    output_dir: outputDir,
    generated_files: Object.keys(rendered.files).map(name => resolve(outputDir, name)),
    expected_outputs: rendered.expectedOutputs,
    primary_script: resolve(outputDir, rendered.scriptName),
    element_type_map: packet.element_type_map ?? null,
    box_mode: packet.primary_route === 'atomsk-cif-conversion' ? 'needs-validation' : 'unknown-before-validation',
    notes_for_wf02: packet.handoff_to_wf02?.notes ?? '',
  }
  await writeFile(resolve(outputDir, 'render.manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`)
}

if (import.meta.main) {
  await main()
}
