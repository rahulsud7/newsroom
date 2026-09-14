const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update the sources formatting inside send()
const oldSources = `      if (res.sources?.length) {
        const cites = res.sources.slice(0, 4).map((s, i) => {
          const dm = s.doc_meta || {}
          return \`- **[\${i + 1}]** \${dm.title || s.filename || 'Document'} (p. \${s.page_number ?? '?'})\`
        }).join('\\n')
        reply += \`\\n\\n**Sources:**\\n\${cites}\`
      }`;

const newSources = `      if (res.sources?.length) {
        const cites = res.sources.slice(0, 4).map((s, i) => {
          const dm = s.doc_meta || {}
          return \`> **[\${i + 1}]** \${dm.title || s.filename || 'Document'} (p. \${s.page_number ?? '?'})\`
        }).join('\\n>\\n')
        reply += \`\\n\\n---\\n**Sources:**\\n\${cites}\`
      }`;

code = code.replace(oldSources, newSources);

// Also add blockquote styling to Markdown
const styleOld = `.markdown-body a:hover { text-decoration: underline; }`;
const styleNew = `.markdown-body a:hover { text-decoration: underline; }
        .markdown-body blockquote { margin: 12px 0; padding-left: 12px; border-left: 3px solid #C9C3B2; color: #5C7C7A; font-style: italic; }`;
code = code.replace(styleOld, styleNew);

fs.writeFileSync('src/App.tsx', code);
