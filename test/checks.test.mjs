// `mind-set design-check` and `mind-set spec-coverage` over local files, and
// the secret-shaped literal warnings they (and `validate`) give.
//
// The design fixtures run against fixtures/design/pipeline.json, the design
// pipeline of the corpus. Credential-shaped values are built at run time, so
// no file of this repository holds one.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { BIN, FIXTURES, PKG_DIR, cleanup, exists, findRealSchema, makeHome, makePackage, run, tempDir } from './helpers.mjs';
import { blueprintSecretWarnings, isCredentialReference, textSecretWarnings } from '../lib/secrets.mjs';

after(cleanup);

const DESIGN = path.join(FIXTURES, 'design');
const PIPELINE = path.join(DESIGN, 'pipeline.json');
const { cases } = JSON.parse(fs.readFileSync(path.join(DESIGN, 'cases.json'), 'utf8'));
const EXAMPLES = [path.join(PKG_DIR, 'corpus', 'examples'), path.join(PKG_DIR, 'corpus-src', 'examples')].find(exists);

/** Runs this checkout's CLI in `cwd` (HOME is a fresh fake, so no installed corpus is seen). */
function cli(args, { cwd = tempDir('mind-set-cwd-') } = {}) {
  const home = makeHome();
  const res = spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    encoding: 'utf8',
    env: { HOME: home, USERPROFILE: home, PATH: path.join(home, 'bin'), ...(process.env.SYSTEMROOT ? { SYSTEMROOT: process.env.SYSTEMROOT } : {}) },
  });
  let json = null;
  try {
    json = JSON.parse(res.stdout);
  } catch {
    json = null;
  }
  return { code: res.status, stdout: res.stdout, stderr: res.stderr, json };
}

/** A literal that looks like a live payment key, assembled so no source file holds one. */
const PAYMENT_KEY = ['sk', 'live', 'Q7c'.repeat(9)].join('_');
/** A made-up password, assembled for the same reason. */
const PASSWORD = ['Tr0ub', '4dor', 'real'].join('-');

describe('design-check', () => {
  assert.ok(cases.length >= 10, 'the case table is too small');
  for (const c of cases) {
    test(`${c.file} as ${c.docName}: exit ${c.exit}, ${c.verdict.outcome}${c.verdict.code ? ` ${c.verdict.code}` : ''}`, () => {
      const res = cli(['design-check', c.docName, path.join(DESIGN, c.file), '--pipeline', PIPELINE, '--json']);
      assert.equal(res.code, c.exit, res.stdout + res.stderr);
      assert.deepEqual(res.json.server, c.verdict);
      assert.equal(res.json.ok, c.exit === 0);
      assert.equal(res.json.findings.length === 0, c.exit === 0);
      assert.deepEqual(res.json.warnings, []);
      if (c.verdict.outcome === 'refused') {
        assert.equal(res.json.findings.find((f) => f.severity === 'refusal').code, c.verdict.code);
      } else {
        const missing = res.json.findings.filter((f) => f.rule === 'required-sections').map((f) => f.section);
        assert.deepEqual(missing, c.verdict.warnings);
      }
      assert.ok(res.json.notChecked.length >= 3, 'the report says what it cannot check');
    });
  }

  test('the doc name alone reads design/<docName>.md from the working folder', () => {
    const cwd = tempDir('mind-set-design-');
    fs.mkdirSync(path.join(cwd, 'design'));
    fs.copyFileSync(path.join(DESIGN, 'msd-ok.md'), path.join(cwd, 'design', 'microservice-definitions.md'));
    const res = cli(['design-check', 'microservice-definitions', '--pipeline', PIPELINE, '--json'], { cwd });
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.equal(res.json.draftDefaulted, true);
    assert.equal(fs.realpathSync(res.json.draftPath), fs.realpathSync(path.join(cwd, 'design', 'microservice-definitions.md')));
    assert.deepEqual(res.json.roster, ['orders', 'customerProfiles']);

    const human = cli(['design-check', 'microservice-definitions', '--pipeline', PIPELINE], { cwd });
    assert.equal(human.code, 0);
    assert.match(human.stdout, /microservice-definitions: 0 findings, 0 secret warnings/);
    assert.match(human.stdout, /^not checked: /m);
  });

  test('human output names each finding and exits 2', () => {
    const res = cli(['design-check', 'prd', path.join(DESIGN, 'prd-partial.md'), '--pipeline', PIPELINE]);
    assert.equal(res.code, 2);
    assert.match(res.stdout, /^WARN required-sections MISSING_SECTION prd has no "## 3\. Non-Functional Requirements" section/m);
  });

  test('a test plan is checked against the roster next to it, and says so when there is none', () => {
    const cwd = tempDir('mind-set-plan-');
    fs.mkdirSync(path.join(cwd, 'design'));
    const plan = [
      '# Test plan',
      '## Scope & Coverage Target',
      '```json',
      '{ "coverage": { "designerApis": "all", "maxMissing": 0 }, "services": ["orders", "auth"] }',
      '```',
      ...['Actors & Roles', 'Cross-Service Flows', 'Failure & Edge Cases', 'Invariants', 'Transport-Only APIs', 'Environment & Data', 'Out of Scope', 'Open Questions'].flatMap((h) => [`## ${h}`, 'N/A - fixture']),
      '## Service Flows',
      '### orders',
      '- create an order',
      '### auth',
      '- log in',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(cwd, 'design', 'test-plan.md'), plan);
    const alone = cli(['design-check', 'test-plan', '--pipeline', PIPELINE, '--json'], { cwd });
    assert.equal(alone.code, 0, alone.stdout);
    assert.ok(alone.json.notChecked.some((n) => /test-plan roster rule/.test(n)));

    fs.copyFileSync(path.join(DESIGN, 'msd-ok.md'), path.join(cwd, 'design', 'microservice-definitions.md'));
    const withRoster = cli(['design-check', 'test-plan', '--pipeline', PIPELINE, '--json'], { cwd });
    assert.equal(withRoster.code, 2, withRoster.stdout);
    assert.match(withRoster.json.findings[0].message, /does not list the roster service\(s\): customerProfiles/);
    assert.ok(!withRoster.json.notChecked.some((n) => /roster rule/.test(n)));

    const missing = cli(['design-check', 'test-plan', '--roster', 'nope.md', '--pipeline', PIPELINE, '--json'], { cwd });
    assert.equal(missing.code, 2);
    assert.match(missing.json.error, /cannot read the roster/);
  });

  test('a literal password or a credential-shaped value is warned about and changes nothing else', () => {
    const base = fs.readFileSync(path.join(DESIGN, 'service-spec-ok.md'), 'utf8');
    const file = path.join(tempDir('mind-set-secret-'), 'service-spec-orders.md');
    fs.writeFileSync(file, `${base}\n\`\`\`json\n{ "superAdminPassword": "${PASSWORD}", "apiKey": "$ENV:ORDERS_KEY" }\n\`\`\`\nThe key ${PAYMENT_KEY} came from the user.\n`);
    const res = cli(['design-check', 'service-spec-orders', file, '--pipeline', PIPELINE, '--json']);
    assert.equal(res.code, 0, res.stdout);
    assert.equal(res.json.ok, true);
    assert.equal(res.json.warnings.length, 2);
    assert.match(res.json.warnings[0].message, /"superAdminPassword" holds a literal value/);
    assert.match(res.json.warnings[1].message, /provider-key/);
    for (const w of res.json.warnings) {
      assert.equal(w.code, 'SECRET_LITERAL');
      assert.match(w.message, /\$ENV:<NAME>/);
      assert.match(w.message, /changed on first login/);
    }
    assert.ok(!res.stdout.includes(PASSWORD) && !res.stdout.includes(PAYMENT_KEY), 'a warning repeated the value');
  });

  test('usage errors exit 2 with an error and no findings', () => {
    const noDoc = cli(['design-check', '--pipeline', PIPELINE, '--json']);
    assert.equal(noDoc.code, 2);
    assert.ok(noDoc.json.error && !noDoc.json.findings);
    const noDraft = cli(['design-check', 'prd', '--pipeline', PIPELINE, '--json']);
    assert.equal(noDraft.code, 2);
    assert.match(noDraft.json.error, /cannot read the draft/);
    const pathName = cli(['design-check', '../prd', '--pipeline', PIPELINE, '--json']);
    assert.equal(pathName.code, 2);
    assert.match(pathName.json.error, /not a plain doc name/);
  });

  test('without --pipeline the corpus pipeline is used, and a corpus without one is a usage error', () => {
    const pkg = makePackage('0.0.1');
    const home = makeHome();
    const res = run(pkg, home, ['design-check', 'prd', path.join(DESIGN, 'prd-partial.md')]);
    assert.equal(res.code, 2);
    assert.match(res.stderr, /no design pipeline found/);
    fs.mkdirSync(path.join(pkg, 'corpus', 'procedures', 'design'), { recursive: true });
    fs.copyFileSync(PIPELINE, path.join(pkg, 'corpus', 'procedures', 'design', 'pipeline.json'));
    const ok = run(pkg, home, ['design-check', 'microservice-definitions', path.join(DESIGN, 'msd-ok.md')]);
    assert.equal(ok.code, 0, ok.stdout + ok.stderr);
  });
});

/** A working folder with `design/<doc>.md` for each doc and the blueprint as blueprint.json. */
function coverageFolder(blueprint, docs) {
  const cwd = tempDir('mind-set-coverage-');
  fs.mkdirSync(path.join(cwd, 'design'));
  for (const d of docs) fs.writeFileSync(path.join(cwd, 'design', `${d}.md`), `# ${d}\n`);
  fs.writeFileSync(path.join(cwd, 'blueprint.json'), JSON.stringify(blueprint, null, 2));
  return cwd;
}

const serviceNames = (bp) => bp.services.map((s) => s.serviceSettings.serviceBasics.name);

describe('spec-coverage', { skip: EXAMPLES ? false : 'no example blueprints' }, () => {
  const examples = EXAMPLES ? fs.readdirSync(EXAMPLES).filter((f) => f.endsWith('.json')).sort() : [];

  for (const f of examples) {
    test(`example ${f}: its design set is covered, the frontend is NOT_CHECKED`, () => {
      const bp = JSON.parse(fs.readFileSync(path.join(EXAMPLES, f), 'utf8'));
      const docs = ['prd', 'interview-record', 'project-basic-setup', 'auth-spec', 'microservice-definitions', 'frontend-spec', ...serviceNames(bp).map((n) => `service-spec-${n}`)];
      const cwd = coverageFolder(bp, docs);
      const res = cli(['spec-coverage', '--json'], { cwd });
      assert.equal(res.code, 0, res.stdout + res.stderr);
      assert.equal(res.json.ok, true);
      assert.deepEqual(res.json.missing, []);
      assert.deepEqual(res.json.notChecked, ['frontend-spec']);
      assert.deepEqual(res.json.warnings, []);
      for (const n of serviceNames(bp)) assert.equal(res.json.rows.find((r) => r.doc === `service-spec-${n}`).status, 'IMPLEMENTED');

      const gap = coverageFolder(bp, [...docs, 'bff-spec', 'notification-definitions', 'meeting-notes']);
      const g = cli(['spec-coverage', 'blueprint.json', '--json'], { cwd: gap });
      assert.equal(g.code, 1, g.stdout);
      assert.deepEqual(g.json.missing, ['bff-spec', 'meeting-notes', 'notification-definitions']);
      assert.deepEqual(g.json.errors, []);
    });
  }

  test('a gap names the document; a recorded decline clears it and carries the reason', () => {
    const bp = { projectSettings: { basicSettings: { name: 'x' } }, bffService: { serviceSettings: {} }, services: [] };
    const cwd = coverageFolder(bp, ['bff-spec', 'prd']);
    const gap = cli(['spec-coverage'], { cwd });
    assert.equal(gap.code, 1);
    assert.match(gap.stdout, /SPEC COVERAGE GAP — 1 document\(s\) produced no artifact:\n {2}bff-spec -> bffService\.dataViews is empty/);
    assert.match(gap.stdout, /mind-set spec-coverage --declare bff-spec --reason/);

    const noReason = cli(['spec-coverage', '--declare', 'bff-spec', '--by', 'me'], { cwd });
    assert.equal(noReason.code, 2);
    const declare = cli(['spec-coverage', '--declare', 'bff-spec', '--reason', 'the client reads one service', '--by', 'designer'], { cwd });
    assert.equal(declare.code, 0, declare.stdout + declare.stderr);
    const ledger = JSON.parse(fs.readFileSync(path.join(cwd, 'design', 'spec-ledger.json'), 'utf8'));
    assert.equal(ledger['bff-spec'].by, 'designer');

    const after = cli(['spec-coverage', '--json'], { cwd });
    assert.equal(after.code, 0, after.stdout);
    assert.deepEqual(after.json.declined, ['bff-spec']);
    assert.match(after.json.rows.find((r) => r.doc === 'bff-spec').note, /the client reads one service/);
  });

  test('a chapter that holds content but not the collection is an ERROR no decline clears', () => {
    const bp = { agentHub: { agents: { helper: {} } }, services: [] };
    const cwd = coverageFolder(bp, ['agent-hub-spec']);
    cli(['spec-coverage', '--declare', 'agent-hub-spec', '--reason', 'r', '--by', 'b'], { cwd });
    const res = cli(['spec-coverage', '--json'], { cwd });
    assert.equal(res.code, 1);
    assert.deepEqual(res.json.errors, ['agent-hub-spec']);
    assert.match(res.json.rows[0].note, /cannot see collection aiAgents \(agentHub carries: agents\)/);
  });

  test('a literal credential in the blueprint is warned about, the verdict stays', () => {
    const bp = {
      authentication: { loginDefinition: { userSettings: { superAdminPassword: PASSWORD } } },
      services: [],
      integrations: [{ provider: 'payments', config: { secretKey: PAYMENT_KEY, webhookSecret: '$ENV:PAY_WEBHOOK' } }],
    };
    const cwd = coverageFolder(bp, ['auth-spec']);
    const res = cli(['spec-coverage', '--json'], { cwd });
    assert.equal(res.code, 0, res.stdout);
    assert.deepEqual(
      res.json.warnings.map((w) => w.path),
      ['authentication.loginDefinition.userSettings.superAdminPassword', 'integrations[0].config.secretKey'],
    );
    const human = cli(['spec-coverage'], { cwd });
    assert.match(human.stdout, /^WARN authentication\.loginDefinition\.userSettings\.superAdminPassword secret-literal /m);
    assert.ok(!human.stdout.includes(PASSWORD) && !human.stdout.includes(PAYMENT_KEY));
  });

  test('usage errors exit 2', () => {
    const cwd = tempDir('mind-set-empty-');
    const noBlueprint = cli(['spec-coverage', '--json'], { cwd });
    assert.equal(noBlueprint.code, 2);
    assert.match(noBlueprint.json.error, /cannot read the blueprint/);
    fs.writeFileSync(path.join(cwd, 'blueprint.json'), '{}');
    const noDesign = cli(['spec-coverage', '--json'], { cwd });
    assert.equal(noDesign.code, 2);
    assert.match(noDesign.json.error, /no design folder/);
    const unknown = cli(['spec-coverage', '--schema', 'x'], { cwd });
    assert.equal(unknown.code, 2);
  });
});

describe('secret-shaped literals', () => {
  test('references, masks and placeholders are not credentials', () => {
    for (const v of ['$ENV:STRIPE_SECRET_KEY', 'ENTER_CREDENTIAL', '', '****', '<your key>', 'change-me-on-first-login', 'Bearer ${process.env.MAPS_API_KEY}']) {
      assert.equal(isCredentialReference(v), true, v);
    }
    for (const v of ['superadmin', '$ENV:', PASSWORD]) assert.equal(isCredentialReference(v), false, v);
  });

  test('only credential fields and credential shapes warn', () => {
    const warnings = blueprintSecretWarnings({
      authentication: { passwordMinLength: 8, tokenName: 'Authorization', apiKeyEnvVar: 'MY_KEY' },
      authentication: { loginDefinition: { userSettings: { superAdminPassword: 'change-me-on-first-login' } } },
      notes: [`the url ${['postgres://app', PASSWORD].join(':')}@db/x`, 'postgres://app:${DB_PASS}@db/x'],
    });
    assert.deepEqual(warnings.map((w) => [w.path, /url-password/.test(w.message)]), [['notes[0]', true]]);
  });

  test('a design document line with a literal key=value warns once per key', () => {
    const w = textSecretWarnings(`superAdminPassword: \`${PASSWORD}\`\napiKey = "$ENV:X"\nplain prose about the password policy`);
    assert.equal(w.length, 1);
    assert.equal(w[0].line, 1);
  });

  test('validate reports a literal credential as a warning, never an error', { skip: findRealSchema() ? false : 'no schema' }, () => {
    const file = path.join(tempDir('mind-set-validate-'), 'bp.json');
    const bp = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'valid', 'todo.json'), 'utf8'));
    bp.authentication.loginDefinition.userSettings.superAdminPassword = PASSWORD;
    fs.writeFileSync(file, JSON.stringify(bp));
    const res = cli(['validate', file, '--schema', findRealSchema()]);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.match(res.stdout, /^WARN authentication\.loginDefinition\.userSettings\.superAdminPassword secret-literal /m);
    assert.match(res.stdout, /0 errors, 1 warning/);
  });
});
