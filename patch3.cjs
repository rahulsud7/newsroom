const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const stateTarget = `  const searchInputRef = useRef<HTMLInputElement>(null);

  const [viewingPdf, setViewingPdf] = useState(null);`;

const stateReplacement = `  const searchInputRef = useRef<HTMLInputElement>(null);

  const [openReview, setOpenReview] = useState(null);

  const [viewingPdf, setViewingPdf] = useState(null);`;
code = code.replace(stateTarget, stateReplacement);


const renderTarget = `            ) : activeTab === 'timeline' ? (
              <Timeline articles={currentTimeline} onOpen={setOpenArticle}
                onGenerate={generateWorkspaceIntel} generating={generatingIntel}
                canGenerate={canGenerateIntel} genErr={intelErr} />
            ) : (
              <div style={{ height: '100%', minHeight: 560 }}>
                <EntityGraph graph={currentGraph}
                  onSelectEntity={name => { setQuery(name); setActiveTab('results') }}
                  onGenerate={generateWorkspaceIntel} generating={generatingIntel}
                  canGenerate={canGenerateIntel} genErr={intelErr} />
              </div>
            )}
          </div>`;

const renderReplacement = `            ) : activeTab === 'timeline' ? (
              <Timeline articles={currentTimeline} onOpen={setOpenArticle}
                onGenerate={generateWorkspaceIntel} generating={generatingIntel}
                canGenerate={canGenerateIntel} genErr={intelErr} />
            ) : activeTab === 'review' ? (
              <div style={{ height: '100%', minHeight: 560, overflowY: 'auto' }}>
                <ReviewQueue api={api} onOpenReview={setOpenReview} />
              </div>
            ) : (
              <div style={{ height: '100%', minHeight: 560 }}>
                <EntityGraph graph={currentGraph}
                  onSelectEntity={name => { setQuery(name); setActiveTab('results') }}
                  onGenerate={generateWorkspaceIntel} generating={generatingIntel}
                  canGenerate={canGenerateIntel} genErr={intelErr} />
              </div>
            )}
          </div>`;
code = code.replace(renderTarget, renderReplacement);

const drawerTarget = `      <SourceDrawer article={openArticle} onClose={() => setOpenArticle(null)}
        workspaces={workspaces} onAddToWorkspace={addArticleToWs}
        inWorkspace={openArticle ? wsMap[openArticle.id]?.has(activeWsId) : false}
        onCreateAndAdd={createAndAdd}
        api={api}
      />`;
const drawerReplacement = `      <SourceDrawer article={openArticle} onClose={() => setOpenArticle(null)}
        workspaces={workspaces} onAddToWorkspace={addArticleToWs}
        inWorkspace={openArticle ? wsMap[openArticle.id]?.has(activeWsId) : false}
        onCreateAndAdd={createAndAdd}
        api={api}
      />
      
      {/* HITL Review Drawer */}
      <ReviewDrawer reviewId={openReview?.id} api={api} onClose={() => setOpenReview(null)} />`;
code = code.replace(drawerTarget, drawerReplacement);

fs.writeFileSync('src/App.tsx', code);
