const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. ADD FACT CHECK BUTTON TO SOURCEDRAWER
const fcUI = `
          {/* Fact Check Section */}
          {showFc && (
            <div style={{ marginTop: 32, padding: 20, background: '#F5FDF7', border: '1px solid #4CAF50', borderRadius: 12 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#2E7D32', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={16} /> Fact-Check Claim against this Document
              </h3>
              <textarea 
                value={fcClaim} onChange={e => setFcClaim(e.target.value)}
                placeholder="Enter a claim to verify..."
                style={{ width: '100%', height: 60, padding: 10, borderRadius: 8, border: '1px solid #A5D6A7', fontSize: 13, resize: 'none', marginBottom: 10, outlineColor: '#4CAF50' }}
              />
              <button onClick={handleFactCheck} disabled={fcLoading || !fcClaim.trim()} style={{
                background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 'bold', cursor: fcLoading || !fcClaim.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, opacity: fcLoading || !fcClaim.trim() ? 0.6 : 1
              }}>
                {fcLoading ? <Loader size={14} className="spin" /> : <Search size={14} />} Verify Claim
              </button>
              
              {fcResult && (
                <div style={{ marginTop: 16, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #C8E6C9', fontSize: 13.5, lineHeight: 1.5 }}>
                  <div className="markdown-body"><Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{fcResult}</Markdown></div>
                </div>
              )}
            </div>
          )}
`;
const fcBtn = `
          <button onClick={() => setShowFc(!showFc)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0',
            background: showFc ? '#E8F5E9' : '#4CAF50', color: showFc ? '#2E7D32' : '#fff', border: showFc ? '1px solid #4CAF50' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <CheckCircle size={14} /> Fact Check
          </button>
`;

code = code.replace(
  "        {/* Footer actions */}",
  fcUI + "\\n        {/* Footer actions */}"
);

code = code.replace(
  "          {article.pdfUrl ? (",
  fcBtn + "\\n          {article.pdfUrl ? ("
);


// 2. ADD INVESTIGATE AND FOLLOWUPS TO CHATSIDEBAR
const followUpUI = `
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
`;

const investigateUI = `
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
`;

code = code.replace(
  "        <div ref={bottomRef} />",
  followUpUI + "\\n        <div ref={bottomRef} />"
);

code = code.replace(
  "      {/* Composer — also a drop zone for dragged articles */}",
  investigateUI + "\\n      {/* Composer — also a drop zone for dragged articles */}"
);

fs.writeFileSync('src/App.tsx', code);
