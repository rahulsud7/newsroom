const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace fact checking reasoning
const oldFcResult = `const out = res.result || res.reply || 'Verified.'; setFcResult(typeof out === 'string' ? out : JSON.stringify(res));`;
const newFcResult = `
      if (res.status && res.reasoning) {
        setFcResult(res.status + '\\n\\n' + res.reasoning);
      } else {
        const out = res.result || res.reply || res.status || 'Verified.'; 
        setFcResult(typeof out === 'string' ? out : JSON.stringify(res));
      }
`;
code = code.replace(oldFcResult, newFcResult);

// Check if fact check takes too long. If they said "takes too long", maybe I should set `max_rounds` if the backend accepts it. Wait, the curl did use 3 rounds.
// I will just add the reasoning first.
fs.writeFileSync('src/App.tsx', code);
