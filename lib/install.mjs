// install / update / uninstall / doctor for the mind-set package.
//
// Layout on the machine:
//   <data>/<version>/          the corpus of that package version
//   <data>/current             link to the corpus the skills point at
//   <data>/installed.json      the manifest: every path install wrote
//   <claude>/skills/<skill>/   Claude Code skills (<claude> = ~/.claude)
//   <agents>/skills/<skill>/   Codex skills (<agents> = ~/.agents)
// <data> is ~/.mind-set unless MIND_SET_HOME names another folder. Each skill
// folder mind-set writes carries a `.mind-set.json` marker, so a folder of the
// same name that someone else wrote is recognised and left alone.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const PACKAGE_NAME = 'mind-set';
export const MARKER = '.mind-set.json';
export const MANIFEST = 'installed.json';
export const CORPUS_PLACEHOLDER = '{{CORPUS}}';
const VERSION_DIR = /^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$/;

/** Resolves every location from the environment (HOME, MIND_SET_HOME, PATH). */
export function resolveContext({ env = process.env, pkgRoot, version, out, dryRun = false }) {
  const home = env.HOME || env.USERPROFILE || os.homedir();
  const dataDir = env.MIND_SET_HOME
    ? path.resolve(env.MIND_SET_HOME)
    : path.join(home, '.mind-set');
  return {
    home,
    dataDir,
    pathEnv: env.PATH || env.Path || '',
    pkgRoot,
    version,
    dryRun,
    out,
    agents: {
      claude: {
        name: 'claude',
        label: 'Claude Code',
        configDir: path.join(home, '.claude'),
        skillsDir: path.join(home, '.claude', 'skills'),
      },
      codex: {
        name: 'codex',
        label: 'Codex',
        configDir: path.join(home, '.codex'),
        skillsDir: path.join(home, '.agents', 'skills'),
      },
    },
  };
}

function onPath(ctx, binary) {
  const exts = process.platform === 'win32' ? ['', '.exe', '.cmd', '.bat'] : [''];
  for (const dir of ctx.pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      try {
        if (fs.statSync(path.join(dir, binary + ext)).isFile()) return true;
      } catch {
        // not in this PATH entry
      }
    }
  }
  return false;
}

/** Which agents are on this machine, and why we think so. */
export function detectAgents(ctx) {
  const found = {};
  const claude = ctx.agents.claude;
  found.claude = exists(claude.configDir) ? `found ${claude.configDir}` : null;
  const codex = ctx.agents.codex;
  if (exists(codex.configDir)) found.codex = `found ${codex.configDir}`;
  else if (onPath(ctx, 'codex')) found.codex = 'found codex on PATH';
  else found.codex = null;
  return found;
}

function exists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

export function readManifest(ctx) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ctx.dataDir, MANIFEST), 'utf8'));
  } catch {
    return null;
  }
}

function readMarker(dir) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dir, MARKER), 'utf8'));
    return m && m.package === PACKAGE_NAME ? m : null;
  } catch {
    return null;
  }
}

function packageSkills(ctx) {
  const dir = path.join(ctx.pkgRoot, 'skills');
  let names = [];
  try {
    names = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && exists(path.join(dir, d.name, 'SKILL.md')))
      .map((d) => d.name)
      .sort();
  } catch {
    // no skills folder
  }
  return { dir, names };
}

/** Reads `__patternsVersion` from the corpus copy of openappl.json. */
export function corpusSchemaPath(corpusDir) {
  for (const rel of ['openappl.json', path.join('schema', 'openappl.json')]) {
    const p = path.join(corpusDir, rel);
    if (exists(p)) return p;
  }
  return null;
}

export function openapplVersion(corpusDir) {
  const p = corpusDir ? corpusSchemaPath(corpusDir) : null;
  if (!p) return null;
  try {
    const v = JSON.parse(fs.readFileSync(p, 'utf8')).__patternsVersion;
    return typeof v === 'string' ? v : null;
  } catch {
    return null;
  }
}

function copyDir(src, dest, transform) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d, transform);
    else if (entry.isFile()) {
      if (transform && entry.name.endsWith('.md')) {
        fs.writeFileSync(d, transform(fs.readFileSync(s, 'utf8')));
      } else fs.copyFileSync(s, d);
    }
  }
}

function remove(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

/** Points `<data>/current` at the corpus: a symlink (a junction on Windows), else a copy. */
function linkCurrent(ctx, corpusDir) {
  const current = path.join(ctx.dataDir, 'current');
  remove(current);
  try {
    fs.symlinkSync(corpusDir, current, process.platform === 'win32' ? 'junction' : 'dir');
  } catch {
    copyDir(corpusDir, current);
  }
  return current;
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/**
 * Which agents a command writes to. Explicit flags win (and force an agent
 * that is not detected); with no flag, every detected agent; for `update`,
 * also every agent the previous install wrote to.
 */
export function chooseAgents(ctx, flags, { includeManifest = false } = {}) {
  const chosen = [];
  if (flags.claude) chosen.push('claude');
  if (flags.codex) chosen.push('codex');
  if (chosen.length) return chosen;
  const detected = detectAgents(ctx);
  const set = new Set(Object.keys(detected).filter((a) => detected[a]));
  if (includeManifest) {
    for (const a of Object.keys(readManifest(ctx)?.agents ?? {})) {
      if (ctx.agents[a]) set.add(a);
    }
  }
  return ['claude', 'codex'].filter((a) => set.has(a));
}

/**
 * Copies the corpus and writes the skills for `agentNames`. Returns the exit
 * code: 0 when everything chosen was written, 1 when a foreign skill blocked a
 * write or the package is incomplete.
 */
export function install(ctx, agentNames, { force = false } = {}) {
  const say = ctx.out;
  const act = (msg) => say(`${ctx.dryRun ? 'would ' : ''}${msg}`);
  const srcCorpus = path.join(ctx.pkgRoot, 'corpus');
  const skills = packageSkills(ctx);
  if (!exists(srcCorpus)) {
    say(`error: this package has no corpus/ folder (${srcCorpus})`);
    return 1;
  }
  if (skills.names.length === 0) {
    say(`error: this package has no skills under ${skills.dir}`);
    return 1;
  }
  if (agentNames.length === 0) {
    say(
      'error: no supported agent found (looked for ~/.claude, ~/.codex and codex on PATH).\n' +
        'Re-run with --claude and/or --codex to install for an agent anyway.',
    );
    return 1;
  }

  const previous = readManifest(ctx);
  const corpusDir = path.join(ctx.dataDir, ctx.version);
  act(`copy corpus ${srcCorpus} -> ${corpusDir}`);
  if (!ctx.dryRun) {
    remove(corpusDir);
    copyDir(srcCorpus, corpusDir);
  }
  const current = path.join(ctx.dataDir, 'current');
  act(`link ${current} -> ${corpusDir}`);
  if (!ctx.dryRun) linkCurrent(ctx, corpusDir);

  const fill = (text) => text.split(CORPUS_PLACEHOLDER).join(corpusDir);
  const agents = { ...(previous?.agents ?? {}) };
  let blocked = 0;
  const stamp = new Date().toISOString();
  for (const name of agentNames) {
    const agent = ctx.agents[name];
    const written = [];
    for (const skill of skills.names) {
      const dest = path.join(agent.skillsDir, skill);
      const ours = readMarker(dest);
      if (exists(dest) && !ours) {
        if (!force) {
          say(
            `skip ${agent.label} skill ${skill}: ${dest} exists and was not written by mind-set ` +
              '(use --force to replace it; the old folder is kept as a backup)',
          );
          blocked++;
          continue;
        }
        const backup = path.join(
          ctx.dataDir,
          'backup',
          `${name}-${skill}-${stamp.replace(/[:.]/g, '-')}`,
        );
        act(`back up foreign ${dest} -> ${backup}`);
        if (!ctx.dryRun) {
          fs.mkdirSync(path.dirname(backup), { recursive: true });
          fs.cpSync(dest, backup, { recursive: true });
        }
      }
      act(`write ${agent.label} skill ${skill} -> ${dest}`);
      if (!ctx.dryRun) {
        remove(dest);
        copyDir(path.join(skills.dir, skill), dest, fill);
        fs.writeFileSync(
          path.join(dest, MARKER),
          `${JSON.stringify({ package: PACKAGE_NAME, version: ctx.version, corpus: corpusDir }, null, 2)}\n`,
        );
      }
      written.push(skill);
    }
    // A skill the previous install wrote and this version no longer ships.
    for (const old of previous?.agents?.[name]?.skills ?? []) {
      if (skills.names.includes(old)) continue;
      const dest = path.join(agent.skillsDir, old);
      if (!readMarker(dest)) continue;
      act(`remove retired ${agent.label} skill ${old} (${dest})`);
      if (!ctx.dryRun) remove(dest);
    }
    agents[name] = {
      skillsDir: agent.skillsDir,
      corpus: corpusDir,
      version: ctx.version,
      skills: written,
    };
  }

  const manifest = {
    package: PACKAGE_NAME,
    version: ctx.version,
    openapplVersion: openapplVersion(srcCorpus),
    installedAt: stamp,
    dataDir: ctx.dataDir,
    corpus: corpusDir,
    current,
    corpora: [...new Set([...(previous?.corpora ?? []), corpusDir])],
    agents,
  };
  manifest.paths = [
    ...manifest.corpora,
    current,
    ...Object.values(agents).flatMap((a) => a.skills.map((s) => path.join(a.skillsDir, s))),
  ];
  act(`record ${manifest.paths.length} paths in ${path.join(ctx.dataDir, MANIFEST)}`);
  if (!ctx.dryRun) {
    fs.mkdirSync(ctx.dataDir, { recursive: true });
    fs.writeFileSync(path.join(ctx.dataDir, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  }
  const done = agentNames.map((a) => ctx.agents[a].label).join(', ');
  say(
    `${ctx.dryRun ? 'dry run: nothing written. ' : ''}mind-set ${ctx.version}: ` +
      `${plural(skills.names.length, 'skill')} for ${done}; corpus at ${corpusDir}` +
      (blocked ? `; ${plural(blocked, 'skill')} skipped` : ''),
  );
  return blocked ? 1 : 0;
}

/** Install, then delete every corpus version no installed skill points at. */
export function update(ctx, agentNames, opts = {}) {
  const code = install(ctx, agentNames, opts);
  if (code !== 0 && !readManifest(ctx)) return code;
  const manifest = readManifest(ctx);
  const keep = new Set([path.join(ctx.dataDir, ctx.version)]);
  for (const a of Object.values(manifest?.agents ?? {})) if (a.corpus) keep.add(a.corpus);
  let entries = [];
  try {
    entries = fs.readdirSync(ctx.dataDir, { withFileTypes: true });
  } catch {
    // nothing installed yet (dry run)
  }
  const removed = [];
  for (const e of entries) {
    if (!e.isDirectory() || !VERSION_DIR.test(e.name)) continue;
    const dir = path.join(ctx.dataDir, e.name);
    if (keep.has(dir)) continue;
    ctx.out(`${ctx.dryRun ? 'would ' : ''}remove old corpus ${dir}`);
    if (!ctx.dryRun) remove(dir);
    removed.push(dir);
  }
  if (manifest && removed.length && !ctx.dryRun) {
    manifest.corpora = (manifest.corpora ?? []).filter((c) => !removed.includes(c));
    manifest.paths = (manifest.paths ?? []).filter((p) => !removed.includes(p));
    fs.writeFileSync(path.join(ctx.dataDir, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  }
  return code;
}

/** Removes exactly what the manifest lists; a skill folder must still carry our marker. */
export function uninstall(ctx) {
  const manifest = readManifest(ctx);
  if (!manifest) {
    ctx.out(`nothing to uninstall: no ${path.join(ctx.dataDir, MANIFEST)}`);
    return 0;
  }
  const act = (msg) => ctx.out(`${ctx.dryRun ? 'would ' : ''}${msg}`);
  const skillDirs = new Set(
    Object.values(manifest.agents ?? {}).flatMap((a) =>
      (a.skills ?? []).map((s) => path.join(a.skillsDir, s)),
    ),
  );
  const inData = (p) => {
    const rel = path.relative(ctx.dataDir, p);
    return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  };
  for (const p of manifest.paths ?? []) {
    if (!exists(p)) continue;
    if (skillDirs.has(p)) {
      if (!readMarker(p)) {
        ctx.out(`keep ${p}: it no longer carries the mind-set marker`);
        continue;
      }
    } else if (!inData(p)) {
      ctx.out(`keep ${p}: outside ${ctx.dataDir} and not a mind-set skill`);
      continue;
    }
    act(`remove ${p}`);
    if (!ctx.dryRun) remove(p);
  }
  act(`remove ${path.join(ctx.dataDir, MANIFEST)}`);
  if (!ctx.dryRun) {
    remove(path.join(ctx.dataDir, MANIFEST));
    try {
      const left = fs.readdirSync(ctx.dataDir);
      if (left.length === 0) fs.rmdirSync(ctx.dataDir);
      else ctx.out(`kept ${ctx.dataDir} (it still holds: ${left.join(', ')})`);
    } catch {
      // already gone
    }
  }
  ctx.out(`${ctx.dryRun ? 'dry run: nothing removed. ' : ''}mind-set uninstalled`);
  return 0;
}

/** Prints what is installed where. Exit 1 when the install is damaged. */
export function doctor(ctx) {
  const say = ctx.out;
  const detected = detectAgents(ctx);
  const manifest = readManifest(ctx);
  const problems = [];
  say(`mind-set ${ctx.version} (this package)`);
  say(`data folder: ${ctx.dataDir}`);
  if (manifest) {
    const corpus = manifest.corpus;
    const ok = corpus && exists(corpus);
    say(`corpus: ${manifest.version} at ${corpus}${ok ? '' : ' (MISSING)'}`);
    if (!ok) problems.push(`corpus folder ${corpus} is missing`);
    const ov = openapplVersion(corpus);
    say(`OpenAPPL: ${ov ?? 'unknown (no openappl.json in the corpus)'}`);
    if (manifest.version !== ctx.version) {
      say(
        `note: installed ${manifest.version}, this package is ${ctx.version}; run "mind-set update"`,
      );
    }
  } else {
    say('corpus: not installed (run "mind-set install")');
    const ov = openapplVersion(path.join(ctx.pkgRoot, 'corpus'));
    if (ov) say(`OpenAPPL in this package: ${ov}`);
  }
  say('agents:');
  for (const name of ['claude', 'codex']) {
    const agent = ctx.agents[name];
    const how = detected[name] ? `detected (${detected[name]})` : 'not detected';
    say(`  ${agent.label}: ${how}; skills folder ${agent.skillsDir}`);
    const listed = manifest?.agents?.[name]?.skills ?? [];
    const onDisk = [];
    try {
      for (const d of fs.readdirSync(agent.skillsDir, { withFileTypes: true })) {
        const m = d.isDirectory() ? readMarker(path.join(agent.skillsDir, d.name)) : null;
        if (m) onDisk.push(`${d.name} (${m.version})`);
      }
    } catch {
      // no skills folder
    }
    say(`    mind-set skills: ${onDisk.length ? onDisk.sort().join(', ') : 'none'}`);
    for (const s of listed) {
      if (!readMarker(path.join(agent.skillsDir, s))) {
        problems.push(`${agent.label} skill ${s} is in the manifest but missing or replaced`);
      }
    }
  }
  if (problems.length) {
    say('problems:');
    for (const p of problems) say(`  - ${p}`);
    say('run "mind-set install" (or "mind-set update") to repair');
    return 1;
  }
  return 0;
}
