const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix 'send' crash due to MouseEvent being passed to overrideText
code = code.replace(
  `  async function send(overrideText) {
    const text = overrideText || draft.trim()`,
  `  async function send(overrideText) {
    const isStr = typeof overrideText === 'string'
    const text = (isStr ? overrideText : draft).trim()`
);

// 2. Fix 'followUps' crash if API returns a string instead of an array
code = code.replace(
  `if (res.questions) setFollowUps(res.questions);`,
  `if (Array.isArray(res.questions)) { setFollowUps(res.questions); } else if (typeof res.questions === 'string') { setFollowUps([res.questions]); }`
);

// 3. Fix potential markdown crashes if investigation or factcheck results are objects
code = code.replace(
  `setInvestigationResult(res.result || res.reply || JSON.stringify(res));`,
  `const out = res.result || res.reply; setInvestigationResult(typeof out === 'string' ? out : JSON.stringify(res));`
);

code = code.replace(
  `setFcResult(res.result || res.reply || 'Verified.');`,
  `const out = res.result || res.reply || 'Verified.'; setFcResult(typeof out === 'string' ? out : JSON.stringify(res));`
);

fs.writeFileSync('src/App.tsx', code);
