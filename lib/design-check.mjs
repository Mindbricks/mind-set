// design-check.mjs: the structural check of a design-document draft. Pure: no
// file or network access; the caller reads the draft and the pipeline. Zero
// dependencies, Node >= 18.
//
// Every rule is read from the design pipeline (procedures/design/pipeline.json):
//
//   name              the docName is a fixed pipeline docName or
//                     `<fan-out prefix><key>`                 -> DOC_NAME_NOT_ALLOWED
//   service-roster    (microservice-definitions) the first ```json block is
//                     an array naming at least one { name }, and the
//                     `## Event Contracts` section holds a markdown table
//                                                             -> STRUCTURE_INVALID
//   interview-record  `## Status` names in-progress | closed; a closed record
//                     carries a complete Coverage Ledger      -> STRUCTURE_INVALID / LEDGER_INCOMPLETE
//   test-plan         the `## Scope & Coverage Target` json block parses to
//                     { coverage: { designerApis, maxMissing }, services: [...] };
//                     every roster service is listed (only auth / bff /
//                     notification / agentHub may be extra); `## Service Flows`
//                     has one `### <service>` per entry         -> STRUCTURE_INVALID
//                     (the roster rule needs the microservice-definitions
//                     document; without it the rule is reported under notChecked)
//   required-sections every `requiredSections` H2 heading is present
//                     (a warning; a refusal for spec and test documents when
//                     `specSectionRuleRefuses` is on)          -> MISSING_SECTION / STRUCTURE_INVALID
//
// Heading matching: H2 = a line starting `## ` outside a ``` / ~~~ fence;
// compared case-insensitively with `*`, `_` and backticks stripped and
// whitespace collapsed; `## Status: closed` opens `Status`. A heading inside a
// fenced block never counts.
//
// Besides the findings, the report carries `warnings[]`: secret-shaped
// literals in the draft (see secrets.mjs). They never change `ok`.
//
// A fork of the structural checks of an agent harness built on OpenAPPL: the
// same rules, verdicts and exit codes, proven by a parity test in the source
// repository that runs both on the same fixtures.

import { textSecretWarnings } from './secrets.mjs';

/**
 * The document classes the pipeline may use. An unknown class fails loudly:
 * an old reader of a newer pipeline refuses it instead of misreading it.
 */
export const DESIGN_DOC_CLASSES = Object.freeze(['source', 'requirement', 'spec', 'test']);

/**
 * Shape-check a parsed pipeline; returns it, or throws an Error whose message
 * starts with "design pipeline <file> is unusable".
 */
export function checkDesignPipeline(p, file = 'pipeline.json') {
  const bad = (why) => new Error(`design pipeline ${file} is unusable: ${why}`);
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw bad('the root is not an object');
  if (p.schemaVersion !== 1) throw bad(`schemaVersion ${JSON.stringify(p.schemaVersion)} is not 1`);
  if (!Array.isArray(p.stages) || !p.stages.every((s) => typeof s === 'string')) throw bad('stages[] is not a string array');
  if (!Array.isArray(p.docs) || p.docs.length === 0) throw bad('docs[] is missing or empty');
  for (const [i, d] of p.docs.entries()) {
    if (!d || typeof d.docName !== 'string' || !d.docName) throw bad(`docs[${i}].docName is missing`);
    if (!DESIGN_DOC_CLASSES.includes(d.class)) throw bad(`docs[${i}] (${d.docName}).class is not ${DESIGN_DOC_CLASSES.join('|')}`);
    if (!p.stages.includes(d.stage)) throw bad(`docs[${i}] (${d.docName}).stage is not one of stages[]`);
  }
  return p;
}

/** Parse and shape-check pipeline text (see checkDesignPipeline). */
export function parseDesignPipeline(text, file = 'pipeline.json') {
  let p;
  try {
    p = JSON.parse(text);
  } catch (err) {
    throw new Error(`design pipeline ${file} is unusable: not valid JSON (${err && err.message ? err.message : String(err)})`);
  }
  return checkDesignPipeline(p, file);
}

/** The one fan-out doc (service-spec), or null. */
export function fanOutDoc(p) {
  return p.docs.find((d) => d.fanOut) ?? null;
}

/**
 * Whether a missing required section of a spec or test document is a
 * refusal. `false`: it is a warning finding, as for every other class.
 */
export const SPEC_SECTION_RULE_REFUSES_DEFAULT = false;

/** What this check cannot see; reported so an ok is not read as more than it is. */
export const NOT_CHECKED = Object.freeze([
  'credential scan (only secret-shaped literals are warned about, see warnings[])',
  'size cap of a stored document',
  'service-spec key against the service roster',
]);

/** The findings exit code (0 = no finding). A usage error shares it; the report tells them apart (`error` vs `findings[]`). */
export const EXIT_FINDINGS = 2;

// ── Markdown reading ────────────────────────────────────────────────────────

/** One JS `\s` character (tested one character at a time: linear). */
function isRegexSpace(ch) {
  return /\s/.test(ch);
}

/** A regex `.` character: anything but a line terminator. */
function isRegexDot(ch) {
  return ch !== '\n' && ch !== '\r' && ch !== '\u2028' && ch !== '\u2029';
}

/**
 * The title of an ATX H2 line, or null: exactly what
 * `line.match(/^##\s+(.*?)\s*#*\s*$/)?.[1]` answers, in linear time (the
 * regex backtracks super-linearly on `## x` + spaces + `y`).
 */
export function h2Title(line) {
  if (!line.startsWith('##')) return null;
  let start = 2;
  if (start >= line.length || !isRegexSpace(line[start])) return null;
  while (start < line.length && isRegexSpace(line[start])) start++;
  let tail = line.length;
  while (tail > start && isRegexSpace(line[tail - 1])) tail--;
  while (tail > start && line[tail - 1] === '#') tail--;
  while (tail > start && isRegexSpace(line[tail - 1])) tail--;
  for (let i = start; i < tail; i++) if (!isRegexDot(line[i])) return null;
  return line.slice(start, tail);
}

/**
 * `text.match(/^(.*?)\s*\(([^()]*)\)\s*$/)` as `[whole, value, source]`,
 * or null - the same answer in linear time (the lazy prefix before
 * `\s*\(` backtracks quadratically; a 1M-character ledger line would block
 * the event loop for minutes). The source group holds no parenthesis, so the
 * `(` is the last one before the final `)`; the lazy value is what precedes
 * it minus trailing whitespace, and it may not hold a line terminator.
 */
export function matchLedgerSource(text) {
  let end = text.length;
  while (end > 0 && isRegexSpace(text[end - 1])) end--;
  if (end === 0 || text[end - 1] !== ')') return null;
  let open = end - 2;
  while (open >= 0 && text[open] !== '(' && text[open] !== ')') open--;
  if (open < 0 || text[open] !== '(') return null;
  let valueEnd = open;
  while (valueEnd > 0 && isRegexSpace(text[valueEnd - 1])) valueEnd--;
  for (let i = 0; i < valueEnd; i++) if (!isRegexDot(text[i])) return null;
  return [text, text.slice(0, valueEnd), text.slice(open + 1, end - 1)];
}

/** H2 sections of a markdown doc; headings inside fenced code blocks do not count. */
export function h2Sections(content) {
  const sections = [];
  let current = null;
  let fence = null;
  for (const line of content.split('\n')) {
    const fenceMark = line.match(/^\s*(```|~~~)/);
    if (fenceMark) {
      if (fence === null) fence = fenceMark[1];
      else if (fenceMark[1] === fence) fence = null;
      current?.body.push(line);
      continue;
    }
    if (fence === null) {
      const title = h2Title(line);
      if (title !== null && !line.startsWith('###')) {
        current = { title, body: [] };
        sections.push(current);
        continue;
      }
      if (/^#\s/.test(line)) {
        current = null;
        continue;
      }
    }
    current?.body.push(line);
  }
  return sections;
}

/** Heading text normalized for comparison (case, emphasis, spacing). */
function normHeading(text) {
  return text.replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Does heading `title` open section `name`? `Status: closed` opens `Status`. */
export function headingIs(title, name) {
  const t = normHeading(title);
  const n = normHeading(name);
  return t === n || t.startsWith(`${n}:`);
}

function findSection(sections, name) {
  return sections.find((s) => headingIs(s.title, name));
}

/** Plain value of a markdown fragment: emphasis / code marks and quotes stripped. */
function plain(text) {
  return text.replace(/[*`]/g, '').replace(/^["']|["']$/g, '').trim();
}

/** The `requiredSections` headings missing from a doc. */
export function missingRequiredSections(content, required) {
  const sections = h2Sections(content);
  return required.filter((name) => !findSection(sections, name));
}

/** A markdown table: a header row followed by a `|---|` separator row. */
function hasMarkdownTable(lines) {
  for (let i = 0; i + 1 < lines.length; i++) {
    const header = lines[i].trim();
    const sep = lines[i + 1].trim();
    if (header.startsWith('|') && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(sep)) return true;
  }
  return false;
}

/**
 * The roster: the first ```<fence> block, a JSON array, each entry an object
 * whose `<itemKey>` is a non-empty string. null when there is no parseable
 * array.
 */
export function parseRosterNames(content, fence, itemKey) {
  const escaped = fence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = content.match(new RegExp('```' + escaped + '\\s*([\\s\\S]*?)```', 'i'));
  if (!block?.[1]) return null;
  let entries;
  try {
    entries = JSON.parse(block[1]);
  } catch {
    return null;
  }
  if (!Array.isArray(entries)) return null;
  const names = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const value = entry[itemKey];
    if (typeof value === 'string' && value.trim().length > 0) names.push(value.trim());
  }
  return names;
}

// ── The test plan ───────────────────────────────────────────────────────────

/** The title of an ATX H3 line (not `####`), or null; mirror of h3Title. */
export function h3Title(line) {
  if (!line.startsWith('###') || line[3] === '#') return null;
  let start = 3;
  if (start >= line.length || !isRegexSpace(line[start])) return null;
  while (start < line.length && isRegexSpace(line[start])) start++;
  let tail = line.length;
  while (tail > start && isRegexSpace(line[tail - 1])) tail--;
  while (tail > start && line[tail - 1] === '#') tail--;
  while (tail > start && isRegexSpace(line[tail - 1])) tail--;
  for (let i = start; i < tail; i++) if (!isRegexDot(line[i])) return null;
  return line.slice(start, tail);
}

/** Fenced blocks (info word + lines) and H3 titles outside them, of one section body; mirror of sectionBlocks. */
export function sectionBlocks(body) {
  const fences = [];
  const h3 = [];
  let open = null;
  for (const line of body) {
    const mark = line.match(/^\s*(```|~~~)/);
    if (mark) {
      if (open === null) {
        open = { marker: mark[1], block: { info: line.trim().slice(3).trim().split(/\s/)[0].toLowerCase(), lines: [] } };
        continue;
      }
      if (mark[1] === open.marker) {
        fences.push(open.block);
        open = null;
        continue;
      }
    }
    if (open) {
      open.block.lines.push(line);
      continue;
    }
    const title = h3Title(line);
    if (title !== null) h3.push(title);
  }
  if (open) fences.push(open.block);
  return { fences, h3 };
}

/** The roster key of a service name: `customerProfiles` and `customer profiles` -> `customer-profiles`. */
export function serviceRosterKey(serviceName) {
  return serviceName
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** The system services a test plan may list beyond the roster (mirror of TEST_PLAN_SYSTEM_SERVICES). */
export const TEST_PLAN_SYSTEM_SERVICES = Object.freeze(['auth', 'bff', 'notification', 'agentHub']);

const serviceKeyOf = (name) => serviceRosterKey(plain(name));

/**
 * The test-plan rules; `rosterNames` null = no roster available, rule 2 not
 * checked.
 */
export function testPlanProblems(content, s, rosterNames) {
  const problems = [];
  const sections = h2Sections(content);
  let services = null;

  const target = findSection(sections, s.targetSection);
  if (!target) {
    problems.push(`the "## ${s.targetSection}" section is missing`);
  } else {
    const block = sectionBlocks(target.body).fences.find((f) => f.info === s.targetFence.toLowerCase());
    if (!block) {
      problems.push(`the "## ${s.targetSection}" section holds no \`\`\`${s.targetFence} block`);
    } else {
      let raw;
      let parsed = true;
      try {
        raw = JSON.parse(block.lines.join('\n'));
      } catch {
        parsed = false;
        problems.push(`the \`\`\`${s.targetFence} block of "## ${s.targetSection}" is not valid JSON`);
      }
      if (parsed) {
        const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null;
        const cov = obj && obj.coverage && typeof obj.coverage === 'object' && !Array.isArray(obj.coverage) ? obj.coverage : null;
        if (!obj) problems.push('the coverage target is not a JSON object');
        else if (!cov) problems.push('the coverage target has no "coverage" object');
        else {
          const d = cov.designerApis;
          if (!(d === 'all' || (Number.isInteger(d) && d >= 1 && d <= 100))) {
            problems.push('coverage.designerApis must be "all" or an integer percentage 1..100');
          }
          const m = cov.maxMissing;
          if (!(Number.isInteger(m) && m >= 0)) problems.push('coverage.maxMissing must be an integer >= 0');
        }
        const list = obj ? obj.services : undefined;
        if (!Array.isArray(list) || list.length === 0 || !list.every((x) => typeof x === 'string' && x.trim().length > 0)) {
          problems.push('services must be a non-empty array of service names');
        } else {
          services = list.map((x) => x.trim());
        }
      }
    }
  }

  if (services && rosterNames) {
    const listed = new Set(services.map(serviceKeyOf));
    const rosterKeys = new Set(rosterNames.map(serviceKeyOf));
    const system = new Set(TEST_PLAN_SYSTEM_SERVICES.map(serviceKeyOf));
    const notListed = rosterNames.filter((n) => !listed.has(serviceKeyOf(n)));
    const unknown = services.filter((n) => !rosterKeys.has(serviceKeyOf(n)) && !system.has(serviceKeyOf(n)));
    if (notListed.length) problems.push(`services does not list the roster service(s): ${notListed.join(', ')}`);
    if (unknown.length) {
      problems.push(
        `services lists name(s) that are neither on the roster nor a system service (${TEST_PLAN_SYSTEM_SERVICES.join(', ')}): ${unknown.join(', ')}`,
      );
    }
  }

  const flows = findSection(sections, s.flowsSection);
  if (!flows) {
    problems.push(`the "## ${s.flowsSection}" section is missing`);
  } else if (services) {
    const h3 = new Set(sectionBlocks(flows.body).h3.map(serviceKeyOf));
    const noFlow = services.filter((n) => !h3.has(serviceKeyOf(n)));
    if (noFlow.length) problems.push(`"## ${s.flowsSection}" has no "### <service>" heading for: ${noFlow.join(', ')}`);
  }
  return problems;
}

/** The roster names of a microservice-definitions body, per the pipeline's service-roster structure; null = none. */
/**
 * The text with CRLF and lone CR line ends read as LF. A draft written on
 * Windows (or checked out there with autocrlf) would otherwise keep a \r on
 * every line, and no heading or ledger row would match.
 */
export function toLf(text) {
  return String(text).replace(/\r\n?/g, '\n');
}

export function rosterNamesOf(p, content) {
  content = toLf(content);
  const rosterDoc = fanOutDoc(p)?.fanOut?.roster;
  const s = p.docs.find((d) => d.docName === rosterDoc)?.structure;
  const fence = s && s.type === 'service-roster' ? s.rosterFence : 'json';
  const itemKey = s && s.type === 'service-roster' ? s.rosterItemKey : 'name';
  return parseRosterNames(content, fence, itemKey);
}

/** Values that leave a ledger item unsettled (mirror of UNRESOLVED_LEDGER_VALUES). */
const UNRESOLVED_LEDGER_VALUES = new Set(['', 'unknown', 'tbd', 'not sure', 'pending']);

// ── The rules ───────────────────────────────────────────────────────────────

/** Resolve a stored name: a fixed docName, or `<fan-out prefix><key>`. */
export function resolveDocName(p, docName) {
  const fixed = p.docs.find((d) => !d.fanOut && d.docName === docName);
  if (fixed) return { kind: 'fixed', doc: fixed };
  const fan = fanOutDoc(p);
  const prefix = fan?.fanOut?.docNamePrefix;
  if (fan && prefix && docName.startsWith(prefix) && docName.length > prefix.length) {
    return { kind: 'fan-out', doc: fan, serviceKey: docName.slice(prefix.length) };
  }
  return { kind: 'none' };
}

function checkServiceRoster(content, s) {
  const problems = [];
  const names = parseRosterNames(content, s.rosterFence, s.rosterItemKey);
  if (names === null) {
    problems.push(`no \`\`\`${s.rosterFence} fenced block holding a JSON array of { ${s.rosterItemKey} } objects was found`);
  } else if (names.length === 0) {
    problems.push(`the \`\`\`${s.rosterFence} roster names no service (every entry needs a non-empty "${s.rosterItemKey}")`);
  }
  const table = findSection(h2Sections(content), s.tableSection);
  if (!table) problems.push(`the "## ${s.tableSection}" section is missing`);
  else if (!hasMarkdownTable(table.body)) problems.push(`the "## ${s.tableSection}" section has no markdown table`);
  return { problems, roster: names };
}

function checkInterviewRecord(content, s, requiredItems) {
  const sections = h2Sections(content);
  const statusSection = findSection(sections, s.statusSection);
  let status = null;
  if (statusSection) {
    const colon = statusSection.title.indexOf(':');
    const inline = colon >= 0 ? plain(statusSection.title.slice(colon + 1)) : '';
    const firstLine = statusSection.body.map((l) => plain(l)).find((l) => l.length > 0) ?? '';
    status = (inline || firstLine).toLowerCase();
  }
  if (status === null || !s.statusValues.includes(status)) {
    return {
      code: 'STRUCTURE_INVALID',
      message:
        `"## ${s.statusSection}" must name one of ${s.statusValues.join(' | ')} ` +
        `(e.g. "## ${s.statusSection}: ${s.statusValues[0]}")` +
        (status === null ? '; the section is missing' : `; found "${status}"`),
      problems: [status === null ? 'status-missing' : 'status-invalid'],
      status,
    };
  }
  if (status !== s.ledgerRequiredWhenStatus) return null;

  const ledger = findSection(sections, s.ledgerSection);
  const seen = new Map();
  const unresolved = [];
  const badSource = [];
  for (const raw of ledger?.body ?? []) {
    const bullet = raw.match(/^\s*[-*+]\s+(.*)$/);
    if (!bullet) continue;
    const entry = bullet[1].match(/^[`*]*([A-Za-z0-9][A-Za-z0-9-]*)[`*]*\s*:\s*(.*)$/);
    if (!entry) continue;
    const key = entry[1].toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if (!requiredItems.includes(key)) continue;
    const src = matchLedgerSource(entry[2]);
    const value = plain(src ? src[1] : entry[2]).toLowerCase();
    const source = src ? plain(src[2]).toLowerCase() : '';
    if (UNRESOLVED_LEDGER_VALUES.has(value)) unresolved.push(key);
    if (!s.ledgerSources.includes(source)) badSource.push(key);
  }
  const missing = requiredItems.filter((k) => !seen.has(k));
  const duplicated = requiredItems.filter((k) => (seen.get(k) ?? 0) > 1);
  if (ledger && !missing.length && !duplicated.length && !unresolved.length && !badSource.length) return null;
  const parts = [];
  if (!ledger) parts.push(`the "## ${s.ledgerSection}" section is missing`);
  if (ledger && missing.length) parts.push(`missing items: ${missing.join(', ')}`);
  if (duplicated.length) parts.push(`items listed more than once: ${duplicated.join(', ')}`);
  if (unresolved.length) parts.push(`items without a settled value (unknown / TBD / not sure / pending): ${unresolved.join(', ')}`);
  if (badSource.length) parts.push(`items whose source is not (${s.ledgerSources.join('|')}): ${badSource.join(', ')}`);
  return {
    code: 'LEDGER_INCOMPLETE',
    message: `the record is "${status}" but its Coverage Ledger is incomplete: ${parts.join('; ')}`,
    ledgerPresent: !!ledger,
    missing,
    duplicated,
    unresolved,
    badSource,
  };
}

/**
 * Check one draft. Pure: no file or network access.
 * Returns { ok, docName, pipelineDoc, class, serviceKey?, roster?, findings[], warnings[], server, notChecked }.
 *   findings[i] = { rule, code, severity: 'refusal' | 'warning', message, ...details }
 *   warnings[i] = { rule: 'secret-literal', code: 'SECRET_LITERAL', severity: 'warning', line, message }
 *                 (never change ok)
 *   server      = what a document store that enforces these rules answers on this body:
 *                 { outcome: 'refused', code } | { outcome: 'accepted', warnings: [missing headings] }
 *                 (a store stops at its FIRST refusal; findings lists them all).
 * Options: specSectionRuleRefuses (default false), rosterNames (null = no
 * roster, the test-plan roster rule is not checked), notChecked (the list the
 * report starts from; default NOT_CHECKED), rosterHint (how to give the
 * roster, named when it is missing).
 */
export function checkDesignDraft(
  p,
  docName,
  content,
  {
    specSectionRuleRefuses = SPEC_SECTION_RULE_REFUSES_DEFAULT,
    rosterNames = null,
    notChecked: baseNotChecked = NOT_CHECKED,
    rosterHint = 'pass --roster <file>',
  } = {},
) {
  content = toLf(content);
  const findings = [];
  const warnings = textSecretWarnings(content);
  const resolved = resolveDocName(p, docName);
  if (resolved.kind === 'none') {
    const fixed = p.docs.filter((d) => !d.fanOut).map((d) => d.docName);
    const fan = fanOutDoc(p);
    const pattern = fan?.fanOut ? [`${fan.fanOut.docNamePrefix}<serviceKey>`] : [];
    findings.push({
      rule: 'name',
      code: 'DOC_NAME_NOT_ALLOWED',
      severity: 'refusal',
      message: `"${docName}" is not a design document name; allowed: ${[...fixed, ...pattern].join(', ')}`,
    });
    return {
      ok: false,
      docName,
      pipelineDoc: null,
      class: null,
      findings,
      warnings,
      server: { outcome: 'refused', code: 'DOC_NAME_NOT_ALLOWED' },
      notChecked: [...baseNotChecked],
    };
  }

  const doc = resolved.doc;
  const s = doc.structure;
  let roster;
  if (s?.type === 'service-roster') {
    const r = checkServiceRoster(content, s);
    roster = r.roster;
    if (r.problems.length) {
      findings.push({
        rule: 'service-roster',
        code: 'STRUCTURE_INVALID',
        severity: 'refusal',
        message: `${docName}: ${r.problems.join('; ')}`,
        problems: r.problems,
      });
    }
  }
  if (s?.type === 'interview-record') {
    const r = checkInterviewRecord(content, s, p.requiredCoverageItems ?? []);
    if (r) {
      const { code, message, ...details } = r;
      findings.push({ rule: 'interview-record', code, severity: 'refusal', message: `${docName}: ${message}`, ...details });
    }
  }
  const notChecked = [...baseNotChecked];
  if (s?.type === 'test-plan') {
    const problems = testPlanProblems(content, s, rosterNames);
    if (problems.length) {
      findings.push({
        rule: 'test-plan',
        code: 'STRUCTURE_INVALID',
        severity: 'refusal',
        message: `${docName}: ${problems.join('; ')}`,
        problems,
      });
    }
    if (rosterNames === null) {
      notChecked.push(`test-plan roster rule (no local microservice-definitions roster: ${rosterHint})`);
    }
  }
  if (s?.type === 'test-report') {
    notChecked.push('test-report machine block (generated and validated by the report generator)');
  }
  const missing = missingRequiredSections(content, doc.requiredSections ?? []);
  const sectionsRefuse = (doc.class === 'spec' || doc.class === 'test') && specSectionRuleRefuses;
  for (const m of missing) {
    findings.push({
      rule: 'required-sections',
      code: sectionsRefuse ? 'STRUCTURE_INVALID' : 'MISSING_SECTION',
      severity: sectionsRefuse ? 'refusal' : 'warning',
      section: m,
      message: `${docName} has no "## ${m}" section (write the heading exactly; a section that does not apply reads "N/A - <reason>")`,
    });
  }

  const firstRefusal = findings.find((f) => f.severity === 'refusal');
  const server = firstRefusal
    ? { outcome: 'refused', code: firstRefusal.code }
    : { outcome: 'accepted', warnings: missing };
  return {
    ok: findings.length === 0,
    docName,
    pipelineDoc: doc.docName,
    class: doc.class,
    ...(resolved.kind === 'fan-out' ? { serviceKey: resolved.serviceKey } : {}),
    ...(roster !== undefined ? { roster } : {}),
    findings,
    warnings,
    server,
    notChecked,
  };
}

