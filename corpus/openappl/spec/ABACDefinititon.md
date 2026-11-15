# ABACDefinititon

**Level:** `subsection` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [ABACDefinititon in Part 1](../ontology/ABACDefinititon.md)

**Name:** an instance is named by `name`.

Defines a single ABAC (Attribute-Based Access Control) rule for a given data object. Each rule applies a conditional filter to determine which records a user can access, and grants either dynamic permissions or a role for matching records.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The unique identifier for this ABAC rule. It is used in the backend logic, database, and UI for reference. |
| `dataObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the data object to which this ABAC rule applies. |
| `whereClause` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | A BOOLEAN MScript expression over the ABAC decision context — `subject` (the session user), `object` (the candidate record) and `env` — that decides whether this rule grants its permissions for a record, e.g. `{ "js": "object.ownerId === subject.userId" }`. This is NOT a `$`-operator MQuery filter object and never raw driver/ORM code: it is a predicate. For the LIST direction the build-time classifier (abac-classify) translates the predicate into an MQuery list filter when it fits the bounded translatable grammar (`subject.<field>` / `object.<field>` comparisons joined by &&/\|\|); anything richer stays CHECK-ONLY — evaluated per record after fetch, excluded from list filtering with a build warning. |
| `permissions` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | A list of permission strings that will be granted when the ABAC rule matches a record. These permissions are context-specific and take precedence over less-specific permission types (such as role-based permissions). |

## Constraints

Property rules:

- `name`, `dataObject`, `whereClause` must be present. (`REQUIRED_FIELD_MISSING`)
- `name`, `permissions` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `dataObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ABAC_CONDITION_CHECK_ONLY` | warning | ABAC condition for … on … is not MQuery-translatable; CHECK-ONLY, excluded from list filtering |
| `PERMISSION_NOT_FOUND` | error | Permission "…" not found in project permission groups. |
