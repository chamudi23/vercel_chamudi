const ROLE_GROUPS = Object.freeze({
  authenticated: Object.freeze(['admin', 'researcher', 'student']),
  curator: Object.freeze(['admin', 'researcher']),
  admin: Object.freeze(['admin']),
})

const ASSISTANT_TOOL_PERMISSIONS = Object.freeze({
  search_specimens: ROLE_GROUPS.authenticated,
  get_specimen: ROLE_GROUPS.authenticated,
  search_images: ROLE_GROUPS.authenticated,
  get_measurements: ROLE_GROUPS.authenticated,
  get_skeleton_coverage: ROLE_GROUPS.authenticated,
  get_system_help: ROLE_GROUPS.authenticated,

  // Whole-system read-only retrieval permissions.
  search_sites: ROLE_GROUPS.authenticated,
  get_site: ROLE_GROUPS.authenticated,
  get_specimen_context: ROLE_GROUPS.authenticated,
  get_image: ROLE_GROUPS.authenticated,
  get_skeletal_analysis_result: ROLE_GROUPS.authenticated,
  get_specimen_data_quality: ROLE_GROUPS.curator,
})

const ASSISTANT_ROUTE_PERMISSIONS = Object.freeze({
  '/specimens/add': ROLE_GROUPS.curator,
  '/specimens/import': ROLE_GROUPS.curator,
  '/upload': ROLE_GROUPS.curator,
  '/data-quality': ROLE_GROUPS.curator,
  '/parami/add-site': ROLE_GROUPS.curator,
  '/parami/add-specimen': ROLE_GROUPS.curator,
  '/skeletal/admin/learners': ROLE_GROUPS.admin,
  '/admin/users': ROLE_GROUPS.admin,
})

function normalizeRole(role) {
  const value = typeof role === 'string' ? role.trim().toLowerCase() : ''
  return ROLE_GROUPS.authenticated.includes(value) ? value : null
}

function canUseAssistantTool(role, toolName) {
  const normalized = normalizeRole(role)
  const allowed = ASSISTANT_TOOL_PERMISSIONS[toolName]
  return Boolean(normalized && allowed?.includes(normalized))
}

function canUseRoute(role, path) {
  const normalized = normalizeRole(role)
  if (!normalized) return false
  const allowed = ASSISTANT_ROUTE_PERMISSIONS[path]
  return !allowed || allowed.includes(normalized)
}

function canUseHelpTopic(role, topic) {
  const normalized = normalizeRole(role)
  if (!normalized) return false
  if (topic?.requiredRole) return Boolean(ROLE_GROUPS[topic.requiredRole]?.includes(normalized))
  return (topic?.routes || []).every((route) => canUseRoute(normalized, route.path))
}

module.exports = {
  ACCESS_DENIED_MESSAGE: 'You do not have access to this OAHRIS information.',
  ASSISTANT_ROUTE_PERMISSIONS,
  ASSISTANT_TOOL_PERMISSIONS,
  ROLE_GROUPS,
  canUseAssistantTool,
  canUseHelpTopic,
  canUseRoute,
  normalizeRole,
}
