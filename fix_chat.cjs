const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldChatBubble = `            <div style={{
              fontSize: 13.5, lineHeight: 1.5, padding: '10px 14px',
              borderRadius: 12, whiteSpace: 'pre-wrap',
              boxShadow: m.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              ...(m.role === 'user'
                ? { background: C.teal800, color: '#fff', borderTopRightRadius: 4 }
                : { background: '#fff', border: \`1px solid \${m.error ? C.red : C.line}\`, color: m.error ? C.red : C.ink, borderTopLeftRadius: 4 })
            }}>
              {m.text}
            </div>`;

const newChatBubble = `            <div style={{
              fontSize: 13.5, lineHeight: 1.5, padding: '10px 14px',
              borderRadius: 12, 
              whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
              boxShadow: m.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              ...(m.role === 'user'
                ? { background: C.teal800, color: '#fff', borderTopRightRadius: 4 }
                : { background: '#fff', border: \`1px solid \${m.error ? C.red : C.line}\`, color: m.error ? C.red : C.ink, borderTopLeftRadius: 4 })
            }}>
              {m.role === 'user' ? m.text : (
                <div className="markdown-body" style={{ color: 'inherit' }}>
                  <Markdown>{m.text}</Markdown>
                </div>
              )}
            </div>`;

code = code.replace(oldChatBubble, newChatBubble);

// Add global markdown styles to index.html or create a style block in App.tsx
// It's cleaner to inject it in App.tsx right before the return statement of App or ChatSidebar
const styleInjection = `
  return (
    <aside style={{`;
    
const replacementStyle = `  return (
    <aside style={{
      width: 320, borderLeft: \`1px solid \${C.line}\`, background: C.creamDeep,
      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden'
    }}>
      <style>{\`
        .markdown-body { font-size: 13.5px; line-height: 1.5; color: inherit; }
        .markdown-body p { margin-top: 0; margin-bottom: 8px; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body strong { font-weight: 600; color: #003033; }
        .markdown-body ul, .markdown-body ol { margin: 8px 0 8px 20px; padding: 0; }
        .markdown-body li { margin-bottom: 4px; }
        .markdown-body a { color: #B19470; text-decoration: none; font-weight: 500; }
        .markdown-body a:hover { text-decoration: underline; }
      \`}</style>
      <header`;

// Be precise with the replacement
const preciseOldStyle = `  return (
    <aside style={{
      width: 320, borderLeft: \`1px solid \${C.line}\`, background: C.creamDeep,
      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden'
    }}>
      <header`;

code = code.replace(preciseOldStyle, replacementStyle);

fs.writeFileSync('src/App.tsx', code);
