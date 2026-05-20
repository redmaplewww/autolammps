// @ts-nocheck

type TestCase = {
  name: string
  query: string
  mustInclude: string[]
}

const CASES: TestCase[] = [
  {
    name: 'syntax evidence-first',
    query: 'Cu 单轴压缩案例里，应变和应力变量是怎么定义的？',
    mustInclude: ['结论：', 'strainx', 'work/cases/cu-compress-demo/in.cu_compress.lmp'],
  },
  {
    name: 'workflow checklist-first',
    query: '为什么纳米晶金属研究必须把晶粒尺寸当成一等扫描变量？',
    mustInclude: ['结论：晶粒尺寸必须作为一等扫描变量。', 'grain-boundary-mediated'],
  },
]

async function runCase(testCase: TestCase) {
  const proc = Bun.spawn(
    [process.execPath, 'run', 'scripts/lammps-lookup.ts', testCase.query],
    { stdout: 'pipe', stderr: 'pipe' },
  )
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  const ok =
    exitCode === 0 && testCase.mustInclude.every(fragment => stdout.includes(fragment))
  return {
    name: testCase.name,
    ok,
    details: ok ? 'ok' : `${stdout}\n${stderr}`,
  }
}

async function main() {
  const results = await Promise.all(CASES.map(runCase))
  let failed = 0
  for (const result of results) {
    process.stdout.write(
      `${result.ok ? '[PASS]' : '[FAIL]'} ${result.name} ${result.details}\n`,
    )
    if (!result.ok) failed += 1
  }
  if (failed > 0) process.exit(1)
}

await main()
