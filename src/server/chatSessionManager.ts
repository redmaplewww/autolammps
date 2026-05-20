import { spawn, type ChildProcess } from 'child_process'
import { join } from 'path'
import { randomUUID } from 'crypto'

export type ChatSessionState = 'idle' | 'running' | 'waiting' | 'error'

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export type StreamEvent =
  | { type: 'thinking'; content: string }
  | { type: 'text'; content: string }
  | { type: 'tool_use'; name: string; input: string }
  | { type: 'tool_result'; content: string; isError: boolean }
  | { type: 'question'; content: string; toolInput: string }
  | { type: 'error'; message: string }
  | { type: 'done'; result: string; cliSessionId: string | null; cost?: number }

export type ChatSession = {
  webSessionId: string
  cliSessionId: string | null
  state: ChatSessionState
  messages: ChatMessage[]
  createdAt: number
  lastError: string | null
  waitingForInput: boolean
  pendingQuestion: string | null
}

const LOG_PREFIX = '[ChatMgr]'

export class ChatSessionManager {
  private sessions = new Map<string, ChatSession>()
  private processes = new Map<string, ChildProcess>()
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>()
  private stdinWriters = new Map<string, (answer: string) => boolean>()

  private log(...args: unknown[]): void {
    console.error(LOG_PREFIX, ...args)
  }

  async createSession(): Promise<ChatSession> {
    const webSessionId = randomUUID()
    const session: ChatSession = {
      webSessionId,
      cliSessionId: null,
      state: 'idle',
      messages: [],
      createdAt: Date.now(),
      lastError: null,
      waitingForInput: false,
      pendingQuestion: null,
    }
    this.sessions.set(webSessionId, session)
    this.log(`Created session ${webSessionId.slice(0, 8)}`)
    return session
  }

  getSession(webSessionId: string): ChatSession | undefined {
    return this.sessions.get(webSessionId)
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values())
  }

  getRunningCount(): number {
    let count = 0
    for (const s of this.sessions.values()) {
      if (s.state === 'running' || s.state === 'waiting') count++
    }
    return count
  }

  cancelSession(webSessionId: string): boolean {
    const proc = this.processes.get(webSessionId)
    if (proc) {
      try {
        proc.kill('SIGTERM')
      } catch {
        /* ignore */
      }
      this.processes.delete(webSessionId)
    }
    this.stdinWriters.delete(webSessionId)
    this.cleanupTimer(webSessionId)
    const session = this.sessions.get(webSessionId)
    if (
      session &&
      (session.state === 'running' || session.state === 'waiting')
    ) {
      session.state = 'idle'
      session.waitingForInput = false
      session.pendingQuestion = null
      session.lastError = 'Cancelled by user'
      this.log(`Cancelled session ${webSessionId.slice(0, 8)}`)
      return true
    }
    return false
  }

  removeSession(webSessionId: string): void {
    this.cancelSession(webSessionId)
    this.sessions.delete(webSessionId)
    this.log(`Removed session ${webSessionId.slice(0, 8)}`)
  }

  sendInput(webSessionId: string, answer: string): boolean {
    const writer = this.stdinWriters.get(webSessionId)
    const session = this.sessions.get(webSessionId)
    if (!writer || !session) {
      this.log(`No stdin writer for ${webSessionId.slice(0, 8)}`)
      return false
    }
    if (!session.waitingForInput) {
      this.log(`Session ${webSessionId.slice(0, 8)} is not waiting for input`)
      return false
    }
    this.log(
      `Sending input to ${webSessionId.slice(0, 8)}: "${answer.slice(0, 50)}..."`,
    )
    session.waitingForInput = false
    session.pendingQuestion = null
    session.messages.push({
      role: 'user',
      content: answer,
      timestamp: Date.now(),
    })
    const ok = writer(answer)
    if (ok) {
      session.state = 'running'
      this.stdinWriters.delete(webSessionId)
    } else {
      session.state = 'error'
      session.lastError = 'Failed to send input'
    }
    return ok
  }

  async sendMessage(
    webSessionId: string,
    message: string,
    callbacks: {
      onStreamEvent: (event: StreamEvent) => void
      onError: (err: string) => void
      onDone: () => void
    },
  ): Promise<void> {
    const session = this.sessions.get(webSessionId)
    if (!session) {
      callbacks.onError('Session not found')
      return
    }
    if (session.state === 'running' || session.state === 'waiting') {
      callbacks.onError(
        `Session is busy (${this.getRunningCount()} other session(s) running)`,
      )
      return
    }

    session.state = 'running'
    session.waitingForInput = false
    session.pendingQuestion = null
    session.lastError = null
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: Date.now(),
    })

    const entrypoint = join(process.cwd(), 'src/entrypoints/cli.tsx')
    const args = [
      'run',
      entrypoint,
      '-p',
      '--output-format=stream-json',
      '--verbose',
    ]
    if (session.cliSessionId) args.push('--resume', session.cliSessionId)

    const useArgs = message.length < 200
    this.log(
      `Sending to ${webSessionId.slice(0, 8)}${session.cliSessionId ? ' (resume ' + session.cliSessionId.slice(0, 8) + ')' : ''}: "${message.slice(0, 50)}..."`,
    )

    try {
      const proc = spawn('bun', useArgs ? [...args, message] : args, {
        cwd: process.cwd(),
        stdio: useArgs ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      })

      this.processes.set(webSessionId, proc)
      let fullOutput = ''
      let errorOutput = ''
      let lineBuffer = ''
      let assistantText = ''

      // Write initial message via stdin (for long messages) and keep stdin open
      if (!useArgs) {
        try {
          proc.stdin!.write(message + '\n')
        } catch {
          /* ignore */
        }
      }

      // Setup a stdin writer that the browser can call later (for answering questions)
      this.stdinWriters.set(webSessionId, (answer: string) => {
        try {
          proc.stdin!.write(answer + '\n')
          return true
        } catch {
          return false
        }
      })

      proc.stdout!.on('data', (data: Buffer) => {
        lineBuffer += data.toString()
        const lines = lineBuffer.split('\n')
        lineBuffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          fullOutput += trimmed + '\n'

          try {
            const json = JSON.parse(trimmed)
            const text = this.parseStreamEvent(
              json,
              callbacks.onStreamEvent,
              webSessionId,
            )
            if (text) assistantText += text
          } catch {
            callbacks.onStreamEvent({ type: 'text', content: trimmed })
          }
        }
      })

      proc.stderr!.on('data', (data: Buffer) => {
        errorOutput += data.toString()
      })

      proc.on('error', err => {
        this.processes.delete(webSessionId)
        this.stdinWriters.delete(webSessionId)
        this.cleanupTimer(webSessionId)
        session.state = 'error'
        session.waitingForInput = false
        session.lastError = err.message
        this.log(`Process error: ${err.message}`)
        try {
          callbacks.onError(err.message)
        } catch {
          /* ignore */
        }
      })

      proc.on('exit', (code, signal) => {
        this.processes.delete(webSessionId)
        this.stdinWriters.delete(webSessionId)
        this.cleanupTimer(webSessionId)
        session.state = 'idle'
        session.waitingForInput = false
        session.pendingQuestion = null

        if (signal === 'SIGTERM' || signal === 'SIGKILL') {
          session.lastError = 'Cancelled'
          try {
            callbacks.onDone()
          } catch {
            /* ignore */
          }
          return
        }

        if (lineBuffer.trim()) {
          callbacks.onStreamEvent({ type: 'text', content: lineBuffer.trim() })
        }

        const cliSessionId = session.cliSessionId
        callbacks.onStreamEvent({
          type: 'done',
          result: fullOutput,
          cliSessionId,
          cost: undefined,
        })

        if (!session.cliSessionId) {
          const sid = this.extractSessionId(fullOutput)
          if (sid) session.cliSessionId = sid
        }

        const finalContent = (assistantText || fullOutput || errorOutput).trim()
        if (finalContent) {
          session.messages.push({
            role: 'assistant',
            content: finalContent,
            timestamp: Date.now(),
          })
        }

        this.log(
          `Done: ${webSessionId.slice(0, 8)} exit=${code}, msgs=${session.messages.length}, cli=${session.cliSessionId ? session.cliSessionId.slice(0, 8) : 'null'}`,
        )
        try {
          callbacks.onDone()
        } catch {
          /* ignore */
        }
      })

      const timer = setTimeout(() => {
        const p = this.processes.get(webSessionId)
        if (p) {
          try {
            p.kill('SIGTERM')
          } catch {
            /* ignore */
          }
          this.processes.delete(webSessionId)
        }
        this.stdinWriters.delete(webSessionId)
        this.timeouts.delete(webSessionId)
        const s = this.sessions.get(webSessionId)
        if (s && (s.state === 'running' || s.state === 'waiting')) {
          s.state = 'idle'
          s.waitingForInput = false
          s.lastError = 'Timed out'
          try {
            callbacks.onError('Timed out after 5 minutes')
          } catch {
            /* ignore */
          }
        }
      }, 300_000)
      this.timeouts.set(webSessionId, timer)
    } catch (err) {
      this.processes.delete(webSessionId)
      this.stdinWriters.delete(webSessionId)
      this.cleanupTimer(webSessionId)
      session.state = 'error'
      session.waitingForInput = false
      const msg = err instanceof Error ? err.message : String(err)
      session.lastError = msg
      try {
        callbacks.onError(msg)
      } catch {
        /* ignore */
      }
    }
  }

  private parseStreamEvent(
    json: Record<string, unknown>,
    emit: (ev: StreamEvent) => void,
    webSessionId: string,
  ): string | null {
    const type = json.type as string
    let textAccum = ''

    if (type === 'assistant') {
      const msg = json.message as Record<string, unknown> | undefined
      const content = msg?.content as Array<Record<string, unknown>> | undefined
      if (content) {
        for (const block of content) {
          const bt = block.type as string
          // Detect AskUserQuestion tool use → emit a question event
          if (
            bt === 'tool_use' &&
            (block.name as string) === 'AskUserQuestion'
          ) {
            const q =
              ((block.input as Record<string, unknown>)?.question as string) ||
              ''
            const session = this.sessions.get(webSessionId)
            if (session) {
              session.waitingForInput = true
              session.pendingQuestion = q
              session.state = 'waiting'
              this.log(
                `Question from ${webSessionId.slice(0, 8)}: "${q.slice(0, 100)}..."`,
              )
            }
            emit({
              type: 'question',
              content: q,
              toolInput: JSON.stringify(block.input),
            })
            continue
          }
          this.emitContentBlock(block, emit, t => {
            textAccum += t
          })
        }
      }
    } else if (
      type === 'thinking' ||
      type === 'text' ||
      type === 'tool_use' ||
      type === 'tool_result'
    ) {
      this.emitContentBlock(json, emit, t => {
        textAccum += t
      })
    }

    return textAccum || null
  }

  private emitContentBlock(
    block: Record<string, unknown>,
    emit: (ev: StreamEvent) => void,
    onText: (text: string) => void,
  ): void {
    const bt = block.type as string
    if (bt === 'thinking') {
      emit({ type: 'thinking', content: (block.thinking as string) || '' })
    } else if (bt === 'text') {
      const txt = (block.text as string) || ''
      onText(txt)
      emit({ type: 'text', content: txt })
    } else if (bt === 'tool_use') {
      emit({
        type: 'tool_use',
        name: (block.name as string) || 'unknown',
        input: JSON.stringify(block.input, null, 2) || '',
      })
    } else if (bt === 'tool_result') {
      const raw = block.content
      const txt = typeof raw === 'string' ? raw : JSON.stringify(raw)
      emit({
        type: 'tool_result',
        content: txt.slice(0, 2000),
        isError: (block.is_error as boolean) || false,
      })
    }
  }

  private extractSessionId(output: string): string | null {
    const m = output.match(/session_id["']?\s*[:=]\s*["']([0-9a-f-]+)["']/)
    return m ? m[1] : null
  }

  private cleanupTimer(webSessionId: string): void {
    const timer = this.timeouts.get(webSessionId)
    if (timer) {
      clearTimeout(timer)
      this.timeouts.delete(webSessionId)
    }
  }

  cleanup(): void {
    for (const [, proc] of this.processes) {
      try {
        proc.kill('SIGTERM')
      } catch {
        /* ignore */
      }
    }
    for (const [, timer] of this.timeouts) clearTimeout(timer)
    this.processes.clear()
    this.timeouts.clear()
    this.stdinWriters.clear()
    this.sessions.clear()
  }
}
