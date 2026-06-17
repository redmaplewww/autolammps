import { z } from 'zod/v4'
import { buildTool } from 'src/Tool.js'
import { WORKFLOW_CREATE_TOOL_NAME } from './constants.js'

const inputSchema = z.object({
  name: z.string().describe('Name of the workflow to create'),
  stages: z.array(z.string()).optional().describe('Workflow stages'),
})
type Input = typeof inputSchema
type WorkflowInput = z.infer<Input>

export const WorkflowCreate = buildTool({
  name: WORKFLOW_CREATE_TOOL_NAME,
  searchHint: 'create a new workflow',
  maxResultSizeChars: 10_000,
  strict: true,
  inputSchema,
  async description() {
    return 'Create a new workflow with specified stages'
  },
  async prompt() {
    return 'Stub: not yet implemented.'
  },
  userFacingName() {
    return 'WorkflowCreate'
  },
  isReadOnly() {
    return false
  },
  isEnabled() {
    return false
  },
  renderToolUseMessage(input: Partial<WorkflowInput>) {
    return `WorkflowCreate: ${input.name ?? 'unknown'}`
  },
  mapToolResultToToolResultBlockParam(content: { output: string }, toolUseID: string) {
    return { tool_use_id: toolUseID, type: 'tool_result', content: content.output }
  },
  async call(_input: WorkflowInput) {
    return { data: { output: 'WorkflowCreate is not yet implemented.' } }
  },
})
