const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const searchBarOld = `          <div style={{
            margin: '0 24px 24px', flexShrink: 0,
            background: '#fff', borderRadius: 14, border: \`1px solid \${C.line}\`,
            boxShadow: '0 8px 24px rgba(0,61,66,.16)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', zIndex: 10
          }}>`;

const searchBarNew = `          <div style={{
            position: 'relative',
            margin: '0 24px 24px', flexShrink: 0,
            background: '#fff', borderRadius: 14, border: \`1px solid \${C.line}\`,
            boxShadow: '0 8px 24px rgba(0,61,66,.16)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', zIndex: 20
          }}>`;

code = code.replace(searchBarOld, searchBarNew);
fs.writeFileSync('src/App.tsx', code);
