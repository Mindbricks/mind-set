// spec-coverage.mjs: prove that every design document produced an artifact
// in the blueprint. Zero dependencies, Node >= 18.
//
// The check reads the BLUEPRINT, never a plan. A spec whose target is empty
// is a gap even when a session announced it was writing it: an intention is
// not an artifact. The only way past a gap is a RECORDED decline in the
// spec ledger, carrying non-empty reason / by / at strings a later session
// can read. A document with no coverage rule is a gap too, except the
// narrative, source and test documents below.
//
// The rules are pure; the blueprint is reached through a SOURCE:
//   { read(path) -> node | null, rosterNames: string[], frontendRevision?() -> string | null }
// (each may return a promise). `localBlueprintSource(blueprint)` builds one
// over a parsed blueprint file. A source without `frontendRevision` cannot see
// a frontend repository, so the frontend document is reported NOT_CHECKED
// (and listed in `notChecked`) instead of being called empty.
//
// Verdict: ok = no EMPTY, UNMAPPED or ERROR row. Exit 0 = ok, 1 = a gap or an
// error row, 2 = a usage error.
//
// A fork of the structural checks of an agent harness built on OpenAPPL: the
// same rules, verdicts and exit codes, proven by a parity test in the source
// repository that runs both on the same fixtures.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { blueprintSecretWarnings } from './secrets.mjs';

export const EXIT_COVERAGE = Object.freeze({ OK: 0, GAP: 1, USAGE: 2 });

/**
 * doc basename (no .md) -> what proves it was implemented.
 *   path        blueprint path to read
 *   collection  when set, that key must hold at least one entry. A node that
 *               carries other content but not this key is an ERROR (the gate
 *               cannot see the collection), never a silent EMPTY.
 *   ignoreKeys  keys that a seeded-but-unwritten module carries anyway: the
 *               chapter's own settings beside the collection (a local
 *               blueprint has `notificationService.serviceSettings` without
 *               any `eventNotifications`: that is an EMPTY chapter, not a
 *               collection the gate cannot see)
 *   narrative   the doc produces no blueprint artifact by design
 *   roster      resolve against the service roster
 *   frontend    the artifact is a frontend repository, not the blueprint
 * A doc named `service-spec-<key>` resolves against the roster by key.
 */
export const COVERAGE_RULES = Object.freeze({
  'project-basic-setup': { path: 'projectSettings' },
  'auth-spec': { path: 'authentication' },
  'bff-spec': { path: 'bffService', collection: 'dataViews', ignoreKeys: ['_name', 'serviceSettings'] },
  'agent-hub-spec': { path: 'agentHub', collection: 'aiAgents', ignoreKeys: ['_name', 'hubSettings'] },
  'notification-definitions': { path: 'notificationService', collection: 'eventNotifications', ignoreKeys: ['_name', 'serviceSettings', 'whatsappIngress'] },
  'frontend-spec': { frontend: true },
  'microservice-definitions': { roster: true },
  prd: { narrative: true },
  'use-cases': { narrative: true },
  'user-stories': { narrative: true },
  'project-description-report': { narrative: true },
  'interview-record': { narrative: true },
  'test-plan': { narrative: true },
  'test-report': { narrative: true },
});

export const SERVICE_SPEC_PREFIX = 'service-spec-';

/** The rule of one document, or null (UNMAPPED). */
export function coverageRule(doc) {
  if (Object.prototype.hasOwnProperty.call(COVERAGE_RULES, doc)) return COVERAGE_RULES[doc];
  return doc.startsWith(SERVICE_SPEC_PREFIX) ? { service: doc.slice(SERVICE_SPEC_PREFIX.length) } : null;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/** A ledger entry that clears a gap: disposition declined with reason, by and at. */
export function validDecline(entry) {
  return entry?.disposition === 'declined' && [entry.reason, entry.by, entry.at].every(nonEmptyString);
}

/** The ledger at `file`, or {} when it is missing or unreadable. */
export function readLedger(file) {
  try {
    const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
    return ledger && typeof ledger === 'object' && !Array.isArray(ledger) ? ledger : {};
  } catch {
    return {};
  }
}

/**
 * Record a decline for one document; returns the entry written. Throws when
 * reason or by is empty.
 */
export function declineInLedger(file, doc, { reason, by, at = new Date().toISOString() }) {
  if (!nonEmptyString(doc) || !nonEmptyString(reason) || !nonEmptyString(by)) {
    throw new Error('a decline needs a document, a reason and a by');
  }
  const ledger = readLedger(file);
  ledger[doc] = { disposition: 'declined', reason, by, at };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(ledger, null, 2) + '\n');
  return ledger[doc];
}

/** The document names (basenames without .md, sorted) of a folder; throws when it cannot be read. */
export function listDocs(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -3))
    .sort();
}

/** The service names of a parsed blueprint (services[].serviceSettings.serviceBasics.name). */
export function blueprintServiceNames(blueprint) {
  const services = blueprint && Array.isArray(blueprint.services) ? blueprint.services : [];
  return services
    .map((s) => s?.serviceSettings?.serviceBasics?.name)
    .filter((n) => typeof n === 'string' && n.length > 0);
}

/**
 * A source over a parsed blueprint file. A chapter the blueprint does not
 * have reads as an empty node. It cannot see a frontend repository.
 */
export function localBlueprintSource(blueprint) {
  const root = blueprint && typeof blueprint === 'object' && !Array.isArray(blueprint) ? blueprint : {};
  return {
    read(p) {
      const node = root[p];
      return node && typeof node === 'object' ? node : {};
    },
    rosterNames: blueprintServiceNames(root),
  };
}

/** "knowledge-base" and "knowledgeBase" compare equal. */
const normName = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** One row per document: { doc, target, status, note }. */
export async function coverageRows(docs, source, ledger = {}) {
  const rosterNames = source.rosterNames ?? [];
  const rows = [];
  for (const doc of docs) {
    const rule = coverageRule(doc);
    if (!rule) {
      rows.push({ doc, target: '—', status: 'UNMAPPED', note: 'no coverage rule; add one or record a decline' });
      continue;
    }
    if (rule.narrative) {
      rows.push({ doc, target: '—', status: 'NARRATIVE', note: 'produces no blueprint artifact' });
      continue;
    }
    if (rule.roster) {
      rows.push({
        doc,
        target: 'services/*',
        status: rosterNames.length ? 'IMPLEMENTED' : 'EMPTY',
        note: rosterNames.join(', ') || 'no services authored',
      });
      continue;
    }
    if (rule.frontend) {
      if (typeof source.frontendRevision !== 'function') {
        rows.push({ doc, target: 'frontend repo', status: 'NOT_CHECKED', note: 'the frontend is not part of the blueprint; this check cannot see it' });
        continue;
      }
      const rev = await source.frontendRevision();
      rows.push({
        doc,
        target: 'frontend repo',
        status: rev ? 'IMPLEMENTED' : 'EMPTY',
        note: rev ? `revision ${String(rev).slice(0, 8)}` : 'no frontend repo',
      });
      continue;
    }
    if (rule.service) {
      const hit = rosterNames.find((n) => normName(n) === normName(rule.service));
      rows.push({
        doc,
        target: hit ? `services/${hit}` : `services/${rule.service}`,
        status: hit ? 'IMPLEMENTED' : 'EMPTY',
        note: hit ? '' : 'no service of this name in the blueprint',
      });
      continue;
    }

    const node = await source.read(rule.path);
    if (node === null || node === undefined) {
      rows.push({ doc, target: rule.path, status: 'EMPTY', note: 'path unreadable' });
      continue;
    }
    let implemented;
    let note = '';
    if (rule.collection) {
      const coll = node[rule.collection];
      if (coll === undefined) {
        // The chapter holds content but not the key this rule reads: the key
        // was renamed (or mis-declared). Reporting EMPTY would call a present
        // artifact missing and teach sessions to override the gate.
        const others = Object.keys(node).filter((k) => !k.startsWith('_') && !(rule.ignoreKeys ?? []).includes(k));
        if (others.length > 0) {
          rows.push({
            doc,
            target: `${rule.path}.${rule.collection}`,
            status: 'ERROR',
            note: `this gate cannot see collection ${rule.collection} (${rule.path} carries: ${others.join(', ')})`,
          });
          continue;
        }
      }
      const count = coll && typeof coll === 'object' ? Object.keys(coll).filter((k) => !k.startsWith('_')).length : 0;
      implemented = count > 0;
      note = `${count} ${rule.collection}`;
    } else {
      const keys = Object.keys(node).filter((k) => !k.startsWith('_') && !(rule.ignoreKeys ?? []).includes(k));
      implemented = keys.length > 0;
      note = `${keys.length} keys`;
    }
    rows.push({
      doc,
      target: rule.path + (rule.collection ? `.${rule.collection}` : ''),
      status: implemented ? 'IMPLEMENTED' : 'EMPTY',
      note,
    });
  }

  for (const row of rows) {
    const d = ledger[row.doc];
    if ((row.status === 'EMPTY' || row.status === 'UNMAPPED') && validDecline(d)) {
      row.status = 'DECLINED';
      row.note = `${d.reason} — ${d.by}, ${String(d.at).slice(0, 10)}`;
    }
  }
  return rows;
}

/** The verdict of a row set: { missing, declined, errors, notChecked, ok } (doc names). */
export function coverageVerdict(rows) {
  const names = (status) => rows.filter((r) => status.includes(r.status)).map((r) => r.doc);
  const missing = names(['EMPTY', 'UNMAPPED']);
  const errors = names(['ERROR']);
  return {
    missing,
    declined: names(['DECLINED']),
    errors,
    notChecked: names(['NOT_CHECKED']),
    ok: missing.length === 0 && errors.length === 0,
  };
}

/** Secret-shaped literals of the blueprint (see secrets.mjs); they never change the verdict. */
export function coverageWarnings(blueprint) {
  return blueprintSecretWarnings(blueprint);
}

/** The human table, one line per row, plus the summary lines. */
export function coverageReportLines(rows, verdict, { declareCommand = 'spec-coverage --declare' } = {}) {
  const lines = [];
  const w = Math.max(...rows.map((r) => r.doc.length), 4);
  for (const r of rows) lines.push(`${r.doc.padEnd(w)}  ${r.status.padEnd(12)} ${r.target}${r.note ? `  (${r.note})` : ''}`);
  lines.push('');
  if (verdict.ok) {
    lines.push(`spec coverage OK — ${rows.length} documents, ${verdict.declined.length} declined with a recorded reason`);
    return lines;
  }
  if (verdict.errors.length > 0) {
    lines.push(
      `SPEC COVERAGE GATE ERROR - ${verdict.errors.length} collection(s) the gate cannot see (a gate bug, not a missing artifact; a decline cannot clear it):`,
    );
    for (const r of rows.filter((x) => x.status === 'ERROR')) lines.push(`  ${r.doc} -> ${r.note}`);
    if (verdict.missing.length === 0) return lines;
    lines.push('');
  }
  lines.push(`SPEC COVERAGE GAP — ${verdict.missing.length} document(s) produced no artifact:`);
  for (const r of rows.filter((x) => x.status === 'EMPTY' || x.status === 'UNMAPPED')) {
    lines.push(`  ${r.doc} -> ${r.status === 'UNMAPPED' ? r.note : `${r.target} is empty`}`);
  }
  lines.push('');
  lines.push('Author the artifact (add a coverage rule for an unmapped document), or record why it is correct to skip:');
  lines.push(`  ${declareCommand} ${verdict.missing[0]} --reason "<why>" --by "<who>"`);
  return lines;
}
