/**
 * Skill-mine orchestrator (manual-only).
 *
 * Public entry points:
 *   - runSkillMine(windowMs?)   — collect → mine → stage
 *   - installCandidate(id, scope, projectDir?)  — write skill to disk
 *   - getStagedPendingSummary()  — one-line status for the startup banner
 */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getOriginalCwd } from '../../bootstrap/state.js'
import { logForDebugging } from '../../utils/debug.js'
import { isENOENT } from '../../utils/errors.js'
import { logError } from '../../utils/log.js'
import { toError } from '../../utils/errors.js'
import {
  DEFAULT_WINDOW_MS,
  MIN_WINDOW_MS,
  readSkillMineConfig,
  writeSkillMineConfig,
  type SkillMineConfig,
} from './config.js'
import { buildMiningDataset, type MiningDataset } from './historyStore.js'
import { minePatterns } from './patternMiner.js'
import {
  deleteCandidate,
  listStagedCandidates,
  renderSkillMarkdown,
  stageCandidate,
  updateCandidateStatus,
  type SkillCandidate,
} from './stagingStore.js'

// Re-export for command consumers
export { listStagedCandidates, renderSkillMarkdown, type SkillCandidate }

export type RunOptions = {
  /** Override the lookback window. Default: config.windowMs or 7d. */
  windowMs?: number
  /** Override the source-cwd hint for prioritizing sessions. */
  cwdHint?: string
}

export type RunResult = {
  ok: boolean
  dataset: MiningDataset | null
  staged: SkillCandidate[]
  modelError?: string
  durationMs: number
}

/**
 * Run a single mining pass. Always resolves — never throws. Stages all
 * parsed candidates to ~/.angsheng/skills-staging/. Does NOT install them;
 * that's the user's job via /skill-mine-review.
 */
export async function runSkillMine(opts: RunOptions = {}): Promise<RunResult> {
  const startedAt = Date.now()
  const cfg = await readSkillMineConfig()
  const windowMs = Math.max(
    MIN_WINDOW_MS,
    opts.windowMs ?? cfg.windowMs ?? DEFAULT_WINDOW_MS,
  )
  const cwdHint = opts.cwdHint ?? getOriginalCwd()

  logForDebugging(
    `[skill-mine] starting pass (windowMs=${windowMs}, cwdHint=${cwdHint})`,
  )

  let dataset: MiningDataset
  try {
    dataset = await buildMiningDataset(windowMs, cwdHint)
  } catch (e: unknown) {
    logError(toError(e))
    return {
      ok: false,
      dataset: null,
      staged: [],
      durationMs: Date.now() - startedAt,
      modelError: `dataset build failed: ${toError(e).message}`,
    }
  }

  const { candidates, modelError, rawChars } = await minePatterns(dataset)
  logForDebugging(
    `[skill-mine] model returned ${candidates.length} candidates (${rawChars} chars${modelError ? `, error: ${modelError}` : ''})`,
  )

  // Dedupe by slug vs already-pending candidates — don't re-stage identical
  // proposals the user already reviewed once and didn't act on.
  const existing = await listStagedCandidates()
  const existingSlugs = new Set(
    existing
      .filter(s => s.candidate.status === 'pending')
      .map(s => s.candidate.slug),
  )

  const staged: SkillCandidate[] = []
  for (const c of candidates) {
    if (existingSlugs.has(c.slug)) {
      logForDebugging(`[skill-mine] skip already-pending slug: ${c.slug}`)
      continue
    }
    try {
      const full = await stageCandidate(c)
      staged.push(full)
    } catch (e: unknown) {
      logForDebugging(`[skill-mine] stage failed for ${c.slug}: ${e}`)
    }
  }

  // Record run timestamp (informational only — no auto-trigger reads it).
  const next: SkillMineConfig = { ...cfg, lastRunAt: Date.now() }
  try {
    await writeSkillMineConfig(next)
  } catch (e: unknown) {
    logForDebugging(`[skill-mine] failed to update lastRunAt: ${e}`)
  }

  return {
    ok: true,
    dataset,
    staged,
    modelError,
    durationMs: Date.now() - startedAt,
  }
}

/**
 * Where to install an accepted skill based on scope.
 */
export function resolveInstallDir(
  scope: 'user' | 'project',
  slug: string,
  projectDir?: string,
): string {
  if (scope === 'project') {
    const root = projectDir ?? getOriginalCwd()
    return join(root, '.angsheng', 'skills', slug)
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAppConfigHomeDir } = require('../../utils/envUtils.js') as typeof import('../../utils/envUtils.js')
  return join(getAppConfigHomeDir(), 'skills', slug)
}

/**
 * Persist a candidate as a real skill at the given scope. Writes
 * SKILL.md only — if a directory already exists, it is preserved.
 */
export async function installCandidate(
  id: string,
  scope: 'user' | 'project',
  projectDir?: string,
): Promise<{ skillDir: string; skillFile: string; candidate: SkillCandidate }> {
  const all = await listStagedCandidates()
  const entry = all.find(s => s.id === id)
  if (!entry) throw new Error(`staged candidate not found: ${id}`)
  const candidate = entry.candidate

  const skillDir = resolveInstallDir(scope, candidate.slug, projectDir)
  const skillFile = join(skillDir, 'SKILL.md')

  await mkdir(skillDir, { recursive: true })
  await writeFile(skillFile, renderSkillMarkdown(candidate), 'utf-8')

  await updateCandidateStatus(id, 'accepted', skillDir)
  return { skillDir, skillFile, candidate }
}

/**
 * Permanently remove a staged candidate and mark as rejected (kept for
 * history unless purge=true).
 */
export async function rejectCandidate(
  id: string,
  purge = false,
): Promise<void> {
  if (purge) {
    try {
      await deleteCandidate(id)
      return
    } catch (e: unknown) {
      if (isENOENT(e)) return
      throw e
    }
  }
  await updateCandidateStatus(id, 'rejected')
}

/**
 * Uninstall a previously-installed skill (e.g. user changed their mind
 * after accepting). Best-effort — missing dir is silently ignored.
 */
export async function uninstallSkillDir(skillDir: string): Promise<void> {
  try {
    await rm(skillDir, { recursive: true, force: true })
  } catch (e: unknown) {
    if (isENOENT(e)) return
    logForDebugging(`[skill-mine] uninstall failed for ${skillDir}: ${e}`)
  }
}

/**
 * One-line summary for the startup banner, e.g. "3 skills ready to review".
 */
export async function getStagedPendingSummary(): Promise<string | null> {
  const pending = await listStagedCandidates('pending')
  if (pending.length === 0) return null
  const n = pending.length
  const sample = pending[0]!.candidate.slug
  return n === 1
    ? `1 skill ready to review: ${sample} (run /skill-mine-review)`
    : `${n} skills ready to review (run /skill-mine-review) — e.g. ${sample}`
}
