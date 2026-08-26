import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../supabase'
import { CONTROLLED_BONE_CATEGORIES } from '../utils/pp1ImageModule'
import {
  calculateBoneImageCounts,
  calculateImageSummary,
  calculateMonthlyUploadTrend,
  calculatePhotographedCategoryCount,
  hasStoredImage,
} from '../lib/imageDocumentationDashboard'

function MetricCard({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-violet-300/80">{label}</p>
      {note && <p className="mt-1 text-xs text-white/35">{note}</p>}
    </div>
  )
}

function AttachmentRateCard({ rate, storedImages, documentationRecords }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-5">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full p-1.5" style={{ background: `conic-gradient(rgb(139 92 246) ${rate}%, rgba(255,255,255,0.08) 0)` }}>
        <div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-sm font-bold text-violet-100">{rate}%</div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-300/80">Image Attachment Rate</p>
        <p className="mt-1 text-sm text-white/65">{storedImages} of {documentationRecords} records have an attached image.</p>
      </div>
    </div>
  )
}

function ChartEmpty({ children }) {
  return <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-900/40 px-5 text-center text-sm text-white/40">{children}</div>
}

export default function ImageDocumentationDashboardPage() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    const imageResult = await supabase
      .from('bone_images')
      .select('image_id, specimen_id, uploaded_at, image_url, file_url, bone_name, condition, image_view, view_angle, side, skeleton_region, specimen:specimens!bone_images_specimen_id_fkey(specimen_id, skeleton_code, bone_type, side)')

    setImages(imageResult.data || [])
    setError(imageResult.error?.message || '')
    setLoading(false)
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const summary = useMemo(() => calculateImageSummary(images), [images])
  const monthlyTrend = useMemo(() => calculateMonthlyUploadTrend(images), [images])
  const boneCounts = useMemo(() => calculateBoneImageCounts(images), [images])
  const photographedCategoryCount = useMemo(() => calculatePhotographedCategoryCount(images), [images])
  const datedImages = useMemo(() => images.filter((image) => hasStoredImage(image) && image?.uploaded_at && !Number.isNaN(new Date(image.uploaded_at).getTime())), [images])
  const awaitingAttachment = summary.documentationRecords - summary.storedImages

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">Image Documentation</p>
            <h1 className="mt-2 text-3xl font-bold">Skeletal Image Documentation Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/45">Monitor skeletal image documentation, collection coverage, and image-record quality.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/gallery" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/65 transition hover:bg-white/10 hover:text-white">View Gallery</Link>
            <button type="button" onClick={loadDashboard} disabled={loading} className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50">Refresh</button>
          </div>
        </header>

        {error && <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">Could not load all dashboard records: {error}</div>}

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center text-sm text-white/45">Loading image documentation metrics...</div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricCard label="Documentation Records" value={summary.documentationRecords} />
              <MetricCard label="Stored Images" value={summary.storedImages} />
              <AttachmentRateCard rate={summary.attachmentRate} storedImages={summary.storedImages} documentationRecords={summary.documentationRecords} />
              <MetricCard label="Images This Month" value={summary.imagesThisMonth} />
            </section>

            <div className="mt-8 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 w-fit">
              {[['overview', 'Overview'], ['coverage', 'Bone Coverage']].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setActiveTab(key)} className={`rounded-lg px-4 py-2 text-xs font-medium transition ${activeTab === key ? 'bg-violet-600 text-white' : 'text-white/45 hover:text-white'}`}>{label}</button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="mt-6 space-y-6">
                {summary.documentationRecords === 0 && <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/45">No skeletal image documentation records are available yet.</div>}
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">Image Documentation Progress</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div><p className="text-2xl font-bold text-violet-200">{summary.attachmentRate}%</p><p className="mt-1 text-xs text-white/45">image attachment rate</p></div>
                    <div><p className="text-2xl font-bold text-white">{summary.storedImages}</p><p className="mt-1 text-xs text-white/45">image files attached</p></div>
                    <div><p className="text-2xl font-bold text-amber-200">{awaitingAttachment}</p><p className="mt-1 text-xs text-white/45">documentation records awaiting image attachment</p></div>
                  </div>
                </section>
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">Documentation Activity</p>
                  <h2 className="mt-2 text-xl font-semibold">Monthly Image Uploads</h2>
                  <div className="mt-5 h-72">
                    {datedImages.length === 0 ? <ChartEmpty>No valid upload dates are available for the monthly trend.</ChartEmpty> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyTrend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="#ffffff" strokeOpacity={0.08} vertical={false} />
                          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: 'rgba(139,92,246,0.10)' }} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10 }} labelStyle={{ color: '#ddd6fe' }} />
                          <Bar dataKey="uploads" name="Stored images" fill="#8b5cf6" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 xl:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">Bone Image Distribution</p>
                    <h2 className="mt-2 text-xl font-semibold">Images by skeletal element</h2>
                    {boneCounts.length === 0 ? <div className="mt-5"><ChartEmpty>No bone information is available for image records.</ChartEmpty></div> : (
                      <div className="mt-5 max-h-[560px] overflow-y-auto pr-2" style={{ minHeight: Math.max(280, boneCounts.length * 38) }}>
                        <ResponsiveContainer width="100%" height={Math.max(280, boneCounts.length * 38)}>
                          <BarChart data={boneCounts} layout="vertical" margin={{ top: 4, right: 30, left: 80, bottom: 4 }}>
                            <CartesianGrid stroke="#ffffff" strokeOpacity={0.08} horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="bone" width={76} tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(139,92,246,0.10)' }} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10 }} labelStyle={{ color: '#ddd6fe' }} />
                            <Bar dataKey="images" name="Stored images" fill="#a78bfa" radius={[0, 5, 5, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </section>

                </div>
              </div>
            )}

            {activeTab === 'coverage' && (
              <div className="mt-6 space-y-6">
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">Bone Photographic Coverage</p>
                  <h2 className="mt-2 text-xl font-semibold">Skeletal categories photographed</h2>
                  <p className="mt-2 text-3xl font-bold text-violet-200">{photographedCategoryCount} of {CONTROLLED_BONE_CATEGORIES.length}</p>
                  <p className="mt-1 text-sm text-white/45">skeletal categories photographed with at least one stored image.</p>
                </section>
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">Bone Image Distribution</p>
                  <h2 className="mt-2 text-xl font-semibold">Stored images by skeletal category</h2>
                  {boneCounts.length === 0 ? <div className="mt-5"><ChartEmpty>No stored images have bone information available.</ChartEmpty></div> : (
                    <div className="mt-5 max-h-[560px] overflow-y-auto pr-2" style={{ minHeight: Math.max(280, boneCounts.length * 38) }}>
                      <ResponsiveContainer width="100%" height={Math.max(280, boneCounts.length * 38)}>
                        <BarChart data={boneCounts} layout="vertical" margin={{ top: 4, right: 30, left: 80, bottom: 4 }}>
                          <CartesianGrid stroke="#ffffff" strokeOpacity={0.08} horizontal={false} />
                          <XAxis type="number" allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="bone" width={76} tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: 'rgba(139,92,246,0.10)' }} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10 }} labelStyle={{ color: '#ddd6fe' }} />
                          <Bar dataKey="images" name="Stored images" fill="#a78bfa" radius={[0, 5, 5, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
