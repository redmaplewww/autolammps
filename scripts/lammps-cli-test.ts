// @ts-nocheck
export {}

import { HELP_TEXT, isSubcommand, routePrompt } from '../src/entrypoints/lammps-cli.ts'

type TestResult = {
  name: string
  ok: boolean
  details: string
}

async function testHelpText(): Promise<TestResult> {
  const ok =
    HELP_TEXT.includes('LAMMPS CLI wrapper') &&
    HELP_TEXT.includes('model') &&
    HELP_TEXT.includes('execute') &&
    HELP_TEXT.includes('repair') &&
    HELP_TEXT.includes('loop') &&
    HELP_TEXT.includes('summarize-error')
  return {
    name: 'help-text',
    ok,
    details: ok ? 'wrapper help 文本正常' : 'missing execute/repair help text',
  }
}

async function testRouteMap(): Promise<TestResult> {
  const ok =
    isSubcommand('build') &&
    isSubcommand('execute') &&
    isSubcommand('repair') &&
    routePrompt('lost atoms in log.lammps') === 'lammps-analyst' &&
    routePrompt('pair_coeff mapping meam') === 'lammps-case-librarian'
  return {
    name: 'route-map',
    ok,
    details: ok ? '子命令和路由函数正常' : 'subcommand or route classification mismatch',
  }
}

async function testLookupSynthesis(): Promise<TestResult> {
  const proc = Bun.spawn(
    [
      process.execPath,
      'run',
      'scripts/lammps-lookup.ts',
      'Cu 单轴压缩案例里，应变和应力变量是怎么定义的？',
    ],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )
  const [output, error, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  const ok =
    exitCode === 0 &&
    output.includes('结论：') &&
    output.includes('strainx') &&
    output.includes('work/cases/cu-compress-demo/in.cu_compress.lmp')
  return {
    name: 'lookup-synthesis',
    ok,
    details: ok ? 'lookup 直出证据化回答正常' : `${output}\n${error}`,
  }
}

async function testExecuteDryRun(): Promise<TestResult> {
  const mod = await import('./lammps-execute.ts')
  const originalArgv = process.argv.slice()
  let output = ''
  const originalWrite = process.stdout.write.bind(process.stdout)
  process.argv = [
    originalArgv[0],
    originalArgv[1],
    '--input',
    'knowledge/cases/raw/TiAl/TIAL.in',
  ]
  process.stdout.write = ((chunk: any) => {
    output += String(chunk)
    return true
  }) as any
  try {
    await mod.main()
  } finally {
    process.argv = originalArgv
    process.stdout.write = originalWrite as any
  }
  const ok = output.includes('dry_run') && output.includes('executable_available')
  return {
    name: 'execute-dry-run',
    ok,
    details: ok ? '执行器 dry-run 输出正常' : output,
  }
}

async function testRepairPacket(): Promise<TestResult> {
  const mod = await import('./lammps-auto-repair.ts')
  const originalArgv = process.argv.slice()
  let output = ''
  const originalWrite = process.stdout.write.bind(process.stdout)
  process.argv = [originalArgv[0], originalArgv[1]]
  process.stdout.write = ((chunk: any) => {
    output += String(chunk)
    return true
  }) as any
  try {
    await mod.main()
  } finally {
    process.argv = originalArgv
    process.stdout.write = originalWrite as any
  }
  const ok = output.includes('required_next_actor') && output.includes('status')
  return {
    name: 'repair-packet',
    ok,
    details: ok ? '自动修复首轮分类输出正常' : output,
  }
}

async function testRepairLoop(): Promise<TestResult> {
  const mod = await import('./lammps-repair-loop.ts')
  const originalArgv = process.argv.slice()
  let output = ''
  const originalWrite = process.stdout.write.bind(process.stdout)
  process.argv = [originalArgv[0], originalArgv[1]]
  process.stdout.write = ((chunk: any) => {
    output += String(chunk)
    return true
  }) as any
  try {
    await mod.main()
  } finally {
    process.argv = originalArgv
    process.stdout.write = originalWrite as any
  }
  const ok = output.includes('selected_actor') && output.includes('bounded_task_prompt')
  return {
    name: 'repair-loop',
    ok,
    details: ok ? '自动修复下一步 handoff 输出正常' : output,
  }
}

async function testErrorSummary(): Promise<TestResult> {
  const mod = await import('./lammps-error-summary.ts')
  const originalArgv = process.argv.slice()
  let output = ''
  const originalWrite = process.stdout.write.bind(process.stdout)
  process.argv = [originalArgv[0], originalArgv[1], '--summary-only']
  process.stdout.write = ((chunk: any) => {
    output += String(chunk)
    return true
  }) as any
  try {
    await mod.main()
  } finally {
    process.argv = originalArgv
    process.stdout.write = originalWrite as any
  }
  const ok = output.includes('rollback_target') && output.includes('selected_actor')
  return {
    name: 'error-summary',
    ok,
    details: ok ? '错误摘要输出正常' : output,
  }
}

async function testModelRoute(): Promise<TestResult> {
  const mod = await import('./lammps-model-route.ts')
  const originalArgv = process.argv.slice()
  let output = ''
  const originalWrite = process.stdout.write.bind(process.stdout)
  process.argv = [
    originalArgv[0],
    originalArgv[1],
    '--prompt',
    'build a polycrystal Ti-Al structure from CIF',
    '--cif',
    'structure.cif',
  ]
  process.stdout.write = ((chunk: any) => {
    output += String(chunk)
    return true
  }) as any
  try {
    await mod.main()
  } finally {
    process.argv = originalArgv
    process.stdout.write = originalWrite as any
  }
  const ok = output.includes('atomsk-cif-conversion') && output.includes('primary_route') && output.includes('atomsk_plan')
  return {
    name: 'model-route',
    ok,
    details: ok ? '建模路由输出正常' : output,
  }
}

async function testModelRunDryRun(): Promise<TestResult> {
  const mod = await import('./lammps-model-execute.ts')
  const originalArgv = process.argv.slice()
  let output = ''
  const originalWrite = process.stdout.write.bind(process.stdout)
  process.argv = [
    originalArgv[0],
    originalArgv[1],
    '--script',
    '.angsheng/templates/atomsk/cif_to_lammps.sh',
  ]
  process.stdout.write = ((chunk: any) => {
    output += String(chunk)
    return true
  }) as any
  try {
    await mod.main()
  } finally {
    process.argv = originalArgv
    process.stdout.write = originalWrite as any
  }
  const ok = output.includes('dry_run') && output.includes('executable_available')
  return {
    name: 'model-run-dry-run',
    ok,
    details: ok ? '建模执行器 dry-run 输出正常' : output,
  }
}

async function testAtomskRender(): Promise<TestResult> {
  const mod = await import('./lammps-atomsk-render.ts')
  const originalArgv = process.argv.slice()
  let output = ''
  const originalWrite = process.stdout.write.bind(process.stdout)
  process.argv = [originalArgv[0], originalArgv[1]]
  process.stdout.write = ((chunk: any) => {
    output += String(chunk)
    return true
  }) as any
  try {
    await mod.main()
  } finally {
    process.argv = originalArgv
    process.stdout.write = originalWrite as any
  }
  const ok = output.includes('render.manifest.json') || output.includes('expected_outputs')
  return {
    name: 'atomsk-render',
    ok,
    details: ok ? 'Atomsk 任务包渲染正常' : output,
  }
}

async function testStructureValidate(): Promise<TestResult> {
  const mod = await import('./lammps-structure-validate.ts')
  const originalArgv = process.argv.slice()
  let output = ''
  const originalWrite = process.stdout.write.bind(process.stdout)
  process.argv = [
    originalArgv[0],
    originalArgv[1],
    '--file',
    'knowledge/cases/raw/TiAl/Ti_48Al_final.data.lmp',
  ]
  process.stdout.write = ((chunk: any) => {
    output += String(chunk)
    return true
  }) as any
  try {
    await mod.main()
  } finally {
    process.argv = originalArgv
    process.stdout.write = originalWrite as any
  }
  const ok = output.includes('lammps-data') && output.includes('Atom type count declaration found')
  return {
    name: 'structure-validate',
    ok,
    details: ok ? '结构校验输出正常' : output,
  }
}

async function main() {
  const tests = [
    testHelpText,
    testRouteMap,
    testLookupSynthesis,
    testModelRoute,
    testAtomskRender,
    testModelRunDryRun,
    testStructureValidate,
    testExecuteDryRun,
    testRepairPacket,
    testRepairLoop,
    testErrorSummary,
  ]
  const results: TestResult[] = []
  for (const test of tests) {
    results.push(await test())
  }
  const failed = results.filter(r => !r.ok)
  for (const result of results) {
    console.log(`${result.ok ? '[PASS]' : '[FAIL]'} ${result.name}: ${result.details}`)
  }
  if (failed.length > 0) process.exit(1)
}

await main()
