const path = require('path')
const { pathToFileURL } = require('url')

let cataloguePromise
const catalogue = () => (cataloguePromise ||= import(pathToFileURL(path.resolve(__dirname, '../../src/utils/pp1ImageModule.js')).href))

const VERIFIED_SECTIONS = Object.freeze([
  { id: 'system-overview', title: 'OAHRIS overview', aliases: ['oahris', 'this system', 'the system', 'modules available', 'system modules', 'what can oahris do', 'what do you know'], keywords: ['overview', 'system', 'oahris', 'module', 'modules', 'available', 'purpose'], summary: 'OAHRIS is an integrated osteoarchaeological research information system. Its current areas are Specimen Records, Spatial Analysis, Image Library, Skeleton Viewer, Skeletal Analysis, Data Quality, and the Skully Research Assistant.' },
  { id: 'specimen-records', title: 'Specimen Records', aliases: ['specimen records', 'specimen management'], keywords: ['specimen', 'records', 'measurements', 'excavation', 'dating'], summary: 'Specimen Records stores and presents specimen identity, skeletal element, side, preservation, measurements, excavation context, and laboratory-dating information where those values have been recorded.' },
  { id: 'spatial-analysis', title: 'Spatial Analysis', aliases: ['spatial analysis', 'gis', 'site mapping'], keywords: ['spatial', 'gis', 'map', 'mapping', 'site', 'sites', 'dbscan', 'cluster'], summary: 'Spatial Analysis works with archaeological site records and map-based research workflows. Its analytical operations belong to the Spatial Analysis module; Skully can explain the workflow and retrieve bounded site information but does not run DBSCAN, KNN, or K-Means itself.' },
  { id: 'image-library', title: 'Image Library', aliases: ['image library', 'image documentation'], keywords: ['image', 'images', 'library', 'photograph', 'annotation', 'metadata'], summary: 'The Image Library organizes skeletal images linked to specimen records. It presents recorded bone, side, condition, view, image type, notes, tags, and structured annotations where available.' },
  { id: 'skeleton-viewer', title: 'Skeleton Viewer', aliases: ['skeleton viewer', 'documentation viewer'], keywords: ['skeleton', 'viewer', 'coverage', 'documentation', 'category'], summary: 'The Skeleton Viewer presents front and back documentation status for the controlled skeletal catalogue. Its coverage describes recorded categories and linked-image documentation, not anatomical completeness or diagnosis.' },
  { id: 'skeletal-analysis', title: 'Skeletal Analysis', aliases: ['skeletal analysis', 'automated skeletal analysis'], keywords: ['skeletal', 'analysis', 'age', 'sex', 'stature', 'case', 'result'], summary: 'The Skeletal Analysis module runs its own implemented analysis workflow and stores results by case ID. Skully can retrieve an existing stored result by its case ID, but does not independently calculate age, sex, stature, or a biological profile.' },
  { id: 'data-quality', title: 'Data Quality', aliases: ['data quality', 'completeness', 'quality dashboard'], keywords: ['data', 'quality', 'completeness', 'missing', 'logs', 'anomaly'], summary: 'Data Quality presents deterministic specimen completeness information and previously stored measurement-analysis logs. Access to assistant data-quality retrieval is limited to permitted roles, and Skully does not independently run anomaly-analysis models.' },
  { id: 'research-assistant', title: 'Research Assistant', aliases: ['research assistant', 'skully'], keywords: ['assistant', 'skully', 'research', 'chat'], summary: 'Skully is OAHRIS’s authenticated read-only research assistant. It retrieves bounded stored information, answers verified OAHRIS system questions, and provides verified workflow guidance without modifying records.' },
  { id: 'roles-and-access', title: 'Roles and access', aliases: ['roles and access', 'user roles', 'permissions'], keywords: ['role', 'roles', 'access', 'admin', 'researcher', 'student', 'permission'], summary: 'OAHRIS currently recognizes admin, researcher, and student roles. Authentication and server-side authorization determine which routes and assistant tools a signed-in user may access.' },
  { id: 'assistant-capabilities', title: 'What Skully can help with', aliases: ['what can you help me with', 'assistant capabilities', 'things you know', 'what do you know'], keywords: ['help', 'capabilities', 'know', 'retrieve', 'assistant'], summary: 'Skully can help retrieve specimens, measurements, recorded specimen details, excavation and laboratory-dating context, archaeological sites, image metadata and available annotations, skeleton documentation coverage, stored Skeletal Analysis results by case ID, role-permitted Data Quality information, workflow guidance, and verified general OAHRIS knowledge.' },
  { id: 'assistant-limitations', title: 'Skully limitations', aliases: ['your limitations', 'assistant limitations', 'what can you not do'], keywords: ['limitations', 'limit', 'cannot', 'unable', 'read-only'], summary: 'Skully is read-only: it cannot modify records, expose coordinates, independently run DBSCAN, KNN, K-Means, skeletal age/sex/stature calculations, or anomaly-analysis models. Stored Skeletal Analysis retrieval currently requires an exact case ID.' },
])

async function getOahrisSystemKnowledge() {
  const { CONTROLLED_BONE_CATEGORIES } = await catalogue()
  const labels = CONTROLLED_BONE_CATEGORIES.map((category) => category.label)
  return [...VERIFIED_SECTIONS, {
    id: 'skeletal-catalogue',
    title: 'Controlled skeletal catalogue',
    aliases: ['skeletal catalogue', 'bone categories', 'bone types', 'supported bones', 'what are they'],
    keywords: ['skeletal', 'catalogue', 'bone', 'bones', 'category', 'categories', 'types', 'supported', 'many'],
    summary: `OAHRIS currently supports ${labels.length} canonical skeletal categories: ${labels.join(', ')}.`,
    categoryCount: labels.length,
    categories: labels,
  }]
}

module.exports = { getOahrisSystemKnowledge }
