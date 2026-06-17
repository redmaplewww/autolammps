// @ts-nocheck
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import {
  applyReviewDecision,
  getEntry,
  getPipelineStatus,
  searchEntries,
} from '../src/utils/lammpsKbPipeline/store.ts'

const WORKSPACE = process.cwd()
const BOB_LEARNING_DIR = resolve(WORKSPACE, 'migration/bob-case-learning')
const BOB_CASES_DIR = resolve(WORKSPACE, 'migration/bob老师案例')
const KB_ROOT = resolve(WORKSPACE, 'knowledge')

const KNOWLEDGE_DESTINATIONS: Record<string, string> = {
  rule: 'rules/learned-rules.md',
  experience: 'memory/confirmed-lessons.md',
  template: 'templates/lammps-input-templates.md',
  case_note: 'cases/notes/',
  correction: 'corrections/reference-corpus/',
}

function classifyCase(caseName: string, content: string): {
  knowledgeType: string
  destination: string
  mergeMode: 'append' | 'new_entry'
  tags: string[]
  lesson: string
} {
  const lowerName = caseName.toLowerCase()
  const lowerContent = content.toLowerCase()

  let knowledgeType = 'case_note'
  let destination = 'cases/notes/'
  let mergeMode: 'append' | 'new_entry' = 'new_entry'
  let tags: string[] = ['bob老师案例']
  let lesson = ''

  if (lowerContent.includes('表面张力') || lowerContent.includes('surface tension')) {
    knowledgeType = 'rule'
    destination = 'rules/learned-rules.md'
    mergeMode = 'append'
    tags.push('surface-tension', 'stress/atom', ' Kirkwood-Buff')
    lesson = '表面张力计算模板：使用 stress/atom + ave/spatial 沿界面法向分 bin，通过 P_N - P_T 积分得到 gamma'
  } else if (lowerContent.includes('润湿') || lowerContent.includes('wetting')) {
    knowledgeType = 'rule'
    destination = 'rules/learned-rules.md'
    mergeMode = 'append'
    tags.push('wetting', 'contact-angle', 'droplet')
    lesson = '润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化'
  } else if (lowerContent.includes('mdpd') || lowerContent.includes('dpd')) {
    knowledgeType = 'rule'
    destination = 'rules/learned-rules.md'
    mergeMode = 'append'
    tags.push('mdpd', 'dpd', 'mesoscale', 'hybrid/overlay')
    lesson = 'MDPD/DPD 模板：hybrid/overlay mdpd/rhosum + mdpd，密度依赖项截断 0.75，积分器 mvv/dpd'
  } else if (lowerContent.includes('reax') || lowerContent.includes('reaxff')) {
    knowledgeType = 'rule'
    destination = 'rules/learned-rules.md'
    mergeMode = 'append'
    tags.push('reaxff', 'reactive', 'qeq/reax')
    lesson = 'ReaxFF 模板：pair_style reax/c + fix qeq/reax + reax/c/species，先 NPT 平衡再 fix deform 加载'
  } else if (lowerContent.includes('拉伸') || lowerContent.includes('tensile') || lowerContent.includes('剪切') || lowerContent.includes('shear')) {
    knowledgeType = 'rule'
    destination = 'rules/learned-rules.md'
    mergeMode = 'append'
    tags.push('mechanics', 'tensile', 'shear', 'deform')
    lesson = '力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势'
  } else if (lowerContent.includes('扩散') || lowerContent.includes('diffusion') || lowerContent.includes('驱替')) {
    knowledgeType = 'rule'
    destination = 'rules/learned-rules.md'
    mergeMode = 'append'
    tags.push('diffusion', 'displacement', 'porous')
    lesson = '扩散模板：delete_atoms 造孔 + rigid 壁面 + 高温加速扩散 + ave/chunk 输出密度分布'
  } else if (lowerContent.includes('冰') || lowerContent.includes('结冰') || lowerContent.includes('相变')) {
    knowledgeType = 'experience'
    destination = 'memory/confirmed-lessons.md'
    mergeMode = 'append'
    tags.push('phase-change', 'freezing', 'ice')
    lesson = '相变模拟注意点：骤冷温度要足够低以诱导相变，但避免过冷导致结构冻结不自然'
  } else if (lowerContent.includes('冲击') || lowerContent.includes('shock')) {
    knowledgeType = 'rule'
    destination = 'rules/learned-rules.md'
    mergeMode = 'append'
    tags.push('shock', 'impact', 'high-strain-rate')
    lesson = '冲击模板：fix wall/piston 或 velocity set 施加冲击速度，监控应力波传播和局部温度'
  } else if (lowerContent.includes('石墨烯')) {
    knowledgeType = 'rule'
    destination = 'rules/learned-rules.md'
    mergeMode = 'append'
    tags.push('graphene', '2d-material', 'tersoff')
    lesson = '石墨烯模拟：常用 tersoff 或 AIREBO 势，注意 2D 材料的周期性边界设置'
  }

  return { knowledgeType, destination, mergeMode, tags, lesson }
}

function extractModelingPattern(content: string): string {
  const patterns: string[] = []

  if (content.includes('minimize') || content.includes('能量最小化')) {
    patterns.push('先 minimize 再 NVT/NPT 平衡')
  }
  if (content.includes('rigid') || content.includes('刚性')) {
    patterns.push('使用 fix rigid 保持分子刚性')
  }
  if (content.includes('freeze') || content.includes('冻结')) {
    patterns.push('壁面原子冻结 setforce 0 0 0')
  }
  if (content.includes('deform')) {
    patterns.push('使用 fix deform 做应变控制加载')
  }
  if (content.includes('ave/spatial') || content.includes('ave/chunk')) {
    patterns.push('使用 ave/spatial 或 ave/chunk 输出分布')
  }
  if (content.includes('PPPM') || content.includes('kspace')) {
    patterns.push('长程静电用 PPPM，精度 1e-4')
  }

  return patterns.length > 0 ? patterns.join('；') : '无特殊建模套路'
}

async function loadIngestionReport(): Promise<{
  timestamp: string
  total: number
  success: number
  results: Array<{ caseName: string; entryId: string }>
}> {
  const reportPath = resolve(BOB_LEARNING_DIR, 'INGESTION_REPORT.json')
  const content = await readFile(reportPath, 'utf8')
  return JSON.parse(content)
}

async function main() {
  console.log('=== Bob 案例 KB Pipeline 深度学习 ===')
  console.log(`工作目录: ${WORKSPACE}`)
  console.log('')

  const status = await getPipelineStatus()
  console.log('KB Pipeline 当前状态:')
  console.log(`  数据库: ${status.dbPath}`)
  console.log(`  知识库根目录: ${status.knowledgeRoot}`)
  console.log(`  队列计数: ${JSON.stringify(status.counts)}`)
  console.log('')

  const report = await loadIngestionReport()
  console.log(`已入库案例总数: ${report.total}`)
  console.log(`成功入库: ${report.success}`)
  console.log('')

  const batchFile = resolve(BOB_LEARNING_DIR, 'batch-01.md')
  const batchContent = await readFile(batchFile, 'utf8')

  const results: Array<{
    caseName: string
    entryId: string
    decision: string
    destination: string
    knowledgeType: string
  }> = []

  const batchSize = 10
  const totalCases = report.results.length

  for (let i = 0; i < totalCases; i += batchSize) {
    const batch = report.results.slice(i, i + batchSize)
    console.log(`\n=== 批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalCases / batchSize)} ===`)

    for (const { caseName, entryId } of batch) {
      process.stdout.write(`[${i + 1}/${totalCases}] ${caseName}... `)

      try {
        const entry = await getEntry(entryId)
        let content = ''

        if (caseName.includes('CO2冷凝') || caseName.includes('MDPD粘度') || caseName.includes('MDPD表面张力') ||
            caseName.includes('spce水表面张力') || caseName.includes('丙烯液体润湿') || caseName.includes('刚性CO2') ||
            caseName.includes('十六烷润湿') || caseName.includes('带电表面离子液体')) {
          const cleanName = caseName.replace(/^\d+/, '')
          const lines = batchContent.split('\n')
          let inCase = false
          let caseLines: string[] = []
          for (const line of lines) {
            if (line.startsWith('## ')) {
              const heading = line.slice(3).trim().replace(/^\d+\.\s*/, '')
              if (heading === cleanName || heading.includes(cleanName)) {
                inCase = true
                caseLines = []
                continue
              }
              if (inCase) break
            } else if (inCase) {
              if (line.startsWith('## ') || line.startsWith('# ')) break
              caseLines.push(line)
            }
          }
          content = caseLines.join('\n').trim()
        } else {
          const caseFile = resolve(BOB_LEARNING_DIR, `case-${caseName}.md`)
          try {
            content = await readFile(caseFile, 'utf8')
          } catch {
            content = ''
          }
        }

        if (!content || content.length < 50) {
          console.log('SKIP (无内容)')
          results.push({ caseName, entryId, decision: 'skipped', destination: '', knowledgeType: '' })
          continue
        }

        const classification = classifyCase(caseName, content)
        const modelingPattern = extractModelingPattern(content)

        const summary = `${caseName}: ${modelingPattern.slice(0, 100)}`
        const lesson = classification.lesson || modelingPattern

        const reviewResult = await applyReviewDecision({
          entryId,
          decision: 'confirmed',
          reviewer: 'bob-deep-learn-batch',
          rationale: `Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 ${classification.knowledgeType}`,
          summary,
          lesson,
          title: caseName,
          tags: classification.tags,
          knowledgeType: classification.knowledgeType as any,
          destination: classification.destination,
          mergeMode: classification.mergeMode,
          evidencePaths: [
            resolve(BOB_LEARNING_DIR, `case-${caseName}.md`),
            resolve(BOB_CASES_DIR, caseName),
          ],
        })

        results.push({
          caseName,
          entryId,
          decision: 'confirmed',
          destination: reviewResult.outputPath,
          knowledgeType: classification.knowledgeType,
        })

        console.log(`OK → ${classification.destination}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(`ERROR: ${msg}`)
        results.push({ caseName, entryId, decision: 'error', destination: '', knowledgeType: '' })
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n=== 深度学习汇总 ===')
  const confirmed = results.filter(r => r.decision === 'confirmed')
  const skipped = results.filter(r => r.decision === 'skipped')
  const errors = results.filter(r => r.decision === 'error')

  console.log(`已确认并沉淀: ${confirmed.length}`)
  console.log(`跳过: ${skipped.length}`)
  console.log(`错误: ${errors.length}`)

  const typeCount: Record<string, number> = {}
  for (const r of confirmed) {
    typeCount[r.knowledgeType] = (typeCount[r.knowledgeType] || 0) + 1
  }
  console.log('\n知识类型分布:')
  for (const [type, count] of Object.entries(typeCount)) {
    console.log(`  ${type}: ${count}`)
  }

  await writeFile(
    resolve(BOB_LEARNING_DIR, 'DEEP_LEARN_REPORT.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), results, summary: typeCount }, null, 2),
    'utf8',
  )
  console.log(`\n报告已保存: ${resolve(BOB_LEARNING_DIR, 'DEEP_LEARN_REPORT.json')}`)
}

await main()

export {}