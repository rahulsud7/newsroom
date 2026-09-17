const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add icons
code = code.replace(
  /} from 'lucide-react'/,
  "  ClipboardCheck, ShieldAlert, ListChecks, Check, ThumbsUp, ThumbsDown, ArrowRight, CornerDownRight\n} from 'lucide-react'"
);

// 2. Add API Endpoints
const oldApi = `    ingest: (file, meta) => {
      const fd = new FormData(); fd.append('file', file)
      if (meta?.title) fd.append('title', meta.title)
      if (meta?.pub_date) fd.append('pub_date', meta.pub_date)
      return fetch(url('/ingest'), { method: 'POST', headers: { "ngrok-skip-browser-warning": "true" }, body: fd }).then(j)
    },
  }
}`;
const newApi = `    ingest: (file, meta) => {
      const fd = new FormData(); fd.append('file', file)
      if (meta?.title) fd.append('title', meta.title)
      if (meta?.pub_date) fd.append('pub_date', meta.pub_date)
      return fetch(url('/ingest'), { method: 'POST', headers: { "ngrok-skip-browser-warning": "true" }, body: fd }).then(j)
    },
    // Review endpoints
    scoreClaim: (claim, k=5, maxRounds=3) => fetch(url('/score/claim'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ claim, k, max_rounds: maxRounds }) }).then(j),
    scoreStory: (topic, k=15, maxClaims=10) => fetch(url('/score/story'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ topic, k, max_claims: maxClaims }) }).then(j),
    submitReview: (itemType, claim, topic, k=5, policyOverrides={}, submittedBy="api") => fetch(url('/review/submit'), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ item_type: itemType, claim, topic, k, policy_overrides: policyOverrides, submitted_by: submittedBy }) }).then(j),
    listReviews: (status, itemType) => {
      const qs = new URLSearchParams();
      if (status) qs.append('status', status);
      if (itemType) qs.append('item_type', itemType);
      return fetch(url(\`/review/queue?\${qs.toString()}\`), { headers: { "ngrok-skip-browser-warning": "true" } }).then(j);
    },
    getReview: (id) => fetch(url(\`/review/\${id}\`), { headers: { "ngrok-skip-browser-warning": "true" } }).then(j),
    getReviewHistory: (id) => fetch(url(\`/review/\${id}/history\`), { headers: { "ngrok-skip-browser-warning": "true" } }).then(j),
    approveReview: (id, reviewer, note="") => fetch(url(\`/review/\${id}/approve\`), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ reviewer, note }) }).then(j),
    rejectReview: (id, reviewer, note="") => fetch(url(\`/review/\${id}/reject\`), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ reviewer, note }) }).then(j),
    escalateReview: (id, reviewer, escalateTo, note="") => fetch(url(\`/review/\${id}/escalate\`), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ reviewer, escalate_to: escalateTo, note }) }).then(j),
    editReview: (id, reviewer, edits, note="") => fetch(url(\`/review/\${id}/edit\`), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ reviewer, edits, note }) }).then(j),
    requestMoreEvidence: (id, reviewer, note="", extraRounds=2) => fetch(url(\`/review/\${id}/request_more_evidence\`), { method: 'POST', headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ reviewer, note, extra_rounds: extraRounds }) }).then(j),
  }
}`;
code = code.replace(oldApi, newApi);

// 3. Add Status Pill styles
const oldStyles = `  pill: (bg, fg, border) => ({
    ...mono, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em',
    background: bg, color: fg, border: \`1px solid \${border}\`, padding: '2px 7px', borderRadius: 4
  }),
}`;
const newStyles = `  pill: (bg, fg, border) => ({
    ...mono, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em',
    background: bg, color: fg, border: \`1px solid \${border}\`, padding: '2px 7px', borderRadius: 4
  }),
}

const REVIEW_STATUS_STYLE = {
  pending: s.pill('#FFF9E6', '#8A6D3B', 'transparent'),
  auto_approved: s.pill(C.teal100, C.teal700, 'transparent'),
  approved: s.pill('#E7F3E8', '#2E7D32', 'transparent'),
  rejected: s.pill('#FDF0EF', C.red, 'transparent'),
  needs_more_evidence: s.pill(C.tanPale, C.tanDeep, 'transparent'),
  escalated: s.pill('#EFE6F5', '#7B5EA7', 'transparent'),
}`;
code = code.replace(oldStyles, newStyles);

// 4. Update TABS
const oldTabs = `const TABS = [
  { id: 'results', label: 'Search Results', Icon: () => <Search size={14} strokeWidth={2} /> },
  { id: 'timeline', label: 'Timeline', Icon: () => <Clock size={14} strokeWidth={2} /> },
  { id: 'graph', label: 'Entity Knowledge Graph', Icon: () => <Network size={14} strokeWidth={2} /> },
]`;
const newTabs = `const TABS = [
  { id: 'results', label: 'Search Results', Icon: () => <Search size={14} strokeWidth={2} /> },
  { id: 'timeline', label: 'Timeline', Icon: () => <Clock size={14} strokeWidth={2} /> },
  { id: 'graph', label: 'Entity Knowledge Graph', Icon: () => <Network size={14} strokeWidth={2} /> },
  { id: 'review', label: 'Review', Icon: () => <ClipboardCheck size={14} strokeWidth={2} /> },
]`;
code = code.replace(oldTabs, newTabs);

fs.writeFileSync('src/App.tsx', code);
