function toolCall(name, args, id = `call_${name}`) {
  return { id, type: 'function', function: { name, arguments: typeof args === 'string' ? args : JSON.stringify(args) } }
}

function completion({ content = null, toolCalls, usage = { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 } } = {}) {
  const message = { role: 'assistant', content }
  if (toolCalls !== undefined) message.tool_calls = toolCalls
  return { id: 'mock-completion', model: 'deepseek-v4-flash', choices: [{ index: 0, finish_reason: toolCalls?.length ? 'tool_calls' : 'stop', message }], usage }
}

const selections = Object.freeze({
  search_images: completion({ toolCalls: [toolCall('search_images', { boneType: 'Femur', side: 'Left', condition: 'Fragmented' })] }),
  search_specimens: completion({ toolCalls: [toolCall('search_specimens', { boneType: 'Femur', side: 'Left' })] }),
  get_specimen: completion({ toolCalls: [toolCall('get_specimen', { specimenId: 'SP-1' })] }),
  get_measurements: completion({ toolCalls: [toolCall('get_measurements', { specimenId: 'SP-1' })] }),
  get_skeleton_coverage: completion({ toolCalls: [toolCall('get_skeleton_coverage', { skeletonCode: 'SK001' })] }),
  get_system_help: completion({ toolCalls: [toolCall('get_system_help', { query: 'How do I use the skeleton viewer?' })] }),
})

module.exports = { completion, selections, toolCall }
