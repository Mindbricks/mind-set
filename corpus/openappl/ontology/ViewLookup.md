# ViewLookup

**Level:** `unclassified` · **Family:** [Standalone patterns](./families.md#standalone-patterns)

**Specification:** [ViewLookup in Part 2](../spec/ViewLookup.md)

Defines a lookup operation in a DataView, typically used to enrich an object with a human-readable label or translated text from a dictionary index. Lookups are similar to aggregates but are optimized for fetching a single value, such as a label, for UI rendering. They are especially useful for localization (e.g., converting 'userType: 0' to 'Administrator') or enriching records with descriptive names from static dictionaries like country, city, or status lists. Multi-language lookups automatically resolve language-specific values based on the user's locale if the view is dynamic; if stored, all language variants are stored with suffixes.

## Contained in

No property of another pattern holds this pattern.

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
