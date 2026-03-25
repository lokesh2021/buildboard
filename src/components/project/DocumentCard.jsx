import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 1) return `${days} days ago`
  if (days === 1) return 'Yesterday'
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

const FILE_TYPES = {
  api: { icon: 'api', color: 'text-primary', bg: 'bg-primary/10' },
  doc: { icon: 'description', color: 'text-primary', bg: 'bg-primary/10' },
  pdf: { icon: 'picture_as_pdf', color: 'text-error', bg: 'bg-error/10' },
  sql: { icon: 'database', color: 'text-tertiary', bg: 'bg-tertiary-container/40' },
  sheet: { icon: 'table_chart', color: 'text-tertiary', bg: 'bg-tertiary-container/40' },
  security: { icon: 'security', color: 'text-error', bg: 'bg-error/10' },
  default: { icon: 'description', color: 'text-primary', bg: 'bg-primary/10' },
}

const STATUS_STYLES = {
  Critical: 'bg-primary/10 text-primary',
  Confidential: 'bg-error/10 text-error',
  Shared: 'bg-tertiary-container/50 text-tertiary',
  Draft: 'bg-surface-container-highest text-on-surface-variant',
}

export default function DocumentCard({ document, featured = false, onEdit, onDelete }) {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const fileType = FILE_TYPES[document.file_type] || FILE_TYPES.default
  const statusStyle = STATUS_STYLES[document.status] || STATUS_STYLES.Draft
  const authorInitials = (document.author || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  function handleCardClick() {
    navigate(`/project/${projectId}/documents/${document.id}`)
  }

  if (featured) {
    return (
      <div onClick={handleCardClick} className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-lg ring-1 ring-outline-variant/15 hover:ring-primary/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[260px]">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-lg ${fileType.bg} flex items-center justify-center ${fileType.color} flex-shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{fileType.icon}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors leading-tight">
                {document.title}
              </h3>
              <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{document.description}</p>
            </div>
          </div>
          <DotsMenu onEdit={onEdit} onDelete={onDelete} />
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold">
              {authorInitials}
            </div>
            {document.collaborators > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                +{document.collaborators}
              </div>
            )}
          </div>
          <div className="text-right">
            {document.status && (
              <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${statusStyle}`}>
                {document.status}
              </span>
            )}
            <div className="text-[11px] text-on-surface-variant mt-1.5 font-medium">
              Last updated: {timeAgo(document.updated_at || document.created_at)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div onClick={handleCardClick} className="bg-surface-container-lowest p-6 rounded-lg ring-1 ring-outline-variant/15 hover:ring-primary/30 transition-all cursor-pointer group flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className={`material-symbols-outlined ${fileType.color}`}>{fileType.icon}</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase">
              {document.file_type?.toUpperCase()} {document.file_size ? `• ${document.file_size}` : ''}
            </span>
            <DotsMenu onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
        <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
          {document.title}
        </h3>
        <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{document.description}</p>
      </div>

      <div className="mt-5 pt-4 border-t border-outline-variant/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[9px] font-bold">
            {authorInitials}
          </div>
          <span className="text-xs text-on-surface-variant font-medium truncate max-w-[100px]">
            {document.author || 'Unknown'}
          </span>
        </div>
        <span className="text-[11px] text-on-surface-variant">
          {timeAgo(document.updated_at || document.created_at)}
        </span>
      </div>
    </div>
  )
}

function DotsMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false)

  const actions = [
    { label: 'Edit', icon: 'edit', fn: onEdit },
    { label: 'Delete', icon: 'delete', fn: onDelete, danger: true },
  ]

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="p-1 text-on-surface-variant hover:text-on-surface rounded transition-colors"
      >
        <span className="material-symbols-outlined text-lg">more_vert</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
          <div className="absolute right-0 top-8 z-20 w-36 bg-surface-container-lowest rounded-lg shadow-lg ring-1 ring-outline-variant/15 py-1 text-sm">
            {actions.map(({ label, icon, fn, danger }) => (
              <button
                key={label}
                onClick={(e) => { e.stopPropagation(); setOpen(false); fn?.() }}
                className={`w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-surface-container-low transition-colors ${danger ? 'text-error' : 'text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-base">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
