const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Chat Bubble Overflow Fix
const oldBubble = `            <div style={{
              fontSize: 13.5, lineHeight: 1.5, padding: '10px 14px',
              borderRadius: 12, 
              whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
              boxShadow: m.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              ...(m.role === 'user'
                ? { background: C.teal800, color: '#fff', borderTopRightRadius: 4 }
                : { background: '#fff', border: \`1px solid \${m.error ? C.red : C.line}\`, color: m.error ? C.red : C.ink, borderTopLeftRadius: 4 })
            }}>`;
const newBubble = `            <div style={{
              fontSize: 13.5, lineHeight: 1.5, padding: '10px 14px',
              borderRadius: 12, minWidth: 0, overflowX: 'auto',
              whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
              boxShadow: m.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              ...(m.role === 'user'
                ? { background: C.teal800, color: '#fff', borderTopRightRadius: 4 }
                : { background: '#fff', border: \`1px solid \${m.error ? C.red : C.line}\`, color: m.error ? C.red : C.ink, borderTopLeftRadius: 4 })
            }}>`;
code = code.replace(oldBubble, newBubble);

// Timeline inner hidden fix
const oldTimelineInner = `      <div ref={scrollRef} className="scroll-thin" style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '0 32px', scrollBehavior: 'smooth' }}>`;
const newTimelineInner = `      <div ref={scrollRef} className="scroll-thin" style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '0 32px', scrollBehavior: 'smooth' }}>`;
code = code.replace(oldTimelineInner, newTimelineInner);

// Timeline minHeight fix
const oldTimelineRoot = `  return (
    <div style={{ height: 'calc(100vh - 210px)', display: 'flex', flexDirection: 'column', background: '#F9F8F5' }}>`;
const newTimelineRoot = `  return (
    <div style={{ height: 'calc(100vh - 210px)', minHeight: 560, display: 'flex', flexDirection: 'column', background: '#F9F8F5' }}>`;
code = code.replace(oldTimelineRoot, newTimelineRoot);

// EntityGraph minHeight fix
const oldEntityRoot = `            ) : (
              <div style={{ height: 'calc(100vh - 210px)', minHeight: 400 }}>
                <EntityGraph graph={currentGraph}`;
const newEntityRoot = `            ) : (
              <div style={{ height: 'calc(100vh - 210px)', minHeight: 560 }}>
                <EntityGraph graph={currentGraph}`;
code = code.replace(oldEntityRoot, newEntityRoot);

fs.writeFileSync('src/App.tsx', code);
