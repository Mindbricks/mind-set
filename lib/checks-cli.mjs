// checks-cli.mjs: the `mindset design-check` and `mindset spec-coverage`
// commands over local files. The rules are design-check.mjs and
// spec-coverage.mjs; this file only reads the files, prints and picks the
// exit code. Zero dependencies, Node >= 18.

import fs from 'node:fs';
import path from 'node:path';
import { EXIT_FINDINGS, checkDesignDraft, fanOutDoc, parseDesignPipeline, resolveDocName, rosterNamesOf } from './design-check.mjs';
import {
  EXIT_COVERAGE,
  coverageReportLines,
  coverageRows,
  coverageVerdict,
  coverageWarnings,
  declineInLedger,
  listDocs,
  localBlueprintSource,
  readLedger,
} from './spec-coverage.mjs';

/** The design folder the skills write to (design/<docName>.md). */
export const DEFAULT_DESIGN_DIR = 'design';
/** The blueprint file the skills write. */
export const DEFAULT_BLUEPRINT = 'blueprint.json';
/** The pipeline inside the corpus. */
export const PIPELINE_IN_CORPUS = path.join('procedures', 'design', 'pipeline.json');

export const DESIGN_CHECK_NOTE =
  'Structure only: document names, required sections, the service roster and event table, the ' +
  'interview Status and Coverage Ledger, and the test-plan target. Whether the content is right ' +
  'is for the review, the user and, later, a compiler.';

export const SPEC_COVERAGE_NOTE =
  'Coverage only: each design document has a non-empty target in the blueprint (or a recorded ' +
  'decline). Whether the target says what the document asks for is for the review.';

/** A usage error: stderr, and with --json the report shape `{ ok: false, error }` on stdout. */
function usage(io, flags, message, details = {}) {
  io.err(`error: ${message}`);
  if (flags.json) io.out(JSON.stringify({ ok: false, error: message, ...details }, null, 2));
  return 2;
}

function readPipeline(pipelinePath) {
  return parseDesignPipeline(fs.readFileSync(pipelinePath, 'utf8'), pipelinePath);
}

/**
 * mindset design-check <docName> [<draft.md>] [--dir <folder>] [--roster <file>] [--pipeline <file>] [--json]
 * exit 0 no finding, 2 findings or a usage error (the JSON then has `error` and no `findings`).
 */
export function runDesignCheck(io, positional, flags, pipelinePath) {
  const [docName, givenPath, ...extra] = positional;
  if (!docName || extra.length) return usage(io, flags, 'usage: mindset design-check <docName> [<draft.md>] (see mindset --help)');
  const dir = path.resolve(String(flags.dir ?? DEFAULT_DESIGN_DIR));
  const draftDefaulted = !givenPath;
  if (draftDefaulted && /[\\/]|\.\./.test(docName)) {
    return usage(io, flags, `"${docName}" is not a plain doc name, so there is no default draft path; pass <draft.md>`, { docName });
  }
  if (!pipelinePath) return usage(io, flags, 'no design pipeline found; run "mindset install" or pass --pipeline <pipeline.json>');
  let p;
  try {
    p = readPipeline(pipelinePath);
  } catch (e) {
    return usage(io, flags, e.message);
  }
  const draftPath = path.resolve(givenPath ?? path.join(dir, `${docName}.md`));
  let content;
  try {
    content = fs.readFileSync(draftPath, 'utf8');
  } catch (e) {
    return usage(io, flags, `cannot read the draft ${draftPath} (${e.code ?? e.message})`, { docName, draftPath, draftDefaulted });
  }

  let rosterNames = null;
  let rosterPath = null;
  const resolved = resolveDocName(p, docName);
  if (resolved.kind === 'fixed' && resolved.doc.structure?.type === 'test-plan') {
    const rosterDoc = fanOutDoc(p)?.fanOut?.roster ?? 'microservice-definitions';
    const candidate = flags.roster ? path.resolve(String(flags.roster)) : path.join(dir, `${rosterDoc}.md`);
    if (fs.existsSync(candidate)) {
      rosterPath = candidate;
      rosterNames = rosterNamesOf(p, fs.readFileSync(candidate, 'utf8'));
    } else if (flags.roster) {
      return usage(io, flags, `cannot read the roster ${candidate}`, { docName, rosterPath: candidate });
    }
  }

  const report = checkDesignDraft(p, docName, content, {
    rosterNames,
    rosterHint: `pass --roster <file>, or write ${path.join(DEFAULT_DESIGN_DIR, 'microservice-definitions.md')} first`,
  });
  const code = report.ok ? 0 : EXIT_FINDINGS;
  if (flags.json) {
    io.out(
      JSON.stringify(
        { ...report, draftPath, draftDefaulted, ...(rosterPath ? { rosterPath } : {}), pipeline: pipelinePath, note: DESIGN_CHECK_NOTE },
        null,
        2,
      ),
    );
    return code;
  }
  io.out(`design-check ${docName}: ${draftPath}`);
  for (const f of report.findings) io.out(`${f.severity === 'refusal' ? 'ERROR' : 'WARN'} ${f.rule} ${f.code} ${f.message}`);
  for (const w of report.warnings) io.out(`WARN ${w.rule} ${w.code} ${w.message}`);
  io.out(
    `${docName}: ${report.findings.length} finding${report.findings.length === 1 ? '' : 's'}, ` +
      `${report.warnings.length} secret warning${report.warnings.length === 1 ? '' : 's'}`,
  );
  io.out(`not checked: ${report.notChecked.join('; ')}`);
  io.out(`note: ${DESIGN_CHECK_NOTE}`);
  return code;
}

/**
 * mindset spec-coverage [<blueprint.json>] [--dir <folder>] [--ledger <file>] [--json]
 * mindset spec-coverage --declare <docName> --reason "<why>" --by "<who>" [--dir <folder>] [--ledger <file>]
 * exit 0 covered (or declined), 1 a gap or a rule error, 2 a usage error.
 */
export async function runSpecCoverage(io, positional, flags) {
  const dir = path.resolve(String(flags.dir ?? DEFAULT_DESIGN_DIR));
  const ledgerPath = path.resolve(String(flags.ledger ?? path.join(dir, 'spec-ledger.json')));
  if (flags.declare !== undefined) {
    if (positional.length) return usage(io, flags, '--declare takes no blueprint file');
    const reason = typeof flags.reason === 'string' ? flags.reason : '';
    const by = typeof flags.by === 'string' ? flags.by : '';
    if (typeof flags.declare !== 'string' || !reason.trim() || !by.trim()) {
      return usage(io, flags, '--declare <docName> needs both --reason "<why>" and --by "<who>"');
    }
    const entry = declineInLedger(ledgerPath, flags.declare, { reason, by });
    if (flags.json) io.out(JSON.stringify({ declared: flags.declare, ledger: ledgerPath, entry }, null, 2));
    else io.out(`declined ${flags.declare} in ${ledgerPath}: ${reason} (${by})`);
    return EXIT_COVERAGE.OK;
  }
  if (positional.length > 1) return usage(io, flags, 'usage: mindset spec-coverage [<blueprint.json>] (see mindset --help)');
  const blueprintPath = path.resolve(positional[0] ?? DEFAULT_BLUEPRINT);
  let blueprint;
  try {
    blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
  } catch (e) {
    return usage(io, flags, `cannot read the blueprint ${blueprintPath} (${e.code ?? e.message})`);
  }
  let docs;
  try {
    docs = listDocs(dir);
  } catch {
    return usage(io, flags, `no design folder ${dir}; pass --dir <folder>`);
  }
  const rows = await coverageRows(docs, localBlueprintSource(blueprint), readLedger(ledgerPath));
  const verdict = coverageVerdict(rows);
  const warnings = coverageWarnings(blueprint);
  const code = verdict.ok ? EXIT_COVERAGE.OK : EXIT_COVERAGE.GAP;
  if (flags.json) {
    io.out(
      JSON.stringify({ blueprint: blueprintPath, dir, rows, ...verdict, warnings, note: SPEC_COVERAGE_NOTE }, null, 2),
    );
    return code;
  }
  for (const line of coverageReportLines(rows, verdict, { declareCommand: 'mindset spec-coverage --declare' })) io.out(line);
  for (const w of warnings) io.out(`WARN ${w.path} ${w.rule} ${w.message}`);
  if (verdict.notChecked.length) io.out(`not checked: ${verdict.notChecked.join(', ')} (outside the blueprint)`);
  io.out(`note: ${SPEC_COVERAGE_NOTE}`);
  return code;
}
