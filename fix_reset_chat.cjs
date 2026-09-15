const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const headerOld = `      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 12px', flexShrink: 0
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 7, fontSize: 13,
          fontWeight: 600, color: C.teal900
        }}>
          <Bot size={16} strokeWidth={2} /> Archive Assistant
        </span>
        <button onClick={onToggle} style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'transparent', border: 'none', cursor: 'pointer', color: C.inkSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <PanelRightClose size={17} strokeWidth={2} />
        </button>
      </header>`;

const headerNew = `      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 12px', flexShrink: 0
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 7, fontSize: 13,
          fontWeight: 600, color: C.teal900
        }}>
          <Bot size={16} strokeWidth={2} /> Archive Assistant
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => { setMessages(SEED_MSGS); setInvestigationResult(null); setFollowUps([]); setDraft(''); }} title="Reset Chat" style={{
            background: 'transparent', border: 'none', cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500
          }}>
            Reset
          </button>
          <button onClick={onToggle} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <PanelRightClose size={17} strokeWidth={2} />
          </button>
        </div>
      </header>`;

code = code.replace(headerOld, headerNew);
fs.writeFileSync('src/App.tsx', code);
