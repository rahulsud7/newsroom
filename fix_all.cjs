const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix Chat Sidebar Scroll
code = code.replace(
  "useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'auto' }) }, [messages])",
  "useEffect(() => {\n    if (!collapsed) {\n      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 50)\n    }\n  }, [messages, collapsed])"
);

// 2. Refactor Timeline to vertical layout + Update Button
const oldTimelineStart = `// TIMELINE (inline - uses articles directly)
// ─────────────────────────────────────────────────────────────────────────────
function Timeline({ articles, onOpen, onGenerate, generating, canGenerate, genErr }) {`;
const oldTimelineEndStr = `// ─────────────────────────────────────────────────────────────────────────────
// ENTITY GRAPH (force layout, no deps)`;

const idxTStart = code.indexOf(oldTimelineStart);
const idxTEnd = code.indexOf(oldTimelineEndStr);
if (idxTStart !== -1 && idxTEnd !== -1) {
  const newTimeline = `// TIMELINE (inline - uses articles directly)
// ─────────────────────────────────────────────────────────────────────────────
function Timeline({ articles, onOpen, onGenerate, generating, canGenerate, genErr }) {
  const sorted = [...articles]
    .filter(a => a.date && a.date !== '1970-01-01')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // sort newest first

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
    <div className="scroll-thin" style={{ height: '100%', overflowY: 'auto', padding: '32px 40px', background: '#F9F8F5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 12.5, color: C.inkSoft, ...mono }}>
          {sorted.length} entries · newest first
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

      <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
        {/* Vertical Track Line */}
        <div style={{
          position: 'absolute', top: 12, bottom: 24, left: 21, width: 2,
          background: C.lineStrong, borderRadius: 2
        }} />

        {sorted.map((a, i) => (
          <div key={a.id + i} style={{
            position: 'relative', display: 'flex', gap: 24, paddingBottom: i === sorted.length - 1 ? 0 : 36
          }}>
            {/* Dot */}
            <div style={{
              width: 14, height: 14, borderRadius: '50%', background: '#fff',
              border: \`3px solid \${C.teal800}\`, position: 'relative', zIndex: 2,
              marginTop: 22, marginLeft: 15, flexShrink: 0
            }} />
            
            {/* Content Card */}
            <button onClick={() => { if (a.pdfUrl) openPdf(a.pdfUrl); else onOpen(a) }}
              style={{
                flex: 1, background: '#fff', border: \`1px solid \${C.line}\`,
                borderRadius: 14, padding: '18px 22px', textAlign: 'left',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all .2s ease-out'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,61,66,.1)';
                e.currentTarget.style.borderColor = C.tan;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                e.currentTarget.style.borderColor = C.line;
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
              <div style={{ ...mono, fontSize: 11.5, color: C.inkSoft }}>
                {formatDate(a.date)}
              </div>
              <div style={{
                ...serif, fontSize: 15.5, fontWeight: 600, color: C.teal900,
                lineHeight: 1.4
              }}>
                {a.title}
              </div>
              {a.excerpt && (
                <div style={{
                  fontSize: 13, color: C.ink, lineHeight: 1.6,
                  display: '-webkit-box', WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 2,
                  opacity: 0.9
                }}>
                  {a.excerpt}
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

`;
  code = code.substring(0, idxTStart) + newTimeline + code.substring(idxTEnd);
}

// 3. Add Update button to Entity Graph & polish nodes
const entityFilterStart = `{/* Feature 4.1: Depth Filter UI */}`;
const entityFilterEnd = `</svg>`;

const idxEStart = code.indexOf(entityFilterStart);
const idxEEnd = code.indexOf(entityFilterEnd) + entityFilterEnd.length;

if (idxEStart !== -1 && idxEEnd !== -1) {
  const newEntityGraph = `{/* Top Bar with Filters and Update Button */}
      <div style={{
        position: 'absolute', top: 16, right: 16, left: 16, display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', zIndex: 10, pointerEvents: 'none'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', padding: '12px 16px',
          borderRadius: 12, border: \`1px solid \${C.line}\`, boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', gap: 10, width: 220, pointerEvents: 'auto'
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
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: C.inkSoft, textAlign: 'center' }}>Click a node to focus.</div>
          )}
        </div>

        {onGenerate && (
          <button onClick={onGenerate} disabled={generating || !canGenerate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: '#fff', color: canGenerate ? C.teal900 : C.inkSoft,
              border: \`1px solid \${canGenerate ? C.teal900 : C.lineStrong}\`, borderRadius: 16,
              fontSize: 12.5, fontWeight: 600, cursor: generating || !canGenerate ? 'not-allowed' : 'pointer',
              opacity: generating ? .7 : 1, transition: 'all .15s', boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              pointerEvents: 'auto'
            }}>
            {generating ? <Loader size={13} className="spin" /> : <Network size={13} />}
            {generating ? 'Updating…' : 'Update Map'}
          </button>
        )}
      </div>

      <svg width={size.w} height={size.h} style={{ display: 'block' }}>
        {positions && edges.map(([a, b], i) => {
          const pa = positions[a], pb = positions[b]
          if (!pa || !pb) return null
          const dim = hovered && hovered !== a && hovered !== b
          return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
            stroke={dim ? C.line : C.lineStrong} strokeWidth={dim ? .8 : 1.8} opacity={dim ? .2 : .7} />
        })}
        {positions && nodes.map(n => {
          const p = positions[n.id]; if (!p) return null
          const r = 8 + (8 * (n.weight || 1)) / maxW
          const dim = hovered && hovered !== n.id
          const color = TYPE_COLOR[n.type] || C.teal800
          return (
            <g key={n.id} transform={\`translate(\${p.x},\${p.y})\`}
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} opacity={dim ? .2 : 1}
              onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}
              onClick={() => setCenterEntity(n.id)}>
              <circle r={r + 4} fill={color} fillOpacity={0} stroke={color} strokeWidth={1.5} opacity={hovered === n.id ? 1 : 0} style={{ transition: 'opacity 0.2s' }} />
              <circle r={r} fill={color} fillOpacity={.18} stroke={color} strokeWidth={1.5} />
              <circle r={2.5} fill={color} />
              <text textAnchor="middle" y={r + 15}
                style={{ 
                  fontSize: 11.5, fill: C.ink, fontWeight: 600, fontFamily: 'Inter,sans-serif', pointerEvents: 'none',
                  textShadow: '0 1px 3px rgba(255,255,255,1), 0 0 5px rgba(255,255,255,1), 0 0 8px rgba(255,255,255,1)'
                }}>
                {n.id.length > 20 ? n.id.slice(0, 20) + '…' : n.id}
              </text>
            </g>
          )
        })}
      </svg>`;

  code = code.substring(0, idxEStart) + newEntityGraph + code.substring(idxEEnd);
}

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed');
