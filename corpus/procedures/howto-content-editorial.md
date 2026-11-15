# Build a content editorial UI

A ContentModel generates storage and headless delivery. The nodejs reference
also generates missing editorial Business APIs. Create, edit and publish work
without designer-authored CRUD. Set real project roles in permissionSettings:
editRoles for writes, publishRoles for publishing; absoluteRoles bypasses both.
Draft/version reads also admit review/approve roles.

No editRoles fails closed. A model that declares no editRoles is written,
previewed and read in draft only by the platform operators: superAdmin and
admin on a single-tenant project, superAdmin and saasAdmin on a multi-tenant
one. With no publishRoles either, the same operators run every transition
(publish, unpublish, archive, restore, submitForReview). A plain user, a
customer, a tenantUser and any designer role get 403 until you declare roles.
On a multi-tenant project the fallback depends on the model's level (below):
a saas-level model, shared by every tenant, is edited by superAdmin and
saasAdmin only, because a tenant administrator writing shared rows would
change every tenant's content; a tenant-level model adds tenantOwner and
tenantAdmin, each confined to its own tenant. Name tenant roles in editRoles
only if that is what you mean. Every ContentModel has publishing transitions, even without
publishingSettings. Models without publishRoles or absoluteRoles produce the
CONTENT_NO_PUBLISH_ROLES warning, which names who publishes them. Presets do
not invent roles. This closed fallback is the nodejs reference; other
language runtimes still admit any authenticated session on their transition
and preview gates until the #5494 port lands, so declare roles there.

Content level (multi-tenant projects). Set contentBasics.contentIsInTenantLevel
to make a model TENANT level: each tenant's own private content. The default
(false) is SAAS level: general content shared by every tenant, today's
storage, no migration. A tenant-level model's content, item and version rows
carry the <tenantName>Id column and are filtered by it like any tenant-level
DataObject:
- editorial Business APIs, transitions, reorder, restore-version and draft
  preview act only in the caller's session tenant; another tenant's record is
  a 404. superAdmin and saasAdmin are platform users whose session carries the
  root tenant: they edit root-tenant rows there, and reach another tenant's
  rows only through a declared apiInSaasLevel API (the framework's one
  cross-tenant surface). No role crosses the tenant filter.
- public delivery (list, slug, search, singleton, sitemap) serves only the
  requesting tenant's published rows: the session's tenant, else the tenant
  named by the tenant codename header (mbx-<tenantName>-codename, or the
  project's tenantNameHeaderName), else the root tenant (the framework
  convention for every tenant-scoped read). A header naming an unknown tenant
  is refused 404 (errMsg_TenantNotFound) before any content route runs. A
  tenant-site frontend sends that header on every public read.
- slugs are unique per tenant; a singleton is one record per tenant.
- with no editRoles it is edited by superAdmin, saasAdmin, tenantOwner and
  tenantAdmin (a saas-level model: superAdmin and saasAdmin), each inside its
  own tenant; declared roles are confined to the caller's tenant too.
The flag is inert (warning CONTENT_TENANT_LEVEL_INERT) on a single-tenant
project, and refused (CONTENT_TENANT_LEVEL_LANGUAGE_UNSUPPORTED) on a
language other than nodejs until that runtime's port lands.

All paths are relative to the service API base URL. Derive exact request and
response shapes from the blueprint and `openappl/compiler/05-business-apis.md`; an existing designer-authored
object/operation API keeps its route. contentBasics.editorialApis: none opts
out of generation. Generated paths use /content-editor/<kebab-name>, outside
the public delivery slug catch-all.

| Need | Generated route |
| --- | --- |
| Create draft / list every status | POST / GET /content-editor/<model>/records |
| Read / edit collection record | GET / PATCH /content-editor/<model>/records/:<contentObjectName>Id |
| Read / edit sole singleton | GET / PATCH /content-editor/<model>/singleton |
| Soft-delete record | DELETE /content-editor/<model>/records/:<contentObjectName>Id |
| Create / list children | POST / GET /content-editor/<model>/items; list requires ?contentId=<parent-id>; ordered children list by order, then createdAt and id (ascending), the order delivery serves |
| Edit / delete child | PATCH / DELETE /content-editor/<model>/items/:<itemObjectName>Id |
| Read versions | GET /content-editor/<model>/versions?contentId=<parent-id>; GET /versions/:<versionObjectName>Id |

An update route is generated only when the object has a field it can write.
A singleton whose content lives only in its children (a footer menu with no
declared field, body or SEO) gets no PATCH /singleton: edit its items, and
change its state through transitions. A child model with no declared field and
no order column likewise gets no item PATCH.
The ordered-children list order holds on every content runtime except rust,
whose list keeps the createdAt-descending default until its ORDER BY quotes
the reserved order column.

1. Create a draft and retain the returned id. Singleton create rejects a
   second live record (per locale when localized). Localized singleton get
   selects the variant with ?locale=<code>; PATCH selects it with locale in
   the JSON body. Omitting locale selects the configured default locale.
2. Edit declared fields, body and SEO. Generated writes exclude status, slug,
   publish timestamps, authorUserId and currentVersion. Content guards also
   protect designer-authored CRUD. A trusted system caller with no user
   session passes those guards: a cron job of the service, a
   framework-internal or kafka-triggered call, and a verified M2M token that
   names no user on an M2MAllowed API. A call carrying a user session
   (including an M2M call on behalf of a user) is held to that user's roles.
   An anonymous call (loginRequired: false) is refused 401: content is never
   anonymously writable, and such an API gets the CONTENT_ANONYMOUS_WRITE
   warning. Upload media through the bound bucket API,
   then attach its asset descriptor through content/item update.
3. Add children with contentId. Ordered children support
   POST /content-editor/<model>/:id/items/reorder with
   { "itemIds": ["first-id", "second-id"] }, the exact permutation of that
   parent's live items. The response is { "items": [...] }. Unordered models
   have no reorder route. Child rows inherit the parent's publication state.
4. Read the draft through editorial get. On nodejs routed collections,
   GET /content/<model>/<id>?preview=true also previews never-published drafts
   for editorial sessions. Preview defaults true within publishingSettings;
   when the section is absent, preview is off. Singleton preview uses its
   delivery base path. Slugs are generated only on first publish.
5. When configured, submitForReview then approve. Publish with
   POST /content/<model>/:id/transition and { "transition": "publish" }.
   Public pages read the separate /content/<model> delivery routes.
6. Versioning enables list/get history and
   POST /content-editor/<model>/:id/restore-version with
   { "versionId": "snapshot-row-id" }. The response is { "record": {...} }.
   Restore copies editable snapshot fields and children back into a draft
   or archived record (the result is a draft); it never publishes or
   unpublishes. Only a draft or archived record restores: a published,
   scheduled, inReview or approved record is refused 409
   (errMsg_ContentRestoreRequiresDraft). Run the unpublish, unschedule or
   rejectToDraft transition first, so the lifecycle event and webhooks fire,
   then restore. Restored children receive new storage IDs; refresh the
   UI from the returned record and items. Publish explicitly afterward. The restore transition
   is different: it un-archives an archived record to draft.

The sitemap GET /content/_sitemap is public by design. It contains only
published public routed pages. A singleton needs an explicit
routingSettings.basePath; a reusable footer/menu without a page path is omitted.
Ordered children retain a reserved Integer order column: quote "order" in
handwritten SQL. Service-library top-level order means sorting; put column
filters in the query envelope. No column rename/migration is required.

golang has no content runtime yet: a golang service gets no generated
editorial APIs (storage only) and the warning
CONTENT_EDITORIAL_APIS_LANGUAGE_UNSUPPORTED (editorialApis: none silences it);
author and role-gate your own APIs over the content objects there, without
the content guards. Delivery runtimes exist for nodejs, python, java, dotnet
and rust. The new
editorial runtime operations and guards are the nodejs reference contract;
other runtime language changes are tracked in port records.
