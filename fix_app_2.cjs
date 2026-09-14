const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const \[messages, setMessages\] = useState\(\(\) => \{[\s\S]*?\}\)[\s\S]*?useEffect\(\(\) => \{[\s\S]*?\}, \[messages, sessionId\]\)/;
code = code.replace(regex, `const [messages, setMessages] = useState(SEED_MSGS)`);

fs.writeFileSync('src/App.tsx', code);
