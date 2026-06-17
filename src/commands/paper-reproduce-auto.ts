// @ts-nocheck
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
    'Usage: /paper-reproduce-auto [DOI|PDF path|URL|title]',
    'Sets workflow-auto mode and launches the paper reproduction audit skill.',
  ].join('\n')
}

const paperReproduceAuto = {
  type: 'local-jsx',
  name: 'paper-reproduce-auto',
  description:
    'Set workflow-auto mode and launch the paper reproduction audit skill',
  argumentHint: '[DOI|PDF path|URL|title]',
  bridgeSafe: true,
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: ToolUseContext & LocalJSXCommandContext,
        args: string,
      ): Promise<React.ReactNode> {
        const next: WorkflowStyle = 'workflow-auto'

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
                nextInput: `/lammps-paper-reproduction-auditor ${task}`,
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

export default paperReproduceAuto
