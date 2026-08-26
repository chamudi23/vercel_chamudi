import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { parseAssistantIntent } from '../src/lib/assistantIntent.js'

const require = createRequire(import.meta.url)
const { getSystemHelp } = require('../backend/services/helpRetrieval.js')
const { resolveConversationTurn } = require('../backend/services/assistantConversation.js')

const checks = [
  ['How do I use spatial analysis?', 'use-spatial-analysis'],
  ['How do I use DBSCAN?', 'use-dbscan-clusters'],
  ['How do I use Similar Findings?', 'use-similar-findings'],
  ['How do I run skeletal analysis?', 'run-skeletal-analysis'],
  ['Where do I see age estimation results?', 'view-skeletal-analysis-report'],
  ['Where can I view past analyses?', 'view-past-analyses'],
  ['How do I check data quality?', 'use-data-quality-dashboard'],
  ['What does data completeness mean?', 'understand-data-completeness'],
  ['How do I import specimens?', 'import-specimens'],
  ['Where can I see image documentation statistics?', 'view-image-dashboard'],
  ['How do I view image annotations?', 'view-image-annotations'],
]

for (const [prompt, topicId] of checks) {
  const intent = parseAssistantIntent(prompt)
  assert.equal(intent.type, 'SYSTEM_HELP', prompt)
  const help = getSystemHelp(intent.query)
  assert.equal(help.type, 'SYSTEM_HELP', prompt)
  assert.equal(help.topic.id, topicId, prompt)
  const turn = resolveConversationTurn({ message: prompt })
  assert.equal(turn?.toolCalls?.[0]?.name, 'get_system_help', prompt)
}

assert.equal(getSystemHelp('How do I import specimens?').topic.requiredRole, 'curator')
assert.equal(getSystemHelp('How do I check data quality?').topic.requiredRole, 'curator')
assert.equal(parseAssistantIntent('show measurements for SK001').type, 'MEASUREMENT_RESULTS')
assert.equal(parseAssistantIntent('show left femur images').type, 'IMAGE_RESULTS')

console.log(`OAHRIS whole-system help tests passed: ${checks.length}/${checks.length}`)
