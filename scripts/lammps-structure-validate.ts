#!/usr/bin/env bun
// @ts-nocheck
import { access, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Args = { file?: string; manifest?: string; output?: string }

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`)
    const key = arg.slice(2)
    if (key === 'file') args.file = value
    else if (key === 'manifest') args.manifest = value
    else if (key === 'output') args.output = value
    i += 1
  }
  return args
}

async function exists(path: string) {
  try { await access(path); return true } catch { return false }
}

function validateLammpsData(text: string, manifest?: Record<string, unknown>) {
  const lines = text.split(/\r?\n/)
  const result: Record<string, unknown> = {
    format: 'lammps-data',
    atoms_declared: null,
    atom_types_declared: null,
    masses_section: false,
    atoms_section: false,
    x_bounds: null,
    y_bounds: null,
    z_bounds: null,
    issues: [] as string[],
    checks: [] as string[],
    advisory: [] as string[],
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^\d+\s+atoms$/i.test(trimmed)) result.atoms_declared = Number(trimmed.split(/\s+/)[0])
    if (/^\d+\s+atom types$/i.test(trimmed)) result.atom_types_declared = Number(trimmed.split(/\s+/)[0])
    if (/xlo xhi/i.test(trimmed)) result.x_bounds = trimmed
    if (/ylo yhi/i.test(trimmed)) result.y_bounds = trimmed
    if (/zlo zhi/i.test(trimmed)) result.z_bounds = trimmed
    if (/^Masses$/i.test(trimmed)) result.masses_section = true
    if (/^Atoms(?:\s+#.*)?$/i.test(trimmed)) result.atoms_section = true
  }

  if (!result.atoms_declared) (result.issues as string[]).push('No atom count declared.')
  else (result.checks as string[]).push('Atom count declaration found.')
  if (!result.atom_types_declared) (result.issues as string[]).push('No atom type count declared.')
  else (result.checks as string[]).push('Atom type count declaration found.')
  if (!result.masses_section) (result.issues as string[]).push('Masses section missing.')
  else (result.checks as string[]).push('Masses section found.')
  if (!result.atoms_section) (result.issues as string[]).push('Atoms section missing.')
  else (result.checks as string[]).push('Atoms section found.')
  if (!result.x_bounds || !result.y_bounds || !result.z_bounds) {
    (result.issues as string[]).push('Box bounds incomplete.')
  } else {
    (result.checks as string[]).push('Box bounds found for x/y/z.')
  }

  if (manifest) {
    if (!manifest.source_type && !manifest.route) {
      (result.advisory as string[]).push('Structure provenance is not recorded in the manifest.')
    } else {
      (result.checks as string[]).push('Structure provenance recorded in manifest.')
    }
    if (!manifest.element_type_map) {
      (result.advisory as string[]).push('Element/type mapping is not explicitly recorded in the manifest.')
    }
    if (!manifest.box_mode) {
      (result.advisory as string[]).push('Box mode (orthogonal/triclinic) is not explicitly recorded in the manifest.')
    }
  }

  result.ok = (result.issues as string[]).length === 0
  return result
}

export async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.file) throw new Error('Usage: bun run scripts/lammps-structure-validate.ts --file <structure.lmp|data> [--manifest <structure.manifest.json>]')
  const filePath = resolve(process.cwd(), args.file)
  if (!(await exists(filePath))) throw new Error(`Structure file not found: ${filePath}`)
  const text = await readFile(filePath, 'utf8')
  let manifest: Record<string, unknown> | undefined
  if (args.manifest) {
    const manifestPath = resolve(process.cwd(), args.manifest)
    if (await exists(manifestPath)) {
      manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    }
  }
  const result = validateLammpsData(text, manifest)
  const outputPath = args.output
    ? resolve(process.cwd(), args.output)
    : resolve(process.cwd(), '.lammps-project', 'structure-validation.json')
  const payload = { file: filePath, manifest: args.manifest ?? null, ...result }
  await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8')
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
}

if (import.meta.main) {
  await main()
}
