#!/usr/bin/env bun

import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join, resolve } from 'path'

type Args = Record<string, string>

function parseArgs(argv: string[]): Args {
  const result: Args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }
    result[key] = value
    i += 1
  }
  return result
}

function usage(): never {
  throw new Error(
    'Usage: bun run scripts/lammps-paper-note-init.ts --slug <slug> --title <title> --doi <doi> --year <year> --topic <topic> --source <source> --evidence <evidence> --case <case path> [--material <material>] [--potential <potential>] [--why <text>] [--writeback <path>]',
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const required = ['slug', 'title', 'doi', 'year', 'topic', 'source', 'evidence', 'case']
  for (const key of required) {
    if (!args[key]) usage()
  }

  const root = resolve(process.cwd(), 'knowledge', 'papers')
  const notePath = resolve(root, 'notes', `${args.slug}.md`)
  const caseLinkPath = resolve(root, 'case-paper-links.md')
  const note = `# ${args.title}

- status: verified
- topic: ${args.topic}
- material system: ${args.material ?? ''}
- potential family: ${args.potential ?? ''}
- source: ${args.source}
- doi/arxiv: ${args.doi}
- year: ${args.year}
- evidence level: ${args.evidence}
- pdf/full-text source: 
- pages/sections read: 

## Verification

- metadata verified by: 
- doi verified: yes
- full text checked: 
- notes quality: 

## Why It Matters

- ${args.why ?? ''}

## Paper Summary

- problem addressed: 
- method / setup: 
- main results: 
- strongest directly usable evidence: 

## Useful Findings

- 

## Direct Evidence Snippets

- page/section: 
- claim: 
- why it matters: 

## Reusable For LAMMPS Workflow

- modeling: 
- potential selection: 
- input design: 
- analysis: 

## Limits / Cautions

- 

## Local Follow-up

- related case: 
- related rule: 
- related memory: 
`
  await mkdir(dirname(notePath), { recursive: true })
  await writeFile(notePath, note, 'utf8')

  let existing = '# Case Paper Links\n\n| Case | Paper Note | Status | Notes |\n|---|---|---|---|\n'
  try {
    existing = await readFile(caseLinkPath, 'utf8')
  } catch {}

  const row = `| \`${args.case}\` | \`knowledge/papers/notes/${args.slug}.md\` | linked | ${args.title} |\n`
  const updated = existing.includes(row) ? existing : `${existing}${row}`
  await writeFile(caseLinkPath, updated, 'utf8')
  process.stdout.write(`${notePath}\n`)
}

await main()
