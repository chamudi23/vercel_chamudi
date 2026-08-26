import { normalizeBoneCategory } from '../utils/pp1ImageModule.js'

function rows(value) {
  return Array.isArray(value) ? value : []
}

export function hasStoredImage(record) {
  return Boolean(String(record?.image_url || '').trim() || String(record?.file_url || '').trim())
}

function validDate(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function linkedBoneValue(image) {
  return image?.specimen?.bone_type || ''
}

function boneValueFor(image) {
  return image?.specimen_id ? linkedBoneValue(image) : image?.bone_name || ''
}

export function calculateImageSummary(images) {
  const imageRows = rows(images)
  const storedImages = imageRows.filter(hasStoredImage)
  const now = new Date()
  const specimensWithImages = new Set()
  let imagesThisMonth = 0
  let linkedImages = 0

  storedImages.forEach((image) => {
    if (image?.specimen_id) {
      linkedImages += 1
      specimensWithImages.add(image.specimen_id)
    }
    const date = validDate(image?.uploaded_at)
    if (date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
      imagesThisMonth += 1
    }
  })

  return {
    documentationRecords: imageRows.length,
    storedImages: storedImages.length,
    specimensWithImages: specimensWithImages.size,
    imagesThisMonth,
    linkedImages,
    linkedPercentage: storedImages.length ? Math.round((linkedImages / storedImages.length) * 100) : 0,
    attachmentRate: imageRows.length ? Math.round((storedImages.length / imageRows.length) * 100) : 0,
  }
}

export function calculatePhotographedCategoryCount(images) {
  const categories = new Set()
  rows(images).filter(hasStoredImage).forEach((image) => {
    const category = normalizeBoneCategory(boneValueFor(image))
    if (category) categories.add(category.code)
  })
  return categories.size
}

export function calculateMonthlyUploadTrend(images, monthCount = 12) {
  const totalMonths = Math.max(1, monthCount)
  const now = new Date()
  const buckets = []

  for (let offset = totalMonths - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      uploads: 0,
    })
  }

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  rows(images).filter(hasStoredImage).forEach((image) => {
    const date = validDate(image?.uploaded_at)
    if (!date) return
    const bucket = byKey.get(`${date.getFullYear()}-${date.getMonth()}`)
    if (bucket) bucket.uploads += 1
  })

  return buckets
}

export function calculateBoneImageCounts(images) {
  const counts = new Map()
  rows(images).filter(hasStoredImage).forEach((image) => {
    const value = String(boneValueFor(image) || '').trim()
    if (!value) return
    const category = normalizeBoneCategory(value)
    const label = category?.label || value
    counts.set(label, (counts.get(label) || 0) + 1)
  })

  return [...counts.entries()]
    .map(([bone, images]) => ({ bone, images }))
    .sort((first, second) => second.images - first.images || first.bone.localeCompare(second.bone))
}

export function calculateImageDocumentationStatus(images) {
  const status = {
    documentationRecords: 0,
    storedImages: 0,
    awaitingImageAttachment: 0,
    unlinkedStoredImages: 0,
    orphanMetadataRecords: 0,
    missingBone: 0,
    missingView: 0,
    missingCondition: 0,
  }

  rows(images).forEach((image) => {
    const stored = hasStoredImage(image)
    const linked = Boolean(image?.specimen_id)
    status.documentationRecords += 1
    if (stored) status.storedImages += 1
    if (!stored && linked && image?.specimen?.specimen_id) status.awaitingImageAttachment += 1
    if (stored && !linked) status.unlinkedStoredImages += 1
    if (!stored && !linked) status.orphanMetadataRecords += 1

    if (!stored) return

    const bone = String(boneValueFor(image) || '').trim()
    if (linked ? !normalizeBoneCategory(bone) : !bone) status.missingBone += 1
    if (!String(image?.image_view || image?.view_angle || '').trim()) status.missingView += 1
    if (!String(image?.condition || '').trim()) status.missingCondition += 1
  })

  return status
}
