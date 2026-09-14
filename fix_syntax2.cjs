const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `        )}
 />
      </div>`,
  `        )}
        <div ref={bottomRef} />
      </div>`
);

fs.writeFileSync('src/App.tsx', code);
