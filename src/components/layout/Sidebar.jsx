import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({ projects = [], activeProjectId, onNewProject }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [expandedProject, setExpandedProject] = useState(activeProjectId)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col p-4 gap-2 z-50 bg-surface-container-low w-64 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 py-4 mb-2">
        <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center">
          <span
            className="material-symbols-outlined text-on-primary text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            grid_view
          </span>
        </div>
        <div>
          <h1 className="text-lg font-black text-primary tracking-tight">BuildBoard</h1>
          <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-bold leading-none">
            Project Workspace
          </p>
        </div>
      </div>

      {/* New Project Button */}
      <button
        onClick={onNewProject}
        className="mb-4 mx-1 py-2.5 px-4 primary-gradient text-on-primary rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-sm shadow-primary/20 text-sm"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        New Project
      </button>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        <div className="px-2 py-1 text-[0.65rem] font-bold text-on-surface-variant/60 uppercase tracking-widest">
          Projects
        </div>

        {projects.length === 0 ? (
          <p className="px-3 py-2 text-xs text-on-surface-variant/50 italic">No projects yet</p>
        ) : (
          projects.map((project) => {
            const isExpanded = expandedProject === project.id
            return (
              <div key={project.id} className="mb-1">
                <button
                  onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                    isExpanded
                      ? 'bg-surface-container-lowest text-primary border-l-4 border-primary pl-2'
                      : 'text-on-surface-variant hover:translate-x-0.5'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {isExpanded ? 'folder_open' : 'folder'}
                  </span>
                  <span className="truncate">{project.name}</span>
                </button>

                {isExpanded && (
                  <div className="ml-9 flex flex-col gap-0.5 border-l border-outline-variant/20 pl-4 py-1">
                    {[
                      ['description', 'README'],
                      ['analytics', 'Trackers'],
                      ['group', 'Members'],
                      ['settings', 'Settings'],
                    ].map(([icon, label]) => (
                      <a
                        key={label}
                        href="#"
                        className="flex items-center gap-2 text-xs py-1 text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">{icon}</span>
                        {label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-outline-variant/10 flex flex-col gap-1">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface-variant hover:translate-x-0.5 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          Support
        </a>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface-variant hover:text-error transition-colors text-left"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
