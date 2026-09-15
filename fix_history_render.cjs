const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

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
        display: 'flex', flexDirection: 'column', gap: 10
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
        display: 'flex', flexDirection: 'column', gap: showHistory ? 8 : 10
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
                  <button onClick={(e) => { e.stopPropagation(); setHistory(history.filter(hx => hx.id !== h.id)); }} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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
