# GraphQueryAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [GraphQueryAction in Part 1](../ontology/GraphQueryAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Runs a parameterized graph traversal and writes mapped records to the action context. BusinessApiAction that runs a parameterized graph traversal against a service's Bolt driver pool and writes the mapped records to the action context (docs/ADR-graph-database-layer.md §8a — peer of FetchFromElasticLogAction). Compiles to a direct `runGraphQuery` call (inline Cypher) or the generated `runNamedGraphQueryResult` dispatcher (a declared query). `query` resolves to either a declared service.graphLayer.queries[].name (the `named:<name>` form or a bare name) or an inline Cypher string; `params` is an MScript expression evaluating to the parameter object. The context property receives a normalized ENVELOPE — `{ records, total, ok, status }` and nothing else: `records` / `total` are the mapped rows, and `ok` / `status` say whether the query RAN (`ok: false` with `status` `unavailable` or `error` is an outage, not a zero-row answer, so a permission decision reads `ok` first) — so a single record is read as `this.<contextPropertyName>.records[0]?.<field>`, never `this.<contextPropertyName>.<field>`, which is undefined by construction (CONTEXT_ENVELOPE_MEMBER_UNDEFINED).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | yes |  |  |  | Name of the graphProvider to run against (must match a projectSettings.graphProvidersSettings.graphProviders[].name). |
| `query` | `String` | yes |  |  |  | Either a reference to a declared graph query (`named:<graphLayer.queries[].name>` or a bare query name) or an inline Cypher string. |
| `params` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression evaluating to the Cypher parameter object (e.g. `{ "js": "{ userId: this.session.userId, tenantId: this._tenantId }" }`). Optional — defaults to no parameters. NOTE the tenant read: there is no generic `this.session.tenantId` - nothing stamps it, so it reads `undefined` on every request. The manager slot `this._tenantId` is the generic spelling that IS real, and `this.session.<tenantName>Id` is the session field itself. |

## Constraints

Property rules:

- `provider`, `query` must be present. (`REQUIRED_FIELD_MISSING`)
