import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { formatProblem, loadSchema, validateBlueprint } from '../lib/validate.mjs';
import {
  FIXTURES,
  cleanup,
  findRealSchema,
  makeHome,
  makePackage,
  readJson,
  run,
  tempDir,
} from './helpers.mjs';

after(cleanup);

const schemaPath = findRealSchema();
const skip = schemaPath ? false : 'no openappl.json (corpus) or patterns.json (repo) reachable';
const schema = schemaPath ? loadSchema(readJson(schemaPath)) : null;

const VALID = path.join(FIXTURES, 'valid');
const INVALID = path.join(FIXTURES, 'invalid');

// Each broken fixture, with the one problem it must produce.
const BROKEN = [
  {
    file: 'unknown-property.json',
    path: '$.services[0].dataObjects[0].objectSettings.basicSettings.softDelete',
    rule: 'unknown-property',
    message: /did you mean "useSoftDelete"/,
  },
  {
    file: 'wrong-type.json',
    path: '$.services[0].businessLogic[0].basics.authOptions.loginRequired',
    rule: 'type',
    message: /must be a boolean, got a string \("yes"\)/,
  },
  {
    file: 'bad-enum.json',
    path: '$.services[0].serviceSettings.serviceOptions.dbType',
    rule: 'enum',
    message: /"oracle" is not a DbTypes value; allowed: postgresql, mongodb/,
  },
  {
    file: 'missing-required.json',
    path: '$.projectSettings.basicSettings.name',
    rule: 'required',
    message: /BasicProjectSettings\.name is required/,
  },
  {
    file: 'wrong-root-array.json',
    path: '$',
    rule: 'root',
    message: /must be a JSON object/,
  },
  {
    file: 'wrong-root-wrapped.json',
    path: '$',
    rule: 'root',
    message: /wrapped in "Project"/,
  },
  {
    file: 'bad-array.json',
    path: '$.services[0].dataObjects',
    rule: 'array',
    message: /must be an array of DataObject, got an object/,
  },
  {
    file: 'mscript-bad-key.json',
    path: '$.services[0].businessLogic[3].query.whereClause.fullWhereClause.javascript',
    rule: 'mscript-shape',
    message: /"javascript" is not an MScript source key/,
  },
  {
    file: 'mscript-wrong-shape.json',
    path: '$.services[0].businessLogic[0].query.dataClauseItems[0].value',
    rule: 'mscript-shape',
    message: /must be an MScript: a string or a descriptor/,
  },
  {
    file: 'nested-object-type.json',
    path: '$.services[0].dataObjects[0].properties[3].relationSettings',
    rule: 'type',
    message: /must be a PropertyRelation object, got a string/,
  },
  {
    file: 'nested-bad-enum.json',
    path: '$.services[0].dataObjects[0].properties[0].basicSettings.type',
    rule: 'enum',
    message: /"Strng" is not a DataTypes value/,
  },
];

describe('validator on the OpenAPPL schema', { skip }, () => {
  test('the schema has the Project root and a version', () => {
    assert.ok(schema.classes.has('Project'));
    assert.match(schema.version, /^\d+\.\d+\.\d+/);
  });

  for (const file of fs.readdirSync(VALID).filter((f) => f.endsWith('.json'))) {
    test(`valid/${file} has no errors`, () => {
      const res = validateBlueprint(schema, readJson(path.join(VALID, file)));
      assert.deepEqual(res.errors.map(formatProblem), []);
    });
  }

  for (const b of BROKEN) {
    test(`invalid/${b.file} fails at ${b.path}`, () => {
      const res = validateBlueprint(schema, readJson(path.join(INVALID, b.file)));
      assert.equal(res.errors.length, 1, res.errors.map(formatProblem).join('\n'));
      const [e] = res.errors;
      assert.equal(e.path, b.path);
      assert.equal(e.rule, b.rule);
      assert.match(e.message, b.message);
    });
  }

  test('every broken fixture is covered by a test case', () => {
    const files = fs.readdirSync(INVALID).filter((f) => f.endsWith('.json'));
    assert.deepEqual(files.sort(), BROKEN.map((b) => b.file).sort());
  });

  test('MindbricksProject is accepted as the root alias', () => {
    const todo = readJson(path.join(VALID, 'todo.json'));
    assert.equal(validateBlueprint(schema, todo, 'MindbricksProject').errors.length, 0);
    const wrapped = readJson(path.join(INVALID, 'wrong-root-wrapped.json'));
    assert.equal(validateBlueprint(schema, wrapped).errors[0].rule, 'root');
  });

  test('--root validates a fragment, and an unknown root class is refused', () => {
    const todo = readJson(path.join(VALID, 'todo.json'));
    assert.equal(validateBlueprint(schema, todo.services[0], 'Service').errors.length, 0);
    const res = validateBlueprint(schema, todo, 'Nope');
    assert.equal(res.errors[0].rule, 'root');
    assert.match(res.errors[0].message, /"Nope" is not a pattern class/);
  });

  test('an enum written in the wrong case is a warning, not an error', () => {
    const todo = readJson(path.join(VALID, 'todo.json'));
    todo.services[0].serviceSettings.serviceOptions.dbType = 'PostgreSQL';
    const res = validateBlueprint(schema, todo);
    assert.equal(res.errors.length, 0);
    assert.equal(res.warnings[0].rule, 'enum-case');
    assert.equal(res.warnings[0].path, '$.services[0].serviceSettings.serviceOptions.dbType');
  });

  test('scalar root metadata is allowed, an object under an unknown root key is not', () => {
    const todo = readJson(path.join(VALID, 'todo.json'));
    todo.projectId = 'abc';
    todo.integrations = [];
    const res = validateBlueprint(schema, todo);
    assert.deepEqual(
      res.errors.map((e) => `${e.path} ${e.rule}`),
      ['$.integrations unknown-property'],
    );
  });

  test('id and _-prefixed keys are always allowed', () => {
    const todo = readJson(path.join(VALID, 'todo.json'));
    todo.services[0].id = 'svc-1';
    todo.services[0]._version = 3;
    assert.equal(validateBlueprint(schema, todo).errors.length, 0);
  });
});

describe('validator rules on a small schema', () => {
  const small = loadSchema({
    __patternsVersion: '0.0.1',
    Primitives: ['String', 'Integer', 'Boolean', 'Text', 'Any'],
    Color: ['red', 'green'],
    Name: { __isStringType: true },
    Project: {
      settings: 'Settings',
      items: ['Item'],
      tags: ['String'],
      __nullables: ['items', 'tags'],
      '__legacy.movedTo': 'settings.legacy',
    },
    Settings: {
      title: 'String',
      count: 'Integer',
      flag: 'Boolean',
      color: 'Color',
      ref: 'Name',
      guard: 'MScript',
      extra: 'Extra',
      '__count.min': 1,
      '__color.default': 'red',
      __nullables: ['count', 'guard', 'ref', 'extra'],
    },
    Item: { name: 'String' },
    Extra: {
      useExtra: 'Boolean',
      extraTitle: 'String',
      __activation: 'useExtra',
    },
    MScript: { js: 'Text', __nullables: ['js'] },
  });
  const ok = (b) => validateBlueprint(small, b).errors.map((e) => `${e.path} ${e.rule}`);

  test('required, defaults, booleans', () => {
    assert.deepEqual(ok({}), ['$.settings required']);
    assert.deepEqual(ok({ settings: {} }), ['$.settings.title required']);
    assert.deepEqual(ok({ settings: { title: '   ' } }), ['$.settings.title required']);
    assert.deepEqual(ok({ settings: { title: 't', flag: 'true', count: '3' } }), []);
  });

  test('range, moved property, string types', () => {
    assert.deepEqual(ok({ settings: { title: 't', count: 0 } }), ['$.settings.count range']);
    assert.deepEqual(ok({ settings: { title: 't' }, legacy: { a: 1 } }), [
      '$.legacy moved-property',
    ]);
    assert.deepEqual(ok({ settings: { title: 't', ref: 7 } }), ['$.settings.ref type']);
  });

  test('arrays and their items', () => {
    assert.deepEqual(ok({ settings: { title: 't' }, tags: 'a' }), ['$.tags array']);
    assert.deepEqual(ok({ settings: { title: 't' }, tags: ['a', 2, null] }), ['$.tags[1] type']);
    assert.deepEqual(ok({ settings: { title: 't' }, items: [{}, 'x'] }), [
      '$.items[0].name required',
      '$.items[1] type',
    ]);
  });

  test('an activation flag gates the rest of its section', () => {
    const extra = (e) => ok({ settings: { title: 't', extra: e } });
    assert.deepEqual(extra({}), []);
    assert.deepEqual(extra({ useExtra: false }), []);
    assert.deepEqual(extra({ useExtra: true }), ['$.settings.extra.extraTitle required']);
    assert.deepEqual(extra({ useExtra: true, extraTitle: 'x' }), []);
  });

  test('MScript: string and descriptor forms, never evaluated', () => {
    const guard = (g) => ok({ settings: { title: 't', guard: g } });
    assert.deepEqual(guard('this.session.userId != null'), []);
    assert.deepEqual(guard({ js: 'process.exit(1)' }), []);
    assert.deepEqual(guard({ js: null }), []);
    assert.deepEqual(guard({ js: 3 }), ['$.settings.guard.js mscript-shape']);
    assert.deepEqual(guard({ ruby: 'x' }), ['$.settings.guard.ruby mscript-shape']);
    assert.deepEqual(guard(42), ['$.settings.guard mscript-shape']);
  });

  test('keys that are not identifiers get a bracketed path', () => {
    assert.deepEqual(ok({ settings: { title: 't', 'a b': 1 } }), [
      '$.settings["a b"] unknown-property',
    ]);
  });
});

describe('mindset validate (command line)', { skip }, () => {
  const pkg = makePackage('0.1.0');
  const home = makeHome();

  test('exits 0 on the examples and prints the semantic note', () => {
    const files = ['todo.json', 'blog.json', 'shop.json'].map((f) => path.join(VALID, f));
    const res = run(pkg, home, ['validate', '--schema', schemaPath, ...files]);
    assert.equal(res.code, 0, res.stdout + res.stderr);
    assert.match(res.stdout, /todo\.json: 0 errors, 0 warnings/);
    assert.match(
      res.stdout,
      /note: Structural check only.*compiler or the hosted OpenAPPL Validator/,
    );
  });

  test('exits 1 and prints ERROR <path> <rule> <message>', () => {
    const res = run(pkg, home, [
      'validate',
      '--schema',
      schemaPath,
      path.join(INVALID, 'bad-enum.json'),
    ]);
    assert.equal(res.code, 1);
    assert.match(
      res.stdout,
      /^ERROR \$\.services\[0\]\.serviceSettings\.serviceOptions\.dbType enum "oracle" is not a DbTypes value/m,
    );
  });

  test('a file that is not JSON is an error at $', () => {
    const res = run(pkg, home, [
      'validate',
      '--schema',
      schemaPath,
      path.join(INVALID, 'not-json.txt'),
    ]);
    assert.equal(res.code, 1);
    assert.match(res.stdout, /^ERROR \$ json-parse /m);
  });

  test('--json prints a machine-readable report', () => {
    const res = run(pkg, home, [
      'validate',
      '--json',
      `--schema=${schemaPath}`,
      path.join(INVALID, 'missing-required.json'),
      path.join(VALID, 'todo.json'),
    ]);
    assert.equal(res.code, 1);
    const report = JSON.parse(res.stdout);
    assert.equal(report.valid, false);
    assert.equal(report.results[0].errors, 1);
    assert.equal(report.results[0].problems[0].path, '$.projectSettings.basicSettings.name');
    assert.equal(report.results[1].errors, 0);
    assert.match(report.note, /Semantic checks/);
  });

  test('without --schema it uses the installed corpus copy', () => {
    const h = makeHome({ claude: true });
    assert.equal(run(pkg, h, ['install']).code, 0);
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'good.json'), '{ "name": "x" }');
    fs.writeFileSync(path.join(dir, 'bad.json'), '{ "nmae": {} }');
    const good = run(pkg, h, ['validate', path.join(dir, 'good.json')]);
    assert.equal(good.code, 0, good.stdout + good.stderr);
    assert.match(good.stdout, /OpenAPPL 9\.9\.9-test/);
    const bad = run(pkg, h, ['validate', path.join(dir, 'bad.json')]);
    assert.equal(bad.code, 1);
    assert.match(
      bad.stdout,
      /^ERROR \$\.nmae unknown-property Project has no property "nmae" \(did you mean "name"\?\)/m,
    );
  });

  test('without a schema anywhere it exits 2', () => {
    const bare = makePackage('0.1.0');
    fs.rmSync(path.join(bare, 'corpus', 'openappl.json'));
    const res = run(bare, makeHome(), ['validate', path.join(VALID, 'todo.json')]);
    assert.equal(res.code, 2);
    assert.match(res.stderr, /no openappl\.json found/);
  });

  test('no file given exits 2', () => {
    assert.equal(run(pkg, home, ['validate', '--schema', schemaPath]).code, 2);
  });
});
