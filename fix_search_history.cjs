const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The block to extract and remove from FileManager
const block = `  const [searchHistory, setSearchHistory] = useState(() => {
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

code = code.replace(block, ''); // Remove from FileManager

// Add to App component. Let's find App's `setSearchErr` line or `const [query, setQuery] = useState('')` inside App.
const appQueryRegex = /(const \[query, setQuery\] = useState\(''\)\n\s*const \[searching, setSearching\] = useState\(false\))/;
code = code.replace(appQueryRegex, "$1\n" + block);

fs.writeFileSync('src/App.tsx', code);
