const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I'll append the Review components just before `export default function App()`
const reviewComponents = `
// ─────────────────────────────────────────────────────────────────────────────
// HITL REVIEW QUEUE
// ─────────────────────────────────────────────────────────────────────────────
function ReviewQueue({ api, onOpenReview }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  
  // New manual submit state
  const [submitting, setSubmitting] = useState(false);
  const [newItemType, setNewItemType] = useState('claim');
  const [newTopic, setNewTopic] = useState('');
  const [newClaim, setNewClaim] = useState('');

  const fetchReviews = useCallback(async () => {
    if (!api || !api.listReviews) return;
    setLoading(true);
    try {
      const res = await api.listReviews(filter || undefined);
      setReviews(res.items || []);
    } catch (e) {
      console.error("Failed to fetch reviews", e);
    } finally {
      setLoading(false);
    }
  }, [api, filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleDirectSubmit(e) {
    e.preventDefault();
    if (!api) return;
    setSubmitting(true);
    try {
      await api.submitReview(
        newItemType,
        newItemType === 'claim' ? newClaim : null,
        newItemType === 'story' ? newTopic : null,
        5, {}, "editor_manual"
      );
      setNewTopic('');
      setNewClaim('');
      fetchReviews();
    } catch(err) {
      alert("Failed to submit: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '0 32px 40px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {/* Direct Submit Form */}
      <div style={{ background: '#fff', border: \`1px solid \${C.line}\`, borderRadius: 12, padding: 24, marginBottom: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <h3 style={{ ...serif, fontSize: 18, color: C.teal900, margin: '0 0 16px' }}>Direct Submit to Review</h3>
        <form onSubmit={handleDirectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="radio" name="itemType" value="claim" checked={newItemType === 'claim'} onChange={() => setNewItemType('claim')} /> Claim
            </label>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="radio" name="itemType" value="story" checked={newItemType === 'story'} onChange={() => setNewItemType('story')} /> Story
            </label>
          </div>
          {newItemType === 'claim' ? (
            <textarea value={newClaim} onChange={e => setNewClaim(e.target.value)} placeholder="Enter claim text..." required
              style={{ width: '100%', minHeight: 60, padding: 12, borderRadius: 8, border: \`1px solid \${C.lineStrong}\`, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
          ) : (
            <input value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="Enter story topic..." required
              style={{ width: '100%', padding: 12, borderRadius: 8, border: \`1px solid \${C.lineStrong}\`, fontSize: 13, fontFamily: 'inherit' }} />
          )}
          <button type="submit" disabled={submitting || (newItemType === 'claim' ? !newClaim.trim() : !newTopic.trim())} style={{
            background: C.teal900, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', opacity: submitting ? 0.7 : 1
          }}>
            {submitting ? 'Submitting...' : 'Submit to Queue'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ ...serif, fontSize: 20, color: C.teal900, margin: 0 }}>Review Queue</h2>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: \`1px solid \${C.lineStrong}\`, fontSize: 13 }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="needs_more_evidence">Needs Evidence</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.inkSoft }}><Loader className="spin" size={24} /></div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12, border: \`1px solid \${C.line}\`, color: C.inkSoft }}>
          Queue is empty.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(rev => (
            <div key={rev.id} onClick={() => onOpenReview(rev)} style={{
              background: '#fff', border: \`1px solid \${C.line}\`, borderRadius: 12, padding: '16px 20px',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }} className="fm-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={REVIEW_STATUS_STYLE[rev.status] || s.pill('#eee', '#333', 'transparent')}>{rev.status.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 11, color: C.inkSoft, ...mono }}>{new Date(rev.created_at).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: C.ink, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {rev.item_type === 'claim' ? rev.claim : rev.topic}
              </div>
              <div style={{ fontSize: 12, color: C.inkSoft, display: 'flex', gap: 16 }}>
                <span>Type: <strong style={{ color: C.ink }}>{rev.item_type}</strong></span>
                {rev.scores && <span>Readiness: <strong style={{ color: rev.scores.publish_readiness_score >= 8 ? '#2E7D32' : C.ink }}>{rev.scores.publish_readiness_score || '?'}/10</strong></span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewDrawer({ reviewId, api, onClose }) {
  const [rev, setRev] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [note, setNote] = useState('')

  const loadData = useCallback(async () => {
    if (!api || !reviewId) return;
    setLoading(true);
    try {
      const [r, h] = await Promise.all([
        api.getReview(reviewId),
        api.getReviewHistory(reviewId)
      ]);
      setRev(r);
      setHistory(h || []);
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [api, reviewId]);

  useEffect(() => { loadData() }, [loadData]);

  const doAction = async (actionFn, ...args) => {
    setActionLoading(true);
    try {
      await actionFn(reviewId, "editor_user", ...args);
      setNote('');
      loadData(); // reload
    } catch(e) {
      alert("Action failed: " + e.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (!reviewId) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99998, opacity: rev ? 1 : 0, transition: 'opacity .3s' }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: 0, bottom: 0, right: 0, width: 640, maxWidth: '90%',
        background: C.cream, zIndex: 99999, boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
        transform: rev ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column'
      }}>
        {loading && !rev ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Loader className="spin" size={24} /></div>
        ) : rev ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: \`1px solid \${C.line}\`, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ClipboardCheck size={20} color={C.teal900} />
                <h2 style={{ ...serif, fontSize: 20, margin: 0, color: C.teal900 }}>Review Details</h2>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><X size={24} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={REVIEW_STATUS_STYLE[rev.status] || s.pill('#eee', '#333', 'transparent')}>{rev.status.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 12, color: C.inkSoft }}>ID: {rev.id.slice(0,8)}...</span>
              </div>

              <div style={{ background: '#fff', border: \`1px solid \${C.line}\`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={s.eyebrow}>{rev.item_type === 'claim' ? 'Claim' : 'Story Topic'}</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: C.ink, marginTop: 8, lineHeight: 1.5 }}>
                  {rev.item_type === 'claim' ? rev.claim : rev.topic}
                </div>
              </div>

              {rev.scores && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <div style={{ flex: 1, background: '#fff', border: \`1px solid \${C.line}\`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: C.inkSoft, textTransform: 'uppercase', marginBottom: 4 }}>Confidence</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: C.teal900 }}>{rev.scores.confidence_score}/10</div>
                  </div>
                  <div style={{ flex: 1, background: '#fff', border: \`1px solid \${C.line}\`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: C.inkSoft, textTransform: 'uppercase', marginBottom: 4 }}>Corroboration</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: C.teal900 }}>{rev.scores.corroboration_score}/10</div>
                  </div>
                  <div style={{ flex: 1, background: '#fff', border: \`1px solid \${C.line}\`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: C.inkSoft, textTransform: 'uppercase', marginBottom: 4 }}>Readiness</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: rev.scores.publish_readiness_score >= 8 ? '#2E7D32' : C.red }}>{rev.scores.publish_readiness_score}/10</div>
                  </div>
                </div>
              )}

              {/* Evidence */}
              <h4 style={{ ...serif, fontSize: 16, color: C.teal900, marginBottom: 12 }}>Supporting Evidence</h4>
              <div style={{ background: '#fff', border: \`1px solid \${C.line}\`, borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 13, lineHeight: 1.6 }}>
                {rev.evidence?.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {rev.evidence.map((ev, i) => (
                      <li key={i} style={{ marginBottom: 8 }}>{ev.text || ev}</li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ color: C.inkSoft }}>No evidence provided.</span>
                )}
              </div>

              {/* Action Box */}
              <div style={{ background: '#F5F5F5', border: \`1px solid \${C.line}\`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: C.ink }}>Editor Actions</h4>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)..."
                  style={{ width: '100%', height: 60, padding: 10, borderRadius: 8, border: \`1px solid \${C.lineStrong}\`, fontSize: 13, marginBottom: 12, resize: 'none' }} />
                
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => doAction(api.approveReview, note)} disabled={actionLoading} style={{ background: '#2E7D32', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.7 : 1 }}>Approve</button>
                  <button onClick={() => doAction(api.rejectReview, note)} disabled={actionLoading} style={{ background: C.red, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.7 : 1 }}>Reject</button>
                  <button onClick={() => doAction(api.escalateReview, 'senior_editor', note)} disabled={actionLoading} style={{ background: '#7B5EA7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.7 : 1 }}>Escalate</button>
                  <button onClick={() => doAction(api.requestMoreEvidence, note)} disabled={actionLoading || rev.item_type !== 'claim'} style={{ background: C.tanDeep, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: actionLoading || rev.item_type !== 'claim' ? 'not-allowed' : 'pointer', opacity: actionLoading || rev.item_type !== 'claim' ? 0.7 : 1 }}>Req Evidence</button>
                </div>
              </div>

              {/* History */}
              <h4 style={{ ...serif, fontSize: 16, color: C.teal900, marginBottom: 12 }}>Audit History</h4>
              {history.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {history.map((h, i) => (
                    <div key={i} style={{ borderLeft: \`2px solid \${C.lineStrong}\`, paddingLeft: 12, marginLeft: 6 }}>
                      <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 4 }}>{new Date(h.timestamp).toLocaleString()} • <strong>{h.actor}</strong></div>
                      <div style={{ fontSize: 13, color: C.ink }}>Changed status to <span style={REVIEW_STATUS_STYLE[h.to_status] || s.pill('#eee', '#333', 'transparent')}>{h.to_status}</span></div>
                      {h.note && <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4, fontStyle: 'italic' }}>"{h.note}"</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: C.inkSoft }}>No history available.</div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
`;

code = code.replace("export default function App() {", reviewComponents + "\nexport default function App() {");
fs.writeFileSync('src/App.tsx', code);
