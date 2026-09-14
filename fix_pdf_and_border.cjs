const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix border radius
const borderOld = `              borderRadius: 12, minWidth: 0, overflowX: 'auto',
              whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
              boxShadow: m.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              ...(m.role === 'user'
                ? { background: C.teal800, color: '#fff', borderTopRightRadius: 4 }
                : { background: '#fff', border: \`1px solid \${m.error ? C.red : C.line}\`, color: m.error ? C.red : C.ink, borderTopLeftRadius: 4 })
            }}>`;
const borderNew = `              borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
              borderTopLeftRadius: m.role === 'user' ? 12 : 4,
              borderTopRightRadius: m.role === 'user' ? 4 : 12,
              minWidth: 0, overflowX: 'auto',
              whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
              boxShadow: m.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              ...(m.role === 'user'
                ? { background: C.teal800, color: '#fff' }
                : { background: '#fff', border: \`1px solid \${m.error ? C.red : C.line}\`, color: m.error ? C.red : C.ink })
            }}>`;
code = code.replace(borderOld, borderNew);

// 2. Add PDF viewer
// Search for `{/* Big Red Investigate Button */}` as a marker? No, PDF viewer should be inside App, likely near the end.
const appEnd = `    </div>
  )
}`;
const pdfViewer = `
      {viewingPdf && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ background: '#333', padding: '10px 16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setViewingPdf(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <X size={20} /> Close PDF
            </button>
          </div>
          <iframe src={viewingPdf} style={{ width: '100%', flex: 1, border: 'none' }} />
        </div>
      )}
    </div>
  )
}`;
code = code.replace(appEnd, pdfViewer);

fs.writeFileSync('src/App.tsx', code);
