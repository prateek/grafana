import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

const copyTargets = [
  { src: resolve(rootDir, 'src/manifest.json'), dest: resolve(distDir, 'manifest.json') },
  { src: resolve(rootDir, 'src/styles'), dest: resolve(distDir, 'styles') },
  { src: resolve(rootDir, 'src/ui/overlay.html'), dest: resolve(distDir, 'ui/overlay.html') }
];

async function ensureDir(path) {
  await mkdir(dirname(path), { recursive: true });
}

async function copyAll() {
  for (const { src, dest } of copyTargets) {
    await ensureDir(dest);
    await cp(src, dest, { recursive: true });
    console.log(`Copied ${src} -> ${dest}`);
  }
}

copyAll().catch((error) => {
  console.error('Failed to copy static assets', error);
  process.exitCode = 1;
});
