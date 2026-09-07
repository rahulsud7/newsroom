const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `  function handleChatSources(rawSources: any[]) {
    const articles = rawSources.map(chunkToArticle)
    indexArticles(articles)
    setWsResults(r => {
      const prev = r[activeWsId] || []
      const seen = new Set(prev.map((a: any) => a.chunk_id))
      return { ...r, [activeWsId]: [...articles.filter((a: any) => !seen.has(a.chunk_id)), ...prev] }
    })
    setActiveTab('results')
  }`,
  `  function handleChatSources(rawSources: any[]) {
    const articles = rawSources.map(chunkToArticle)
    indexArticles(articles)
    setWsResults(r => {
      const prev = r[activeWsId] || []
      const seen = new Set(prev.map((a: any) => a.chunk_id))
      return { ...r, [activeWsId]: [...articles.filter((a: any) => !seen.has(a.chunk_id)), ...prev] }
    })
    setWsScopedResults(r => {
      const prev = r[activeWsId] || []
      const seen = new Set(prev.map((a: any) => a.chunk_id))
      return { ...r, [activeWsId]: [...articles.filter((a: any) => !seen.has(a.chunk_id)), ...prev] }
    })
    setActiveTab('results')
  }`
);

fs.writeFileSync('src/App.tsx', code);
