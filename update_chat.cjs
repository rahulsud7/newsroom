const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Pass `api` to SourceDrawer
code = code.replace(
  "<SourceDrawer article={openArticle} onClose={() => setOpenArticle(null)} />",
  "<SourceDrawer article={openArticle} onClose={() => setOpenArticle(null)} api={api} />"
);

// 2. ChatSidebar decompose + investigate logic
const oldChatSend = `  async function send() {
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
          return \`- **[\${i + 1}]** \${dm.title || s.filename || 'Document'} (p. \${s.page_number ?? '?'})\`
        }).join('\\n')
        reply += \`\\n\\n**Sources:**\\n\${cites}\`
      }
      setMessages(m => [...m, { role: 'assistant', text: reply }])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: \`⚠ \${err.message}\`, error: true }])
    } finally { setLoading(false) }
  }`;

const newChatSend = `
  const [followUps, setFollowUps] = useState([]);
  const [decomposing, setDecomposing] = useState(false);
  const [investigating, setInvestigating] = useState(false);
  const [investigationResult, setInvestigationResult] = useState(null);

  async function getFollowUps(topic) {
    if (!api || !api.decompose) return;
    setDecomposing(true);
    try {
      const res = await api.decompose(topic);
      if (res.questions) setFollowUps(res.questions);
    } catch(e) { console.error(e); }
    finally { setDecomposing(false); }
  }

  async function handleInvestigate() {
    if (!api || !api.investigate) return;
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const topic = lastUserMsg ? lastUserMsg.text : 'recent topics';
    setInvestigating(true);
    try {
      const res = await api.investigate(topic);
      setInvestigationResult(res.result || res.reply || JSON.stringify(res));
    } catch (err) {
      setInvestigationResult(\`Investigation failed: \${err.message}\`);
    } finally {
      setInvestigating(false);
    }
  }

  async function send(overrideText) {
    const text = overrideText || draft.trim()
    if (!text || loading) return
    setDraft('')
    setFollowUps([])
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
          return \`- **[\${i + 1}]** \${dm.title || s.filename || 'Document'} (p. \${s.page_number ?? '?'})\`
        }).join('\\n')
        reply += \`\\n\\n**Sources:**\\n\${cites}\`
      }
      setMessages(m => [...m, { role: 'assistant', text: reply }])
      getFollowUps(text) // Trigger decompose on the user's question
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: \`⚠ \${err.message}\`, error: true }])
    } finally { setLoading(false) }
  }`;

code = code.replace(oldChatSend, newChatSend);

// 3. Add Investigation Popup + Big Red Button + Follow Ups to Chat UI
const oldChatUIEnd = `          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {/* Composer — also a drop zone for dragged articles */}`;

const newChatUIEnd = `          </div>
        )}
        {followUps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Suggested Follow-ups</span>
            {followUps.map((q, i) => (
              <button key={i} onClick={() => send(q)} style={{
                textAlign: 'left', background: '#fff', border: \`1px solid \${C.line}\`, borderRadius: 8,
                padding: '8px 12px', fontSize: 12.5, color: C.teal900, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}>
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {/* Investigation Popup */}
      {investigationResult && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: 600, maxWidth: '90%', maxHeight: '80%',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '16px 24px', borderBottom: \`1px solid \${C.line}\`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#D32F2F', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> Investigation Results
              </h2>
              <button onClick={() => setInvestigationResult(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div className="scroll-thin" style={{ padding: 24, overflowY: 'auto', flex: 1, fontSize: 14, lineHeight: 1.6 }}>
               <div className="markdown-body">
                  <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{investigationResult}</Markdown>
                </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Big Red Investigate Button */}
      <div style={{ padding: '0 16px 8px', background: C.creamDeep }}>
         <button onClick={handleInvestigate} disabled={investigating} style={{
           width: '100%', background: '#D32F2F', color: '#fff', border: 'none', borderRadius: 8, padding: '10px',
           fontSize: 13, fontWeight: 'bold', cursor: investigating ? 'not-allowed' : 'pointer',
           display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
           boxShadow: '0 4px 12px rgba(211, 47, 47, 0.25)', transition: 'background 0.2s'
         }}>
           {investigating ? <Loader size={15} className="spin" /> : <Search size={15} />}
           {investigating ? 'Investigating...' : 'Investigate Context'}
         </button>
      </div>

      {/* Composer — also a drop zone for dragged articles */}`;

code = code.replace(oldChatUIEnd, newChatUIEnd);

fs.writeFileSync('src/App.tsx', code);
