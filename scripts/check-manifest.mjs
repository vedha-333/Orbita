import fs from 'node:fs';
import path from 'node:path';

function checkManifest(manifestPath, label) {
  const fullPath = path.resolve(manifestPath);
  const m = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  if (m.chrome_url_overrides) {
    console.error(`[ERROR] ${label}: chrome_url_overrides found in manifest — this overrides the New Tab page!`);
    process.exit(1);
  }
  console.log(`[OK] ${label}: manifest clean (no chrome_url_overrides)`);
}

checkManifest('public/manifest.json', 'public/manifest.json');
checkManifest('dist/manifest.json', 'dist/manifest.json');