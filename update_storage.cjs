const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Workspaces
code = code.replace(
  "  const [workspaces, setWorkspaces] = useState(SEED_WORKSPACES)",
  `  const [workspaces, setWorkspaces] = useState(() => {
    try {
      const saved = localStorage.getItem('newsroom_workspaces')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return SEED_WORKSPACES
  })`
);

// 2. Article Index
code = code.replace(
  "  const [articleIndex, setArticleIndex] = useState({})",
  `  const [articleIndex, setArticleIndex] = useState(() => {
    try {
      const saved = localStorage.getItem('newsroom_articleIndex')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return {}
  })`
);

// 3. Search history state & saving effects
const searchHistoryHook = `
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('newsroom_searchHistory')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return []
  })

  useEffect(() => {
    localStorage.setItem('newsroom_workspaces', JSON.stringify(workspaces))
  }, [workspaces])

  useEffect(() => {
    localStorage.setItem('newsroom_articleIndex', JSON.stringify(articleIndex))
  }, [articleIndex])

  useEffect(() => {
    localStorage.setItem('newsroom_searchHistory', JSON.stringify(searchHistory))
  }, [searchHistory])
`;

code = code.replace(
  "  const [query, setQuery] = useState('')",
  "  const [query, setQuery] = useState('')\n" + searchHistoryHook
);

// Update searchHistory on search
const searchFuncRegex = /setSearching\(true\); setSearchErr\(''\)/;
code = code.replace(searchFuncRegex, `setSearching(true); setSearchErr(''); setSearchHistory(prev => { const n = [query, ...prev.filter(q => q !== query)].slice(0, 20); return n; })`);

// Attach to Search Input as datalist
const searchInputRegex = /<input\s*value=\{query\}\s*onChange=\{e => setQuery\(e.target.value\)\}\s*onKeyDown=\{\(e\) => \{[\s\S]*?\}\}/;
const match = code.match(searchInputRegex);
if (match) {
  const newMatch = match[0].replace("<input", "<input list=\"search-history-list\"");
  code = code.replace(match[0], newMatch + `\n              <datalist id="search-history-list">\n                {searchHistory.map((h, i) => <option key={i} value={h} />)}\n              </datalist>`);
}

fs.writeFileSync('src/App.tsx', code);
