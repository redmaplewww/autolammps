import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises'
import { join, basename, extname, dirname } from 'path'
import { existsSync } from 'fs'
import { getAppConfigHomeDir } from '../utils/envUtils.js'

export type SessionSummary = {
  id: string
  projectDir: string
  createdAt: number
  lastActiveAt: number
  messageCount: number
  firstPrompt: string
  fileSize: number
  status: 'active' | 'completed'
}

export type SessionMessage = {
  index: number
  type: string
  uuid: string
  parentUuid: string | null
  timestamp: string | null
  role: string | null
  content: string | null
  raw: Record<string, unknown>
}

export type SessionDetail = SessionSummary & {
  messages: SessionMessage[]
}

export type TaskSummary = {
  id: string
  sessionId: string
  type: string
  description: string
  status: string
  startTime: number
  endTime?: number
}

export class SessionManager {
  private projectsDir: string
  private sessionsCache: Map<string, SessionSummary> = new Map()
  private tasksCache: Map<string, TaskSummary[]> = new Map()
  private watcher: ReturnType<typeof setInterval> | null = null
  private listeners: Set<() => void> = new Set()

  constructor(_backend?: unknown, _config?: Record<string, unknown>) {
    this.projectsDir = join(getAppConfigHomeDir(), 'projects')
  }

  async destroyAll(): Promise<void> {
    this.stopWatching()
  }

  onUpdate(cb: () => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private notifyUpdate(): void {
    for (const cb of this.listeners) cb()
  }

  startWatching(intervalMs = 3000): void {
    if (this.watcher) return
    this.watcher = setInterval(async () => {
      await this.refreshSessions()
    }, intervalMs)
  }

  stopWatching(): void {
    if (this.watcher) {
      clearInterval(this.watcher)
      this.watcher = null
    }
  }

  async refreshSessions(): Promise<void> {
    const projectsDir = this.projectsDir
    let projectDirs: string[]
    try {
      projectDirs = await readdir(projectsDir)
    } catch {
      return
    }

    const allSessions: SessionSummary[] = []

    for (const projectHash of projectDirs) {
      const projectPath = join(projectsDir, projectHash)
      let entries: string[]
      try {
        const st = await stat(projectPath)
        if (!st.isDirectory()) continue
        entries = await readdir(projectPath)
      } catch {
        continue
      }

      for (const entry of entries) {
        if (extname(entry) !== '.jsonl') continue
        const sessionId = basename(entry, '.jsonl')
        const fullPath = join(projectPath, entry)

        try {
          const st = await stat(fullPath)
          const summary = await this.readSessionSummary(
            fullPath,
            sessionId,
            projectHash,
          )
          summary.fileSize = st.size
          allSessions.push(summary)
        } catch {
          // skip unreadable files
        }
      }
    }

    allSessions.sort((a, b) => b.lastActiveAt - a.lastActiveAt)
    for (const s of allSessions) {
      this.sessionsCache.set(s.id, s)
    }

    // Remove stale entries
    const currentIds = new Set(allSessions.map(s => s.id))
    for (const [id] of this.sessionsCache) {
      if (!currentIds.has(id)) this.sessionsCache.delete(id)
    }

    this.notifyUpdate()
  }

  private async readSessionSummary(
    fullPath: string,
    sessionId: string,
    projectHash: string,
  ): Promise<SessionSummary> {
    const content = await readFile(fullPath, 'utf-8')
    const lines = content.split('\n').filter(l => l.trim())
    let createdAt = 0
    let lastActiveAt = 0
    let firstPrompt = ''
    let messageCount = 0

    for (const line of lines) {
      try {
        const entry = JSON.parse(line)
        if (entry.type === 'user' && entry.message?.content) {
          const text =
            typeof entry.message.content === 'string'
              ? entry.message.content
              : JSON.stringify(entry.message.content)
          if (text.length > 10 && !text.startsWith('<') && !firstPrompt) {
            firstPrompt = text.slice(0, 200)
          }
          messageCount++
        } else if (entry.type === 'assistant') {
          messageCount++
        }
        const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : 0
        if (ts && (!createdAt || ts < createdAt)) createdAt = ts
        if (ts && ts > lastActiveAt) lastActiveAt = ts
      } catch {
        // skip malformed lines
      }
    }

    if (!createdAt) createdAt = Date.now()
    if (!lastActiveAt) lastActiveAt = createdAt

    return {
      id: sessionId,
      projectDir: projectHash,
      createdAt,
      lastActiveAt,
      messageCount,
      firstPrompt: firstPrompt || '(empty)',
      fileSize: 0,
      status: 'completed',
    }
  }

  async getSessionMessages(sessionId: string): Promise<SessionMessage[]> {
    const projectsDir = this.projectsDir
    let projectDirs: string[]
    try {
      projectDirs = await readdir(projectsDir)
    } catch {
      return []
    }

    for (const projectHash of projectDirs) {
      const sessionPath = join(projectsDir, projectHash, `${sessionId}.jsonl`)
      if (!existsSync(sessionPath)) continue
      try {
        const content = await readFile(sessionPath, 'utf-8')
        const lines = content.split('\n').filter(l => l.trim())
        const messages: SessionMessage[] = []
        let index = 0

        for (const line of lines) {
          try {
            const entry = JSON.parse(line)
            if (entry.type === 'user' || entry.type === 'assistant') {
              let role: string | null = entry.message?.role || entry.type
              let content: string | null = null

              const msgContent = entry.message?.content
              if (typeof msgContent === 'string') {
                content = msgContent
              } else if (Array.isArray(msgContent)) {
                content = msgContent
                  .map((c: Record<string, unknown>) => {
                    if (c.type === 'text' && typeof c.text === 'string')
                      return c.text
                    if (c.type === 'tool_use')
                      return `[Tool: ${c.name}]\n${JSON.stringify(c.input)}`
                    if (c.type === 'tool_result')
                      return `[Tool Result]\n${typeof c.content === 'string' ? c.content : JSON.stringify(c.content)}`
                    return JSON.stringify(c)
                  })
                  .filter(Boolean)
                  .join('\n')
              }

              messages.push({
                index: index++,
                type: entry.type,
                uuid: entry.uuid,
                parentUuid: entry.parentUuid || null,
                timestamp: entry.timestamp || null,
                role,
                content: content?.slice(0, 5000) || null,
                raw: entry,
              })
            }
          } catch {
            // skip
          }
        }
        return messages
      } catch {
        return []
      }
    }
    return []
  }

  getAllSessions(): SessionSummary[] {
    return Array.from(this.sessionsCache.values())
  }

  getSession(id: string): SessionSummary | undefined {
    return this.sessionsCache.get(id)
  }

  // Task tracking (via todo list file)
  private getTodoFilePath(): string {
    return join(getAppConfigHomeDir(), 'todo.json')
  }

  async refreshTasks(): Promise<void> {
    const todoPath = this.getTodoFilePath()
    try {
      const content = await readFile(todoPath, 'utf-8')
      const data = JSON.parse(content)
      const tasks: TaskSummary[] = []
      if (Array.isArray(data)) {
        for (const item of data) {
          tasks.push({
            id: item.id || `t-${Math.random().toString(36).slice(2, 8)}`,
            sessionId: item.sessionId || '',
            type: item.type || 'todo',
            description: item.description || item.subject || '',
            status: item.status || 'pending',
            startTime: item.createdAt || item.startTime || Date.now(),
            endTime: item.completedAt || item.endTime,
          })
        }
      }
      this.tasksCache.set('global', tasks)
      this.notifyUpdate()
    } catch {
      // no todo file yet
    }
  }

  getAllTasks(): TaskSummary[] {
    return this.tasksCache.get('global') || []
  }
}
