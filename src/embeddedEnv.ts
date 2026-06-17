export function applyEmbeddedProviderEnv(): void {
  process.env.ANTHROPIC_API_KEY ??= ''
  process.env.ANTHROPIC_BASE_URL ??= ''
  process.env.OPENAI_API_KEY ??= ''
  process.env.OPENAI_BASE_URL ??= ''
  process.env.ANTHROPIC_MODEL ??= ''
}
