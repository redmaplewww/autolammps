// @ts-nocheck
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  applyReviewDecision,
  ingestContent,
} from '../src/utils/lammpsKbPipeline/store.ts'

async function main() {
  const sourcePath = resolve(
    process.cwd(),
    'knowledge/archive/migration-unpacked/knowledge/knowledge/atomsk-study/STUDY_PLAN.md',
  )
  const content = await readFile(sourcePath, 'utf8')

  const ingestResult = await ingestContent({
    content,
    filePath: sourcePath,
    sourceType: 'experience',
    title: 'Atomsk 官方教程学习进度',
    tags: ['atomsk', 'study-progress', 'official-tutorial'],
  })

  const entryId = String(ingestResult.id)
  const reviewResult = await applyReviewDecision({
    entryId,
    decision: 'confirmed',
    reviewer: 'atomsk-study-import',
    rationale:
      'This is a high-value historical study-progress record derived from the official Atomsk tutorial sequence and is worth keeping in active knowledge memory.',
    summary:
      'Atomsk 官方教程按顺序学习的总体进度与完成情况，可作为当前 Atomsk 学习基线。',
    lesson:
      'Treat the Atomsk historical tutorial study plan as the baseline learning progress and keep future Atomsk notes aligned with the official tutorial order.',
    title: 'Atomsk 官方教程学习进度',
    tags: ['atomsk', 'study-progress', 'official-tutorial', 'confirmed'],
    evidencePaths: [
      'knowledge/archive/migration-unpacked/knowledge/knowledge/atomsk-study/STUDY_PLAN.md',
    ],
  })

  console.log(JSON.stringify({ ingestResult, reviewResult }, null, 2))
}

await main()

export {}
