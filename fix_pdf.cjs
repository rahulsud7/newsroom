const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update openPdf
const oldOpenPdf = `function openPdf(url) {
  if (!url || url === '#') return
  const base = CURRENT_API_BASE || 'https://3667-34-75-104-99.ngrok-free.app';
  const full = /^https?:\\/\\//i.test(url)
    ? url
    : \`\${base}\${url.startsWith('/') ? '' : '/'}\${url}\`
    
  // Create an anchor tag to ensure browser popup blockers don't block window.open in iframes
  const a = document.createElement('a');
  a.href = full;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}`;

const newOpenPdf = `let _setGlobalPdfUrl = null;
function openPdf(url) {
  if (!url || url === '#') return
  const base = CURRENT_API_BASE || 'https://3667-34-75-104-99.ngrok-free.app';
  const full = /^https?:\\/\\//i.test(url)
    ? url
    : \`\${base}\${url.startsWith('/') ? '' : '/'}\${url}\`;
    
  if (_setGlobalPdfUrl) {
    _setGlobalPdfUrl(full);
  } else {
    const a = document.createElement('a');
    a.href = full;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}`;

code = code.replace(oldOpenPdf, newOpenPdf);

// Inject PdfViewerModal component
const modalComp = `
function PdfViewerModal({ url, onClose }) {
  if (!url) return null;
  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
      background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column', padding: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={onClose} style={{
          background: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <X size={20} />
        </button>
      </div>
      <iframe src={url} style={{ flex: 1, width: '100%', border: 'none', borderRadius: 12, background: '#fff' }} />
    </div>,
    document.body
  );
}
`;

code = code.replace("// ─────────────────────────────────────────────────────────────────────────────\n// APP", modalComp + "\n// ─────────────────────────────────────────────────────────────────────────────\n// APP");

// Add state to App
code = code.replace(
  "export default function App() {",
  "export default function App() {\n  const [viewingPdf, setViewingPdf] = useState(null);\n  useEffect(() => { _setGlobalPdfUrl = setViewingPdf }, []);"
);

// Render PdfViewerModal inside App
const returnAppRegex = /return \(\n    <div className="app-container"/;
code = code.replace(returnAppRegex, `return (
    <div className="app-container">
      <PdfViewerModal url={viewingPdf} onClose={() => setViewingPdf(null)} />`);

fs.writeFileSync('src/App.tsx', code);
