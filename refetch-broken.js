const fs = require('fs');
const path = require('path');
const https = require('https');

const SITE = path.join(__dirname, 'cloned-site');
const broken = [
  '0uWtIkH2JRfErazWWeG3qoY0wg.png',
  'dhfLJzgn1lYVN77KMGe0dbzzXI.png',
  'Jmj9NJgK9gtzLyIkC9skGkPMNQ0.png',
  'tix9J5fOIR9RhiEachCSBhxrc.png',
  'z0eTSK7QjTNoMymqe1UEBu2px8.png',
];

// Pull the original URLs (with size hints) out of the HTML
const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8')
            + fs.readFileSync(path.join(SITE, 'contact.html'), 'utf8');

function findUrl(name) {
  // Look for the filename with any query string in the HTML, decode &amp;
  const re = new RegExp(`https?://[^"' ]*${name.replace('.', '\\.')}[^"' ]*`, 'g');
  const matches = html.match(re) || [];
  // Prefer the longest (most descriptive) URL — usually contains size params
  matches.sort((a, b) => b.length - a.length);
  return matches[0] ? matches[0].replace(/&amp;/g, '&') : null;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(dest, buf);
        resolve(buf.length);
      });
    }).on('error', reject);
  });
}

(async () => {
  for (const name of broken) {
    const url = findUrl(name);
    const dest = path.join(SITE, 'images', name);
    if (!url) { console.log(`  no url found for ${name}`); continue; }
    try {
      const size = await download(url, dest);
      console.log(`  refetched ${name}: ${(size/1024).toFixed(1)} KB`);
      console.log(`    from: ${url}`);
    } catch (e) {
      console.log(`  failed ${name}: ${e.message}`);
    }
  }
})();
