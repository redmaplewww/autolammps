#!/usr/bin/env bun
/**
 * Basic project health check.
 * Verifies that project structure and critical dependencies are intact.
 */
import { existsSync } from 'node:fs'

let ok = true

const checks: [string, () => boolean][] = [
  ['package.json', () => existsSync('package.json')],
  ['tsconfig.json', () => existsSync('tsconfig.json')],
  ['build.ts', () => existsSync('build.ts')],
  ['vite.config.ts', () => existsSync('vite.config.ts')],
  ['src/entrypoints/cli.tsx', () => existsSync('src/entrypoints/cli.tsx')],
  ['node_modules', () => existsSync('node_modules')],
]

for (const [label, check] of checks) {
  const pass = check()
  const status = pass ? '✓' : '✗'
  console.log(`  ${status} ${label}`)
  if (!pass) ok = false
}

console.log(ok ? '\nHealth check passed.' : '\nHealth check FAILED.')
process.exit(ok ? 0 : 1)
