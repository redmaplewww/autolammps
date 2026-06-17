import type { Command, LocalCommandCall } from '../types/command.js'

const call: LocalCommandCall = async () => ({
  type: 'text',
  value: 'evidence-check: not implemented',
})

const evidenceCheck = {
  type: 'local',
  name: 'evidence-check',
  description: 'Check evidence (stub)',
  supportsNonInteractive: true,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default evidenceCheck
