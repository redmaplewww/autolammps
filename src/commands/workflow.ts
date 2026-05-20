import type { ToolUseContext } from '../Tool.js'
import type {
  Command,
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../types/command.js'
import { getWorkflowStyle, setWorkflowStyle } from '../bootstrap/state.js'
import {
  DEFAULT_WORKFLOW_STYLE,
  getWorkflowStyleLabel,
  getWorkflowStyleReminder,
  getWorkflowStyleSummary,
  type WorkflowStyle,
} from '../utils/workflowMode.js'

function parseWorkflowArg(raw: string): WorkflowStyle | null | undefined {
  const value = raw.trim().toLowerCase()
  if (value === '' || value === 'status') return null
  if (value === 'guided') return 'guided'
  if (value === 'auto' || value === 'autonomous') return 'autonomous'
  if (
    value === 'escalate' ||
    value === 'managed' ||
    value === 'auto-safe' ||
    value === 'autonomous-escalation'
  ) {
    return 'autonomous-escalation'
  }
  if (value === 'workflow-guided' || value === 'wg') return 'workflow-guided'
  if (value === 'workflow-semi' || value === 'ws') return 'workflow-semi'
  if (value === 'workflow-auto' || value === 'wa') return 'workflow-auto'
  return undefined
}

function formatStatus(style: WorkflowStyle): string {
  return [
    `Workflow mode: ${getWorkflowStyleLabel(style)}`,
    getWorkflowStyleSummary(style),
    '',
    'Usage: /workflow guided | auto | escalate | workflow-guided | workflow-semi | workflow-auto | status',
  ].join('\n')
}

const workflow = {
  type: 'local-jsx',
  name: 'workflow',
  description: 'Set workflow collaboration mode',
  argumentHint: '[guided|auto|escalate|status]',
  bridgeSafe: true,
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: ToolUseContext & LocalJSXCommandContext,
        args: string,
      ): Promise<React.ReactNode> {
        const current = getWorkflowStyle()
        const next = parseWorkflowArg(args)

        if (next === undefined) {
          onDone(
            'Unknown workflow mode. Use /workflow guided, /workflow auto, /workflow escalate, or /workflow status.',
            { display: 'system' },
          )
          return null
        }

        if (next === null) {
          onDone(formatStatus(current), { display: 'system' })
          return null
        }

        if (next === current) {
          onDone(
            `Workflow mode already set to ${getWorkflowStyleLabel(current)}.`,
            {
              display: 'system',
              metaMessages: [
                `<system-reminder>\n${getWorkflowStyleReminder(current)}\n</system-reminder>`,
              ],
            },
          )
          return null
        }

        setWorkflowStyle(next)
        context.setAppState(prev => ({
          ...prev,
          workflowStyle: next,
          toolPermissionContext: {
            ...prev.toolPermissionContext,
            workflowStyle: next,
          },
        }))

        const suffix = next === DEFAULT_WORKFLOW_STYLE ? ' (default)' : ''
        onDone(
          `Workflow mode set to ${getWorkflowStyleLabel(next)}${suffix}.`,
          {
            display: 'system',
            metaMessages: [
              `<system-reminder>\n${getWorkflowStyleReminder(next)}\n</system-reminder>`,
            ],
          },
        )
        return null
      },
    }),
} satisfies Command

export default workflow
