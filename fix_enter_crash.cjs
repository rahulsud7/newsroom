const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Ensure that typing Enter in the composer works without passing an event to send()
code = code.replace(
  `onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}`,
  `onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}`
);

// We should also check the button onClick just in case
code = code.replace(
  `<button onClick={send} disabled={!draft.trim() || loading}`,
  `<button onClick={() => send()} disabled={!draft.trim() || loading}`
);

fs.writeFileSync('src/App.tsx', code);
