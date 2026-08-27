const STRING_SCHEMA = Object.freeze({ type: 'string', minLength: 1, maxLength: 120 })
const SIDE_VALUES = Object.freeze(['Left', 'Right', 'Midline', 'Unknown'])
const BONE_VALUES = Object.freeze([
  'Skull', 'Mandible', 'Maxilla', 'Incisor', 'Canine', 'Premolar', 'Molar', 'Clavicle', 'Scapula', 'Humerus', 'Radius', 'Ulna', 'Vertebra', 'Sacrum', 'Coccyx', 'Rib', 'Sternum', 'Pelvis', 'Pubis', 'Femur', 'Patella', 'Tibia', 'Fibula', 'Metacarpal', 'Metatarsal', 'Phalanx (Hand)', 'Phalanx (Foot)', 'Other',
  'Cranium', 'Hand Phalanx', 'Foot Phalanx', 'Os Coxa', 'Cervical Vertebra', 'Thoracic Vertebra', 'Lumbar Vertebra', 'Hyoid', 'Carpal', 'Talus', 'Calcaneus', 'Other Tarsal', 'Tooth', 'Teeth', 'Phalanx',
])
const CONDITION_VALUES = Object.freeze(['Complete', 'Fragmented', 'Partially Complete', 'Heavily Damaged', 'Unknown'])
const IMAGE_VIEW_VALUES = Object.freeze(['Anterior', 'Posterior', 'Lateral', 'Superior', 'Inferior', 'Medial', 'Other'])
const IMAGE_TYPE_VALUES = Object.freeze(['Excavation', 'Laboratory', 'Museum', 'Field', 'Reference'])

const textProperty = (description) => ({ ...STRING_SCHEMA, description })
const enumProperty = (values, description) => ({ type: 'string', enum: [...values], description })

const TOOL_DEFINITIONS = Object.freeze({
  search_specimens: {
    name: 'search_specimens',
    description: 'Search read-only OAHRIS specimen records using at least one controlled filter.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      minProperties: 1,
      properties: {
        specimenId: textProperty('Exact specimen identifier.'),
        skeletonCode: textProperty('Exact skeleton code.'),
        boneType: enumProperty(BONE_VALUES, 'Controlled OAHRIS bone category.'),
        side: enumProperty(SIDE_VALUES, 'Controlled side.'),
        site: textProperty('Exact site name.'),
        district: textProperty('Exact district.'),
        timePeriod: textProperty('Exact recorded time period.'),
        preservationStatus: textProperty('Exact recorded preservation status.'),
      },
    },
  },
  get_specimen: {
    name: 'get_specimen',
    description: 'Retrieve one read-only OAHRIS specimen by exact specimen identifier.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['specimenId'], properties: { specimenId: textProperty('Exact specimen identifier.') } },
  },
  search_images: {
    name: 'search_images',
    description: 'Search read-only OAHRIS image records using at least one controlled filter.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      minProperties: 1,
      properties: {
        specimenId: textProperty('Exact specimen identifier.'),
        skeletonCode: textProperty('Exact skeleton code.'),
        boneType: enumProperty(BONE_VALUES, 'Controlled OAHRIS bone category.'),
        side: enumProperty(SIDE_VALUES, 'Controlled side.'),
        condition: enumProperty(CONDITION_VALUES, 'Controlled image condition.'),
        imageView: enumProperty(IMAGE_VIEW_VALUES, 'Controlled image view.'),
        imageType: enumProperty(IMAGE_TYPE_VALUES, 'Controlled image type.'),
      },
    },
  },
  get_measurements: {
    name: 'get_measurements',
    description: 'Retrieve read-only recorded measurements for one exact specimen identifier.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['specimenId'], properties: { specimenId: textProperty('Exact specimen identifier.') } },
  },
  get_skeleton_coverage: {
    name: 'get_skeleton_coverage',
    description: 'Retrieve read-only OAHRIS documentation coverage for one exact skeleton code.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['skeletonCode'], properties: { skeletonCode: textProperty('Exact skeleton code.') } },
  },
  get_system_help: {
    name: 'get_system_help',
    description: 'Retrieve verified OAHRIS workflow help for a user question.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['query'], properties: { query: textProperty('OAHRIS workflow question.') } },
  },
  search_system_knowledge: {
    name: 'search_system_knowledge',
    description: 'Retrieve up to three verified OAHRIS knowledge sections for questions about what OAHRIS is, what its modules do, Skully capabilities or limitations, roles, or the controlled skeletal catalogue. Use get_system_help instead for step-by-step workflow instructions. Do not use this for live specimen, site, image, measurement, coverage, analysis-case, or data-quality record requests.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['query'], properties: { query: textProperty('Natural-language question about the OAHRIS system or Skully.') } },
  },
  search_sites: {
    name: 'search_sites',
    description: 'Search stored OAHRIS archaeological site records using one or more controlled descriptive filters. Use this for filtered lists, not for one confidently identified site. Coordinates and spatial calculations are not returned.',
    inputSchema: {
      type: 'object', additionalProperties: false, minProperties: 1,
      properties: {
        siteName: textProperty('Exact site name.'), district: textProperty('Exact district.'), province: textProperty('Exact province.'),
        timePeriod: textProperty('Exact recorded time period.'), siteType: textProperty('Exact recorded site type.'), riskLevel: textProperty('Exact recorded risk level.'),
      },
    },
  },
  get_site: {
    name: 'get_site',
    description: 'Retrieve one exact stored OAHRIS archaeological site record by site ID or exact site name, with bounded linked specimen summaries. Use this as the single default tool for “Tell me about <site name>”, “What do we know about <site name>?”, or “Information about <site name>”. Do not combine it with specimen search for a simple site-description request. Duplicate exact names remain ambiguous.',
    inputSchema: { type: 'object', additionalProperties: false, minProperties: 1, maxProperties: 1, properties: { siteId: textProperty('Exact site identifier.'), siteName: textProperty('Exact site name; duplicate names return an ambiguous result.') } },
  },
  get_specimen_context: {
    name: 'get_specimen_context',
    description: 'Retrieve recorded site-resolution, excavation, burial-context, and laboratory-dating information for one exact specimen ID. Use this for where-found, excavation, dating, or archaeological-context questions.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['specimenId'], properties: { specimenId: textProperty('Exact specimen identifier.') } },
  },
  get_image: {
    name: 'get_image',
    description: 'Retrieve one exact stored OAHRIS image record including safe metadata, bounded tags, and bounded structured annotations by image ID.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['imageId'], properties: { imageId: textProperty('Exact image identifier.') } },
  },
  get_skeletal_analysis_result: {
    name: 'get_skeletal_analysis_result',
    description: 'Retrieve one existing stored Skeletal Analysis result by exact analysis case ID. This does not perform a new analysis or prediction, and specimen IDs cannot be used as analysis case IDs.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['caseId'], properties: { caseId: textProperty('Exact saved analysis case identifier.') } },
  },
  get_specimen_data_quality: {
    name: 'get_specimen_data_quality',
    description: 'Retrieve current OAHRIS completeness information and previously stored measurement-analysis logs for one exact specimen ID. Access is role restricted; this tool does not run anomaly-analysis algorithms.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['specimenId'], properties: { specimenId: textProperty('Exact specimen identifier.') } },
  },
})

function validationError(message, code = 'INVALID_TOOL_ARGUMENTS') {
  return Object.assign(new Error(message), { code })
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

function validateToolArguments(name, args) {
  const definition = TOOL_DEFINITIONS[name]
  if (!definition) throw validationError('The requested assistant tool is not allowed.', 'TOOL_NOT_ALLOWED')
  if (!isPlainObject(args)) throw validationError('Tool arguments must be an object.')
  const schema = definition.inputSchema
  const keys = Object.keys(args)
  const unknown = keys.filter((key) => !Object.hasOwn(schema.properties, key))
  if (unknown.length) throw validationError('Tool arguments contain unsupported properties.')
  if (schema.minProperties && keys.length < schema.minProperties) throw validationError('At least one search filter is required.')
  if (schema.maxProperties && keys.length > schema.maxProperties) throw validationError('Too many search identifiers were provided.')
  for (const required of schema.required || []) if (!Object.hasOwn(args, required)) throw validationError(`The ${required} argument is required.`)
  for (const [key, value] of Object.entries(args)) {
    const property = schema.properties[key]
    if (typeof value !== 'string' || !value.trim() || value.length > (property.maxLength || 120)) throw validationError(`The ${key} argument is invalid.`)
    if (property.enum && !property.enum.includes(value)) throw validationError(`The ${key} argument is not an allowed value.`)
  }
  return Object.fromEntries(Object.entries(args).map(([key, value]) => [key, value.trim()]))
}

function resolveServices(services) {
  if (services) return services
  const queries = require('./oahrisQueries')
  const wholeSystemQueries = require('./wholeSystemQueries')
  const { getSystemHelp } = require('./helpRetrieval')
  const { searchSystemKnowledge } = require('./systemKnowledgeRetrieval')
  return { ...queries, ...wholeSystemQueries, getSystemHelp, searchSystemKnowledge }
}

function createAssistantToolRegistry(injectedServices) {
  let services
  const getServices = () => (services ||= resolveServices(injectedServices))
  return {
    getDefinitions() {
      return Object.values(TOOL_DEFINITIONS).map(({ name, description, inputSchema }) => ({ name, description, inputSchema: JSON.parse(JSON.stringify(inputSchema)) }))
    },
    has(name) { return Object.hasOwn(TOOL_DEFINITIONS, name) },
    validate(name, args) { return validateToolArguments(name, args) },
    async execute(name, rawArgs, context = {}) {
      const args = validateToolArguments(name, rawArgs)
      const active = getServices()
      if (name === 'search_specimens') return active.searchSpecimens(args, context.supabase)
      if (name === 'get_specimen') return active.getSpecimen(args.specimenId, context.supabase)
      if (name === 'search_images') return active.searchImages(args, context.supabase)
      if (name === 'get_measurements') return active.getMeasurements(args.specimenId, context.supabase)
      if (name === 'get_skeleton_coverage') return active.getSkeletonCoverage(args.skeletonCode, context.supabase)
      if (name === 'get_system_help') return active.getSystemHelp(args.query)
      if (name === 'search_system_knowledge') return active.searchSystemKnowledge(args.query)
      if (name === 'search_sites') return active.searchSites(args, context.supabase)
      if (name === 'get_site') return active.getSite(args, context.supabase)
      if (name === 'get_specimen_context') return active.getSpecimenContext(args.specimenId, context.supabase)
      if (name === 'get_image') return active.getImage(args.imageId, context.supabase)
      if (name === 'get_skeletal_analysis_result') return active.getSkeletalAnalysisResult(args.caseId, context.supabase)
      if (name === 'get_specimen_data_quality') return active.getSpecimenDataQuality(args.specimenId, context.supabase)
      throw validationError('The requested assistant tool is not allowed.', 'TOOL_NOT_ALLOWED')
    },
  }
}

module.exports = {
  TOOL_DEFINITIONS,
  createAssistantToolRegistry,
  validateToolArguments,
}
