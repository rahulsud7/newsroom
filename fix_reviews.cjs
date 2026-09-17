const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix chat thread refresh on follow-up
code = code.replace(
  /setMessages\(\[\{ role: 'user', text \}\]\)/,
  "setMessages(m => [...m, { role: 'user', text }])"
);

// 2. Fix review rendering mapping
// rev.id -> rev.review_id
code = code.replace(/rev\.id/g, "rev.review_id");
// h.id -> h.id (Wait, what about history ids? It's fine for now)
// rev.item_type -> rev.type
code = code.replace(/rev\.item_type/g, "rev.type");
// rev.claim -> rev.payload?.claim
code = code.replace(/rev\.claim/g, "rev.payload?.claim");
// rev.topic -> rev.payload?.topic
code = code.replace(/rev\.topic/g, "rev.payload?.topic");

fs.writeFileSync('src/App.tsx', code);
