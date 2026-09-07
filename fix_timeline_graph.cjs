const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// --- Fix Entity Graph scattered look ---
// We need to tweak the d3-style force layout parameters in EntityGraph
const oldForce = `        const f = 2800 / (d * d)\n        vel[a].x += dx / d * f; vel[a].y += dy / d * f\n        vel[b].x -= dx / d * f; vel[b].y -= dy / d * f\n      }\n      // springs\n      edges.forEach(([a, b]: [string, string]) => {\n        if (!pos[a] || !pos[b]) return\n        const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y\n        const d = Math.max(Math.sqrt(dx * dx + dy * dy), .01)\n        const f = (d - 140) * .018\n        const fx = dx / d * f, fy = dy / d * f\n        vel[a].x += fx; vel[a].y += fy; vel[b].x -= fx; vel[b].y -= fy\n      })\n      // center pull + integrate\n      nodes.forEach(({ id }: any) => {\n        vel[id].x += (w / 2 - pos[id].x) * .002; vel[id].y += (h / 2 - pos[id].y) * .002\n        vel[id].x *= .82; vel[id].y *= .82\n        pos[id].x = Math.min(w - 70, Math.max(70, pos[id].x + vel[id].x))\n        pos[id].y = Math.min(h - 70, Math.max(70, pos[id].y + vel[id].y))`;

const newForce = `        const f = 3500 / (d * d) // increase repulsion slightly
        vel[a].x += dx / d * f; vel[a].y += dy / d * f
        vel[b].x -= dx / d * f; vel[b].y -= dy / d * f
      }
      // springs
      edges.forEach(([a, b]: [string, string]) => {
        if (!pos[a] || !pos[b]) return
        const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y
        const d = Math.max(Math.sqrt(dx * dx + dy * dy), .01)
        const f = (d - 90) * .025 // shorter springs, stronger pull
        const fx = dx / d * f, fy = dy / d * f
        vel[a].x += fx; vel[a].y += fy; vel[b].x -= fx; vel[b].y -= fy
      })
      // center pull + integrate
      nodes.forEach(({ id }: any) => {
        vel[id].x += (w / 2 - pos[id].x) * .005; vel[id].y += (h / 2 - pos[id].y) * .005 // stronger center gravity
        vel[id].x *= .78; vel[id].y *= .78 // more friction so they settle faster
        pos[id].x = Math.min(w - 70, Math.max(70, pos[id].x + vel[id].x))
        pos[id].y = Math.min(h - 70, Math.max(70, pos[id].y + vel[id].y))`;

code = code.replace(oldForce, newForce);

// --- Fix Timeline styling ---
// Increase space between items and make the button lines look less broken.
const oldTimeline = `      <div style={{ position: 'relative', minWidth: 600, height: 260 }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%', height: 2,
          background: C.line, transform: 'translateY(-50%)'
        }} />
        {sorted.map((a, i) => {
          const pct = ((new Date(a.date).getTime() - first) / span) * 100
          const up = i % 2 === 0
          const active = hoveredId === a.id
          return (
            <div key={a.id} style={{
              position: 'absolute', left: \`\${pct}%\`, top: '50%',
              transform: 'translateX(-50%)'
            }}
              onMouseEnter={() => setHoveredId(a.id)} onMouseLeave={() => setHoveredId(null)}>
              <div style={{
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                width: 1, background: active ? C.tan : C.lineStrong,
                height: 50, ...(up ? { bottom: 8 } : { top: 8 })
              }} />
              <div style={{
                width: 10, height: 10, borderRadius: '50%', border: \`2px solid \${active ? C.tan : C.lineStrong}\`,
                background: active ? C.tan : '#fff', position: 'relative', zIndex: 2,
                transform: 'translateY(-50%)', transition: 'all .15s'
              }} />
              <button onClick={() => { if (a.pdfUrl) openPdf(a.pdfUrl); else onOpen(a) }}
                style={{
                  position: 'absolute', left: '50%',
                  ...(up ? { bottom: 62, transform: 'translateX(-50%)' } : { top: 18, transform: 'translateX(-50%)' }),
                  background: '#fff', border: \`1px solid \${active ? C.tan : C.line}\`,
                  borderRadius: 8, padding: '8px 11px', cursor: 'pointer',
                  boxShadow: active ? '0 4px 12px rgba(0,61,66,.12)' : 'none',
                  width: 160, textAlign: 'center', transition: 'all .15s'
                }}>`;

const newTimeline = `      <div style={{ position: 'relative', minWidth: Math.max(600, sorted.length * 150), height: 320, padding: '0 80px' }}>
        <div style={{
          position: 'absolute', left: 40, right: 40, top: '50%', height: 2,
          background: C.line, transform: 'translateY(-50%)'
        }} />
        {sorted.map((a, i) => {
          // Add some padding to percentages to avoid clustering exactly at edges
          const pct = span === 0 ? 50 : 5 + (((new Date(a.date).getTime() - first) / span) * 90)
          const up = i % 2 === 0
          const active = hoveredId === a.id
          return (
            <div key={a.id} style={{
              position: 'absolute', left: \`\${pct}%\`, top: '50%',
              transform: 'translateX(-50%)', zIndex: active ? 10 : 1
            }}
              onMouseEnter={() => setHoveredId(a.id)} onMouseLeave={() => setHoveredId(null)}>
              <div style={{
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                width: 2, background: active ? C.tan : C.lineStrong,
                height: 70, ...(up ? { bottom: 0 } : { top: 0 }),
                transition: 'background .15s'
              }} />
              <div style={{
                width: 12, height: 12, borderRadius: '50%', border: \`2.5px solid \${active ? C.tan : C.teal800}\`,
                background: '#fff', position: 'absolute', left: '50%',
                top: '0', transform: 'translate(-50%, -50%)', zIndex: 2,
                transition: 'all .15s'
              }} />
              <button onClick={() => { if (a.pdfUrl) openPdf(a.pdfUrl); else onOpen(a) }}
                style={{
                  position: 'absolute', left: '50%',
                  ...(up ? { bottom: 70, transform: 'translateX(-50%)' } : { top: 70, transform: 'translateX(-50%)' }),
                  background: '#fff', border: \`1px solid \${active ? C.tan : C.line}\`,
                  borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                  boxShadow: active ? '0 8px 24px rgba(0,61,66,.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                  width: 180, textAlign: 'center', transition: 'all .15s'
                }}>`;

code = code.replace(oldTimeline, newTimeline);

// PDF iframe fix: The AI Studio iframe context blocks `window.open` (or new tabs without direct user clicks inside the same frame bounds in some browsers).
// Instead of modifying the iframe policy from the outside, we should render an explicit <a> tag with target="_blank" or modify `openPdf` to use an anchor trigger.
// Wait, the error is likely the relative URL generation. Let's see if the PDF URL is correct.
const oldPdf = `function openPdf(url) {
  if (!url || url === '#') return
  // Backend paths like "/documents/{doc_id}/pdf" are relative — resolving
  // them against the frontend's own origin (not the ngrok backend) is why
  // every "open PDF" action was silently failing.
  const full = /^https?:\\/\\//i.test(url)
    ? url
    : \`\${CURRENT_API_BASE}\${url.startsWith('/') ? '' : '/'}\${url}\`
  window.open(full, '_blank', 'noopener,noreferrer')
}`;

const newPdf = `function openPdf(url) {
  if (!url || url === '#') return
  const base = CURRENT_API_BASE || 'https://0cf5-136-108-84-252.ngrok-free.app';
  const full = /^https?:\\/\\//i.test(url)
    ? url
    : \`\${base}\${url.startsWith('/') ? '' : '/'}\${url}\`
    
  // Create an anchor tag to ensure browser popup blockers don't block window.open in iframes
  const a = document.createElement('a');
  a.href = full;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}`;

code = code.replace(oldPdf, newPdf);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed graphs, timeline, and pdf viewer.');
