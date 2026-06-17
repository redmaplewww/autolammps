import { existsSync } from 'fs'
import { Database } from 'bun:sqlite'
import { getLayeredDbPath } from './layeredIndexer.js'

// Fallback stub implementations for layered search.
// The layered entity-graph search is an optional enhancement.
// When the layered SQLite DB is not present or lacks the schema,
// these functions return empty/no-match results gracefully.

export interface FindCasesInput {
  intent?: 'write_input'
  family?: string
  subType?: string
  material?: string
  potential?: string
  query?: string
  topK?: number
  includeContent?: boolean
  maxLines?: number
}

export interface CaseResult {
  id: string
  type: string
  label?: string
  path?: string
  score: number
}

export function findCases(input: FindCasesInput): {
  query: { intent?: string; family?: string; material?: string }
  results: CaseResult[]
} {
  const dbPath = getLayeredDbPath()
  if (!existsSync(dbPath)) {
    return {
      query: { intent: input.intent, family: input.family, material: input.material },
      results: [],
    }
  }
  try {
    const db = new Database(dbPath, { readonly: true })
    const topK = input.topK ?? 10
    let results: CaseResult[] = []

    // Try FTS on entities label
    if (input.query || input.material || input.family) {
      const searchTerm = [input.material, input.family, input.query].filter(Boolean).join(' ')
      try {
        const rows = db
          .query(
            `SELECT e.id, e.type, e.label, f.path, 1.0 as score
             FROM entities e LEFT JOIN files f ON e.file_id = f.id
             WHERE e.label LIKE '%' || ? || '%'
             LIMIT ?`,
          )
          .all(searchTerm, topK) as Array<{ id: string; type: string; label?: string; path?: string; score: number }>
        results = rows.map(r => ({ ...r, score: r.score }))
      } catch {
        // schema mismatch — return empty
      }
    }

    db.close()
    return {
      query: { intent: input.intent, family: input.family, material: input.material },
      results,
    }
  } catch {
    return {
      query: { intent: input.intent, family: input.family, material: input.material },
      results: [],
    }
  }
}

export interface EntityResult {
  id: string
  type: string
  label?: string
  path?: string
  content?: string
}

export function getEntity(input: {
  id: string
  includeContent?: boolean
  maxLines?: number
}): EntityResult | null {
  const dbPath = getLayeredDbPath()
  if (!existsSync(dbPath)) return null
  try {
    const db = new Database(dbPath, { readonly: true })
    let result: EntityResult | null = null
    try {
      const row = db
        .query(
          'SELECT e.id, e.type, e.label, f.path FROM entities e LEFT JOIN files f ON e.file_id = f.id WHERE e.id = ?',
        )
        .get(input.id) as { id: string; type: string; label?: string; path?: string } | null
      if (row) result = { ...row }
    } catch {
      // ignore
    }
    db.close()
    return result
  } catch {
    return null
  }
}

export interface LinkedResult {
  id: string
  links: Array<{ id: string; type: string; relType: string; label?: string }>
}

export function getLinked(input: {
  id: string
  relType?: string
  direction?: 'outgoing' | 'incoming'
  topK?: number
}): LinkedResult {
  return { id: input.id, links: [] }
}

export interface VerifyResult {
  source: string
  checks: Array<{ rule: string; passed: boolean; detail?: string }>
}

export function verifyScript(input: {
  commands?: string[]
  scriptContent?: string
  scope?: 'full' | 'deformation' | 'potential'
  maxResults?: number
}): VerifyResult {
  return { source: input.scriptContent ? 'script' : 'commands', checks: [] }
}
