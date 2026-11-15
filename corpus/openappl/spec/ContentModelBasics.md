# ContentModelBasics

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentModelBasics in Part 1](../ontology/ContentModelBasics.md)

Core identity of the content model. The name is used as the code identifier, the delivery route prefix (/content/{name}/), and the prefix of the synthesized DataObjects ({name}Content, {name}Item, {name}ContentVersion).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique content model identifier within the service. Used as the delivery route prefix (/content/{name}/) and the synthesized DataObject prefix. Must be a valid code name (camelCase). Examples: 'blogPost', 'faq', 'releaseNote', 'landingPage', 'teamMember'. |
| `description` | `Text` | no |  |  |  | Human-readable description of what this content is and who edits it. Used in documentation and AI assistant context. |
| `singleton` | `Boolean` | no | `false` |  |  | When true, one live content record exists per locale, and the content create guard rejects a second record. Delivery serves it at the model base path without a slug; editorial get/update address the existing record. Default: false (collection). A singleton enters the public sitemap only with an explicit routingSettings.basePath. |
| `editorialApis` | `ContentEditorialApis` | no | `"generated"` | `generated`, `none` |  | Generated (default) emits role-gated editorial APIs for content, children and version reads, plus nodejs reorder/restoreVersion operations. Existing designer-authored object/operation APIs are retained. Set none to opt out; delivery and transition routes remain available. A golang service emits no content layer: it gets no generated editorial APIs (storage only) and the warning CONTENT_EDITORIAL_APIS_LANGUAGE_UNSUPPORTED, which none silences; author and role-gate your own APIs there. |
| `contentIsInTenantLevel` | `Boolean` | no | `false` |  |  | Multi-tenant projects only: true makes this model TENANT level, each tenant's own private content; false (the default) keeps it SAAS level, general content shared by every tenant. The default is false so existing projects keep their storage and need no migration. A tenant-level model synthesizes its content, item and version objects as tenant-level DataObjects (objectDataIsInTenantLevel true, with the <tenantName>Id column): every editorial API, transition, reorder, restore-version and draft preview acts only inside the caller's session tenant, the public delivery routes (list, slug, search, sitemap, singleton) serve only the requesting tenant's published rows (the tenant the session names, else the one the tenant codename header names, else the root tenant, the framework convention; a header naming an unknown tenant is a 404 before any content route), and slugs are unique per tenant. With no editRoles a tenant-level model is edited by superAdmin, saasAdmin, tenantOwner and tenantAdmin, each inside its own session tenant; a saas-level model by superAdmin and saasAdmin. Generated code carries it on nodejs; other languages refuse it until their port lands. Inert, with a warning, on a single-tenant project. |
| `contentDataObjectName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Override name for the synthesized content DataObject. Defaults to '{name}Content'. Must be a valid code name. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `editorialApis` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name`, `contentDataObjectName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
