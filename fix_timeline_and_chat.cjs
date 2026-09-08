const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Markdown import
const importMatch = `import {\n  Search,`;
const importReplace = `import Markdown from 'react-markdown'\nimport {\n  Search,`;
code = code.replace(importMatch, importReplace);

// 2. Rewrite Timeline back to horizontal evenly spaced
const timelineStart = `// TIMELINE (inline - uses articles directly)
// ─────────────────────────────────────────────────────────────────────────────
function Timeline({ articles, onOpen, onGenerate, generating, canGenerate, genErr }) {`;
const timelineEndRegex = `// ─────────────────────────────────────────────────────────────────────────────
// ENTITY GRAPH (force layout, no deps)`;

const idxStart = code.indexOf(timelineStart);
const idxEnd = code.indexOf(timelineEndRegex);

if (idxStart !== -1 && idxEnd !== -1) {
  const newTimeline = `// TIMELINE (inline - uses articles directly)
// ─────────────────────────────────────────────────────────────────────────────
function Timeline({ articles, onOpen, onGenerate, generating, canGenerate, genErr }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const sorted = [...articles]
    .filter(a => a.date && a.date !== '1970-01-01')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // ascending order (oldest first)

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

  return (
    <div style={{ height: 'calc(100vh - 210px)', display: 'flex', flexDirection: 'column', background: '#F9F8F5' }}>
      <div style={{ padding: '24px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 12.5, color: C.inkSoft, ...mono }}>
          {sorted.length} entries · chronological order
        </div>
        {onGenerate && (
          <button onClick={onGenerate} disabled={generating || !canGenerate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              background: '#fff', color: canGenerate ? C.teal900 : C.inkSoft,
              border: \`1px solid \${canGenerate ? C.teal900 : C.lineStrong}\`, borderRadius: 16,
              fontSize: 12.5, fontWeight: 600, cursor: generating || !canGenerate ? 'not-allowed' : 'pointer',
              opacity: generating ? .7 : 1, transition: 'all .15s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
            {generating ? <Loader size={13} className="spin" /> : <Clock size={13} />}
            {generating ? 'Updating…' : 'Update Timeline'}
          </button>
        )}
      </div>

      <div className="scroll-thin" style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '0 32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', height: '100%', minHeight: 480, padding: '0 20px' }}>
          
          {/* Continuous Track Line */}
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '50%', height: 2,
            background: C.lineStrong, transform: 'translateY(-50%)', zIndex: 0
          }} />

          {sorted.map((a, i) => {
            const up = i % 2 === 0
            const active = hoveredId === a.id
            return (
              <div key={a.id + i} style={{ 
                width: 320, height: 2, position: 'relative', display: 'flex', justifyContent: 'center', zIndex: active ? 10 : 1 
              }}
                onMouseEnter={() => setHoveredId(a.id)} onMouseLeave={() => setHoveredId(null)}>
                
                {/* Connecting stem */}
                <div style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                  width: 2, background: active ? C.tan : C.lineStrong,
                  height: 60, ...(up ? { bottom: 0 } : { top: 0 }),
                  transition: 'background .15s'
                }} />

                {/* Dot */}
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', border: \`3px solid \${active ? C.tan : C.teal800}\`,
                  background: '#fff', position: 'absolute', left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)', zIndex: 2, transition: 'border-color .15s'
                }} />

                {/* Card */}
                <button onClick={() => { if (a.pdfUrl) openPdf(a.pdfUrl); else onOpen(a) }}
                  style={{
                    position: 'absolute', left: '50%',
                    ...(up ? { bottom: 60, transform: 'translateX(-50%)' } : { top: 60, transform: 'translateX(-50%)' }),
                    background: '#fff', border: \`1px solid \${active ? C.tan : C.line}\`,
                    borderRadius: 14, padding: '16px 20px', cursor: 'pointer',
                    boxShadow: active ? '0 12px 32px rgba(0,61,66,.12)' : '0 4px 12px rgba(0,0,0,0.04)',
                    width: 280, textAlign: 'left', transition: 'all .2s ease-out'
                  }}>
                  <div style={{ ...mono, fontSize: 11, color: C.inkSoft, marginBottom: 6 }}>
                    {formatDate(a.date)}
                  </div>
                  <div style={{
                    ...serif, fontSize: 17, fontWeight: 600, color: C.teal900,
                    lineHeight: 1.3, marginBottom: 8,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>{a.title}</div>
                  
                  {a.excerpt && (
                    <div style={{
                      fontSize: 13.5, color: C.ink, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      opacity: 0.9
                    }}>
                      {a.excerpt}
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

`;
  code = code.substring(0, idxStart) + newTimeline + code.substring(idxEnd);
}

fs.writeFileSync('src/App.tsx', code);
