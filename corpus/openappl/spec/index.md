---
title: Specification
---

# Specification

Part 2 is the normative reference of the language: what a valid blueprint may contain,
pattern by pattern and property by property. Authors, editors and validators rely on it.

## What it contains

- **The schema.** [`openappl.json`](../../openappl.json) defines every pattern, its
  properties, their types, defaults and allowed values. The
  [schema page](./openappl-json.md) explains the file and links the pinned versions.
- **Pattern reference.** The [pattern reference](./all-patterns.md) lists every pattern.
  Each page has:
  - the **property table**: name, type, whether it is required, the default, the allowed
    values and details such as the [value format](./value-formats.md), a numeric range, a
    `secret` marker or the kind of an expression slot;
  - **Constraints**: the validation rules that apply to the pattern, with the code a
    validator reports ([what this covers](./constraints.md));
  - **Migration**: deprecated and relocated properties, with what to use instead;
  - **Notes** on limitations and usage, where there are any, and an **Example**.
- **Guides.** Task-oriented chapters on blueprint structure, data modelling, business APIs,
  workflows, the expression language and the system services. They are being written and
  appear in the sidebar as they are published.

## Versioning

The language version is the version of `openappl.json`. A minor release adds patterns or
properties; a major release may remove or rename them. Deprecated properties stay
documented until the major release that removes them.

## Related

- The [ontology](../ontology/index.md) (Part 1) shows how the patterns fit together.
- The [compiler specification](../compiler/index.md) (Part 3) says what a conforming
  compiler produces from a valid blueprint.
