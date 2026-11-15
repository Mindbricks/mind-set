// Shared helpers for the mind-set CLI tests: a throwaway package built from the
// real bin/ and lib/ plus the fixture corpus and skills, a fake HOME, and a
// runner that starts the CLI with a clean environment.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PKG_DIR = path.resolve(TEST_DIR, '..');
export const FIXTURES = path.join(TEST_DIR, 'fixtures');
export const BIN = path.join(PKG_DIR, 'bin', 'mind-set.mjs');

const tempRoots = [];

export function tempDir(prefix = 'mind-set-test-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempRoots.push(dir);
  return dir;
}

export function cleanup() {
  for (const dir of tempRoots.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * A package folder with this checkout's bin/ and lib/, a package.json of the
 * given version, and the fixture corpus and skills (`skills` picks a subset).
 */
export function makePackage(version, { skills } = {}) {
  const root = tempDir('mind-set-pkg-');
  fs.cpSync(path.join(PKG_DIR, 'bin'), path.join(root, 'bin'), { recursive: true });
  fs.cpSync(path.join(PKG_DIR, 'lib'), path.join(root, 'lib'), { recursive: true });
  const pkg = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ ...pkg, version }, null, 2));
  fs.cpSync(path.join(FIXTURES, 'package', 'corpus'), path.join(root, 'corpus'), {
    recursive: true,
  });
  const srcSkills = path.join(FIXTURES, 'package', 'skills');
  for (const name of fs.readdirSync(srcSkills)) {
    if (skills && !skills.includes(name)) continue;
    fs.cpSync(path.join(srcSkills, name), path.join(root, 'skills', name), { recursive: true });
  }
  return root;
}

/** A fake HOME; `claude` / `codex` create the agents' config folders. */
export function makeHome({ claude = false, codex = false } = {}) {
  const home = tempDir('mind-set-home-');
  if (claude) fs.mkdirSync(path.join(home, '.claude'));
  if (codex) fs.mkdirSync(path.join(home, '.codex'));
  // An empty PATH folder, so the machine's own `codex` is never seen.
  fs.mkdirSync(path.join(home, 'bin'));
  return home;
}

/** Puts an executable named `codex` on the fake PATH. */
export function addCodexBinary(home) {
  const name = process.platform === 'win32' ? 'codex.cmd' : 'codex';
  const p = path.join(home, 'bin', name);
  fs.writeFileSync(p, process.platform === 'win32' ? '@echo off\r\n' : '#!/bin/sh\n');
  fs.chmodSync(p, 0o755);
}

/** Runs the CLI of `pkgRoot` with HOME = `home` and nothing else inherited. */
export function run(pkgRoot, home, args, extraEnv = {}) {
  const env = {
    HOME: home,
    USERPROFILE: home,
    PATH: path.join(home, 'bin'),
    ...extraEnv,
  };
  if (process.env.SYSTEMROOT) env.SYSTEMROOT = process.env.SYSTEMROOT;
  const res = spawnSync(process.execPath, [path.join(pkgRoot, 'bin', 'mind-set.mjs'), ...args], {
    env,
    encoding: 'utf8',
  });
  return { code: res.status, stdout: res.stdout, stderr: res.stderr };
}

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function exists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * The OpenAPPL schema for the validator tests: this package's corpus copy when
 * it has been built, else the repository's patterns.json (openappl.json is a
 * copy of it). Null when neither is reachable.
 */
export function findRealSchema() {
  for (const p of [
    path.join(PKG_DIR, 'corpus', 'openappl.json'),
    path.resolve(PKG_DIR, '..', 'patterns.json'),
  ]) {
    if (exists(p)) return p;
  }
  return null;
}
