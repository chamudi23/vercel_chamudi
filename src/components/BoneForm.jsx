import { useState } from 'react'
import { supabase } from '../supabase'
import { PP1_BONE_LABELS, allowedSidesForCategory } from '../utils/pp1ImageModule'

function BoneForm() {
  const [form, setForm] = useState({
    skeleton_id: '',
    bone_name: '',
    side: 'Unknown',
    condition: 'Good',
    preservation: 'Good',
    context_number: '',
    species: 'Human',
    is_fragmented: false,
    notes: ''
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'bone_name') {
      const nextSides = allowedSidesForCategory(value)
      setForm(prev => ({ ...prev, bone_name: value, side: nextSides.includes(prev.side) ? prev.side : (nextSides[0] || 'Unknown') }))
      return
    }
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const generateId = () => {
    const num = Math.floor(Math.random() * 9000) + 1000
    return `BONE-${num}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const boneData = { ...form, bone_id: generateId() }

    const { error } = await supabase
      .from('bones')
      .insert([boneData])

    if (error) {
      setMessage('❌ Error: ' + error.message)
    } else {
      setMessage('✅ Bone record saved successfully!')
      setForm({
        skeleton_id: '',
        bone_name: '',
        side: 'Unknown',
        condition: 'Good',
        preservation: 'Good',
        context_number: '',
        species: 'Human',
        is_fragmented: false,
        notes: ''
      })
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-xl font-semibold mb-6 text-slate-200">
        Add New Bone Record
      </h2>

      <form onSubmit={handleSubmit}
        className="bg-slate-800 rounded-xl p-6 space-y-4">

        {/* Skeleton ID */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Skeleton ID *
          </label>
          <input
            type="text"
            name="skeleton_id"
            value={form.skeleton_id}
            onChange={handleChange}
            placeholder="e.g. SK1"
            required
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Context Number */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Context Number
          </label>
          <input
            type="text"
            name="context_number"
            value={form.context_number}
            onChange={handleChange}
            placeholder="e.g. CTX-003"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Bone Name */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Bone Name *
          </label>
          <select
            name="bone_name"
            value={form.bone_name}
            onChange={handleChange}
            required
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select skeletal element...</option>
            {PP1_BONE_LABELS.map((bone) => <option key={bone} value={bone}>{bone}</option>)}
          </select>
        </div>

        {/* Side */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Side</label>
          <select
            name="side"
            value={form.side}
            onChange={handleChange}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
          >
            {!form.bone_name && <option value="Unknown">Select a skeletal element first</option>}
            {allowedSidesForCategory(form.bone_name).map((side) => (
              <option key={side} value={side}>{side === 'Unknown' && form.bone_name === 'Other' ? 'Not applicable' : side}</option>
            ))}
          </select>
        </div>

        {/* Condition + Preservation side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Condition
            </label>
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
              <option>Severely Damaged</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Preservation
            </label>
            <select
              name="preservation"
              value={form.preservation}
              onChange={handleChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
              <option>Sub-fossil</option>
            </select>
          </div>
        </div>

        {/* Fragmented */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_fragmented"
            checked={form.is_fragmented}
            onChange={handleChange}
            className="w-4 h-4 accent-blue-500"
          />
          <label className="text-sm text-slate-400">
            This bone is fragmented
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any observations or additional details..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Bone Record'}
        </button>

        {message && (
          <p className="text-center text-sm mt-2">{message}</p>
        )}

      </form>
    </div>
  )
}

export default BoneForm
