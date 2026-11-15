// Structural validation of an OpenAPPL blueprint against `openappl.json`.
//
// The schema is a flat map of pattern classes. A class is an object whose
// plain keys are property names mapped to a type (`"String"`, `"MScript"`,
// `"Service"`, or `["Service"]` for an array); keys starting with `__` carry
// metadata (`__nullables`, `__<prop>.default`, `__activation`, `__extends`,
// `__<prop>.movedTo`, ...). A top-level JSON array is an enum. `Primitives`
// lists the primitive type names, and a class with `__isStringType: true` is a
// named string (a reference by name, resolved only by a compiler).
//
// The rules mirror what the reference validators enforce for the same schema,
// and stay on the lenient side where they would need context this tool does
// not have: a slot is reported missing only where a compiler would report it
// too. Relations, ownership, references by name and every other semantic rule
// are out of scope (see SEMANTIC_NOTE).

export const ROOT_CLASS = 'Project';
export const ROOT_ALIASES = new Set(['Project', 'MindbricksProject']);

export const SEMANTIC_NOTE =
  'Structural check only: property names, value types, enum values, required fields and ' +
  'arrays against openappl.json. Semantic checks (relations, ownership, cross references, ' +
  'MScript content) need a compiler or the hosted OpenAPPL Validator.';

const PRIMITIVE_CHECKS = {
  String: (v) => typeof v === 'string',
  Text: (v) => typeof v === 'string',
  Integer: (v) =>
    (typeof v === 'number' && Number.isInteger(v)) ||
    (typeof v === 'string' && /^-?\d+$/.test(v.trim())),
  Double: (v) =>
    (typeof v === 'number' && !Number.isNaN(v)) ||
    (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())),
  Float: (v) =>
    (typeof v === 'number' && !Number.isNaN(v)) ||
    (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())),
  Boolean: (v) =>
    typeof v === 'boolean' ||
    (typeof v === 'string' && ['true', 'false'].includes(v.trim().toLowerCase())),
  Any: () => true,
};

const TYPE_NOUN = {
  String: 'a string',
  Text: 'a string',
  Integer: 'an integer',
  Double: 'a number',
  Float: 'a number',
  Boolean: 'a boolean',
};

/** Compiles the raw schema JSON into lookup tables the walker uses. */
export function loadSchema(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('schema is not a JSON object');
  }
  const primitives = new Set(Array.isArray(raw.Primitives) ? raw.Primitives : []);
  for (const p of Object.keys(PRIMITIVE_CHECKS)) primitives.add(p);
  const enums = new Map();
  const stringTypes = new Set();
  const classes = new Map();
  for (const [name, def] of Object.entries(raw)) {
    if (name.startsWith('__') || name === 'Primitives') continue;
    if (Array.isArray(def)) enums.set(name, def.map(String));
    else if (def && typeof def === 'object') {
      if (def.__isStringType === true) stringTypes.add(name);
      else classes.set(name, def);
    }
  }
  if (!classes.has(ROOT_CLASS)) throw new Error(`schema has no "${ROOT_CLASS}" class`);
  return {
    version: typeof raw.__patternsVersion === 'string' ? raw.__patternsVersion : null,
    primitives,
    enums,
    stringTypes,
    classes,
    propCache: new Map(),
  };
}

/**
 * Every property of a class, own first then inherited through `__extends`.
 * Each entry keeps the class that declares it: requiredness, defaults and
 * activation are read from the declaring class, as the generated validators
 * (one `validate` per class, chained through `super`) do.
 */
function classProps(schema, className) {
  const cached = schema.propCache.get(className);
  if (cached) return cached;
  const props = new Map();
  const moved = new Map();
  const seen = new Set();
  let name = className;
  while (name && schema.classes.has(name) && !seen.has(name)) {
    seen.add(name);
    const def = schema.classes.get(name);
    for (const [key, type] of Object.entries(def)) {
      if (key.startsWith('__')) {
        const m = /^__(.+)\.movedTo$/.exec(key);
        if (m && typeof type === 'string' && !moved.has(m[1])) moved.set(m[1], type);
        continue;
      }
      if (props.has(key)) continue;
      const isArray = Array.isArray(type);
      props.set(key, { type: isArray ? String(type[0]) : String(type), isArray, def });
    }
    name = typeof def.__extends === 'string' ? def.__extends : null;
  }
  for (const key of props.keys()) moved.delete(key);
  const entry = { props, moved };
  schema.propCache.set(className, entry);
  return entry;
}

function kindOf(schema, type) {
  if (type === 'MScript') return 'mscript';
  if (schema.primitives.has(type)) return 'primitive';
  if (schema.enums.has(type)) return 'enum';
  if (schema.stringTypes.has(type)) return 'stringType';
  if (schema.classes.has(type)) return 'class';
  return 'unknown';
}

function isBlank(v) {
  return v === undefined || v === null || v === '' || (typeof v === 'string' && v.trim() === '');
}

function mscriptIsBlank(v) {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (typeof v !== 'object' || Array.isArray(v)) return false;
  return Object.values(v).every((s) => s === null || (typeof s === 'string' && s.trim() === ''));
}

/**
 * Whether an absent value is an error. Arrays are never required (an absent
 * array is an empty one); a primitive or enum slot with a non-null declared
 * default takes that default; a Boolean slot with no declared default reads as
 * false. Everything else outside `__nullables` is required.
 */
function isRequired(schema, key, prop) {
  if (prop.isArray) return false;
  const def = prop.def;
  if (Array.isArray(def.__nullables) && def.__nullables.includes(key)) return false;
  const kind = kindOf(schema, prop.type);
  if (kind === 'primitive' || kind === 'enum') {
    const dk = `__${key}.default`;
    if (Object.hasOwn(def, dk) && def[dk] !== null) return false;
    if (prop.type === 'Boolean' && !Object.hasOwn(def, dk)) return false;
  }
  return true;
}

/**
 * Activation gating. A section with `__activation: "useX"` only validates its
 * other properties while `useX` is true; a chapter whose activator section is
 * marked `__chapterActivation` only validates its other sections while that
 * activator is on. While a gate is off, the gated slot is skipped (the
 * reference validators do not look at it, and the compiler ignores it).
 */
function gateIsOpen(schema, key, prop, config) {
  const def = prop.def;
  const activation = typeof def.__activation === 'string' ? def.__activation : null;
  if (activation && def.__chapterActivation !== true && key !== activation) {
    if (config[activation] !== true && config[activation] !== 'true') return false;
  }
  if (activation && key === 'configuration') {
    if (config[activation] !== true && config[activation] !== 'true') return false;
  }
  if (def.__type === 'chapter' && !prop.isArray && kindOf(schema, prop.type) === 'class') {
    const own = schema.classes.get(prop.type);
    if (own && own.__chapterActivation === true) return true;
    for (const [sk, st] of Object.entries(def)) {
      if (sk.startsWith('__') || Array.isArray(st) || sk === key) continue;
      const section = schema.classes.get(String(st));
      if (section && section.__chapterActivation === true && section.__activation) {
        const sectionValue = config[sk];
        const on =
          sectionValue && typeof sectionValue === 'object'
            ? sectionValue[section.__activation]
            : undefined;
        return on === true || on === 'true';
      }
    }
  }
  return true;
}

function requiredWhenOpen(schema, key, prop) {
  const def = prop.def;
  if (key === 'configuration' && typeof def.__activation === 'string') {
    return def.__configurationIsRequired === true;
  }
  return isRequired(schema, key, prop);
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function nearest(key, candidates) {
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const lower = key.toLowerCase();
  for (const c of candidates) {
    const score = levenshtein(lower, c.toLowerCase());
    if (score < bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return best && bestScore <= Math.max(2, Math.floor(key.length / 3)) ? best : null;
}

function describe(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  if (typeof v === 'object') return 'an object';
  if (typeof v === 'string') {
    return `a string (${JSON.stringify(v.length > 40 ? `${v.slice(0, 40)}...` : v)})`;
  }
  return `${typeof v === 'number' ? 'a number' : `a ${typeof v}`} (${JSON.stringify(v)})`;
}

function childPath(path, key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`;
}

class Walker {
  constructor(schema) {
    this.schema = schema;
    this.problems = [];
  }

  error(path, rule, message) {
    this.problems.push({ level: 'error', path, rule, message });
  }

  warn(path, rule, message) {
    this.problems.push({ level: 'warning', path, rule, message });
  }

  walkClass(className, config, path, isRoot = false) {
    const { props, moved } = classProps(this.schema, className);
    for (const key of Object.keys(config)) {
      if (key === 'id' || key.startsWith('_') || props.has(key)) continue;
      // Root metadata (codename, projectId, ...) is scalar and outside the schema.
      if (isRoot && (typeof config[key] !== 'object' || config[key] === null)) continue;
      const kp = childPath(path, key);
      if (moved.has(key)) {
        this.error(
          kp,
          'moved-property',
          `"${key}" has moved on ${className}: write it at "${moved.get(key)}" instead`,
        );
        continue;
      }
      const hint = nearest(key, props.keys());
      this.error(
        kp,
        'unknown-property',
        `${className} has no property "${key}"${hint ? ` (did you mean "${hint}"?)` : ''}`,
      );
    }
    for (const [key, prop] of props) {
      if (!gateIsOpen(this.schema, key, prop, config)) continue;
      const value = config[key];
      const kp = childPath(path, key);
      if (prop.isArray) {
        this.walkArray(className, key, prop, value, kp);
        continue;
      }
      this.walkValue(className, key, prop, value, kp, requiredWhenOpen(this.schema, key, prop));
    }
  }

  walkArray(className, key, prop, value, path) {
    if (value === undefined || value === null) return;
    if (!Array.isArray(value)) {
      this.error(
        path,
        'array',
        `${className}.${key} must be an array of ${prop.type}, got ${describe(value)}`,
      );
      return;
    }
    value.forEach((item, i) => {
      if (item === null || item === undefined) return;
      this.walkValue(className, key, prop, item, `${path}[${i}]`, false, true);
    });
  }

  walkValue(className, key, prop, value, path, required, inArray = false) {
    const { type } = prop;
    const kind = kindOf(this.schema, type);
    const label = inArray ? `${className}.${key}[]` : `${className}.${key}`;
    if (kind === 'mscript') {
      if (mscriptIsBlank(value)) {
        if (required) this.error(path, 'required', `${label} is required (an MScript value)`);
        if (value === undefined || value === null || typeof value === 'string') return;
      }
      this.checkMScript(label, value, path);
      return;
    }
    if (kind === 'class') {
      if (value === undefined || value === null || value === '') {
        if (required) this.error(path, 'required', `${label} is required (a ${type} object)`);
        return;
      }
      if (typeof value !== 'object' || Array.isArray(value)) {
        this.error(path, 'type', `${label} must be a ${type} object, got ${describe(value)}`);
        return;
      }
      this.walkClass(type, value, path);
      return;
    }
    if (isBlank(value)) {
      if (required) {
        const allowed = kind === 'enum' ? `: one of ${this.schema.enums.get(type).join(', ')}` : '';
        this.error(path, 'required', `${label} is required${allowed}`);
      }
      return;
    }
    if (kind === 'primitive') {
      this.checkPrimitive(label, key, prop, value, path);
      return;
    }
    if (kind === 'enum') {
      const allowed = this.schema.enums.get(type);
      if (typeof value !== 'string') {
        this.error(
          path,
          'type',
          `${label} must be one of the ${type} values (a string), got ${describe(value)}`,
        );
        return;
      }
      if (allowed.includes(value)) return;
      const canonical = allowed.find((v) => v.toLowerCase() === value.toLowerCase());
      if (canonical) {
        this.warn(
          path,
          'enum-case',
          `"${value}" is accepted as "${canonical}" (${type}); write "${canonical}"`,
        );
        return;
      }
      this.error(path, 'enum', `"${value}" is not a ${type} value; allowed: ${allowed.join(', ')}`);
      return;
    }
    if (kind === 'stringType') {
      if (typeof value !== 'string') {
        this.error(
          path,
          'type',
          `${label} must be a ${type} (a name, as a string), got ${describe(value)}`,
        );
      }
      return;
    }
    this.error(path, 'schema', `${label} has type "${type}", which openappl.json does not define`);
  }

  checkPrimitive(label, key, prop, value, path) {
    const { type, def } = prop;
    if (type === 'Boolean') {
      const extra = def[`__${key}.extraValues`];
      if (Array.isArray(extra) && typeof value === 'string' && extra.includes(value)) return;
      if (!PRIMITIVE_CHECKS.Boolean(value)) {
        const lits = Array.isArray(extra) && extra.length ? ` or one of ${extra.join(', ')}` : '';
        this.error(path, 'type', `${label} must be a boolean${lits}, got ${describe(value)}`);
      }
      return;
    }
    const check = PRIMITIVE_CHECKS[type];
    if (!check) return;
    if (!check(value)) {
      this.error(path, 'type', `${label} must be ${TYPE_NOUN[type]}, got ${describe(value)}`);
      return;
    }
    if (type === 'Integer' || type === 'Double' || type === 'Float') {
      const n = Number(value);
      const min = def[`__${key}.min`];
      const max = def[`__${key}.max`];
      if (typeof min === 'number' && n < min) {
        this.error(path, 'range', `${label} must be >= ${min}, got ${n}`);
      } else if (typeof max === 'number' && n > max) {
        this.error(path, 'range', `${label} must be <= ${max}, got ${n}`);
      }
    }
  }

  /**
   * An MScript is a source string, or a descriptor object keyed by source
   * language (`{ "js": "..." }`, the portable form). Neither is evaluated.
   */
  checkMScript(label, value, path) {
    if (typeof value === 'string') return;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      this.error(
        path,
        'mscript-shape',
        `${label} must be an MScript: a string or a descriptor like { "js": "..." }, got ${describe(value)}`,
      );
      return;
    }
    const mscript = this.schema.classes.get('MScript');
    const keys = mscript
      ? Object.keys(mscript).filter((k) => !k.startsWith('__'))
      : ['js', 'ts', 'python', 'go', 'java', 'csharp', 'php', 'rust'];
    for (const [k, v] of Object.entries(value)) {
      const kp = childPath(path, k);
      if (!keys.includes(k)) {
        this.error(
          kp,
          'mscript-shape',
          `"${k}" is not an MScript source key; allowed: ${keys.join(', ')} ("js" is the portable one)`,
        );
      } else if (v !== null && typeof v !== 'string') {
        this.error(
          kp,
          'mscript-shape',
          `MScript source "${k}" must be a string, got ${describe(v)}`,
        );
      }
    }
  }
}

/**
 * Validates `blueprint` (parsed JSON) against a loaded schema. `rootClass`
 * defaults to `Project` (`MindbricksProject` is accepted as its alias); any
 * other class name validates a fragment, for example one `Service`.
 * Returns `{ errors, warnings, problems }`.
 */
export function validateBlueprint(schema, blueprint, rootClass = ROOT_CLASS) {
  const walker = new Walker(schema);
  const root = ROOT_ALIASES.has(rootClass) ? ROOT_CLASS : rootClass;
  if (!schema.classes.has(root)) {
    walker.error('$', 'root', `"${rootClass}" is not a pattern class in openappl.json`);
  } else if (!blueprint || typeof blueprint !== 'object' || Array.isArray(blueprint)) {
    walker.error(
      '$',
      'root',
      `a blueprint must be a JSON object (a ${root}), got ${describe(blueprint)}`,
    );
  } else {
    const keys = Object.keys(blueprint);
    const wrapper = keys.length === 1 && ROOT_ALIASES.has(keys[0]) ? keys[0] : null;
    if (
      root === ROOT_CLASS &&
      wrapper &&
      blueprint[wrapper] &&
      typeof blueprint[wrapper] === 'object'
    ) {
      walker.error(
        '$',
        'root',
        `the blueprint is wrapped in "${wrapper}"; the file must be the ${ROOT_CLASS} object itself`,
      );
    } else {
      walker.walkClass(root, blueprint, '$', root === ROOT_CLASS);
    }
  }
  const errors = walker.problems.filter((p) => p.level === 'error');
  const warnings = walker.problems.filter((p) => p.level === 'warning');
  return { errors, warnings, problems: walker.problems };
}

/** One output line per problem: `ERROR <path> <rule> <message>`. */
export function formatProblem(p) {
  return `${p.level === 'error' ? 'ERROR' : 'WARN'} ${p.path} ${p.rule} ${p.message}`;
}
