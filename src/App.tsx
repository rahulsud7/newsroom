import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Search, FileText, ScrollText, Network, Clock, Bookmark, X, ExternalLink,
  Copy, AlertTriangle, Users, Building2, MapPin, Wifi, WifiOff, Loader,
  Send, Filter, CheckCircle, Plus, FolderPlus, PanelRightClose, PanelRightOpen,
  Bot, Upload, ChevronRight, FolderClosed, GripVertical, FileUp,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: '#F8F7F2', panel: '#FFFFFF', ink: '#1C1B19', inkSoft: '#4A4843',
  teal900: '#003D42', teal800: '#004B50', teal700: '#0E5C5F', teal100: '#E2EBEA',
  tan: '#B19470', tanDeep: '#95764F', tanPale: '#EFE6D8',
  line: '#DEDACE', lineStrong: '#C9C3B2',
  red: '#9A4B3C', cream: '#F8F7F2', creamDeep: '#F1EFE6',
}
const serif = { fontFamily: "'Source Serif 4', Georgia, serif" }
const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" }
const sans = { fontFamily: "'Inter', -apple-system, sans-serif" }

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
// Tracks the currently-connected backend base URL so chunkToArticle (a plain
// function, outside React state) can build a fallback PDF link even if the
// backend hasn't started sending pdf_url yet.
let CURRENT_API_BASE = ''

function makeApi(base) {
  const url = p => base.replace(/\/$/, '') + p
  const j = r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }
  return {
    health: () => fetch(url('/health'), { headers: { "ngrok-skip-browser-warning": "true" } }).then(j),
    search: (q, k, ids) => fetch(url('/search'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ query: q, k: k || 10, doc_ids: ids || [] }) }).then(j),
    chat: (msg, sid) => fetch(url('/chat'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ message: msg, session_id: sid }) }).then(j),
    listDocuments: () => fetch(url('/documents'), { headers: { "ngrok-skip-browser-warning": "true" } }).then(j),
    workspace: (ids) => fetch(url('/workspace'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ doc_ids: ids }) }).then(j),
    ingest: (file, meta) => {
      const fd = new FormData(); fd.append('file', file)
      if (meta?.title) fd.append('title', meta.title)
      if (meta?.pub_date) fd.append('pub_date', meta.pub_date)
      return fetch(url('/ingest'), { method: 'POST', headers: { "ngrok-skip-browser-warning": "true" }, body: fd }).then(j)
    },
  }
}

function chunkToArticle(chunk) {
  const dm = chunk.doc_meta || {}
  const score = Math.round((chunk.score || 0) * 100)
  // Build a real ISO date if pub_date looks like a year or partial
  let rawDate = dm.pub_date || ''
  let isoDate = ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    isoDate = rawDate
  } else if (/^\d{4}$/.test(rawDate)) {
    isoDate = `${rawDate}-01-01`
  } else if (rawDate) {
    const d = new Date(rawDate)
    isoDate = isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
  }
  // Prefer an explicit pdf_url from the backend; otherwise fall back to the
  // deterministic file route (only valid for PDF-sourced documents).
  const isPdfSource = (dm.source_type || '').toUpperCase() === 'PDF'
  const pdfUrl = chunk.pdf_url || dm.pdf_url || (isPdfSource && chunk.doc_id ? `${CURRENT_API_BASE}/documents/${chunk.doc_id}/pdf` : '')
  return {
    id: String(chunk.chunk_id ?? chunk.doc_id ?? Math.random()),
    doc_id: chunk.doc_id || '',
    chunk_id: chunk.chunk_id,
    title: dm.title || chunk.filename || 'Untitled',
    source: chunk.filename || dm.title || '—',
    byline: dm.author || '—',
    date: isoDate,
    displayDate: isoDate
      ? new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : (rawDate || '—'),
    section: dm.section || 'Archive',
    page: chunk.page_number ? `p.${chunk.page_number}` : '—',
    excerpt: (chunk.text || '').slice(0, 260) + (chunk.text?.length > 260 ? '…' : ''),
    fullText: chunk.text || '',
    entities: [],
    score,
    pdfUrl,
    url: pdfUrl || '#',
    source_type: dm.source_type || 'Article',
  }
}

function timelineEventToArticle(ev, i) {
  let isoDate = ''
  const raw = ev.date || ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) isoDate = raw
  else if (/^\d{4}$/.test(raw)) isoDate = `${raw}-01-01`
  else { const d = new Date(raw); isoDate = isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10) }
  return {
    id: `tl-${i}`,
    doc_id: ev.doc_ref || '',
    title: ev.incident || 'Event',
    date: isoDate,
    displayDate: isoDate
      ? new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : raw,
    section: 'Timeline',
    page: ev.page ? `p.${ev.page}` : '—',
    source: ev.doc_ref || '—',
    byline: '—',
    excerpt: ev.excerpt || '',
    fullText: ev.excerpt || '',
    entities: [],
    url: '#',
    // Best-effort: timeline events don't carry source_type, so this may
    // 404 for URL-sourced docs. openPdf() ignores '#'; the backend 404s
    // cleanly for anything else, so this never breaks the UI either way.
    pdfUrl: ev.doc_ref ? `${CURRENT_API_BASE}/documents/${ev.doc_ref}/pdf` : '',
  }
}

function buildEntityGraph(nodes) {
  if (!nodes?.length) return { nodes: [], edges: [] }
  const gNodes = nodes.map(n => ({
    id: n.entity,
    type: n.type === 'person' ? 'person' : n.type === 'location' ? 'place' : 'organization',
    weight: (n.connections?.length ?? 1) + 1,
  }))
  const seen = new Set()
  const edges = []
  nodes.forEach(n => {
    ; (n.connections || []).forEach(c => {
      const key = [n.entity, c.entity].sort().join('|||')
      if (!seen.has(key)) { seen.add(key); edges.push([n.entity, c.entity]) }
    })
  })
  return { nodes: gNodes, edges }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) }

function openPdf(url) {
  if (!url || url === '#') return
  // Backend paths like "/documents/{doc_id}/pdf" are relative — resolving
  // them against the frontend's own origin (not the ngrok backend) is why
  // every "open PDF" action was silently failing.
  const full = /^https?:\/\//i.test(url)
    ? url
    : `${CURRENT_API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
  window.open(full, '_blank', 'noopener,noreferrer')
}

const WS_COLORS = ['#004B50', '#B19470', '#5C7C7A', '#9A4B3C', '#2E7D32', '#7B5EA7']
const SEED_WORKSPACES = [
  { id: 'ws-1', name: 'Election Coverage', desk: 'political', color: WS_COLORS[0], articleIds: [] },
  { id: 'ws-2', name: 'Riverbend Probe', desk: 'investigative', color: WS_COLORS[1], articleIds: [] },
  { id: 'ws-3', name: 'Budget 2025', desk: 'financial', color: WS_COLORS[2], articleIds: [] },
]

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE STYLES (shared building blocks)
// ─────────────────────────────────────────────────────────────────────────────
const s = {
  eyebrow: { ...mono, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkSoft },
  pill: (bg, fg, border) => ({
    ...mono, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em',
    background: bg, color: fg, border: `1px solid ${border}`, padding: '2px 7px', borderRadius: 4
  }),
}

// ─────────────────────────────────────────────────────────────────────────────
// NGROK BAR  — pinned above app-shell, never inside the grid
// ─────────────────────────────────────────────────────────────────────────────
function NgrokBar({ apiUrl, setApiUrl, connected, checking, onCheck }) {
  const [draft, setDraft] = useState(apiUrl)
  function commit() { const c = draft.trim().replace(/\/$/, ''); setApiUrl(c); onCheck(c) }

  const borderColor = connected === true ? '#2E7D32' : connected === false ? C.red : C.lineStrong
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '5px 16px',
      background: C.creamDeep, borderBottom: `1px solid ${C.line}`, flexShrink: 0, minHeight: 38
    }}>
      <span style={s.eyebrow}>Backend</span>
      <div style={{
        display: 'flex', alignItems: 'stretch', border: `1px solid ${borderColor}`,
        borderRadius: 6, overflow: 'hidden', background: '#fff', flex: 1, maxWidth: 520, transition: 'border-color .2s'
      }}>
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && commit()}
          placeholder="https://xxxx-xx-xx.ngrok-free.app"
          style={{
            ...mono, flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 11.5, color: C.ink, padding: '5px 10px'
          }} />
        <button onClick={commit} disabled={checking}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', border: 'none',
            fontSize: 11, fontWeight: 600, color: '#fff', cursor: 'pointer',
            background: connected === true ? '#2E7D32' : checking ? C.inkSoft : C.teal900,
            opacity: checking ? .7 : 1, flexShrink: 0
          }}>
          {checking ? <><Loader size={12} className="spin" /> Checking…</>
            : connected === true ? <><CheckCircle size={12} /> Connected</>
              : <><Wifi size={12} /> Connect</>}
        </button>
      </div>
      {connected === false && !checking &&
        <span style={{ ...mono, fontSize: 10.5, color: C.red, display: 'flex', alignItems: 'center', gap: 4 }}>
          <WifiOff size={11} /> Unreachable
        </span>}
      {connected === true && !checking &&
        <span style={{ ...mono, fontSize: 10.5, color: '#2E7D32' }}>Archive live</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LEFT PANEL — split into two independently scrolling sections
// ─────────────────────────────────────────────────────────────────────────────
function LeftPanel({
  workspaces, activeWsId, onSelectWs, onCreateWs,
  onOpenFileManager, backendDocs, api, onIngestDone,
  // drag-drop into workspace
  onDropArticleToWs,
}) {
  const [creating, setCreating] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [ingesting, setIngesting] = useState(false)
  const [ingestErr, setIngestErr] = useState('')
  const [dragOverWs, setDragOverWs] = useState(null)
  const fileRef = useRef()

  function submitDraft() {
    const name = draftName.trim()
    if (name) onCreateWs(name)
    setDraftName(''); setCreating(false)
  }

  async function handleIngest(e) {
    const files = Array.from(e.target.files || []) as File[]
    if (!files.length || !api) return
    setIngesting(true); setIngestErr('')
    try {
      for (const f of files) {
        const res = await api.ingest(f, { title: f.name.replace(/\.pdf$/i, '') })
        onIngestDone?.(res)
      }
    } catch (err) { setIngestErr(err.message) }
    finally { setIngesting(false); e.target.value = '' }
  }

  // Drag-drop handlers on workspace items
  function handleWsDragOver(e, wsId) { e.preventDefault(); setDragOverWs(wsId) }
  function handleWsDrop(e, wsId) {
    e.preventDefault(); setDragOverWs(null)
    const data = e.dataTransfer.getData('application/article')
    if (data) { try { onDropArticleToWs(wsId, JSON.parse(data)) } catch { } }
  }

  return (
    <aside style={{
      borderRight: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column',
      background: C.creamDeep, overflow: 'hidden'
    }}>

      {/* ── Logo / brand ── */}
      <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: C.teal900, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, ...serif }}>N</span>
          </div>
          <div>
            <div style={{ ...serif, fontSize: 13, fontWeight: 700, color: C.teal900, lineHeight: 1.1 }}>
              Newsroom
            </div>
            <div style={{
              ...mono, fontSize: 9, color: C.inkSoft, letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>Intelligence</div>
          </div>
        </div>
      </div>

      {/* ── WORKSPACES section — independently scrollable ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        borderBottom: `1px solid ${C.line}`, maxHeight: '45%', minHeight: 120, overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px 8px', flexShrink: 0
        }}>
          <span style={s.eyebrow}>Workspaces</span>
          <button onClick={() => setCreating(true)} title="New workspace"
            style={{
              width: 22, height: 22, borderRadius: 5, border: `1px solid ${C.lineStrong}`,
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.teal800, cursor: 'pointer'
            }}>
            <Plus size={13} strokeWidth={2.25} />
          </button>
        </div>
        <div className="scroll-thin" style={{ overflowY: 'auto', flex: 1, padding: '0 8px 10px' }}>
          {workspaces.map(ws => {
            const active = ws.id === activeWsId
            const dragOver = dragOverWs === ws.id
            return (
              <button key={ws.id} onClick={() => onSelectWs(ws.id)}
                onDragOver={e => handleWsDragOver(e, ws.id)}
                onDragLeave={() => setDragOverWs(null)}
                onDrop={e => handleWsDrop(e, ws.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left',
                  background: dragOver ? C.tanPale : active ? '#fff' : 'transparent',
                  border: `1px solid ${dragOver ? C.tan : active ? C.line : 'transparent'}`,
                  borderRadius: 9, padding: '8px 9px', cursor: 'pointer', transition: 'all .15s',
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,.06)' : 'none'
                }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ws.color, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12.5, fontWeight: 600, color: C.ink,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>{ws.name}</div>
                  <div style={{ fontSize: 11, color: C.inkSoft, textTransform: 'capitalize' }}>
                    {ws.desk} · {ws.articleIds.length} saved
                  </div>
                </span>
                <ChevronRight size={13} style={{ color: active ? C.tan : C.lineStrong, flexShrink: 0 }} />
              </button>
            )
          })}
          {creating && (
            <form onSubmit={e => { e.preventDefault(); submitDraft() }} style={{ padding: '4px 2px' }}>
              <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)}
                onBlur={submitDraft} placeholder="Workspace name…"
                style={{
                  width: '100%', fontSize: 13, border: `1px solid ${C.tan}`,
                  borderRadius: 9, padding: '8px 10px', background: '#fff', outline: 'none'
                }} />
            </form>
          )}
        </div>
      </div>

      {/* ── ARCHIVE section — independently scrollable ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px 8px', flexShrink: 0
        }}>
          <span style={s.eyebrow}>Archive ({backendDocs.length})</span>
        </div>
        <div className="scroll-thin" style={{ overflowY: 'auto', flex: 1, padding: '0 8px 8px' }}>
          {backendDocs.length === 0 && (
            <p style={{ fontSize: 11.5, color: C.inkSoft, padding: '4px 6px', lineHeight: 1.5 }}>
              No documents ingested yet. Use "Ingest PDF" below.
            </p>
          )}
          {backendDocs.map(doc => (
            <div key={doc.doc_id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 7, padding: '7px 6px',
                borderRadius: 7, cursor: 'pointer', transition: 'background .12s'
              }}
              className="archive-doc-row">
              <FileText size={13} style={{ color: C.tanDeep, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: C.ink,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}
                  title={doc.title || doc.filename}>{doc.title || doc.filename}</div>
                <div style={{ fontSize: 10.5, color: C.inkSoft, ...mono }}>
                  {doc.pub_date || '—'} · {doc.total_pages || '?'}pp
                </div>
              </div>
              {doc.pdf_url && (
                <button onClick={() => openPdf(doc.pdf_url)} title="Open PDF"
                  style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: C.teal700, padding: 2, flexShrink: 0
                  }}>
                  <ExternalLink size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer: ingest + file manager */}
        <div style={{ borderTop: `1px solid ${C.line}`, padding: '10px 10px 14px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {api && (
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderRadius: 9, border: `1px solid ${C.lineStrong}`, background: '#fff',
              fontSize: 12.5, fontWeight: 500, color: C.teal800, cursor: 'pointer',
              opacity: ingesting ? .6 : 1, transition: 'background .15s'
            }}
              title="Upload one or more PDFs to the archive">
              {ingesting
                ? <><Loader size={14} className="spin" /><span>Ingesting…</span></>
                : <><Upload size={14} strokeWidth={2} /><span>Ingest PDF</span></>}
              <input type="file" accept=".pdf" multiple hidden onChange={handleIngest} disabled={ingesting} />
            </label>
          )}
          {ingestErr && <p style={{ fontSize: 11, color: C.red, margin: '2px 4px 0' }}>{ingestErr}</p>}
          <button onClick={onOpenFileManager}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderRadius: 9, border: '1px solid transparent', background: 'transparent',
              fontSize: 12.5, fontWeight: 500, color: C.inkSoft, cursor: 'pointer', width: '100%',
              textAlign: 'left', transition: 'background .15s'
            }}
            className="archive-file-btn">
            <FolderClosed size={14} strokeWidth={2} />
            <span>Archive files</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT CARD — draggable, with correct add-to-workspace popup
// ─────────────────────────────────────────────────────────────────────────────
function ResultCard({ article, onOpen, inWorkspace, onAddToWorkspace, workspaces, onCreateAndAdd, index }: any) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [newWsMode, setNewWsMode] = useState(false)
  const [newWsName, setNewWsName] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [popoverCoords, setPopoverCoords] = useState({ top: 0 as number | 'auto', bottom: 0 as number | 'auto', right: 0 as number | 'auto' })

  // Close on outside click
  useEffect(() => {
    if (!pickerOpen) return
    function handle(e: MouseEvent) {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false)
        setNewWsMode(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [pickerOpen])

  function handleDragStart(e) {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/article', JSON.stringify(article))
  }

  function submitNewWs() {
    const name = newWsName.trim()
    if (name) { onCreateAndAdd(name, article.id); setPickerOpen(false); setNewWsMode(false); setNewWsName('') }
  }

  return (
    <div draggable onDragStart={handleDragStart}
      style={{
        position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 10,
        background: '#fff', border: `1px solid ${C.line}`, borderRadius: 10,
        boxShadow: '0 1px 2px rgba(28,27,25,.04)', transition: 'border-color .15s, box-shadow .15s',
        cursor: 'grab'
      }}
      className="result-card">

      {/* Drag handle */}
      <div style={{ padding: '18px 0 0 10px', color: C.lineStrong, flexShrink: 0, cursor: 'grab' }}>
        <GripVertical size={14} />
      </div>

      <button onClick={() => onOpen(article)}
        style={{
          flex: 1, textAlign: 'left', background: 'transparent', border: 'none',
          padding: '14px 8px 14px 4px', minWidth: 0, cursor: 'pointer'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={s.pill(C.teal100, C.teal700, 'transparent')}>{article.section}</span>
          <span style={{ ...mono, fontSize: 11.5, color: C.inkSoft }}>{article.displayDate || formatDate(article.date)}</span>
        </div>
        <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: C.ink, margin: '0 0 5px', lineHeight: 1.3 }}>
          {article.title}
        </h3>
        <p style={{
          fontSize: 13, color: C.inkSoft, lineHeight: 1.5, margin: '0 0 10px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {article.excerpt}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: C.lineStrong }}>
          <FileText size={12} strokeWidth={2} />
          <span style={{ color: C.inkSoft }}>{article.source}</span>
          <span style={{ marginLeft: 'auto', ...mono }}>{article.page}</span>
          {article.score > 0 && (
            <span style={{ ...mono, fontSize: 10.5, color: C.inkSoft }}>{article.score}% match</span>
          )}
        </div>
      </button>

      {/* Action buttons column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 12px 0 0', alignItems: 'center' }}>
        {/* Open source / PDF */}
        <button onClick={() => article.pdfUrl ? openPdf(article.pdfUrl) : onOpen(article)}
          title={article.pdfUrl ? 'Open PDF' : 'View source'}
          style={{
            width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.lineStrong}`,
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.inkSoft, cursor: 'pointer', transition: 'all .15s'
          }}
          className="icon-btn">
          <ExternalLink size={13} />
        </button>

        {/* Add to workspace */}
        <div>
          <button ref={buttonRef} onClick={() => {
            if (!pickerOpen && buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect()
              const spaceBelow = window.innerHeight - rect.bottom
              const spaceAbove = rect.top
              const popoverHeight = 250

              let top: number | 'auto' = rect.bottom + 6
              let bottom: number | 'auto' = 'auto'

              if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
                top = 'auto'
                bottom = window.innerHeight - rect.top + 6
              }
              setPopoverCoords({ top, bottom, right: window.innerWidth - rect.right })
            }
            setPickerOpen(!pickerOpen)
            setNewWsMode(false)
          }}
            title={inWorkspace ? 'Saved to workspace' : 'Add to workspace'}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: `1.5px solid ${inWorkspace ? C.teal800 : C.lineStrong}`,
              background: inWorkspace ? C.teal800 : '#fff',
              color: inWorkspace ? '#fff' : C.inkSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all .15s'
            }}>
            {inWorkspace ? <CheckCircle size={13} /> : <Plus size={13} strokeWidth={2.25} />}
          </button>

          {pickerOpen && createPortal(
            <div ref={pickerRef} style={{
              position: 'fixed',
              top: popoverCoords.top,
              bottom: popoverCoords.bottom,
              right: popoverCoords.right,
              zIndex: 9999, background: '#fff', border: `1px solid ${C.line}`,
              borderRadius: 10, boxShadow: '0 8px 24px rgba(0,61,66,.16)', padding: 8,
              width: 210, display: 'flex', flexDirection: 'column', gap: 2
            }}>
              <span style={{
                ...mono, fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: C.inkSoft, padding: '2px 8px 6px'
              }}>Add to workspace</span>
              {workspaces.map(ws => (
                <button key={ws.id} onClick={() => { onAddToWorkspace(ws.id, article.id); setPickerOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                    padding: '7px 8px', borderRadius: 6, background: 'transparent', border: 'none',
                    fontSize: 12.5, color: C.ink, cursor: 'pointer', width: '100%'
                  }}
                  className="picker-item">
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: ws.color, flexShrink: 0 }} />
                  {ws.name}
                </button>
              ))}
              <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 4, paddingTop: 4 }}>
                {newWsMode ? (
                  <form onSubmit={e => { e.preventDefault(); submitNewWs() }} style={{ padding: '4px 6px' }}>
                    <input autoFocus value={newWsName} onChange={e => setNewWsName(e.target.value)}
                      onBlur={submitNewWs} placeholder="Workspace name…"
                      style={{
                        width: '100%', fontSize: 12.5, border: `1px solid ${C.tan}`,
                        borderRadius: 6, padding: '6px 8px', outline: 'none'
                      }} />
                  </form>
                ) : (
                  <button onClick={() => setNewWsMode(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                      padding: '7px 8px', borderRadius: 6, background: 'transparent', border: 'none',
                      fontSize: 12.5, color: C.teal800, fontWeight: 600, cursor: 'pointer', width: '100%'
                    }}
                    className="picker-item">
                    <Plus size={13} /> New workspace
                  </button>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function SourceDrawer({ article, onClose }) {
  if (!article) return null
  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(28,27,25,.32)', zIndex: 100,
        display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn .15s ease-out'
      }}>
      <aside onClick={e => e.stopPropagation()}
        style={{
          width: 'min(560px, 92vw)', height: '100%', background: '#fff',
          display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(28,27,25,.1)'
        }}
        role="dialog" aria-label={article.title}>

        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${C.line}`, flexShrink: 0
        }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5,
            color: C.inkSoft, ...mono
          }}>
            <FileText size={13} /> {article.source}
          </span>
          <button onClick={onClose} style={{
            border: 'none', background: 'transparent',
            cursor: 'pointer', color: C.inkSoft, display: 'flex'
          }}>
            <X size={18} />
          </button>
        </header>

        <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 32px' }}>
          <h2 style={{ ...serif, fontSize: 22, fontWeight: 600, color: C.teal900, margin: '0 0 12px', lineHeight: 1.25 }}>
            {article.title}
          </h2>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginBottom: 20,
            fontSize: 12.5, color: C.inkSoft
          }}>
            {[article.section, article.displayDate || formatDate(article.date),
            article.page !== '—' ? `Page ${article.page.replace('p.', '')}` : null, article.byline]
              .filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
          </div>

          {/* Highlighted excerpt */}
          <div style={{
            background: C.creamDeep, borderLeft: `3px solid ${C.tan}`,
            padding: '14px 16px', marginBottom: 20, borderRadius: '0 6px 6px 0'
          }}>
            <p style={{
              ...serif, fontSize: 14, lineHeight: 1.75, margin: 0,
              color: C.ink, fontStyle: 'italic'
            }}>{article.excerpt}</p>
          </div>

          {article.fullText && article.fullText !== article.excerpt && (
            <div style={{ ...serif, fontSize: 13.5, lineHeight: 1.8, color: C.ink }}>
              {article.fullText}
            </div>
          )}

          {article.entities?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ ...s.eyebrow, marginBottom: 10 }}>Entities in this document</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {article.entities.map(e => (
                  <span key={e} style={{
                    fontSize: 12, background: C.teal100, color: C.teal800,
                    padding: '3px 9px', borderRadius: 20
                  }}>{e}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          borderTop: `1px solid ${C.line}`, padding: '12px 20px',
          display: 'flex', gap: 10, flexShrink: 0
        }}>
          {article.pdfUrl ? (
            <button onClick={() => openPdf(article.pdfUrl)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 7, padding: '10px 0', background: C.teal900, color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>
              <ExternalLink size={14} /> Open PDF
            </button>
          ) : (
            <button disabled style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 7, padding: '10px 0',
              background: C.lineStrong, color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 13, cursor: 'not-allowed', opacity: .6
            }}>
              <FileText size={14} /> No PDF available
            </button>
          )}
          <button onClick={() => {
            const cite = `${article.title}. ${article.source}, ${article.displayDate || formatDate(article.date)}. ${article.page}.`
            navigator.clipboard?.writeText(cite)
          }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
              background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 8,
              fontSize: 13, color: C.inkSoft, cursor: 'pointer'
            }}>
            <Copy size={14} /> Copy citation
          </button>
        </div>
      </aside>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE (inline - uses articles directly)
// ─────────────────────────────────────────────────────────────────────────────
function Timeline({ articles, onOpen, onGenerate, generating, canGenerate, genErr }) {
  const [hoveredId, setHoveredId] = useState(null)
  const sorted = [...articles]
    .filter(a => a.date && a.date !== '1970-01-01')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (sorted.length === 0) return (
    <div style={{ maxWidth: 420, padding: '60px 32px', textAlign: 'center', margin: '0 auto' }}>
      <p style={{ ...serif, fontSize: 17, color: C.teal900, marginBottom: 8 }}>No timeline yet</p>
      <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 18 }}>
        {canGenerate
          ? 'Generate a chronology from the documents saved in this workspace.'
          : 'Add articles to this workspace first, then generate a chronology from them.'}
      </p>
      {onGenerate && (
        <button onClick={onGenerate} disabled={generating || !canGenerate}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px',
            background: canGenerate ? C.teal900 : C.lineStrong, color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: generating || !canGenerate ? 'not-allowed' : 'pointer', opacity: generating ? .7 : 1
          }}>
          {generating ? <Loader size={14} className="spin" /> : <Clock size={14} />}
          {generating ? 'Generating…' : 'Generate timeline'}
        </button>
      )}
      {genErr && <p style={{ fontSize: 12, color: C.red, marginTop: 10 }}>{genErr}</p>}
    </div>
  )

  const first = new Date(sorted[0].date).getTime()
  const last = new Date(sorted[sorted.length - 1].date).getTime()
  const span = Math.max(last - first, 1)

  return (
    <div className="scroll-thin" style={{ overflowX: 'auto', padding: '32px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 12,
        fontSize: 11.5, color: C.inkSoft, ...mono
      }}>
        <span>{formatDate(sorted[0].date)}</span>
        <span>{sorted.length} entries · chronological</span>
        <span>{formatDate(sorted[sorted.length - 1].date)}</span>
      </div>
      <div style={{ position: 'relative', minWidth: 600, height: 260 }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%', height: 2,
          background: C.line, transform: 'translateY(-50%)'
        }} />
        {sorted.map((a, i) => {
          const pct = ((new Date(a.date).getTime() - first) / span) * 100
          const up = i % 2 === 0
          const active = hoveredId === a.id
          return (
            <div key={a.id} style={{
              position: 'absolute', left: `${pct}%`, top: '50%',
              transform: 'translateX(-50%)'
            }}
              onMouseEnter={() => setHoveredId(a.id)} onMouseLeave={() => setHoveredId(null)}>
              <div style={{
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                width: 1, background: active ? C.tan : C.lineStrong,
                height: 50, ...(up ? { bottom: 8 } : { top: 8 })
              }} />
              <div style={{
                width: 10, height: 10, borderRadius: '50%', border: `2px solid ${active ? C.tan : C.lineStrong}`,
                background: active ? C.tan : '#fff', position: 'relative', zIndex: 2,
                transform: 'translateY(-50%)', transition: 'all .15s'
              }} />
              <button onClick={() => { if (a.pdfUrl) openPdf(a.pdfUrl); else onOpen(a) }}
                style={{
                  position: 'absolute', left: '50%',
                  ...(up ? { bottom: 62, transform: 'translateX(-50%)' } : { top: 18, transform: 'translateX(-50%)' }),
                  background: '#fff', border: `1px solid ${active ? C.tan : C.line}`,
                  borderRadius: 8, padding: '8px 11px', cursor: 'pointer',
                  boxShadow: active ? '0 4px 12px rgba(0,61,66,.12)' : 'none',
                  width: 160, textAlign: 'center', transition: 'all .15s'
                }}>
                <div style={{ ...mono, fontSize: 10, color: C.inkSoft, marginBottom: 3 }}>
                  {formatDate(a.date)}
                </div>
                <div style={{
                  ...serif, fontSize: 12, fontWeight: 600, color: C.teal900,
                  lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>{a.title}</div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTITY GRAPH (force layout, no deps)
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_COLOR = { organization: C.teal800, person: C.tan, place: '#5C7C7A' }

function EntityGraph({ graph, onSelectEntity, onGenerate, generating, canGenerate, genErr }: any) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 420 })
  const [positions, setPos] = useState<Record<string, any>>({})
  const [hovered, setHovered] = useState<string | null>(null)
  
  // Feature 4.1: Depth Filter
  const [depth, setDepth] = useState(2)
  const [centerEntity, setCenterEntity] = useState<string | null>(null)

  const { nodes, edges } = useMemo(() => {
    if (!centerEntity || !graph?.nodes?.length) return graph || { nodes: [], edges: [] }
    
    const adj = new Map<string, string[]>()
    graph.edges.forEach(([u, v]: [string, string]) => {
      if (!adj.has(u)) adj.set(u, [])
      if (!adj.has(v)) adj.set(v, [])
      adj.get(u)!.push(v)
      adj.get(v)!.push(u)
    })

    const visited = new Set<string>()
    let currentLevel = [centerEntity]
    visited.add(centerEntity)

    for (let i = 0; i < depth; i++) {
      const nextLevel: string[] = []
      for (const node of currentLevel) {
        const neighbors = adj.get(node) || []
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            nextLevel.push(neighbor)
          }
        }
      }
      currentLevel = nextLevel
    }

    return { 
      nodes: graph.nodes.filter((n: any) => visited.has(n.id)), 
      edges: graph.edges.filter(([u, v]: [string, string]) => visited.has(u) && visited.has(v)) 
    }
  }, [graph, centerEntity, depth])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: Math.max(e.contentRect.width, 200), h: Math.max(e.contentRect.height, 200) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!nodes.length) { setPos({}); return }
    const { w, h } = size
    const pos: any = {}, vel: any = {}
    nodes.forEach((n: any, i: number) => {
      const existing = positions[n.id]
      if (existing) {
        pos[n.id] = { x: existing.x, y: existing.y }
      } else {
        const a = (i / nodes.length) * Math.PI * 2
        pos[n.id] = { x: w / 2 + Math.cos(a) * (w * .28), y: h / 2 + Math.sin(a) * (h * .28) }
      }
      vel[n.id] = { x: 0, y: 0 }
    })
    let frame = 0, raf
    function tick() {
      frame++
      // repulsion
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i].id, b = nodes[j].id
        const dx = pos[a].x - pos[b].x, dy = pos[a].y - pos[b].y
        const d = Math.max(Math.sqrt(dx * dx + dy * dy), .01)
        const f = 2800 / (d * d)
        vel[a].x += dx / d * f; vel[a].y += dy / d * f
        vel[b].x -= dx / d * f; vel[b].y -= dy / d * f
      }
      // springs
      edges.forEach(([a, b]: [string, string]) => {
        if (!pos[a] || !pos[b]) return
        const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y
        const d = Math.max(Math.sqrt(dx * dx + dy * dy), .01)
        const f = (d - 140) * .018
        const fx = dx / d * f, fy = dy / d * f
        vel[a].x += fx; vel[a].y += fy; vel[b].x -= fx; vel[b].y -= fy
      })
      // center pull + integrate
      nodes.forEach(({ id }: any) => {
        vel[id].x += (w / 2 - pos[id].x) * .002; vel[id].y += (h / 2 - pos[id].y) * .002
        vel[id].x *= .82; vel[id].y *= .82
        pos[id].x = Math.min(w - 70, Math.max(70, pos[id].x + vel[id].x))
        pos[id].y = Math.min(h - 70, Math.max(70, pos[id].y + vel[id].y))
      })
      setPos({ ...pos })
      if (frame < 150) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => raf && cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, size.w, size.h])

  const maxW = Math.max(1, ...nodes.map((n: any) => n.weight || 1))

  if (!nodes.length) return (
    <div style={{ maxWidth: 420, padding: '60px 32px', textAlign: 'center', margin: '0 auto' }}>
      <p style={{ ...serif, fontSize: 17, color: C.teal900, marginBottom: 8 }}>No entity map yet</p>
      <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 18 }}>
        {canGenerate
          ? 'Generate an entity map from the documents saved in this workspace.'
          : 'Add articles to this workspace first, then generate an entity map from them.'}
      </p>
      {onGenerate && (
        <button onClick={onGenerate} disabled={generating || !canGenerate}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px',
            background: canGenerate ? C.teal900 : C.lineStrong, color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: generating || !canGenerate ? 'not-allowed' : 'pointer', opacity: generating ? .7 : 1
          }}>
          {generating ? <Loader size={14} className="spin" /> : <Network size={14} />}
          {generating ? 'Generating…' : 'Generate entity map'}
        </button>
      )}
      {genErr && <p style={{ fontSize: 12, color: C.red, marginTop: 10 }}>{genErr}</p>}
    </div>
  )

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Feature 4.1: Depth Filter UI */}
      <div style={{
        position: 'absolute', top: 12, right: 16, background: '#fff', padding: '12px 16px',
        borderRadius: 10, border: `1px solid ${C.line}`, boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10, width: 220
      }}>
        {centerEntity ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.teal900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Focus: {centerEntity}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.inkSoft }}>Depth: {depth}</span>
              <input type="range" min={1} max={3} value={depth} onChange={e => setDepth(Number(e.target.value))} style={{ width: 100, accentColor: C.teal900 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => setCenterEntity(null)}
                style={{ flex: 1, padding: '6px 8px', fontSize: 11.5, background: C.creamDeep, color: C.inkSoft, border: `1px solid ${C.line}`, borderRadius: 6, cursor: 'pointer' }}>
                Reset
              </button>
              <button onClick={() => onSelectEntity?.(centerEntity)}
                style={{ flex: 2, padding: '6px 8px', fontSize: 11.5, background: C.teal800, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Search Entity
              </button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: C.inkSoft, textAlign: 'center' }}>Click a node to focus.</div>
        )}
      </div>

      <svg width={size.w} height={size.h} style={{ display: 'block' }}>
        {positions && edges.map(([a, b], i) => {
          const pa = positions[a], pb = positions[b]
          if (!pa || !pb) return null
          const dim = hovered && hovered !== a && hovered !== b
          return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
            stroke={dim ? C.line : C.lineStrong} strokeWidth={dim ? .8 : 1.4} opacity={dim ? .3 : .9} />
        })}
        {positions && nodes.map(n => {
          const p = positions[n.id]; if (!p) return null
          const r = 7 + (8 * (n.weight || 1)) / maxW
          const dim = hovered && hovered !== n.id
          const color = TYPE_COLOR[n.type] || C.teal800
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y})`}
              style={{ cursor: 'pointer' }} opacity={dim ? .4 : 1}
              onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}
              onClick={() => setCenterEntity(n.id)}>
              <circle r={r} fill={color} fillOpacity={.14} stroke={color} strokeWidth={1.5} />
              <circle r={2.5} fill={color} />
              <text textAnchor="middle" y={r + 14}
                style={{ fontSize: 11, fill: C.ink, fontFamily: 'Inter,sans-serif', pointerEvents: 'none' }}>
                {n.id.length > 18 ? n.id.slice(0, 18) + '…' : n.id}
              </text>
            </g>
          )
        })}
      </svg>
      <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', gap: 14, fontSize: 11.5, color: C.inkSoft }}>
        {Object.entries(TYPE_COLOR).map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <i style={{ width: 9, height: 9, borderRadius: '50%', background: v, display: 'inline-block' }} />
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE MANAGER MODAL  — multi-select, opens PDFs
// ─────────────────────────────────────────────────────────────────────────────
function FileManager({ workspaces, getArticles, backendDocs, onClose, onOpenArticle }) {
  const [activeId, setActiveId] = useState('__archive__')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(new Set())

  const isArchive = activeId === '__archive__'
  const allFiles = isArchive
    ? backendDocs.map(d => ({
      id: d.doc_id, title: d.title || d.filename, section: d.source_type || 'Archive',
      page: '—', date: d.pub_date || '', pdfUrl: d.pdf_url || '', doc_id: d.doc_id,
      filename: d.filename,
    }))
    : getArticles(workspaces.find(w => w.id === activeId))

  const files = allFiles.filter(f => f.title.toLowerCase().includes(query.toLowerCase()))

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function selectAll() { setSelected(new Set(files.map(f => f.id))) }
  function clearAll() { setSelected(new Set()) }

  function openSelected() {
    files.filter(f => selected.has(f.id)).forEach(f => {
      if (f.pdfUrl) openPdf(f.pdfUrl)
    })
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(28,27,25,.32)', zIndex: 100, display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: 'min(900px,92vw)', height: 'min(620px,86vh)', background: '#fff',
          borderRadius: 14, boxShadow: '0 8px 40px rgba(0,61,66,.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>

        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '15px 20px', borderBottom: `1px solid ${C.line}`, flexShrink: 0
        }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 8, ...serif,
            fontWeight: 600, fontSize: 16, color: C.teal900
          }}>
            <FolderClosed size={16} /> Archive Files
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selected.size > 0 && (
              <>
                <button onClick={openSelected}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    background: C.teal800, color: '#fff', border: 'none', borderRadius: 7,
                    fontSize: 12.5, cursor: 'pointer'
                  }}>
                  <ExternalLink size={13} /> Open {selected.size} PDF{selected.size > 1 ? 's' : ''}
                </button>
                <button onClick={clearAll}
                  style={{
                    fontSize: 12, color: C.inkSoft, background: 'transparent',
                    border: 'none', cursor: 'pointer'
                  }}>Clear</button>
              </>
            )}
            <button onClick={onClose} style={{
              border: 'none', background: 'transparent',
              cursor: 'pointer', color: C.inkSoft, display: 'flex'
            }}><X size={18} /></button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', flex: 1, minHeight: 0 }}>
          {/* Folder nav */}
          <nav className="scroll-thin" style={{
            borderRight: `1px solid ${C.line}`,
            background: C.creamDeep, padding: '12px 10px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 2
          }}>
            <button onClick={() => { setActiveId('__archive__'); setSelected(new Set()) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                padding: '8px 9px', borderRadius: 7, fontSize: 12.5, color: C.ink, cursor: 'pointer',
                background: activeId === '__archive__' ? '#fff' : 'transparent',
                border: `1px solid ${activeId === '__archive__' ? C.line : 'transparent'}`,
                fontWeight: activeId === '__archive__' ? 600 : 400
              }}>
              <FolderClosed size={13} style={{ color: C.tanDeep }} />
              Full Archive
              <span style={{ marginLeft: 'auto', ...mono, fontSize: 10.5, color: C.inkSoft }}>
                {backendDocs.length}
              </span>
            </button>
            {workspaces.map(ws => (
              <button key={ws.id} onClick={() => { setActiveId(ws.id); setSelected(new Set()) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                  padding: '8px 9px', borderRadius: 7, fontSize: 12.5, color: C.ink, cursor: 'pointer',
                  background: activeId === ws.id ? '#fff' : 'transparent',
                  border: `1px solid ${activeId === ws.id ? C.line : 'transparent'}`,
                  fontWeight: activeId === ws.id ? 600 : 400
                }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: ws.color }} />
                {ws.name}
                <span style={{ marginLeft: 'auto', ...mono, fontSize: 10.5, color: C.inkSoft }}>
                  {ws.articleIds.length}
                </span>
              </button>
            ))}
          </nav>

          {/* File table */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
              borderBottom: `1px solid ${C.line}`, flexShrink: 0
            }}>
              <Search size={14} style={{ color: C.inkSoft }} />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder={`Search in ${isArchive ? 'archive' : workspaces.find(w => w.id === activeId)?.name || ''}…`}
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 13, fontFamily: 'inherit'
                }} />
              {files.length > 0 && (
                <button onClick={selectAll}
                  style={{
                    fontSize: 11.5, color: C.teal800, background: 'transparent',
                    border: 'none', cursor: 'pointer', ...mono
                  }}>
                  Select all ({files.length})
                </button>
              )}
            </div>

            <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto' }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 110px 60px 100px',
                alignItems: 'center', gap: 10, padding: '9px 18px',
                ...mono, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: C.inkSoft, borderBottom: `1px solid ${C.line}`,
                position: 'sticky', top: 0, background: '#fff', zIndex: 2
              }}>
                <span />
                <span>Name</span><span>Section</span><span>Page</span><span>Date</span>
              </div>

              {files.length === 0 && (
                <p style={{ padding: '30px 18px', fontSize: 13, color: C.inkSoft, textAlign: 'center' }}>
                  {query ? `No files match "${query}".` : 'No documents in this workspace yet.'}
                </p>
              )}

              {files.map(f => {
                const isSel = selected.has(f.id)
                return (
                  <div key={f.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '28px 1fr 110px 60px 100px',
                      alignItems: 'center', gap: 10, padding: '9px 18px',
                      borderBottom: `1px solid ${C.creamDeep}`, background: isSel ? C.teal100 : 'transparent',
                      cursor: 'pointer', transition: 'background .12s'
                    }}
                    onClick={() => toggleSelect(f.id)}
                    className="fm-row">
                    <input type="checkbox" readOnly checked={isSel} style={{ cursor: 'pointer' }} />
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500,
                      color: C.ink, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      <FileText size={13} style={{ color: C.tanDeep, flexShrink: 0 }} />
                      {f.title}
                    </span>
                    <span style={{ fontSize: 12.5, color: C.inkSoft }}>{f.section}</span>
                    <span style={{ fontSize: 12.5, color: C.inkSoft, ...mono }}>{f.page}</span>
                    <span style={{ fontSize: 12.5, color: C.inkSoft, ...mono }}>
                      {f.date ? formatDate(f.date) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Open selected footer */}
            {selected.size > 0 && (
              <div style={{
                borderTop: `1px solid ${C.line}`, padding: '10px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <span style={{ fontSize: 12.5, color: C.inkSoft }}>
                  {selected.size} file{selected.size > 1 ? 's' : ''} selected
                </span>
                <button onClick={openSelected}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                    background: C.teal900, color: '#fff', border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}>
                  <ExternalLink size={14} />
                  Open PDF{selected.size > 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB SWITCHER
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'results', label: 'Search Results', Icon: () => <Search size={14} strokeWidth={2} /> },
  { id: 'timeline', label: 'Timeline', Icon: () => <Clock size={14} strokeWidth={2} /> },
  { id: 'graph', label: 'Entity Knowledge Graph', Icon: () => <Network size={14} strokeWidth={2} /> },
]
function TabSwitcher({ active, onChange }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, borderBottom: `1px solid ${C.line}`, width: '100%' }}>
      {TABS.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => onChange(id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, background: 'transparent',
            border: 'none', borderBottom: `2px solid ${active === id ? C.tan : 'transparent'}`,
            padding: '10px 4px', marginRight: 22, fontSize: 13,
            fontWeight: active === id ? 600 : 500,
            color: active === id ? C.teal900 : C.inkSoft,
            cursor: 'pointer', transform: 'translateY(1px)', transition: 'color .15s, border-color .15s'
          }}>
          <Icon />{label}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT SIDEBAR  — with drag-drop drop zone for articles
// ─────────────────────────────────────────────────────────────────────────────
const SEED_MSGS = [{ role: 'assistant', text: "I'm scoped to this workspace's archive. Ask me about any reporter, contract, or filing it contains — I'll cite exactly where I found it." }]

function ChatSidebar({ collapsed, onToggle, activeWorkspace, api, sessionId, onNewSources, onCreateWs }) {
  const [messages, setMessages] = useState(SEED_MSGS)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const bottomRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Drop zone: accept dragged articles
  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    const data = e.dataTransfer.getData('application/article')
    if (!data) return
    try {
      const article = JSON.parse(data)
      setDraft(d => d ? `${d}\n\nContext: "${article.title}"` : `Tell me more about: "${article.title}"`)
    } catch { }
  }

  async function send() {
    const text = draft.trim()
    if (!text || loading) return
    setDraft('')
    setMessages(m => [...m, { role: 'user', text }])
    if (!api) {
      setMessages(m => [...m, { role: 'assistant', text: 'Connect the backend (paste your ngrok URL above) before searching the archive.' }])
      return
    }
    setLoading(true)
    try {
      const res = await api.chat(text, sessionId)
      if (res.sources?.length) onNewSources?.(res.sources)
      let reply = res.reply || 'No response from archive.'
      if (res.sources?.length) {
        const cites = res.sources.slice(0, 4).map((s, i) => {
          const dm = s.doc_meta || {}
          return `[${i + 1}] ${dm.title || s.filename || 'Document'} · p.${s.page_number ?? '?'}`
        }).join('\n')
        reply += `\n\nSources:\n${cites}`
      }
      setMessages(m => [...m, { role: 'assistant', text: reply }])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: `⚠ ${err.message}`, error: true }])
    } finally { setLoading(false) }
  }

  if (collapsed) return (
    <button onClick={onToggle} aria-label="Open chat"
      style={{
        width: 44, borderLeft: `1px solid ${C.line}`, background: C.creamDeep,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        paddingTop: 20, color: C.inkSoft, border: 'none', cursor: 'pointer'
      }}>
      <PanelRightOpen size={18} strokeWidth={2} />
      <span style={{ fontSize: 11, writingMode: 'vertical-rl', letterSpacing: '0.04em' }}>Chat</span>
    </button>
  )

  return (
    <aside style={{
      width: 320, borderLeft: `1px solid ${C.line}`, background: C.creamDeep,
      display: 'flex', flexDirection: 'column', height: '100%'
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 12px', flexShrink: 0
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 7, fontSize: 13,
          fontWeight: 600, color: C.teal900
        }}>
          <Bot size={16} strokeWidth={2} /> Archive Assistant
        </span>
        <button onClick={onToggle} style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'transparent', border: 'none', cursor: 'pointer', color: C.inkSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <PanelRightClose size={17} strokeWidth={2} />
        </button>
      </header>

      {activeWorkspace && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5,
          color: C.inkSoft, padding: '0 16px 12px'
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeWorkspace.color }} />
          Scoped to <strong style={{ color: C.teal800 }}>{activeWorkspace.name}</strong>
        </div>
      )}

      <div className="scroll-thin" style={{
        flex: 1, overflowY: 'auto', padding: '4px 16px 16px',
        display: 'flex', flexDirection: 'column', gap: 10
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            fontSize: 13, lineHeight: 1.5, padding: '10px 13px',
            borderRadius: 10, maxWidth: '92%', whiteSpace: 'pre-wrap',
            ...(m.role === 'user'
              ? { background: C.teal800, color: '#fff', alignSelf: 'flex-end', borderBottomRightRadius: 3 }
              : {
                background: '#fff', border: `1px solid ${m.error ? C.red : C.line}`,
                color: m.error ? C.red : C.ink, alignSelf: 'flex-start', borderBottomLeftRadius: 3
              })
          }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{
            fontSize: 13, padding: '10px 13px', borderRadius: 10, background: '#fff',
            border: `1px solid ${C.line}`, color: C.inkSoft, alignSelf: 'flex-start',
            display: 'flex', alignItems: 'center', gap: 8, fontStyle: 'italic'
          }}>
            <Loader size={13} className="spin" /> Searching archive…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer — also a drop zone for dragged articles */}
      <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        style={{
          position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 6,
          padding: 12, borderTop: `2px solid ${dragOver ? C.tan : C.line}`,
          flexShrink: 0, transition: 'border-color .15s',
          background: dragOver ? C.tanPale : 'transparent'
        }}>
        {dragOver && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', pointerEvents: 'none', fontSize: 12.5, color: C.tanDeep,
            fontWeight: 600, gap: 6
          }}>
            <GripVertical size={14} /> Drop article here
          </div>
        )}
        {menuOpen && (
          <div style={{
            position: 'absolute', bottom: 56, left: 12, background: '#fff',
            border: `1px solid ${C.line}`, borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,61,66,.16)', padding: 6,
            display: 'flex', flexDirection: 'column', gap: 2, width: 170, zIndex: 10
          }}>
            <button onClick={() => { onCreateWs('New Workspace'); setMenuOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                padding: '8px 9px', borderRadius: 6, background: 'transparent', border: 'none',
                fontSize: 12.5, color: C.ink, cursor: 'pointer'
              }}>
              <FolderPlus size={14} /> New workspace
            </button>
          </div>
        )}
        <button onClick={() => setMenuOpen(v => !v)}
          style={{
            width: 30, height: 30, borderRadius: '50%', border: `1px solid ${C.lineStrong}`,
            background: '#fff', color: C.teal800, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0
          }}>
          <Plus size={16} strokeWidth={2.25} />
        </button>
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={1}
          placeholder="Ask about this workspace… or drag an article here"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          style={{
            flex: 1, resize: 'none', border: `1px solid ${C.line}`, borderRadius: 10,
            background: '#fff', padding: '8px 10px', fontSize: 13, outline: 'none',
            maxHeight: 90, lineHeight: 1.4, fontFamily: 'inherit'
          }} />
        <button onClick={send} disabled={loading || !draft.trim()}
          style={{
            width: 30, height: 30, borderRadius: '50%', background: C.teal800, border: 'none',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loading || !draft.trim() ? 'not-allowed' : 'pointer', flexShrink: 0,
            opacity: loading || !draft.trim() ? .5 : 1
          }}>
          {loading ? <Loader size={14} className="spin" /> : <Send size={15} strokeWidth={2.25} />}
        </button>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // Backend
  const [apiUrl, setApiUrl] = useState('https://your-ngrok-url.ngrok-free.app')
  const [connected, setConnected] = useState(null)
  const [checking, setChecking] = useState(false)
  const [api, setApi] = useState(null)
  const sessionId = useRef('newsroom_' + Date.now())

  // Workspaces
  const [workspaces, setWorkspaces] = useState(SEED_WORKSPACES)
  const [activeWsId, setActiveWsId] = useState(SEED_WORKSPACES[0].id)

  // Per-workspace data maps:  wsId → articles[]
  const [wsResults, setWsResults] = useState<Record<string, any[]>>({})  // raw search feed per ws (transient)
  const [wsScopedResults, setWsScopedResults] = useState<Record<string, any[]>>({}) // Feature 4.2 scoped search feed
  const [wsTimeline, setWsTimeline] = useState<Record<string, any[]>>({})  // timeline per ws (derived from SAVED articles only)
  const [wsGraph, setWsGraph] = useState<Record<string, any>>({})  // entity graph per ws (derived from SAVED articles only)

  // Search Mode (Feature 4.2)
  const [searchMode, setSearchMode] = useState<'archive' | 'workspace'>('archive')

  // Global id → article lookup. An article that was returned by a search in
  // workspace A but then added to workspace B needs to be resolvable from B
  // even though B's own wsResults slot never contained it.
  const [articleIndex, setArticleIndex] = useState({})
  function indexArticles(list) {
    if (!list?.length) return
    setArticleIndex(idx => {
      const next = { ...idx }
      list.forEach(a => { next[a.id] = a })
      return next
    })
  }

  // Archive docs from backend
  const [backendDocs, setBackendDocs] = useState([])

  // Search
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')

  // Manual "Generate timeline / entity map" trigger — a fallback in case the
  // automatic per-workspace effect below doesn't fire (e.g. articles were
  // saved before a backend connection existed) or the user just wants a
  // fresh pull without re-adding anything.
  const [generatingIntel, setGeneratingIntel] = useState(false)
  const [intelErr, setIntelErr] = useState('')

  // UI
  const [activeTab, setActiveTab] = useState('results')
  const [openArticle, setOpenArticle] = useState(null)
  const [fileManagerOpen, setFileManagerOpen] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)

  const activeWs = workspaces.find(w => w.id === activeWsId)

  // Results the user should SEE for a workspace: if they've explicitly added
  // articles to it, show exactly those (resolved via the global index so it
  // doesn't matter which workspace originally searched them up). Otherwise,
  // fall back to that workspace's own raw search feed as a scratch pad.
  function visibleArticles(ws: any) {
    if (!ws) return []
    // Defect 3.1: Always return the full array from the feed
    const source = searchMode === 'workspace' ? wsScopedResults : wsResults
    return source[ws.id] || []
  }

  // Strictly the articles actually saved into a workspace
  function savedArticles(ws: any) {
    if (!ws) return []
    return ws.articleIds
      .map((id: string) => articleIndex[id] || (wsResults[ws.id] || []).find((a: any) => a.id === id) || (wsScopedResults[ws.id] || []).find((a: any) => a.id === id))
      .filter(Boolean)
  }

  const currentResults = visibleArticles(activeWs)
  const currentTimeline = wsTimeline[activeWsId] || []
  const currentGraph = wsGraph[activeWsId] || { nodes: [], edges: [] }

  // ── Backend connect ──
  const handleCheck = useCallback(async url => {
    setChecking(true); setConnected(null); setSearchErr('')
    const instance = makeApi(url || apiUrl)
    try {
      await instance.health()
      CURRENT_API_BASE = (url || apiUrl).replace(/\/$/, '')
      setApi(instance); setConnected(true)
      const res = await instance.listDocuments()
      setBackendDocs(res.documents || [])
    } catch { setApi(null); setConnected(false) }
    finally { setChecking(false) }
  }, [apiUrl])

  // ── Search — results stay per workspace ──
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    if (!api) { setSearchErr('Connect the backend first.'); return }
    setSearching(true); setSearchErr('')

    try {
      let docIds: string[] = []
      if (searchMode === 'workspace') {
        const saved = activeWs?.articleIds
          .map((id: string) => articleIndex[id] || (wsResults[activeWs.id] || []).find((a: any) => a.id === id) || (wsScopedResults[activeWs.id] || []).find((a: any) => a.id === id))
          .filter(Boolean) || []
        docIds = [...new Set(saved.map((a: any) => a.doc_id).filter(Boolean))] as string[]
      }

      const res = await api.search(query, 12, searchMode === 'workspace' ? docIds : [])
      const articles = (res.results || []).map(chunkToArticle)

      indexArticles(articles)
      // Feature 4.2: Retain both cached results
      if (searchMode === 'workspace') {
        setWsScopedResults(r => ({ ...r, [activeWsId]: articles }))
      } else {
        setWsResults(r => ({ ...r, [activeWsId]: articles }))
      }
    } catch (err: any) { setSearchErr(`Search failed: ${err.message}`) }
    finally { setSearching(false) }
  }, [query, api, activeWsId, searchMode, activeWs, articleIndex, wsResults, wsScopedResults])

  // ── Chat sources → merge into this workspace's results ──
  function handleChatSources(rawSources) {
    const articles = rawSources.map(chunkToArticle)
    indexArticles(articles)
    setWsResults(r => {
      const prev = r[activeWsId] || []
      const seen = new Set(prev.map(a => a.chunk_id))
      return { ...r, [activeWsId]: [...articles.filter(a => !seen.has(a.chunk_id)), ...prev] }
    })
    setActiveTab('results')
  }

  // ── Workspace management ──
  function createWorkspace(name) {
    const id = 'ws-' + uid()
    const color = WS_COLORS[workspaces.length % WS_COLORS.length]
    setWorkspaces(ws => [...ws, { id, name, desk: 'general', color, articleIds: [] }])
    setActiveWsId(id)
    return id
  }

  function addArticleToWs(wsId, articleId) {
    setWorkspaces(ws => ws.map(w =>
      w.id === wsId && !w.articleIds.includes(articleId)
        ? { ...w, articleIds: [...w.articleIds, articleId] }
        : w
    ))
  }

  function createAndAdd(name, articleId) {
    const id = createWorkspace(name)
    setTimeout(() => addArticleToWs(id, articleId), 50)
  }

  function handleDropArticleToWs(wsId: string, article: any) {
    // Add article to wsResults for that workspace, and save its id
    indexArticles([article])
    setWsResults(r => {
      const prev = r[wsId] || []
      if (prev.find((a: any) => a.id === article.id)) return r
      return { ...r, [wsId]: [...prev, article] }
    })
    setWsScopedResults(r => {
      const prev = r[wsId] || []
      if (prev.find((a: any) => a.id === article.id)) return r
      return { ...r, [wsId]: [...prev, article] }
    })
    addArticleToWs(wsId, article.id)
  }

  function getArticlesForWs(ws) {
    return visibleArticles(ws)
  }

  // ── Timeline + EntityGraph: derived ONLY from documents actually saved
  // into the active workspace. Re-runs on workspace switch and whenever
  // that workspace's saved article set changes — never on search. ──
  const activeWsArticleIdsKey = (activeWs?.articleIds || []).join(',')
  useEffect(() => {
    if (!api || !activeWs) return
    const wsId = activeWs.id
    const docIds = [...new Set(savedArticles(activeWs).map(a => a.doc_id).filter(Boolean))]

    if (docIds.length === 0) {
      setWsTimeline(t => ({ ...t, [wsId]: [] }))
      setWsGraph(g => ({ ...g, [wsId]: { nodes: [], edges: [] } }))
      return
    }

    let cancelled = false
    api.workspace(docIds)
      .then(res => {
        if (cancelled) return
        setWsTimeline(t => ({
          ...t,
          [wsId]: res.timeline?.length ? res.timeline.map(timelineEventToArticle) : [],
        }))
        setWsGraph(g => ({ ...g, [wsId]: buildEntityGraph(res.entity_graph || []) }))
      })
      .catch(() => {
        if (cancelled) return
        setWsTimeline(t => ({ ...t, [wsId]: [] }))
        setWsGraph(g => ({ ...g, [wsId]: { nodes: [], edges: [] } }))
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, activeWsId, activeWsArticleIdsKey, articleIndex])

  // Manual trigger for the button in Timeline/EntityGraph's empty states.
  // Uses saved articles if any exist; otherwise falls back to whatever is
  // currently visible (the raw search feed) so a fresh workspace with no
  // explicit "+" additions yet can still generate something from a search.
  const intelSourceArticles = savedArticles(activeWs).length
    ? savedArticles(activeWs)
    : visibleArticles(activeWs)
  const canGenerateIntel = intelSourceArticles.some(a => a.doc_id)

  async function generateWorkspaceIntel() {
    if (!api || !activeWs) return
    const docIds = [...new Set(intelSourceArticles.map(a => a.doc_id).filter(Boolean))]
    if (!docIds.length) {
      setIntelErr('No documents to analyze — search or add articles to this workspace first.')
      return
    }
    setGeneratingIntel(true)
    setIntelErr('')
    try {
      const res = await api.workspace(docIds)
      setWsTimeline(t => ({
        ...t,
        [activeWs.id]: res.timeline?.length ? res.timeline.map(timelineEventToArticle) : [],
      }))
      setWsGraph(g => ({ ...g, [activeWs.id]: buildEntityGraph(res.entity_graph || []) }))
      if (!res.timeline?.length && !res.entity_graph?.length) {
        setIntelErr('The backend returned no timeline events or entities for these documents.')
      }
    } catch (err) {
      setIntelErr(`Failed to generate: ${err.message}`)
    } finally {
      setGeneratingIntel(false)
    }
  }

  function handleIngestDone() {
    if (api) api.listDocuments().then(r => setBackendDocs(r.documents || [])).catch(() => { })
  }

  const inWsSet = new Set(activeWs?.articleIds || [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      overflow: 'hidden', background: C.cream, ...sans
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin:0; -webkit-font-smoothing:antialiased; }
        .spin { animation: spin .85s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .scroll-thin { scrollbar-width: thin; scrollbar-color: #C9C3B2 transparent; }
        .scroll-thin::-webkit-scrollbar { width:6px; height:6px; }
        .scroll-thin::-webkit-scrollbar-thumb { background:#C9C3B2; border-radius:10px; }
        .result-card:hover { border-color: #C9C3B2 !important; box-shadow: 0 2px 8px rgba(0,61,66,.08) !important; }
        .icon-btn:hover { border-color: var(--tan,#B19470) !important; color: #95764F !important; }
        .picker-item:hover { background: #F1EFE6 !important; }
        .archive-doc-row:hover { background: rgba(0,61,66,.05) !important; }
        .archive-file-btn:hover { background: #fff !important; color: #004B50 !important; }
        .fm-row:hover { background: #F1EFE6 !important; }
      `}</style>

      {/* Ngrok bar — ABOVE the grid, always visible */}
      <NgrokBar apiUrl={apiUrl} setApiUrl={setApiUrl} connected={connected}
        checking={checking} onCheck={handleCheck} />

      {/* App grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '232px 1fr auto',
        flex: 1, overflow: 'hidden', minHeight: 0
      }}>

        <LeftPanel workspaces={workspaces} activeWsId={activeWsId}
          onSelectWs={setActiveWsId} onCreateWs={createWorkspace}
          onOpenFileManager={() => setFileManagerOpen(true)}
          backendDocs={backendDocs} api={api} onIngestDone={handleIngestDone}
          onDropArticleToWs={handleDropArticleToWs} />

        {/* Main panel */}
        <main style={{
          position: 'relative', display: 'flex', flexDirection: 'column',
          minWidth: 0, minHeight: 0, overflow: 'hidden'
        }}>

          {/* Header */}
          <div style={{ padding: '22px 32px 0', flexShrink: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{
                ...mono, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.tanDeep, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6
              }}>
                {activeWs && <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeWs.color }} />}
                {activeWs?.name ?? 'Archive'}
              </div>
              <h1 style={{
                ...serif, fontSize: 26, fontWeight: 600, color: C.teal900, margin: 0,
                letterSpacing: '-0.01em'
              }}>
                {query ? `"${query.length > 55 ? query.slice(0, 55) + '…' : query}"` : 'Newsroom Intelligence'}
              </h1>
              {currentResults.length > 0 && (
                <p style={{ fontSize: 13.5, color: C.inkSoft, margin: '4px 0 0' }}>
                  {currentResults.length} source{currentResults.length !== 1 ? 's' : ''} in this workspace
                </p>
              )}
            </div>
            <TabSwitcher active={activeTab} onChange={setActiveTab} />
          </div>

          {/* Error */}
          {searchErr && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, margin: '12px 32px 0',
              background: '#FEF0EF', border: '1px solid #F4C5C0', borderRadius: 7,
              padding: '10px 14px', fontSize: 12.5, color: C.red
            }}>
              <AlertTriangle size={14} /> {searchErr}
            </div>
          )}

          {/* Content */}
          <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: '20px 32px 160px' }}>
            {searching ? (
              <div style={{ maxWidth: 420, padding: '60px 0', textAlign: 'center' }}>
                <p style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 9, ...serif, fontSize: 17, color: C.teal900
                }}>
                  <Loader size={18} className="spin" /> Searching archive…
                </p>
              </div>
            ) : activeTab === 'results' ? (
              currentResults.length === 0 ? (
                <div style={{ maxWidth: 420, padding: '60px 0' }}>
                  <p style={{ ...serif, fontSize: 17, color: C.teal900, marginBottom: 8 }}>No results yet</p>
                  <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6 }}>
                    {connected ? 'Enter a query below to search the archive.'
                      : 'Connect the backend using the bar above, then search.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 760 }}>
                  {currentResults.map((article, idx) => (
                    <ResultCard key={article.id} article={article} index={idx}
                      onOpen={setOpenArticle}
                      inWorkspace={inWsSet.has(article.id)}
                      onAddToWorkspace={addArticleToWs}
                      workspaces={workspaces}
                      onCreateAndAdd={createAndAdd} />
                  ))}
                </div>
              )
            ) : activeTab === 'timeline' ? (
              <Timeline articles={currentTimeline} onOpen={setOpenArticle}
                onGenerate={generateWorkspaceIntel} generating={generatingIntel}
                canGenerate={canGenerateIntel} genErr={intelErr} />
            ) : (
              <div style={{ height: 'calc(100vh - 260px)', minHeight: 400 }}>
                <EntityGraph graph={currentGraph}
                  onSelectEntity={name => { setQuery(name); setActiveTab('results') }}
                  onGenerate={generateWorkspaceIntel} generating={generatingIntel}
                  canGenerate={canGenerateIntel} genErr={intelErr} />
              </div>
            )}
          </div>

          {/* Floating search bar */}
          <div style={{
            position: 'absolute', bottom: 24, left: 24, right: 24,
            background: '#fff', borderRadius: 14, border: `1px solid ${C.line}`,
            boxShadow: '0 8px 24px rgba(0,61,66,.16)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Feature 4.2: Search Scope Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 18px 0', background: C.creamDeep }}>
              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: searchMode === 'archive' ? C.teal900 : C.inkSoft, fontWeight: searchMode === 'archive' ? 600 : 400 }}>
                <input type="radio" checked={searchMode === 'archive'} onChange={() => setSearchMode('archive')} style={{ margin: 0, accentColor: C.teal900 }} />
                Whole Archive
              </label>
              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: searchMode === 'workspace' ? C.teal900 : C.inkSoft, fontWeight: searchMode === 'workspace' ? 600 : 400 }}>
                <input type="radio" checked={searchMode === 'workspace'} onChange={() => setSearchMode('workspace')} style={{ margin: 0, accentColor: C.teal900 }} />
                This Workspace
              </label>
            </div>
            
            <form onSubmit={e => { e.preventDefault(); if (!searching) handleSearch() }}
              style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#fff' }}>
              <Search size={17} strokeWidth={2} style={{ margin: '0 0 0 18px', color: C.inkSoft, flexShrink: 0 }} />
              <input value={query} onChange={e => {
                const v = e.target.value
                setQuery(v)
                if (!v.trim()) {
                  if (searchMode === 'workspace') {
                    setWsScopedResults(r => ({ ...r, [activeWsId]: [] }))
                  } else {
                    setWsResults(r => ({ ...r, [activeWsId]: [] }))
                  }
                  setWsTimeline(t => ({ ...t, [activeWsId]: [] }))
                  setWsGraph(g => ({ ...g, [activeWsId]: { nodes: [], edges: [] } }))
                  setSearchErr('')
                }
              }}
                placeholder='Search the archive — "what have we published about Riverbend LLC since 2015?"'
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 14, color: C.ink, padding: '16px 14px', fontFamily: 'inherit'
                }} />
              <button type="submit" disabled={searching || !query.trim()}
                style={{
                  margin: '8px 10px 8px 0', width: 38, height: 38, borderRadius: '50%',
                  background: searching || !query.trim() ? C.lineStrong : C.teal900,
                  border: 'none', color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: searching || !query.trim() ? 'not-allowed' : 'pointer',
                  flexShrink: 0, transition: 'background .15s'
                }}>
                {searching ? <Loader size={16} strokeWidth={2.5} className="spin" />
                  : <Search size={16} strokeWidth={2.5} />}
              </button>
            </form>
          </div>
        </main>

        <ChatSidebar collapsed={chatCollapsed} onToggle={() => setChatCollapsed(v => !v)}
          activeWorkspace={activeWs} api={api} sessionId={sessionId.current}
          onNewSources={handleChatSources} onCreateWs={createWorkspace} />
      </div>

      {openArticle && <SourceDrawer article={openArticle} onClose={() => setOpenArticle(null)} />}
      {fileManagerOpen && (
        <FileManager workspaces={workspaces} getArticles={getArticlesForWs}
          backendDocs={backendDocs} onClose={() => setFileManagerOpen(false)}
          onOpenArticle={a => { setFileManagerOpen(false); setOpenArticle(a) }} />
      )}
    </div>
  )
}
