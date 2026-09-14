const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const res = await api.chat(text, sessionId)`,
  `const res = await api.chat(text, Date.now().toString())`
);

fs.writeFileSync('src/App.tsx', code);
