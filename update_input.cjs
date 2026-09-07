const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStart = `      {/* Composer — also a drop zone for dragged articles */}`;
const targetEnd = `    </aside>\n  )}`;

const idxStart = code.indexOf(targetStart);
const idxEnd = code.indexOf(targetEnd);

if (idxStart === -1 || idxEnd === -1) {
    console.log('Not found');
    process.exit(1);
}

const newComposer = `      {/* Composer — also a drop zone for dragged articles */}
      <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        style={{
          position: 'relative', display: 'flex', flexDirection: 'column',
          padding: '16px 16px 20px', borderTop: \`1px solid \${C.line}\`,
          flexShrink: 0, transition: 'background .15s',
          background: dragOver ? C.tanPale : '#fff',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.02)',
          zIndex: 10
        }}>
        {dragOver && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', pointerEvents: 'none', fontSize: 12.5, color: C.tanDeep,
            fontWeight: 600, gap: 6, background: 'rgba(241, 239, 230, 0.9)', zIndex: 5
          }}>
            <GripVertical size={14} /> Drop article here
          </div>
        )}
        
        {menuOpen && (
          <div style={{
            position: 'absolute', bottom: 76, left: 16, background: '#fff',
            border: \`1px solid \${C.line}\`, borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,61,66,.12)', padding: 6,
            display: 'flex', flexDirection: 'column', gap: 2, width: 170, zIndex: 10
          }}>
            <button onClick={() => { onCreateWs('New Workspace'); setMenuOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                padding: '10px 10px', borderRadius: 8, background: 'transparent', border: 'none',
                fontSize: 13, fontWeight: 500, color: C.ink, cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.tanPale}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <FolderPlus size={15} /> New workspace
            </button>
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'flex-end', background: '#F9F8F5',
          border: \`1px solid \${C.lineStrong}\`, borderRadius: 24,
          padding: '4px 6px', gap: 8, transition: 'border-color 0.2s',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}>
          {/* Plus Menu */}
          <button onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none',
              background: menuOpen ? C.tanPale : 'transparent', color: C.teal800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, marginBottom: 2,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => !menuOpen && (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
            onMouseLeave={e => !menuOpen && (e.currentTarget.style.background = 'transparent')}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>

          {/* Text Area */}
          <textarea 
            value={draft} onChange={e => setDraft(e.target.value)} 
            rows={1}
            placeholder="Ask about this workspace..."
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            style={{
              flex: 1, resize: 'none', border: 'none', background: 'transparent',
              padding: '10px 0px', fontSize: 13.5, outline: 'none',
              maxHeight: 120, lineHeight: 1.5, fontFamily: 'inherit',
              color: C.ink, alignSelf: 'center'
            }} 
          />

          {/* Send Button */}
          <button onClick={send} disabled={loading || !draft.trim()}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: loading || !draft.trim() ? C.lineStrong : C.teal800, 
              border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: loading || !draft.trim() ? 'not-allowed' : 'pointer', 
              flexShrink: 0, marginBottom: 2,
              transition: 'background 0.2s, transform 0.1s',
              transform: draft.trim() && !loading ? 'scale(1.05)' : 'scale(1)'
            }}>
            {loading ? <Loader size={15} className="spin" /> : <Send size={15} strokeWidth={2.5} style={{ marginLeft: -1, marginTop: 1 }} />}
          </button>
        </div>
        
        <div style={{ textAlign: 'center', fontSize: 11, color: C.inkSoft, marginTop: 8, opacity: 0.8 }}>
          Press Enter to search
        </div>
      </div>\n`;

code = code.substring(0, idxStart) + newComposer + code.substring(idxEnd);
fs.writeFileSync('src/App.tsx', code);
console.log('Replaced composer successfully.');
