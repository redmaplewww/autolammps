// @ts-nocheck
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function clampStart(value: number) {
  return value < 0 ? 0 : value
}

function window(lines: string[], center: number, radius: number) {
  const start = clampStart(center - radius)
  const end = Math.min(lines.length, center + radius + 1)
  return lines.slice(start, end).map((line, idx) => `${start + idx + 1}: ${line}`)
}

async function main() {
  const fileArg = process.argv[2]
  if (!fileArg) {
    console.error('Usage: bun run scripts/lammps-log-sections.ts <log-file>')
    process.exit(1)
  }

  const path = resolve(process.cwd(), fileArg)
  const content = await readFile(path, 'utf8')
  const lines = content.split(/\r?\n/)

  const errorPatterns = [/ERROR/i, /WARNING/i, /Lost atoms/i, /Bond atoms missing/i, /Non-numeric/i, /qeq/i]
  const thermoHeader = /^\s*Step\s+/i
  const hits = []
  const thermoHits = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (errorPatterns.some(p => p.test(line))) {
      hits.push(i)
    }
    if (thermoHeader.test(line)) {
      thermoHits.push(i)
    }
  }

  const head = lines.slice(0, Math.min(100, lines.length)).map((line, idx) => `${idx + 1}: ${line}`)
  const tailStart = Math.max(0, lines.length - 150)
  const tail = lines.slice(tailStart).map((line, idx) => `${tailStart + idx + 1}: ${line}`)

  console.log('=== HEAD ===')
  console.log(head.join('\n'))
  console.log('\n=== ERROR/WARNING WINDOWS ===')
  if (hits.length === 0) {
    console.log('(none)')
  } else {
    for (const hit of hits.slice(0, 12)) {
      console.log(`--- around line ${hit + 1} ---`)
      console.log(window(lines, hit, 6).join('\n'))
    }
  }
  console.log('\n=== THERMO WINDOWS ===')
  if (thermoHits.length === 0) {
    console.log('(none)')
  } else {
    for (const hit of thermoHits.slice(0, 6)) {
      console.log(`--- around line ${hit + 1} ---`)
      console.log(window(lines, hit + 2, 6).join('\n'))
    }
  }
  console.log('\n=== TAIL ===')
  console.log(tail.join('\n'))
}

await main()

export {}
