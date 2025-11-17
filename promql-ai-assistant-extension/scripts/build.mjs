import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { build } from 'esbuild';
import { copy, emptyDir, ensureDir } from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const distDir = path.join(projectRoot, 'dist');
const isWatchMode = process.argv.includes('--watch');

const sharedBuildOptions = {
  bundle: true,
  sourcemap: true,
  target: ['chrome108'],
  platform: 'browser',
  loader: { '.ts': 'ts' },
  minify: false,
  logLevel: 'info',
};

const buildTargets = [
  {
    name: 'content-script',
    entryPoints: [path.join(srcDir, 'contentScript.ts')],
    outfile: path.join(distDir, 'contentScript.js'),
    format: 'iife',
    globalName: 'GrafanaPromqlAssistantContent',
  },
  {
    name: 'background',
    entryPoints: [path.join(srcDir, 'background.ts')],
    outfile: path.join(distDir, 'background.js'),
    format: 'esm',
  },
  {
    name: 'overlay-ui',
    entryPoints: [path.join(srcDir, 'ui', 'overlay.ts')],
    outfile: path.join(distDir, 'ui', 'overlay.js'),
    format: 'esm',
  },
];

async function runBuild() {
  await emptyDir(distDir);
  await ensureDir(distDir);

  await Promise.all(
    buildTargets.map((target) => {
      const options = {
        ...sharedBuildOptions,
        entryPoints: target.entryPoints,
        outfile: target.outfile,
        format: target.format,
        globalName: target.globalName,
      };

      if (isWatchMode) {
        options.watch = {
          onRebuild(error) {
            if (error) {
              console.error(`[${target.name}] rebuild failed`, error);
            } else {
              console.log(`[${target.name}] rebuilt successfully`);
              copyStaticAssets().catch((copyErr) =>
                console.error('Failed to copy static assets after rebuild', copyErr),
              );
            }
          },
        };
      }

      return build(options);
    }),
  );

  await copyStaticAssets();

  if (isWatchMode) {
    watchStaticAssets();
  }
}

async function copyStaticAssets() {
  const manifestSrc = path.join(srcDir, 'manifest.json');
  const stylesSrc = path.join(srcDir, 'styles');
  const uiHtmlSrc = path.join(srcDir, 'ui', 'overlay.html');

  await Promise.all([
    copy(manifestSrc, path.join(distDir, 'manifest.json')),
    copy(stylesSrc, path.join(distDir, 'styles')),
    copy(uiHtmlSrc, path.join(distDir, 'ui', 'overlay.html')),
  ]);
  console.log('[static] Assets copied to dist/');
}

function watchStaticAssets() {
  const staticTargets = [
    { path: path.join(srcDir, 'manifest.json'), recursive: false },
    { path: path.join(srcDir, 'styles'), recursive: true },
    { path: path.join(srcDir, 'ui'), recursive: true },
  ];

  staticTargets.forEach((target) => {
    if (!fs.existsSync(target.path)) {
      return;
    }

    fs.watch(target.path, { recursive: target.recursive }, debounce(() => copyStaticAssets()));
  });

  console.log('[watch] Watching static assets for changes');
}

function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

runBuild().catch((error) => {
  console.error('Build failed', error);
  process.exitCode = 1;
});
