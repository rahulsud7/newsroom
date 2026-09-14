const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSourceParams = `function SourceDrawer({ article, onClose }) {`;
const newSourceParams = `function SourceDrawer({ article, onClose, api }) {
  const [fcClaim, setFcClaim] = useState('');
  const [fcResult, setFcResult] = useState(null);
  const [fcLoading, setFcLoading] = useState(false);
  const [showFc, setShowFc] = useState(false);

  async function handleFactCheck() {
    if (!fcClaim.trim() || !api) return;
    setFcLoading(true);
    setFcResult(null);
    try {
      const res = await api.factcheck(fcClaim, article.fullText || article.excerpt);
      setFcResult(res.result || res.reply || 'Verified.');
    } catch (err) {
      setFcResult(\`Error: \${err.message}\`);
    } finally {
      setFcLoading(false);
    }
  }
`;

code = code.replace(oldSourceParams, newSourceParams);

// Add the Fact Check UI in the drawer body
const oldSourceEnd = `          {article.entities?.length > 0 && (
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
          borderTop: \`1px solid \${C.line}\`, padding: '12px 20px',
          display: 'flex', gap: 10, flexShrink: 0
        }}>
          {article.pdfUrl ? (`;

const newSourceEnd = `          {article.entities?.length > 0 && (
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

        </div>
        {/* Footer actions */}
        <div style={{
          borderTop: \`1px solid \${C.line}\`, padding: '12px 20px',
          display: 'flex', gap: 10, flexShrink: 0
        }}>
          <button onClick={() => setShowFc(!showFc)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0',
            background: showFc ? '#E8F5E9' : '#4CAF50', color: showFc ? '#2E7D32' : '#fff', border: showFc ? '1px solid #4CAF50' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <CheckCircle size={14} /> Fact Check
          </button>
          
          {article.pdfUrl ? (`;

code = code.replace(oldSourceEnd, newSourceEnd);

fs.writeFileSync('src/App.tsx', code);
