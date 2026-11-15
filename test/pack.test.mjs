// End to end: `npm pack` the built package, install the tarball into a
// throwaway project, and run the installed CLI against a fake HOME.
//
// The package under test is MIND_SET_PACKAGE, or this test's own package when
// it has a corpus/ (the public repository, or dist-mind-set/). In the source
// folder mind-set/ there is no corpus until `npm run build:mind-set`, so the
// suite is skipped there; `npm run test:mind-set-pack` builds and runs it.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { FIXTURES, PKG_DIR, cleanup, exists, makeHome, readJson, run, tempDir } from './helpers.mjs';

after(cleanup);

const PACKAGE = process.env.MIND_SET_PACKAGE
  ? path.resolve(process.env.MIND_SET_PACKAGE)
  : exists(path.join(PKG_DIR, 'corpus')) ? PKG_DIR : null;

const SKILLS = [
  'openappl-blueprint-authoring',
  'openappl-blueprint-contract',
  'openappl-blueprint-design',
  'openappl-blueprint-review',
];

function npm(args, cwd) {
  const res = spawnSync('npm', args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false' },
  });
  assert.equal(res.status, 0, `npm ${args.join(' ')}\n${res.stdout}\n${res.stderr}`);
  return res.stdout;
}

/** Absolute corpus paths a skill names (`<corpus>/procedures/specs.md`), placeholders left out. */
function corpusPaths(text, corpus) {
  const out = new Set();
  const esc = corpus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const m of text.matchAll(new RegExp(`${esc}/([A-Za-z0-9_./-]*)`, 'g'))) {
    const rel = m[1].replace(/[.]+$/, '');
    if (rel) out.add(rel);
  }
  return [...out];
}

describe('npm pack, installed from the tarball', { skip: PACKAGE ? false : 'no built package (npm run test:mind-set-pack)' }, () => {
  const work = PACKAGE ? tempDir('mind-set-pack-') : null;
  let installed;

  test('the tarball holds the package and not the tests', () => {
    const [info] = JSON.parse(npm(['pack', PACKAGE, '--json', '--pack-destination', work], work));
    const files = new Set(info.files.map((f) => f.path));
    for (const f of ['package.json', 'bin/mind-set.mjs', 'lib/install.mjs', 'lib/validate.mjs', 'LICENSE', 'README.md', 'CHANGELOG.md', 'corpus/openappl.json', 'corpus/README.md']) {
      assert.ok(files.has(f), `${f} is not in the tarball`);
    }
    for (const s of SKILLS) assert.ok(files.has(`skills/${s}/SKILL.md`), `skills/${s}/SKILL.md is not in the tarball`);
    assert.ok([...files].some((f) => f.startsWith('corpus/procedures/')), 'no procedures in the tarball');
    assert.ok([...files].some((f) => f.startsWith('corpus/openappl/spec/')), 'no specification pages in the tarball');
    assert.ok(![...files].some((f) => f.startsWith('test/')), 'the tests are in the tarball');

    const project = path.join(work, 'project');
    fs.mkdirSync(project);
    fs.writeFileSync(path.join(project, 'package.json'), '{ "name": "probe", "private": true }\n');
    npm(['install', '--no-package-lock', path.join(work, info.filename)], project);
    installed = path.join(project, 'node_modules', '@mindbricks', 'mind-set');
    assert.equal(readJson(path.join(installed, 'package.json')).version, info.version);
    if (process.platform !== 'win32') assert.ok(exists(path.join(project, 'node_modules', '.bin', 'mind-set')));
  });

  test('install writes every skill for both agents, with corpus paths that exist', () => {
    const home = makeHome({ claude: true, codex: true });
    const res = run(installed, home, ['install']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    const version = readJson(path.join(installed, 'package.json')).version;
    const corpus = path.join(home, '.mind-set', version);
    for (const agentDir of [path.join(home, '.claude', 'skills'), path.join(home, '.agents', 'skills')]) {
      for (const s of SKILLS) {
        const text = fs.readFileSync(path.join(agentDir, s, 'SKILL.md'), 'utf8');
        assert.ok(!text.includes('{{CORPUS}}'), `${s}: placeholder left`);
        const named = corpusPaths(text, corpus);
        assert.ok(named.length > 0, `${s} names no corpus file`);
        for (const rel of named) assert.ok(exists(path.join(corpus, rel)), `${s}: ${rel} is not in the installed corpus`);
      }
    }

    const doc = run(installed, home, ['doctor']);
    assert.equal(doc.code, 0, doc.stdout + doc.stderr);
    assert.match(doc.stdout, new RegExp(readJson(path.join(installed, 'package.json')).openappl.version.replace(/\./g, '\\.')));

    const examples = path.join(corpus, 'examples');
    const blueprints = fs.readdirSync(examples).filter((f) => f.endsWith('.json'));
    assert.ok(blueprints.length >= 3, 'fewer than three example blueprints');
    for (const f of blueprints) {
      const v = run(installed, home, ['validate', path.join(examples, f)]);
      assert.equal(v.code, 0, `${f}: ${v.stdout}${v.stderr}`);
    }
    const broken = path.join(FIXTURES, 'invalid', 'bad-enum.json');
    const bad = run(installed, home, ['validate', broken]);
    assert.equal(bad.code, 1, bad.stdout + bad.stderr);
    assert.match(bad.stdout + bad.stderr, /ERROR \$\./);

    const un = run(installed, home, ['uninstall']);
    assert.equal(un.code, 0, un.stdout + un.stderr);
    for (const agentDir of [path.join(home, '.claude', 'skills'), path.join(home, '.agents', 'skills')]) {
      for (const s of SKILLS) assert.ok(!exists(path.join(agentDir, s)), `${s} left in ${agentDir}`);
    }
    assert.ok(!exists(corpus), 'the corpus is left after uninstall');
  });
});
