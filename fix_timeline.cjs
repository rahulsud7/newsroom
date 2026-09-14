const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Move useRef to the top
const oldTimeline = `function Timeline({ articles, onOpen, onGenerate, generating, canGenerate, genErr }) {
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

  const scrollRef = useRef<HTMLDivElement>(null)`;

const newTimeline = `function Timeline({ articles, onOpen, onGenerate, generating, canGenerate, genErr }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
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
  )`;

code = code.replace(oldTimeline, newTimeline);

fs.writeFileSync('src/App.tsx', code);
