const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldState = `function ChatSidebar({ collapsed, onToggle, activeWorkspace, api, sessionId, onNewSources, onCreateWs }) {
  const [messages, setMessages] = useState(SEED_MSGS)

  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)`;

const newState = `function ChatSidebar({ collapsed, onToggle, activeWorkspace, api, sessionId, onNewSources, onCreateWs }) {
  const [messages, setMessages] = useState(SEED_MSGS)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat_history') || '[]') } catch(e) { return [] }
  })
  useEffect(() => { localStorage.setItem('chat_history', JSON.stringify(history)) }, [history])

  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)`;
code = code.replace(oldState, newState);

const oldHeaderBtns = `        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => { setMessages(SEED_MSGS); setInvestigationResult(null); setFollowUps([]); setDraft(''); }} title="Reset Chat" style={{
            background: 'transparent', border: 'none', cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500
          }}>
            Reset
          </button>
          <button onClick={onToggle} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <PanelRightClose size={17} strokeWidth={2} />
          </button>
        </div>`;

const newHeaderBtns = `        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowHistory(!showHistory)} title="View Chat History" style={{
            background: showHistory ? C.teal100 : 'transparent', border: 'none', cursor: 'pointer', color: showHistory ? C.teal900 : C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, padding: '4px 6px', borderRadius: 4
          }}>
            <History size={14} style={{ marginRight: 4 }} /> History
          </button>
          <button onClick={() => { 
            if (messages.length > 1) {
              setHistory(prev => [{ id: Date.now().toString(), date: Date.now(), messages }, ...prev]);
            }
            setMessages(SEED_MSGS); setInvestigationResult(null); setFollowUps([]); setDraft(''); setShowHistory(false); 
          }} title="Reset Chat" style={{
            background: 'transparent', border: 'none', cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, padding: '4px 6px', borderRadius: 4
          }}>
            <Plus size={14} style={{ marginRight: 4 }} /> New
          </button>
          <button onClick={onToggle} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <PanelRightClose size={17} strokeWidth={2} />
          </button>
        </div>`;
code = code.replace(oldHeaderBtns, newHeaderBtns);

const oldContent = `      {activeWorkspace && (
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
        display: 'flex', flexDirection: 'column', gap: 16
      }}>`;

const newContent = `      {activeWorkspace && !showHistory && (
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
        display: 'flex', flexDirection: 'column', gap: showHistory ? 8 : 16
      }}>
        {showHistory ? (
          history.length === 0 ? (
            <div style={{ fontSize: 13, color: C.inkSoft, textAlign: 'center', marginTop: 20 }}>No chat history yet.</div>
          ) : (
            history.map(h => (
              <div key={h.id} onClick={() => { setMessages(h.messages); setShowHistory(false); }} style={{
                padding: '12px', background: '#fff', border: \`1px solid \${C.line}\`, borderRadius: 8, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.inkSoft, ...mono }}>
                    <MessageSquare size={12} /> {new Date(h.date).toLocaleDateString()}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setHistory(history.filter(hx => hx.id !== h.id)); }} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ fontSize: 13, color: C.ink, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {h.messages.filter(m => m.role === 'user')[0]?.text || 'Empty Chat'}
                </div>
              </div>
            ))
          )
        ) : (
          <>`;

code = code.replace(oldContent, newContent);

// we need to close the `) : ( <>` block. Let's find where to close it.
const oldFooter = `          <div ref={bottomRef} />
      </div>

      <div style={{ padding: '0 16px 20px' }}>`;

const newFooter = `          <div ref={bottomRef} />
          </>
        )}
      </div>

      <div style={{ padding: '0 16px 20px', opacity: showHistory ? 0.3 : 1, pointerEvents: showHistory ? 'none' : 'auto' }}>`;
code = code.replace(oldFooter, newFooter);

fs.writeFileSync('src/App.tsx', code);
