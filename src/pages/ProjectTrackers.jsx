import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ProjectSidebar from '../components/project/ProjectSidebar'
import NewTaskModal from '../components/project/NewTaskModal'
import InviteMembersModal from '../components/project/InviteMembersModal'
import SprintControls from '../components/project/SprintControls'
import TaskDetailDrawer from '../components/project/TaskDetailDrawer'
import TaskListView from '../components/project/TaskListView'

// ─── constants ───────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'todo',        label: 'To Do',      countStyle: 'bg-surface-container-high text-on-surface-variant' },
  { id: 'in_progress', label: 'In Progress', countStyle: 'bg-primary-container text-primary' },
  { id: 'done',        label: 'Done',        countStyle: 'bg-surface-container-high text-on-surface-variant' },
]

const PRIORITY_STYLES = {
  high:   'bg-error/10 text-error',
  medium: 'bg-tertiary-container/40 text-tertiary',
  low:    'bg-surface-container-highest text-on-surface-variant',
}

const DEPT_LABELS = {
  engineering: 'Engineering',
  marketing:   'Marketing',
  product:     'Product',
  design:      'Design',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name) {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── TaskCard ────────────────────────────────────────────────────────────────
// onView is only called when the user clicks without dragging.
// Drag detection is handled by the parent via the dragOccurred ref; onView is
// already guarded before it reaches this component (see onViewTask wrapper in
// the page).

function TaskCard({ task, onEdit, onDelete, onView, overlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const isDone       = task.status === 'done'
  const isInProgress = task.status === 'in_progress'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onView?.()}
      className={`group cursor-grab active:cursor-grabbing p-4 rounded-lg border transition-shadow
        ${isDone
          ? 'bg-surface-container-low opacity-75 border-outline-variant/10 shadow-sm'
          : isInProgress
          ? 'bg-white/80 backdrop-blur-sm border-l-4 border-primary border-y-outline-variant/10 border-r-outline-variant/10 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md'
          : 'bg-white/80 backdrop-blur-sm border-outline-variant/10 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md'}
        ${overlay ? 'shadow-2xl rotate-2 scale-105' : ''}`}
    >
      {/* Priority + menu */}
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.low}`}>
          {task.priority}
        </span>
        {isDone
          ? <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          : <TaskMenu onEdit={onEdit} onDelete={onDelete} />
        }
      </div>

      {/* Title */}
      <h4 className={`font-semibold text-sm mb-1 leading-snug ${isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
        {task.title}
      </h4>

      {/* Labels */}
      {(task.labels || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {(task.labels || []).slice(0, 3).map((label) => (
            <span key={label} className="px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] rounded font-medium">
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <div className="w-7 h-7 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">
          {getInitials(task.assignee)}
        </div>

        <div className="flex items-center gap-3">
          {isInProgress && (
            <div className="w-14 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-primary rounded-full" />
            </div>
          )}
          {task.due_date && !isDone && (
            <div className="flex items-center text-on-surface-variant text-[10px] gap-1">
              <span className="material-symbols-outlined text-[13px]">calendar_today</span>
              {formatDate(task.due_date)}
            </div>
          )}
          {isDone && (
            <span className="text-[10px] text-on-surface-variant/60 font-medium">Completed</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Task context menu ────────────────────────────────────────────────────────

function TaskMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="material-symbols-outlined text-on-surface-variant md:opacity-0 md:group-hover:opacity-100 transition-opacity text-[18px] hover:text-primary"
      >
        more_horiz
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onPointerDown={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 w-32 bg-surface-container-lowest rounded-lg shadow-lg ring-1 ring-outline-variant/15 py-1 text-sm">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit?.() }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low text-on-surface transition-colors text-left"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Edit
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete?.() }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low text-error transition-colors text-left"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({ column, tasks, onAddTask, onEditTask, onDeleteTask, onViewTask }) {
  // Make the whole task-list area a drop target so cross-column drops work
  // even when dropping on empty space or between cards.
  const { setNodeRef: setDropRef } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col h-full" style={{ minWidth: 280, maxWidth: 340 }}>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-on-surface tracking-tight">{column.label}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${column.countStyle}`}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-[20px]"
        >
          add
        </button>
      </div>

      <div ref={setDropRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task)}
              onView={() => onViewTask(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-outline-variant/20 rounded-xl text-on-surface-variant/40 hover:border-primary/20 hover:text-primary/40 transition-colors cursor-pointer group"
            onClick={() => onAddTask(column.id)}
          >
            <span className="material-symbols-outlined text-2xl mb-1 group-hover:scale-110 transition-transform">add_circle</span>
            <span className="text-xs font-medium">Add task</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectTrackers() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject]           = useState(null)
  const [tasks, setTasks]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeDept, setActiveDept]     = useState('engineering')
  const [search, setSearch]             = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [showInvite, setShowInvite]     = useState(false)
  const [defaultModalStatus, setDefaultModalStatus] = useState('todo')
  const [editingTask, setEditingTask]   = useState(null)
  const [viewingTask, setViewingTask]   = useState(null)
  const [activeTask, setActiveTask]     = useState(null) // DnD overlay
  const [activeSprint, setActiveSprint] = useState(null)
  const [viewMode, setViewMode]         = useState('kanban') // 'kanban' | 'list'
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)

  // ── Drag-click guard ──────────────────────────────────────────────────────
  // dnd-kit resets `isDragging` before onClick fires, so we track drag state
  // via a ref and delay its reset so the click handler can inspect it.
  const dragOccurred = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => { fetchProject() }, [projectId])

  // Re-fetch whenever dept OR sprint changes
  useEffect(() => {
    fetchTasks()
  }, [projectId, activeDept, activeSprint])

  async function fetchProject() {
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).single()
    if (data) setProject(data)
    else navigate('/dashboard')
  }

  async function fetchTasks() {
    setLoading(true)
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('department', activeDept)
      .order('created_at', { ascending: true })

    // When a sprint is selected, show only its tasks
    if (activeSprint) {
      query = query.eq('sprint_id', activeSprint.id)
    }

    const { data } = await query
    setTasks(data || [])
    setLoading(false)
  }

  function getColumnTasks(status) {
    return tasks.filter((t) =>
      t.status === status &&
      (t.title.toLowerCase().includes(search.toLowerCase()) ||
       (t.description || '').toLowerCase().includes(search.toLowerCase()))
    )
  }

  function handleTaskCreated(task) {
    setTasks((prev) => [...prev, task])
  }

  function handleTaskUpdated(task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
    if (viewingTask?.id === task.id) setViewingTask(task)
  }

  async function handleTaskDelete(task) {
    if (!confirm(`Delete "${task.title}"?`)) return
    await supabase.from('tasks').delete().eq('id', task.id)
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    if (viewingTask?.id === task.id) setViewingTask(null)
  }

  async function handleStatusChange(task, newStatus) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))
    await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', task.id)
    if (viewingTask?.id === task.id) {
      setViewingTask((prev) => prev ? { ...prev, status: newStatus } : prev)
    }
  }

  function openNewTask(status) {
    setDefaultModalStatus(status)
    setShowModal(true)
  }

  // Safe view handler: only open drawer if we're not finishing a drag
  function handleViewTask(task) {
    if (dragOccurred.current) return
    setViewingTask(task)
  }

  // ─── DnD handlers ──────────────────────────────────────────────────────────

  function findColumn(taskId) {
    return tasks.find((t) => t.id === taskId)?.status
  }

  function handleDragStart({ active }) {
    dragOccurred.current = true
    setActiveTask(tasks.find((t) => t.id === active.id) || null)
  }

  async function handleDragEnd({ active, over }) {
    setActiveTask(null)

    // Reset drag guard after this event loop tick so any pending click handlers
    // (which fire synchronously after pointerup) see dragOccurred = true
    setTimeout(() => { dragOccurred.current = false }, 0)

    if (!over) return

    const activeId  = active.id
    const overId    = over.id
    const columnIds = COLUMNS.map((c) => c.id)
    const targetCol = columnIds.includes(overId) ? overId : findColumn(overId)
    const sourceCol = findColumn(activeId)

    if (!targetCol || !sourceCol) return

    if (sourceCol !== targetCol) {
      // Moving to a different column — optimistic update + persist
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: targetCol } : t))
      )
      await supabase
        .from('tasks')
        .update({ status: targetCol, updated_at: new Date().toISOString() })
        .eq('id', activeId)

      // If viewing this task, sync the drawer
      if (viewingTask?.id === activeId) {
        setViewingTask((prev) => prev ? { ...prev, status: targetCol } : prev)
      }
    } else {
      // Reorder within column
      const colTasks = tasks.filter((t) => t.status === sourceCol)
      const oldIndex = colTasks.findIndex((t) => t.id === activeId)
      const newIndex = colTasks.findIndex((t) => t.id === overId)
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(colTasks, oldIndex, newIndex)
        setTasks((prev) => [
          ...prev.filter((t) => t.status !== sourceCol),
          ...reordered,
        ])
      }
    }
  }

  const deptLabel = DEPT_LABELS[activeDept] || activeDept

  // Sprint progress stats
  const totalTasks     = tasks.length
  const doneTasks      = tasks.filter((t) => t.status === 'done').length
  const sprintProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ProjectSidebar
        project={project}
        activeDept={activeDept}
        onDeptChange={setActiveDept}
        activeSection="trackers"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:ml-64 flex-1 flex flex-col h-screen overflow-hidden">

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <header className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 z-40">
          <div className="flex justify-between items-center px-4 sm:px-6 h-16">
            <div className="flex items-center gap-2 min-w-0">
              {/* Hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              {/* Breadcrumb — collapsed on mobile */}
              <nav className="hidden sm:flex items-center gap-1.5 text-sm text-on-surface-variant">
                <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">
                  Dashboard
                </button>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <button
                  onClick={() => navigate(`/project/${projectId}`)}
                  className="hover:text-primary transition-colors font-medium"
                >
                  {project?.name || '…'}
                </button>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <span className="text-on-surface font-semibold">{deptLabel}</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <span className="text-primary font-semibold">Trackers</span>
              </nav>
              {/* Mobile title */}
              <span className="sm:hidden text-sm font-semibold text-on-surface truncate">{deptLabel} · Trackers</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Search — full input on sm+, icon toggle on mobile */}
              <div className="relative hidden sm:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-10 pr-4 py-2 bg-surface-container-lowest ring-1 ring-outline-variant/15 rounded-lg focus:ring-primary focus:ring-2 w-44 sm:w-52 transition-all text-sm outline-none placeholder:text-on-surface-variant/40"
                />
              </div>
              {/* Mobile search icon toggle */}
              <button
                onClick={() => setMobileSearch((o) => !o)}
                className={`sm:hidden p-2 rounded-lg transition-colors ${mobileSearch ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>

              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                title="Members"
              >
                <span className="material-symbols-outlined text-sm">group_add</span>
                <span className="hidden sm:inline">Members</span>
              </button>

              <button
                onClick={() => openNewTask('todo')}
                className="flex items-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 primary-gradient text-on-primary rounded-lg text-sm font-semibold shadow-sm shadow-primary/20 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span className="hidden sm:inline">New Task</span>
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {mobileSearch && (
            <div className="sm:hidden px-4 pb-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest ring-1 ring-outline-variant/15 rounded-lg focus:ring-primary focus:ring-2 text-sm outline-none placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>
          )}
        </header>

        {/* ── Sprint + page header ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-outline-variant/10">
          {/* Row 1: title + controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-on-surface">{deptLabel} Trackers</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {activeSprint
                  ? `${totalTasks} task${totalTasks !== 1 ? 's' : ''} in ${activeSprint.name}`
                  : `${totalTasks} task${totalTasks !== 1 ? 's' : ''} · all tasks`}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              {/* Sprint progress */}
              {activeSprint && totalTasks > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${sprintProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant tabular-nums">
                    {doneTasks}/{totalTasks}
                  </span>
                </div>
              )}

              {/* View mode toggle */}
              <div className="flex items-center bg-surface-container-high rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setViewMode('kanban')}
                  title="Board view"
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  <span className="hidden xs:inline sm:inline">Board</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="List view"
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'list'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">view_list</span>
                  <span className="hidden xs:inline sm:inline">List</span>
                </button>
              </div>

              {project && (
                <SprintControls
                  projectId={projectId}
                  department={activeDept}
                  activeSprint={activeSprint}
                  onSprintChange={setActiveSprint}
                />
              )}
            </div>
          </div>

          {/* Active sprint banner */}
          {activeSprint && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-primary">sprint</span>
              <span className="truncate">
                <span className={`font-semibold ${activeSprint.is_active ? 'text-primary' : 'text-on-surface'}`}>
                  {activeSprint.is_active ? 'Active Sprint' : 'Sprint'}:
                </span>{' '}
                {activeSprint.name}
                {activeSprint.start_date && activeSprint.end_date && (
                  <span className="ml-1.5 text-on-surface-variant/60 hidden sm:inline">
                    · {new Date(activeSprint.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' – '}
                    {new Date(activeSprint.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </span>
              {!activeSprint.is_active && (
                <span className="text-on-surface-variant/40 hidden sm:inline">(not active)</span>
              )}
            </div>
          )}
        </div>

        {/* ── Board / List ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex-1 px-6 pt-6 flex gap-6">
            {COLUMNS.map((c) => (
              <div key={c.id} className="flex flex-col gap-3" style={{ minWidth: 300 }}>
                <div className="h-6 w-24 bg-surface-container-high rounded animate-pulse" />
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-surface-container-lowest rounded-lg animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <TaskListView
            tasks={tasks}
            search={search}
            onViewTask={handleViewTask}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 pt-6">
              <div className="flex h-full gap-6 min-w-max">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    tasks={getColumnTasks(col.id)}
                    onAddTask={openNewTask}
                    onEditTask={setEditingTask}
                    onDeleteTask={handleTaskDelete}
                    onViewTask={handleViewTask}
                  />
                ))}

                <div
                  style={{ minWidth: 280, maxWidth: 300 }}
                  className="flex flex-col h-full border-2 border-dashed border-outline-variant/20 rounded-xl items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/2 transition-colors cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                    add_circle
                  </span>
                  <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">
                    Add Column
                  </span>
                </div>
              </div>
            </div>

            <DragOverlay>
              {activeTask && <TaskCard task={activeTask} overlay />}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <NewTaskModal
          projectId={projectId}
          department={activeDept}
          sprintId={activeSprint?.id ?? null}
          defaultStatus={defaultModalStatus}
          onClose={() => setShowModal(false)}
          onCreated={handleTaskCreated}
        />
      )}
      {editingTask && (
        <NewTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdated={handleTaskUpdated}
        />
      )}
      {showInvite && project && (
        <InviteMembersModal
          project={project}
          onClose={() => setShowInvite(false)}
        />
      )}

      {/* ── Task detail drawer ───────────────────────────────────────────────── */}
      {viewingTask && (
        <TaskDetailDrawer
          task={viewingTask}
          projectName={project?.name}
          sprintName={activeSprint?.name}
          onClose={() => setViewingTask(null)}
          onUpdated={handleTaskUpdated}
        />
      )}
    </div>
  )
}
