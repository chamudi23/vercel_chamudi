import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function BoneList({ onSelectBone }) {
  const [bones, setBones] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSide, setFilterSide] = useState('All')
  const [filterCondition, setFilterCondition] = useState('All')

  useEffect(() => {
    fetchBones()
  }, [])

  const fetchBones = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bones')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setBones(data)
    setLoading(false)
  }

  const filtered = bones.filter(bone => {
    const matchSearch =
      bone.skeleton_id?.toLowerCase().includes(search.toLowerCase()) ||
      bone.bone_name?.toLowerCase().includes(search.toLowerCase())
    const matchSide = filterSide === 'All' || bone.side === filterSide
    const matchCondition = filterCondition === 'All' || bone.condition === filterCondition
    return matchSearch && matchSide && matchCondition
  })

  return (
    <div className="max-w-6xl mx-auto p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-200">
          Bone Records
        </h2>
        <span className="text-slate-400 text-sm">
          {filtered.length} records found
        </span>
      </div>

      {/* Search + Filters */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by Skeleton ID or Bone Name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 min-w-[200px]"
        />
        <select
          value={filterSide}
          onChange={e => setFilterSide(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Sides</option>
          <option>Left</option>
          <option>Right</option>
          <option>Midline</option>
          <option>N/A</option>
        </select>
        <select
          value={filterCondition}
          onChange={e => setFilterCondition(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Conditions</option>
          <option>Good</option>
          <option>Fair</option>
          <option>Poor</option>
          <option>Severely Damaged</option>
        </select>
        <button
          onClick={fetchBones}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">
          Loading records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          No records found
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Bone ID</th>
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Skeleton</th>
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Bone</th>
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Side</th>
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Condition</th>
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Fragmented</th>
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bone, index) => (
                <tr
                  key={bone.bone_id}
                  className={`border-b border-slate-700 hover:bg-slate-700 transition-colors ${
                    index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'
                  }`}
                >
                  <td className="px-6 py-4 text-slate-300 text-sm font-mono">
                    {bone.bone_id}
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-sm">
                    {bone.skeleton_id}
                  </td>
                  <td className="px-6 py-4 text-slate-100 text-sm font-medium">
                    {bone.bone_name}
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-sm">
                    {bone.side}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bone.condition === 'Good' ? 'bg-green-900 text-green-300' :
                      bone.condition === 'Fair' ? 'bg-yellow-900 text-yellow-300' :
                      bone.condition === 'Poor' ? 'bg-red-900 text-red-300' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {bone.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {bone.is_fragmented ? (
                      <span className="text-orange-400">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onSelectBone && onSelectBone(bone)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                    >
                      View Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default BoneList