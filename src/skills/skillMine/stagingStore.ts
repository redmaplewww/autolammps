/**
 * Staging store for skill-mine candidates.
 *
 * Each candidate is written to ~/.angsheng/skills-staging/<id>.json as a
 * self-contained record. /skill-mine-review lists these, lets the user
 * accept/edit/reject each, and installs accepted ones as real skills.
 */
import { randomUUID } from 'node:crypto'
import { readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { isENOENT, isFsInaccessible } from '../../utils/errors.js'
import { logForDebugging } from '../../utils/debug.js'
import { jsonStringify } from '../../utils/slowOperations.js'
import { getSkillMineStagingDir } from './config.js'

export type SkillCandidateStatus =
  | 'pending' // staged, awaiting review
  | 'accepted' // user accepted — installed to user/project skills
  | 'rejected' // user rejected — kept on disk for history, hidden from review
  | 'edited' // user accepted with edits

export type SkillCandidate = {
  id: string
  /** Stable, filesystem-safe slug (e.g. "commit-and-push"). */
  slug: string
  /** Human-friendly title. */
  title: string
  /** One-sentence description for skill listing. */
  description: string
  /** When-to-use clause (frontmatter when_to_use). */
  whenToUse: string
  /** Suggested frontmatter allowed-tools patterns. */
  allowedTools: string[]
  /** Suggested arguments ($name) — empty for no-arg skills. */
  arguments: string[]
  /** Suggested argument hint. */
  argumentHint: string
  /** Markdown body (without frontmatter). */
  body: string
  /** Evidence: which prompts/sessions surfaced this pattern. */
  evidence: Array<{ source: 'prompt' | 'session'; snippet: string }>
  /** Why the miner thinks this is skill-worthy. */
  rationale: string
  /** Pattern frequency signal (e.g. "seen 8x across 5 sessions"). */
  frequency: string
  /** Default save target proposed by the miner. */
  proposedScope: 'user' | 'project'
  /** Proposed project dir if scope=project. */
  proposedProjectDir?: string
  /** Epoch ms when staged. */
  stagedAt: number
  /** Epoch ms when mined. */
  minedAt: number
  /** Window start used by the miner. */
  windowStart: number
  /** Current review status. */
  status: SkillCandidateStatus
  /** Where the skill was installed (after accept/edit). */
  installedPath?: string
}

export type StagingFile = {
  id: string
  path: string
  candidate: SkillCandidate
}

function candidatePath(id: string): string {
  return join(getSkillMineStagingDir(), `${id}.json`)
}

/**
 * Persist a candidate to staging. Overwrites if id collides (rare; ids are
 * UUIDs).
 */
export async function stageCandidate(
  candidate: Omit<SkillCandidate, 'id' | 'stagedAt' | 'status'> &
    Partial<Pick<SkillCandidate, 'id' | 'stagedAt' | 'status'>>,
): Promise<SkillCandidate> {
  const id = candidate.id ?? randomUUID().slice(0, 8)
  const full: SkillCandidate = {
    ...candidate,
    id,
    stagedAt: candidate.stagedAt ?? Date.now(),
    status: candidate.status ?? 'pending',
  }
  await mkdir(getSkillMineStagingDir(), { recursive: true })
  await writeFile(
    candidatePath(id),
    jsonStringify(full, null, 2) + '\n',
    'utf-8',
  )
  return full
}

/**
 * Read all staged candidates, optionally filtered by status.
 * Newest first (by stagedAt).
 */
export async function listStagedCandidates(
  statusFilter?: SkillCandidateStatus,
): Promise<StagingFile[]> {
  let files: string[]
  try {
    files = await readdir(getSkillMineStagingDir())
  } catch (e: unknown) {
    if (isFsInaccessible(e) || isENOENT(e)) return []
    throw e
  }

  const out: StagingFile[] = []
  await Promise.all(
    files
      .filter(f => f.endsWith('.json'))
      .map(async f => {
        const fp = join(getSkillMineStagingDir(), f)
        let raw: string
        try {
          raw = await readFile(fp, 'utf-8')
        } catch (e: unknown) {
          if (isENOENT(e)) return
          logForDebugging(`[skill-mine] failed to read staging file ${f}: ${e}`)
          return
        }
        try {
          const c = JSON.parse(raw) as SkillCandidate
          if (!c || typeof c.id !== 'string') return
          if (statusFilter && c.status !== statusFilter) return
          out.push({ id: c.id, path: fp, candidate: c })
        } catch {
          // malformed file — skip
        }
      }),
  )

  out.sort((a, b) => b.candidate.stagedAt - a.candidate.stagedAt)
  return out
}

/**
 * Count pending candidates. Cheap read for status-bar / startup hooks.
 */
export async function countPendingCandidates(): Promise<number> {
  const all = await listStagedCandidates('pending')
  return all.length
}

/**
 * Update a candidate's status (and optionally installedPath). Re-reads then
 * re-writes to avoid clobbering concurrent edits.
 */
export async function updateCandidateStatus(
  id: string,
  status: SkillCandidateStatus,
  installedPath?: string,
): Promise<SkillCandidate | null> {
  const fp = candidatePath(id)
  let raw: string
  try {
    raw = await readFile(fp, 'utf-8')
  } catch (e: unknown) {
    if (isENOENT(e)) return null
    throw e
  }
  let c: SkillCandidate
  try {
    c = JSON.parse(raw) as SkillCandidate
  } catch {
    return null
  }
  c.status = status
  if (installedPath !== undefined) c.installedPath = installedPath
  await writeFile(fp, jsonStringify(c, null, 2) + '\n', 'utf-8')
  return c
}

/**
 * Replace a candidate in full (used after edits).
 */
export async function replaceCandidate(
  candidate: SkillCandidate,
): Promise<void> {
  await mkdir(getSkillMineStagingDir(), { recursive: true })
  await writeFile(
    candidatePath(candidate.id),
    jsonStringify(candidate, null, 2) + '\n',
    'utf-8',
  )
}

/**
 * Permanently delete a staged candidate.
 */
export async function deleteCandidate(id: string): Promise<void> {
  try {
    await rm(candidatePath(id))
  } catch (e: unknown) {
    if (isENOENT(e)) return
    throw e
  }
}

/**
 * Render a SkillCandidate's full SKILL.md (frontmatter + body). This is
 * what gets written into ~/.angsheng/skills/<slug>/SKILL.md on install.
 */
export function renderSkillMarkdown(c: SkillCandidate): string {
  const fm: string[] = ['---']
  fm.push(`name: ${c.slug}`)
  fm.push(`description: ${escapeYaml(c.description)}`)
  if (c.allowedTools.length > 0) {
    fm.push('allowed-tools:')
    for (const t of c.allowedTools) fm.push(`  - ${t}`)
  } else {
    fm.push('allowed-tools: []')
  }
  if (c.whenToUse) fm.push(`when_to_use: ${escapeYaml(c.whenToUse)}`)
  if (c.argumentHint) fm.push(`argument-hint: ${escapeYaml(c.argumentHint)}`)
  if (c.arguments.length > 0) {
    fm.push('arguments:')
    for (const a of c.arguments) fm.push(`  - ${a}`)
  }
  fm.push('---')
  return fm.join('\n') + '\n\n' + c.body.trim() + '\n'
}

function escapeYaml(s: string): string {
  // Quote when value contains characters YAML would misparse.
  if (/[:#\-?\[\]{},&*!|>'"%@`"\n]/.test(s) || /^\s|\s$/.test(s)) {
    return JSON.stringify(s)
  }
  return s
}
