import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAppAuth } from '../context/AppAuthContext'
import { PP1_BONE_LABELS, allowedSidesForCategory, validateCategorySide } from '../utils/pp1ImageModule'

const SITES = [
  'Sigiriya', 'Ibbankatuwa', 'Fa Hien Cave', 'Batadombalena',
  'Anuradhapura Sacred City', 'Mihintale', 'Tissamaharama',
  'Pallemalala Prehistoric Site', 'Kaduwela', 'Dorawaka Cave',
  'Bellanbandi Palassa', 'Haldummulla', 'Ranchamadama',
  'Godavaya', 'Pomparippu', 'Yapahuwa', 'Kantarodai',
  'Polonnaruwa Ancient City', 'Dambulla Cave Temple', 'Ritigala',
]

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kurunegala', 'Matale', 'Matara',
  'Monaragala', 'Puttalam', 'Ratnapura', 'Trincomalee',
]

const PROVINCES = [
  'Central', 'Eastern', 'North Central', 'North Western',
  'Northern', 'Sabaragamuwa', 'Southern', 'Uva', 'Western',
]

const TIME_PERIODS = [
  'Prehistoric', 'Mesolithic', 'Upper Paleolithic',
  'Iron Age', 'Early Historic', 'Classical Period', 'Medieval', 'Modern',
]

const PRESERVATION = ['Good', 'Moderate', 'Poor', 'Fragmentary']
const SEX_OPTIONS  = ['Male', 'Female', 'Unknown']

const EMPTY_FORM = {
  specimen_id:        '',
  skeleton_code:      '',
  site_name:          '',
  district:           '',
  province:           '',
  excavation_year:    '',
  time_period:        '',
  preservation_state: '',
  location_stored:    'PGIAR',
  burial_context:     '',
  bone_type:          '',
  side:               '',
  length_cm:          '',
  width_cm:           '',
  thickness_cm:       '',
  age_estimate:       '',
  sex_estimate:       '',
  extra_notes:        '',
}

function InputField({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
    </div>
  )
}

function AddSpecimenPage() {
  const navigate  = useNavigate()
  const { user } = useAppAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState(null)
  const [form,    setForm]    = useState(EMPTY_FORM)

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'bone_type') {
      const nextSides = allowedSidesForCategory(value)
      setForm(prev => ({ ...prev, bone_type: value, side: nextSides.includes(prev.side) ? prev.side : (nextSides[0] || '') }))
      return
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Auto-generate specimen_id from site name
  const generateId = () => {
    const prefix = form.site_name
      ? form.site_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3)
      : 'SPE'
    const num = String(Math.floor(Math.random() * 900) + 100)
    setForm(prev => ({ ...prev, specimen_id: `${prefix}-${num}` }))
  }

  const handleSubmit = async () => {
    if (!form.specimen_id.trim())   { setError('Specimen ID is required.');   return }
    if (!form.skeleton_code.trim()) { setError('Skeleton code is required.'); return }
    if (!form.site_name)            { setError('Site name is required.');     return }
    if (form.bone_type) {
      const sideError = validateCategorySide(form.bone_type, form.side)
      if (sideError) { setError(sideError); return }
    }

    setLoading(true)
    setError(null)

    try {
      const { error: err } = await supabase.from('specimens').insert([{
        created_by:          user?.id ?? null,
        specimen_id:        form.specimen_id.trim(),
        skeleton_code:      form.skeleton_code.trim(),
        site_name:          form.site_name,
        district:           form.district           || null,
        province:           form.province           || null,
        excavation_year:    form.excavation_year    ? parseInt(form.excavation_year)  : null,
        time_period:        form.time_period        || null,
        preservation_state: form.preservation_state || null,
        location_stored:    form.location_stored    || 'PGIAR',
        burial_context:     form.burial_context     || null,
        notes:              form.extra_notes        || null,
        bone_type:          form.bone_type          || null,
        side:               form.side               || null,
        length_cm:          form.length_cm          ? parseFloat(form.length_cm)    : null,
        width_cm:           form.width_cm           ? parseFloat(form.width_cm)     : null,
        thickness_cm:       form.thickness_cm       ? parseFloat(form.thickness_cm) : null,
        age_estimate:       form.age_estimate       || null,
        sex_estimate:       form.sex_estimate       || null,
      }])
      if (err) throw err
      setSuccess(true)
      setForm(EMPTY_FORM)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass  = 'w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-slate-500'
  const selectClass = 'w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500'

  return (
    <div className="max-w-4xl mx-auto p-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-blue-400 text-xs font-medium uppercase tracking-widest mb-2">
            Spatial Records
          </p>
          <h2 className="text-2xl font-bold text-slate-100">Add Skeletal Specimen</h2>
          <p className="text-slate-400 text-sm mt-1">
            Record new skeletal specimen data for spatial analysis
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/parami/home" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
  ← Back to GIS Home
</Link>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div className="bg-emerald-900 border border-emerald-700 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 text-xl">✅</span>
            <div>
              <p className="text-emerald-200 font-semibold">Specimen added successfully!</p>
              <p className="text-emerald-400 text-sm">All specimen fields were saved successfully.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/parami/similar-findings')}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              View Analysis
            </button>
            <button
              onClick={() => setSuccess(false)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Add Another
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-red-400">⚠️</span>
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">

        {/* ── Specimen Identification ── */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            Specimen Identification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InputField label="Specimen ID" required hint="e.g. SIG-001, FAH-002">
              <div className="flex gap-2">
                <input
                  type="text" name="specimen_id" value={form.specimen_id}
                  onChange={handleChange} placeholder="e.g. SIG-001"
                  className={inputClass}
                />
                <button
                  onClick={generateId}
                  className="bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs px-3 rounded-lg transition-colors whitespace-nowrap"
                  title="Auto-generate ID from site name"
                >
                  Auto
                </button>
              </div>
            </InputField>
            <InputField label="Skeleton Code" required hint="e.g. SK-SIG-01">
              <input
                type="text" name="skeleton_code" value={form.skeleton_code}
                onChange={handleChange} placeholder="e.g. SK-SIG-01"
                className={inputClass}
              />
            </InputField>
            <InputField label="Location Stored" hint="Where the specimen is kept">
              <input
                type="text" name="location_stored" value={form.location_stored}
                onChange={handleChange} placeholder="e.g. PGIAR"
                className={inputClass}
              />
            </InputField>
          </div>
        </div>

        {/* ── Site Information ── */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Site Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <InputField label="Site Name" required>
                <select name="site_name" value={form.site_name} onChange={handleChange} className={selectClass}>
                  <option value="">Select Archaeological Site</option>
                  {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </InputField>
            </div>
            <InputField label="District">
              <select name="district" value={form.district} onChange={handleChange} className={selectClass}>
                <option value="">Select District</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </InputField>
            <InputField label="Province">
              <select name="province" value={form.province} onChange={handleChange} className={selectClass}>
                <option value="">Select Province</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </InputField>
            <InputField label="Time Period">
              <select name="time_period" value={form.time_period} onChange={handleChange} className={selectClass}>
                <option value="">Select Time Period</option>
                {TIME_PERIODS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </InputField>
            <InputField label="Excavation Year">
              <input
                type="number" name="excavation_year" value={form.excavation_year}
                onChange={handleChange} placeholder="e.g. 2018"
                min="1800" max="2026" className={inputClass}
              />
            </InputField>
          </div>
        </div>

        {/* ── Bone Measurements ── */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
            Bone Measurements
            <span className="text-slate-500 text-xs font-normal ml-1">— used for similarity analysis</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InputField label="Bone Type">
              <select name="bone_type" value={form.bone_type} onChange={handleChange} className={selectClass}>
                <option value="">Select skeletal element...</option>
                {PP1_BONE_LABELS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </InputField>
            <InputField label="Side">
              <select name="side" value={form.side} onChange={handleChange} className={selectClass}>
                {!form.bone_type && <option value="">Select a skeletal element first</option>}
                {allowedSidesForCategory(form.bone_type).map(s => <option key={s} value={s}>{s === 'Unknown' && form.bone_type === 'Other' ? 'Not applicable' : s}</option>)}
              </select>
            </InputField>
            <InputField label="Preservation State">
              <select name="preservation_state" value={form.preservation_state} onChange={handleChange} className={selectClass}>
                <option value="">Select State</option>
                {PRESERVATION.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </InputField>
            <InputField label="Length (cm)" hint="Bone length in centimetres">
              <input
                type="number" name="length_cm" value={form.length_cm}
                onChange={handleChange} placeholder="e.g. 25.3"
                step="0.1" min="0" max="100" className={inputClass}
              />
            </InputField>
            <InputField label="Width (cm)" hint="Bone width in centimetres">
              <input
                type="number" name="width_cm" value={form.width_cm}
                onChange={handleChange} placeholder="e.g. 4.2"
                step="0.1" min="0" max="50" className={inputClass}
              />
            </InputField>
            <InputField label="Thickness (cm)" hint="Bone thickness in centimetres">
              <input
                type="number" name="thickness_cm" value={form.thickness_cm}
                onChange={handleChange} placeholder="e.g. 1.5"
                step="0.1" min="0" max="50" className={inputClass}
              />
            </InputField>
            <InputField label="Burial Context">
              <input
                type="text" name="burial_context" value={form.burial_context}
                onChange={handleChange} placeholder="e.g. Primary burial"
                className={inputClass}
              />
            </InputField>
          </div>
        </div>

        {/* ── Biological Profile ── */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            Biological Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Age Estimate" hint="e.g. Adult 30-40, Juvenile 12-16">
              <input
                type="text" name="age_estimate" value={form.age_estimate}
                onChange={handleChange} placeholder="e.g. Adult 30-40"
                className={inputClass}
              />
            </InputField>
            <InputField label="Sex Estimate">
              <select name="sex_estimate" value={form.sex_estimate} onChange={handleChange} className={selectClass}>
                <option value="">Select Sex</option>
                {SEX_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </InputField>
          </div>
        </div>

        {/* ── Additional Notes ── */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            Additional Notes
          </h3>
          <InputField label="Research Notes" hint="Any additional observations about this specimen">
            <textarea
              name="extra_notes" value={form.extra_notes}
              onChange={handleChange}
              placeholder="Enter any additional research notes or observations..."
              rows={3} className={`${inputClass} resize-none`}
            />
          </InputField>
        </div>

        {/* ── Preview (shows when specimen_id + site_name filled) ── */}
        {form.specimen_id && form.site_name && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              Preview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Specimen ID', value: form.specimen_id },
                { label: 'Site',        value: form.site_name },
                { label: 'Bone Type',   value: form.bone_type    || '—' },
                { label: 'Side',        value: form.side         || '—' },
                { label: 'Length',      value: form.length_cm    ? `${form.length_cm} cm`    : '—' },
                { label: 'Width',       value: form.width_cm     ? `${form.width_cm} cm`     : '—' },
                { label: 'Thickness',   value: form.thickness_cm ? `${form.thickness_cm} cm` : '—' },
                { label: 'Time Period', value: form.time_period  || '—' },
                { label: 'Age',         value: form.age_estimate || '—' },
                { label: 'Sex',         value: form.sex_estimate || '—' },
              ].map(item => (
                <div key={item.label} className="bg-slate-700 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                  <p className="text-slate-200 text-sm font-medium truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link to="/parami" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
            ← Cancel
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() => { setForm(EMPTY_FORM); setError(null); setSuccess(false) }}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-6 py-2.5 rounded-lg transition-colors border border-slate-600"
            >
              Clear Form
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm px-8 py-2.5 rounded-lg transition-colors font-medium"
            >
              {loading ? 'Saving...' : '💾 Save Specimen'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AddSpecimenPage
