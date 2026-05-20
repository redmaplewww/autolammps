export const WORKFLOW_STYLES = [
  'guided',
  'autonomous',
  'autonomous-escalation',
  'workflow-guided',
  'workflow-semi',
  'workflow-auto',
] as const

export type WorkflowStyle = (typeof WORKFLOW_STYLES)[number]

export const DEFAULT_WORKFLOW_STYLE: WorkflowStyle = 'autonomous-escalation'

export function isWorkflowStyle(value: string): value is WorkflowStyle {
  return WORKFLOW_STYLES.includes(value as WorkflowStyle)
}

export function isWorkflowMode(style: WorkflowStyle): boolean {
  return (
    style === 'workflow-guided' ||
    style === 'workflow-semi' ||
    style === 'workflow-auto'
  )
}

export function getWorkflowStyleLabel(style: WorkflowStyle): string {
  switch (style) {
    case 'guided':
      return 'Guided'
    case 'autonomous':
      return 'Autonomous'
    case 'autonomous-escalation':
      return 'Autonomous + Escalation'
    case 'workflow-guided':
      return 'Workflow + Guided'
    case 'workflow-semi':
      return 'Workflow + Semi-Auto'
    case 'workflow-auto':
      return 'Workflow + Full Auto'
  }
}

export function getWorkflowStyleSummary(style: WorkflowStyle): string {
  switch (style) {
    case 'guided':
      return 'Ask before major steps and collaborate incrementally.'
    case 'autonomous':
      return 'Work continuously with minimal interruptions.'
    case 'autonomous-escalation':
      return 'Work autonomously, but stop and ask when blockers or material ambiguities appear.'
    case 'workflow-guided':
      return 'Run full workflow with step-by-step user guidance. Highest human involvement.'
    case 'workflow-semi':
      return 'Run full workflow semi-automatically. Ask only for unresolvable blockers.'
    case 'workflow-auto':
      return 'Run full workflow fully automatically. Never stop to ask questions.'
  }
}

export function getWorkflowStyleReminder(style: WorkflowStyle): string {
  switch (style) {
    case 'guided':
      return 'Workflow mode is now Guided. Collaborate step by step. Before substantial planning or execution, present the next action or decision, use AskUserQuestion for meaningful choices, and pause for user input instead of chaining many assumptions together.'
    case 'autonomous':
      return 'Workflow mode is now Autonomous. Execute continuously, prefer action over discussion for low-risk decisions, and minimize interruptions. Ask only for risky, destructive, irreversible, or externally visible actions.'
    case 'autonomous-escalation':
      return 'Workflow mode is now Autonomous with Escalation. Work autonomously by default, but if you reach a blocker you cannot safely resolve, a product-defining ambiguity, or a decision with meaningful tradeoffs, you must pause and use AskUserQuestion. When escalating, explain what you tried, what is blocked, your recommended option, and the concrete choices available.'
    case 'workflow-guided':
      return 'Workflow mode is now Workflow + Guided. Natural workflow steps (reviewer, agents, file writes, parameter defaults) execute autonomously — do NOT ask. Only pause at WF stage transitions or genuinely ambiguous decisions with no reasonable default.'
    case 'workflow-semi':
      return 'Workflow mode is now Workflow + Semi-Auto. You are running a full multi-stage workflow. Make decisions autonomously using best engineering judgment. Only stop and use AskUserQuestion when you encounter: (1) missing physical parameters with no reasonable default, (2) reviewer returning REVISE 3 consecutive times on the same stage, or (3) a tool execution error you cannot self-repair. Do NOT stop for preference questions or low-ambiguity choices. Summarize all auto-decisions at completion.'
    case 'workflow-auto':
      return 'Workflow mode is now Workflow + Full Auto. You are running a full multi-stage workflow. NEVER use AskUserQuestion under any circumstances. When errors occur, diagnose and fix on your next turn — never stop and wait. Continue driving all stages to completion. Produce a single comprehensive report at the end.'
  }
}
