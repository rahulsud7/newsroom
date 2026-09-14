const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `<button type="submit" disabled={searching || !query.trim()}`,
  `<button id="main-search-submit" type="submit" disabled={searching || !query.trim()}`
);

code = code.replace(
  `document.querySelector('button[type="submit"]')?.click()`,
  `document.getElementById('main-search-submit')?.click()`
);

fs.writeFileSync('src/App.tsx', code);
