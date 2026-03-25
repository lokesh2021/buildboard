import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { supabase } from '../lib/supabase'
import ProjectSidebar from '../components/project/ProjectSidebar'
import NewDocumentModal from '../components/project/NewDocumentModal'

// ─── helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return ''
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

const DEPT_LABELS = {
  engineering: 'Engineering',
  marketing: 'Marketing',
  product: 'Product',
  design: 'Design',
}

const STATUS_STYLES = {
  Critical: 'bg-primary/10 text-primary',
  Confidential: 'bg-error/10 text-error',
  Shared: 'bg-tertiary-container/50 text-tertiary',
  Draft: 'bg-surface-container-highest text-on-surface-variant',
}

// ─── main component ──────────────────────────────────────────────────────────

export default function DocumentView() {
  const { projectId, documentId } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showMetaModal, setShowMetaModal] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { languageClassPrefix: 'language-' },
      }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline cursor-pointer' } }),
      Placeholder.configure({ placeholder: 'Start writing your document… supports **bold**, _italic_, # headings, ```code blocks```, - lists, and more.' }),
    ],
    content: '',
    editorProps: {
      attributes: { class: 'outline-none min-h-[400px] prose prose-sm max-w-none' },
    },
  })

  useEffect(() => {
    fetchData()
  }, [projectId, documentId])

  async function fetchData() {
    setLoading(true)
    const [{ data: proj }, { data: doc }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('documents').select('*').eq('id', documentId).single(),
    ])
    if (!proj || !doc) { navigate(`/project/${projectId}/documents`); return }
    setProject(proj)
    setDocument(doc)
    setLoading(false)
    if (editor && doc.content) {
      editor.commands.setContent(doc.content)
    }
  }

  // set content once editor is ready
  useEffect(() => {
    if (editor && document?.content) {
      editor.commands.setContent(document.content)
    }
  }, [editor, document?.content])

  // toggle editable state on the editor
  useEffect(() => {
    if (!editor) return
    editor.setEditable(editing)
  }, [editor, editing])

  async function handleSave() {
    if (!editor) return
    setSaving(true)
    const content = editor.getHTML()
    const { data, error } = await supabase
      .from('documents')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setDocument(data)
      setEditing(false)
    }
  }

  function handleMetaUpdated(updated) {
    setDocument(updated)
    if (editor && updated.content) editor.commands.setContent(updated.content)
    setShowMetaModal(false)
  }

  if (loading || !editor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const deptLabel = DEPT_LABELS[document.department] || document.department
  const statusStyle = STATUS_STYLES[document.status] || STATUS_STYLES.Draft
  const authorInitials = (document.author || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex justify-between items-center w-full px-6 h-16 z-50">
        <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <button onClick={() => navigate(`/project/${projectId}/documents`)} className="hover:text-primary transition-colors font-medium">{project?.name}</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <button onClick={() => navigate(`/project/${projectId}/documents`)} className="hover:text-primary transition-colors">{deptLabel}</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface font-semibold truncate max-w-[200px]">{document.title}</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRightPanelOpen((o) => !o)}
            className={`p-2 rounded-lg transition-colors ${rightPanelOpen ? 'text-primary bg-primary/5' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            title="Toggle share panel"
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
          </button>

          {/* Edit / Save / Cancel */}
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); editor.commands.setContent(document.content || '') }}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 py-2 px-4 primary-gradient text-on-primary rounded-lg text-sm font-semibold shadow-sm shadow-primary/20 active:scale-95 transition-transform disabled:opacity-60"
              >
                {saving
                  ? <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-sm">save</span>}
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 py-2 px-4 primary-gradient text-on-primary rounded-lg text-sm font-semibold shadow-sm shadow-primary/20 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit
            </button>
          )}

          <button
            onClick={() => setShowMetaModal(true)}
            className="text-on-surface-variant hover:bg-surface-container-low transition-colors p-2 rounded-lg"
            title="Document settings"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>

          <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors p-2 rounded-lg flex items-center gap-1 text-sm">
            <span className="material-symbols-outlined text-[20px]">share</span>
            Share
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <ProjectSidebar
          project={project}
          activeDept={document.department}
          onDeptChange={() => navigate(`/project/${projectId}/documents`)}
        />

        {/* Center canvas */}
        <section className="flex-1 overflow-y-auto bg-background relative" style={{ marginLeft: '256px' }}>
          <div className="px-12 lg:px-20 py-12 max-w-3xl mx-auto space-y-8 pb-32">

            {/* Title & meta */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${statusStyle}`}>
                  {document.status}
                </span>
                <span className="text-xs text-on-surface-variant">
                  Last updated {timeAgo(document.updated_at || document.created_at)}
                </span>
                <span className="text-xs text-on-surface-variant/40">·</span>
                <span className="text-xs text-on-surface-variant/60 uppercase tracking-wider font-semibold">
                  {document.file_type?.toUpperCase()}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
                {document.title}
              </h1>
              {document.description && (
                <p className="text-base text-on-surface-variant leading-relaxed">{document.description}</p>
              )}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-7 h-7 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">
                  {authorInitials}
                </div>
                <span className="text-xs font-medium text-on-surface-variant">{document.author || 'Unknown'}</span>
                {editing && (
                  <span className="ml-auto text-xs text-primary font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Editing
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <hr className="border-outline-variant/15" />

            {/* TipTap editor */}
            <div
              className={`tiptap-wrap transition-all duration-200 ${
                editing
                  ? 'ring-2 ring-primary/20 rounded-xl p-6 bg-surface-container-lowest'
                  : 'p-2'
              }`}
            >
              <EditorContent editor={editor} />
              {!editing && !document.content && (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-outline-variant/20 rounded-xl hover:border-primary/20 transition-all cursor-pointer group"
                  onClick={() => setEditing(true)}
                >
                  <div className="w-12 h-12 rounded-full bg-primary-container/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary">edit_note</span>
                  </div>
                  <p className="text-sm font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                    Click to start writing
                  </p>
                  <p className="text-xs text-on-surface-variant/50 mt-1">
                    Supports rich text, headings, code blocks, lists, and more
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right sidebar */}
        {rightPanelOpen && (
          <aside className="w-80 flex-shrink-0 bg-surface-container-low border-l border-outline-variant/10 overflow-y-auto flex flex-col gap-8 p-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Share Document</h3>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Add email or group..."
                    className="w-full bg-surface-container-lowest border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary outline-none shadow-sm placeholder:text-on-surface-variant/40"
                  />
                  <button className="absolute right-2 top-1.5 bg-primary text-on-primary text-xs font-bold px-3 py-1.5 rounded">
                    Invite
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">
                    {authorInitials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">{document.author || 'Unknown'}</p>
                    <p className="text-[10px] text-on-surface-variant">Owner</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">General Access</h3>
              <div className="bg-surface-container-lowest rounded-lg p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-on-surface">Project members only</p>
                  <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                    Only project members can view this document.
                  </p>
                  <button className="mt-3 text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    Copy Link
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Assigned Roles</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs p-2 hover:bg-surface-container rounded transition-colors">
                  <span className="font-medium text-on-surface">{deptLabel} Dept.</span>
                  <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-[10px]">Editor</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 hover:bg-surface-container rounded transition-colors">
                  <span className="font-medium text-on-surface">All Members</span>
                  <span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded text-[10px]">Viewer</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Floating toolbar (only shown while editing) ──────────────────── */}
      {editing && (
        <FloatingToolbar editor={editor} rightPanelOpen={rightPanelOpen} />
      )}

      {/* Meta edit modal (title / description / type / status) */}
      {showMetaModal && (
        <NewDocumentModal
          document={document}
          onClose={() => setShowMetaModal(false)}
          onUpdated={handleMetaUpdated}
        />
      )}
    </div>
  )
}

// ─── Floating toolbar ─────────────────────────────────────────────────────────

function ToolbarBtn({ onClick, active, title, icon }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary'}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  )
}

function FloatingToolbar({ editor, rightPanelOpen }) {
  if (!editor) return null

  const setLink = useCallback(() => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('URL', prev || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkToUrl().unsetLink().run(); return }
    editor.chain().focus().extendMarkToUrl().setLink({ href: url }).run()
  }, [editor])

  return (
    <div
      className="fixed bottom-10 z-50 glass-panel shadow-2xl rounded-full px-4 py-2.5 flex items-center gap-1 border border-outline-variant/20"
      style={{ left: rightPanelOpen ? 'calc(50% + 80px)' : '50%', transform: 'translateX(-50%)' }}
    >
      {/* Headings */}
      <ToolbarBtn icon="title" title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
      <ToolbarBtn icon="format_h2" title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <div className="w-px h-5 bg-outline-variant/30 mx-1" />
      {/* Inline marks */}
      <ToolbarBtn icon="format_bold" title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarBtn icon="format_italic" title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarBtn icon="format_underlined" title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <ToolbarBtn icon="strikethrough_s" title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <div className="w-px h-5 bg-outline-variant/30 mx-1" />
      {/* Lists */}
      <ToolbarBtn icon="format_list_bulleted" title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarBtn icon="format_list_numbered" title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <div className="w-px h-5 bg-outline-variant/30 mx-1" />
      {/* Code */}
      <ToolbarBtn icon="code" title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} />
      <ToolbarBtn icon="data_object" title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
      <ToolbarBtn icon="format_quote" title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <div className="w-px h-5 bg-outline-variant/30 mx-1" />
      {/* Link */}
      <ToolbarBtn icon="link" title="Link" active={editor.isActive('link')} onClick={setLink} />
      {/* Undo / Redo */}
      <div className="w-px h-5 bg-outline-variant/30 mx-1" />
      <ToolbarBtn icon="undo" title="Undo" active={false} onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarBtn icon="redo" title="Redo" active={false} onClick={() => editor.chain().focus().redo().run()} />
    </div>
  )
}
