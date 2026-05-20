import { createHash } from 'crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = process.env.KNOWLEDGE_SERVER_DATA ?? './knowledge-server-data'
const CURRENT_DIR = join(DATA_DIR, 'current')
const VERSIONS_DIR = join(DATA_DIR, 'versions')
const OBJECTS_DIR = join(DATA_DIR, 'objects')
const PORT = Number(process.env.KNOWLEDGE_SERVER_PORT ?? 3849)
const AUTH_TOKEN = process.env.KNOWLEDGE_SERVER_TOKEN ?? ''

ensureDirs()

function ensureDirs() {
  for (const dir of [DATA_DIR, CURRENT_DIR, VERSIONS_DIR, OBJECTS_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
}

type VersionManifest = {
  version: number
  timestamp: string
  checksum: string
  files: Array<{ path: string; sha1: string; size: number; mtime: number }>
  parentVersion: number | null
  changes: { added: string[]; modified: string[]; deleted: string[] }
}

function getLatestVersion(): number {
  const markerPath = join(DATA_DIR, 'latest-version.json')
  if (!existsSync(markerPath)) return 0
  try {
    return JSON.parse(readFileSync(markerPath, 'utf8')).version
  } catch {
    return 0
  }
}

function setLatestVersion(version: number) {
  writeFileSync(
    join(DATA_DIR, 'latest-version.json'),
    JSON.stringify({ version }, null, 2),
  )
}

function loadVersion(version: number): VersionManifest | null {
  const p = join(VERSIONS_DIR, `v${version}.json`)
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

function writeObject(sha1: string, content: Buffer) {
  const prefix = sha1.slice(0, 2)
  const dir = join(OBJECTS_DIR, prefix)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const objPath = join(dir, sha1)
  if (!existsSync(objPath)) writeFileSync(objPath, content)
}

function readObject(sha1: string): Buffer | null {
  const p = join(OBJECTS_DIR, sha1.slice(0, 2), sha1)
  if (!existsSync(p)) return null
  return readFileSync(p)
}

function getCurrentFiles(): Array<{ path: string; sha1: string; size: number; mtime: number }> {
  const markerPath = join(DATA_DIR, 'current-manifest.json')
  if (!existsSync(markerPath)) return []
  try {
    return JSON.parse(readFileSync(markerPath, 'utf8')).files
  } catch {
    return []
  }
}

function computeChanges(
  current: VersionManifest['files'],
  previous: VersionManifest['files'],
): VersionManifest['changes'] {
  const curMap = new Map(current.map(f => [f.path, f]))
  const prevMap = new Map(previous.map(f => [f.path, f]))
  const added: string[] = []
  const modified: string[] = []
  const deleted: string[] = []
  for (const [path, file] of curMap) {
    const prev = prevMap.get(path)
    if (!prev) added.push(path)
    else if (prev.sha1 !== file.sha1) modified.push(path)
  }
  for (const path of prevMap.keys()) {
    if (!curMap.has(path)) deleted.push(path)
  }
  return { added, modified, deleted }
}

function checkAuth(request: Request): boolean {
  if (!AUTH_TOKEN) return true
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${AUTH_TOKEN}`
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname

    if (!checkAuth(request)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (path === '/knowledge/status' && request.method === 'GET') {
      const version = getLatestVersion()
      const currentFiles = getCurrentFiles()
      return Response.json({
        version,
        fileCount: currentFiles.length,
        lastModified: version > 0 ? loadVersion(version)?.timestamp ?? null : null,
      })
    }

    if (path === '/knowledge/pull' && request.method === 'GET') {
      const sinceVersion = Number(url.searchParams.get('since_version') ?? 0)
      const currentVersion = getLatestVersion()
      if (currentVersion <= sinceVersion) {
        return Response.json({ version: currentVersion, manifest: null, objects: {} })
      }
      const manifest = loadVersion(currentVersion)
      if (!manifest) {
        return Response.json({ version: 0, manifest: null, objects: {} })
      }
      const objects: Record<string, string> = {}
      if (sinceVersion > 0) {
        const prevManifest = loadVersion(sinceVersion)
        if (prevManifest) {
          const changes = computeChanges(manifest.files, prevManifest.files)
          const changedPaths = new Set([...changes.added, ...changes.modified])
          for (const file of manifest.files) {
            if (changedPaths.has(file.path)) {
              const obj = readObject(file.sha1)
              if (obj) objects[file.sha1] = obj.toString('base64')
            }
          }
        } else {
          for (const file of manifest.files) {
            const obj = readObject(file.sha1)
            if (obj) objects[file.sha1] = obj.toString('base64')
          }
        }
      } else {
        for (const file of manifest.files) {
          const obj = readObject(file.sha1)
          if (obj) objects[file.sha1] = obj.toString('base64')
        }
      }
      return Response.json({ version: currentVersion, manifest, objects })
    }

    if (path === '/knowledge/push' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          version: number
          files: VersionManifest['files']
          objects: Record<string, string>
        }

        for (const [sha1, content] of Object.entries(body.objects)) {
          writeObject(sha1, Buffer.from(content, 'base64'))
        }

        const previousVersion = getLatestVersion()
        const previousManifest = previousVersion > 0 ? loadVersion(previousVersion) : null
        const newVersion = previousVersion + 1

        const changes = computeChanges(
          body.files,
          previousManifest?.files ?? [],
        )

        const manifest: VersionManifest = {
          version: newVersion,
          timestamp: new Date().toISOString(),
          checksum: '',
          files: body.files,
          parentVersion: previousVersion,
          changes,
        }
        const checksumData = `${manifest.version}:${manifest.timestamp}:${manifest.files.map(f => `${f.path}:${f.sha1}`).join(',')}`
        manifest.checksum = createHash('sha256').update(checksumData).digest('hex')

        writeFileSync(
          join(VERSIONS_DIR, `v${newVersion}.json`),
          JSON.stringify(manifest, null, 2),
        )

        writeFileSync(
          join(DATA_DIR, 'current-manifest.json'),
          JSON.stringify({ files: body.files }, null, 2),
        )

        setLatestVersion(newVersion)

        return Response.json({ version: newVersion })
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : String(error) },
          { status: 400 },
        )
      }
    }

    if (path === '/knowledge/backup/list' && request.method === 'GET') {
      const versions: Array<{ version: number; timestamp: string; filesChanged: number }> = []
      for (const entry of readdirSync(VERSIONS_DIR)) {
        if (!entry.startsWith('v') || !entry.endsWith('.json')) continue
        try {
          const m = JSON.parse(readFileSync(join(VERSIONS_DIR, entry), 'utf8')) as VersionManifest
          versions.push({
            version: m.version,
            timestamp: m.timestamp,
            filesChanged: m.changes.added.length + m.changes.modified.length + m.changes.deleted.length,
          })
        } catch {}
      }
      versions.sort((a, b) => a.version - b.version)
      return Response.json({ versions })
    }

    if (path === '/health' && request.method === 'GET') {
      return Response.json({ status: 'ok', version: getLatestVersion() })
    }

    return Response.json({ error: 'Not found' }, { status: 404 })
  },
})

console.log(`Knowledge sync server running on http://localhost:${PORT}`)
console.log(`Data directory: ${DATA_DIR}`)
console.log(`Auth token: ${AUTH_TOKEN ? 'configured' : 'none (open access)'}`)
