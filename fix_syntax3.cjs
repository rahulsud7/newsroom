const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<button onClick=\{\(\) => setShowFc\(!showFc\)\} style=\{\{[\s\S]*?<CheckCircle size=\{14\} \/> Fact Check\s*<\/button>\s*<button onClick=\{\(\) => openPdf\(article\.pdfUrl\)\}/;
code = code.replace(regex, `<button onClick={() => setShowFc(!showFc)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0',
            background: showFc ? '#E8F5E9' : '#4CAF50', color: showFc ? '#2E7D32' : '#fff', border: showFc ? '1px solid #4CAF50' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <CheckCircle size={14} /> Fact Check
          </button>
          {article.pdfUrl ? (
            <button onClick={() => openPdf(article.pdfUrl)}`);

fs.writeFileSync('src/App.tsx', code);
