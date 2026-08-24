const PROVIDER_RESULT_TYPES = Object.freeze({
  TOOL_SELECTION: 'TOOL_SELECTION',
  CLARIFICATION: 'CLARIFICATION',
  UNSUPPORTED: 'UNSUPPORTED',
})

function assertAssistantProvider(provider) {
  if (!provider || typeof provider.name !== 'string' || !provider.name.trim()) {
    throw Object.assign(new Error('Assistant provider must have a name.'), { code: 'INVALID_PROVIDER' })
  }
  if (typeof provider.selectTool !== 'function' || typeof provider.synthesize !== 'function') {
    throw Object.assign(new Error('Assistant provider does not implement the required contract.'), { code: 'INVALID_PROVIDER' })
  }
  return provider
}

module.exports = { PROVIDER_RESULT_TYPES, assertAssistantProvider }
