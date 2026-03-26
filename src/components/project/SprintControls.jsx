import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function formatPeriod(sprint) {
  if (!sprint.start_date && !sprint.end_date) return null
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (sprint.start_date && sprint.end_date) return `${fmt(sprint.start_date)} – ${fmt(sprint.end_date)}`
  if (sprint.start_date) return `From ${fmt(sprint.start_date)}`
  return `Until ${fmt(sprint.end_date)}`
}

export default function SprintControls({ projectId, department, activeSprint, onSprintChange }) {
  const [sprints, setSprints] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (projectId) fetchSprints()
  }, [projectId, department])

  async function fetchSprints() {
    const { data } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .eq('department', department)
      .order('created_at', { ascending: false })
    const list = data || []
    setSprints(list)
    if (!activeSprint && list.length > 0) {
      const active = list.find((s) => s.is_active) || list[0]
      onSprintChange(active)
    }
  }

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    const isFirst = sprints.length === 0
    const { data } = await supabase
      .from('sprints')
      .insert({
        project_id: projectId,
        department,
        name: name.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isFirst,
      })
      .select()
      .single()
    setCreating(false)
    if (data) {
      setSprints((prev) => [data, ...prev])
      onSprintChange(data)
      setShowCreate(false)
      setName('')
      setStartDate('')
      setEndDate('')
    }
  }

  async function setActive(sprint) {
    await supabase
      .from('sprints')
      .update({ is_active: false })
      .eq('project_id', projectId)
      .eq('department', department)
    await supabase.from('sprints').update({ is_active: true }).eq('id', sprint.id)
    const updated = { ...sprint, is_active: true }
    setSprints((prev) => prev.map((s) => ({ ...s, is_active: s.id === sprint.id })))
    onSprintChange(updated)
    setShowDropdown(false)
  }

  const period = activeSprint ? formatPeriod(activeSprint) : null

  return (
    <div className="flex items-center gap-2">
      {/* Sprint selector pill */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown((o) => !o)}
          className="flex items-center gap-2 h-9 px-3 bg-surface-container-lowest ring-1 ring-outline-variant/15 rounded-lg text-sm font-medium hover:bg-surface-container-low transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${activeSprint?.is_active ? 'bg-primary' : 'bg-outline-variant'}`}
          />
          {activeSprint ? (
            <>
              <span className="font-semibold text-on-surface">{activeSprint.name}</span>
              {activeSprint.is_active && (
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded uppercase tracking-wider">
                  Active
                </span>
              )}
              {period && (
                <span className="text-on-surface-variant text-xs hidden lg:inline">{period}</span>
              )}
            </>
          ) : (
            <span className="text-on-surface-variant">Select sprint</span>
          )}
          <span className="material-symbols-outlined text-sm text-on-surface-variant ml-0.5">unfold_more</span>
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowDropdown(false)} />
            <div className="absolute left-0 top-full mt-1 z-30 w-64 bg-surface-container-lowest rounded-xl shadow-lg ring-1 ring-outline-variant/10 py-2 overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
                Sprints
              </div>

              {sprints.length === 0 ? (
                <p className="px-3 py-2 text-xs text-on-surface-variant/50 italic">No sprints yet</p>
              ) : (
                sprints.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => { onSprintChange(s); setShowDropdown(false) }}
                    className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors ${
                      activeSprint?.id === s.id
                        ? 'text-primary bg-primary/5'
                        : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.is_active ? 'bg-primary' : 'bg-outline-variant'}`}
                      />
                      <span className="text-sm truncate">{s.name}</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {s.is_active && (
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded uppercase">
                          Active
                        </span>
                      )}
                      {!s.is_active && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setActive(s) }}
                          className="text-[10px] text-on-surface-variant hover:text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-surface-container-high"
                        >
                          Set active
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              <div className="border-t border-outline-variant/10 mt-1 pt-1">
                <button
                  onClick={() => { setShowDropdown(false); setShowCreate(true) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-surface-container-low transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  New Sprint
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create sprint modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(14,14,14,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center">
              <h2 className="text-lg font-bold tracking-tight text-on-surface">New Sprint</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Sprint Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Sprint 43 · Week 12"
                  autoFocus
                  className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/10 flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-on-surface-variant font-semibold text-sm hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="primary-gradient text-on-primary px-6 py-2 rounded-lg font-bold shadow-sm shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2 text-sm"
              >
                {creating ? (
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Create Sprint'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
