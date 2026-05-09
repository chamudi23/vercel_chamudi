import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const BONE_GROUPS = {
  'Cranium': ['Cranium', 'Mandible'],
  'Upper Limb': ['Clavicle', 'Scapula', 'Humerus', 'Radius', 'Ulna'],
  'Ribcage': ['Sternum', 'Rib'],
  'Vertebral Column': ['Vertebra'],
  'Pelvic Girdle': ['Pelvis'],
  'Lower Limb': ['Femur', 'Patella', 'Tibia', 'Fibula'],
}

const BONE_POSITIONS = {
  'Cranium':   { top: '2%',  left: '38%', width: '24%', height: '12%' },
  'Mandible':  { top: '13%', left: '40%', width: '20%', height: '5%'  },
  'Clavicle-Left':  { top: '19%', left: '18%', width: '22%', height: '3%' },
  'Clavicle-Right': { top: '19%', left: '60%', width: '22%', height: '3%' },
  'Scapula-Left':   { top: '20%', left: '12%', width: '18%', height: '12%' },
  'Scapula-Right':  { top: '20%', left: '70%', width: '18%', height: '12%' },
  'Sternum':   { top: '19%', left: '40%', width: '20%', height: '14%' },
  'Rib-Left':  { top: '20%', left: '22%', width: '18%', height: '14%' },
  'Rib-Right': { top: '20%', left: '60%', width: '18%', height: '14%' },
  'Humerus-Left':  { top: '32%', left: '8%',  width: '12%', height: '18%' },
  'Humerus-Right': { top: '32%', left: '80%', width: '12%', height: '18%' },
  'Radius-Left':   { top: '50%', left: '5%',  width: '10%', height: '16%' },
  'Radius-Right':  { top: '50%', left: '85%', width: '10%', height: '16%' },
  'Ulna-Left':     { top: '50%', left: '12%', width: '10%', height: '16%' },
  'Ulna-Right':    { top: '50%', left: '78%', width: '10%', height: '16%' },
  'Vertebra':  { top: '18%', left: '42%', width: '16%', height: '30%' },
  'Pelvis':    { top: '48%', left: '32%', width: '36%', height: '14%' },
  'Femur-Left':  { top: '62%', left: '28%', width: '14%', height: '22%' },
  'Femur-Right': { top: '62%', left: '58%', width: '14%', height: '22%' },
  'Patella-Left':  { top: '83%', left: '29%', width: '10%', height: '4%' },
  'Patella-Right': { top: '83%', left: '61%', width: '10%', height: '4%' },
  'Tibia-Left':  { top: '87%', left: '28%', width: '10%', height: '18%' },
  'Tibia-Right': { top: '87%', left: '62%', width: '10%', height: '18%' },
  'Fibula-Left':  { top: '87%', left: '36%', width: '7%', height: '17%' },
  'Fibula-Right': { top: '87%', left: '57%', width: '7%', height: '17%' },
}

function SkeletonViewerPage() {
  const [selectedBone, setSelectedBone] = useState(null)
  const [images, setImages] = useState([])
  const [boneRecord, setBoneRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({})
  const [searchSkeleton, setSearchSkeleton] = useState('')
  const [filterBoneType, setFilterBoneType] = useState('')
  const [filterSide, setFilterSide] = useState('All')

  const handleBoneClick = async (boneName, side) => {
    setSelectedBone({ boneName, side })
    setLoading(true)
    setImages([])
    setBoneRecord(null)

    const { data: boneData } = await supabase
      .from('bones')
      .select('*')
      .ilike('bone_name', boneName)
      .ilike('side', side === 'Midline' ? 'Midline' : side)
      .limit(1)

    if (boneData && boneData.length > 0) {
      setBoneRecord(boneData[0])
      const { data: imageData } = await supabase
        .from('bone_images')
        .select('*')
        .eq('bone_id', boneData[0].bone_id)
      if (imageData) setImages(imageData)
    }
    setLoading(false)
  }

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }))
  }

  const getBoneKey = (boneName, side) => {
    if (side === 'Midline' || side === 'N/A') return boneName
    return `${boneName}-${side}`
  }

  const isSelected = (boneName, side) => {
    if (!selectedBone) return false
    return selectedBone.boneName === boneName && selectedBone.side === side
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">

      {/* LEFT PANEL */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-slate-200 font-semibold text-sm mb-3">
            Skeleton Viewer
          </h3>

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={searchSkeleton}
            onChange={e => setSearchSkeleton(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 mb-3"
          />

          {/* Specimen ID */}
          <div className="mb-2">
            <label className="text-slate-400 text-xs mb-1 block">
              Specimen ID:
            </label>
            <input
              type="text"
              placeholder="e.g. SK1"
              value={searchSkeleton}
              onChange={e => setSearchSkeleton(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Bone Type */}
          <div className="mb-2">
            <label className="text-slate-400 text-xs mb-1 block">
              Bone Type:
            </label>
            <select
              value={filterBoneType}
              onChange={e => setFilterBoneType(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Bones</option>
              {Object.values(BONE_GROUPS).flat().map(b => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Side */}
          <div className="mb-3">
            <label className="text-slate-400 text-xs mb-1 block">
              Side:
            </label>
            <select
              value={filterSide}
              onChange={e => setFilterSide(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option>All</option>
              <option>Left</option>
              <option>Right</option>
              <option>Midline</option>
            </select>
          </div>

          <button
            onClick={() => filterBoneType && handleBoneClick(filterBoneType, filterSide === 'All' ? 'Left' : filterSide)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm py-2 rounded-lg transition-colors"
          >
            Search
          </button>
        </div>

        {/* Bone Tree */}
        <div className="p-3 flex-1">
          {Object.entries(BONE_GROUPS).map(([group, bones]) => (
            <div key={group} className="mb-1">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-slate-300 hover:text-slate-100 text-sm font-medium"
              >
                <span>{expandedGroups[group] ? '▼' : '▶'}</span>
                {group}
              </button>
              {expandedGroups[group] && (
                <div className="ml-4">
                  {bones.map(bone => (
                    <div key={bone}>
                      {['Left', 'Right'].includes(filterSide) ? (
                        <button
                          onClick={() => handleBoneClick(bone, filterSide)}
                          className={`w-full text-left px-3 py-1 text-xs rounded-lg mb-0.5 transition-colors ${
                            isSelected(bone, filterSide)
                              ? 'bg-yellow-600 text-white'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                          }`}
                        >
                          ▶ {bone}
                        </button>
                      ) : (
                        <>
                          {['Left', 'Right', 'Midline'].map(side => (
                            <button
                              key={side}
                              onClick={() => handleBoneClick(bone, side)}
                              className={`w-full text-left px-3 py-1 text-xs rounded-lg mb-0.5 transition-colors ${
                                isSelected(bone, side)
                                  ? 'bg-yellow-600 text-white'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                              }`}
                            >
                              ▶ {bone} ({side})
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Highlight Options */}
        <div className="p-4 border-t border-slate-700">
          <label className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <input type="checkbox" defaultChecked className="accent-blue-500" />
            Highlight Parent Bone
          </label>
          <label className="flex items-center gap-2 text-slate-400 text-xs">
            <input type="checkbox" className="accent-blue-500" />
            Highlight Exact Fragment
          </label>
        </div>
      </div>

      {/* CENTER PANEL — Skeleton */}
      <div className="flex-1 bg-slate-850 flex flex-col items-center justify-center relative"
        style={{ background: '#1a2332' }}>

        <div className="relative" style={{ height: '85vh', width: '340px' }}>

          {/* Skeleton Image */}
          <img
            src="/skeleton.jpg"
            alt="Human Skeleton"
            style={{
              height: '100%',
              width: '100%',
              objectFit: 'contain',
              filter: 'brightness(0.85) sepia(0.3)',
              position: 'relative',
              zIndex: 1
            }}
          />

          {/* Clickable Overlay Regions */}
          {Object.entries(BONE_POSITIONS).map(([key, pos]) => {
            const parts = key.split('-')
            const boneName = parts[0]
            const side = parts[1] || 'Midline'
            const selected = isSelected(boneName, side)

            return (
              <div
                key={key}
                onClick={() => handleBoneClick(boneName, side)}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                  height: pos.height,
                  backgroundColor: selected
                    ? 'rgba(234, 179, 8, 0.45)'
                    : 'rgba(255,255,255,0)',
                  border: selected
                    ? '2px solid rgba(234,179,8,0.8)'
                    : '1px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  zIndex: 2,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!selected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)'
                  }
                }}
                onMouseLeave={e => {
                  if (!selected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0)'
                    e.currentTarget.style.border = '1px solid transparent'
                  }
                }}
              />
            )
          })}
        </div>

        {/* Bottom Label */}
        <div className="absolute bottom-4 flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          <span className="text-slate-300 text-sm">
            {selectedBone
              ? `${selectedBone.boneName} (${selectedBone.side})`
              : 'Click any bone to select'}
          </span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-80 bg-slate-800 border-l border-slate-700 overflow-y-auto">
        {!selectedBone ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm p-8 text-center">
            <div>
              <p className="text-3xl mb-3">👆</p>
              <p>Click any bone on the skeleton to view specimen data</p>
            </div>
          </div>
        ) : (
          <div className="p-5">

            {/* Specimen Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-400 text-xs">Specimen ID</p>
                <p className="text-slate-100 font-bold text-lg">
                  {boneRecord?.skeleton_id || 'No Record'}
                </p>
              </div>
            </div>

            {/* Bone Details */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Bone Name:</span>
                <span className="text-slate-100 text-sm font-medium">
                  {selectedBone.boneName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Side:</span>
                <span className="text-slate-100 text-sm">
                  {selectedBone.side}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Condition:</span>
                <span className={`text-sm font-medium ${
                  boneRecord?.condition === 'Good' ? 'text-green-400' :
                  boneRecord?.condition === 'Fair' ? 'text-yellow-400' :
                  boneRecord?.condition === 'Poor' ? 'text-red-400' :
                  'text-slate-400'
                }`}>
                  {boneRecord?.condition || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Preservation:</span>
                <span className="text-slate-100 text-sm">
                  {boneRecord?.preservation || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Context No:</span>
                <span className="text-slate-100 text-sm">
                  {boneRecord?.context_number || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Fragmented:</span>
                <span className={`text-sm font-medium ${
                  boneRecord?.is_fragmented ? 'text-orange-400' : 'text-green-400'
                }`}>
                  {boneRecord ? (boneRecord.is_fragmented ? 'Yes' : 'No') : 'N/A'}
                </span>
              </div>
            </div>

            {/* Notes */}
            {boneRecord?.notes && (
              <div className="bg-slate-700 rounded-lg p-3 mb-4">
                <p className="text-slate-400 text-xs mb-1">Notes</p>
                <p className="text-slate-300 text-sm">{boneRecord.notes}</p>
              </div>
            )}

            {!boneRecord && !loading && (
              <div className="bg-slate-700 rounded-lg p-3 mb-4 text-center">
                <p className="text-slate-400 text-sm">
                  No record found for this bone yet
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center text-slate-400 text-sm py-4">
                Loading...
              </div>
            )}

            {/* Images Section */}
            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-300 text-sm font-medium">
                  Images ({images.length})
                </p>
              </div>

              {images.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">
                  No images for this bone yet
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {images.map(img => (
                    <div key={img.image_id}
                      className="rounded-lg overflow-hidden bg-slate-700">
                      <img
                        src={img.file_url}
                        alt={img.image_type}
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-1.5">
                        <p className="text-slate-300 text-xs">
                          {img.image_type}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {img.view_angle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  )
}

export default SkeletonViewerPage