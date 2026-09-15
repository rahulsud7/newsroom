const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<div ref={bottomRef} \/>\s*<\/div>\s*\{\/\* Investigation Popup \*\/\}/g,
  `<div ref={bottomRef} />\n          </>\n        )}\n      </div>\n\n      {/* Investigation Popup */}`
);

fs.writeFileSync('src/App.tsx', code);
