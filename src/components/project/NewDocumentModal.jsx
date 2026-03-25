import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const FILE_TYPES = ['doc', 'pdf', 'api', 'sql', 'sheet', 'security']
const STATUSES = ['Draft', 'Shared', 'Critical', 'Confidential']

// Pass `document` prop to enter edit mode
export default function NewDocumentModal({ projectId, department, onClose, onCreated, onUpdated, document: editDoc = null }) {
  const isEdit = !!editDoc
  const { user } = useAuth()
  const [title, setTitle] = useState(editDoc?.title || '')
  const [description, setDescription] = useState(editDoc?.description || '')
  const [fileType, setFileType] = useState(editDoc?.file_type || 'doc')
  const [status, setStatus] = useState(editDoc?.status || 'Draft')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const authorName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Unknown'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required.'); return }

    setLoading(true)

    if (isEdit) {
      const { data, error: dbError } = await supabase
        .from('documents')
        .update({ title: title.trim(), description: description.trim(), file_type: fileType, status })
        .eq('id', editDoc.id)
        .select()
        .single()
      setLoading(false)
      if (dbError) { setError(dbError.message) }
      else { onUpdated?.(data); onClose() }
    } else {
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          department,
          title: title.trim(),
          description: description.trim(),
          file_type: fileType,
          status,
          author: authorName,
          created_by: user.id,
          collaborators: 0,
        })
        .select()
        .single()
      setLoading(false)
      if (dbError) { setError(dbError.message) }
      else { onCreated?.(data); onClose() }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(14,14,14,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">
            {isEdit ? 'Edit Document' : 'New Document'}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container-low">
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
                placeholder="e.g. API Docs - Core Services v2"
                className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this document's purpose..."
                rows={3}
                className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">File Type</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  {FILE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
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
              {loading ? <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" /> : isEdit ? 'Save Changes' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
