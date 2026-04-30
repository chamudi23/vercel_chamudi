import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BoneForm from '../components/BoneForm'
import BoneList from '../components/BoneList'

function BonePage() {
  const [view, setView] = useState('list')
  const navigate = useNavigate()

  const handleSelectBone = (bone) => {
    navigate(`/bones/${bone.bone_id}`)
  }

  return (
    <div>
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-3 flex gap-4">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'list'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Records
        </button>
        <button
          onClick={() => setView('add')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'add'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          + Add New Bone
        </button>
      </div>

      {view === 'list' ? (
        <BoneList onSelectBone={handleSelectBone} />
      ) : (
        <BoneForm />
      )}
    </div>
  )
}

export default BonePage