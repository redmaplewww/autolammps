import { z } from 'zod/v4'
import { buildTool } from 'src/Tool.js'
import { WORKFLOW_STOP_TOOL_NAME } from './constants.js'

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to stop'),
})
type Input = typeof inputSchema
type WorkflowInput = z.infer<Input>

export const WorkflowStop = buildTool({
  name: WORKFLOW_STOP_TOOL_NAME,
  searchHint: 'stop a running workflow',
  maxResultSizeChars: 10_000,
  strict: true,
  inputSchema,
  async description() {
    return 'Stop a running workflow'
  },
  async prompt() {
    return 'Stub: not yet implemented.'
  },
  userFacingName() {
    return 'WorkflowStop'
  },
  isReadOnly() {
    return false
  },
  isEnabled() {
    return false
  },
  renderToolUseMessage(input: Partial<WorkflowInput>) {
    return `WorkflowStop: ${input.workflowId ?? 'unknown'}`
  },
  mapToolResultToToolResultBlockParam(content: { output: string }, toolUseID: string) {
    return { tool_use_id: toolUseID, type: 'tool_result', content: content.output }
  },
  async call(_input: WorkflowInput) {
    return { data: { output: 'WorkflowStop is not yet implemented.' } }
  },
})
