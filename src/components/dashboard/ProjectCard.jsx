function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

// Simple deterministic color from string
const ACCENT_COLORS = [
  { bg: 'bg-primary-container/40', text: 'text-primary', icon: 'bg-primary-container' },
  { bg: 'bg-tertiary-container/40', text: 'text-tertiary', icon: 'bg-tertiary-container' },
  { bg: 'bg-secondary-container/40', text: 'text-secondary', icon: 'bg-secondary-container' },
]

function colorFor(id) {
  const hash = [...(id || 'x')].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ACCENT_COLORS[hash % ACCENT_COLORS.length]
}

import { useNavigate } from 'react-router-dom'

export default function ProjectCard({ project }) {
  const color = colorFor(project.id)
  const progress = project.progress ?? 0
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:border-outline-variant/20 transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      {/* Color band */}
      <div className={`h-1.5 w-full ${color.icon} opacity-60`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg ${color.icon} flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${color.text}`}>folder_open</span>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${color.text} ${color.bg} px-2.5 py-1 rounded-full`}>
            Active
          </span>
        </div>

        {/* Name + description */}
        <h3 className="font-bold text-on-surface text-base mt-4 mb-1 leading-snug">
          {project.name}
        </h3>
        <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
          {project.description || 'No description yet.'}
        </p>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Progress
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full primary-gradient rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] text-on-surface-variant/60">
            Updated {timeAgo(project.updated_at || project.created_at)}
          </span>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-semibold text-primary">
            Open
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}
