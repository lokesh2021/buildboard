import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const DEPARTMENTS = [
  { id: 'engineering', label: 'Engineering', icon: 'engineering' },
  { id: 'marketing', label: 'Marketing', icon: 'campaign' },
  { id: 'product', label: 'Product', icon: 'inventory_2' },
  { id: 'design', label: 'Design', icon: 'palette' },
]

// Pass project=null for the dashboard (home) context
export default function ProjectSidebar({ project = null, activeDept, onDeptChange, onNewProject }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [expandedDept, setExpandedDept] = useState(activeDept || null)
  const [projects, setProjects] = useState([])
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef(null)
  const isDashboard = !project

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name')
      .order('updated_at', { ascending: false })
      .then(({ data }) => setProjects(data || []))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function toggleDept(deptId) {
    setExpandedDept(expandedDept === deptId ? null : deptId)
    onDeptChange?.(deptId)
  }

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-50 bg-surface-container-low flex flex-col border-r border-outline-variant/10 text-sm font-medium tracking-tight overflow-y-auto">
      <div className="flex flex-col h-full py-6 px-3">

        {/* Brand / project header */}
        <div className="mb-6 px-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                grid_view
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-primary leading-tight">
                {isDashboard ? 'BuildBoard' : project.name}
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold leading-none mt-0.5">
                {isDashboard ? 'Project Workspace' : 'Active Project'}
              </p>
            </div>
          </div>

          {/* Project switcher */}
          <div className="relative" ref={switcherRef}>
            <button
              onClick={() => !isDashboard && setSwitcherOpen((o) => !o)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isDashboard
                  ? 'bg-surface-container-lowest border-primary/30 text-primary shadow-sm cursor-default'
                  : 'bg-surface-container-lowest border-outline-variant/15 shadow-sm text-on-surface hover:bg-surface-container-high cursor-pointer'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-sm flex-shrink-0">
                  {isDashboard ? 'layers' : 'folder_open'}
                </span>
                <span className="truncate">
                  {isDashboard ? 'All Projects' : project.name}
                </span>
              </span>
              {isDashboard ? (
                <span className="material-symbols-outlined text-sm">home</span>
              ) : (
                <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${switcherOpen ? 'rotate-180' : ''}`}>
                  unfold_more
                </span>
              )}
            </button>

            {/* Dropdown */}
            {switcherOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface-container-lowest rounded-lg shadow-lg ring-1 ring-outline-variant/15 py-1 overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  Switch Project
                </div>
                {projects.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-on-surface-variant/50 italic">No other projects</p>
                ) : (
                  projects.map((p) => {
                    const isCurrent = p.id === project?.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSwitcherOpen(false)
                          if (!isCurrent) navigate(`/project/${p.id}/documents`)
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors text-left ${
                          isCurrent
                            ? 'text-primary font-semibold bg-primary/5'
                            : 'text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-sm flex-shrink-0">
                            {isCurrent ? 'folder_open' : 'folder'}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </span>
                        {isCurrent && <span className="material-symbols-outlined text-sm flex-shrink-0">check</span>}
                      </button>
                    )
                  })
                )}
                <div className="border-t border-outline-variant/10 mt-1 pt-1">
                  <button
                    onClick={() => { setSwitcherOpen(false); navigate('/dashboard') }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">grid_view</span>
                    View all projects
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-5">

          {/* Departments — only shown when inside a project */}
          {!isDashboard && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-2">
                Departments
              </p>
              {DEPARTMENTS.map((dept) => {
                const isExpanded = expandedDept === dept.id
                return (
                  <div key={dept.id} className="space-y-0.5">
                    <button
                      onClick={() => toggleDept(dept.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-left ${
                        isExpanded
                          ? 'bg-surface-container-lowest text-primary border-l-4 border-primary pl-2 shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface-container/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{dept.icon}</span>
                      <span className={isExpanded ? 'font-semibold' : ''}>{dept.label}</span>
                    </button>
                    {isExpanded && (
                      <div className="ml-8 space-y-0.5 border-l border-outline-variant/20 pl-3 mt-1 pb-1">
                        <a href="#" className="flex items-center gap-2 px-3 py-1.5 text-primary bg-white/50 rounded-lg text-xs font-semibold">
                          <span className="material-symbols-outlined text-base">description</span>
                          Documents
                        </a>
                        <a href="#" className="flex items-center gap-2 px-3 py-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container/50 rounded-lg text-xs transition-colors">
                          <span className="material-symbols-outlined text-base">query_stats</span>
                          Trackers
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Organization */}
          <div className={`space-y-1 ${!isDashboard ? 'pt-3 border-t border-outline-variant/10' : ''}`}>
            <p className="px-3 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-2">
              Organization
            </p>
            {[
              ['group', 'Members'],
              ['settings', 'Settings'],
            ].map(([icon, label]) => (
              <a key={label} href="#" className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container/50 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-lg">{icon}</span>
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 space-y-3 border-t border-outline-variant/10">
          {isDashboard && (
            <button
              onClick={onNewProject || (() => navigate('/dashboard'))}
              className="w-full flex items-center gap-3 px-4 py-2.5 primary-gradient text-on-primary rounded-lg font-bold shadow-sm shadow-primary/20 hover:opacity-90 transition-all active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Project
            </button>
          )}

          <div className="flex items-center justify-between px-2">
            <UserChip />
            <button
              onClick={handleSignOut}
              className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-surface-container"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

function UserChip() {
  const { user } = useAuth()
  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'You'
  const avatar = user?.user_metadata?.avatar_url
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex items-center gap-2">
      {avatar ? (
        <img src={avatar} alt={name} className="w-7 h-7 rounded-full object-cover" />
      ) : (
        <div className="w-7 h-7 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold">
          {initials}
        </div>
      )}
      <span className="text-xs font-semibold text-on-surface truncate max-w-[100px]">{name}</span>
    </div>
  )
}
