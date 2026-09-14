const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove " (Decompose)"
code = code.replace("Suggest Claims to Check (Decompose)", "Suggest Claims to Check");

// 2. Fix 422 for Investigate by changing query to entity
// The previous fix used query.
code = code.replace(
  `investigate: (topic) => fetch(url('/investigate'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ query: topic }) }).then(j),`,
  `investigate: (topic) => fetch(url('/investigate'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ entity: topic }) }).then(j),`
);

// 3. Remove chat history from localStorage
const chatStateOld = `  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(\`chat_\${sessionId}\`);
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return SEED_MSGS;
  })

  useEffect(() => {
    localStorage.setItem(\`chat_\${sessionId}\`, JSON.stringify(messages));
  }, [messages, sessionId]);`;

const chatStateNew = `  const [messages, setMessages] = useState(SEED_MSGS);`;

code = code.replace(chatStateOld, chatStateNew);

// 4. Format chat data better
// In ChatSidebar, let's update the Markdown formatting. It already has some, let's check it.
// I can also clear the previous messages so the chat is fresh, or just leave it.

fs.writeFileSync('src/App.tsx', code);
