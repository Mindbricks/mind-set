# ViewLookup

**Level:** `unclassified` · **Family:** [Standalone patterns](../ontology/families.md#standalone-patterns)

**Ontology:** [ViewLookup in Part 1](../ontology/ViewLookup.md)

**Name:** an instance is named by `name`.

Defines a lookup operation in a DataView, typically used to enrich an object with a human-readable label or translated text from a dictionary index. Lookups are similar to aggregates but are optimized for fetching a single value, such as a label, for UI rendering. They are especially useful for localization (e.g., converting 'userType: 0' to 'Administrator') or enriching records with descriptive names from static dictionaries like country, city, or status lists. Multi-language lookups automatically resolve language-specific values based on the user's locale if the view is dynamic; if stored, all language variants are stored with suffixes.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The name of the lookup field in the DataView output. This is the property that will hold the resolved value, such as 'userRoleName'. For stored DataViews, the generated service stores multilingual variants using suffixes like 'userRoleName_en', 'userRoleName_tr'. When returned to the client, only the relevant language value is exposed. |
| `lookupDict` | `String` | yes |  |  |  | Historical dictionary-index name for the already-deprecated DataView lookup feature. DataView has no live lookups child, and current Node.js BFF generation does not hydrate or resolve this setting. The standalone declaration is retained; removal, retirement or revival requires an explicit maintainer ruling. A dictionary/locale lookup is not implemented by retaining this metadata. |
| `multiLang` | `Boolean` | yes |  |  |  | Historical multilingual selector for the already-deprecated DataView lookup feature. DataView has no live lookups child, and current Node.js BFF generation does not hydrate or resolve this setting. The standalone declaration is retained; removal, retirement or revival requires an explicit maintainer ruling. A dictionary/locale lookup is not implemented by retaining this metadata. |
| `lookupKey` | `String` | yes |  |  |  | Historical source-key path for the already-deprecated DataView lookup feature. DataView has no live lookups child, and current Node.js BFF generation does not hydrate or resolve this setting. The standalone declaration is retained; removal, retirement or revival requires an explicit maintainer ruling. A dictionary/locale lookup is not implemented by retaining this metadata. |
| `lookupValue` | `String` | yes |  |  |  | Historical dictionary-value field for the already-deprecated DataView lookup feature. DataView has no live lookups child, and current Node.js BFF generation does not hydrate or resolve this setting. The standalone declaration is retained; removal, retirement or revival requires an explicit maintainer ruling. A dictionary/locale lookup is not implemented by retaining this metadata. |

## Constraints

Property rules:

- `name`, `lookupDict`, `multiLang`, `lookupKey`, `lookupValue` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DICTIONARY_NOT_FOUND` | warning | Dictionary "…" not found. |
