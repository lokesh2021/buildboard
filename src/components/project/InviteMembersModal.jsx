import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const ROLES = ['editor', 'viewer']

export default function InviteMembersModal({ project, onClose }) {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    setFetching(true)
    const { data } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true })
    setMembers(data || [])
    setFetching(false)
  }

  async function handleInvite(e) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.')
      return
    }
    if (members.some((m) => m.invited_email === trimmed)) {
      setError('This email is already invited.')
      return
    }
    setError('')
    setLoading(true)
    const { error: dbError } = await supabase.rpc('invite_project_member', {
      p_project_id: project.id,
      p_email: trimmed,
      p_role: role,
    })
    setLoading(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      setEmail('')
      setSuccess(`Invite sent to ${trimmed}`)
      setTimeout(() => setSuccess(''), 3000)
      fetchMembers()
    }
  }

  async function handleRemove(member) {
    if (member.user_id === user.id) return // can't remove yourself
    await supabase.from('project_members').delete().eq('id', member.id)
    setMembers((prev) => prev.filter((m) => m.id !== member.id))
  }

  async function handleRoleChange(member, newRole) {
    await supabase.from('project_members').update({ role: newRole }).eq('id', member.id)
    setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, role: newRole } : m))
  }

  function getInitials(email) {
    return email ? email.slice(0, 2).toUpperCase() : 'U'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(14,14,14,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface">Team Members</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">{project.name}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Invite form */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-3">
              Invite by email
            </label>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="colleague@email.com"
                className="flex-1 bg-surface-container-low border border-outline-variant/15 rounded-lg py-2.5 px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/15 rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all capitalize"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="primary-gradient text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  : <><span className="material-symbols-outlined text-sm">send</span>Invite</>}
              </button>
            </form>
            {error && <p className="mt-2 text-xs text-error">{error}</p>}
            {success && <p className="mt-2 text-xs text-primary font-semibold">{success}</p>}
          </div>

          {/* Members list */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-3">
              {fetching ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {members.map((member) => {
                const isYou = member.user_id === user.id
                const isOwner = member.role === 'owner'
                const displayEmail = member.invited_email || '—'

                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">
                      {getInitials(displayEmail)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {displayEmail}
                        {isYou && <span className="ml-2 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">You</span>}
                      </p>
                      {!member.user_id && (
                        <p className="text-[10px] text-on-surface-variant">Invite pending</p>
                      )}
                    </div>

                    {isOwner ? (
                      <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">Owner</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member, e.target.value)}
                          disabled={isYou}
                          className="bg-surface-container border border-outline-variant/15 rounded text-xs py-1 px-2 outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                        {!isYou && (
                          <button
                            onClick={() => handleRemove(member)}
                            className="p-1 text-on-surface-variant hover:text-error transition-colors rounded"
                            title="Remove"
                          >
                            <span className="material-symbols-outlined text-base">person_remove</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-surface-container-low/50 border-t border-outline-variant/10 flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">info</span>
          Invited members can access this project as soon as they sign in with the invited email.
        </div>
      </div>
    </div>
  )
}
