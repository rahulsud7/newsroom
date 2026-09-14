const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `<input value={query} onChange={e => {`,
  `<input list="search-history-list" value={query} onChange={e => {`
);

code = code.replace(
  `                }} />
              <button type="submit"`,
  `                }} />
              <datalist id="search-history-list">
                {searchHistory.map((h, i) => <option key={i} value={h} />)}
              </datalist>
              <button type="submit"`
);

fs.writeFileSync('src/App.tsx', code);
