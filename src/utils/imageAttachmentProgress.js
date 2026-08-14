export function summarizeImageAttachmentRecords(records) {
  const total = records.length
  const withImages = records.filter((record) => record.imageCount > 0).length
  const linkedImages = records.reduce((sum, record) => sum + record.imageCount, 0)
  return {
    total,
    withImages,
    withoutImages: total - withImages,
    linkedImages,
    coverage: total > 0 ? Math.round((withImages / total) * 100) : 0,
  }
}
