const { getOahrisSystemKnowledge } = require('../knowledge/oahrisSystemKnowledge')

const MAX_SECTIONS = 3
const STOP_WORDS = new Set(['a', 'about', 'are', 'can', 'do', 'does', 'i', 'is', 'me', 'of', 'the', 'this', 'to', 'what', 'with', 'you', 'your'])

function normalize(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ') }
function words(value) { return new Set(normalize(value).split(' ').filter((word) => word && !STOP_WORDS.has(word))) }
function publicSection(section) {
  const safe = { ...section }
  delete safe.aliases
  delete safe.keywords
  return safe
}

function scoreSection(section, query) {
  const normalized = normalize(query)
  const queryWords = words(query)
  let score = 0
  for (const alias of section.aliases || []) {
    const normalizedAlias = normalize(alias)
    if (normalized === normalizedAlias) score += 20
    else if (normalized.includes(normalizedAlias)) score += 10
  }
  const title = normalize(section.title)
  if (normalized.includes(title)) score += 8
  for (const keyword of section.keywords || []) if (queryWords.has(normalize(keyword))) score += 2
  return score
}

async function searchSystemKnowledge(query) {
  const normalized = normalize(query)
  if (!normalized) return { type: 'KNOWLEDGE_NOT_FOUND', query: '' }
  const sections = await getOahrisSystemKnowledge()
  const ranked = sections.map((section, index) => ({ section, index, score: scoreSection(section, normalized) })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || a.index - b.index)
  const relevanceFloor = Math.max(2, (ranked[0]?.score || 0) - 8)
  const selected = ranked.filter(({ score }) => score >= relevanceFloor).slice(0, MAX_SECTIONS).map(({ section }) => publicSection(section))
  return selected.length
    ? { type: 'SYSTEM_KNOWLEDGE', sections: selected, meta: { limit: MAX_SECTIONS, totalKnowledgeSections: sections.length } }
    : { type: 'KNOWLEDGE_NOT_FOUND', query: String(query).trim().slice(0, 120) }
}

module.exports = { MAX_SECTIONS, searchSystemKnowledge }
