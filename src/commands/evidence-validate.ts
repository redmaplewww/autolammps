import type { Command, LocalCommandCall } from '../types/command.js'

const call: LocalCommandCall = async () => ({
  type: 'text',
  value: 'evidence-validate: not implemented',
})

const evidenceValidate = {
  type: 'local',
  name: 'evidence-validate',
  description: 'Validate evidence (stub)',
  supportsNonInteractive: true,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default evidenceValidate
