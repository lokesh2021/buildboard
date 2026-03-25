import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ProjectSidebar from '../components/project/ProjectSidebar'
import DocumentCard from '../components/project/DocumentCard'
import NewDocumentModal from '../components/project/NewDocumentModal'
import InviteMembersModal from '../components/project/InviteMembersModal'

const DEPT_LABELS = {
  engineering: { label: 'Engineering', icon: 'engineering', description: 'Technical specifications, API references, and infrastructure protocols.' },
  marketing: { label: 'Marketing', icon: 'campaign', description: 'Brand guidelines, campaign briefs, and go-to-market strategies.' },
  product: { label: 'Product', icon: 'inventory_2', description: 'Product specs, roadmaps, and feature documentation.' },
  design: { label: 'Design', icon: 'palette', description: 'Design systems, component libraries, and UX research.' },
}

export default function ProjectDocuments() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDept, setActiveDept] = useState('engineering')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [showModal, setShowModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [search, setSearch] = useState('')

  const dept = DEPT_LABELS[activeDept] || DEPT_LABELS.engineering

  useEffect(() => {
    fetchProject()
  }, [projectId])

  useEffect(() => {
    fetchDocuments()
  }, [projectId, activeDept])

  async function fetchProject() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    if (data) setProject(data)
    else navigate('/dashboard')
  }

  async function fetchDocuments() {
    setLoading(true)
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('department', activeDept)
      .order('updated_at', { ascending: false })
    setDocuments(data || [])
    setLoading(false)
  }

  function handleDocCreated(doc) {
    setDocuments((prev) => [doc, ...prev])
  }

  function handleDocUpdated(doc) {
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? doc : d)))
  }

  async function handleDocDelete(doc) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return
    await supabase.from('documents').delete().eq('id', doc.id)
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
  }

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 6)

  return (
    <div className="flex min-h-screen bg-background">
      <ProjectSidebar
        project={project}
        activeDept={activeDept}
        onDeptChange={setActiveDept}
      />

      <main className="ml-64 flex-1 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center w-full px-8 py-4 border-b border-outline-variant/10 h-16">
          <div className="flex items-center gap-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">
                Dashboard
              </button>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-on-surface font-semibold">{project?.name || '…'}</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-primary font-semibold">{dept.label}</span>
            </nav>

            {/* Tab nav */}
            <nav className="hidden md:flex items-center gap-5 text-sm">
              <a href="#" className="text-primary font-semibold border-b-2 border-primary pb-0.5">Documents</a>
              <a href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Shared</a>
              <a href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Archive</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="pl-10 pr-4 py-2 bg-surface-container-lowest ring-1 ring-outline-variant/15 rounded-lg focus:ring-primary focus:ring-2 w-56 transition-all text-sm outline-none placeholder:text-on-surface-variant/40"
              />
            </div>

            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">group_add</span>
              Members
            </button>
            <UserAvatar />
          </div>
        </header>

        {/* Page content */}
        <div className="px-8 py-8 max-w-7xl mx-auto">

          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
                {dept.label} Documents
              </h2>
              <p className="text-on-surface-variant mt-2 max-w-xl">{dept.description}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* View toggle */}
              <div className="bg-surface-container-low rounded-lg p-1 flex items-center">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">grid_view</span>
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">list</span>
                  List
                </button>
              </div>

              <button className="flex items-center gap-2 py-2 px-4 bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded-lg text-sm font-semibold text-on-surface">
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Filters
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 py-2 px-4 primary-gradient text-on-primary rounded-lg text-sm font-semibold shadow-sm shadow-primary/20 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Document
              </button>
            </div>
          </div>

          {/* Document grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`bg-surface-container-lowest rounded-lg h-52 animate-pulse ${i === 1 ? 'lg:col-span-2' : ''}`} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyDocs onNew={() => setShowModal(true)} deptLabel={dept.label} hasSearch={!!search} />
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-3'}>
              {filtered.map((doc, i) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  featured={i === 0 && viewMode === 'grid' && !search}
                  onEdit={() => setEditingDoc(doc)}
                  onDelete={() => handleDocDelete(doc)}
                />
              ))}

              {/* Ghost add card */}
              <button
                onClick={() => setShowModal(true)}
                className="rounded-lg border-2 border-dashed border-outline-variant/30 hover:border-primary/30 hover:bg-primary/3 transition-all duration-200 flex flex-col items-center justify-center gap-2 p-6 text-on-surface-variant hover:text-primary min-h-[160px] group"
              >
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <span className="text-xs font-semibold">New Document</span>
              </button>
            </div>
          )}

          {/* Recently Accessed */}
          {recentDocs.length > 0 && (
            <div className="mt-16">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant/70 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">history</span>
                Recently Accessed
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
                {recentDocs.map((doc) => (
                  <RecentDocChip key={doc.id} document={doc} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FAB (mobile) */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 primary-gradient text-on-primary rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform md:hidden z-40"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {showModal && (
        <NewDocumentModal
          projectId={projectId}
          department={activeDept}
          onClose={() => setShowModal(false)}
          onCreated={handleDocCreated}
        />
      )}

      {editingDoc && (
        <NewDocumentModal
          document={editingDoc}
          onClose={() => setEditingDoc(null)}
          onUpdated={handleDocUpdated}
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

function RecentDocChip({ document }) {
  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'just now'
  }

  return (
    <div className="flex-shrink-0 w-48 bg-surface-container-low p-4 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer">
      <span className="material-symbols-outlined text-primary mb-3 block">description</span>
      <div className="font-semibold text-sm truncate text-on-surface">{document.title}</div>
      <div className="text-[10px] text-on-surface-variant mt-1">
        {timeAgo(document.updated_at || document.created_at)}
      </div>
    </div>
  )
}

function UserAvatar() {
  const { user } = useAuth()
  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'U'
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return avatar ? (
    <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/20" />
  ) : (
    <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-on-primary text-xs font-bold">
      {initials}
    </div>
  )
}

function EmptyDocs({ onNew, deptLabel, hasSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-container/40 flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-primary text-3xl">description</span>
      </div>
      <h4 className="text-lg font-bold text-on-surface mb-2">
        {hasSearch ? 'No documents match your search' : `No ${deptLabel} documents yet`}
      </h4>
      <p className="text-on-surface-variant text-sm max-w-sm mb-8">
        {hasSearch
          ? 'Try a different keyword or clear the search.'
          : 'Create your first document to start building your knowledge base.'}
      </p>
      {!hasSearch && (
        <button
          onClick={onNew}
          className="primary-gradient text-on-primary px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New Document
        </button>
      )}
    </div>
  )
}
