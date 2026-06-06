const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const BASE_URL = 'https://www.sculptrlabs.com';
const OUTPUT_DIR = path.join(__dirname, 'cloned-site');
const visited = new Set();
const toDownload = new Set();

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizePath(urlStr) {
  const parsed = new url.URL(urlStr, BASE_URL);
  let pathname = parsed.pathname;

  if (pathname === '/') pathname = '/index.html';
  if (!path.extname(pathname)) pathname += '.html';

  return pathname.substring(1);
}

function downloadFile(urlStr) {
  return new Promise((resolve, reject) => {
    const protocol = urlStr.startsWith('https') ? https : http;
    const filePath = path.join(OUTPUT_DIR, sanitizePath(urlStr));

    ensureDir(path.dirname(filePath));

    const file = fs.createWriteStream(filePath);
    protocol.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${urlStr}`);
        resolve(filePath);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

async function parseHtml(urlStr) {
  return new Promise((resolve, reject) => {
    const protocol = urlStr.startsWith('https') ? https : http;
    let data = '';

    protocol.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const links = [];
          const assets = [];

          // Extract URLs using regex
          const linkRegex = /href=["']([^"']+)["']/g;
          const srcRegex = /src=["']([^"']+)["']/g;
          const styleRegex = /@import\s+url\(["']?([^"')]+)["']?\)/g;

          let match;
          while ((match = linkRegex.exec(data)) !== null) {
            links.push(match[1]);
          }
          while ((match = srcRegex.exec(data)) !== null) {
            assets.push(match[1]);
          }
          while ((match = styleRegex.exec(data)) !== null) {
            assets.push(match[1]);
          }

          resolve({ html: data, links, assets });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function resolveUrl(urlStr, baseUrl) {
  if (!urlStr) return null;
  if (urlStr.startsWith('http')) return urlStr;
  if (urlStr.startsWith('//')) return 'https:' + urlStr;
  if (urlStr.startsWith('/')) return BASE_URL + urlStr;
  if (urlStr.startsWith('#')) return null;
  return new url.URL(urlStr, baseUrl).href;
}

async function crawlPage(pageUrl) {
  if (visited.has(pageUrl)) return;
  visited.add(pageUrl);

  console.log(`Crawling: ${pageUrl}`);

  try {
    const { html, links, assets } = await parseHtml(pageUrl);

    // Download page HTML
    const filePath = path.join(OUTPUT_DIR, sanitizePath(pageUrl));
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, html);
    console.log(`Saved: ${pageUrl}`);

    // Queue internal links
    for (const link of links) {
      const resolved = resolveUrl(link, pageUrl);
      if (resolved && resolved.startsWith(BASE_URL) && !visited.has(resolved)) {
        toDownload.add(resolved);
      }
    }

    // Queue assets
    for (const asset of assets) {
      const resolved = resolveUrl(asset, pageUrl);
      if (resolved && resolved.startsWith(BASE_URL)) {
        toDownload.add(resolved);
      }
    }
  } catch (err) {
    console.error(`Error crawling ${pageUrl}:`, err.message);
  }
}

async function main() {
  console.log(`Starting clone of ${BASE_URL}...`);
  ensureDir(OUTPUT_DIR);

  toDownload.add(BASE_URL);

  // Crawl pages (limit to prevent infinite loops)
  let iterations = 0;
  while (toDownload.size > 0 && iterations < 50) {
    const urlItem = toDownload.values().next().value;
    toDownload.delete(urlItem);

    if (!urlItem.includes('.') || urlItem.endsWith('.html') || urlItem === BASE_URL) {
      await crawlPage(urlItem);
    } else {
      try {
        await downloadFile(urlItem);
      } catch (err) {
        console.error(`Failed to download ${urlItem}:`, err.message);
      }
    }
    iterations++;
  }

  console.log(`\nClone complete! Files saved to ${OUTPUT_DIR}`);
  console.log(`Visited ${visited.size} pages`);
}

main().catch(console.error);
