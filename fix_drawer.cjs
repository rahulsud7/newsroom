const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "{openArticle && <SourceDrawer article={openArticle} onClose={() => setOpenArticle(null)} api={api} />}",
  "{openArticle && <SourceDrawer article={openArticle} onClose={() => setOpenArticle(null)} api={api} />}\n      <ReviewDrawer reviewId={openReview?.review_id} api={api} onClose={() => setOpenReview(null)} />"
);

fs.writeFileSync('src/App.tsx', code);
