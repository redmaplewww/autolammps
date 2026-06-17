// @ts-nocheck
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { searchKnowledge } from '../src/utils/lammpsKnowledge/search.js'

type CaseDef = {
  id: string
  category: string
  prompt: string
  expectPrimary: RegExp[]
  expectSecondary: RegExp[]
}

type CaseResult = {
  id: string
  category: string
  prompt: string
  score: number
  exitCode: number
  durationMs: number
  citationHit: boolean
  primaryHit: boolean
  secondaryHit: boolean
  note: string
  stdout: string
  stderr: string
}

const CITATION_REGEXES = [
  /knowledge\//i,
  /work\//i,
  /CL-\d+/i,
  /confirmed lesson/i,
  /fix_[a-z0-9_]+\.md/i,
  /case-family-index/i,
]

const CASES: CaseDef[] = [
  {
    id: 'Q01',
    category: '输入规则',
    prompt:
      '为什么工程应变不能直接用 variable L0 equal lx 动态计算？请给出本地知识库依据。',
    expectPrimary: [/CL-007/i, /冻结|freeze|立即求值|dynamic|动态/i],
    expectSecondary: [/\$\{L0\}|\$\{tmpx\}|应变.*为零|zero/i],
  },
  {
    id: 'Q02',
    category: '输入规则',
    prompt:
      'fix deform 控制 x 拉伸时，fix npt 能不能同时控制 x 压力？为什么？请引用本地规则。',
    expectPrimary: [/CL-011|同一维度|冲突|不能/i],
    expectSecondary: [/y.*z|非变形方向|barostat|NVT \+ fix deform/i],
  },
  {
    id: 'Q03',
    category: '输入规则',
    prompt:
      'NPT 平衡后切换到 fix deform 之前，知识库建议检查哪些 thermo 量来确认平衡稳定？',
    expectPrimary: [/CL-012|lx|ly|lz|pressure|压强/i],
    expectSecondary: [/plateau|平台|诊断|checkpoint|thermo/i],
  },
  {
    id: 'Q04',
    category: '输入规则',
    prompt:
      '模型里有固定原子组时，为什么不能直接 velocity all create？风险是什么？',
    expectPrimary: [/CL-003|固定|fixed|mobile|velocity all/i],
    expectSecondary: [/爆炸|catastrophic|安全关键|非确定性|nondeterministic/i],
  },
  {
    id: 'Q05',
    category: '输入规则',
    prompt:
      'delete_atoms overlap 为什么不能在敏感结构上用 all all 宽泛删除？本地经验怎么说？',
    expectPrimary: [/CL-004|delete_atoms overlap|all all|阈值|narrow/i],
    expectSecondary: [/destroy|silent|敏感结构|删除过多/i],
  },
  {
    id: 'Q06',
    category: '输入规则',
    prompt:
      '为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。',
    expectPrimary: [/CL-005|acceptance criteria|成功标准|run completed/i],
    expectSecondary: [/task-specific|显式指标|完成.*不等于成功/i],
  },
  {
    id: 'Q07',
    category: '输入规则',
    prompt:
      '从 restart 或 data 文件继续运行前，为什么必须核对来源、生成时间和盒子尺寸？',
    expectPrimary: [/CL-006|restart|data|来源|generation time|盒子尺寸/i],
    expectSecondary: [/provenance|中间文件|box dimensions/i],
  },
  {
    id: 'Q08',
    category: '输入规则',
    prompt:
      '高风险 LAMMPS 输入文件在开写前为什么要先搜索本地案例而不是凭记忆写？',
    expectPrimary: [/CL-008|本地案例|local examples|template/i],
    expectSecondary: [/高风险|不要.*记忆|from memory/i],
  },
  {
    id: 'Q09',
    category: '输入规则',
    prompt:
      'NiC 球形沉积迁移时 deposit_re_lo 和 deposit_re_up 能直接复制吗？为什么？',
    expectPrimary: [/CL-009|deposit_re_lo|deposit_re_up|重新计算|bound\(mobile,zmax\)/i],
    expectSecondary: [/mobile|zmax|晶格常数|lattice/i],
  },
  {
    id: 'Q10',
    category: '输入规则',
    prompt:
      '迁移沉积案例时，除了重算 deposit_re_lo 和 deposit_re_up，还要额外检查哪一个 mobile 区域假设？',
    expectPrimary: [/mobile_lo|生长面|growing surface|偏移量|offset/i],
    expectSecondary: [/CL-009|top 2|surface atoms|thermostat/i],
  },
  {
    id: 'Q11',
    category: '势函数',
    prompt:
      'ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。',
    expectPrimary: [/CL-001|atom_style charge|qeq\/reaxff|qeq\/shielded/i],
    expectSecondary: [/zero charges|零电荷|ReaxFF.*requires|physically wrong/i],
  },
  {
    id: 'Q12',
    category: '势函数',
    prompt:
      '为什么 ReaxFF 的 pair_coeff 元素顺序必须和 data 文件 atom type 顺序一致？',
    expectPrimary: [/CL-010|pair_coeff|元素顺序|atom type/i],
    expectSecondary: [/silent|物理错误|ffield|Masses/i],
  },
  {
    id: 'Q13',
    category: '势函数',
    prompt:
      'Cu FCC 单晶压缩在本地知识库里优先推荐什么势函数和 pair_style？请给出本地案例依据。',
    expectPrimary: [/Mishin|eam\/alloy|Cu_mishin1\.eam\.alloy|Cu FCC/i],
    expectSecondary: [/cu-compress-demo|potential-selection|本地案例/i],
  },
  {
    id: 'Q14',
    category: '势函数',
    prompt:
      '什么时候本地知识库会倾向用 MEAM，而不是简单 EAM？',
    expectPrimary: [/MEAM|多元|multi-component|directional alloy/i],
    expectSecondary: [/library\.meam|alloy|potential-selection/i],
  },
  {
    id: 'Q15',
    category: '势函数',
    prompt:
      '反应沉积、氧化、腐蚀这类问题在本地知识库里通常对应哪类势函数家族？',
    expectPrimary: [/ReaxFF|reactive|oxidation|corrosion|NiC|GaN/i],
    expectSecondary: [/potential-selection|reactive-and-deposition/i],
  },
  {
    id: 'Q16',
    category: '势函数',
    prompt:
      'SiC 或类似共价体系在本地知识库里通常先查哪类势函数？',
    expectPrimary: [/Tersoff|SiC|covalent|共价/i],
    expectSecondary: [/potential-selection|machining|interface/i],
  },
  {
    id: 'Q17',
    category: '势函数',
    prompt:
      '做势函数推荐时，MVP 规则要求至少给出什么本地证据？',
    expectPrimary: [/本地案例|local case|knowledge\/cases\/raw|knowledge file/i],
    expectSecondary: [/不能.*凭记忆|must not invent|MVP policy/i],
  },
  {
    id: 'Q18',
    category: '势函数',
    prompt:
      '审查 force field 映射时，知识库的 checklist 要核对哪几项？',
    expectPrimary: [/atom_style|pair_style|pair_coeff|closer example|更近案例/i],
    expectSecondary: [/review checklist|potential-selection/i],
  },
  {
    id: 'Q19',
    category: '势函数',
    prompt:
      'Ni 基合金拉伸问题从案例库检索时，应该先看哪个 case family？给出路径依据。',
    expectPrimary: [/tensile-deformation|Ni基合金拉伸|case family/i],
    expectSecondary: [/case-family-index|拉伸|in\.1e9\.lmp/i],
  },
  {
    id: 'Q20',
    category: '势函数',
    prompt:
      '高熵合金熔化凝固问题从案例库检索时，应该先看哪个 case family？',
    expectPrimary: [/melt-solidify|高熵合金|solidify|融化凝固/i],
    expectSecondary: [/case-family-index|EAM|MEAM/i],
  },
  {
    id: 'Q21',
    category: '命令语法',
    prompt: 'fix nvt 的标准语法是什么？请引用本地手册路径。',
    expectPrimary: [/fix .* nvt|temp Tstart Tstop Tdamp|fix_nh\.md|fix nvt/i],
    expectSecondary: [/knowledge\/manuals\/lammps\/fix_nh\.md|语法/i],
  },
  {
    id: 'Q22',
    category: '命令语法',
    prompt: 'fix deform 的标准语法是什么？请引用本地手册路径。',
    expectPrimary: [/fix .* deform|parameter style value|fix_deform\.md|erate|trate|final/i],
    expectSecondary: [/knowledge\/manuals\/lammps\/fix_deform\.md/i],
  },
  {
    id: 'Q23',
    category: '命令语法',
    prompt: '压缩时 erate 的正负号怎么判定？请给出知识库中的说法。',
    expectPrimary: [/负值.*压缩|compression|erate -|negative.*compression/i],
    expectSecondary: [/fix_deform|工程应变率|1\/ps/i],
  },
  {
    id: 'Q24',
    category: '命令语法',
    prompt: '固体压缩或拉伸时为什么常用 remap x？它和 remap v 的区别是什么？',
    expectPrimary: [/remap x|仿射|affine|固体/i],
    expectSecondary: [/remap v|流体|剪切|fix_deform/i],
  },
  {
    id: 'Q25',
    category: '命令语法',
    prompt: 'Tdamp 在 metal 单位下通常怎么按 timestep 选取？',
    expectPrimary: [/100\s*\*\s*dt|0\.1|Tdamp|100 步/i],
    expectSecondary: [/fix_nh|metal/i],
  },
  {
    id: 'Q26',
    category: '命令语法',
    prompt: 'read_restart 和 read_data 的继续运行前检查重点有哪些？',
    expectPrimary: [/read_restart|read_data|来源|box dimensions|generation time/i],
    expectSecondary: [/restart|data provenance|CL-006/i],
  },
  {
    id: 'Q27',
    category: '命令语法',
    prompt: 'pair_coeff 在知识库里的审查重点是什么？',
    expectPrimary: [/pair_coeff|元素顺序|atom type|ffield|映射/i],
    expectSecondary: [/CL-010|Masses/i],
  },
  {
    id: 'Q28',
    category: '命令语法',
    prompt: 'metal 单位下把 pxx 转成 GPa 的常见换算写法是什么？请给本地案例依据。',
    expectPrimary: [/-pxx\/10000|GPa|bar -> GPa/i],
    expectSecondary: [/stressx|stress_strain|cu_compress/i],
  },
  {
    id: 'Q29',
    category: '命令语法',
    prompt: 'Cu 单轴压缩案例里，应变和应力变量是怎么定义的？',
    expectPrimary: [/\(lx - v_Lx0\)\/v_Lx0|strainx|stressx equal .*pxx/i],
    expectSecondary: [/work\/cases\/cu-compress-demo|CL-007/i],
  },
  {
    id: 'Q30',
    category: '命令语法',
    prompt: 'fix print 输出应变时，为什么容易把冻结长度规则写错？知识库里怎么提醒？',
    expectPrimary: [/fix print|CL-007|输出|打印|frozen L0/i],
    expectSecondary: [/中间变量|bare lx|zero strain|v_L0/i],
  },
  {
    id: 'Q31',
    category: '案例检索',
    prompt: 'Cu FCC 压缩问题从案例库检索时，最佳匹配族是什么？请给出路径依据。',
    expectPrimary: [/compression-deformation|压缩/i],
    expectSecondary: [/cu-compress-demo|case-family-index/i],
  },
  {
    id: 'Q32',
    category: '案例检索',
    prompt: '拉伸问题从案例库检索时应该先看哪个 family？',
    expectPrimary: [/tensile-deformation|拉伸/i],
    expectSecondary: [/in\.1e9\.lmp|Ni基合金拉伸|case-family-index/i],
  },
  {
    id: 'Q33',
    category: '案例检索',
    prompt: '剪切模量或 TiAlNb 剪切问题应该先检索哪个 family？',
    expectPrimary: [/shear-and-elastic|剪切模量|TiAlNb剪切|elastic/i],
    expectSecondary: [/in\.shear\.lmp|triclinic|fix deform/i],
  },
  {
    id: 'Q34',
    category: '案例检索',
    prompt: 'NiC、GaN 氧化、金沉积、腐蚀这类问题应该先检索哪个 family？',
    expectPrimary: [/reactive-and-deposition|NiC|GaN氧化|金沉积|腐蚀|吸附/i],
    expectSecondary: [/\.reaxff|log\.lammps|data|case-family-index/i],
  },
  {
    id: 'Q35',
    category: '案例检索',
    prompt: '磨削、摩擦、界面类问题在案例库里应该先检索哪个 family？',
    expectPrimary: [/grinding-machining-interface|磨削|摩擦|MoS2/i],
    expectSecondary: [/hybrid potentials|substrate\/tool|multiple models/i],
  },
  {
    id: 'Q36',
    category: '案例检索',
    prompt: 'shock、PKA 级联、TTM 这类问题应该先检索哪个 family？',
    expectPrimary: [/shock-cascade-ttm|shock|级联|ttm/i],
    expectSecondary: [/cascade|laser|thermal coupling/i],
  },
  {
    id: 'Q37',
    category: '案例检索',
    prompt: 'NiPt、NiTi、B2 相、偏聚相关问题应该先检索哪个 family？',
    expectPrimary: [/alloy-and-segregation|NiPt|NiTi|B2/i],
    expectSecondary: [/library\.meam|eam\.alloy|合金/i],
  },
  {
    id: 'Q38',
    category: '案例检索',
    prompt: '知识库建议的案例检索顺序是什么？请按步骤回答。',
    expectPrimary: [/1\.|2\.|3\.|4\.|顺序|步骤/i],
    expectSecondary: [/family|raw cases|same material|not guaranteed/i],
  },
  {
    id: 'Q39',
    category: '案例检索',
    prompt: 'raw cases 应该被当成最终正确模板吗？知识库怎么界定它们？',
    expectPrimary: [/不是.*最终正确模板|examples, not guaranteed-correct templates|raw cases as examples/i],
    expectSecondary: [/case-family-index|example/i],
  },
  {
    id: 'Q40',
    category: '案例检索',
    prompt: '检索时更应该先查 raw cases 还是只看 index 概述？知识库推荐流程是什么？',
    expectPrimary: [/先.*family|再.*raw cases|不要只看 index|raw/i],
    expectSecondary: [/case-family-index|retrieval guidance/i],
  },
  {
    id: 'Q41',
    category: '工作流认知',
    prompt: '金属双晶或晶界拉伸时，为什么横向边界条件必须被当成首要变量？',
    expectPrimary: [/横向边界|lateral boundary|partial-dislocation|brittle|晶界开裂/i],
    expectSecondary: [/grain-boundary tension|2a43876a|failure mechanism/i],
  },
  {
    id: 'Q42',
    category: '工作流认知',
    prompt: '为什么纳米晶金属研究必须把晶粒尺寸当成一等扫描变量？',
    expectPrimary: [/grain size|晶粒尺寸|机制转变|grain-boundary-mediated|dislocation-dominated/i],
    expectSecondary: [/6f720bec|nanocrystalline/i],
  },
  {
    id: 'Q43',
    category: '工作流认知',
    prompt: '增材制造金属拉伸为什么不能只用一个泛化多晶模型替代？',
    expectPrimary: [/single-crystal|equiaxed|columnar|增材制造|不同晶型/i],
    expectSecondary: [/f77fcec8|orientation|grain/i],
  },
  {
    id: 'Q44',
    category: '工作流认知',
    prompt: '金属晶界研究为什么不能只记录 Sigma 值？还应记录哪些边界描述符？',
    expectPrimary: [/Sigma|倾角|对称性|inclination|faceting/i],
    expectSecondary: [/23a83d36|grain-boundary/i],
  },
  {
    id: 'Q45',
    category: '工作流认知',
    prompt: 'Ni 基高温合金分析为什么不能只看基体？知识库强调哪几层因素？',
    expectPrimary: [/gamma-prime|precipitate|interface dislocation|基体/i],
    expectSecondary: [/84a82a28|superalloy/i],
  },
  {
    id: 'Q46',
    category: '工作流认知',
    prompt: '为什么不能用一个代表性的 HEA 成分去泛化整个 HEA 类别？',
    expectPrimary: [/HEA|不能.*一个代表成分|stacking-fault|twinning|solidification/i],
    expectSecondary: [/1c1edd15|mechanism class/i],
  },
  {
    id: 'Q47',
    category: '工作流认知',
    prompt: '纯金属机理迁移为什么要先区分 FCC、BCC、HCP，而不是都按 generic metal 处理？',
    expectPrimary: [/FCC|BCC|HCP|不要泛化|screw dislocation|twinning/i],
    expectSecondary: [/71553f39|carrier type/i],
  },
  {
    id: 'Q48',
    category: '工作流认知',
    prompt: '辐照、扩散、偏聚问题的证据组织链条应该是什么？',
    expectPrimary: [/cascade|sink|transport|defect sink|long-range transport/i],
    expectSecondary: [/38cbd51d|helium|hydrogen|vacancies/i],
  },
  {
    id: 'Q49',
    category: '工作流认知',
    prompt: '金属切削分析为什么不能只看切削力和切屑？知识库要求补哪些输出？',
    expectPrimary: [/residual stress|surface roughness|subsurface defect|切削力.*不足/i],
    expectSecondary: [/26ae1fbb|surface integrity/i],
  },
  {
    id: 'Q50',
    category: '工作流认知',
    prompt: '表面加工或纳米压痕分析为什么不能只看形貌？还必须配合哪些缺陷分析？',
    expectPrimary: [/morphology|CNA|PTM|DXA|stacking-fault|形貌.*不够/i],
    expectSecondary: [/71471d65|surface machining|indentation|scratch/i],
  },
]

function matchesAny(text: string, regexes: RegExp[]) {
  return regexes.some(re => re.test(text))
}

function summarizeNote(result: CaseResult) {
  const tags = [
    result.exitCode === 0 ? '命令成功' : `命令失败(${result.exitCode})`,
    result.citationHit ? '命中引用' : '无明显引用',
    result.primaryHit ? '命中主断言' : '未命中主断言',
    result.secondaryHit ? '命中次断言' : '未命中次断言',
  ]
  return tags.join(' / ')
}

async function runCase(def: CaseDef): Promise<CaseResult> {
  return runLookupCase(def)
}

async function runLookupCase(def: CaseDef): Promise<CaseResult> {
  const start = Date.now()
  const proc = Bun.spawn(
    [process.execPath, 'run', 'src/entrypoints/lammps-cli.ts', 'lookup', def.prompt],
    {
      cwd: process.cwd(),
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env,
    },
  )

  const timeoutMs = 120000
  const timedOut = await Promise.race([
    proc.exited.then(() => false),
    new Promise<boolean>(resolve => setTimeout(() => resolve(true), timeoutMs)),
  ])

  if (timedOut) {
    proc.kill()
  }

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  const durationMs = Date.now() - start
  const text = `${stdout}\n${stderr}`
  const citationHit = matchesAny(text, CITATION_REGEXES)
  const primaryHit = matchesAny(text, def.expectPrimary)
  const secondaryHit = matchesAny(text, def.expectSecondary)

  let score = 0
  if (!timedOut && exitCode === 0 && stdout.trim()) score += 1
  if (citationHit) score += 1
  if (primaryHit) score += 1
  if (secondaryHit) score += 1
  if (timedOut) score = 0

  const result: CaseResult = {
    id: def.id,
    category: def.category,
    prompt: def.prompt,
    score,
    exitCode: timedOut ? 124 : exitCode,
    durationMs,
    citationHit,
    primaryHit,
    secondaryHit,
    note: '',
    stdout,
    stderr: timedOut ? `${stderr}\n[timeout after ${timeoutMs}ms]` : stderr,
  }
  result.note = summarizeNote(result)
  return result
}

async function runSearchCase(def: CaseDef): Promise<CaseResult> {
  const start = Date.now()
  let stdout = ''
  let stderr = ''
  let exitCode = 0
  try {
    const result = await searchKnowledge({ query: def.prompt, topK: 6 })
    stdout = JSON.stringify(result, null, 2)
  } catch (error) {
    exitCode = 1
    stderr = String(error)
  }
  const durationMs = Date.now() - start
  const text = `${stdout}\n${stderr}`
  const citationHit = matchesAny(text, CITATION_REGEXES)
  const primaryHit = matchesAny(text, def.expectPrimary)
  const secondaryHit = matchesAny(text, def.expectSecondary)
  let score = 0
  if (exitCode === 0 && stdout.trim()) score += 1
  if (citationHit) score += 1
  if (primaryHit) score += 1
  if (secondaryHit) score += 1
  const result: CaseResult = {
    id: def.id,
    category: def.category,
    prompt: def.prompt,
    score,
    exitCode,
    durationMs,
    citationHit,
    primaryHit,
    secondaryHit,
    note: '',
    stdout,
    stderr,
  }
  result.note = summarizeNote(result)
  return result
}

function buildReport(results: CaseResult[], engine: 'lookup' | 'search') {
  const total = results.reduce((sum, item) => sum + item.score, 0)
  const max = results.length * 4
  const percent = ((total / max) * 100).toFixed(1)
  const avg = (total / results.length).toFixed(2)
  const categoryMap = new Map<
    string,
    { score: number; max: number; count: number }
  >()

  for (const item of results) {
    const current = categoryMap.get(item.category) ?? { score: 0, max: 0, count: 0 }
    current.score += item.score
    current.max += 4
    current.count += 1
    categoryMap.set(item.category, current)
  }

  const rows = results
    .map(
      item =>
        `| ${item.id} | ${item.category} | ${item.score}/4 | ${item.durationMs} ms | ${item.prompt.replace(/\|/g, '\\|')} | ${item.note} |`,
    )
    .join('\n')

  const categoryRows = [...categoryMap.entries()]
    .map(([category, stat]) => {
      const categoryPercent = ((stat.score / stat.max) * 100).toFixed(1)
      return `| ${category} | ${stat.score}/${stat.max} | ${categoryPercent}% | ${stat.count} |`
    })
    .join('\n')

  const lowCases = results
    .filter(item => item.score <= 2)
    .slice(0, 12)
    .map(item => `- ${item.id} ${item.score}/4: ${item.prompt}`)
    .join('\n')

  const modeDescription =
    engine === 'lookup'
      ? '对 50 道中文检索问答题逐题执行 `bun run lammps lookup`，评估真实 CLI 问答输出'
      : '对 50 道中文检索问答题逐题执行 `searchKnowledge()` 本地索引检索，评估知识库检索命中与可回答性'

  return `# CC CLI 知识库检索与问答准确度测试报告\n\n- 日期: ${new Date().toISOString()}\n- 测试对象: 当前仓库中的 CC CLI（LAMMPS 知识库检索路径）\n- 执行方式: ${modeDescription}\n- 评分标准: 每题 0-4 分（命令成功 1 分 + 引用命中 1 分 + 主断言命中 1 分 + 次断言命中 1 分）\n\n## 总评\n\n- 总分: ${total} / ${max}\n- 平均分: ${avg} / 4\n- 百分制: ${percent}%\n\n## 分项成绩\n\n| 模块 | 得分 | 百分比 | 题目数 |\n| --- | ---: | ---: | ---: |\n${categoryRows}\n\n## 低分题目\n\n${lowCases || '- 无'}\n\n## 逐题明细\n\n| 题号 | 模块 | 得分 | 用时 | 题目 | 说明 |\n| --- | --- | ---: | ---: | --- | --- |\n${rows}\n`
}

async function main() {
  const engineArg = Bun.argv.find(arg => arg.startsWith('--engine='))
  const engine = engineArg?.split('=')[1] === 'search' ? 'search' : 'lookup'
  const results: CaseResult[] = []
  for (const def of CASES) {
    console.log(`[RUN:${engine}] ${def.id} ${def.prompt}`)
    const result =
      engine === 'search' ? await runSearchCase(def) : await runLookupCase(def)
    console.log(`[DONE] ${def.id} -> ${result.score}/4 (${result.durationMs} ms)`)
    results.push(result)
  }

  const report = buildReport(results, engine)
  const outDir = join(process.cwd(), 'docs', 'tests')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, `cc-cli-kb-eval-2026-04-06-cn-${engine}.md`), report)
  writeFileSync(
    join(outDir, `cc-cli-kb-eval-2026-04-06-cn-${engine}.json`),
    JSON.stringify(results, null, 2),
  )
  console.log(`\n[REPORT] ${join('docs', 'tests', `cc-cli-kb-eval-2026-04-06-cn-${engine}.md`)}`)
  console.log(`\n[SCORE] ${results.reduce((sum, item) => sum + item.score, 0)} / ${results.length * 4}`)
}

await main()
