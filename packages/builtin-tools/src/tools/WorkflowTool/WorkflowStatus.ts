import { z } from 'zod/v4'
import { buildTool } from 'src/Tool.js'
import { WORKFLOW_STATUS_TOOL_NAME } from './constants.js'

const inputSchema = z.object({
  workflowId: z.string().optional().describe('ID of the workflow to query'),
})
type Input = typeof inputSchema
type WorkflowInput = z.infer<Input>

export const WorkflowStatus = buildTool({
  name: WORKFLOW_STATUS_TOOL_NAME,
  searchHint: 'get workflow status',
  maxResultSizeChars: 10_000,
  strict: true,
  inputSchema,
  async description() {
    return 'Get the status of the current or specified workflow'
  },
  async prompt() {
    return 'Stub: not yet implemented.'
  },
  userFacingName() {
    return 'WorkflowStatus'
  },
  isReadOnly() {
    return true
  },
  isEnabled() {
    return false
  },
  renderToolUseMessage(input: Partial<WorkflowInput>) {
    return `WorkflowStatus: ${input.workflowId ?? 'current'}`
  },
  mapToolResultToToolResultBlockParam(content: { output: string }, toolUseID: string) {
    return { tool_use_id: toolUseID, type: 'tool_result', content: content.output }
  },
  async call(_input: WorkflowInput) {
    return { data: { output: 'WorkflowStatus is not yet implemented.' } }
  },
})
