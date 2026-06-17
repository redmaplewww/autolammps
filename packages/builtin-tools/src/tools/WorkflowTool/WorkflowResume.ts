import { z } from 'zod/v4'
import { buildTool } from 'src/Tool.js'
import { WORKFLOW_RESUME_TOOL_NAME } from './constants.js'

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to resume'),
})
type Input = typeof inputSchema
type WorkflowInput = z.infer<Input>

export const WorkflowResume = buildTool({
  name: WORKFLOW_RESUME_TOOL_NAME,
  searchHint: 'resume a paused workflow',
  maxResultSizeChars: 10_000,
  strict: true,
  inputSchema,
  async description() {
    return 'Resume a paused or stopped workflow'
  },
  async prompt() {
    return 'Stub: not yet implemented.'
  },
  userFacingName() {
    return 'WorkflowResume'
  },
  isReadOnly() {
    return false
  },
  isEnabled() {
    return false
  },
  renderToolUseMessage(input: Partial<WorkflowInput>) {
    return `WorkflowResume: ${input.workflowId ?? 'unknown'}`
  },
  mapToolResultToToolResultBlockParam(content: { output: string }, toolUseID: string) {
    return { tool_use_id: toolUseID, type: 'tool_result', content: content.output }
  },
  async call(_input: WorkflowInput) {
    return { data: { output: 'WorkflowResume is not yet implemented.' } }
  },
})
