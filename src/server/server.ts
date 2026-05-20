import { readFileSync } from 'fs'
import { join, extname } from 'path'
import { SessionManager } from './sessionManager.js'
import { ChatSessionManager } from './chatSessionManager.js'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

type WsClient = { send: (data: string) => void }
const wsClients = new Set<WsClient>()

function broadcast(data: unknown): void {
  const msg = JSON.stringify(data)
  for (const client of wsClients) {
    try {
      client.send(msg)
    } catch {
      wsClients.delete(client)
    }
  }
}

const sessionManager = new SessionManager()
const chatManager = new ChatSessionManager()
let initialized = false

function ensureInit(): void {
  if (initialized) return
  initialized = true
  sessionManager.refreshSessions()
  sessionManager.refreshTasks()
  sessionManager.startWatching(3000)
  sessionManager.onUpdate(() => {
    broadcast({ type: 'sessions_updated' })
  })
}

function createServer(
  port: number,
  host: string,
): ReturnType<typeof Bun.serve> {
  ensureInit()

  const server = Bun.serve({
    port,
    hostname: host,

    async fetch(
      this: { upgrade: (req: Request) => boolean },
      req: Request,
    ): Promise<Response | undefined> {
      // Handle WebSocket upgrade
      if (this.upgrade(req)) return

      const url = new URL(req.url)
      const path = url.pathname

      // ── Existing API routes ──

      if (path === '/api/sessions' && req.method === 'GET') {
        return Response.json(sessionManager.getAllSessions(), {
          headers: { 'Access-Control-Allow-Origin': '*' },
        })
      }

      if (
        path.startsWith('/api/sessions/') &&
        req.method === 'GET' &&
        !path.endsWith('/chat')
      ) {
        const id = path.split('/api/sessions/')[1]
        const summary = sessionManager.getSession(id)
        if (!summary) return new Response('Not found', { status: 404 })
        const messages = await sessionManager.getSessionMessages(id)
        return Response.json(
          { ...summary, messages },
          {
            headers: { 'Access-Control-Allow-Origin': '*' },
          },
        )
      }

      if (path === '/api/tasks' && req.method === 'GET') {
        await sessionManager.refreshTasks()
        return Response.json(sessionManager.getAllTasks(), {
          headers: { 'Access-Control-Allow-Origin': '*' },
        })
      }

      if (path === '/api/refresh' && req.method === 'POST') {
        await sessionManager.refreshSessions()
        await sessionManager.refreshTasks()
        return Response.json(
          { ok: true },
          {
            headers: { 'Access-Control-Allow-Origin': '*' },
          },
        )
      }

      // GET /api/health - server health check
      if (path === '/api/health' && req.method === 'GET') {
        return Response.json(
          {
            status: 'ok',
            sessions: sessionManager.getAllSessions().length,
            chatSessions: chatManager.getAllSessions().length,
            running: chatManager.getRunningCount(),
            port,
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache',
            },
          },
        )
      }

      // ── Chat API ──

      // GET /api/chat/sessions - list active chat sessions
      if (path === '/api/chat/sessions' && req.method === 'GET') {
        const sessions = chatManager.getAllSessions().map(s => ({
          webSessionId: s.webSessionId,
          cliSessionId: s.cliSessionId,
          state: s.state,
          messageCount: s.messages.length,
          lastMessage:
            s.messages[s.messages.length - 1]?.content.slice(0, 100) || '',
          createdAt: s.createdAt,
        }))
        return Response.json(sessions, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        })
      }

      // POST /api/chat/sessions - create new chat session
      if (path === '/api/chat/sessions' && req.method === 'POST') {
        const session = await chatManager.createSession()
        return Response.json(
          {
            webSessionId: session.webSessionId,
            cliSessionId: session.cliSessionId,
            state: session.state,
            messages: session.messages,
          },
          {
            headers: { 'Access-Control-Allow-Origin': '*' },
          },
        )
      }

      // GET /api/chat/sessions/:id - get chat session details + messages
      if (path.startsWith('/api/chat/sessions/') && req.method === 'GET') {
        const id = path.split('/api/chat/sessions/')[1]
        const session = chatManager.getSession(id)
        if (!session) return new Response('Not found', { status: 404 })

        return Response.json(
          {
            webSessionId: session.webSessionId,
            cliSessionId: session.cliSessionId,
            state: session.state,
            messages: session.messages,
            createdAt: session.createdAt,
            cliSession: session.cliSessionId
              ? sessionManager.getSession(session.cliSessionId)
              : null,
          },
          {
            headers: { 'Access-Control-Allow-Origin': '*' },
          },
        )
      }

      // POST /api/chat/sessions/:id/input - send user input (answer a question from CLI)
      if (
        path.match(/^\/api\/chat\/sessions\/[^/]+\/input$/) &&
        req.method === 'POST'
      ) {
        const id = path.split('/')[4]
        const body = (await req.json()) as { answer?: string }
        if (!body.answer || !body.answer.trim()) {
          return Response.json({ error: 'Answer is required' }, { status: 400 })
        }
        const ok = chatManager.sendInput(id, body.answer)
        if (!ok) {
          return Response.json(
            { error: 'Session is not waiting for input or not found' },
            { status: 400 },
          )
        }
        broadcast({
          type: 'chat:input_sent',
          webSessionId: id,
          answer: body.answer,
        })
        return Response.json(
          { status: 'sent' },
          {
            headers: { 'Access-Control-Allow-Origin': '*' },
          },
        )
      }

      // POST /api/chat/sessions/:id/message - send a message
      if (
        path.match(/^\/api\/chat\/sessions\/[^/]+\/message$/) &&
        req.method === 'POST'
      ) {
        const id = path.split('/')[4]
        const body = (await req.json()) as { message?: string }

        if (!body.message || !body.message.trim()) {
          return Response.json(
            { error: 'Message is required' },
            { status: 400 },
          )
        }

        const session = chatManager.getSession(id)
        if (!session) return new Response('Not found', { status: 404 })

        if (session.state === 'running') {
          return Response.json({ error: 'Session is busy' }, { status: 409 })
        }

        // Send message - stream events come via WebSocket
        chatManager.sendMessage(id, body.message, {
          onStreamEvent: event => {
            broadcast({
              type: 'chat:stream_event',
              webSessionId: id,
              event,
            })
          },
          onError: err => {
            broadcast({
              type: 'chat:error',
              webSessionId: id,
              error: err,
            })
          },
          onDone: () => {
            const s = chatManager.getSession(id)
            broadcast({
              type: 'chat:done',
              webSessionId: id,
              cliSessionId: s?.cliSessionId || null,
            })
            sessionManager.refreshSessions()
          },
        })

        return Response.json(
          { status: 'processing' },
          {
            headers: { 'Access-Control-Allow-Origin': '*' },
          },
        )
      }

      // POST /api/chat/sessions/:id/resume - resume a CLI session from disk
      if (
        path.match(/^\/api\/chat\/sessions\/[^/]+\/resume$/) &&
        req.method === 'POST'
      ) {
        const id = path.split('/')[4]
        const body = (await req.json()) as { cliSessionId?: string }
        const session = chatManager.getSession(id)
        if (!session) return new Response('Not found', { status: 404 })
        session.cliSessionId = body.cliSessionId || null
        return Response.json(
          { ok: true },
          {
            headers: { 'Access-Control-Allow-Origin': '*' },
          },
        )
      }

      // POST /api/chat/sessions/:id/cancel - cancel a running request
      if (
        path.match(/^\/api\/chat\/sessions\/[^/]+\/cancel$/) &&
        req.method === 'POST'
      ) {
        const id = path.split('/')[4]
        const cancelled = chatManager.cancelSession(id)
        broadcast({
          type: 'chat:cancelled',
          webSessionId: id,
        })
        return Response.json(
          { ok: cancelled },
          {
            headers: { 'Access-Control-Allow-Origin': '*' },
          },
        )
      }

      // DELETE /api/chat/sessions/:id - delete a chat session
      if (path.startsWith('/api/chat/sessions/') && req.method === 'DELETE') {
        const id = path.split('/')[4]
        chatManager.removeSession(id)
        return Response.json(
          { ok: true },
          {
            headers: { 'Access-Control-Allow-Origin': '*' },
          },
        )
      }

      if (req.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        })
      }

      // ── Static files ──
      let filePath: string
      if (path === '/' || path === '/index.html') {
        filePath = join(import.meta.dir, 'public', 'index.html')
      } else {
        filePath = join(import.meta.dir, 'public', path)
      }

      try {
        const content = readFileSync(filePath)
        const ext = extname(filePath)
        return new Response(content, {
          headers: {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          },
        })
      } catch {
        try {
          const html = readFileSync(
            join(import.meta.dir, 'public', 'index.html'),
            'utf-8',
          )
          return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
        } catch {
          return new Response('Not found', { status: 404 })
        }
      }
    },

    websocket: {
      open(ws: { send: (data: string) => void }): void {
        wsClients.add(ws)
        try {
          ws.send(
            JSON.stringify({
              type: 'connected',
              data: {
                sessions: sessionManager.getAllSessions(),
                tasks: sessionManager.getAllTasks(),
                chatSessions: chatManager.getAllSessions().map(s => ({
                  webSessionId: s.webSessionId,
                  cliSessionId: s.cliSessionId,
                  state: s.state,
                  messageCount: s.messages.length,
                  lastMessage:
                    s.messages[s.messages.length - 1]?.content.slice(0, 100) ||
                    '',
                  createdAt: s.createdAt,
                })),
              },
            }),
          )
        } catch {
          /* ignore */
        }
      },
      close(ws: { send: (data: string) => void }): void {
        wsClients.delete(ws)
      },
      message(ws: { send: (data: string) => void }, message: string): void {
        try {
          const msg = JSON.parse(message as string)
          if (msg.type === 'refresh') {
            sessionManager.refreshSessions()
            sessionManager.refreshTasks()
          }
        } catch {
          /* ignore */
        }
      },
    },
  })
}

export function startDashboard(options?: { port?: number; host?: string }): {
  port: number
  stop: (closeActiveConnections?: boolean) => void
  sessionManager: SessionManager
  chatManager: ChatSessionManager
} {
  const port = options?.port ?? 3760
  const host = options?.host ?? '0.0.0.0'
  const server = createServer(port, host)
  console.log(`\n  🌐 Dashboard: http://localhost:${port}\n`)
  return {
    port,
    stop: () => {
      sessionManager.stopWatching()
      chatManager.cleanup()
      server.stop()
    },
    sessionManager,
    chatManager,
  }
}

// Old stub-compatible API for main.tsx daemon-worker path
export const startServer = (
  _config?: Record<string, unknown>,
  _sessionManager?: { destroyAll: () => Promise<void> },
  _logger?: Record<string, unknown>,
): { port?: number; stop: (closeActiveConnections: boolean) => void } => {
  const server = createServer(3760, '0.0.0.0')
  return {
    port: 3760,
    stop: () => {
      sessionManager.stopWatching()
      server.stop()
    },
  }
}

export { SessionManager }
