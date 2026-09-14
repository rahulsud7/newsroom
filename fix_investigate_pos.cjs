const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove from SourceDrawer
const investigateBtnRegex = /\s*\{\/\* Big Red Investigate Button \*\/\}\s*<div style=\{\{ padding: '12px 16px', borderBottom: `1px solid \$\{C\.line\}`, background: C\.creamDeep \}\}>\s*<button onClick=\{handleInvestigate\}[\s\S]*?<\/button>\s*<\/div>/;

const match = code.match(investigateBtnRegex);
if (match) {
  code = code.replace(match[0], '');
  
  // Find ChatSidebar header to append to
  // It looks like:
  //      <header style={{
  //        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  //        padding: '16px 16px 12px', flexShrink: 0
  //      }}>
  //        ...
  //      </header>
  const chatHeaderRegex = /(<header style=\{\{\s*display: 'flex', alignItems: 'center', justifyContent: 'space-between',\s*padding: '16px 16px 12px', flexShrink: 0\s*\}\}>[\s\S]*?<\/header>)/;
  
  code = code.replace(chatHeaderRegex, `$1\n      {/* Big Red Investigate Button */}\n      <div style={{ padding: '0 16px 12px', borderBottom: \`1px solid \${C.line}\` }}>\n         <button onClick={handleInvestigate} disabled={investigating} style={{\n           width: '100%', background: '#D32F2F', color: '#fff', border: 'none', borderRadius: 8, padding: '10px',\n           fontSize: 13, fontWeight: 'bold', cursor: investigating ? 'not-allowed' : 'pointer',\n           display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,\n           boxShadow: '0 4px 12px rgba(211, 47, 47, 0.25)', transition: 'background 0.2s'\n         }}>\n           {investigating ? <Loader size={15} className="spin" /> : <Search size={15} />}\n           {investigating ? 'Investigating...' : 'Investigate Context'}\n         </button>\n      </div>`);
}

fs.writeFileSync('src/App.tsx', code);
