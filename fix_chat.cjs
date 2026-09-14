const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Clear chat history on send
code = code.replace(
  `setMessages(m => [...m, { role: 'user', text }])`,
  `setMessages([{ role: 'user', text }])` // Overwrite messages with just the current query
);

fs.writeFileSync('src/App.tsx', code);
