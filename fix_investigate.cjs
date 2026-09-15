const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const stateOld = `  const [investigating, setInvestigating] = useState(false);
  const [investigationResult, setInvestigationResult] = useState(null);`;

const stateNew = `  const [investigating, setInvestigating] = useState(false);
  const [investigationResult, setInvestigationResult] = useState(null);
  const [investigateTopic, setInvestigateTopic] = useState('');`;

code = code.replace(stateOld, stateNew);

const handlerOld = `  async function handleInvestigate() {
    if (!api || !api.investigate) return;
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const topic = lastUserMsg ? lastUserMsg.text : 'recent topics';
    setInvestigating(true);`;

const handlerNew = `  async function handleInvestigate() {
    if (!api || !api.investigate) return;
    const topic = investigateTopic.trim() || messages.filter(m => m.role === 'user').pop()?.text || 'recent topics';
    setInvestigating(true);`;

code = code.replace(handlerOld, handlerNew);

const buttonOld = `      {/* Big Red Investigate Button */}
      <div style={{ padding: '0 16px 12px', borderBottom: \`1px solid \${C.line}\` }}>
         <button onClick={handleInvestigate} disabled={investigating} style={{
           width: '100%', background: '#D32F2F', color: '#fff', border: 'none', borderRadius: 8, padding: '10px',
           fontSize: 13, fontWeight: 'bold', cursor: investigating ? 'not-allowed' : 'pointer',
           display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
           boxShadow: '0 4px 12px rgba(211, 47, 47, 0.25)', transition: 'background 0.2s'
         }}>
           {investigating ? <Loader size={15} className="spin" /> : <Search size={15} />}
           {investigating ? 'Investigating...' : 'Investigate Context'}
         </button>
      </div>`;

const buttonNew = `      {/* Deep Investigation Section */}
      <div style={{ padding: '0 16px 12px', borderBottom: \`1px solid \${C.line}\`, display: 'flex', flexDirection: 'column', gap: 8 }}>
         <input 
           type="text" 
           placeholder="Entity to investigate... (e.g. Hurricane)"
           value={investigateTopic}
           onChange={e => setInvestigateTopic(e.target.value)}
           style={{
             width: '100%', padding: '8px 12px', borderRadius: 6, border: \`1px solid \${C.line}\`,
             fontSize: 12.5, outline: 'none', color: C.ink
           }}
         />
         <button onClick={handleInvestigate} disabled={investigating || !investigateTopic.trim()} style={{
           width: '100%', background: '#D32F2F', color: '#fff', border: 'none', borderRadius: 6, padding: '8px',
           fontSize: 13, fontWeight: 'bold', cursor: investigating || !investigateTopic.trim() ? 'not-allowed' : 'pointer',
           display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: investigating || !investigateTopic.trim() ? 0.7 : 1,
           boxShadow: '0 4px 12px rgba(211, 47, 47, 0.25)', transition: 'all 0.2s'
         }}>
           {investigating ? <Loader size={15} className="spin" /> : <Search size={15} />}
           {investigating ? 'Investigating...' : 'Deep Investigate Entity'}
         </button>
      </div>`;

code = code.replace(buttonOld, buttonNew);
fs.writeFileSync('src/App.tsx', code);
