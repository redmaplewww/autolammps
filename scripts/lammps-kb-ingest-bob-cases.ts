// @ts-nocheck
import { readdir as rd, stat, readFile, writeFile } from 'node:fs/promises'
import { resolve, join, basename } from 'node:path'
import {
  applyReviewDecision,
  ingestContent,
} from '../src/utils/lammpsKbPipeline/store.ts'

const WORKSPACE = process.cwd()
const BOB_LEARNING_DIR = resolve(WORKSPACE, 'migration/bob-case-learning')
const BOB_CASES_DIR = resolve(WORKSPACE, 'migration/bob老师案例')
const BOB_RAW_DIR = resolve(WORKSPACE, 'knowledge/cases/raw/bob老师案例')

const CASES_FROM_BATCH = [
  '1CO2冷凝-雪人',
  '1MDPD粘度计算-雪人',
  '1MDPD表面张力-雪人',
  '1spce水表面张力-walker',
  '1丙烯液体润湿-雪人',
  '1刚性CO2模拟-雪人',
  '1十六烷润湿-雪人',
  '1带电表面离子液体-雪人',
]

const BATCH_FILE = resolve(BOB_LEARNING_DIR, 'batch-01.md')

async function listLearningFiles() {
  const files = await rd(BOB_LEARNING_DIR)
  return files
    .filter(f => f.startsWith('case-') && f.endsWith('.md'))
    .map(f => f.replace(/^case-/, '').replace(/\.md$/, ''))
}

async function readLearningContent(caseName) {
  const f = resolve(BOB_LEARNING_DIR, `case-${caseName}.md`)
  try {
    return await readFile(f, 'utf8')
  } catch {
    return null
  }
}

async function readBatchContent() {
  return await readFile(BATCH_FILE, 'utf8')
}

async function findInputFiles(caseName) {
  const caseDir = resolve(BOB_CASES_DIR, caseName)
  const inputFiles = []
  const patterns = ['in.', 'data.', '*.lt', '*.script', '*.py']

  async function scanDir(dir) {
    try {
      const entries = await rd(dir)
      for (const entry of entries) {
        const full = resolve(dir, entry)
        const st = await stat(full)
        if (st.isDirectory()) {
          await scanDir(full)
        } else {
          const lower = entry.toLowerCase()
          if (
            lower.startsWith('in.') ||
            lower.startsWith('data.') ||
            lower.endsWith('.lt') ||
            lower.endsWith('.script') ||
            lower.endsWith('.py')
          ) {
            inputFiles.push(full)
          }
        }
      }
    } catch {}
  }

  await scanDir(caseDir)
  return inputFiles
}

function inferTags(caseName, content) {
  const tags = ['bob老师案例', 'case_note']
  const lowerName = caseName.toLowerCase()
  const lowerContent = content.toLowerCase()

  if (lowerName.includes('mdpd') || lowerContent.includes('mdpd')) tags.push('mdpd')
  if (lowerName.includes('dpd') || lowerContent.includes('dpd')) tags.push('dpd')
  if (lowerName.includes('润湿') || lowerName.includes('wetting') || lowerContent.includes('润湿') || lowerContent.includes('wetting')) tags.push('wetting')
  if (lowerName.includes('表面张力') || lowerName.includes('surface tension')) tags.push('surface-tension')
  if (lowerName.includes('相变') || lowerName.includes('冰') || lowerName.includes('凝结') || lowerName.includes('结冰')) tags.push('phase-change')
  if (lowerName.includes('扩散') || lowerName.includes('diffusion') || lowerName.includes('驱替')) tags.push('diffusion')
  if (lowerName.includes('reax') || lowerContent.includes('reax/c')) tags.push('reaxff')
  if (lowerName.includes('拉伸') || lowerName.includes('tensile') || lowerName.includes('剪切') || lowerName.includes('shear') || lowerName.includes('变形')) tags.push('mechanics')
  if (lowerName.includes('冲击') || lowerName.includes('shock') || lowerName.includes('纳米气泡') || lowerName.includes('气泡波')) tags.push('shock')
  if (lowerName.includes('热') || lowerName.includes('heat') || lowerName.includes('导热') || lowerName.includes('粘度')) tags.push('heat-transfer')
  if (lowerName.includes('自组装')) tags.push('self-assembly')
  if (lowerName.includes('离子液体')) tags.push('ionic-liquid')
  if (lowerName.includes('石墨烯')) tags.push('graphene')
  if (lowerName.includes('纳米')) tags.push('nanoscale')
  if (lowerName.includes('液滴') || lowerContent.includes('droplet')) tags.push('droplet')

  return [...new Set(tags)]
}

function inferMaterialSystem(content) {
  const lower = content.toLowerCase()
  if (lower.includes('argon') || lower.includes('氩') || lower.includes('ar ')) return 'Ar'
  if (lower.includes('water') || lower.includes('水') || lower.includes('spce') || lower.includes('h2o')) return 'H2O'
  if (lower.includes('sodium') || lower.includes('氯化钠') || lower.includes('nacl')) return 'NaCl'
  if (lower.includes('co2') || lower.includes('二氧化碳') || lower.includes('carbon dioxide')) return 'CO2'
  if (lower.includes('methane') || lower.includes('甲烷')) return 'CH4'
  if (lower.includes('silicon') || lower.includes('硅') || lower.includes('sio2')) return 'SiO2'
  if (lower.includes('graphene') || lower.includes('石墨')) return 'C'
  if (lower.includes('metal') || lower.includes('copper') || lower.includes('铜') || lower.includes('aluminum') || lower.includes('铝') || lower.includes('iron') || lower.includes('铁') || lower.includes('nickel') || lower.includes('镍')) return 'metal'
  if (lower.includes('polymer') || lower.includes('polyethylene') || lower.includes('聚乙烯') || lower.includes('polymer')) return 'polymer'
  if (lower.includes('ionic') || lower.includes('离子液体')) return 'ionic-liquid'
  return 'unknown'
}

function inferPotentialFamily(content) {
  const lower = content.toLowerCase()
  if (lower.includes('reax') || lower.includes('reaxff')) return 'reaxff'
  if (lower.includes('eam') || lower.includes('meam')) return 'eam'
  if (lower.includes('tersoff')) return 'tersoff'
  if (lower.includes('mdpd') || lower.includes('mdpd/rho')) return 'mdpd'
  if (lower.includes('opls') || lower.includes('oplsaa')) return 'opls'
  if (lower.includes('lj/cut')) return 'lj'
  if (lower.includes('sw ') || lower.includes('stillinger')) return 'sw'
  return 'lj'
}

async function extractCaseFromBatch(batchContent, caseName) {
  const lines = batchContent.split('\n')
  const cleanName = caseName.replace(/^\d+/, '')

  let inCase = false
  let caseLines = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      const headingText = line.slice(3).trim().replace(/^\d+\.\s*/, '')
      if (headingText === cleanName || headingText.includes(cleanName)) {
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
  return caseLines.join('\n').trim()
}

async function ingestCase(caseName, content, inputFiles) {
  const title = caseName
  const tags = inferTags(caseName, content)
  const materialSystem = inferMaterialSystem(content)
  const potentialFamily = inferPotentialFamily(content)

  const evidencePaths = [
    resolve(BOB_LEARNING_DIR, `case-${caseName}.md`),
    resolve(BOB_CASES_DIR, caseName),
    ...inputFiles,
  ]

  const ingestResult = await ingestContent({
    content,
    filePath: resolve(BOB_LEARNING_DIR, `case-${caseName}.md`),
    sourceType: 'case_note',
    title,
    tags,
    autoClassify: true,
  })

  const entryId = String(ingestResult.id)

  const reviewResult = await applyReviewDecision({
    entryId,
    decision: 'confirmed',
    reviewer: 'bob-case-import',
    rationale: `Bob老师LAMMPS案例学习记录，已由CC CLI完成自主学习。案例包含 ${inputFiles.length} 个原始输入文件。`,
    summary: content.slice(0, 300),
    lesson: content.slice(0, 500),
    title,
    tags: [...tags, 'bob-teacher', 'confirmed'],
    evidencePaths,
    knowledgeType: 'case_note',
    destination: 'cases/raw/bob老师案例',
    mergeMode: 'new_entry',
  })

  return { caseName, entryId, ingestResult, reviewResult }
}

async function main() {
  console.log('Starting bob老师案例 KB ingestion...')
  console.log(`Workspace: ${WORKSPACE}`)
  console.log(`Learning dir: ${BOB_LEARNING_DIR}`)
  console.log(`Cases dir: ${BOB_CASES_DIR}`)
  console.log('')

  const batchContent = await readBatchContent()
  const caseNames = await listLearningFiles()

  const allCaseNames = [
    ...CASES_FROM_BATCH,
    ...caseNames.filter(n => !CASES_FROM_BATCH.includes(n)),
  ]

  console.log(`Total cases to ingest: ${allCaseNames.length}`)
  console.log(`  - from batch: ${CASES_FROM_BATCH.length}`)
  console.log(`  - individual: ${caseNames.filter(n => !CASES_FROM_BATCH.includes(n)).length}`)
  console.log('')

  const results = []
  const errors = []

  for (let i = 0; i < allCaseNames.length; i++) {
    const caseName = allCaseNames[i]!
    const isFromBatch = CASES_FROM_BATCH.includes(caseName)

    process.stdout.write(`[${i + 1}/${allCaseNames.length}] ${caseName}... `)

    try {
      let content
      if (isFromBatch) {
        content = await extractCaseFromBatch(batchContent, caseName)
      } else {
        content = await readLearningContent(caseName)
      }

      if (!content || content.length < 50) {
        console.log('SKIP (no content)')
        errors.push({ caseName, error: 'No content' })
        continue
      }

      const inputFiles = await findInputFiles(caseName)

      const result = await ingestCase(caseName, content, inputFiles)
      results.push(result)
      console.log(`OK id=${result.entryId.slice(0, 8)} files=${inputFiles.length}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`ERROR: ${msg}`)
      errors.push({ caseName, error: msg })
    }
  }

  console.log('')
  console.log('=== Ingestion Summary ===')
  console.log(`Success: ${results.length}`)
  console.log(`Errors: ${errors.length}`)

  if (errors.length > 0) {
    console.log('')
    console.log('Failed cases:')
    for (const e of errors) {
      console.log(`  - ${e.caseName}: ${e.error}`)
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    total: allCaseNames.length,
    success: results.length,
    errors: errors.length,
    results: results.map(r => ({ caseName: r.caseName, entryId: r.entryId })),
    errors_detail: errors,
  }

  await writeFile(
    resolve(BOB_LEARNING_DIR, 'INGESTION_REPORT.json'),
    JSON.stringify(summary, null, 2),
    'utf8',
  )
  console.log('')
  console.log(`Report saved to: ${resolve(BOB_LEARNING_DIR, 'INGESTION_REPORT.json')}`)
}

await main()

export {}
