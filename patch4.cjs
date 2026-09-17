const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            <div style={{
              fontSize: 13.5, lineHeight: 1.5, padding: '10px 14px',
              borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
              borderTopLeftRadius: m.role === 'user' ? 12 : 4,
              borderTopRightRadius: m.role === 'user' ? 4 : 12,
              minWidth: 0, overflowX: 'auto',
              whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
              boxShadow: m.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              ...(m.role === 'user'
                ? { background: C.teal800, color: '#fff' }
                : { background: '#fff', border: \`1px solid \${m.error ? C.red : C.line}\`, color: m.error ? C.red : C.ink })
            }}>
              {m.role === 'user' ? m.text : (
                <div className="markdown-body" style={{ color: 'inherit' }}>
                  <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{m.text}</Markdown>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>`;

const replacement = `            <div style={{
              fontSize: 13.5, lineHeight: 1.5, padding: '10px 14px',
              borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
              borderTopLeftRadius: m.role === 'user' ? 12 : 4,
              borderTopRightRadius: m.role === 'user' ? 4 : 12,
              minWidth: 0, overflowX: 'auto',
              whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
              boxShadow: m.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              ...(m.role === 'user'
                ? { background: C.teal800, color: '#fff' }
                : { background: '#fff', border: \`1px solid \${m.error ? C.red : C.line}\`, color: m.error ? C.red : C.ink })
            }}>
              {m.role === 'user' ? m.text : (
                <div className="markdown-body" style={{ color: 'inherit' }}>
                  <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{m.text}</Markdown>
                </div>
              )}
              {/* Action Buttons for Assistant Messages */}
              {m.role === 'assistant' && !m.error && (
                <AssistantActions api={api} text={m.text} />
              )}
            </div>
          </div>
        ))}
      </div>`;

code = code.replace(target, replacement);

const assistantActions = `
function AssistantActions({ api, text }) {
  const [score, setScore] = useState(null);
  const [scoring, setScoring] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleScore = async () => {
    if (!api) return;
    setScoring(true);
    try {
      const res = await api.scoreClaim(text);
      setScore(res);
    } catch(e) {
      alert("Failed to score claim: " + e.message);
    } finally {
      setScoring(false);
    }
  }

  const handleSendToReview = async () => {
    if (!api) return;
    setSending(true);
    try {
      await api.submitReview('claim', text, null, 5, {}, 'reporter_chat');
      setSent(true);
    } catch(e) {
      alert("Failed to send to review: " + e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ marginTop: 12, borderTop: \`1px solid \${C.line}\`, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={handleScore} disabled={scoring} style={{
          background: 'transparent', border: \`1px solid \${C.teal800}\`, color: C.teal800, padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: scoring ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4
        }}>
          {scoring ? <Loader size={12} className="spin" /> : <ListChecks size={12} />} Fact-check this
        </button>
        <button onClick={handleSendToReview} disabled={sending || sent} style={{
          background: sent ? '#E7F3E8' : 'transparent', border: \`1px solid \${sent ? '#2E7D32' : C.teal800}\`, color: sent ? '#2E7D32' : C.teal800, padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: sending || sent ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4
        }}>
          {sending ? <Loader size={12} className="spin" /> : sent ? <Check size={12} /> : <ShieldAlert size={12} />} {sent ? 'Sent to Review' : 'Send to review'}
        </button>
      </div>
      {score && (
        <div style={{ background: C.cream, borderRadius: 6, padding: '8px 12px', fontSize: 11.5, border: \`1px solid \${C.lineStrong}\` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Confidence: <strong>{score.confidence_score}/10</strong></span>
            <span>Corroboration: <strong>{score.corroboration_score}/10</strong></span>
            <span>Readiness: <strong>{score.publish_readiness_score}/10</strong></span>
          </div>
        </div>
      )}
    </div>
  )
}
`;

code = code.replace("function ChatSidebar({", assistantActions + "\nfunction ChatSidebar({");

fs.writeFileSync('src/App.tsx', code);
