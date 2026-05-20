import type { ToolUseContext } from '../Tool.js'
import type {
  Command,
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../types/command.js'
import { setWorkflowStyle } from '../bootstrap/state.js'
import {
  getWorkflowStyleLabel,
  getWorkflowStyleReminder,
  getWorkflowStyleSummary,
  type WorkflowStyle,
} from '../utils/workflowMode.js'

function formatStatus(style: WorkflowStyle): string {
  return [
    `Workflow mode: ${getWorkflowStyleLabel(style)}`,
    getWorkflowStyleSummary(style),
    '',
    'Usage: /workflow-guided [workflow description]',
    'With args: sets mode and starts guided workflow execution.',
    'Without args: sets mode only.',
  ].join('\n')
}

const workflowGuided = {
  type: 'local-jsx',
  name: 'workflow-guided',
  description:
    'Start workflow in guided mode — step-by-step user confirmation at every stage',
  argumentHint: '[workflow description]',
  bridgeSafe: true,
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: ToolUseContext & LocalJSXCommandContext,
        args: string,
      ): Promise<React.ReactNode> {
        const next: WorkflowStyle = 'workflow-guided'

        setWorkflowStyle(next)
        context.setAppState(prev => ({
          ...prev,
          workflowStyle: next,
          toolPermissionContext: {
            ...prev.toolPermissionContext,
            workflowStyle: next,
          },
        }))

        const task = args.trim()
        onDone(formatStatus(next), {
          display: 'system',
          ...(task
            ? {
                nextInput: task,
                submitNextInput: true,
              }
            : {}),
          metaMessages: [
            `<system-reminder>\n${getWorkflowStyleReminder(next)}\n</system-reminder>`,
          ],
        })
        return null
      },
    }),
} satisfies Command

export default workflowGuided
