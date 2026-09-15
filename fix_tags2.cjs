const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const t = `        <div ref={bottomRef} />
      </div>

      {/* Investigation Popup */}`;
const r = `        <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Investigation Popup */}`;
code = code.replace(t, r);
fs.writeFileSync('src/App.tsx', code);
