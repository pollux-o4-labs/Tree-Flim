import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = process.env.VITE_BASE_PATH ?? '/';
const normalizedBase = base.endsWith('/') ? base : `${base}/`;
const html = `<!doctype html><meta charset="utf-8"><title>Loading…</title><script>
  const base = ${JSON.stringify(normalizedBase)};
  const path = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : '';
  sessionStorage.setItem('tree-film-pages-redirect', path + location.search + location.hash);
  location.replace(base);
</script>`;
await mkdir(resolve('dist'), { recursive: true });
await writeFile(resolve('dist/404.html'), html);

