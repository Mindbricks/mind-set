---
title: Build a content editorial UI
---

# Build a content editorial UI

Do not author CRUD APIs for content objects: the editorial APIs below are
generated (opt out with `contentBasics.editorialApis: none`); an existing
author-written API on the same object and operation is kept and guarded
by the same rules as the generated ones.

A ContentModel describes storage and headless delivery. A conforming compiler
also generates the missing editorial Business APIs. Create, edit and publish work
without author-written CRUD. Set real project roles in `permissionSettings`:
`editRoles` for writes, `publishRoles` for publishing; `absoluteRoles` bypasses both.
Draft and version reads also admit the review and approve roles.

Support for the editorial APIs differs between compilers and target languages. Where a
target language has no editorial runtime, validation says so (see the validation table at
the end of this page) and the behaviour below does not apply. See
[the compiler specification](../../compiler/index.md).

## Minimal declaration

```json
{
  "contentModels": [
    {
      "contentBasics": {
        "name": "blogPost",
        "description": "Marketing blog posts.",
        "editorialApis": "generated",
        "contentIsInTenantLevel": false
      },
      "fields": [
        { "name": "title", "type": "shortText", "required": true, "searchable": true }
      ],
      "permissionSettings": {
        "publicRead": true,
        "editRoles": ["contentEditor"],
        "publishRoles": ["contentManager"],
        "absoluteRoles": ["superAdmin"]
      }
    }
  ]
}
```

`contentBasics.editorialApis` defaults to `generated`; set it to `none` to
keep only author-written editorial APIs (delivery and transition routes
stay available either way). `none` is the only option for a target language that
has no editorial runtime. `contentBasics.contentIsInTenantLevel` defaults to
`false` (SAAS level, shared by every tenant); set it `true` on a multi-tenant
project to make the model TENANT level, each tenant's own private content
(see "Content level" below). `permissionSettings.editRoles`, `publishRoles`
and `absoluteRoles` all default to empty — see the role-defaults paragraph
that follows for what an empty list falls back to.

No `editRoles` fails closed. A model that declares no `editRoles` is written,
previewed and read in draft only by the platform operators: `superAdmin` and
`admin` on a single-tenant project, `superAdmin` and `saasAdmin` on a multi-tenant
one. With no `publishRoles` either, the same operators run every transition
(publish, unpublish, archive, restore, submitForReview). A plain user, a
customer, a `tenantUser` and any author-defined role get 403 until you declare roles.
On a multi-tenant project the fallback depends on the model's level (below):
a saas-level model, shared by every tenant, is edited by `superAdmin` and
`saasAdmin` only, because a tenant administrator writing shared rows would
change every tenant's content; a tenant-level model adds `tenantOwner` and
`tenantAdmin`, each confined to its own tenant. Name tenant roles in `editRoles`
only if that is what you mean. Every ContentModel has publishing transitions, even without
`publishingSettings`. Models without `publishRoles` or `absoluteRoles` produce the
`CONTENT_NO_PUBLISH_ROLES` warning, which names who publishes them. Presets do
not invent roles. The closed fallback is the contract; a compiler whose runtime still admits
any authenticated session on its transition and preview gates is behind the contract, so
declare roles explicitly.

Content level (multi-tenant projects). Set `contentBasics.contentIsInTenantLevel`
to make a model TENANT level: each tenant's own private content. The default
(`false`) is SAAS level: general content shared by every tenant. A tenant-level model's
content, item and version rows carry the `<tenantName>Id` column and are filtered by it
like any tenant-level data object:

- editorial Business APIs, transitions, reorder, restore-version and draft
  preview act only in the caller's session tenant; another tenant's record is
  a 404. `superAdmin` and `saasAdmin` are platform users whose session carries the
  root tenant: they edit root-tenant rows there, and reach another tenant's
  rows only through a declared `apiInSaasLevel` API (the one cross-tenant
  surface). No role crosses the tenant filter.
- public delivery (list, slug, search, singleton, sitemap) serves only the
  requesting tenant's published rows: the session's tenant, else the tenant
  named by the tenant codename header (`mbx-<tenantName>-codename`, or the
  project's `tenantNameHeaderName`), else the root tenant (the convention for every
  tenant-scoped read). A header naming an unknown tenant
  is refused 404 (`errMsg_TenantNotFound`) before any content route runs. A
  tenant-site frontend sends that header on every public read.
- slugs are unique per tenant; a singleton is one record per tenant.
- with no `editRoles` it is edited by `superAdmin`, `saasAdmin`, `tenantOwner` and
  `tenantAdmin` (a saas-level model: `superAdmin` and `saasAdmin`), each inside its
  own tenant; declared roles are confined to the caller's tenant too.

The flag is inert (warning `CONTENT_TENANT_LEVEL_INERT`) on a single-tenant
project, and refused (`CONTENT_TENANT_LEVEL_LANGUAGE_UNSUPPORTED`) on a
target language whose content runtime does not support tenant-level models.

All paths are relative to the service API base URL. Use the service Business
APIs document for exact request/response shapes; an existing author-written
object/operation API keeps its route. `contentBasics.editorialApis: none` opts
out of generation. Generated paths use `/content-editor/<kebab-name>`, outside
the public delivery slug catch-all.

| Need | Generated route |
| --- | --- |
| Create draft / list every status | `POST / GET /content-editor/<model>/records` |
| Read / edit collection record | `GET / PATCH /content-editor/<model>/records/:<contentObjectName>Id` |
| Read / edit sole singleton | `GET / PATCH /content-editor/<model>/singleton` |
| Soft-delete record | `DELETE /content-editor/<model>/records/:<contentObjectName>Id` |
| Create / list children | `POST / GET /content-editor/<model>/items`; the list requires `?contentId=<parent-id>`; ordered children list by `order`, then `createdAt` and `id` (ascending), the order delivery serves |
| Edit / delete child | `PATCH / DELETE /content-editor/<model>/items/:<itemObjectName>Id` |
| Read versions | `GET /content-editor/<model>/versions?contentId=<parent-id>`; `GET /versions/:<versionObjectName>Id` |

An update route is generated only when the object has a field it can write.
A singleton whose content lives only in its children (a footer menu with no
declared field, body or SEO) gets no PATCH /singleton: edit its items, and
change its state through transitions. A child model with no declared field and
no order column likewise gets no item PATCH.

1. Create a draft and retain the returned id. Singleton create rejects a
   second live record (per locale when localized). Localized singleton get
   selects the variant with `?locale=<code>`; PATCH selects it with `locale` in
   the JSON body. Omitting `locale` selects the configured default locale.
   Author-written updates that expose `localeGroupId` must keep one variant
   per locale in each group. Changing `localeGroupId` alone, or together with
   the current locale, rejects an occupied target pair with 409
   `errMsg_ContentLocaleVariantExists`.
2. Edit declared fields, body and SEO. Generated writes exclude `status`, `slug`,
   publish timestamps, `authorUserId` and `currentVersion`. Content guards also
   protect author-written CRUD. A trusted system caller with no user
   session passes those guards: a cron job of the service, an
   internal or event-triggered call, and a verified machine-to-machine token that
   names no user on an `M2MAllowed` API. A call carrying a user session
   (including a machine call on behalf of a user) is held to that user's roles.
   An anonymous call (`loginRequired: false`) is refused 401: content is never
   anonymously writable, and such an API gets the `CONTENT_ANONYMOUS_WRITE`
   warning. Upload media through the bound bucket API,
   then attach its asset descriptor through content/item update.
3. Add children with `contentId`. Ordered children support
   `POST /content-editor/<model>/:id/items/reorder` with
   `{ "itemIds": ["first-id", "second-id"] }`, the exact permutation of that
   parent's live items. The response is `{ "items": [...] }`. Unordered models
   have no reorder route. Child rows inherit the parent's publication state.
4. Read the draft through editorial get. On routed collections,
   `GET /content/<model>/<id>?preview=true` also previews never-published drafts
   for editorial sessions. Preview defaults to true within `publishingSettings`;
   when the section is absent, preview is off. Singleton preview uses its
   delivery base path. Slugs are generated only on first publish.
5. When configured, `submitForReview` then approve. Publish with
   `POST /content/<model>/:id/transition` and `{ "transition": "publish" }`.
   Public pages read the separate `/content/<model>` delivery routes.
6. Versioning enables list/get history and
   `POST /content-editor/<model>/:id/restore-version` with
   `{ "versionId": "snapshot-row-id" }`. The response is `{ "record": {...} }`.
   An absent or blank `versionId` answers 400 (errorCode `MISSING_PARAMETER`),
   a value that is not an id 400 (`INVALID_PARAMETER_TYPE`; on a MongoDB service it
   answers 404 like every generated API), an unknown id
   404. The same id check guards every route `:id` (transition, reorder,
   preview-token, translate, assist).
   Restore copies editable snapshot fields and children back into a draft
   or archived record (the result is a draft); it never publishes or
   unpublishes. Only a draft or archived record restores: a published,
   scheduled, inReview or approved record is refused 409
   (`errMsg_ContentRestoreRequiresDraft`). Run the unpublish, unschedule or
   rejectToDraft transition first, so the lifecycle event and webhooks fire,
   then restore. Restored children receive new storage ids; refresh the
   UI from the returned record and items. Publish explicitly afterward. The `restore` transition
   is different: it un-archives an archived record to draft.

Public delivery answers a public projection. Every delivery read
that is not an editorial `?preview=true` (list records, the slug or singleton
record, search hits, a `?previewToken=` link) carries only `id`, the declared
fields, `body`, `slug`, `seo`, `publishedAt`, `updatedAt` (the "last updated" date
a legal page shows; `locale` and `localeGroupId` when localized) and, on embedded items, `id`,
`parentItemId`, `order`, the declared item fields and `body`. The author id
(`authorUserId`), the workflow columns (`status`, `currentVersion`, `publishAt`,
`unpublishAt`), `createdAt`, the tenant column and the storage keys (`_archivedAt`,
`_owner`, `isActive`, `<enum>_idx`) are never delivered, and neither is a name the
project's secret or internal-column registries carry. The list is derived from the
model, so a system column added later stays out until it is named public. Editorial
reads (`?preview=true`, the editorial Business APIs) keep the full row.

Slugs are minted on first publish from `slugSource`: kebab-cased, accents
dropped, and the Latin letters that Unicode NFKD cannot decompose transliterated first
(Turkish dotless i and capital dotted I to i, sharp s to ss, o-slash to o,
ae to ae, l-stroke to l, d-stroke to d, eth to d, thorn to th, oe to oe).
A value equal to a static sub-route the delivery router mounts under the
model base path (`search`) is skipped like a taken slug, so a page titled
"Search" publishes as `search-2`. A published slug never changes: these rules
apply only to slugs minted after the rule took effect.

The sitemap `GET /content/_sitemap` is public by design. It contains only
published public routed pages. A singleton needs an explicit
`routingSettings.basePath`; a reusable footer/menu without a page path is omitted.
Ordered children retain a reserved Integer `order` column: quote `"order"` in
hand-written SQL. In a service-library query, top-level `order` means sorting; put column
filters in the query envelope.

Decision-moderated writes: `contentModeration` on the model is an
[`objectModeration`](object-moderation.md) block applied to the
synthesized content and item objects. The generated editorial create / update
APIs are then judged before they write; a held write answers `202 { moderation }`
and is written (with its version capture and events) only when a reviewer
accepts it. Staged mode only. The publish transition is not
moderated, by decision: the `submitForReview` and approve workflow above is the
human gate for publication. See
[Object content moderation — content models](object-moderation.md#content-models).

## Validation

| Code | Severity | When |
| --- | --- | --- |
| `CONTENT_NO_PUBLISH_ROLES` | Warning | No `publishRoles` and no `absoluteRoles`: names who publishes instead (the model's fallback operators, or the `editRoles` if those are declared). |
| `CONTENT_ANONYMOUS_WRITE` | Warning | An author-written `create`/`update`/`delete` API on a content, item or version object declares `loginRequired: false`. The guard refuses it (401) at runtime regardless. |
| `CONTENT_TENANT_LEVEL_INERT` | Warning | `contentIsInTenantLevel: true` on a single-tenant project. The flag has no effect; remove it or enable multi-tenancy. |
| `CONTENT_TENANT_LEVEL_LANGUAGE_UNSUPPORTED` | Error | `contentIsInTenantLevel: true` on a multi-tenant project whose service language does not support tenant-level content. Keep the model saas-level, or generate the service in a language that does. |
| `CONTENT_EDITORIAL_APIS_LANGUAGE_UNSUPPORTED` | Warning | The service language has no editorial runtime: no editorial APIs are generated (storage only), and you author and role-gate your own APIs over the content objects, without the content guards. Silenced by `editorialApis: none`. |

## See also

- Spec: [`ContentModel`](../../spec/ContentModel.md), [`ContentModelBasics`](../../spec/ContentModelBasics.md), [`ContentPermissionSettings`](../../spec/ContentPermissionSettings.md).
- [RBAC and roles](../system-services/authentication/rbac.md) — where project role names come from.
- [Multi-tenancy](../data-modeling/multi-tenancy.md) — tenant scoping behind `contentIsInTenantLevel`.
