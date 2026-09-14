const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix literal "\n" strings in the UI that were accidentally injected
code = code.replace(/\\n\s*\{\/\* Footer actions \*\/\}/g, '');
code = code.replace(/\\n\s*\{article\.pdfUrl \? \(/g, '');
code = code.replace(/\\n\s*\{\/\* Composer/g, '');
code = code.replace(/\\n\s*<div ref=\{bottomRef\}/g, '');

// 2. Fix 422 error on /investigate by changing { topic } to { query: topic } (common pattern for these endpoints)
code = code.replace(
  `investigate: (topic) => fetch(url('/investigate'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ topic }) }).then(j),`,
  `investigate: (topic) => fetch(url('/investigate'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ query: topic }) }).then(j),`
);

// 3. Move Investigate Button to Top of ChatSidebar
// First, extract it:
const investigateBtnRegex = /\{\/\* Big Red Investigate Button \*\/\}\s*<div style=\{\{ padding: '0 16px 8px', background: C\.creamDeep \}\}>\s*<button onClick=\{handleInvestigate\}[^>]*>[\s\S]*?<\/button>\s*<\/div>/;
const investigateBtnMatch = code.match(investigateBtnRegex);
if (investigateBtnMatch) {
  code = code.replace(investigateBtnMatch[0], ''); // Remove from bottom
  
  // Insert it after the header
  const headerEnd = `      </header>`;
  code = code.replace(headerEnd, headerEnd + '\n      ' + investigateBtnMatch[0].replace(`padding: '0 16px 8px'`, `padding: '12px 16px', borderBottom: \`1px solid \${C.line}\``));
}

// 4. Fix Decompose not showing (Handle multiple possible response formats)
code = code.replace(
  `if (Array.isArray(res.questions)) { setFollowUps(res.questions); } else if (typeof res.questions === 'string') { setFollowUps([res.questions]); }`,
  `const qs = res.questions || res.queries || res.follow_ups;
      if (Array.isArray(qs)) { setFollowUps(qs); } 
      else if (typeof qs === 'string') { setFollowUps(qs.split('\\n').map(s=>s.trim()).filter(Boolean)); }
      else if (res.sub_questions) { setFollowUps(res.sub_questions); }`
);

// 5. Improve Fact Check UI & Add Decompose
const fcStateOld = `  const [fcLoading, setFcLoading] = useState(false);
  const [showFc, setShowFc] = useState(false);`;

const fcStateNew = `  const [fcLoading, setFcLoading] = useState(false);
  const [showFc, setShowFc] = useState(false);
  const [fcSuggestions, setFcSuggestions] = useState([]);
  const [fcSuggestLoading, setFcSuggestLoading] = useState(false);

  async function handleSuggestClaims() {
    if (!api || !api.decompose) return;
    setFcSuggestLoading(true);
    try {
      const res = await api.decompose("Extract main claims to verify from: " + article.title);
      const qs = res.questions || res.queries || res.follow_ups || res.sub_questions;
      if (Array.isArray(qs)) setFcSuggestions(qs);
      else if (typeof qs === 'string') setFcSuggestions(qs.split('\\n').filter(Boolean));
    } catch(e) {}
    finally { setFcSuggestLoading(false); }
  }`;

code = code.replace(fcStateOld, fcStateNew);

const fcUIOld = `              <textarea 
                value={fcClaim} onChange={e => setFcClaim(e.target.value)}
                placeholder="Enter a claim to verify..."
                style={{ width: '100%', height: 60, padding: 10, borderRadius: 8, border: '1px solid #A5D6A7', fontSize: 13, resize: 'none', marginBottom: 10, outlineColor: '#4CAF50' }}
              />`;

const fcUINew = `              <textarea 
                value={fcClaim} onChange={e => setFcClaim(e.target.value)}
                placeholder="Enter a claim to verify..."
                style={{ width: '100%', height: 60, padding: 10, borderRadius: 8, border: '1px solid #A5D6A7', fontSize: 13, resize: 'none', marginBottom: 10, outlineColor: '#4CAF50' }}
              />
              
              <div style={{ marginBottom: 12 }}>
                <button onClick={handleSuggestClaims} disabled={fcSuggestLoading} style={{
                  background: 'none', border: 'none', color: '#2E7D32', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0
                }}>
                  {fcSuggestLoading ? <Loader size={12} className="spin"/> : <Network size={12} />} Suggest Claims to Check (Decompose)
                </button>
                {fcSuggestions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {fcSuggestions.map((s, i) => (
                      <button key={i} onClick={() => setFcClaim(s)} style={{
                        background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '4px 8px', borderRadius: 12, fontSize: 11, cursor: 'pointer', textAlign: 'left'
                      }}>{s}</button>
                    ))}
                  </div>
                )}
              </div>`;

code = code.replace(fcUIOld, fcUINew);

// Format Investigation Popup Better
code = code.replace(
  `          <div style={{
            background: '#fff', borderRadius: 16, width: 600, maxWidth: '90%', maxHeight: '80%',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
          }}>`,
  `          <div style={{
            background: '#fff', borderRadius: 16, width: 720, maxWidth: '90%', height: '80%', maxHeight: 800,
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-out'
          }}>`
);

fs.writeFileSync('src/App.tsx', code);
