const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add remark-breaks to imports
code = code.replace(
  `import remarkGfm from 'remark-gfm'`,
  `import remarkGfm from 'remark-gfm'\nimport remarkBreaks from 'remark-breaks'`
);

// 2. Update the Markdown component to use remarkBreaks
code = code.replace(
  `<Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>`,
  `<Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{m.text}</Markdown>`
);

// 3. Fix the "Sources" block to use proper Markdown bullets for human-readable feel
const oldSourcesGen = `      if (res.sources?.length) {
        const cites = res.sources.slice(0, 4).map((s, i) => {
          const dm = s.doc_meta || {}
          return \`[\${i + 1}] \${dm.title || s.filename || 'Document'} · p.\${s.page_number ?? '?'}\`
        }).join('\\n')
        reply += \`\\n\\nSources:\\n\${cites}\`
      }`;

const newSourcesGen = `      if (res.sources?.length) {
        const cites = res.sources.slice(0, 4).map((s, i) => {
          const dm = s.doc_meta || {}
          return \`- **[\${i + 1}]** \${dm.title || s.filename || 'Document'} (p. \${s.page_number ?? '?'})\`
        }).join('\\n')
        reply += \`\\n\\n**Sources:**\\n\${cites}\`
      }`;

code = code.replace(oldSourcesGen, newSourcesGen);

// 4. Change Search Bar from absolute positioning to flex layout to fix the scrolling and overlapping
const oldSearchBarStart = `          {/* Floating search bar */}
          <div style={{
            position: 'absolute', bottom: 24, left: 24, right: 24,
            background: '#fff', borderRadius: 14, border: \`1px solid \${C.line}\`,
            boxShadow: '0 8px 24px rgba(0,61,66,.16)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>`;

const newSearchBarStart = `          {/* Fixed search bar at bottom (no overlap) */}
          <div style={{
            margin: '0 24px 24px', flexShrink: 0,
            background: '#fff', borderRadius: 14, border: \`1px solid \${C.line}\`,
            boxShadow: '0 8px 24px rgba(0,61,66,.16)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', zIndex: 10
          }}>`;

code = code.replace(oldSearchBarStart, newSearchBarStart);

// 5. Adjust padding of Content div (remove the 160px bottom padding now that search isn't floating)
const oldContentDiv = `<div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: activeTab === 'results' ? '20px 32px 160px' : '0 0 160px' }}>`;
const newContentDiv = `<div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: activeTab === 'results' ? '20px 32px 24px' : '0' }}>`;

code = code.replace(oldContentDiv, newContentDiv);

// 6. Fix Timeline height so it adapts properly
const oldTimelineHeight = `    <div style={{ height: 'calc(100vh - 210px)', minHeight: 560, display: 'flex', flexDirection: 'column', background: '#F9F8F5' }}>`;
const newTimelineHeight = `    <div style={{ height: '100%', minHeight: 560, display: 'flex', flexDirection: 'column', background: '#F9F8F5' }}>`;
code = code.replace(oldTimelineHeight, newTimelineHeight);

// 7. Fix EntityGraph height
const oldEntityGraphHeight = `              <div style={{ height: 'calc(100vh - 210px)', minHeight: 560 }}>`;
const newEntityGraphHeight = `              <div style={{ height: '100%', minHeight: 560 }}>`;
code = code.replace(oldEntityGraphHeight, newEntityGraphHeight);

fs.writeFileSync('src/App.tsx', code);
