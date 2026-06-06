const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'cloned-site-optimized');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const all = walk(OUT);
const allBaseNames = new Set(all.map(f => path.basename(f)));

const texts = all.filter(f => /\.(html|js|mjs|css)$/i.test(f));
const refs = new Set();
const filenameRe = /[A-Za-z0-9_-]{8,}\.(woff2|woff|ttf|png|jpg|jpeg|webp|svg|mjs|js|css)/g;

for (const t of texts) {
  const c = fs.readFileSync(t, 'utf8');
  (c.match(filenameRe) || []).forEach(m => refs.add(m));
}

const missing = [...refs].filter(r => !allBaseNames.has(r));
const stalePng = [...refs].filter(r => r.endsWith('.png') && !allBaseNames.has(r));

console.log(`References found in HTML/JS/CSS: ${refs.size}`);
console.log(`Files on disk:                   ${allBaseNames.size}`);
console.log(`Missing (referenced but absent): ${missing.length}`);
console.log(`  - of which stale .png refs:    ${stalePng.length}`);

if (missing.length) {
  console.log('\nMissing files:');
  missing.forEach(m => console.log('  ' + m));
}

// Spot-check critical Framer runtime
const runtimeJs = all.find(f => f.endsWith('script_main.BEI-w_ZH.mjs'));
console.log(`\nFramer runtime script: ${runtimeJs ? 'PRESENT (' + (fs.statSync(runtimeJs).size/1024).toFixed(1) + ' KB)' : 'MISSING'}`);

// Check index has WebP refs now
const idx = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
const webpCount = (idx.match(/\.webp/g) || []).length;
const pngCount = (idx.match(/\.png/g) || []).length;
console.log(`index.html: ${webpCount} .webp refs, ${pngCount} .png refs`);

// Confirm SW registered
console.log(`index.html: service worker registered? ${/serviceWorker\.register/.test(idx)}`);
