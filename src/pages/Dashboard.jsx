import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ProjectSidebar from '../components/project/ProjectSidebar'
import TopBar from '../components/layout/TopBar'
import ProjectCard from '../components/dashboard/ProjectCard'
import CreateProjectModal from '../components/dashboard/CreateProjectModal'

export default function Dashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'there'

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!error) setProjects(data || [])
    setLoading(false)
  }

  function handleProjectCreated(project) {
    setProjects((prev) => [project, ...prev])
  }

  return (
    <div className="flex min-h-screen bg-background">
      <ProjectSidebar onNewProject={() => setShowModal(true)} />

      <div className="ml-64 flex-1 flex flex-col">
        <TopBar onNewProject={() => setShowModal(true)} />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Welcome */}
          <section>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
              {greeting}, {displayName}.
            </h2>
            <p className="text-on-surface-variant mt-1">
              {projects.length === 0
                ? 'Create your first project to get started.'
                : `You have ${projects.length} active project${projects.length !== 1 ? 's' : ''}.`}
            </p>
          </section>

          {/* Stats row */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard
              label="Total Projects"
              value={projects.length}
              icon="folder_open"
              iconBg="bg-primary-container"
              iconColor="text-primary"
            />
            <StatCard
              label="Active Tasks"
              value="—"
              icon="task_alt"
              iconBg="bg-tertiary-container"
              iconColor="text-tertiary"
            />
            <StatCard
              label="Team Members"
              value="—"
              icon="group"
              iconBg="bg-secondary-container"
              iconColor="text-secondary"
            />
          </section>

          {/* Projects grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight text-on-surface">All Projects</h3>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline underline-offset-4 transition-colors"
              >
                <span className="material-symbols-outlined text-base">add</span>
                New Project
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 h-52 animate-pulse"
                  />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <EmptyState onNewProject={() => setShowModal(true)} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                {/* Ghost "add" card */}
                <button
                  onClick={() => setShowModal(true)}
                  className="rounded-xl border-2 border-dashed border-outline-variant/30 hover:border-primary/30 hover:bg-primary/3 transition-all duration-200 flex flex-col items-center justify-center gap-3 p-8 text-on-surface-variant hover:text-primary min-h-[200px] group"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <span className="text-sm font-semibold">New Project</span>
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 primary-gradient text-on-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 z-40"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'wght' 600" }}
        >
          add
        </span>
      </button>

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-4xl font-black text-on-surface">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
  )
}

function EmptyState({ onNewProject }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary-container/40 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-primary text-4xl">rocket_launch</span>
      </div>
      <h4 className="text-xl font-bold text-on-surface mb-2">No projects yet</h4>
      <p className="text-on-surface-variant max-w-sm mb-8">
        Create your first project to start organizing tasks, writing docs, and collaborating with
        your team.
      </p>
      <button
        onClick={onNewProject}
        className="primary-gradient text-on-primary px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        Create Your First Project
      </button>
    </div>
  )
}
