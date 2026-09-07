const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add User to imports
code = code.replace('FileUp,', 'FileUp, User,');

// 2. Fix App sessionId
code = code.replace(
  `  const [api, setApi] = useState(null)\n  const sessionId = useRef('newsroom_' + Date.now())`,
  `  const [api, setApi] = useState(null)\n  const [sessionId] = useState(() => {\n    const saved = localStorage.getItem('newsroom_sessionId');\n    if (saved) return saved;\n    const newId = 'newsroom_' + Date.now();\n    localStorage.setItem('newsroom_sessionId', newId);\n    return newId;\n  })`
);

// 3. Fix App.tsx sessionId usage (since it's not a ref anymore)
code = code.replace(`sessionId={sessionId.current}`, `sessionId={sessionId}`);

// 4. Update ChatSidebar state & persistence
code = code.replace(
  `function ChatSidebar({ collapsed, onToggle, activeWorkspace, api, sessionId, onNewSources, onCreateWs }) {\n  const [messages, setMessages] = useState(SEED_MSGS)\n  const [draft, setDraft] = useState('')\n  const [loading, setLoading] = useState(false)\n  const [menuOpen, setMenuOpen] = useState(false)\n  const [dragOver, setDragOver] = useState(false)\n\n  const bottomRef = useRef()\n  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'auto' }) }, [messages])`,
  `function ChatSidebar({ collapsed, onToggle, activeWorkspace, api, sessionId, onNewSources, onCreateWs }) {\n  const [messages, setMessages] = useState(() => {\n    const saved = localStorage.getItem(\`chat_\${sessionId}\`);\n    if (saved) {\n      try { return JSON.parse(saved); } catch(e) {}\n    }\n    return SEED_MSGS;\n  })\n\n  useEffect(() => {\n    localStorage.setItem(\`chat_\${sessionId}\`, JSON.stringify(messages));\n  }, [messages, sessionId])\n\n  const [draft, setDraft] = useState('')\n  const [loading, setLoading] = useState(false)\n  const [menuOpen, setMenuOpen] = useState(false)\n  const [dragOver, setDragOver] = useState(false)\n\n  const bottomRef = useRef<HTMLDivElement>(null)\n  useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'auto' }) }, [messages])`
);

// 5. Update ChatSidebar UI and flex constraints
code = code.replace(
  `<aside style={{\n      width: 320, borderLeft: \`1px solid \${C.line}\`, background: C.creamDeep,\n      display: 'flex', flexDirection: 'column', height: '100%'\n    }}>`,
  `<aside style={{\n      width: 320, borderLeft: \`1px solid \${C.line}\`, background: C.creamDeep,\n      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden'\n    }}>`
);

// 6. Update ChatSidebar message UI
code = code.replace(
  `        {messages.map((m, i) => (\n          <div key={i} style={{\n            fontSize: 13, lineHeight: 1.5, padding: '10px 13px',\n            borderRadius: 10, maxWidth: '92%', whiteSpace: 'pre-wrap',\n            ...(m.role === 'user'\n              ? { background: C.teal800, color: '#fff', alignSelf: 'flex-end', borderBottomRightRadius: 3 }\n              : {\n                background: '#fff', border: \`1px solid \${m.error ? C.red : C.line}\`,\n                color: m.error ? C.red : C.ink, alignSelf: 'flex-start', borderBottomLeftRadius: 3\n              })\n          }}>\n            {m.text}\n          </div>\n        ))}`,
  `        {messages.map((m: any, i: number) => (\n          <div key={i} style={{\n            display: 'flex', gap: 8, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',\n            maxWidth: '92%', flexDirection: m.role === 'user' ? 'row-reverse' : 'row'\n          }}>\n            <div style={{\n              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,\n              background: m.role === 'user' ? C.teal900 : '#fff',\n              border: \`1px solid \${m.role === 'user' ? C.teal900 : C.line}\`,\n              display: 'flex', alignItems: 'center', justifyContent: 'center',\n              color: m.role === 'user' ? '#fff' : C.teal900, marginTop: 4\n            }}>\n              {m.role === 'user' ? <User size={12} strokeWidth={2.5} /> : <Bot size={12} strokeWidth={2.5} />}\n            </div>\n            <div style={{\n              fontSize: 13.5, lineHeight: 1.5, padding: '10px 14px',\n              borderRadius: 12, whiteSpace: 'pre-wrap',\n              boxShadow: m.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',\n              ...(m.role === 'user'\n                ? { background: C.teal800, color: '#fff', borderTopRightRadius: 4 }\n                : { background: '#fff', border: \`1px solid \${m.error ? C.red : C.line}\`, color: m.error ? C.red : C.ink, borderTopLeftRadius: 4 })\n            }}>\n              {m.text}\n            </div>\n          </div>\n        ))}`
);

// 7. Make the chat composer look better with a shadow & clean borders
code = code.replace(
  `      {/* Composer — also a drop zone for dragged articles */}\n      <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}\n        onDragLeave={() => setDragOver(false)} onDrop={handleDrop}\n        style={{\n          position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 6,\n          padding: 12, borderTop: \`2px solid \${dragOver ? C.tan : C.line}\`,\n          flexShrink: 0, transition: 'border-color .15s',\n          background: dragOver ? C.tanPale : 'transparent'\n        }}>`,
  `      {/* Composer — also a drop zone for dragged articles */}\n      <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}\n        onDragLeave={() => setDragOver(false)} onDrop={handleDrop}\n        style={{\n          position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 6,\n          padding: 16, borderTop: \`1px solid \${C.line}\`,\n          flexShrink: 0, transition: 'background .15s',\n          background: dragOver ? C.tanPale : '#fff',\n          boxShadow: '0 -4px 16px rgba(0,0,0,0.02)',\n          zIndex: 10\n        }}>`
);

// Composer buttons inside the composer layout
code = code.replace(
  `        <button onClick={() => setMenuOpen(v => !v)}\n          style={{\n            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,\n            background: 'transparent', border: \`1px solid \${C.line}\`,\n            display: 'flex', alignItems: 'center', justifyContent: 'center',\n            color: C.inkSoft, cursor: 'pointer'\n          }}>\n          <Plus size={16} />\n        </button>\n        <textarea\n          value={draft} onChange={e => setDraft(e.target.value)}\n          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}\n          placeholder="Ask about this archive..."\n          style={{\n            flex: 1, resize: 'none', background: '#fff', border: \`1px solid \${C.line}\`,\n            borderRadius: 16, padding: '8px 12px', fontSize: 13, minHeight: 34,\n            maxHeight: 120, outline: 'none', color: C.ink\n          }}\n        />`,
  `        <button onClick={() => setMenuOpen(v => !v)}\n          style={{\n            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,\n            background: '#F9F8F5', border: \`1px solid \${C.line}\`,\n            display: 'flex', alignItems: 'center', justifyContent: 'center',\n            color: C.inkSoft, cursor: 'pointer', transition: 'background .15s'\n          }}\n          onMouseEnter={e => e.currentTarget.style.background = C.line}\n          onMouseLeave={e => e.currentTarget.style.background = '#F9F8F5'}>\n          <Plus size={16} />\n        </button>\n        <textarea\n          value={draft} onChange={e => setDraft(e.target.value)}\n          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}\n          placeholder="Ask about this archive..."\n          style={{\n            flex: 1, resize: 'none', background: '#F9F8F5', border: 'none',\n            borderRadius: 18, padding: '10px 14px', fontSize: 13, minHeight: 38,\n            maxHeight: 120, outline: 'none', color: C.ink\n          }}\n        />`
)

fs.writeFileSync('src/App.tsx', code);
