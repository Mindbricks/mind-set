# DataProperty

**Level:** `chapter` · **Family:** [DataProperty](../ontology/families.md#dataproperty) (domain `DataObject`)

**Ontology:** [DataProperty in Part 1](../ontology/DataProperty.md)

**Name:** an instance is named by `basicSettings.name`.

The definition of a data property within a data object. A data property is not just a storage field—it encapsulates the logic, behavior, and metadata associated with a specific piece of data. Through its settings, a data property can define relationships, context-aware values, session-based defaults, computed formulas, access filters, enums, and more. It serves as a powerful unit of business logic tightly integrated with the data model.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `basicSettings` | [`PropertyBasicSettings`](./PropertyBasicSettings.md) | yes |  |  |  | Defines the foundational attributes of the data property — name, type, isRequired, isFilterParameter, enumOptions (when type === 'Enum'), defaultValue, and the rest of the per-property flags. The activation booleans for relation, filter, and enum live here so a property's design lives in one place. |
| `indexSettings` | [`PropertyIndexSettings`](./PropertyIndexSettings.md) | no |  |  |  | Controls how the property is indexed in storage systems to optimize lookup and uniqueness behaviors. Optional — omit (or null) when unused; never []. |
| `relationSettings` | [`PropertyRelation`](./PropertyRelation.md) | no |  |  |  | Defines relationship mappings when `basicSettings.hasRelation === true`. Foreign-key target object, key, on-delete behavior, etc. Leave null/absent when hasRelation is false. |
| `sessionSettings` | [`PropertySessionSettings`](./PropertySessionSettings.md) | no |  |  |  | Specifies how the property's value is derived from the session context when this block is populated. Setting `sessionSettings.sessionParam` activates session-bound mode; leave the wrapping object null/absent otherwise. |
| `staticJoin` | [`PropertyStaticJoin`](./PropertyStaticJoin.md) | no |  |  |  | Defines the static-join configuration when this block is populated. Setting `staticJoin.jointSource` activates the join; leave the wrapping object null/absent otherwise. |
| `graphEdge` | [`PropertyGraphEdge`](./PropertyGraphEdge.md) | no |  |  |  | Opt-in graph edge for an FK-relation property (docs/ADR-graph-database-layer.md §4a/§5). When this property has `basicSettings.hasRelation: true` (a 1-hop FK declared in `relationSettings`), populating `graphEdge` projects that relationship as a graph edge: on every write of the owning row, `MERGE` the relationship to the target node by key (and the target row projects as its own node). Also the §5 PROMOTION mechanism — a flat filter attribute kept in `projectedProperties` becomes a node+edge by adding a `graphEdge` block here. Leave null/absent when the relation is not projected. |
| `decisionSource` | [`PropertyDecisionSource`](./PropertyDecisionSource.md) | no |  |  |  | Opt-in WRITE-TIME CLASSIFICATION of this property (decision layer binding point B, docs/ADR-decision-layer-system-one.md section 5). When populated, the property's value is not written by callers: a calibrated decision provider answers ONE typed question about the row after a create and after every update that touches a `recomputeOn` property, and the DECISION is stored in this column, so every later query is a plain indexed predicate with no model in the path. Three companion columns are added next to it and written with every decision: `<prop>DecisionConfidence` (Double), `<prop>DecidedBy` (String, the exact model version that answered, or `manual`) and `<prop>DecidedAt` (Date); a fourth, `<prop>DecisionOverridden` (Boolean), pins an operator's correction against recomputation. The value type must match the question: noul -> Boolean, choice -> Enum (every option key an enum option) or String, score -> Double / Float / Integer. A provider outage never fails the write: the column is left unset and the backfill picks the row up. Never use it on a property an authorization predicate reads (DECISION_ON_AUTHZ_SURFACE). Leave null/absent for an ordinary property. |
| `uploadSettings` | [`PropertyUploadSettings`](./PropertyUploadSettings.md) | no | `null` |  |  | Opt-in upload source for a column of a RemoteBucket / NativeBucket `{name}RemoteFile` twin, declared in `remoteBucketSettings.additionalColumns`. Setting `uploadSettings.fromUploadField: true` lets the bucket's through-server upload route (`POST /bucket/{name}/upload`, `POST /nativebucket/{name}/upload` and the in-process writeBucketObject helper) copy the multipart text field of the SAME name as the column into the twin row it writes, after checking the value against the column type. It has no effect on the property of an ordinary data object (PROPERTY_UPLOAD_FIELD_OUTSIDE_BUCKET_TWIN warning). Leave null/absent otherwise. |

## Constraints

Property rules:

- `basicSettings` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ENUM_DUPLICATE_VALUE` | warning | Property "…" lists enum option "…" more than once (first at enumOptions[…]). |
| `ENUM_MIN_OPTIONS` | error | Property "…" has type Enum but no enumOptions defined. |
| `ENUM_NEAR_DUPLICATE_VALUE` | warning | Property "…" has enum options "…" and "…" that differ only in case/underscores. |
| `ENUM_TYPO_VALUE` | warning | Property "…" has enum options "…" and "…" that are one edit apart — almost always one intended value drifting in spelling. |
| `PROPERTY_SOURCE_MUTEX` | error | Property "…" has both sessionSettings.sessionParam and staticJoin.jointSource configured. |
| `PROPERTY_UPLOAD_FIELD_OUTSIDE_BUCKET_TWIN` | warning | Property "…" sets uploadSettings.fromUploadField, which only a column of a RemoteBucket / NativeBucket {name}RemoteFile twin (remoteBucketSettings.additionalColumns) uses: the bucket's upload route copies that multipart … |
| `RELATION_SETNULL_ON_REQUIRED_FK` | error | Property "…" is a NOT NULL column (isRequired true) whose relation declares onDeleteAction "setNull" — deleting the related parent generates a cascade that writes NULL into this NOT NULL foreign key, a guaranteed … |
| `RELATION_SETNULL_ON_REQUIRED_RELATION` | warning | Property "…" declares relationIsRequired: true (the relation must resolve) together with onDeleteAction "setNull" — after the related parent is deleted, the cascade nulls this FK and the required relation no longer … |
| `REQUIRED_FIELD_MISSING` | error | sessionParam is required |
| `SESSION_PARAM_UNKNOWN` | warning | Property "…" is session-bound to "…", which is not a known session field — neither a framework-stamped field nor an auth user property of this project. |

## Example

Use a DataProperty to define one field of a DataObject — its type, constraints, indexing, and behavior (relation, session-binding, static-join). This example is a required foreign-key reference to a customer, indexed for fast lookups; the relation is activated by the populated relationSettings block.

```json
{
  "basicSettings": {
    "name": "customerId",
    "type": "ID",
    "isRequired": true,
    "allowUpdate": false
  },
  "indexSettings": {
    "indexedInElastic": true,
    "indexedInDb": true,
    "isSecondaryKey": true
  },
  "relationSettings": {
    "relationName": "customer",
    "relationTargetObject": "customer",
    "relationTargetKey": "id",
    "onDeleteAction": "doDelete",
    "relationIsRequired": true
  }
}
```
