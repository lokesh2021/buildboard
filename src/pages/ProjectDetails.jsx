import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ProjectSidebar from '../components/project/ProjectSidebar'
import InviteMembersModal from '../components/project/InviteMembersModal'

// ─── constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  {
    id: 'engineering',
    label: 'Engineering',
    icon: 'engineering',
    description: 'Technical specifications, API references, and infrastructure protocols.',
    color: 'bg-primary/8 text-primary border-primary/15',
    iconBg: 'bg-primary/10 text-primary',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: 'campaign',
    description: 'Brand guidelines, campaign briefs, and go-to-market strategies.',
    color: 'bg-tertiary/8 text-tertiary border-tertiary/15',
    iconBg: 'bg-tertiary/10 text-tertiary',
  },
  {
    id: 'product',
    label: 'Product',
    icon: 'inventory_2',
    description: 'Product specs, roadmaps, and feature documentation.',
    color: 'bg-secondary/8 text-secondary border-secondary/15',
    iconBg: 'bg-secondary/10 text-secondary',
  },
  {
    id: 'design',
    label: 'Design',
    icon: 'palette',
    description: 'Design systems, component libraries, and UX research.',
    color: 'bg-error/8 text-error border-error/15',
    iconBg: 'bg-error/10 text-error',
  },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function getInitials(name) {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectDetails() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject]             = useState(null)
  const [deptStats, setDeptStats]         = useState({})
  const [recentDocs, setRecentDocs]       = useState([])
  const [recentTasks, setRecentTasks]     = useState([])
  const [members, setMembers]             = useState([])
  const [activeSprints, setActiveSprints] = useState([])
  const [loading, setLoading]             = useState(true)
  const [showInvite, setShowInvite]       = useState(false)
  const [editingDesc, setEditingDesc]     = useState(false)
  const [descDraft, setDescDraft]         = useState('')
  const [sidebarOpen, setSidebarOpen]     = useState(false)

  useEffect(() => {
    if (projectId) loadAll()
  }, [projectId])

  async function loadAll() {
    setLoading(true)
    await Promise.all([
      fetchProject(),
      fetchDeptStats(),
      fetchRecentDocs(),
      fetchRecentTasks(),
      fetchMembers(),
      fetchActiveSprints(),
    ])
    setLoading(false)
  }

  async function fetchProject() {
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).single()
    if (data) { setProject(data); setDescDraft(data.description || '') }
    else navigate('/dashboard')
  }

  async function fetchDeptStats() {
    const [docsRes, tasksRes] = await Promise.all([
      supabase.from('documents').select('department').eq('project_id', projectId),
      supabase.from('tasks').select('department, status').eq('project_id', projectId),
    ])
    const docs  = docsRes.data  || []
    const tasks = tasksRes.data || []
    const stats = {}
    DEPARTMENTS.forEach((d) => {
      stats[d.id] = {
        docs:       docs.filter((doc) => doc.department === d.id).length,
        tasks:      tasks.filter((t) => t.department === d.id).length,
        inProgress: tasks.filter((t) => t.department === d.id && t.status === 'in_progress').length,
        done:       tasks.filter((t) => t.department === d.id && t.status === 'done').length,
      }
    })
    setDeptStats(stats)
  }

  async function fetchRecentDocs() {
    const { data } = await supabase
      .from('documents')
      .select('id, title, department, updated_at, status')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(5)
    setRecentDocs(data || [])
  }

  async function fetchRecentTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('id, title, department, status, priority, assignee, updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(6)
    setRecentTasks(data || [])
  }

  async function fetchMembers() {
    const { data } = await supabase
      .from('project_members')
      .select('id, role, user_id, invited_email')
      .eq('project_id', projectId)
    setMembers(data || [])
  }

  async function fetchActiveSprints() {
    const { data } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
    setActiveSprints(data || [])
  }

  async function saveDescription() {
    const { data } = await supabase
      .from('projects')
      .update({ description: descDraft.trim(), updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select()
      .single()
    if (data) { setProject(data); setEditingDesc(false) }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <ProjectSidebar
          project={null}
          activeSection="overview"
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="md:ml-64 flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const totalTasks = Object.values(deptStats).reduce((s, d) => s + d.tasks, 0)
  const totalDone  = Object.values(deptStats).reduce((s, d) => s + d.done, 0)
  const totalDocs  = Object.values(deptStats).reduce((s, d) => s + d.docs, 0)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ProjectSidebar
        project={project}
        activeSection="overview"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:ml-64 flex-1 flex flex-col h-screen overflow-hidden">

        {/* ── Top bar ────────────────────────────────────────────────────────── */}
        <header className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex justify-between items-center px-4 sm:px-6 h-16 z-40">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant min-w-0">
              <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors hidden sm:block">
                Dashboard
              </button>
              <span className="material-symbols-outlined text-sm hidden sm:block">chevron_right</span>
              <span className="text-on-surface font-semibold truncate">{project?.name}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-sm">group_add</span>
              <span className="hidden sm:inline">Invite</span>
            </button>
          </div>
        </header>

        {/* ── Body (scrollable) ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row h-full">

            {/* ── Main content ─────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-8 space-y-8">

              {/* Project header */}
              <section>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center text-on-primary font-bold text-lg flex-shrink-0">
                      {getInitials(project?.name)}
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface leading-tight">
                        {project?.name}
                      </h1>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Updated {timeAgo(project?.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {editingDesc ? (
                  <div className="space-y-2 mt-3">
                    <textarea
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      autoFocus
                      rows={3}
                      placeholder="Add a project description..."
                      className="w-full bg-surface-container-low border border-outline-variant/15 rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary outline-none resize-none leading-relaxed"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveDescription}
                        className="primary-gradient text-on-primary px-4 py-1.5 rounded-lg font-bold text-sm shadow-sm shadow-primary/20"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setDescDraft(project?.description || ''); setEditingDesc(false) }}
                        className="px-4 py-1.5 text-on-surface-variant font-semibold text-sm hover:text-on-surface transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-sm text-on-surface-variant leading-relaxed mt-2 cursor-pointer hover:text-on-surface transition-colors group"
                    onClick={() => setEditingDesc(true)}
                  >
                    {project?.description || (
                      <span className="italic text-on-surface-variant/40 group-hover:text-primary transition-colors">
                        Add a project description...
                      </span>
                    )}
                  </p>
                )}

                {/* Quick stats */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4">
                  <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-base text-primary">description</span>
                    <span className="font-semibold text-on-surface">{totalDocs}</span> docs
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-base text-primary">task_alt</span>
                    <span className="font-semibold text-on-surface">{totalTasks}</span> tasks
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-base text-primary">group</span>
                    <span className="font-semibold text-on-surface">{members.length}</span> members
                  </div>
                  {totalTasks > 0 && (
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <div className="w-20 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.round((totalDone / totalTasks) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-on-surface-variant/60">
                        {Math.round((totalDone / totalTasks) * 100)}% complete
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Departments */}
              <section>
                <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                  Departments
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DEPARTMENTS.map((dept) => {
                    const stats = deptStats[dept.id] || { docs: 0, tasks: 0, inProgress: 0, done: 0 }
                    const progress = stats.tasks > 0
                      ? Math.round((stats.done / stats.tasks) * 100)
                      : 0

                    return (
                      <div
                        key={dept.id}
                        className="bg-surface-container-lowest rounded-xl p-5 ring-1 ring-outline-variant/10 hover:ring-primary/20 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => navigate(`/project/${projectId}/documents`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dept.iconBg}`}>
                            <span className="material-symbols-outlined text-lg">{dept.icon}</span>
                          </div>
                          {stats.inProgress > 0 && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                              {stats.inProgress} active
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-on-surface text-base mb-1 group-hover:text-primary transition-colors">
                          {dept.label}
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed mb-3 line-clamp-2">
                          {dept.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-on-surface-variant">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">description</span>
                              {stats.docs}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">task_alt</span>
                              {stats.tasks}
                            </span>
                          </div>
                          {stats.tasks > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1 bg-surface-container-high rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-on-surface-variant/60">{progress}%</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t border-outline-variant/10">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/project/${projectId}/documents`) }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">description</span>
                            Docs
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/project/${projectId}/trackers`) }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">query_stats</span>
                            Trackers
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Recent tasks */}
              {recentTasks.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                      Recent Tasks
                    </h2>
                    <button
                      onClick={() => navigate(`/project/${projectId}/trackers`)}
                      className="text-xs font-semibold text-primary hover:opacity-70 transition-opacity"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-surface-container-lowest rounded-lg ring-1 ring-outline-variant/10 hover:ring-primary/20 transition-all cursor-pointer group"
                        onClick={() => navigate(`/project/${projectId}/trackers`)}
                      >
                        <StatusDot status={task.status} />
                        <span className="flex-1 min-w-0 text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant flex-shrink-0 hidden sm:inline">
                          {DEPARTMENTS.find((d) => d.id === task.department)?.label || task.department}
                        </span>
                        <PriorityChip priority={task.priority} />
                        <span className="text-xs text-on-surface-variant/50 flex-shrink-0 text-right hidden sm:block w-14">
                          {timeAgo(task.updated_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── Right panel ──────────────────────────────────────────────────
                On mobile: appears below as a stacked section
                On lg+: fixed right sidebar with border-left
            ────────────────────────────────────────────────────────────────── */}
            <aside className="lg:w-72 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-outline-variant/10 flex flex-col lg:overflow-y-auto">

              {/* Active Sprints */}
              <div className="p-4 sm:p-5 border-b border-outline-variant/10">
                <h3 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-3">
                  Active Sprints
                </h3>
                {activeSprints.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                    {activeSprints.map((sprint) => {
                      const dept = DEPARTMENTS.find((d) => d.id === sprint.department)
                      return (
                        <div
                          key={sprint.id}
                          className="p-3 bg-surface-container-lowest rounded-lg ring-1 ring-outline-variant/10 cursor-pointer hover:ring-primary/20 transition-all"
                          onClick={() => navigate(`/project/${projectId}/trackers`)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            <span className="text-sm font-semibold text-on-surface">{sprint.name}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant pl-3.5">
                            {dept?.label} dept
                          </p>
                          {sprint.end_date && (
                            <p className="text-[10px] text-on-surface-variant/50 pl-3.5 mt-0.5">
                              Ends {new Date(sprint.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-surface-container-lowest rounded-lg ring-1 ring-outline-variant/10 text-center">
                    <p className="text-xs text-on-surface-variant/50 italic mb-2">No active sprints</p>
                    <button
                      onClick={() => navigate(`/project/${projectId}/trackers`)}
                      className="text-xs text-primary font-semibold hover:opacity-70 transition-opacity"
                    >
                      Start a sprint →
                    </button>
                  </div>
                )}
              </div>

              {/* Recent documents */}
              {recentDocs.length > 0 && (
                <div className="p-4 sm:p-5 border-b border-outline-variant/10">
                  <h3 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-3">
                    Recent Documents
                  </h3>
                  <div className="space-y-1">
                    {recentDocs.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => navigate(`/project/${projectId}/documents/${doc.id}`)}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-container-low transition-colors text-left group"
                      >
                        <span className="material-symbols-outlined text-base text-on-surface-variant flex-shrink-0">
                          description
                        </span>
                        <span className="flex-1 min-w-0 text-xs font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                          {doc.title}
                        </span>
                        {doc.status && (
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                            doc.status === 'active' ? 'bg-green-50 text-green-600' :
                            doc.status === 'in_review' ? 'bg-amber-50 text-amber-600' :
                            'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            {doc.status.replace('_', ' ')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(`/project/${projectId}/documents`)}
                    className="mt-2 text-xs font-semibold text-primary hover:opacity-70 transition-opacity"
                  >
                    View all documents →
                  </button>
                </div>
              )}

              {/* Members */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
                    Members
                  </h3>
                  <button
                    onClick={() => setShowInvite(true)}
                    className="text-[10px] font-semibold text-primary hover:opacity-70 transition-opacity"
                  >
                    + Invite
                  </button>
                </div>

                {members.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-on-surface-variant/50 italic mb-2">No members yet</p>
                    <button
                      onClick={() => setShowInvite(true)}
                      className="text-xs text-primary font-semibold hover:opacity-70 transition-opacity"
                    >
                      Invite team members →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                    {members.slice(0, 6).map((m) => (
                      <div key={m.id} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">
                          {getInitials(m.invited_email || 'M')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-on-surface truncate">
                            {m.invited_email || 'Member'}
                          </p>
                          <p className="text-[10px] text-on-surface-variant capitalize">{m.role}</p>
                        </div>
                      </div>
                    ))}
                    {members.length > 6 && (
                      <p className="text-xs text-on-surface-variant/50 pl-9">+{members.length - 6} more</p>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {showInvite && project && (
        <InviteMembersModal project={project} onClose={() => setShowInvite(false)} />
      )}
    </div>
  )
}

// ─── small atoms ─────────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const colors = {
    todo:        'bg-outline-variant',
    in_progress: 'bg-primary',
    done:        'bg-green-500',
  }
  return (
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] || colors.todo}`} />
  )
}

function PriorityChip({ priority }) {
  const config = {
    high:   { label: 'High',   cls: 'bg-error/10 text-error' },
    medium: { label: 'Med',    cls: 'bg-tertiary/10 text-tertiary' },
    low:    { label: 'Low',    cls: 'bg-surface-container-high text-on-surface-variant' },
  }
  const { label, cls } = config[priority] || config.low
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${cls}`}>
      {label}
    </span>
  )
}
