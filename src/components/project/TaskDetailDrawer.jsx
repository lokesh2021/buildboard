import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlock from '@tiptap/extension-code-block'
import { Heading } from '@tiptap/extension-heading'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// ─── helpers ──────────────────────────────────────────────────────────────────

function getTaskCode(task) {
  return `TASK-${task.id.slice(0, 6).toUpperCase()}`
}

function getInitials(name) {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

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

// ─── config ───────────────────────────────────────────────────────────────────

const STATUSES = [
  { value: 'todo',        label: 'To Do',       color: 'bg-surface-container-high text-on-surface-variant',  ring: 'ring-outline-variant/30' },
  { value: 'in_progress', label: 'In Progress',  color: 'bg-primary/10 text-primary',                        ring: 'ring-primary/30' },
  { value: 'done',        label: 'Done',         color: 'bg-green-50 text-green-700',                        ring: 'ring-green-200' },
]

const PRIORITIES = [
  { value: 'low',    label: 'Low',            icon: 'keyboard_double_arrow_down', color: 'text-on-surface-variant', bg: 'bg-surface-container-highest' },
  { value: 'medium', label: 'Medium',          icon: 'drag_handle',                color: 'text-tertiary',           bg: 'bg-tertiary-container/40' },
  { value: 'high',   label: 'Critical Impact', icon: 'keyboard_double_arrow_up',   color: 'text-error',              bg: 'bg-error/10' },
]

function statusCfg(val) { return STATUSES.find((s) => s.value === val) || STATUSES[0] }
function priorityCfg(val) { return PRIORITIES.find((p) => p.value === val) || PRIORITIES[0] }

// ─── Tiny inline-edit atoms ───────────────────────────────────────────────────

function InlineText({ value, placeholder, onSave, className = '', multiline = false }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  useEffect(() => { setDraft(value || '') }, [value])

  function commit() {
    if (draft.trim() !== (value || '').trim()) onSave(draft.trim())
    setEditing(false)
  }

  function handleKey(e) {
    if (e.key === 'Escape') { setDraft(value || ''); setEditing(false) }
    if (!multiline && e.key === 'Enter') { e.preventDefault(); commit() }
  }

  if (editing) {
    const shared = {
      ref: inputRef,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKey,
      className: `w-full bg-surface-container-low border border-primary/40 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed ${className}`,
    }
    return multiline
      ? <textarea {...shared} rows={6} />
      : <input type="text" {...shared} />
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`cursor-text hover:bg-surface-container-low rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors group ${className}`}
    >
      {value
        ? <span className="whitespace-pre-wrap">{value}</span>
        : <span className="text-on-surface-variant/40 italic">{placeholder}</span>}
    </div>
  )
}

function StatusPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const cfg = statusCfg(value)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${cfg.color} hover:opacity-80 transition-opacity cursor-pointer`}
      >
        {cfg.label}
        <span className="material-symbols-outlined text-[13px]">expand_more</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-surface-container-lowest rounded-xl shadow-lg ring-1 ring-outline-variant/10 py-1.5 min-w-[140px]">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => { onChange(s.value); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${
                  s.value === value ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                  s.value === 'done' ? 'bg-green-500' : s.value === 'in_progress' ? 'bg-primary' : 'bg-outline-variant'
                }`} />
                <span className={`font-semibold ${s.value === value ? 'text-primary' : 'text-on-surface'}`}>
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

function PriorityPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const cfg = priorityCfg(value)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-sm font-semibold ${cfg.color} hover:opacity-70 transition-opacity cursor-pointer`}
      >
        <span className="material-symbols-outlined text-base">{cfg.icon}</span>
        {cfg.label}
        <span className="material-symbols-outlined text-[13px]">expand_more</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-surface-container-lowest rounded-xl shadow-lg ring-1 ring-outline-variant/10 py-1.5 min-w-[170px]">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => { onChange(p.value); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                  p.value === value ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
                }`}
              >
                <span className={`material-symbols-outlined text-base ${p.color}`}>{p.icon}</span>
                <span className={`font-medium ${p.value === value ? 'text-primary' : 'text-on-surface'}`}>
                  {p.label}
                </span>
                {p.value === value && (
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

function AssigneeEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function commit() {
    if (draft.trim() !== (value || '').trim()) onSave(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(value || ''); setEditing(false) }
        }}
        placeholder="Assignee name"
        className="flex-1 min-w-0 bg-surface-container-low border border-primary/40 rounded-lg py-1 px-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none"
      />
    )
  }

  return (
    <div
      onClick={() => { setDraft(value || ''); setEditing(true) }}
      className="flex items-center gap-2 cursor-pointer group"
    >
      <div className="w-7 h-7 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">
        {getInitials(value)}
      </div>
      <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
        {value || <span className="text-on-surface-variant/40 italic font-normal">Unassigned</span>}
      </span>
      <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40 opacity-0 group-hover:opacity-100 transition-opacity">
        edit
      </span>
    </div>
  )
}

function DueDateEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.showPicker?.() }, [editing])

  const displayDate = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={value || ''}
        autoFocus
        onBlur={(e) => { onSave(e.target.value || null); setEditing(false) }}
        onChange={(e) => { onSave(e.target.value || null); setEditing(false) }}
        className="bg-surface-container-low border border-primary/40 rounded-lg py-1 px-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
      />
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 cursor-pointer group"
    >
      {displayDate ? (
        <>
          <span className="material-symbols-outlined text-base text-on-surface-variant">calendar_today</span>
          <span className="text-sm text-on-surface group-hover:text-primary transition-colors">{displayDate}</span>
        </>
      ) : (
        <span className="text-sm text-on-surface-variant/40 italic group-hover:text-primary transition-colors">
          Set due date...
        </span>
      )}
      <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
        edit
      </span>
    </div>
  )
}

function LabelsEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState((value || []).join(', '))
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function commit() {
    const labels = draft.split(',').map((l) => l.trim()).filter(Boolean)
    onSave(labels)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Frontend, WebGL"
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 min-w-0 bg-surface-container-low border border-primary/40 rounded-lg py-1 px-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
        />
        <button onClick={commit} className="text-primary text-xs font-semibold flex-shrink-0">Save</button>
      </div>
    )
  }

  return (
    <div
      onClick={() => { setDraft((value || []).join(', ')); setEditing(true) }}
      className="flex flex-wrap gap-1 cursor-pointer group min-h-[24px]"
    >
      {(value || []).length > 0
        ? (value || []).map((label) => (
            <span key={label} className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-xs rounded font-medium">
              {label}
            </span>
          ))
        : <span className="text-xs text-on-surface-variant/40 italic group-hover:text-primary transition-colors">Add labels...</span>
      }
    </div>
  )
}

// ─── Rich text description editor ────────────────────────────────────────────

function ToolbarBtn({ editor, action, isActive, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); action() }}
      className={`p-1.5 rounded text-[13px] font-bold transition-colors leading-none select-none ${
        isActive
          ? 'bg-primary/15 text-primary'
          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  )
}

function DescriptionEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const containerRef = useRef(null)

  // Normalise plain-text legacy content into a paragraph
  function toHtml(raw) {
    if (!raw) return ''
    if (raw.trimStart().startsWith('<')) return raw
    return raw.split('\n').map((l) => `<p>${l || '<br>'}</p>`).join('')
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: false }),
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      CodeBlock,
      Placeholder.configure({ placeholder: 'Add a description… Click to edit.' }),
    ],
    content: toHtml(value),
    editable: false,
  })

  // Sync content when task changes externally
  useEffect(() => {
    if (editor && !editing) {
      editor.commands.setContent(toHtml(value))
    }
  }, [value])

  // Toggle editable
  useEffect(() => {
    if (!editor) return
    editor.setEditable(editing)
    if (editing) setTimeout(() => editor.commands.focus('end'), 0)
  }, [editing, editor])

  function save() {
    if (!editor) return
    const html = editor.getHTML()
    const empty = html === '<p></p>' || html === ''
    onSave(empty ? '' : html)
    setEditing(false)
  }

  function handleOutsideClick(e) {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      save()
    }
  }

  useEffect(() => {
    if (editing) {
      document.addEventListener('mousedown', handleOutsideClick)
      return () => document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [editing, editor])

  if (!editor) return null

  return (
    <div ref={containerRef} className="relative">
      {/* Toolbar — only visible when editing */}
      {editing && (
        <div className="flex items-center flex-wrap gap-0.5 mb-2 px-1 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant/10">
          <ToolbarBtn
            title="Bold"
            action={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
          >
            <span className="material-symbols-outlined text-[15px]">format_bold</span>
          </ToolbarBtn>
          <ToolbarBtn
            title="Italic"
            action={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
          >
            <span className="material-symbols-outlined text-[15px]">format_italic</span>
          </ToolbarBtn>
          <ToolbarBtn
            title="Underline"
            action={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
          >
            <span className="material-symbols-outlined text-[15px]">format_underlined</span>
          </ToolbarBtn>
          <ToolbarBtn
            title="Strikethrough"
            action={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
          >
            <span className="material-symbols-outlined text-[15px]">strikethrough_s</span>
          </ToolbarBtn>

          <div className="w-px h-4 bg-outline-variant/20 mx-1" />

          <ToolbarBtn
            title="Heading 1"
            action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
          >
            H1
          </ToolbarBtn>
          <ToolbarBtn
            title="Heading 2"
            action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
          >
            H2
          </ToolbarBtn>
          <ToolbarBtn
            title="Heading 3"
            action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
          >
            H3
          </ToolbarBtn>

          <div className="w-px h-4 bg-outline-variant/20 mx-1" />

          <ToolbarBtn
            title="Bullet list"
            action={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
          >
            <span className="material-symbols-outlined text-[15px]">format_list_bulleted</span>
          </ToolbarBtn>
          <ToolbarBtn
            title="Ordered list"
            action={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
          >
            <span className="material-symbols-outlined text-[15px]">format_list_numbered</span>
          </ToolbarBtn>

          <div className="w-px h-4 bg-outline-variant/20 mx-1" />

          <ToolbarBtn
            title="Inline code"
            action={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
          >
            <span className="material-symbols-outlined text-[15px]">code</span>
          </ToolbarBtn>
          <ToolbarBtn
            title="Code block"
            action={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
          >
            <span className="material-symbols-outlined text-[15px]">integration_instructions</span>
          </ToolbarBtn>
          <ToolbarBtn
            title="Blockquote"
            action={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
          >
            <span className="material-symbols-outlined text-[15px]">format_quote</span>
          </ToolbarBtn>

          <div className="w-px h-4 bg-outline-variant/20 mx-1" />

          <ToolbarBtn
            title="Undo"
            action={() => editor.chain().focus().undo().run()}
            isActive={false}
          >
            <span className="material-symbols-outlined text-[15px]">undo</span>
          </ToolbarBtn>
          <ToolbarBtn
            title="Redo"
            action={() => editor.chain().focus().redo().run()}
            isActive={false}
          >
            <span className="material-symbols-outlined text-[15px]">redo</span>
          </ToolbarBtn>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); save() }}
            className="ml-auto px-3 py-1 bg-primary text-on-primary text-[11px] font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      )}

      {/* Editor surface */}
      <div
        onClick={() => !editing && setEditing(true)}
        className={`rounded-lg transition-colors ${
          editing
            ? 'bg-surface-container-low ring-1 ring-primary/40 px-3 py-2.5 min-h-[140px]'
            : 'hover:bg-surface-container-low cursor-text px-2 py-1.5 -mx-2 min-h-[32px]'
        }`}
      >
        <EditorContent editor={editor} className="prose-description" />
      </div>

      {!editing && !value && (
        <p
          onClick={() => setEditing(true)}
          className="text-sm text-on-surface-variant/40 italic cursor-text px-2"
        >
          Add a description… Click to edit.
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TaskDetailDrawer({ task: initialTask, projectName, sprintName, onClose, onUpdated }) {
  const { user } = useAuth()
  const [task, setTask] = useState(initialTask)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const authorName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'

  useEffect(() => {
    setTask(initialTask)
    fetchComments()
  }, [initialTask.id])

  async function fetchComments() {
    const { data } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', initialTask.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  // Generic single-field updater — used by every inline editor
  async function updateField(field, value) {
    const { data } = await supabase
      .from('tasks')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', task.id)
      .select()
      .single()
    if (data) {
      setTask(data)
      onUpdated?.(data)
    }
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    const { data } = await supabase
      .from('task_comments')
      .insert({
        task_id: task.id,
        author_id: user?.id,
        author_name: authorName,
        content: commentText.trim(),
      })
      .select()
      .single()
    setSubmitting(false)
    if (data) {
      setComments((prev) => [...prev, data])
      setCommentText('')
    }
  }

  const sCfg = statusCfg(task.status)
  const taskCode = getTaskCode(task)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-[100dvh] z-50 flex flex-col bg-surface-container-lowest w-full sm:w-auto"
        style={{ '--drawer-w': 'min(620px, 100vw)', width: 'var(--drawer-w)', boxShadow: '-8px 0 40px rgba(50,50,50,0.09)' }}
      >

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-1.5 text-sm text-on-surface-variant min-w-0">
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-container-low rounded-lg transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <span className="text-outline-variant/40 mx-0.5">·</span>
            {projectName && (
              <span className="truncate max-w-[100px]">{projectName}</span>
            )}
            {sprintName && (
              <>
                <span className="material-symbols-outlined text-sm flex-shrink-0">chevron_right</span>
                <span className="truncate max-w-[80px]">{sprintName}</span>
              </>
            )}
            <span className="material-symbols-outlined text-sm flex-shrink-0">chevron_right</span>
            <span className="text-on-surface font-bold flex-shrink-0">{taskCode}</span>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[18px]">share</span>
            </button>
            <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[18px]">star</span>
            </button>
            <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-8 py-5 sm:py-6">

            {/* Status badge (editable) + timestamp */}
            <div className="flex items-center gap-3 mb-4">
              <StatusPicker
                value={task.status}
                onChange={(val) => updateField('status', val)}
              />
              <span className="text-xs text-on-surface-variant">
                Updated {timeAgo(task.updated_at || task.created_at)}
              </span>
            </div>

            {/* Title (inline editable) */}
            <div className="mb-7">
              <InlineText
                value={task.title}
                placeholder="Task title..."
                onSave={(val) => val && updateField('title', val)}
                className="text-[22px] font-extrabold text-on-surface tracking-tight leading-snug"
              />
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-6 mb-6">

              <div>
                <div className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-2">
                  Assignee
                </div>
                <AssigneeEditor
                  value={task.assignee}
                  onSave={(val) => updateField('assignee', val)}
                />
              </div>

              <div>
                <div className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-2">
                  Priority
                </div>
                <PriorityPicker
                  value={task.priority}
                  onChange={(val) => updateField('priority', val)}
                />
              </div>

              <div>
                <div className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-2">
                  Due Date
                </div>
                <DueDateEditor
                  value={task.due_date ? task.due_date.split('T')[0] : null}
                  onSave={(val) => updateField('due_date', val)}
                />
              </div>

              <div>
                <div className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-2">
                  Labels
                </div>
                <LabelsEditor
                  value={task.labels}
                  onSave={(val) => updateField('labels', val)}
                />
              </div>

            </div>

            <div className="border-t border-outline-variant/10 mb-6" />

            {/* Description */}
            <div className="mb-6">
              <div className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-3">
                Description
              </div>
              <DescriptionEditor
                value={task.description}
                onSave={(val) => updateField('description', val)}
              />
            </div>

            {/* Activity log */}
            <div className="border-t border-outline-variant/10 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
                  Activity Log
                </span>
                {comments.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-full">
                    {comments.length}
                  </span>
                )}
              </div>

              {comments.length > 0 ? (
                <div className="space-y-5 mb-2">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {getInitials(c.author_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-on-surface">{c.author_name}</span>
                          <span className="text-xs text-on-surface-variant/50">{timeAgo(c.created_at)}</span>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant/40 italic mb-4">No activity yet.</p>
              )}
            </div>

            <div className="h-4" />
          </div>
        </div>

        {/* ── Comment input ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-outline-variant/10 px-4 sm:px-6 py-4 bg-surface-container-lowest">
          <form onSubmit={submitComment} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">
              {getInitials(authorName)}
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type a comment or / to command..."
                className="w-full bg-surface-container-low ring-1 ring-outline-variant/15 rounded-lg py-2.5 px-4 text-sm focus:ring-primary focus:ring-2 outline-none transition-all placeholder:text-on-surface-variant/40 pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {commentText ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="text-primary hover:opacity-80 transition-opacity disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                ) : (
                  <>
                    <span className="text-on-surface-variant/40 text-[11px] font-medium">@</span>
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-[16px]">
                      sentiment_satisfied
                    </span>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>

      </div>
    </>
  )
}
