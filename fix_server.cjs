const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /const \[apiUrl, setApiUrl\] = useState\('https:\/\/[^']+'\)/,
  "const [apiUrl, setApiUrl] = useState('https://d63e-35-243-236-229.ngrok-free.app')"
);
fs.writeFileSync('src/App.tsx', code);
