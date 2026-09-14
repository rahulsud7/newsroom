const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Modify investigate to add k=5
const invOld = `investigate: (topic) => fetch(url('/investigate'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ entity: topic }) }).then(j),`;
const invNew = `investigate: (topic) => fetch(url('/investigate'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ entity: topic, k: 5 }) }).then(j),`;
code = code.replace(invOld, invNew);

// Modify factcheck to add k=3 and remove context which isn't in the OpenAPI spec
const fcOld = `factcheck: (claim, context) => fetch(url('/factcheck'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ claim, context }) }).then(j),`;
const fcNew = `factcheck: (claim, context) => fetch(url('/factcheck'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ claim, k: 3 }) }).then(j),`;
code = code.replace(fcOld, fcNew);

// Modify search/hybrid_search to add k=4 if not already set? Wait, search already uses k: 8 default. 8 is fine.

fs.writeFileSync('src/App.tsx', code);
