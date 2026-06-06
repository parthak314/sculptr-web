const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'cloned-site');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(SITE);

const textFiles = allFiles.filter(f =>
  /\.(html|css|js|mjs|json|svg)$/i.test(f)
);

const referenced = new Set();
const filenameRegex = /[A-Za-z0-9_-]{8,}\.(woff2|woff|ttf|png|jpg|jpeg|webp|svg|mjs|js|css)/g;

for (const f of textFiles) {
  let content;
  try { content = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const matches = content.match(filenameRegex) || [];
  matches.forEach(m => referenced.add(m));
}

const assetFiles = allFiles.filter(f =>
  /\.(woff2|woff|ttf|png|jpg|jpeg|webp)$/i.test(f)
);

let usedSize = 0, unusedSize = 0;
const unused = [];

for (const f of assetFiles) {
  const name = path.basename(f).split('?')[0];
  const size = fs.statSync(f).size;
  if (referenced.has(name)) {
    usedSize += size;
  } else {
    unusedSize += size;
    unused.push({ file: f, size });
  }
}

const fmt = b => b > 1048576 ? (b/1048576).toFixed(2)+' MB' : (b/1024).toFixed(1)+' KB';

console.log('=== AUDIT ===');
console.log(`Asset files total:  ${assetFiles.length}`);
console.log(`Referenced in code: ${assetFiles.length - unused.length}  (${fmt(usedSize)})`);
console.log(`NOT referenced:     ${unused.length}  (${fmt(unusedSize)})`);
console.log('');
console.log('By type (unused):');
const byType = {};
for (const u of unused) {
  const ext = path.extname(u.file).slice(1).toLowerCase();
  byType[ext] = byType[ext] || { count: 0, size: 0 };
  byType[ext].count++;
  byType[ext].size += u.size;
}
for (const [ext, info] of Object.entries(byType)) {
  console.log(`  .${ext}: ${info.count} files, ${fmt(info.size)}`);
}

fs.writeFileSync(
  path.join(__dirname, 'unused-assets.json'),
  JSON.stringify(unused.map(u => path.relative(SITE, u.file)), null, 2)
);
console.log('\nWrote unused-assets.json');
