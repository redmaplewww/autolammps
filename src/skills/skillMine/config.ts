/**
 * Skill-mining config.
 *
 * All mining is manual — the user runs `/skill-mine` when they want a
 * scan. This file only persists the default lookback window so the user
 * doesn't have to pass `--window=` every time.
 */
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getAppConfigHomeDir } from '../../utils/envUtils.js'
import { isFsInaccessible } from '../../utils/errors.js'
import { getFsImplementation } from '../../utils/fsOperations.js'
import { safeParseJSON } from '../../utils/json.js'
import { jsonStringify } from '../../utils/slowOperations.js'

export type SkillMineConfig = {
  /** Default lookback window for `/skill-mine` (ms). Default: 7 days. */
  windowMs: number
  /** Epoch ms of the last manual run (informational). */
  lastRunAt: number
}

export const DEFAULT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
export const MIN_WINDOW_MS = 60 * 60 * 1000 // 1h floor

export function getSkillMineDir(): string {
  return join(getAppConfigHomeDir(), 'skill-mine')
}

export function getSkillMineConfigPath(): string {
  return join(getSkillMineDir(), 'config.json')
}

export function getSkillMineStagingDir(): string {
  return join(getAppConfigHomeDir(), 'skills-staging')
}

export const DEFAULT_CONFIG: SkillMineConfig = {
  windowMs: DEFAULT_WINDOW_MS,
  lastRunAt: 0,
}

export async function readSkillMineConfig(): Promise<SkillMineConfig> {
  const fs = getFsImplementation()
  let raw: string
  try {
    raw = await fs.readFile(getSkillMineConfigPath(), { encoding: 'utf-8' })
  } catch (e: unknown) {
    if (isFsInaccessible(e)) return { ...DEFAULT_CONFIG }
    return { ...DEFAULT_CONFIG }
  }
  const parsed = safeParseJSON(raw, false) as Partial<SkillMineConfig> | null
  if (!parsed) return { ...DEFAULT_CONFIG }
  return { ...DEFAULT_CONFIG, ...parsed }
}

export async function writeSkillMineConfig(
  cfg: SkillMineConfig,
): Promise<void> {
  await mkdir(getSkillMineDir(), { recursive: true })
  await writeFile(
    getSkillMineConfigPath(),
    jsonStringify(cfg, null, 2) + '\n',
    'utf-8',
  )
}

/**
 * Human-readable interval formatter for status messages.
 */
export function formatInterval(ms: number): string {
  if (ms >= 24 * 60 * 60 * 1000) {
    const d = Math.round(ms / (24 * 60 * 60 * 1000))
    return `${d}d`
  }
  if (ms >= 60 * 60 * 1000) {
    const h = Math.round(ms / (60 * 60 * 1000))
    return `${h}h`
  }
  const m = Math.max(1, Math.round(ms / (60 * 1000)))
  return `${m}m`
}
