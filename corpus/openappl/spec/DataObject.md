# DataObject

**Level:** `namespace` · **Family:** [DataObject](../ontology/families.md#dataobject)

**Ontology:** [DataObject in Part 1](../ontology/DataObject.md)

**Name:** an instance is named by `objectSettings.basicSettings.name`.

A DataObject is the core building block of a service in OpenAPPL. It represents both the data schema (like a table in SQL or a collection in MongoDB) and the business logic that operates around it. Each DataObject includes a set of DataProperties (fields), and it governs how the data is stored, validated, secured, and exposed through automatically generated business APIs. Beyond simple data modeling, DataObjects enable complex logic configurations, such as access control, field-level behaviors, validation, and custom API route behavior. They serve not only as data containers but also as logical units of functionality within the microservice. A DataObject declared `objectSettings.basicSettings.virtual: true` is the one exception to the table: it is a response-only record (a computed decision, a report row) with no table, model or db layer, bound only by get and list apis whose actions build the response.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `objectSettings` | [`ObjectSettings`](./ObjectSettings.md) | yes |  |  |  | Settings that define general behavior and characteristics of the data object, such as naming, indexing, visibility, and access options. |
| `properties` | [`DataProperty`](./DataProperty.md)[] | no |  |  |  | The list of data properties of the data object. Each property represents a field and encapsulates both the type of the data and behavioral configurations like default values, constraints, visibility, or computed logic. Note: the compiler automatically creates standard fields (`id`, `isActive`, `createdAt`, `updatedAt`), so avoid defining these manually. |

## Constraints

Property rules:

- `objectSettings` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `properties` must have distinct names (`basicSettings.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `API_LAYER_FOLDER_NAME_COLLISION` | error | DataObject name "…" collides with a generated api-layer folder: the api layer emits its own "…/" barrel, and this object's barrel is generated at the same path, so one of the two is overwritten and the generated service … |
| `DB_LAYER_EXPORT_COLLISION` | error | DataObjects "…" and "…" export the same db-layer names: …. |
| `INDEX_NAME_PROJECTION_COLLISION` | error | Property "…" and "…" both produce the DB index name "…" on this object: index names are built from the column name lower-cased and snake_cased, so these two spellings are one name. |
| `MULTIPLE_AUTOINCREMENT_COLUMNS` | error | Properties … are all autoIncrement Integer/Short columns on this PostgreSQL object. |
| `RESERVED_PROPERTY_NAME` | error | Property "…" collides with the framework-managed column "…" — the framework injects and manages that column on every DataObject. |
| `RESERVED_SYSTEM_OBJECT_PREFIX` | error | DataObject name "…" uses the reserved "sys_" prefix: the framework's system-service injectors (payment, invoice, fiscal, ledger, compute, bucket, graph, agentHub, moderation) own that namespace and add their objects by … |
| `RESPONSE_ENVELOPE_NAME_COLLISION` | error | DataObject name "…" collides with response-envelope field. |
| `SERVICE_MANAGER_NAME_COLLISION` | error | DataObject name "…" collides with the generated service-level manager class "…": service "…" emits that class as the base of every api manager, and this object's own manager is generated under the same name ("…"), so the … |
| `SYSTEM_RESERVED_NAME_COLLISION` | error | DataObject name "…" is reserved by the framework. |
| `TENANT_MIRROR_COLUMN` | warning | Property "…" is stamped from the session tenant (sessionSettings.sessionParam: "…"), so it duplicates a column this row already carries: "…" is injected by the framework on every tenant-level object of a multi-tenant … |

## Notes

- The property names `id`, `isActive`, `createdAt`, `updatedAt`, `recordVersion` and `_type` are reserved, in any letter case and in their snake_case spellings (`is_active`, `created_at`, `updated_at`, `record_version`): the compiler adds these fields to every stored data object, and a blueprint that declares one is refused with `RESERVED_PROPERTY_NAME`.

## Example

Use a DataObject to model a domain entity — its persisted schema plus the access control, indexing, and CRUD behavior around it. This example models a project entity scoped per tenant with a slug, status enum, and an owner relation.

```json
{
  "objectSettings": {
    "basicSettings": {
      "name": "project",
      "description": "A project owned by a user within a tenant, tracking its lifecycle status.",
      "useSoftDelete": true
    },
    "authorization": {
      "objectDataIsInTenantLevel": true,
      "dataObjectAccess": "accessPrivate"
    },
    "compositeIndexSettings": [
      {
        "indexName": "ownerSlugIndex",
        "indexFields": [
          "ownerId",
          "slug"
        ],
        "onDuplicate": "throwError"
      }
    ]
  },
  "properties": [
    {
      "basicSettings": {
        "name": "name",
        "type": "String",
        "isRequired": true,
        "defaultName": true
      }
    },
    {
      "basicSettings": {
        "name": "slug",
        "type": "String",
        "isRequired": true
      },
      "indexSettings": {
        "indexedInElastic": true,
        "indexedInDb": true,
        "isSecondaryKey": true
      }
    },
    {
      "basicSettings": {
        "name": "status",
        "type": "Enum",
        "isRequired": true,
        "enumOptions": [
          "draft",
          "active",
          "archived"
        ]
      }
    },
    {
      "basicSettings": {
        "name": "ownerId",
        "type": "ID",
        "isRequired": true
      },
      "relationSettings": {
        "relationName": "owner",
        "relationTargetObject": "user",
        "relationTargetKey": "id",
        "onDeleteAction": "doDelete",
        "relationIsRequired": true
      }
    }
  ]
}
```
