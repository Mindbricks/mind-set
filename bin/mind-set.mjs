#!/usr/bin/env node
// mind-set: install the OpenAPPL blueprint skills for coding agents, and check
// a blueprint against openappl.json. Zero dependencies, Node >= 18.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chooseAgents,
  corpusSchemaPath,
  doctor,
  install,
  readManifest,
  resolveContext,
  uninstall,
  update,
} from '../lib/install.mjs';
import { SEMANTIC_NOTE, formatProblem, loadSchema, validateBlueprint } from '../lib/validate.mjs';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));

const out = (line) => process.stdout.write(`${line}\n`);
const err = (line) => process.stderr.write(`${line}\n`);

const HELP = `mind-set ${pkg.version}: OpenAPPL blueprint skills for coding agents

Usage:
  mind-set install [--claude] [--codex] [--force] [--dry-run]
  mind-set update [--claude] [--codex] [--force] [--dry-run]
  mind-set uninstall [--dry-run]
  mind-set validate <blueprint.json>... [--schema <openappl.json>] [--root <Class>] [--json]
  mind-set doctor
  mind-set --version | --help

install    copies the document corpus to ~/.mind-set/<version>/ (linked as
           ~/.mind-set/current) and writes the skills to every detected agent:
           Claude Code (~/.claude/skills) and Codex (~/.agents/skills).
           --claude / --codex pick the agents (and install even when the agent
           is not detected). A skill folder that mind-set did not write is never
           replaced unless --force is given (the old folder is backed up).
update     install for this package version (and every agent installed before),
           then delete older corpus versions.
uninstall  removes only what install recorded in ~/.mind-set/installed.json.
validate   structural check of a blueprint against openappl.json (the installed
           corpus copy, this package's copy, or --schema). Prints one line per
           problem, "ERROR <json.path> <rule> <message>", and exits 1 on errors.
           --root validates a fragment (for example --root Service).
doctor     lists the detected agents, the installed skills, the corpus version
           and its OpenAPPL version.

Environment: HOME is where the agents live; MIND_SET_HOME moves ~/.mind-set.`;

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  const valued = new Set(['schema', 'root']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const name = (eq === -1 ? a.slice(2) : a.slice(2, eq)).replace(/-([a-z])/g, (_, c) =>
        c.toUpperCase(),
      );
      if (eq !== -1) flags[name] = a.slice(eq + 1);
      else if (valued.has(name)) {
        if (i + 1 >= argv.length) throw new Error(`--${name} needs a value`);
        flags[name] = argv[++i];
      } else flags[name] = true;
    } else if (a === '-h') flags.help = true;
    else if (a === '-v') flags.version = true;
    else positional.push(a);
  }
  return { flags, positional };
}

const KNOWN_FLAGS = {
  install: ['claude', 'codex', 'force', 'dryRun'],
  update: ['claude', 'codex', 'force', 'dryRun'],
  uninstall: ['dryRun'],
  validate: ['schema', 'root', 'json'],
  doctor: [],
};

function findSchema(ctx, flags) {
  if (flags.schema) return path.resolve(String(flags.schema));
  const manifest = readManifest(ctx);
  const candidates = [
    manifest?.corpus,
    path.join(ctx.dataDir, 'current'),
    path.join(pkgRoot, 'corpus'),
  ].filter(Boolean);
  for (const dir of candidates) {
    const p = corpusSchemaPath(dir);
    if (p) return p;
  }
  return null;
}

function runValidate(ctx, files, flags) {
  if (files.length === 0) {
    err('error: validate needs at least one blueprint file');
    return 2;
  }
  const schemaPath = findSchema(ctx, flags);
  if (!schemaPath) {
    err('error: no openappl.json found; run "mind-set install" or pass --schema <path>');
    return 2;
  }
  let schema;
  try {
    schema = loadSchema(JSON.parse(fs.readFileSync(schemaPath, 'utf8')));
  } catch (e) {
    err(`error: cannot read the schema ${schemaPath}: ${e.message}`);
    return 2;
  }
  const root = flags.root ? String(flags.root) : undefined;
  const results = [];
  for (const file of files) {
    let blueprint;
    let problems;
    try {
      blueprint = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      const rule = e.code ? 'file' : 'json-parse';
      problems = [{ level: 'error', path: '$', rule, message: e.message }];
    }
    if (!problems) problems = validateBlueprint(schema, blueprint, root).problems;
    results.push({
      file,
      errors: problems.filter((p) => p.level === 'error').length,
      warnings: problems.filter((p) => p.level === 'warning').length,
      problems,
    });
  }
  const failed = results.some((r) => r.errors > 0);
  if (flags.json) {
    out(
      JSON.stringify(
        {
          schema: schemaPath,
          openapplVersion: schema.version,
          valid: !failed,
          results,
          note: SEMANTIC_NOTE,
        },
        null,
        2,
      ),
    );
  } else {
    out(`schema: ${schemaPath} (OpenAPPL ${schema.version ?? 'unknown'})`);
    for (const r of results) {
      if (results.length > 1) out(`# ${r.file}`);
      for (const p of r.problems) out(formatProblem(p));
      out(
        `${r.file}: ${r.errors} error${r.errors === 1 ? '' : 's'}, ${r.warnings} warning${r.warnings === 1 ? '' : 's'}`,
      );
    }
    out(`note: ${SEMANTIC_NOTE}`);
  }
  return failed ? 1 : 0;
}

function main(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (e) {
    err(`error: ${e.message}`);
    return 2;
  }
  const { flags, positional } = parsed;
  if (flags.version) {
    out(pkg.version);
    return 0;
  }
  const command = positional[0];
  if (flags.help || !command || command === 'help') {
    out(HELP);
    return command || flags.help ? 0 : 2;
  }
  if (!KNOWN_FLAGS[command]) {
    err(`error: unknown command "${command}" (see mind-set --help)`);
    return 2;
  }
  const unknown = Object.keys(flags).filter((f) => !KNOWN_FLAGS[command].includes(f));
  if (unknown.length) {
    err(`error: unknown option for ${command}: ${unknown.map((f) => `--${f}`).join(', ')}`);
    return 2;
  }
  const ctx = resolveContext({ pkgRoot, version: pkg.version, out, dryRun: flags.dryRun === true });
  switch (command) {
    case 'install':
      return install(ctx, chooseAgents(ctx, flags), { force: flags.force === true });
    case 'update':
      return update(ctx, chooseAgents(ctx, flags, { includeManifest: true }), {
        force: flags.force === true,
      });
    case 'uninstall':
      return uninstall(ctx);
    case 'doctor':
      return doctor(ctx);
    case 'validate':
      return runValidate(ctx, positional.slice(1), flags);
    default:
      return 2;
  }
}

process.exitCode = main(process.argv.slice(2));
