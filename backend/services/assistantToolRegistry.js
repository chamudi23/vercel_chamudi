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
  const { getSystemHelp } = require('./helpRetrieval')
  return { ...queries, getSystemHelp }
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
    async execute(name, rawArgs) {
      const args = validateToolArguments(name, rawArgs)
      const active = getServices()
      if (name === 'search_specimens') return active.searchSpecimens(args)
      if (name === 'get_specimen') return active.getSpecimen(args.specimenId)
      if (name === 'search_images') return active.searchImages(args)
      if (name === 'get_measurements') return active.getMeasurements(args.specimenId)
      if (name === 'get_skeleton_coverage') return active.getSkeletonCoverage(args.skeletonCode)
      if (name === 'get_system_help') return active.getSystemHelp(args.query)
      throw validationError('The requested assistant tool is not allowed.', 'TOOL_NOT_ALLOWED')
    },
  }
}

module.exports = {
  TOOL_DEFINITIONS,
  createAssistantToolRegistry,
  validateToolArguments,
}
