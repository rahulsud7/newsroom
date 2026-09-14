const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `  const [activeWsId, setActiveWsId] = useState(SEED_WORKSPACES[0].id)`,
  `  const [activeWsId, setActiveWsId] = useState(() => {
    try {
      const saved = localStorage.getItem('newsroom_activeWsId')
      if (saved) return saved
    } catch(e) {}
    return SEED_WORKSPACES[0].id
  })

  useEffect(() => {
    localStorage.setItem('newsroom_activeWsId', activeWsId)
  }, [activeWsId])`
);

fs.writeFileSync('src/App.tsx', code);
