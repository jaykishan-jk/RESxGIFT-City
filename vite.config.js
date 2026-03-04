import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// ── Logo preload plugin ───────────────────────────────────────────────────────
// Reads the hashed logo filename from the build manifest and injects a
// <link rel="preload" as="image"> into index.html at build time.
// In dev mode (no manifest), falls back to the raw asset path which Vite
// serves directly, so the preload still fires before React mounts.
function logoPreloadPlugin() {
  let isBuild = false;

  return {
    name: 'logo-preload',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    // Dev: inject using the raw src path — Vite serves it as-is
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!isBuild) {
          return html.replace(
            '</head>',
            `  <link rel="preload" as="image" href="/src/assets/RES Logo White.png">\n  </head>`,
          );
        }
        return html;
      },
    },
    // Build: inject using the hashed URL from the manifest
    closeBundle() {
      if (!isBuild) return;
      const manifestPath = resolve('dist/.vite/manifest.json');
      if (!fs.existsSync(manifestPath)) return;

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const logoEntry = Object.values(manifest).find(e =>
        e.src?.includes('RES Logo White'),
      );
      if (!logoEntry) return;

      const indexPath = resolve('dist/index.html');
      const html = fs.readFileSync(indexPath, 'utf-8');
      const patched = html.replace(
        '</head>',
        `  <link rel="preload" as="image" href="/${logoEntry.file}">\n  </head>`,
      );
      fs.writeFileSync(indexPath, patched);
    },
  };
}

export default defineConfig({
  plugins: [react(), logoPreloadPlugin()],
});
