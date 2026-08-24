const { createMockProvider } = require('./mockProvider')
const { createDeepSeekProvider } = require('./deepseekProvider')

function configurationError(code, message) { return Object.assign(new Error(message), { name: 'AssistantProviderConfigurationError', code }) }

function createAssistantProvider(environment = process.env, options = {}) {
  const providerName = String(environment.LLM_PROVIDER || 'mock').trim().toLowerCase()
  if (providerName === 'mock') return createMockProvider(options.mockOptions)
  if (providerName === 'deepseek') {
    const apiKey = String(environment.DEEPSEEK_API_KEY || '').trim()
    if (!apiKey) throw configurationError('DEEPSEEK_API_KEY_REQUIRED', 'DeepSeek is selected but its API key is not configured.')
    return createDeepSeekProvider({
      apiKey,
      model: environment.DEEPSEEK_MODEL,
      timeoutMs: environment.ASSISTANT_LLM_TIMEOUT_MS,
      maxOutputTokens: environment.ASSISTANT_LLM_MAX_OUTPUT_TOKENS,
      fetchImpl: options.fetchImpl,
    })
  }
  throw configurationError('ASSISTANT_PROVIDER_NOT_CONFIGURED', 'The selected assistant provider is not configured.')
}

module.exports = { createAssistantProvider }
