import { z } from 'zod/v4'
import { buildTool } from 'src/Tool.js'
import { WORKFLOW_LIST_TOOL_NAME } from './constants.js'

const inputSchema = z.object({})
type Input = typeof inputSchema
type WorkflowInput = z.infer<Input>

export const WorkflowList = buildTool({
  name: WORKFLOW_LIST_TOOL_NAME,
  searchHint: 'list all workflows',
  maxResultSizeChars: 10_000,
  strict: true,
  inputSchema,
  async description() {
    return 'List all available workflows and their statuses'
  },
  async prompt() {
    return 'Stub: not yet implemented.'
  },
  userFacingName() {
    return 'WorkflowList'
  },
  isReadOnly() {
    return true
  },
  isEnabled() {
    return false
  },
  renderToolUseMessage(_input: Partial<WorkflowInput>) {
    return 'WorkflowList'
  },
  mapToolResultToToolResultBlockParam(content: { output: string }, toolUseID: string) {
    return { tool_use_id: toolUseID, type: 'tool_result', content: content.output }
  },
  async call(_input: WorkflowInput) {
    return { data: { output: 'WorkflowList is not yet implemented.' } }
  },
})
