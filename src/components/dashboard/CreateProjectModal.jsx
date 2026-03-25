import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function CreateProjectModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitees, setInvitees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addInvitee() {
    const email = inviteEmail.trim()
    if (!email || invitees.includes(email)) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setInvitees((prev) => [...prev, email])
    setInviteEmail('')
  }

  function removeInvitee(email) {
    setInvitees((prev) => prev.filter((e) => e !== email))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Project name is required.')
      return
    }
    setLoading(true)
    const { data, error: dbError } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        description: description.trim(),
        owner_id: user.id,
      })
      .select()
      .single()

    setLoading(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      onCreated(data)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(14,14,14,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleCreate}>
          <div className="p-8 space-y-6">
            {error && (
              <div className="p-3 bg-error-container/20 border border-error/20 rounded-lg text-sm text-error">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant block">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Awesome App"
                className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the project goals and scope..."
                rows={3}
                className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40 resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-on-surface-variant">
                  Invite Team Members
                </label>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  Optional
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                    mail
                  </span>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInvitee())}
                    placeholder="colleague@email.com"
                    className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={addInvitee}
                  className="bg-surface-container-high px-4 rounded-lg text-on-surface font-semibold text-sm hover:bg-surface-container-highest transition-colors"
                >
                  Add
                </button>
              </div>

              {invitees.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {invitees.map((email) => {
                    const initials = email.slice(0, 2).toUpperCase()
                    return (
                      <div
                        key={email}
                        className="flex items-center gap-2 bg-primary/5 text-primary text-xs font-bold pl-1.5 pr-2.5 py-1.5 rounded-lg"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary-container flex items-center justify-center text-[8px]">
                          {initials}
                        </div>
                        {email}
                        <button
                          type="button"
                          onClick={() => removeInvitee(email)}
                          className="hover:text-primary-dim"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-surface-container-low/50 border-t border-outline-variant/10 flex justify-end items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-on-surface-variant font-semibold text-sm hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="primary-gradient text-on-primary px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
