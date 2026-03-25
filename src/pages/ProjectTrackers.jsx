import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
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

// ─── constants ───────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'todo', label: 'To Do', countStyle: 'bg-surface-container-high text-on-surface-variant' },
  { id: 'in_progress', label: 'In Progress', countStyle: 'bg-primary-container text-primary' },
  { id: 'done', label: 'Done', countStyle: 'bg-surface-container-high text-on-surface-variant' },
]

const PRIORITY_STYLES = {
  high: 'bg-error/10 text-error',
  medium: 'bg-tertiary-container/40 text-tertiary',
  low: 'bg-surface-container-highest text-on-surface-variant',
}

const DEPT_LABELS = {
  engineering: 'Engineering',
  marketing: 'Marketing',
  product: 'Product',
  design: 'Design',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name) {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── TaskCard (draggable) ─────────────────────────────────────────────────────

function TaskCard({ task, onEdit, onDelete, overlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const isDone = task.status === 'done'
  const isInProgress = task.status === 'in_progress'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
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

      {/* Description */}
      {task.description && (
        <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${isDone ? 'text-on-surface-variant/60' : 'text-on-surface-variant'}`}>
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <div className="w-7 h-7 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">
          {getInitials(task.assignee)}
        </div>

        <div className="flex items-center gap-3">
          {isInProgress && (
            <div className="flex items-center gap-2">
              <div className="w-14 h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-primary rounded-full" />
              </div>
            </div>
          )}
          {task.due_date && !isDone && (
            <div className="flex items-center text-on-surface-variant text-[10px] gap-1">
              <span className="material-symbols-outlined text-[13px]">calendar_today</span>
              {formatDate(task.due_date)}
            </div>
          )}
          {isDone && (
            <span className="text-[10px] text-on-surface-variant/60 font-medium">
              Completed
            </span>
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
        className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity text-[18px] hover:text-primary"
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

function KanbanColumn({ column, tasks, onAddTask, onEditTask, onDeleteTask }) {
  return (
    <div className="flex flex-col h-full" style={{ minWidth: 300, maxWidth: 360 }}>
      {/* Header */}
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

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task)}
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

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDept, setActiveDept] = useState('engineering')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [defaultModalStatus, setDefaultModalStatus] = useState('todo')
  const [editingTask, setEditingTask] = useState(null)
  const [activeTask, setActiveTask] = useState(null) // for DnD overlay

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => { fetchProject() }, [projectId])
  useEffect(() => { fetchTasks() }, [projectId, activeDept])

  async function fetchProject() {
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).single()
    if (data) setProject(data)
    else navigate('/dashboard')
  }

  async function fetchTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('department', activeDept)
      .order('created_at', { ascending: true })
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
  }

  async function handleTaskDelete(task) {
    if (!confirm(`Delete "${task.title}"?`)) return
    await supabase.from('tasks').delete().eq('id', task.id)
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
  }

  function openNewTask(status) {
    setDefaultModalStatus(status)
    setShowModal(true)
  }

  // ─── DnD handlers ──────────────────────────────────────────────────────────

  function findColumn(taskId) {
    const task = tasks.find((t) => t.id === taskId)
    return task?.status
  }

  function handleDragStart({ active }) {
    setActiveTask(tasks.find((t) => t.id === active.id) || null)
  }

  async function handleDragEnd({ active, over }) {
    setActiveTask(null)
    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Determine target column — over could be a column id or a task id
    const columnIds = COLUMNS.map((c) => c.id)
    const targetCol = columnIds.includes(overId) ? overId : findColumn(overId)
    const sourceCol = findColumn(activeId)

    if (!targetCol) return

    if (sourceCol !== targetCol) {
      // Move to a different column
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: targetCol } : t))
      )
      await supabase
        .from('tasks')
        .update({ status: targetCol, updated_at: new Date().toISOString() })
        .eq('id', activeId)
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ProjectSidebar
        project={project}
        activeDept={activeDept}
        onDeptChange={setActiveDept}
        activeSection="trackers"
      />

      <div className="ml-64 flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex justify-between items-center px-6 h-16 z-40">
          <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant">
            <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <button onClick={() => navigate(`/project/${projectId}/documents`)} className="hover:text-primary transition-colors font-medium">
              {project?.name || '…'}
            </button>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-on-surface font-semibold">{deptLabel}</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary font-semibold">Trackers</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="pl-10 pr-4 py-2 bg-surface-container-lowest ring-1 ring-outline-variant/15 rounded-lg focus:ring-primary focus:ring-2 w-52 transition-all text-sm outline-none placeholder:text-on-surface-variant/40"
              />
            </div>

            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-sm">group_add</span>
              Members
            </button>
            <button
              onClick={() => openNewTask('todo')}
              className="flex items-center gap-2 py-2 px-4 primary-gradient text-on-primary rounded-lg text-sm font-semibold shadow-sm shadow-primary/20 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Task
            </button>
          </div>
        </header>

        {/* Page header row */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">{deptLabel} Trackers</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} · Kanban board
            </p>
          </div>
        </div>

        {/* Kanban board */}
        {loading ? (
          <div className="flex-1 px-6 flex gap-6">
            {COLUMNS.map((c) => (
              <div key={c.id} className="flex flex-col gap-3" style={{ minWidth: 300 }}>
                <div className="h-6 w-24 bg-surface-container-high rounded animate-pulse" />
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-surface-container-lowest rounded-lg animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
              <div className="flex h-full gap-6 min-w-max">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    tasks={getColumnTasks(col.id)}
                    onAddTask={openNewTask}
                    onEditTask={setEditingTask}
                    onDeleteTask={handleTaskDelete}
                  />
                ))}

                {/* Add column placeholder */}
                <div
                  style={{ minWidth: 280, maxWidth: 300 }}
                  className="flex flex-col h-full border-2 border-dashed border-outline-variant/20 rounded-xl items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/2 transition-colors cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">add_circle</span>
                  <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">Add Column</span>
                </div>
              </div>
            </div>

            <DragOverlay>
              {activeTask && (
                <TaskCard task={activeTask} overlay />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <NewTaskModal
          projectId={projectId}
          department={activeDept}
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
    </div>
  )
}
