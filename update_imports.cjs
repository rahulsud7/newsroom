const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "Bot, Upload, ChevronRight, FolderClosed, GripVertical, FileUp, User,",
  "Bot, Upload, ChevronRight, ChevronLeft, History, MessageSquare, ArrowLeft, FolderClosed, GripVertical, FileUp, User,"
);

fs.writeFileSync('src/App.tsx', code);
