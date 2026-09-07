const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix padding on the main content container
code = code.replace(
  `<div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: '20px 32px 160px' }}>`,
  `<div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: activeTab === 'results' ? '20px 32px 160px' : 0 }}>`
);

// 2. Increase Timeline max width and remove double-scrolling
code = code.replace(
  `  return (
    <div className="scroll-thin" style={{ height: '100%', overflowY: 'auto', padding: '32px 40px', background: '#F9F8F5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 12.5, color: C.inkSoft, ...mono }}>
          {sorted.length} entries · newest first
        </div>`,
  `  return (
    <div style={{ minHeight: 'calc(100vh - 230px)', padding: '40px 64px 160px', background: '#F9F8F5' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 12.5, color: C.inkSoft, ...mono }}>
          {sorted.length} entries · newest first
        </div>`
);

code = code.replace(
  `      <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>`,
  `      <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto' }}>`
);

// Timeline text size increase for readability
code = code.replace(
  `              <div style={{
                ...serif, fontSize: 15.5, fontWeight: 600, color: C.teal900,
                lineHeight: 1.4
              }}>`,
  `              <div style={{
                ...serif, fontSize: 18, fontWeight: 600, color: C.teal900,
                lineHeight: 1.4
              }}>`
);

code = code.replace(
  `                <div style={{
                  fontSize: 13, color: C.ink, lineHeight: 1.6,
                  display: '-webkit-box', WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 2,
                  opacity: 0.9
                }}>`,
  `                <div style={{
                  fontSize: 14.5, color: C.ink, lineHeight: 1.6,
                  display: '-webkit-box', WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 6,
                  opacity: 0.9
                }}>`
);

// Also remove the extra div wrapper around EntityGraph that restricts height to calc(100vh - 260px) since the parent is now padding:0 and flex:1, but the parent doesn't have height constraint? The parent flex: 1 overflow: auto works well if the child takes full height.
// Let's change the Entity Graph container:
code = code.replace(
  `            ) : (
              <div style={{ height: 'calc(100vh - 260px)', minHeight: 400 }}>
                <EntityGraph graph={currentGraph}`,
  `            ) : (
              <div style={{ height: 'calc(100vh - 210px)', minHeight: 400 }}>
                <EntityGraph graph={currentGraph}`
);


fs.writeFileSync('src/App.tsx', code);
console.log('Fixed');
