// Runs every *.test.mjs in this folder with `node --test`. Node 22 no longer
// takes a folder argument and Node 18/20 do not expand globs, so the files
// are listed here, which works on every supported Node and on Windows.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.test.mjs'))
  .sort()
  .map((f) => path.join(dir, f));
// `--package <dir>` points the pack test at a built package (MIND_SET_PACKAGE).
const args = process.argv.slice(2);
const env = { ...process.env };
const at = args.indexOf('--package');
if (at >= 0) {
  env.MIND_SET_PACKAGE = path.resolve(args[at + 1] ?? '');
  args.splice(at, 2);
}
const res = spawnSync(process.execPath, ['--test', ...args, ...files], {
  stdio: 'inherit',
  env,
});
process.exitCode = res.status ?? 1;
