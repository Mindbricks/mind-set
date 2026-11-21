# Experimental elements

An experimental element is a pattern, or a single property of a stable pattern, that `openappl.json` marks as unstable: it carries an `experimental` meta key with the schema version that added it and a note on why it is experimental and what may change. It is a pre-release of a future stable element.

- It may arrive in a minor release and may change or disappear before the next major release, which promotes it (the marker is removed) or drops it.
- It is used only by blueprints that opt in. An agent needs explicit permission in its skill to add the element for the selected compiler.
- It is outside conformance: a compiler is conformant without it. A compiler that does not support it refuses the blueprint at compile time with `EXPERIMENTAL_NOT_SUPPORTED`, naming the pattern or the property ([compiler specification, section 1.5](../compiler/01-conformance-model.md#experimental-elements)).

The marker in the schema:

```json
"__<Pattern>.experimental": { "since": "<schema version>", "note": "<why, what may change>" }
```

At the top level it marks the whole pattern; inside a pattern, `"__<property>.experimental"` marks one property. A property of a stable pattern whose type is an experimental pattern is marked itself.

## In this version

No pattern and no property of this schema version is experimental. Every element on the [pattern reference](./all-patterns.md) is stable.
