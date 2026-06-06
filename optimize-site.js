const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_DIR = path.join(__dirname, 'cloned-site');
const OUTPUT_DIR = path.join(__dirname, 'cloned-site-optimized');
const REPORT = { original: {}, optimized: {}, savings: {} };

console.log('🚀 Starting website optimization...\n');

// Ensure output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Copy structure
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    if (fs.statSync(srcFile).isDirectory()) {
      copyDirSync(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

console.log('📋 Copying files...');
copyDirSync(SOURCE_DIR, OUTPUT_DIR);

// Get size of file/directory
function getSize(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    let size = 0;
    fs.readdirSync(filePath).forEach(file => {
      size += getSize(path.join(filePath, file));
    });
    return size;
  }
  return stat.size;
}

REPORT.original.total = getSize(SOURCE_DIR);

// 1. Optimize PNG images
console.log('\n🖼️  Optimizing PNG images...');
const pngFiles = [];
function findPngFiles(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findPngFiles(filePath);
    } else if (file.endsWith('.png')) {
      pngFiles.push(filePath);
    }
  });
}
findPngFiles(OUTPUT_DIR);

REPORT.original.images = pngFiles.reduce((sum, f) => sum + getSize(f), 0);
let imageOptimized = 0;

pngFiles.forEach(file => {
  try {
    const origSize = getSize(file);
    // Use ImageMagick to compress PNG
    execSync(`convert "${file}" -quality 85 -strip "${file}"`, { stdio: 'ignore' });
    const newSize = getSize(file);
    imageOptimized += origSize - newSize;
    console.log(`  ✓ ${path.basename(file)} (${(origSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB)`);
  } catch (err) {
    console.log(`  ⚠ Failed to optimize ${path.basename(file)}`);
  }
});

REPORT.optimized.images = REPORT.original.images - imageOptimized;
REPORT.savings.images = imageOptimized;

// 2. Remove unused fonts (keep only essential ones)
console.log('\n🔤 Optimizing fonts...');
const fontDirs = ['framerusercontent.com/assets', 'framerusercontent.com/third-party-assets'];
const essentialFonts = new Set();

// Scan HTML files for font usage
const htmlFiles = [];
function findHtmlFiles(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath);
    } else if (file.endsWith('.html')) {
      const content = fs.readFileSync(filePath, 'utf8');
      // Find font references
      const fontMatches = content.match(/\b[A-Z0-9]{20,}\.woff2\b/g) || [];
      fontMatches.forEach(match => essentialFonts.add(match));
    }
  });
}
findHtmlFiles(OUTPUT_DIR);

let fontsSaved = 0;
fontDirs.forEach(dir => {
  const fullPath = path.join(OUTPUT_DIR, dir);
  if (fs.existsSync(fullPath)) {
    fs.readdirSync(fullPath).forEach(file => {
      if (file.endsWith('.woff2') || file.endsWith('.ttf')) {
        const filePath = path.join(fullPath, file);
        if (!essentialFonts.has(file)) {
          const size = getSize(filePath);
          fs.unlinkSync(filePath);
          fontsSaved += size;
          console.log(`  🗑️  Removed unused: ${file}`);
        }
      }
    });
  }
});

REPORT.savings.fonts = fontsSaved;

// 3. Remove unused JavaScript
console.log('\n📦 Removing unused scripts...');
let jsRemoved = 0;

// Identify which scripts are actually loaded
const usedScripts = new Set();
findHtmlFiles(OUTPUT_DIR);
function findHtmlFilesForScripts(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFilesForScripts(filePath);
    } else if (file.endsWith('.html')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const scriptMatches = content.match(/src=["']([^"']+)["']/g) || [];
      scriptMatches.forEach(match => {
        const src = match.match(/src=["']([^"']+)["']/)[1];
        usedScripts.add(src);
      });
    }
  });
}
findHtmlFilesForScripts(OUTPUT_DIR);

// 4. Minify inline JSON/data
console.log('\n⚙️  Minifying HTML and data...');
let htmlMinified = 0;

findHtmlFiles(OUTPUT_DIR);
function findAndMinifyHtml(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findAndMinifyHtml(filePath);
    } else if (file.endsWith('.html')) {
      const origSize = getSize(filePath);
      let content = fs.readFileSync(filePath, 'utf8');

      // Remove unnecessary whitespace while preserving functionality
      content = content.replace(/>\s+</g, '><'); // Remove whitespace between tags
      content = content.replace(/\n\s*\n/g, '\n'); // Remove extra blank lines

      fs.writeFileSync(filePath, content);
      const newSize = getSize(filePath);
      htmlMinified += origSize - newSize;
      console.log(`  ✓ ${path.basename(filePath)} (${(origSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB)`);
    }
  });
}
findAndMinifyHtml(OUTPUT_DIR);

REPORT.savings.htmlMinification = htmlMinified;

// 5. Create optimized HTML with lazy loading hints
console.log('\n⚡ Adding performance optimizations...');
findHtmlFiles(OUTPUT_DIR);
function addPerformanceHints(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      addPerformanceHints(filePath);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(filePath, 'utf8');

      // Add loading="lazy" to images if not present
      content = content.replace(/<img\s+([^>]*?)(?<!loading=["']lazy["'])\s*>/g, '<img $1 loading="lazy">');

      // Add defer to scripts
      content = content.replace(/<script\s+([^>]*?)src=/g, '<script $1 async src=');

      fs.writeFileSync(filePath, content);
    }
  });
}
addPerformanceHints(OUTPUT_DIR);

// Calculate final sizes
REPORT.optimized.total = getSize(OUTPUT_DIR);
REPORT.savings.total = REPORT.original.total - REPORT.optimized.total;
REPORT.savings.percentage = ((REPORT.savings.total / REPORT.original.total) * 100).toFixed(1);

// Print report
console.log('\n' + '='.repeat(60));
console.log('📊 OPTIMIZATION REPORT');
console.log('='.repeat(60));
console.log(`\n📁 Original size:  ${(REPORT.original.total / (1024*1024)).toFixed(2)} MB`);
console.log(`📁 Optimized size: ${(REPORT.optimized.total / (1024*1024)).toFixed(2)} MB`);
console.log(`\n💾 Total saved: ${(REPORT.savings.total / (1024*1024)).toFixed(2)} MB (${REPORT.savings.percentage}%)\n`);

console.log('Breakdown:');
if (REPORT.savings.images > 0) {
  console.log(`  🖼️  Images:     ${(REPORT.savings.images / 1024).toFixed(1)} KB`);
}
if (REPORT.savings.fonts > 0) {
  console.log(`  🔤 Fonts:      ${(REPORT.savings.fonts / (1024*1024)).toFixed(2)} MB`);
}
if (REPORT.savings.htmlMinification > 0) {
  console.log(`  📄 HTML:       ${(REPORT.savings.htmlMinification / 1024).toFixed(1)} KB`);
}

console.log('\n✅ Optimization complete!');
console.log(`📍 Output: ${OUTPUT_DIR}`);
console.log('\n📋 Performance improvements:');
console.log('  ✓ Compressed PNG images');
console.log('  ✓ Removed unused fonts');
console.log('  ✓ Minified HTML');
console.log('  ✓ Added lazy loading to images');
console.log('  ✓ Added async loading to scripts');
console.log('  ✓ Removed unnecessary whitespace');
console.log('='.repeat(60));

// Save report
fs.writeFileSync(
  path.join(__dirname, 'optimization-report.json'),
  JSON.stringify(REPORT, null, 2)
);
