import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
]

const PROVINCES = [
  'Central', 'Eastern', 'North Central', 'North Western',
  'Northern', 'Sabaragamuwa', 'Southern', 'Uva', 'Western'
]

const SITE_TYPES = [
  'Burial Ground', 'Cave Site', 'Rock Shelter', 'Ancient City',
  'Religious Site', 'Rock Fortress', 'Ancient Port', 'Megalithic Site',
  'Habitation Site', 'Other'
]

const TIME_PERIODS = [
  'Prehistoric', 'Mesolithic', 'Upper Paleolithic',
  'Iron Age', 'Early Historic', 'Classical Period', 'Medieval', 'Modern'
]

const RISK_LEVELS = ['High', 'Medium', 'Low']

function InputField({ label, required, children, hint }) {
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

function AddSitePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    site_name: '',
    district: '',
    province: '',
    latitude: '',
    longitude: '',
    site_type: '',
    time_period: '',
    risk_level: '',
    excavation_year: '',
    protected_status: 'false',
    description: '',
  })

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!form.site_name.trim()) {
      setError('Site name is required.')
      return
    }
    if (!form.latitude || !form.longitude) {
      setError('Latitude and longitude are required.')
      return
    }
    if (isNaN(parseFloat(form.latitude)) || isNaN(parseFloat(form.longitude))) {
      setError('Latitude and longitude must be valid numbers.')
      return
    }
    if (parseFloat(form.latitude) < 5.9 || parseFloat(form.latitude) > 9.9) {
      setError('Latitude must be between 5.9 and 9.9 (Sri Lanka range).')
      return
    }
    if (parseFloat(form.longitude) < 79.5 || parseFloat(form.longitude) > 81.9) {
      setError('Longitude must be between 79.5 and 81.9 (Sri Lanka range).')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: err } = await supabase.from('sites').insert([{
        site_name:        form.site_name.trim(),
        district:         form.district || null,
        province:         form.province || null,
        latitude:         parseFloat(form.latitude),
        longitude:        parseFloat(form.longitude),
        site_type:        form.site_type || null,
        time_period:      form.time_period || null,
        risk_level:       form.risk_level || null,
        excavation_year:  form.excavation_year ? parseInt(form.excavation_year) : null,
        protected_status: form.protected_status,
        description:      form.description.trim() || null,
      }])

      if (err) throw err

      setSuccess(true)
      setForm({
        site_name: '', district: '', province: '',
        latitude: '', longitude: '', site_type: '',
        time_period: '', risk_level: '', excavation_year: '',
        protected_status: 'false', description: '',
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-slate-500"
  const selectClass = "w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"

  return (
    <div className="max-w-4xl mx-auto p-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-blue-400 text-xs font-medium uppercase tracking-widest mb-2">
            IT22889874 — Parami's Module
          </p>
          <h2 className="text-2xl font-bold text-slate-100">Add Archaeological Site</h2>
          <p className="text-slate-400 text-sm mt-1">
            Enter new excavation site data for the OAHRIS system
          </p>
        </div>
        <Link to="/parami/home" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
          ← Back to GIS Home
        </Link>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-900 border border-emerald-700 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 text-xl">✅</span>
            <div>
              <p className="text-emerald-200 font-semibold">Site added successfully!</p>
              <p className="text-emerald-400 text-sm">The site has been saved to the database.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/parami')}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              View on Map
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-red-400 text-xl">⚠️</span>
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">

        {/* Basic Information */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <InputField label="Site Name" required>
                <input
                  type="text"
                  name="site_name"
                  value={form.site_name}
                  onChange={handleChange}
                  placeholder="e.g. Ibbankatuwa Burial Ground"
                  className={inputClass}
                />
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
          </div>
        </div>

        {/* Location */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            GPS Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Latitude" required hint="Sri Lanka range: 5.9 to 9.9">
              <input
                type="number"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                placeholder="e.g. 7.8667"
                step="0.0001"
                className={inputClass}
              />
            </InputField>
            <InputField label="Longitude" required hint="Sri Lanka range: 79.5 to 81.9">
              <input
                type="number"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                placeholder="e.g. 80.6500"
                step="0.0001"
                className={inputClass}
              />
            </InputField>
          </div>
          <div className="mt-4 bg-slate-700 rounded-lg p-3 text-xs text-slate-400">
             Use Google Maps to get GPS coordinates — right-click on the site location and copy the coordinates.

          </div>
        </div>

        {/* Archaeological Details */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
            Archaeological Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Site Type">
              <select name="site_type" value={form.site_type} onChange={handleChange} className={selectClass}>
                <option value="">Select Site Type</option>
                {SITE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </InputField>
            <InputField label="Time Period">
              <select name="time_period" value={form.time_period} onChange={handleChange} className={selectClass}>
                <option value="">Select Time Period</option>
                {TIME_PERIODS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </InputField>
            <InputField label="Excavation Year" hint="Year the site was first excavated">
              <input
                type="number"
                name="excavation_year"
                value={form.excavation_year}
                onChange={handleChange}
                placeholder="e.g. 2015"
                min="1800"
                max="2026"
                className={inputClass}
              />
            </InputField>
            <InputField label="Risk Level">
              <select name="risk_level" value={form.risk_level} onChange={handleChange} className={selectClass}>
                <option value="">Select Risk Level</option>
                {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </InputField>
          </div>
        </div>

        {/* Conservation */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            Conservation Status
          </h3>
          <InputField label="Protected Status">
            <div className="flex gap-4 mt-1">
              {[
                { value: 'true', label: '✅ Protected', desc: 'Legally protected site' },
                { value: 'false', label: '❌ Not Protected', desc: 'No legal protection' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    form.protected_status === opt.value
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="protected_status"
                    value={opt.value}
                    checked={form.protected_status === opt.value}
                    onChange={handleChange}
                    className="accent-blue-500"
                  />
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{opt.label}</p>
                    <p className="text-slate-500 text-xs">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </InputField>
        </div>

        {/* Description */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            Research Notes
          </h3>
          <InputField label="Description" hint="Additional notes about the site, findings, or research observations">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter any additional information about this archaeological site..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </InputField>
        </div>

        {/* Preview */}
        {form.site_name && form.latitude && form.longitude && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              Preview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Site Name', value: form.site_name },
                { label: 'Location', value: form.district ? `${form.district}, ${form.province}` : '—' },
                { label: 'Coordinates', value: `${parseFloat(form.latitude || 0).toFixed(4)}, ${parseFloat(form.longitude || 0).toFixed(4)}` },
                { label: 'Period', value: form.time_period || '—' },
                { label: 'Type', value: form.site_type || '—' },
                { label: 'Risk', value: form.risk_level || '—' },
                { label: 'Protected', value: form.protected_status === 'true' ? '✅ Yes' : '❌ No' },
                { label: 'Excavated', value: form.excavation_year || '—' },
              ].map(item => (
                <div key={item.label} className="bg-slate-700 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                  <p className="text-slate-200 text-sm font-medium truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Link
            to="/parami/home"
            className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            ← Cancel
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() => setForm({
                site_name: '', district: '', province: '',
                latitude: '', longitude: '', site_type: '',
                time_period: '', risk_level: '', excavation_year: '',
                protected_status: 'false', description: '',
              })}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-6 py-2.5 rounded-lg transition-colors border border-slate-600"
            >
              Clear Form
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm px-8 py-2.5 rounded-lg transition-colors font-medium"
            >
              {loading ? 'Saving...' : '💾 Save Site'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AddSitePage
