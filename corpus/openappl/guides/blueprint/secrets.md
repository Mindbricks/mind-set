---
title: Secrets in a blueprint
---

# Secrets in a blueprint

A blueprint is stored, exported, reviewed and published, so it never holds a secret. It
holds a **reference to one**. OpenAPPL has two standard spellings of that reference. They
are not rivals: they say different things about where the value is.

| Spelling | Meaning | Use it when |
|---|---|---|
| `"$ENV:NAME"` | The value is in the environment variable `NAME` of the deployment. The blueprint carries only the name. | The value is known to exist (or will be set by the person who deploys) and the blueprint is committed, reviewed or shared. This is the recommended spelling for a committed blueprint. |
| `"ENTER_CREDENTIAL"` with `"secret": true` | The value is **not provided yet**. The placeholder is the managed marker of "not configured". | The author does not have the value and must not ask for it. The owner supplies the real value outside the blueprint, in whatever way the compiler or hosting platform offers. |

```json
"configuration": [
  { "name": "secretKey",      "value": "$ENV:PAYMENT_SECRET_KEY", "secret": true },
  { "name": "webhookSecret",  "value": "ENTER_CREDENTIAL",        "secret": true },
  { "name": "defaultCurrency", "value": "USD" }
]
```

Both entries are valid in the same blueprint. A project usually starts with
`ENTER_CREDENTIAL` for the keys nobody has yet, and moves a key to `$ENV:NAME` once the
deployment names the variable that will hold it.

## What both spellings have in common

- The blueprint never contains the secret itself: no real key, no realistic-looking fake,
  no value a user pasted in a conversation. A real secret in a blueprint is a leaked
  secret; rotate it.
- The key is marked `"secret": true` where the provider catalogue
  ([provider pages](../../spec/providers/aiProvider.md) and the family pages next to it)
  marks it secret. The flag decides how a compiler treats the value: it keeps a secret out
  of generated source and out of committed configuration, and masks it when it reads the
  blueprint back (Part 3, [chapter 10](../../compiler/10-configuration-and-secrets.md)).
- A compiler treats a reference or a placeholder as "the value is configured elsewhere",
  never as the credential itself.

## `$ENV:NAME` in detail

- The exact spelling is the reference: `$ENV:` followed by a valid variable name
  (letters, digits and underscores, not starting with a digit). Anything else that only
  looks like a reference (`$env:X`, `$ENV: X`, a name with a dash) is **not** one; a
  compiler reports it as a malformed reference and reads the key as unset. A bare value
  is always the credential itself.
- A reference is followed once. A variable that itself holds a reference, or a key that
  references its own provider variable, reads as unset; validation reports a self
  reference as an error.
- The reference is carried as a plain value. It is not a secret, so it is never pushed as
  one, and every reader of the key (a notification adapter, a chat surface, a gateway
  service) reads `NAME` instead.

## `ENTER_CREDENTIAL` in detail

- It is a marker, not a value. A compiler's credential check recognises it as "not
  configured yet" and applies the provider's safe fallback where one exists (for example
  mail to a local sink, a bucket to the built-in store, a payment provider to a mock
  transport). Which fallbacks exist is compiler-specific; a fallback is never a delivery.
- Why not an empty string: an empty string can fail the required-key check of the entry.
  Why not a realistic fake: it passes the "is it configured" check and then fails against
  the real provider.
- Only **secret** keys take the placeholder. A masked readback (`ENTE****`) after a write
  is redaction, not corruption: never rewrite it.
- The placeholder counts as **missing** wherever a rule requires a configured credential
  (for example a webhook endpoint that answers `503` until its secret is set).

## A required key that is not a secret

A provider key that is required but is not a secret (a sender address, an account id, the
user's own bucket name) is **never** guessed and never gets `ENTER_CREDENTIAL`. The
credential check treats only secret keys as placeholders, so the placeholder would read as
a real value and the provider would fail at the first send, with nothing warning before.

- When the brand has a common default (a region, a default model), write the default and
  say in the report that it is an assumption.
- When the value belongs to the user, ask for it. It is not a secret, so it may be asked
  in conversation. Until the answer arrives, report the provider as **bound but
  incomplete** and name the key.

## The seeded super-admin password

The authentication chapter seeds one bootstrap administrator. Its password is stored at
`authentication.loginDefinition.userSettings.superAdminPassword` and is readable by
everyone who can read the blueprint. It is a **bootstrap credential**, not a secret of
the running system, and the rule is the same as for every other credential:

- Never write a real password there: not the user's own, and not the well-known default.
- Write an `$ENV:NAME` reference (`"$ENV:SUPERADMIN_PASSWORD"`), or a placeholder that the
  administrator **changes on first login** (`"change-me-on-first-login"`).
- A blueprint that is committed, exported or published must pass this rule before it
  leaves the working folder. `mind-set validate` and `mind-set spec-coverage` warn
  (`secret-literal`) when a credential field or a credential-shaped value holds a literal.

## Checks

| Code | Severity | Rule |
|---|---|---|
| (none) | manual | a literal credential where a reference belongs (reported as `secret-literal` by `mind-set validate`) |
| `CUSTOM_VARIABLE_SECRET_SHAPED_PLAIN` | warning | a secret-shaped custom variable marked `secret: false` |
| `PROCESS_ENV_SECRET_FORBIDDEN` | error | library code reads `process.env.SECRET*` |
| `SUPERADMIN_PASSWORD_IS_DEFAULT` | warning | the super-admin seed password is the default |
| `CHAT_PROVIDER_SELF_ENV_REFERENCE` | error | a key that references its own provider variable |
| `CHAT_PROVIDER_ENV_REFERENCE_MALFORMED` | warning | a value spelled like a reference but not exactly `$ENV:NAME` |

See also the [provider catalogue](../../spec/providers/aiProvider.md) (which keys are secret) and
[configuration and secrets](../../compiler/10-configuration-and-secrets.md) (what a compiler does with them).
