import { useState } from 'react'

// ─── config ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'To Do',       dot: 'bg-outline-variant' },
  { value: 'in_progress', label: 'In Progress',  dot: 'bg-primary' },
  { value: 'done',        label: 'Done',         dot: 'bg-green-500' },
]

const PRIORITY_CONFIG = {
  high:   { label: 'High',   icon: 'keyboard_double_arrow_up',   color: 'text-error',              bg: 'bg-error/10' },
  medium: { label: 'Med',    icon: 'drag_handle',                color: 'text-tertiary',           bg: 'bg-tertiary-container/40' },
  low:    { label: 'Low',    icon: 'keyboard_double_arrow_down', color: 'text-on-surface-variant', bg: 'bg-surface-container-highest' },
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diff = d - now
  const days = Math.ceil(diff / 86400000)

  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const isOverdue = days < 0
  const isDueSoon = days >= 0 && days <= 3
  return { label, isOverdue, isDueSoon }
}

function getInitials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Inline status dot + picker ───────────────────────────────────────────────

function StatusDot({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0]

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        title={cfg.label}
        className={`w-3.5 h-3.5 rounded-full ${cfg.dot} ring-2 ring-background hover:scale-125 transition-transform cursor-pointer`}
      />

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
          <div className="absolute left-0 top-5 z-30 bg-surface-container-lowest rounded-xl shadow-lg ring-1 ring-outline-variant/10 py-1.5 min-w-[150px]">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={(e) => { e.stopPropagation(); onChange(s.value); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                  s.value === value ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
                <span className={`font-medium ${s.value === value ? 'text-primary' : 'text-on-surface'}`}>
                  {s.label}
                </span>
                {s.value === value && (
                  <span className="material-symbols-outlined text-primary text-sm ml-auto">check</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Single task row ──────────────────────────────────────────────────────────

function TaskRow({ task, onView, onStatusChange }) {
  const priority  = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low
  const isDone    = task.status === 'done'
  const dateInfo  = task.due_date && !isDone ? formatDate(task.due_date) : null

  return (
    <div
      onClick={() => onView(task)}
      className="group flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors"
    >
      {/* Status dot (stop-propagation so click doesn't open drawer) */}
      <StatusDot
        value={task.status}
        onChange={(newStatus) => onStatusChange(task, newStatus)}
      />

      {/* Title */}
      <span
        className={`flex-1 min-w-0 text-sm font-medium truncate transition-colors ${
          isDone
            ? 'line-through text-on-surface-variant/50'
            : 'text-on-surface group-hover:text-primary'
        }`}
      >
        {task.title}
      </span>

      {/* Labels (hidden on small screens) */}
      {(task.labels || []).length > 0 && (
        <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
          {(task.labels || []).slice(0, 2).map((label) => (
            <span
              key={label}
              className="px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] rounded font-medium"
            >
              {label}
            </span>
          ))}
          {(task.labels || []).length > 2 && (
            <span className="text-[10px] text-on-surface-variant/50">+{(task.labels || []).length - 2}</span>
          )}
        </div>
      )}

      {/* Due date */}
      <div className="flex-shrink-0 w-[84px] text-right">
        {dateInfo ? (
          <span className={`text-[11px] flex items-center justify-end gap-0.5 ${
            dateInfo.isOverdue ? 'text-error font-semibold' :
            dateInfo.isDueSoon ? 'text-tertiary font-semibold' :
            'text-on-surface-variant'
          }`}>
            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
            {dateInfo.label}
          </span>
        ) : isDone ? (
          <span className="text-[10px] text-on-surface-variant/40">Completed</span>
        ) : (
          <span className="text-[10px] text-on-surface-variant/25">—</span>
        )}
      </div>

      {/* Priority */}
      <div className="flex-shrink-0 w-16 flex justify-end">
        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${priority.bg} ${priority.color}`}>
          <span className="material-symbols-outlined text-[11px]">{priority.icon}</span>
          {priority.label}
        </span>
      </div>
    </div>
  )
}

// ─── User group (collapsible) ─────────────────────────────────────────────────

function UserGroup({ assignee, tasks, onViewTask, onStatusChange }) {
  const [collapsed, setCollapsed] = useState(false)

  const done     = tasks.filter((t) => t.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0

  // Sort: in_progress first, todo next, done last
  const sorted = [...tasks].sort((a, b) => {
    const order = { in_progress: 0, todo: 1, done: 2 }
    return (order[a.status] ?? 1) - (order[b.status] ?? 1)
  })

  return (
    <div className="mb-1">
      {/* Group header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">
          {getInitials(assignee)}
        </div>

        {/* Name */}
        <span className="font-semibold text-on-surface text-sm">
          {assignee || 'Unassigned'}
        </span>

        {/* Count badge */}
        <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-full">
          {tasks.length}
        </span>

        {/* Progress bar + % */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-2 ml-1">
            <div className="w-20 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-on-surface-variant/50 tabular-nums w-7">{progress}%</span>
          </div>
        )}

        {/* In-progress count pill */}
        {tasks.filter((t) => t.status === 'in_progress').length > 0 && (
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded uppercase tracking-wider">
            {tasks.filter((t) => t.status === 'in_progress').length} active
          </span>
        )}

        {/* Chevron */}
        <span
          className={`material-symbols-outlined text-sm text-on-surface-variant ml-auto transition-transform duration-200 ${
            collapsed ? '-rotate-90' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Task rows */}
      {!collapsed && (
        <div className="ml-5 border-l-2 border-outline-variant/10 pl-4 mt-0.5 mb-2">
          {/* Column labels */}
          <div className="flex items-center gap-3 px-3 py-1.5 mb-1">
            <div className="w-3.5 flex-shrink-0" />
            <span className="flex-1 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
              Task
            </span>
            <span className="hidden lg:block text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest w-16 text-right">
              Labels
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest w-[84px] text-right">
              Due
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest w-16 text-right">
              Priority
            </span>
          </div>

          <div className="space-y-0.5">
            {sorted.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onView={onViewTask}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main list view ───────────────────────────────────────────────────────────

export default function TaskListView({ tasks, search, onViewTask, onStatusChange }) {
  // Filter by search
  const filtered = tasks.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
  })

  // Group by assignee
  const groupMap = {}
  filtered.forEach((task) => {
    const key = task.assignee || ''
    if (!groupMap[key]) groupMap[key] = []
    groupMap[key].push(task)
  })

  // Sort: named assignees alphabetically, unassigned last
  const sortedKeys = Object.keys(groupMap).sort((a, b) => {
    if (!a && b) return 1
    if (a && !b) return -1
    return a.localeCompare(b)
  })

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-on-surface-variant/40">
        <span className="material-symbols-outlined text-5xl">assignment</span>
        <p className="text-sm font-medium">
          {search ? 'No tasks match your search.' : 'No tasks yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {sortedKeys.map((key) => (
        <UserGroup
          key={key || '__unassigned__'}
          assignee={key || null}
          tasks={groupMap[key]}
          onViewTask={onViewTask}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  )
}
