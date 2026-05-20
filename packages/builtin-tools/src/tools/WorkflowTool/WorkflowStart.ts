import { z } from 'zod/v4'
import { buildTool } from 'src/Tool.js'
import { WORKFLOW_START_TOOL_NAME } from './constants.js'

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to start'),
})
type Input = typeof inputSchema
type WorkflowInput = z.infer<Input>

export const WorkflowStart = buildTool({
  name: WORKFLOW_START_TOOL_NAME,
  searchHint: 'start a workflow',
  maxResultSizeChars: 10_000,
  strict: true,
  inputSchema,
  async description() {
    return 'Start an existing workflow'
  },
  async prompt() {
    return 'Stub: not yet implemented.'
  },
  userFacingName() {
    return 'WorkflowStart'
  },
  isReadOnly() {
    return false
  },
  isEnabled() {
    return false
  },
  renderToolUseMessage(input: Partial<WorkflowInput>) {
    return `WorkflowStart: ${input.workflowId ?? 'unknown'}`
  },
  mapToolResultToToolResultBlockParam(content: { output: string }, toolUseID: string) {
    return { tool_use_id: toolUseID, type: 'tool_result', content: content.output }
  },
  async call(_input: WorkflowInput) {
    return { data: { output: 'WorkflowStart is not yet implemented.' } }
  },
})
