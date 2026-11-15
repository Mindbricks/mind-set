# BusinessApiBasics

**Level:** `chapter` · **Family:** [BusinessApiBasics](../ontology/families.md#businessapibasics) (domain `BusinessApi`)

**Ontology:** [BusinessApiBasics in Part 1](../ontology/BusinessApiBasics.md)

Groups a BusinessApi's core API options and authentication settings. Core identity and authentication settings of a `BusinessApi` (section) — groups `apiOptions` (name, crud type, target data object, response shape) and `authOptions` (login requirement + permission checks).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `apiOptions` | [`ApiOptions`](./ApiOptions.md) | yes |  |  |  | Defines the name,type, dataObject and description of the business api as well as its basic options |
| `authOptions` | [`ApiAuthOptions`](./ApiAuthOptions.md) | no |  |  |  | Defines core authentication and authorization settings for a Business API. These settings cover session validation, role and ownership checks, and access scope (e.g., tenant vs. SaaS-level). While these options are sufficient for most use cases, more fine-grained access control—such as conditional permissions or contextual ownership—should be implemented using explicit access control actions (e.g., `PermissionCheckAction`, `MembershipCheckAction`, `ObjectPermissionCheckAction`). |

## Constraints

Property rules:

- `apiOptions` must be present. (`REQUIRED_FIELD_MISSING`)
