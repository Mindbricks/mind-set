# ContentModel

**Level:** `chapter` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentModel in Part 1](../ontology/ContentModel.md)

**Name:** an instance is named by `contentBasics.name`.

A declarative content model generates storage objects, editorial APIs, publishing transitions, and headless delivery. Content and optional child/version objects retain normal migrations, indexing and database-change events. On nodejs the generated editorial Business APIs support content create/get/list/update/delete, item create/update/delete/list, and version list/get; dedicated reorder and restoreVersion operations use the content pipeline. No designer-authored CRUD is required. Existing object/operation APIs are retained; contentBasics.editorialApis: none disables generated editorial APIs. Configure permissionSettings before exposing an editorial UI. Other content-runtime languages are nodejs, python, java, dotnet and rust; new editorial runtime operations require their port records.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `contentBasics` | [`ContentModelBasics`](./ContentModelBasics.md) | yes |  |  |  | Core identity of the content model: name (drives the auto DataObject prefix and the delivery route prefix), whether it is a singleton (exactly one live record — homepage, privacy policy) or a collection (blog posts, FAQ entries). |
| `fields` | [`ContentField`](./ContentField.md)[] | no |  |  |  | The structured properties of this content — the content schema. Each field becomes a property of the synthesized {name}Content DataObject with the mapped storage type, validation, filterability, and search flags. Content without extra fields (a pure rich-body page) may declare none. |
| `bodySettings` | [`ContentBodySettings`](./ContentBodySettings.md) | no |  |  |  | The rich-content body capability. Absent = this content has no body (pure structured fields, e.g. a pricing table row). Present = a 'body' property is synthesized in the chosen format: richText (HTML, sanitized with a fixed allowlist on every write and on public delivery, which richTextAllowlist can extend; see ContentBodySettings.format), markdown, or blocks (an ordered JSON array of typed content blocks — the portable, renderer-agnostic choice). |
| `childSettings` | [`ContentChildSettings`](./ContentChildSettings.md) | no |  |  |  | The owned-children capability. Absent = flat content. Present = a {name}Item DataObject is synthesized whose rows belong to one content record (FAQ → FAQ items, release note → release entries, menu → menu items, landing page → sections), with its own fields, optional body, manual ordering, and optional nesting (trees). Children inherit the parent's publish state — they have no workflow of their own. |
| `mediaSettings` | [`ContentMediaSettings`](./ContentMediaSettings.md) | no |  |  |  | The media capability — whether media assets (images, videos, documents, audio) can be attached to this content's media fields. Binds the content model to a service bucket (a remoteBuckets[] or nativeBuckets[] entry) that stores the binaries; media-typed fields hold asset descriptors pointing into that bucket. Required when any field (or child field) has type 'media'. |
| `routingSettings` | [`ContentRoutingSettings`](./ContentRoutingSettings.md) | no |  |  |  | The public-delivery routing capability. Present = published records are publicly addressable: a unique 'slug' property is synthesized (generated from slugSource), the delivery API serves /content/{name}/{slug}, and optional SEO metadata (a 'seo' object property: title, description, canonical, openGraph) is synthesized for the consuming frontend. Absent = the content is API-only data (delivered by id/query, not by public route) — e.g. email templates, prompt libraries. |
| `localizationSettings` | [`ContentLocalizationSettings`](./ContentLocalizationSettings.md) | no |  |  |  | The localization capability. When enabled, each record carries a 'locale' and a 'localeGroupId' — one row per language variant, grouped by localeGroupId; fields marked 'localized' differ per variant while unlocalized fields are mirrored from the default locale. The delivery API resolves ?locale= with fallback to the default locale. |
| `publishingSettings` | [`ContentPublishingSettings`](./ContentPublishingSettings.md) | no |  |  |  | The publishing-workflow capability. Every content record ALWAYS carries the status machine (draft → published → archived); this section tunes it: scheduled publishing (publishAt/unpublishAt windows driven by the content scheduler), and authorized preview of unpublished content. Editorial transitions run through the content-layer transition routes or a ContentTransitionAction — never by raw status updates. |
| `versioningSettings` | [`ContentVersioningSettings`](./ContentVersioningSettings.md) | no |  |  |  | The revision-history capability. When enabled, a {name}ContentVersion DataObject is synthesized and an immutable snapshot row is captured on publish (or on every update), enabling audit, diff, and restore. |
| `permissionSettings` | [`ContentPermissionSettings`](./ContentPermissionSettings.md) | no |  |  |  | Editorial permissions: which project roles may edit content, which may run publish/archive transitions, which bypass all checks — and whether published content is publicly readable (the headless default) or requires an authenticated session. |
| `searchSettings` | [`ContentSearchSettings`](./ContentSearchSettings.md) | no |  |  |  | The search capability. Published content is Elasticsearch-indexed like any DataObject; this section tunes the delivery search route: full-text search over searchable fields + body, and optional semantic search via a named embedding provider from projectSettings.aiProvidersSettings. |
| `eventSettings` | [`ContentEventSettings`](./ContentEventSettings.md) | no |  |  |  | Kafka content-lifecycle events supplement database-change events emitted by actual writes to synthesized objects. Generated editorial Business APIs use the ordinary API-event configuration. restore is un-archive; restoreVersion edits a draft without publishing and restores only a draft or archived record (otherwise 409). |
| `contentModeration` | [`ObjectModeration`](./ObjectModeration.md) | no |  |  |  | Decision moderation of this model's editorial writes: an ObjectModeration block applied to the synthesized {name}Content object, and to {name}Item when the model has child items. When `enabled`, the generated editorial create and update APIs (and any designer-authored create / update API on those objects) are judged before they write; a `review` or `reject` verdict HOLDS the write (202, nothing written) in `sys_<object>ModerationReview` until a reviewer accepts it, and the accept replays it through the same API, so the content guards, version capture and events run once, as for a direct save. `moderatedProperties` names model fields, `body` or `seo`, or child-item fields; each synthesized object judges the listed names it carries, and null judges the content of each (its declared fields and body, plus `seo` on the record). Only `mode: staged` is supported (OBJECT_MODERATION_CONTENT_ON_PLACE): the delivery routes, transitions and scheduler read the content rows outside the onPlace read gate. The publish transition is not moderated: it changes visibility, not content. Optional - omit (or null) when unused. |

## Constraints

Property rules:

- `contentBasics` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `fields` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CONTENT_ANONYMOUS_WRITE` | warning | Business API "…" …s the content object "…" of content model "…" with loginRequired: false, but content is never anonymously writable: the content edit guard refuses an anonymous caller (401). |
| `CONTENT_APPROVAL_NEEDS_ROLES` | error | The approval workflow is enabled but declares no reviewRoles — name the roles that review content sitting inReview (they gain editorial read/preview access). |
| `CONTENT_APPROVAL_REQUIRES_ENABLED` | error | requireApprovalToPublish is set but the approval workflow is not enabled — set approvalSettings.enabled to true (the publish gate is meaningless without the inReview/approved states). |
| `CONTENT_APPROVAL_RESET_REQUIRES_ENABLED` | error | editsResetApproval is set but the approval workflow is not enabled — set approvalSettings.enabled to true (there is no 'approved' state to reset without it). |
| `CONTENT_BLOCKS_FORMAT_MISMATCH` | error | allowedBlocks is only meaningful for the 'blocks' body format (got "…"). |
| `CONTENT_DEFAULT_LOCALE_NOT_IN_LOCALES` | error | defaultLocale "…" must be one of the declared locales (…). |
| `CONTENT_EDITORIAL_APIS_LANGUAGE_UNSUPPORTED` | warning | The generated editorial surface and the content guards are not available on … yet, so content model "…" gets no generated editorial Business APIs (create/edit/list/singleton/items/versions), no reorder or restoreVersion … |
| `CONTENT_EMBEDDING_PROVIDER_NOT_FOUND` | error | semanticSearch requires embeddingProviderName to match a projectSettings.aiProvidersSettings provider.… |
| `CONTENT_FIELD_DUPLICATE` | error | Field name "…" is declared more than once. |
| `CONTENT_FIELD_RESERVED_NAME` | error | Field name "…" collides with a synthesized system property of the content data objects (status, slug, body, seo, locale, order, …). |
| `CONTENT_LOCALIZATION_NO_LOCALES` | error | localizationSettings is enabled but declares no locales — at least one BCP-47 locale is required. |
| `CONTENT_LOCALIZED_FIELD_NEEDS_LOCALIZATION` | error | Field "…" is marked localized but the model's localizationSettings is not enabled. |
| `CONTENT_MAX_VERSIONS_INVALID` | error | maxVersions must be a positive integer (got …); leave it absent to keep all versions. |
| `CONTENT_MEDIA_BUCKET_NOT_FOUND` | error | Media bucket "…" must match a remoteBuckets[] or nativeBuckets[] entry declared in this service.… |
| `CONTENT_MEDIA_NEEDS_MEDIA_SETTINGS` | error | Field "…" has type "media" but the model declares no mediaSettings — media fields need a bucket to store their assets in. |
| `CONTENT_MODEL_DATA_OBJECT_CONFLICT` | error | Data object "…" conflicts with an existing data object in this service. |
| `CONTENT_MODEL_DUPLICATE_NAME` | error | Content model name "…" is declared more than once in this service — model names must be unique (they derive the DataObject and route names). |
| `CONTENT_NO_PUBLISH_ROLES` | warning |  |
| `CONTENT_REFERENCE_TARGET_NOT_FOUND` | error | Reference field "…" must name a content model declared in this service.… |
| `CONTENT_RICHTEXT_ALLOWLIST_FORMAT_MISMATCH` | error | richTextAllowlist is only meaningful for the 'richText' body format (got "…"). |
| `CONTENT_RICHTEXT_ALLOWLIST_INVALID` | error |  |
| `CONTENT_RICHTEXT_ALLOWLIST_LANGUAGE_UNSUPPORTED` | error | bodySettings.richTextAllowlist is generated on … only; the … richText sanitizer keeps the fixed allowlist and would remove what these rules admit. |
| `CONTENT_SELECT_NEEDS_OPTIONS` | error | Field "…" has type "…" and needs at least one entry in selectOptions. |
| `CONTENT_SLUG_SOURCE_NOT_FOUND` | error | Routing slugSource "…" must name a declared field of this model….… |
| `CONTENT_SLUG_SOURCE_NOT_TEXT` | error | Routing slugSource "…" must be a text-typed field (shortText/longText/richText/markdown) — got "…". |
| `CONTENT_TENANT_LEVEL_INERT` | warning | contentIsInTenantLevel is set, but the project is not multi-tenant (authentication.loginDefinition.tenantSettings.useMultiTenantFeature is not true), so there is no tenant to scope the content to and the model is … |
| `CONTENT_TENANT_LEVEL_LANGUAGE_UNSUPPORTED` | error | A tenant-level ContentModel is generated on … only; the … content runtime does not scope rows, delivery or slugs by tenant yet, so it would serve one tenant's private content to every tenant. |
| `CONTENT_WEBHOOK_DUPLICATE_NAME` | error | Webhook name "…" is declared more than once — names must be unique within the model (they key the consumer group and the secret env override). |
| `CONTENT_WEBHOOK_INVALID_URL` | error | Webhook "…" needs an absolute http(s) URL to POST to (got "…"). |
| `CONTENT_WEBHOOK_NEEDS_LIFECYCLE_EVENTS` | error | Webhooks are declared but publishLifecycleEvents is false — the webhook dispatcher consumes the model's lifecycle topics, so these targets could never fire. |
| `CONTENT_WEBHOOK_SECRET_PLACEHOLDER` | warning | Webhook "…" has a placeholder signing secret (matched rule "…"), so its deliveries are sent unsigned. |
