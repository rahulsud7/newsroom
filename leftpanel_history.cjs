const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update LeftPanel signature
code = code.replace(
  `function LeftPanel({
  workspaces, activeWsId, onSelectWs, onCreateWs,
  onOpenFileManager, backendDocs, api, onIngestDone,
  // drag-drop into workspace
  onDropArticleToWs,
}) {`,
  `function LeftPanel({
  workspaces, activeWsId, onSelectWs, onCreateWs,
  onOpenFileManager, backendDocs, api, onIngestDone,
  onDropArticleToWs, searchHistory = [], onHistoryClick
}) {`
);

// 2. Add history section to LeftPanel, between Workspaces and Archive
const historySection = `
      {/* ── SEARCH HISTORY section ── */}
      {searchHistory.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          borderBottom: \`1px solid \${C.line}\`, maxHeight: '25%', minHeight: 80, overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px 8px', flexShrink: 0
          }}>
            <span style={s.eyebrow}>Search History</span>
          </div>
          <div className="scroll-thin" style={{ overflowY: 'auto', flex: 1, padding: '0 8px 10px' }}>
            {searchHistory.map((h, i) => (
              <button key={i} onClick={() => onHistoryClick(h)}
                className="fm-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left',
                  background: 'transparent', border: 'none', borderRadius: 6, padding: '6px 8px',
                  cursor: 'pointer', color: C.inkSoft, fontSize: 12, transition: 'all .1s'
                }}>
                <Search size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h}</span>
              </button>
            ))}
          </div>
        </div>
      )}
`;

code = code.replace(
  `      {/* ── ARCHIVE section — independently scrollable ── */}`,
  historySection + `\n      {/* ── ARCHIVE section — independently scrollable ── */}`
);

// 3. Update LeftPanel instantiation
code = code.replace(
  `<LeftPanel workspaces={workspaces} activeWsId={activeWsId}
          onSelectWs={setActiveWsId} onCreateWs={createWorkspace}
          onOpenFileManager={() => setFileManagerOpen(true)}
          backendDocs={backendDocs} api={api} onIngestDone={handleIngestDone}
          onDropArticleToWs={handleDropArticleToWs} />`,
  `<LeftPanel workspaces={workspaces} activeWsId={activeWsId}
          onSelectWs={setActiveWsId} onCreateWs={createWorkspace}
          onOpenFileManager={() => setFileManagerOpen(true)}
          backendDocs={backendDocs} api={api} onIngestDone={handleIngestDone}
          onDropArticleToWs={handleDropArticleToWs} 
          searchHistory={searchHistory} 
          onHistoryClick={(q) => { setQuery(q); setTimeout(() => document.querySelector('button[type="submit"]')?.click(), 50); }} />`
);

fs.writeFileSync('src/App.tsx', code);
