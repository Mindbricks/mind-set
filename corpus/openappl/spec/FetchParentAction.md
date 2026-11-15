# FetchParentAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [FetchParentAction in Part 1](../ontology/FetchParentAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Fetches selected properties from a parent object related to the current object in context. Typically used to enrich the response or inform access and validation logic with values inherited from a higher-level entity (e.g., organization, project). The parentObject can be a local data object (same service) or a remote data object (different service). For remote parent objects, the action automatically fetches from Elasticsearch, enabling seamless inter-service parent data retrieval. **Important**: A relation to the parent object must be defined in the current dbObject's properties for this action to work.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `parentObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Specifies the parent data object to fetch from. This can be a local data object (belonging to the same service) or a remote data object (belonging to another service). For local parent objects, the action calls the service's dbLayer utility function directly. For remote parent objects, the action automatically fetches from Elasticsearch, which contains data from remote services via CQRS joins. This is used when a child object in context needs data inherited or referenced from its parent. **Requirement**: A relation property must be defined in the current dbObject's properties that establishes the child-to-parent relationship. The action uses this relation to determine the foreign key and local key for querying the parent object. |
| `properties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) | List of property names to fetch from the parent object. Leave empty to retrieve all fields. Uses dot notation for nested fields when needed. |

## Constraints

Property rules:

- `parentObject` must be present. (`REQUIRED_FIELD_MISSING`)
- `parentObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `properties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `FETCH_PARENT_FK_UNAVAILABLE_AT_STAGE` | error, warning | FetchParentAction "…" runs at "…" on a create API, but its foreign key "…" is only written by buildDataClause() (…), which has not run yet at that stage. |

## Example

Use to pull inherited values from a parent entity (organization, project, tenant) into context for access checks or response enrichment — requires a relation to the parent on the current dbObject; remote parents are resolved from Elasticsearch automatically.

```json
{
  "name": "fetchOrganization",
  "description": "Load the owning organization's plan and billing status to gate later quota validations.",
  "parentObject": "organization",
  "properties": [
    "name",
    "plan",
    "billingStatus"
  ],
  "contextPropertyName": "organization"
}
```
