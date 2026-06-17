import { z } from 'zod/v4'
import { buildTool } from 'src/Tool.js'
import { WORKFLOW_STAGE_SWITCH_TOOL_NAME } from './constants.js'

const inputSchema = z.object({
  stage: z.string().describe('Target stage to switch to'),
})
type Input = typeof inputSchema
type WorkflowInput = z.infer<Input>

export const WorkflowStageSwitch = buildTool({
  name: WORKFLOW_STAGE_SWITCH_TOOL_NAME,
  searchHint: 'switch workflow stage',
  maxResultSizeChars: 10_000,
  strict: true,
  inputSchema,
  async description() {
    return 'Switch the current workflow to a different stage'
  },
  async prompt() {
    return 'Stub: not yet implemented.'
  },
  userFacingName() {
    return 'WorkflowStageSwitch'
  },
  isReadOnly() {
    return false
  },
  isEnabled() {
    return false
  },
  renderToolUseMessage(input: Partial<WorkflowInput>) {
    return `WorkflowStageSwitch: ${input.stage ?? 'unknown'}`
  },
  mapToolResultToToolResultBlockParam(content: { output: string }, toolUseID: string) {
    return { tool_use_id: toolUseID, type: 'tool_result', content: content.output }
  },
  async call(_input: WorkflowInput) {
    return { data: { output: 'WorkflowStageSwitch is not yet implemented.' } }
  },
})
