import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export default function NewTaskModal({ projectId, department, defaultStatus = 'todo', onClose, onCreated, onUpdated, task: editTask = null }) {
  const isEdit = !!editTask
  const { user } = useAuth()

  const [title, setTitle] = useState(editTask?.title || '')
  const [description, setDescription] = useState(editTask?.description || '')
  const [priority, setPriority] = useState(editTask?.priority || 'medium')
  const [status, setStatus] = useState(editTask?.status || defaultStatus)
  const [dueDate, setDueDate] = useState(editTask?.due_date ? editTask.due_date.split('T')[0] : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const authorName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Unknown'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    setError('')
    setLoading(true)

    if (isEdit) {
      const { data, error: dbError } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          due_date: dueDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editTask.id)
        .select()
        .single()
      setLoading(false)
      if (dbError) { setError(dbError.message); return }
      onUpdated?.(data)
      onClose()
    } else {
      const { data, error: dbError } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          department,
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          due_date: dueDate || null,
          assignee: authorName,
          created_by: user.id,
        })
        .select()
        .single()
      setLoading(false)
      if (dbError) { setError(dbError.message); return }
      onCreated?.(data)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(14,14,14,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-5">
            {error && (
              <div className="p-3 bg-error-container/20 border border-error/20 rounded-lg text-sm text-error">{error}</div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement auth middleware"
                autoFocus
                className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done?"
                rows={3}
                className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all border ${
                        priority === p
                          ? p === 'high' ? 'bg-error/10 border-error/30 text-error'
                          : p === 'medium' ? 'bg-tertiary-container/40 border-tertiary/30 text-tertiary'
                          : 'bg-surface-container-highest border-outline-variant/30 text-on-surface-variant'
                          : 'border-outline-variant/10 text-on-surface-variant/60 hover:border-outline-variant/30'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="px-8 py-5 bg-surface-container-low/50 border-t border-outline-variant/10 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-on-surface-variant font-semibold text-sm hover:text-on-surface transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="primary-gradient text-on-primary px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2 text-sm"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
