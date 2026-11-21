import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import {
  PKG_DIR,
  addCodexBinary,
  cleanup,
  exists,
  makeHome,
  makePackage,
  readJson,
  run,
} from './helpers.mjs';

after(cleanup);

const SKILLS = ['demo-design', 'demo-review'];
const claudeSkill = (home, s) => path.join(home, '.claude', 'skills', s);
const codexSkill = (home, s) => path.join(home, '.agents', 'skills', s);
const manifestOf = (home) => readJson(path.join(home, '.mind-set', 'installed.json'));

describe('install', () => {
  test('writes the corpus and both agents when both are detected', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true, codex: true });
    const res = run(pkg, home, ['install']);
    assert.equal(res.code, 0, res.stdout + res.stderr);

    const corpus = path.join(home, '.mind-set', '0.1.0');
    assert.ok(exists(path.join(corpus, 'openappl.json')));
    assert.ok(exists(path.join(corpus, 'README.md')));
    const current = path.join(home, '.mind-set', 'current');
    assert.equal(fs.realpathSync(current), fs.realpathSync(corpus));

    for (const dir of [claudeSkill, codexSkill]) {
      const design = fs.readFileSync(path.join(dir(home, 'demo-design'), 'SKILL.md'), 'utf8');
      assert.ok(design.includes(`${corpus}/README.md`), design);
      assert.ok(!design.includes('{{CORPUS}}'));
      const notes = fs.readFileSync(
        path.join(dir(home, 'demo-review'), 'references', 'notes.md'),
        'utf8',
      );
      assert.ok(notes.includes(corpus), 'nested markdown gets the corpus path too');
      const marker = readJson(path.join(dir(home, 'demo-design'), '.mind-set.json'));
      assert.deepEqual(marker, { package: 'mind-set', version: '0.1.0', corpus });
    }

    const manifest = manifestOf(home);
    assert.equal(manifest.version, '0.1.0');
    assert.equal(manifest.openapplVersion, '9.9.9-test');
    assert.deepEqual(Object.keys(manifest.agents).sort(), ['claude', 'codex']);
    for (const s of SKILLS) {
      assert.ok(manifest.paths.includes(claudeSkill(home, s)));
      assert.ok(manifest.paths.includes(codexSkill(home, s)));
    }
    assert.ok(manifest.paths.includes(corpus));
    assert.ok(manifest.paths.includes(current));
  });

  test('default targets only the detected agent', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    const res = run(pkg, home, ['install']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.ok(exists(claudeSkill(home, 'demo-design')));
    assert.ok(!exists(path.join(home, '.agents')));
    assert.deepEqual(Object.keys(manifestOf(home).agents), ['claude']);
  });

  test('detects Codex by the codex binary on PATH', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome();
    addCodexBinary(home);
    const res = run(pkg, home, ['install']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.ok(exists(codexSkill(home, 'demo-design')));
    assert.ok(!exists(path.join(home, '.claude')));
  });

  test('fails without writing when no agent is found', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome();
    const res = run(pkg, home, ['install']);
    assert.equal(res.code, 1);
    assert.match(res.stdout, /no supported agent found/);
    assert.ok(!exists(path.join(home, '.mind-set')));
  });

  test('--codex forces an agent that is not detected, and only that one', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    const res = run(pkg, home, ['install', '--codex']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.ok(exists(codexSkill(home, 'demo-review')));
    assert.ok(!exists(path.join(home, '.claude', 'skills')));
  });

  test('never overwrites a foreign skill folder without --force', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    const foreign = claudeSkill(home, 'demo-design');
    fs.mkdirSync(foreign, { recursive: true });
    fs.writeFileSync(path.join(foreign, 'SKILL.md'), 'my own skill\n');

    const res = run(pkg, home, ['install']);
    assert.equal(res.code, 1);
    assert.match(res.stdout, /skip Claude Code skill demo-design/);
    assert.equal(fs.readFileSync(path.join(foreign, 'SKILL.md'), 'utf8'), 'my own skill\n');
    assert.ok(!exists(path.join(foreign, '.mind-set.json')));
    assert.ok(exists(claudeSkill(home, 'demo-review')), 'the other skill is still written');
    const manifest = manifestOf(home);
    assert.deepEqual(manifest.agents.claude.skills, ['demo-review']);
    assert.ok(!manifest.paths.includes(foreign));

    // uninstall leaves the foreign folder alone
    assert.equal(run(pkg, home, ['uninstall']).code, 0);
    assert.equal(fs.readFileSync(path.join(foreign, 'SKILL.md'), 'utf8'), 'my own skill\n');
    assert.ok(!exists(claudeSkill(home, 'demo-review')));
  });

  test('--force replaces a foreign skill and keeps a backup', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    const foreign = claudeSkill(home, 'demo-design');
    fs.mkdirSync(foreign, { recursive: true });
    fs.writeFileSync(path.join(foreign, 'SKILL.md'), 'my own skill\n');

    const res = run(pkg, home, ['install', '--force']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.ok(exists(path.join(foreign, '.mind-set.json')));
    const backups = fs.readdirSync(path.join(home, '.mind-set', 'backup'));
    assert.equal(backups.length, 1);
    assert.match(backups[0], /^claude-demo-design-/);
    const saved = path.join(home, '.mind-set', 'backup', backups[0], 'SKILL.md');
    assert.equal(fs.readFileSync(saved, 'utf8'), 'my own skill\n');
  });

  test('re-install replaces its own skills without --force', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    assert.equal(run(pkg, home, ['install']).code, 0);
    fs.writeFileSync(path.join(claudeSkill(home, 'demo-design'), 'stale.md'), 'old');
    const res = run(pkg, home, ['install']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.ok(!exists(path.join(claudeSkill(home, 'demo-design'), 'stale.md')));
  });

  test('--dry-run prints the actions and writes nothing', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true, codex: true });
    const res = run(pkg, home, ['install', '--dry-run']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.match(res.stdout, /would copy corpus/);
    assert.match(res.stdout, /would write Claude Code skill demo-design/);
    assert.match(res.stdout, /would write Codex skill demo-review/);
    assert.match(res.stdout, /dry run: nothing written/);
    assert.ok(!exists(path.join(home, '.mind-set')));
    assert.ok(!exists(path.join(home, '.claude', 'skills')));
    assert.ok(!exists(path.join(home, '.agents')));
  });

  test('MIND_SET_HOME moves the data folder', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    const data = path.join(home, 'elsewhere');
    const res = run(pkg, home, ['install'], { MIND_SET_HOME: data });
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.ok(exists(path.join(data, '0.1.0', 'openappl.json')));
    assert.ok(exists(path.join(data, 'installed.json')));
    assert.ok(!exists(path.join(home, '.mind-set')));
    const skill = fs.readFileSync(path.join(claudeSkill(home, 'demo-design'), 'SKILL.md'), 'utf8');
    assert.ok(skill.includes(path.join(data, '0.1.0')));
  });
});

describe('uninstall', () => {
  test('removes exactly what install wrote', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true, codex: true });
    assert.equal(run(pkg, home, ['install']).code, 0);
    const otherSkill = claudeSkill(home, 'someone-else');
    fs.mkdirSync(otherSkill, { recursive: true });
    fs.writeFileSync(path.join(otherSkill, 'SKILL.md'), 'not ours\n');

    const res = run(pkg, home, ['uninstall']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    for (const s of SKILLS) {
      assert.ok(!exists(claudeSkill(home, s)));
      assert.ok(!exists(codexSkill(home, s)));
    }
    assert.ok(!exists(path.join(home, '.mind-set')));
    assert.ok(exists(path.join(otherSkill, 'SKILL.md')));
    assert.ok(exists(path.join(home, '.claude')), 'the agent folders stay');
  });

  test('keeps a listed skill folder that lost its marker', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    assert.equal(run(pkg, home, ['install']).code, 0);
    const taken = claudeSkill(home, 'demo-design');
    fs.rmSync(path.join(taken, '.mind-set.json'));
    const res = run(pkg, home, ['uninstall']);
    assert.equal(res.code, 0);
    assert.match(res.stdout, /keep .*demo-design/);
    assert.ok(exists(path.join(taken, 'SKILL.md')));
    assert.ok(!exists(claudeSkill(home, 'demo-review')));
  });

  test('--dry-run removes nothing', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    assert.equal(run(pkg, home, ['install']).code, 0);
    const res = run(pkg, home, ['uninstall', '--dry-run']);
    assert.equal(res.code, 0);
    assert.match(res.stdout, /would remove/);
    assert.ok(exists(claudeSkill(home, 'demo-design')));
    assert.ok(exists(path.join(home, '.mind-set', 'installed.json')));
  });

  test('with nothing installed is a no-op', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    const res = run(pkg, home, ['uninstall']);
    assert.equal(res.code, 0);
    assert.match(res.stdout, /nothing to uninstall/);
  });
});

describe('update', () => {
  test('installs the running version, keeps earlier agents, drops old corpora', () => {
    const home = makeHome({ claude: true });
    const v1 = makePackage('0.1.0');
    assert.equal(run(v1, home, ['install']).code, 0);
    // Codex is not detected; it was installed by choice and update must keep it.
    assert.equal(run(v1, home, ['install', '--codex']).code, 0);

    const v2 = makePackage('0.2.0');
    const res = run(v2, home, ['update']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.match(res.stdout, /remove old corpus .*0\.1\.0/);
    assert.ok(!exists(path.join(home, '.mind-set', '0.1.0')));
    const corpus = path.join(home, '.mind-set', '0.2.0');
    assert.ok(exists(path.join(corpus, 'openappl.json')));
    for (const dir of [claudeSkill, codexSkill]) {
      assert.equal(
        readJson(path.join(dir(home, 'demo-design'), '.mind-set.json')).version,
        '0.2.0',
      );
      const skill = fs.readFileSync(path.join(dir(home, 'demo-design'), 'SKILL.md'), 'utf8');
      assert.ok(skill.includes(corpus));
    }
    const manifest = manifestOf(home);
    assert.equal(manifest.version, '0.2.0');
    assert.deepEqual(manifest.corpora, [corpus]);
    assert.ok(!manifest.paths.some((p) => p.endsWith('0.1.0')));
  });

  test('removes a skill the new version no longer ships', () => {
    const home = makeHome({ claude: true });
    assert.equal(run(makePackage('0.1.0'), home, ['install']).code, 0);
    const v2 = makePackage('0.2.0', { skills: ['demo-design'] });
    const res = run(v2, home, ['update']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.ok(exists(claudeSkill(home, 'demo-design')));
    assert.ok(!exists(claudeSkill(home, 'demo-review')));
    assert.deepEqual(manifestOf(home).agents.claude.skills, ['demo-design']);
  });

  test('keeps a corpus that a not-updated agent still points at', () => {
    const home = makeHome({ claude: true, codex: true });
    assert.equal(run(makePackage('0.1.0'), home, ['install']).code, 0);
    const res = run(makePackage('0.2.0'), home, ['update', '--claude']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.ok(exists(path.join(home, '.mind-set', '0.1.0')), 'codex skills still use 0.1.0');
    assert.equal(
      readJson(path.join(codexSkill(home, 'demo-design'), '.mind-set.json')).version,
      '0.1.0',
    );
    assert.equal(
      readJson(path.join(claudeSkill(home, 'demo-design'), '.mind-set.json')).version,
      '0.2.0',
    );
  });
});

describe('doctor', () => {
  test('reports agents, skills, corpus and OpenAPPL version', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true, codex: true });
    assert.equal(run(pkg, home, ['install']).code, 0);
    const res = run(pkg, home, ['doctor']);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.match(res.stdout, /corpus: 0\.1\.0 at /);
    assert.match(res.stdout, /OpenAPPL: 9\.9\.9-test/);
    assert.match(res.stdout, /Claude Code: detected/);
    assert.match(res.stdout, /Codex: detected/);
    assert.match(res.stdout, /mind-set skills: demo-design \(0\.1\.0\), demo-review \(0\.1\.0\)/);
  });

  test('says what is missing before install', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome();
    const res = run(pkg, home, ['doctor']);
    assert.equal(res.code, 0);
    assert.match(res.stdout, /corpus: not installed/);
    assert.match(res.stdout, /OpenAPPL in this package: 9\.9\.9-test/);
    assert.match(res.stdout, /Claude Code: not detected/);
    assert.match(res.stdout, /Codex: not detected/);
  });

  test('exits 1 when an installed skill went missing', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    assert.equal(run(pkg, home, ['install']).code, 0);
    fs.rmSync(claudeSkill(home, 'demo-review'), { recursive: true });
    const res = run(pkg, home, ['doctor']);
    assert.equal(res.code, 1);
    assert.match(res.stdout, /Claude Code skill demo-review is in the manifest but missing/);
  });
});

describe('command line', () => {
  test('--version prints the package version', () => {
    const res = run(makePackage('1.2.3'), makeHome(), ['--version']);
    assert.equal(res.code, 0);
    assert.equal(res.stdout.trim(), '1.2.3');
  });

  test('--help lists every command', () => {
    const res = run(makePackage('0.1.0'), makeHome(), ['--help']);
    assert.equal(res.code, 0);
    for (const c of ['install', 'update', 'uninstall', 'validate', 'doctor']) {
      assert.match(res.stdout, new RegExp(`mindset ${c}`));
    }
  });

  test('the command is mindset; mind-set stays an alias of the same CLI', () => {
    const { bin } = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'));
    assert.deepEqual(Object.keys(bin).sort(), ['mind-set', 'mindset']);
    assert.equal(bin.mindset, bin['mind-set']);
  });

  test('an unknown command or option exits 2', () => {
    const pkg = makePackage('0.1.0');
    const home = makeHome({ claude: true });
    assert.equal(run(pkg, home, ['instal']).code, 2);
    const res = run(pkg, home, ['install', '--claud']);
    assert.equal(res.code, 2);
    assert.match(res.stderr, /unknown option for install: --claud/);
    assert.ok(!exists(path.join(home, '.mind-set')));
  });
});
