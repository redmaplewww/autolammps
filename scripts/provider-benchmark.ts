#!/usr/bin/env bun
// @ts-nocheck
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const PROVIDERS = [
  {
    id: 'minimax',
    label: 'MiniMax-M2.6 (已测10题)',
    env: {
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_BASE_URL: '',
      OPENAI_API_KEY: '',
      OPENAI_BASE_URL: 'https://api.minimaxi.com/v1',
      OPENAI_MODEL: 'MiniMax-M2.6',
    },
    modelType: 'openai',
    model: 'MiniMax-M2.6',
    skip: true,
  },
  {
    id: 'baidu-bailian',
    label: '百炼 qwen3.6-plus (API Key无效-401)',
    env: {
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_BASE_URL:
        'https://token-plan.cn-beijing.maas.aliyuncs.com/apps/anthropic',
      OPENAI_API_KEY: '',
      OPENAI_BASE_URL: '',
      OPENAI_MODEL: '',
    },
    modelType: 'anthropic',
    model: 'qwen3.6-plus',
    skip: true,
  },
  {
    id: 'zhipu-5.1',
    label: '智谱 glm-5.1',
    env: {
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_BASE_URL: 'https://open.bigmodel.cn/api/anthropic',
      OPENAI_API_KEY: '',
      OPENAI_BASE_URL: '',
      OPENAI_MODEL: '',
    },
    modelType: 'anthropic',
    model: 'glm-5.1',
    skip: false,
  },
  {
    id: 'zhipu-5turbo',
    label: '智谱 glm-5-turbo',
    env: {
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_BASE_URL: 'https://open.bigmodel.cn/api/anthropic',
      OPENAI_API_KEY: '',
      OPENAI_BASE_URL: '',
      OPENAI_MODEL: '',
    },
    modelType: 'anthropic',
    model: 'glm-5-turbo',
    skip: false,
  },
  {
    id: 'deepseek',
    label: 'DeepSeek deepseek-v4-flush',
    env: {
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_BASE_URL: 'https://api.deepseek.com/anthropic',
      OPENAI_API_KEY: '',
      OPENAI_BASE_URL: '',
      OPENAI_MODEL: '',
    },
    modelType: 'anthropic',
    model: 'deepseek-v4-flush',
    skip: false,
  },
]

const SAMPLES = [
  {
    id: 'KB01',
    prompt:
      '为什么工程应变不能直接用 variable L0 equal lx 动态计算？请给出本地知识库依据。',
    expect: /CL-007|冻结|freeze|立即求值|动态.*L0|L0.*equal|lx.*动态/i,
  },
  {
    id: 'KB02',
    prompt:
      'fix deform 控制 x 拉伸时，fix npt 能不能同时控制 x 压力？为什么？请引用本地规则。',
    expect: /CL-011|同一维度|冲突|不能|barostat|同时/i,
  },
  {
    id: 'KB03',
    prompt:
      'NPT 平衡后切换到 fix deform 之前，知识库建议检查哪些 thermo 量来确认平衡稳定？',
    expect: /温度|压力|盒长|体积|稳定|thermo/i,
  },
  {
    id: 'KB04',
    prompt:
      '模型里有固定原子组时，为什么不能直接 velocity all create？风险是什么？',
    expect: /固定原子|velocity all|mobile|动量|约束|非物理/i,
  },
  {
    id: 'KB05',
    prompt:
      'delete_atoms overlap 为什么不能在敏感结构上用 all all 宽泛删除？本地经验怎么说？',
    expect: /delete_atoms|overlap|all all|阈值|敏感|宽泛|误删/i,
  },
  {
    id: 'KB06',
    prompt:
      '为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。',
    expect: /acceptance|验收|run.*成功|输出检查|不能.*成功/i,
  },
  {
    id: 'KB07',
    prompt:
      '从 restart 或 data 文件继续运行前，为什么必须核对来源、生成时间和盒子尺寸？',
    expect: /restart|data|来源|generation|盒子|provenance|一致性/i,
  },
  {
    id: 'KB08',
    prompt:
      '高风险 LAMMPS 输入文件在开写前为什么要先搜索本地案例而不是凭记忆写？',
    expect: /案例|case|模板|高风险|复用|规则|凭记忆/i,
  },
  {
    id: 'KB09',
    prompt:
      'NiC 球形沉积迁移时 deposit_re_lo 和 deposit_re_up 能直接复制吗？为什么？',
    expect: /deposit_re_lo|deposit_re_up|重算|bound|不能.*复制/i,
  },
  {
    id: 'KB10',
    prompt:
      '迁移沉积案例时，除了重算 deposit_re_lo 和 deposit_re_up，还要额外检查哪一个 mobile 区域假设？',
    expect: /mobile_lo|surface|mobile.*lo|mobile.*up|边界|假设/i,
  },
  {
    id: 'KB11',
    prompt:
      'ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。',
    expect: /ReaxFF|qeq|电荷|charge.*平衡|fix qeq/i,
  },
  {
    id: 'KB12',
    prompt:
      '为什么 ReaxFF 的 pair_coeff 元素顺序必须和 data 文件 atom type 顺序一致？',
    expect: /pair_coeff|atom type|顺序|mapping|映射|元素.*顺序/i,
  },
  {
    id: 'KB13',
    prompt:
      'Cu FCC 单晶压缩在本地知识库里优先推荐什么势函数和 pair_style？请给出本地案例依据。',
    expect: /Mishin|eam|Cu_mishin|eam\/alloy|mishin/i,
  },
  {
    id: 'KB14',
    prompt: '什么时候本地知识库会倾向用 MEAM，而不是简单 EAM？',
    expect: /MEAM|多元|alloy|方向性|eam/i,
  },
  {
    id: 'KB15',
    prompt:
      '反应沉积、氧化、腐蚀这类问题在本地知识库里通常对应哪类势函数家族？',
    expect: /ReaxFF|反应|reactive|氧化|腐蚀/i,
  },
  {
    id: 'KB16',
    prompt: 'SiC 或类似共价体系在本地知识库里通常先查哪类势函数？',
    expect: /Tersoff|SiC|共价|势函数/i,
  },
  {
    id: 'KB17',
    prompt: '做势函数推荐时，MVP 规则要求至少给出什么本地证据？',
    expect: /MVP|本地.*证据|case|knowledge|案例|规则/i,
  },
  {
    id: 'KB18',
    prompt: '审查 force field 映射时，知识库的 checklist 要核对哪几项？',
    expect: /pair_coeff|atom_style|atom type|mapping|元素|势函数/i,
  },
  {
    id: 'KB19',
    prompt:
      'Ni 基合金拉伸问题从案例库检索时，应该先看哪个 case family？给出路径依据。',
    expect: /Ni|tensile|拉伸|Ni基|family|case.*family/i,
  },
  {
    id: 'KB20',
    prompt: '高熵合金熔化凝固问题从案例库检索时，应该先看哪个 case family？',
    expect: /HEA|高熵|melt|solidify|family|熔化|凝固/i,
  },
  {
    id: 'KB21',
    prompt: 'fix nvt 的标准语法是什么？请引用本地手册路径。',
    expect: /fix.*nvt|temp Tstart Tstop Tdamp|nvt temp/i,
  },
  {
    id: 'KB22',
    prompt: 'fix deform 的标准语法是什么？请引用本地手册路径。',
    expect: /fix.*deform|deform.*erate|deform.*final|deform N/i,
  },
  {
    id: 'KB23',
    prompt: '压缩时 erate 的正负号怎么判定？请给出知识库中的说法。',
    expect: /erate|压缩.*负|负.*erate|应变率.*压缩/i,
  },
  {
    id: 'KB24',
    prompt: '固体压缩或拉伸时为什么常用 remap x？它和 remap v 的区别是什么？',
    expect: /remap x|remap v|固体|仿射|变形/i,
  },
  {
    id: 'KB25',
    prompt: 'Tdamp 在 metal 单位下通常怎么按 timestep 选取？',
    expect: /Tdamp|timestep|100|时间步|阻尼/i,
  },
  {
    id: 'KB26',
    prompt: 'read_restart 和 read_data 的继续运行前检查重点有哪些？',
    expect: /read_restart|read_data|来源|盒子|一致性|检查/i,
  },
  {
    id: 'KB27',
    prompt: 'pair_coeff 在知识库里的审查重点是什么？',
    expect: /pair_coeff|元素.*顺序|atom type|mapping|映射/i,
  },
  {
    id: 'KB28',
    prompt:
      'metal 单位下把 pxx 转成 GPa 的常见换算写法是什么？请给本地案例依据。',
    expect: /-pxx.*10000|GPa|bar.*GPa|pxx.*10000/i,
  },
  {
    id: 'KB29',
    prompt: 'Cu 单轴压缩案例里，应变和应力变量是怎么定义的？',
    expect: /strainx|stressx|应变|应力|冻结|initial/i,
  },
  {
    id: 'KB30',
    prompt:
      'fix print 输出应变时，为什么容易把冻结长度规则写错？知识库里怎么提醒？',
    expect: /fix print|冻结|长度|立即求值|动态|变量/i,
  },
  {
    id: 'KB31',
    prompt: 'Cu FCC 压缩问题从案例库检索时，最佳匹配族是什么？请给出路径依据。',
    expect: /cu.*compress|compression|压缩.*family|family.*compress/i,
  },
  {
    id: 'KB32',
    prompt: '拉伸问题从案例库检索时应该先看哪个 family？',
    expect: /tensile|deformation|family|拉伸/i,
  },
  {
    id: 'KB33',
    prompt: '剪切模量或 TiAlNb 剪切问题应该先检索哪个 family？',
    expect: /shear|剪切|TiAlNb|family/i,
  },
  {
    id: 'KB34',
    prompt: 'NiC、GaN 氧化、金沉积、腐蚀这类问题应该先检索哪个 family？',
    expect: /reactive|deposition|oxidation|腐蚀|NiC|GaN/i,
  },
  {
    id: 'KB35',
    prompt: '磨削、摩擦、界面类问题在案例库里应该先检索哪个 family？',
    expect: /friction|磨削|interface|界面|machining/i,
  },
  {
    id: 'KB36',
    prompt: 'shock、PKA 级联、TTM 这类问题应该先检索哪个 family？',
    expect: /shock|PKA|cascade|TTM|冲击|辐照/i,
  },
  {
    id: 'KB37',
    prompt: 'NiPt、NiTi、B2 相、偏聚相关问题应该先检索哪个 family？',
    expect: /NiPt|NiTi|B2|偏聚|segregation|相稳定/i,
  },
  {
    id: 'KB38',
    prompt: '知识库建议的案例检索顺序是什么？请按步骤回答。',
    expect: /1\.|2\.|3\.|顺序|步骤|index|family|检索/i,
  },
  {
    id: 'KB39',
    prompt: 'raw cases 应该被当成最终正确模板吗？知识库怎么界定它们？',
    expect: /raw.*case|候选|模板.*不是|不能.*模板/i,
  },
  {
    id: 'KB40',
    prompt:
      '检索时更应该先查 raw cases 还是只看 index 概述？知识库推荐流程是什么？',
    expect: /index|family|先.*index|概览|先.*family|检索流程/i,
  },
  {
    id: 'KB41',
    prompt: '金属双晶或晶界拉伸时，为什么横向边界条件必须被当成首要变量？',
    expect: /晶界|横向.*边界|boundary|首要|约束/i,
  },
  {
    id: 'KB42',
    prompt: '为什么纳米晶金属研究必须把晶粒尺寸当成一等扫描变量？',
    expect: /纳米晶|晶粒尺寸|grain size|扫描|变形机制/i,
  },
  {
    id: 'KB43',
    prompt: '增材制造金属拉伸为什么不能只用一个泛化多晶模型替代？',
    expect: /增材|additive|多晶|工艺|缺陷|纹理/i,
  },
  {
    id: 'KB44',
    prompt: '金属晶界研究为什么不能只记录 Sigma 值？还应记录哪些边界描述符？',
    expect: /Sigma|取向轴|倾转|晶界|描述符|boundary/i,
  },
  {
    id: 'KB45',
    prompt: 'Ni 基高温合金分析为什么不能只看基体？知识库强调哪几层因素？',
    expect: /Ni.*基|析出相|界面|组元|多尺度|基体/i,
  },
  {
    id: 'KB46',
    prompt: '为什么不能用一个代表性的 HEA 成分去泛化整个 HEA 类别？',
    expect: /HEA|高熵|成分|相稳定|敏感.*成分/i,
  },
  {
    id: 'KB47',
    prompt:
      '纯金属机理迁移为什么要先区分 FCC、BCC、HCP，而不是都按 generic metal 处理？',
    expect: /FCC|BCC|HCP|晶体结构|缺陷|变形机制|generic/i,
  },
  {
    id: 'KB48',
    prompt: '辐照、扩散、偏聚问题的证据组织链条应该是什么？',
    expect: /结构|缺陷|动力学|扩散|机制|辐照|证据链/i,
  },
  {
    id: 'KB49',
    prompt: '金属切削分析为什么不能只看切削力和切屑？知识库要求补哪些输出？',
    expect: /切削力|切屑|缺陷|温度|应力|结构演化/i,
  },
  {
    id: 'KB50',
    prompt:
      '表面加工或纳米压痕分析为什么不能只看形貌？还必须配合哪些缺陷分析？',
    expect: /形貌|压痕|位错|相变|OVITO|缺陷分析/i,
  },
]

async function switchProvider(prov) {
  const cfg = {
    env: prov.env,
    modelType: prov.modelType,
    model: prov.model,
    skipDangerousModePermissionPrompt: true,
  }
  const targetFile = join(process.cwd(), '.angsheng/settings.json')
  await writeFile(targetFile, JSON.stringify(cfg, null, 2), 'utf8')
}

async function runCli(prompt, timeoutMs = 120000) {
  return new Promise(resolve => {
    const cmd = [
      process.execPath,
      'run',
      'src/entrypoints/cli.tsx',
      '-p',
      '--dangerously-skip-permissions',
      '--max-turns',
      '8',
      '--output-format',
      'json',
      '--agent',
      'lammps-case-librarian',
      prompt,
    ]
    const proc = Bun.spawn(cmd, {
      cwd: process.cwd(),
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env,
    })
    const timer = setTimeout(() => {
      proc.kill()
    }, timeoutMs)
    Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]).then(([stdout, stderr, exitCode]) => {
      clearTimeout(timer)
      resolve({ stdout, stderr, exitCode, timedOut: exitCode === undefined })
    })
  })
}

async function main() {
  const results = {}
  const reportDir = join(process.cwd(), 'docs', 'tests')
  await mkdir(reportDir, { recursive: true })
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  for (const prov of PROVIDERS) {
    if (prov.skip) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`Skipping: ${prov.label}`)
      console.log(`${'='.repeat(60)}`)
      continue
    }
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${prov.label}`)
    console.log(`${'='.repeat(60)}`)
    await switchProvider(prov)

    const provResults = []
    for (const sample of SAMPLES) {
      process.stdout.write(`  ${sample.id}... `)
      const { stdout, stderr, exitCode, timedOut } = await runCli(sample.prompt)
      const text = stdout + stderr
      const hasAnswer = stdout.trim().length > 0
      const primaryHit = sample.expect.test(text)
      const hasCitation =
        /knowledge\/|work\/cases\/|CL-\d+|\.md|log\.lammps|in\.\w+\.lmp/.test(
          text,
        )
      let score = 0
      if (hasAnswer) score += 1
      if (hasCitation) score += 1
      if (primaryHit) score += 1
      if (timedOut) score = 0

      provResults.push({
        id: sample.id,
        prompt: sample.prompt,
        score,
        max: 3,
        hasAnswer,
        primaryHit,
        hasCitation,
        timedOut,
        exitCode,
      })
      console.log(
        `${primaryHit ? '✅' : '❌'} score=${score}/3 ${timedOut ? '(timeout)' : ''} ${exitCode !== 0 ? `(exit ${exitCode})` : ''}`,
      )
    }

    const total = provResults.reduce((s, r) => s + r.score, 0)
    const max = provResults.length * 3
    results[prov.id] = {
      label: prov.label,
      results: provResults,
      total,
      max,
      percent: ((total / max) * 100).toFixed(1),
    }
    console.log(`\n  TOTAL: ${total}/${max} (${results[prov.id].percent}%)\n`)
  }

  const prevResults = {
    minimax: {
      label: 'MiniMax-M2.6 (已测10题)',
      total: 7,
      max: 30,
      percent: '23.3',
      note: '基于10题抽样测试结果 (provider-benchmark-20260425.json)',
    },
  }

  const allProviders = [
    ...PROVIDERS.filter(p => !p.skip).map(p => ({
      id: p.id,
      label: p.label,
      results: results[p.id],
    })),
    ...Object.entries(prevResults).map(([id, r]) => ({
      id,
      label: r.label,
      results: r,
    })),
  ]

  const rows = allProviders
    .map(prov => {
      const r = prov.results
      return `| ${r.label} | ${r.total}/${r.max} | ${r.percent}% |`
    })
    .join('\n')

  const detailRows = SAMPLES.map(s => {
    const cols = [s.id]
    for (const prov of allProviders) {
      const r = prov.results.results?.find(x => x.id === s.id)
      cols.push(r ? `${r.score}/3 ${r.primaryHit ? '✅' : '❌'}` : '-')
    }
    return `| ${cols.join(' | ')} |`
  }).join('\n')

  const providerCols = allProviders.map(p => p.label).join(' | ')
  const divCols = allProviders.map(() => '---').join(' | ')

  const report = `# Provider Benchmark 对比报告

- 时间: ${new Date().toISOString()}
- 引擎: CLI agent loop (lammps-case-librarian, max-turns=8)
- 题目数: ${SAMPLES.length}（knowledge-capture-50 完整版）

## 总分

| Provider | 分数 | 百分比 |
| --- | --- | --- |
${rows}

## 逐题对比

| 题号 | ${providerCols} |
| --- | ${divCols} |
${detailRows}

## 结论

${allProviders
  .sort((a, b) => b.results.total - a.results.total)
  .map(
    (prov, i) =>
      `${i + 1}. **${prov.label}**: ${prov.results.total}/${prov.results.max} (${prov.results.percent}%)`,
  )
  .join('\n')}
`

  await writeFile(
    join(reportDir, `provider-benchmark-${dateStr}.md`),
    report,
    'utf8',
  )
  await writeFile(
    join(reportDir, `provider-benchmark-${dateStr}.json`),
    JSON.stringify({ ...results, ...prevResults }, null, 2),
    'utf8',
  )
  console.log(`\n报告: docs/tests/provider-benchmark-${dateStr}.md`)
  console.log(`JSON:  docs/tests/provider-benchmark-${dateStr}.json`)
}

main()
