---
title: MScript trust model and security
---

# MScript trust model and security

MScript is the small JavaScript-flavoured expression language you author
directly in a blueprint: permission checks, default/derived values, where
clauses, data mappings, hook conditions. At compile time each MScript
is **compiled straight into the generated service's source** (translated to the
service's language for other targets), then runs in-process when the service
executes.

This page states the trust model plainly, because MScript is
**deliberately trusted-by-design** and it is important not to mistake it for
a sandbox.

## MScript runs with full service privileges

An MScript expression is not sandboxed. It executes with the **same privileges
as the rest of the generated service**: it can read the request, the session,
the database context, environment, and anything else in scope at its call site.

That is by design: **blueprint authors are trusted.** A blueprint author can
already produce arbitrary service behaviour through the blueprint itself, so
compiling their expressions into the service adds no new authority. The security
boundary is *who may author or deploy a blueprint*, not what an individual
MScript may do.

### `runMScript` is a diagnostic envelope, NOT a security boundary

Generated code wraps each MScript in a `runMScript(() => ..., { path })` envelope
(with an equivalent in each other language target). Its **only** job
is diagnostics:

- it catches a runtime error and **relabels** it with the MScript's blueprint-tree
  path so a failure is traceable to its source in the blueprint, and
- it lets intentional typed HTTP errors (a `ForbiddenError`, `BadRequestError`,
  ...) propagate verbatim instead of being masked as a 500.

It provides **zero isolation**. It does not restrict what the expression can
touch, cannot stop an infinite loop, and is not a jail. Do not describe it, in
code comments, docs, or design discussions, as a "security envelope" or a
sandbox. It is an error-labelling wrapper.

### What this means in practice

- **Never source an MScript (or any expression compiled to code) from
  lower-privileged runtime input**: an end-user field, a tenant API body, or a
  database row a non-operator can write. Compiling such a string to an
  in-process function is remote code execution. Keep code-shaped configuration
  on the **blueprint / deploy-time** path only.
- Runtime-authored mappings must be **declarative data, not code.** For example,
  a dynamic AI agent's Kafka `dataMapping` (stored on a runtime-writable
  record that is reachable through an admin API) is interpreted as a
  **pick-map / dot-path** (`{ outKey: "message.value.userId" }`) and is *never*
  evaluated as an expression.

## Summary

| Surface | Trust model | Not a... |
| --- | --- | --- |
| MScript expression | Runs with full service privileges; blueprint authors are trusted | sandbox |
| `runMScript` envelope | Diagnostic error-relabelling only | security boundary |
| Runtime-writable mappings (e.g. agent `dataMapping`) | Declarative data, never evaluated as code | expression host |
