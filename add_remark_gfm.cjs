const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update imports
const importMatch = `import Markdown from 'react-markdown'\nimport {\n  Search,`;
const importReplace = `import Markdown from 'react-markdown'\nimport remarkGfm from 'remark-gfm'\nimport {\n  Search,`;
code = code.replace(importMatch, importReplace);

// Update Markdown usage
const markdownMatch = `<Markdown>{m.text}</Markdown>`;
const markdownReplace = `<Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>`;
code = code.replace(markdownMatch, markdownReplace);

// Update style block for tables
const styleMatch = `.markdown-body a:hover { text-decoration: underline; }`;
const styleReplace = `.markdown-body a:hover { text-decoration: underline; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12.5px; }
        .markdown-body th, .markdown-body td { border: 1px solid #D4CCC0; padding: 6px 10px; text-align: left; }
        .markdown-body th { background: rgba(0,0,0,0.03); font-weight: 600; color: #003033; }`;
code = code.replace(styleMatch, styleReplace);

fs.writeFileSync('src/App.tsx', code);
