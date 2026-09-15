const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldInv = `      const out = res.result || res.reply; setInvestigationResult(typeof out === 'string' ? out : JSON.stringify(res));`;

const newInv = `      const out = res.result || res.reply;
      if (typeof out === 'string') {
        setInvestigationResult(out);
      } else {
        if (res.evidence_sufficiency?.claims_found === 0) {
           setInvestigationResult(\`No significant claims or evidence found regarding "**\${res.entity || topic}**" in the retrieved context.\\n\\nChunks considered: \${res.source_chunks_considered || 0}\`);
        } else if (res.claims || res.contradictions) {
           let formatted = \`**Investigation: \${res.entity || topic}**\\n\\n\`;
           if (res.claims?.length) {
              formatted += \`**Claims:**\\n\` + res.claims.map(c => \`- \${c}\`).join('\\n') + '\\n\\n';
           }
           if (res.contradictions?.length) {
              formatted += \`**Contradictions:**\\n\` + res.contradictions.map(c => \`- \${c}\`).join('\\n') + '\\n\\n';
           }
           setInvestigationResult(formatted);
        } else {
           setInvestigationResult(\`\`\`json\\n\${JSON.stringify(res, null, 2)}\\n\`\`\`);
        }
      }`;

code = code.replace(oldInv, newInv);
fs.writeFileSync('src/App.tsx', code);
