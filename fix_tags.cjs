const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        <div ref={bottomRef} />
      </div>

      {/* Investigation Popup */}`;

const replacement = `        <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Investigation Popup */}`;

code = code.replace(target, replacement);

const inputTarget = `<div style={{ padding: '0 16px 20px' }}>
        <form onSubmit={e => { e.preventDefault(); send() }} style={{ position: 'relative' }}>`;

const inputReplacement = `<div style={{ padding: '0 16px 20px', opacity: showHistory ? 0.3 : 1, pointerEvents: showHistory ? 'none' : 'auto' }}>
        <form onSubmit={e => { e.preventDefault(); send() }} style={{ position: 'relative' }}>`;
code = code.replace(inputTarget, inputReplacement);

fs.writeFileSync('src/App.tsx', code);
