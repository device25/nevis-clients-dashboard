import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const assets = join(import.meta.dirname, '..', 'apps', 'web', 'dist', 'assets');
const marker = 'react.memo_cache_sentinel';

const compiled = readdirSync(assets)
  .filter((file) => file.endsWith('.js'))
  .some((file) => readFileSync(join(assets, file), 'utf8').includes(marker));

if (!compiled) {
  console.error(`No ${marker} in apps/web/dist: React Compiler did not run.`);
  process.exit(1);
}
console.log('React Compiler output found in the production bundle.');
