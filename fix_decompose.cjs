const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldDecomp = `const res = await api.decompose("Extract main claims to verify from: " + article.title);`;
const newDecomp = `const res = await api.decompose("Extract main claims to verify from the following article context.\\nTitle: " + article.title + "\\nContext: " + (article.excerpt || ''));`;

code = code.replace(oldDecomp, newDecomp);
fs.writeFileSync('src/App.tsx', code);
