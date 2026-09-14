const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove from NgrokBar
const ngrokEndWithPdf = `      {viewingPdf && (
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

const ngrokEndClean = `    </div>
  )
}`;

code = code.replace(ngrokEndWithPdf, ngrokEndClean);

// Insert it properly at the end of the file, inside `App`
// We need to find the very last `  )\n}`
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

code = code.replace(/    <\/div>\s*\)\s*\}\s*$/, pdfViewer);

fs.writeFileSync('src/App.tsx', code);
