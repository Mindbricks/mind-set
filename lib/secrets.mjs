// secrets.mjs: the secret-shaped literal scan of a blueprint or a design
// document. Zero dependencies, Node >= 18.
//
// A blueprint is stored, shared, reviewed and published, so a literal
// credential in it is a leaked credential. Every credential value is an
// environment reference ("$ENV:STRIPE_SECRET_KEY") or, while it is not
// provided yet, "ENTER_CREDENTIAL". A bootstrap password (the seeded super
// admin) is never a real password either: an environment reference, or a
// placeholder that the administrator changes on first login.
//
// The scan WARNS; it never fails a check. It cannot know whether a value is
// real, so it reports two things:
//   - a string in a credential field (a key ending in password, secret,
//     apiKey, privateKey, accessKey or token) that is not a reference or a
//     placeholder;
//   - a credential SHAPE anywhere: a private-key block, a provider key with a
//     well-known prefix, a three-part JWT, a password inside a URL.
// The value itself is never repeated in a warning.
//
// Every pattern here is linear on one long line.

export const SECRET_RULE = 'secret-literal';
export const SECRET_CODE = 'SECRET_LITERAL';

/** A key whose string value is a credential (compared lower case, separators removed). */
const CREDENTIAL_KEY = /(password|passwd|secret|apikey|privatekey|accesskey|token)$/;

/** Values that are not a credential: references, masks and placeholders. */
const PLACEHOLDER = /change[-_ ]?me|first[-_ ]?login|placeholder|^x{3,}$|^your[-_ ]/i;

const normKey = (key) => String(key).toLowerCase().replace(/[^a-z0-9]/g, '');

/** True for a key whose string value holds a credential. */
export function isCredentialKey(key) {
  return CREDENTIAL_KEY.test(normKey(key));
}

/** True for a value that is a reference, a mask or a placeholder, not a credential. */
export function isCredentialReference(value) {
  const v = String(value).trim();
  if (v === '' || v === 'ENTER_CREDENTIAL') return true;
  if (/^\$ENV:[A-Za-z_][A-Za-z0-9_]*$/.test(v)) return true;
  if (v.includes('process.env.') || /\$\{[^}]*\}/.test(v)) return true;
  if (/^\*+$/.test(v) || /^<[^<>]+>$/.test(v)) return true;
  return PLACEHOLDER.test(v);
}

/** Credential shapes that are secret whatever key holds them: [kind, pattern]. */
const SHAPES = [
  ['private-key', /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/],
  [
    'provider-key',
    /\b(?:AKIA[0-9A-Z]{16}|gh[posru]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{16,}|(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}|glpat-[A-Za-z0-9_-]{20,})/,
  ],
  ['jwt', /(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/],
];

/** `scheme://user:password@host`; group 1 is the password. */
const URL_PASSWORD = /(?<![a-z0-9+.-])[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:([^\s@/]+)@/i;

/** The credential shapes in one string (kinds, each once). */
export function credentialShapes(text) {
  const kinds = [];
  for (const [kind, re] of SHAPES) if (re.test(text)) kinds.push(kind);
  const url = text.match(URL_PASSWORD);
  if (url && !isCredentialReference(url[1])) kinds.push('url-password');
  return kinds;
}

const ADVICE =
  'never write a real password or key into a blueprint or a design document: use "$ENV:<NAME>" ' +
  '(the value is set in the deployment), "ENTER_CREDENTIAL" while it is not provided, or, for a ' +
  'bootstrap password, a placeholder that is changed on first login';

const pathOf = (base, key) =>
  typeof key === 'number' ? `${base}[${key}]` : /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? (base ? `${base}.${key}` : key) : `${base}[${JSON.stringify(key)}]`;

/**
 * Secret-shaped literals of a parsed blueprint, as warnings
 * `{ level: 'warning', path, rule, message }`, in document order.
 */
export function blueprintSecretWarnings(blueprint) {
  const out = [];
  const visit = (node, at, key) => {
    if (typeof node === 'string') {
      if (key !== undefined && typeof key === 'string' && isCredentialKey(key) && !isCredentialReference(node)) {
        out.push({
          level: 'warning',
          path: at || '$',
          rule: SECRET_RULE,
          message: `"${key}" holds a literal value; ${ADVICE}`,
        });
        return;
      }
      const kinds = credentialShapes(node);
      if (kinds.length) {
        out.push({
          level: 'warning',
          path: at || '$',
          rule: SECRET_RULE,
          message: `a credential-shaped value (${kinds.join(', ')}); ${ADVICE}`,
        });
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => visit(v, pathOf(at, i), key));
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) visit(v, pathOf(at, k), k);
    }
  };
  visit(blueprint, '', undefined);
  return out;
}

/** `"key": "value"` (JSON) or key: `value` / "value" / 'value' (prose); groups 1 / 2 key, 3 value. */
const KEY_VALUE =
  /"([A-Za-z_][A-Za-z0-9_-]*)"\s*:\s*"([^"\n]*)"|(?<![A-Za-z0-9_-])([A-Za-z_][A-Za-z0-9_-]*)`?\s*[:=]\s*[`"']([^`"'\n]+)[`"']/g;

/**
 * Secret-shaped literals of a Markdown document, as warnings
 * `{ rule, code, severity: 'warning', line, message }` (one per line and kind).
 */
export function textSecretWarnings(text) {
  const out = [];
  const lines = String(text).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const keys = new Set();
    for (const m of line.matchAll(KEY_VALUE)) {
      const key = m[1] ?? m[3];
      const value = m[1] !== undefined ? m[2] : m[4];
      if (isCredentialKey(key) && !isCredentialReference(value)) keys.add(key);
    }
    for (const key of keys) {
      out.push({
        rule: SECRET_RULE,
        code: SECRET_CODE,
        severity: 'warning',
        line: i + 1,
        message: `line ${i + 1}: "${key}" holds a literal value; ${ADVICE}`,
      });
    }
    const kinds = credentialShapes(line);
    if (kinds.length) {
      out.push({
        rule: SECRET_RULE,
        code: SECRET_CODE,
        severity: 'warning',
        line: i + 1,
        message: `line ${i + 1}: a credential-shaped value (${kinds.join(', ')}); ${ADVICE}`,
      });
    }
  }
  return out;
}
