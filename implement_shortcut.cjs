const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add useRef to App
const appRefCode = `export default function App() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
`;
code = code.replace("export default function App() {", appRefCode);

// 2. Add ref to input
// First let's find the input. It's the one with list="search-history-list"
// Oh wait, `list="search-history-list"` is inside `<input list="search-history-list" value={query} onChange={e => {`
const inputCode = `<input list="search-history-list" value={query} onChange={e => {`;
code = code.replace(inputCode, `<input ref={searchInputRef} list="search-history-list" value={query} onChange={e => {`);

// 3. Add shortcut hint to NgrokBar
// Look for `{connected === true && !checking &&
//        <span style={{ ...mono, fontSize: 10.5, color: '#2E7D32' }}>Archive live</span>}
//    </div>
//  )`

const ngrokBarEnd = `{connected === true && !checking &&
        <span style={{ ...mono, fontSize: 10.5, color: '#2E7D32' }}>Archive live</span>}
    </div>`;

const ngrokBarNewEnd = `{connected === true && !checking &&
        <span style={{ ...mono, fontSize: 10.5, color: '#2E7D32' }}>Archive live</span>}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 11.5, color: C.inkSoft, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: 4, ...mono, fontSize: 10.5, color: C.ink }}>⌘K</span> 
          Focus search
        </span>
      </div>
    </div>`;

code = code.replace(ngrokBarEnd, ngrokBarNewEnd);

fs.writeFileSync('src/App.tsx', code);
