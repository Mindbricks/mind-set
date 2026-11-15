# CustomGraphQuerySpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [CustomGraphQuerySpec in Part 1](../ontology/CustomGraphQuerySpec.md)

Spec for `custom` — the bring-your-own-Cypher escape hatch (docs/ADR-graph-database-layer.md §8b). The author supplies a parameterized Cypher template and declares its named parameters; codegen wires it like any other query.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `cypher` | `Text` | yes |  |  |  | The parameterized Cypher template, using `$param` placeholders for its named parameters. |
| `params` | `String`[] | no |  |  |  | The names of the parameters the Cypher template expects (bound from the GraphQueryAction.params object at call time). Must match the Cypher's `$name` tokens exactly (case-sensitive): a `$token` no entry declares is a CUSTOM_QUERY_PARAM_MISMATCH error and fails codegen, and a declared name the Cypher never references is a CUSTOM_QUERY_PARAM_UNUSED warning. A `$` inside a string literal, a backtick-quoted name or a comment is not a token. |

## Constraints

Property rules:

- `cypher` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CUSTOM_QUERY_PARAM_MISMATCH` | error | The Cypher references $…, but params does not declare "…". |
| `CUSTOM_QUERY_PARAM_UNUSED` | warning | params declares "…", but the Cypher never references $…. |
