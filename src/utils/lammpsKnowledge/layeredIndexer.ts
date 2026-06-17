import { existsSync } from 'fs'
import { join } from 'path'
import { Database } from 'bun:sqlite'
import { getWorkspaceRoot } from './common.js'

const LAYERED_DB_BASENAME = 'lammps-knowledge-layered.sqlite'

export function getLayeredDbPath(workspaceRoot = getWorkspaceRoot()): string {
  return join(workspaceRoot, '.angsheng', 'cache', LAYERED_DB_BASENAME)
}

export interface LayeredIndexStatus {
  exists: boolean
  dbPath: string
  entities: Record<string, number>
  links: number
  files: number
}

export function getLayeredIndexStatus(
  workspaceRoot = getWorkspaceRoot(),
): LayeredIndexStatus {
  const dbPath = getLayeredDbPath(workspaceRoot)
  if (!existsSync(dbPath)) {
    return { exists: false, dbPath, entities: {}, links: 0, files: 0 }
  }
  try {
    const db = new Database(dbPath, { readonly: true })
    let entities: Record<string, number> = {}
    let links = 0
    let files = 0
    try {
      const entityRows = db.query('SELECT type, COUNT(*) as c FROM entities GROUP BY type').all() as Array<{type: string, c: number}>
      entities = Object.fromEntries(entityRows.map(r => [r.type, r.c]))
      links = (db.query('SELECT COUNT(*) as c FROM links').get() as {c: number})?.c ?? 0
      files = (db.query('SELECT COUNT(*) as c FROM files').get() as {c: number})?.c ?? 0
    } catch {
      // tables may not exist
    }
    db.close()
    return { exists: true, dbPath, entities, links, files }
  } catch {
    return { exists: false, dbPath, entities: {}, links: 0, files: 0 }
  }
}

export async function buildLayeredIndex(
  _workspaceRoot?: string,
): Promise<{ dbPath: string; entities: number; links: number; files: number }> {
  // Layered index is optional enhancement — main FTS index is sufficient for core functionality.
  // Returns status without rebuilding (prebuilt layered.sqlite.gz shipped with repo).
  const status = getLayeredIndexStatus(_workspaceRoot)
  const totalEntities = Object.values(status.entities).reduce((a, b) => a + b, 0)
  return {
    dbPath: status.dbPath,
    entities: totalEntities,
    links: status.links,
    files: status.files,
  }
}
