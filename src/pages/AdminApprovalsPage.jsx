/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const ROLES = ['student', 'researcher', 'admin']

function StatusBadge({ status }) {
  const map = {
    pending: 'bg-yellow-900 text-yellow-300',
    approved: 'bg-emerald-900 text-emerald-300',
    rejected: 'bg-red-900 text-red-300',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-slate-700 text-slate-400'}`}>
      {status}
    </span>
  )
}

export default function AdminApprovalsPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)

  async function load() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, status, created_at')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateProfile(userId, changes) {
    setSavingId(userId)
    const { error: err } = await supabase.from('profiles').update(changes).eq('user_id', userId)
    if (err) {
      setError(err.message)
    } else {
      setProfiles((prev) => prev.map((p) => (p.user_id === userId ? { ...p, ...changes } : p)))
    }
    setSavingId(null)
  }

  const pending = profiles.filter((p) => p.status === 'pending')
  const others = profiles.filter((p) => p.status !== 'pending')

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100">Account Approvals</h2>
        <p className="text-slate-400 text-sm mt-1">
          Review new sign-ups, set their role, and approve or reject access to OAHRIS.
        </p>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 rounded-xl p-4 mb-6 text-red-200 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading accounts...</div>
      ) : (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-slate-200 font-semibold">Pending Approval</h3>
              <span className="text-yellow-400 text-sm font-medium bg-yellow-900/40 px-3 py-1 rounded-full">
                {pending.length}
              </span>
            </div>
            {pending.length === 0 ? (
              <div className="p-6 text-slate-500 text-sm">No accounts waiting for approval.</div>
            ) : (
              <div className="divide-y divide-slate-700">
                {pending.map((p) => (
                  <div key={p.user_id} className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-slate-200 font-medium">{p.full_name || '(no name given)'}</p>
                      <p className="text-slate-500 text-xs font-mono mt-0.5">{p.user_id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={p.role}
                        onChange={(e) => updateProfile(p.user_id, { role: e.target.value })}
                        className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        disabled={savingId === p.user_id}
                        onClick={() => updateProfile(p.user_id, { status: 'approved' })}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        disabled={savingId === p.user_id}
                        onClick={() => updateProfile(p.user_id, { status: 'rejected' })}
                        className="bg-red-600 hover:bg-red-500 disabled:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-slate-200 font-semibold">All Other Accounts</h3>
            </div>
            {others.length === 0 ? (
              <div className="p-6 text-slate-500 text-sm">No other accounts yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left px-6 py-3 text-slate-400 font-medium">Name</th>
                      <th className="text-left px-6 py-3 text-slate-400 font-medium">Role</th>
                      <th className="text-left px-6 py-3 text-slate-400 font-medium">Status</th>
                      <th className="text-left px-6 py-3 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {others.map((p) => (
                      <tr key={p.user_id} className="border-b border-slate-700 last:border-0">
                        <td className="px-6 py-3 text-slate-200">{p.full_name || '—'}</td>
                        <td className="px-6 py-3">
                          <select
                            value={p.role}
                            onChange={(e) => updateProfile(p.user_id, { role: e.target.value })}
                            className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-6 py-3">
                          {p.status === 'rejected' ? (
                            <button
                              disabled={savingId === p.user_id}
                              onClick={() => updateProfile(p.user_id, { status: 'approved' })}
                              className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                            >
                              Re-approve
                            </button>
                          ) : (
                            <button
                              disabled={savingId === p.user_id}
                              onClick={() => updateProfile(p.user_id, { status: 'rejected' })}
                              className="text-red-400 hover:text-red-300 text-sm transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
