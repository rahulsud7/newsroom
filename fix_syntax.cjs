const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The missing `{article.pdfUrl ? (`
code = code.replace(
  `          <button onClick={() => setShowFc(!showFc)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0',
            background: showFc ? '#E8F5E9' : '#4CAF50', color: showFc ? '#2E7D32' : '#fff', border: showFc ? '1px solid #4CAF50' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <CheckCircle size={14} /> Fact Check
          </button>
            <button onClick={() => openPdf(article.pdfUrl)}`,
  `          <button onClick={() => setShowFc(!showFc)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0',
            background: showFc ? '#E8F5E9' : '#4CAF50', color: showFc ? '#2E7D32' : '#fff', border: showFc ? '1px solid #4CAF50' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <CheckCircle size={14} /> Fact Check
          </button>
          {article.pdfUrl ? (
            <button onClick={() => openPdf(article.pdfUrl)}`
);

// The missing `{/* Footer actions */}` 
code = code.replace(
  `        <div style={{
          borderTop: \`1px solid \${C.line}\`, padding: '12px 20px',
          display: 'flex', gap: 10, flexShrink: 0
        }}>
          <button onClick={() => setShowFc(!showFc)}`,
  `        {/* Footer actions */}
        <div style={{
          borderTop: \`1px solid \${C.line}\`, padding: '12px 20px',
          display: 'flex', gap: 10, flexShrink: 0
        }}>
          <button onClick={() => setShowFc(!showFc)}`
);

// Second error: 1695:2: ERROR: The character ">" is not valid inside a JSX element
const err2 = /<div ref=\{bottomRef\}\s*\/>\s*\/>/;
code = code.replace(err2, '<div ref={bottomRef} />');

// Third error: 1728:45: ERROR: The character "}" is not valid inside a JSX element
const err3 = /— also a drop zone for dragged articles \*\/\}/;
code = code.replace(err3, '{/* Composer — also a drop zone for dragged articles */}');

fs.writeFileSync('src/App.tsx', code);
