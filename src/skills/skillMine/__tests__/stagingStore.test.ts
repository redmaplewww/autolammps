import { describe, expect, it, beforeAll } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  deleteCandidate,
  listStagedCandidates,
  renderSkillMarkdown,
  stageCandidate,
  updateCandidateStatus,
  type SkillCandidate,
} from '../stagingStore.js'

// Isolate writes: chdir to a fresh temp dir per test run so getAppConfigHomeDir
// (which resolves to <cwd>/.angsheng) writes inside our scratch tree.
beforeAll(() => {
  const testHome = mkdtempSync(join(tmpdir(), 'skill-mine-test-'))
  process.chdir(testHome)
})

async function makeCandidate(
  overrides: Partial<SkillCandidate> = {},
): Promise<SkillCandidate> {
  const base: Omit<SkillCandidate, 'id' | 'stagedAt' | 'status'> = {
    slug: `test-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Test Skill',
    description: 'A test skill',
    whenToUse: 'Use when testing',
    allowedTools: ['Read', 'Bash(git:*)'],
    arguments: [],
    argumentHint: '',
    body: '# Test Skill\n\nDoes test things.\n\n## Steps\n\n1. Do stuff',
    evidence: [{ source: 'prompt', snippet: 'test me' }],
    rationale: 'frequent',
    frequency: 'seen 3x',
    proposedScope: 'user',
    minedAt: Date.now(),
    windowStart: 0,
    ...overrides,
  }
  return await stageCandidate(base)
}

describe('skillMine/stagingStore', () => {
  it('stageCandidate assigns id and status', async () => {
    const c = await makeCandidate()
    expect(c.id).toBeTruthy()
    expect(c.status).toBe('pending')
    expect(c.stagedAt).toBeGreaterThan(0)
    await deleteCandidate(c.id)
  })

  it('listStagedCandidates returns staged items', async () => {
    const c = await makeCandidate({ slug: 'list-test-skill' })
    const list = await listStagedCandidates('pending')
    expect(list.some(s => s.id === c.id)).toBe(true)
    await deleteCandidate(c.id)
  })

  it('listStagedCandidates filters by status', async () => {
    const c = await makeCandidate()
    await updateCandidateStatus(c.id, 'rejected')
    const pending = await listStagedCandidates('pending')
    expect(pending.some(s => s.id === c.id)).toBe(false)
    const rejected = await listStagedCandidates('rejected')
    expect(rejected.some(s => s.id === c.id)).toBe(true)
    await deleteCandidate(c.id)
  })

  it('updateCandidateStatus updates installedPath', async () => {
    const c = await makeCandidate()
    const updated = await updateCandidateStatus(
      c.id,
      'accepted',
      '/some/skill/dir',
    )
    expect(updated?.status).toBe('accepted')
    expect(updated?.installedPath).toBe('/some/skill/dir')
    await deleteCandidate(c.id)
  })

  it('deleteCandidate removes the file', async () => {
    const c = await makeCandidate()
    await deleteCandidate(c.id)
    const list = await listStagedCandidates()
    expect(list.some(s => s.id === c.id)).toBe(false)
  })

  it('updateCandidateStatus returns null for missing id', async () => {
    const result = await updateCandidateStatus('nonexistent', 'accepted')
    expect(result).toBeNull()
  })

  it('deleteCandidate does not throw for missing id', async () => {
    await expect(deleteCandidate('nonexistent')).resolves.toBeUndefined()
  })
})

describe('skillMine/renderSkillMarkdown', () => {
  it('produces frontmatter + body', () => {
    const md = renderSkillMarkdown({
      id: 'x',
      slug: 'my-skill',
      title: 'My Skill',
      description: 'A simple skill',
      whenToUse: 'Use when needed',
      allowedTools: ['Read', 'Edit'],
      arguments: ['$target'],
      argumentHint: '$target',
      body: '# My Skill\n\nDoes things to $target.',
      evidence: [],
      rationale: '',
      frequency: '',
      proposedScope: 'user',
      stagedAt: 0,
      minedAt: 0,
      windowStart: 0,
      status: 'pending',
    })
    expect(md.startsWith('---\n')).toBe(true)
    expect(md).toContain('name: my-skill')
    expect(md).toContain('description: A simple skill')
    expect(md).toContain('when_to_use: Use when needed')
    expect(md).toContain('  - Read')
    expect(md).toContain('  - $target')
    expect(md).toContain('# My Skill')
    expect(md).toContain('Does things to $target.')
  })

  it('escapes YAML-breaking descriptions', () => {
    const md = renderSkillMarkdown({
      id: 'x',
      slug: 'quote-test',
      title: 'T',
      description: 'contains: a colon and # hash',
      whenToUse: '',
      allowedTools: [],
      arguments: [],
      argumentHint: '',
      body: 'body',
      evidence: [],
      rationale: '',
      frequency: '',
      proposedScope: 'user',
      stagedAt: 0,
      minedAt: 0,
      windowStart: 0,
      status: 'pending',
    })
    // Should be quoted to prevent YAML misparse
    expect(md).toMatch(/description: "contains: a colon and # hash"/)
  })
})
