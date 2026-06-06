const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const BASE_URL = 'https://www.sculptrlabs.com';
const OUTPUT_DIR = path.join(__dirname, 'cloned-site');
const visited = new Set();
const assetQueue = new Set();

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizePath(urlStr) {
  try {
    const parsed = new url.URL(urlStr, BASE_URL);
    let pathname = parsed.pathname;

    if (pathname === '/') pathname = '/index.html';
    if (!path.extname(pathname)) pathname += '.html';

    return pathname.substring(1);
  } catch {
    return null;
  }
}

function downloadFile(urlStr) {
  return new Promise((resolve, reject) => {
    const protocol = urlStr.startsWith('https') ? https : http;
    const filePath = path.join(OUTPUT_DIR, sanitizePath(urlStr));

    if (!filePath) {
      reject(new Error('Invalid path'));
      return;
    }

    ensureDir(path.dirname(filePath));

    const file = fs.createWriteStream(filePath);
    const req = protocol.get(urlStr, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        reject(new Error('Redirect'));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${urlStr}`);
        resolve(filePath);
      });
    });

    req.on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function fetchHtml(urlStr) {
  return new Promise((resolve, reject) => {
    const protocol = urlStr.startsWith('https') ? https : http;
    let data = '';

    const req = protocol.get(urlStr, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    }, (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function extractUrls(html, baseUrl) {
  const links = [];
  const assets = [];

  // href patterns
  const hrefRegex = /href=["']([^"']+)["']/g;
  const srcRegex = /src=["']([^"']+)["']/g;
  const urlRegex = /url\(["']?([^"')]+)["']?\)/g;

  let match;
  while ((match = hrefRegex.exec(html)) !== null) links.push(match[1]);
  while ((match = srcRegex.exec(html)) !== null) assets.push(match[1]);
  while ((match = urlRegex.exec(html)) !== null) assets.push(match[1]);

  return { links, assets };
}

function resolveUrl(urlStr, baseUrl) {
  if (!urlStr) return null;
  if (urlStr.startsWith('http')) return urlStr;
  if (urlStr.startsWith('//')) return 'https:' + urlStr;
  if (urlStr.startsWith('/')) return BASE_URL + urlStr;
  if (urlStr.startsWith('#')) return null;
  if (urlStr.startsWith('?')) return baseUrl.split('?')[0] + urlStr;

  try {
    return new url.URL(urlStr, baseUrl).href;
  } catch {
    return null;
  }
}

async function processPagesAndAssets() {
  // Start with homepage
  const pageQueue = [BASE_URL, BASE_URL + '/contact'];

  for (const pageUrl of pageQueue) {
    if (visited.has(pageUrl)) continue;
    visited.add(pageUrl);

    try {
      console.log(`\n📄 Fetching: ${pageUrl}`);
      const html = await fetchHtml(pageUrl);

      // Save HTML
      const filePath = path.join(OUTPUT_DIR, sanitizePath(pageUrl));
      ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, html);
      console.log(`✓ Saved page: ${pageUrl}`);

      // Extract and queue assets
      const { links, assets } = extractUrls(html, pageUrl);

      for (const asset of assets) {
        const resolved = resolveUrl(asset, pageUrl);
        if (resolved && !assetQueue.has(resolved)) {
          assetQueue.add(resolved);
        }
      }
    } catch (err) {
      console.error(`✗ Error processing ${pageUrl}:`, err.message);
    }
  }

  // Download all assets
  console.log(`\n📦 Downloading ${assetQueue.size} assets...\n`);

  const assets = Array.from(assetQueue);
  for (const asset of assets) {
    try {
      await downloadFile(asset);
    } catch (err) {
      console.log(`⊘ Skipped: ${asset} (${err.message})`);
    }
  }
}

async function main() {
  console.log('🔄 Starting clone of ' + BASE_URL + '...\n');
  ensureDir(OUTPUT_DIR);

  await processPagesAndAssets();

  console.log('\n✅ Clone complete!');
  console.log(`📁 Saved to: ${OUTPUT_DIR}`);
  console.log(`📄 Pages: ${visited.size}`);
  console.log(`📦 Assets: ${assetQueue.size}`);
}

main().catch(console.error);
