// @ts-nocheck
import { searchKnowledge } from '../src/utils/lammpsKnowledge/search.js'

type RegressionCase = {
  id: string
  query: string
  mustMatch: RegExp[]
  minScore: number
}

const CASES: RegressionCase[] = [
  {
    id: 'Q06',
    query: '为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。',
    mustMatch: [/CL-005|acceptance criteria|成功标准/i],
    minScore: 3,
  },
  {
    id: 'Q29',
    query: 'Cu 单轴压缩案例里，应变和应力变量是怎么定义的？',
    mustMatch: [/strainx|stressx|v_Lx0|-pxx\/10000/i],
    minScore: 3,
  },
  {
    id: 'Q38',
    query: '知识库建议的案例检索顺序是什么？请按步骤回答。',
    mustMatch: [/case-family-index|raw cases|same material|not guaranteed/i],
    minScore: 3,
  },
  {
    id: 'Q39',
    query: 'raw cases 应该被当成最终正确模板吗？知识库怎么界定它们？',
    mustMatch: [/examples|guaranteed-correct templates|不是.*最终正确模板|不能照抄/i],
    minScore: 3,
  },
  {
    id: 'Q42',
    query: '为什么纳米晶金属研究必须把晶粒尺寸当成一等扫描变量？',
    mustMatch: [/grain size|晶粒尺寸|机制转变|grain-boundary/i],
    minScore: 3,
  },
  {
    id: 'Q48',
    query: '辐照、扩散、偏聚问题的证据组织链条应该是什么？',
    mustMatch: [/cascade|sink|transport|trapping/i],
    minScore: 3,
  },
  {
    id: 'Q49',
    query: '金属切削分析为什么不能只看切削力和切屑？知识库要求补哪些输出？',
    mustMatch: [/residual stress|surface roughness|subsurface defect/i],
    minScore: 3,
  },
  {
    id: 'Q50',
    query: '表面加工或纳米压痕分析为什么不能只看形貌？还必须配合哪些缺陷分析？',
    mustMatch: [/CNA|PTM|DXA|stacking-fault|形貌.*不够/i],
    minScore: 3,
  },
]

function scoreResult(result: Awaited<ReturnType<typeof searchKnowledge>>, regexes: RegExp[]) {
  const text = JSON.stringify(result)
  return regexes.some(re => re.test(text))
}

async function main() {
  let failed = 0
  for (const item of CASES) {
    const result = await searchKnowledge({ query: item.query, topK: 6 })
    const matched = scoreResult(result, item.mustMatch)
    const totalScore = matched ? 4 : 0
    const passed = matched
    console.log(
      `${passed ? '[PASS]' : '[FAIL]'} ${item.id} score=${totalScore} matched=${matched} query=${item.query}`,
    )
    if (!passed) {
      failed += 1
      console.log(JSON.stringify(result, null, 2))
    }
  }
  if (failed > 0) process.exit(1)
}

await main()
