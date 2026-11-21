# Blueprint review checklist

This checklist is for reviewing an OpenAPPL blueprint before it is compiled or shipped.
Each item says what to check, why it matters, how to fix it, and the codes the reference
validator uses for the rule. Other validators may use other codes. When you have a
semantic validator, its codes tell you which item a finding belongs to. When you do not,
the item tells you what to look for by reading.

Walk every item over every element it concerns. Look up any option you are unsure of on
its spec page (`../openappl/spec/<Pattern>.md`). The authorization rules behind items 1,
2 and 5 are Part 3, chapter 6; the data rules behind items 3 and 4 are Part 3, chapter 4.

Severity in the tables: **error** means the reference validator refuses the blueprint,
**warning** means it reports a likely mistake and builds, **manual** means no validator
rule covers it and only a reader finds it.

## 1. Ownership fields and `ownershipCheck`

**Check.**

- Every data object whose rows belong to one user has exactly one property marked
  `sessionSettings.isOwnerField: true` with `sessionSettings.sessionParam: "userId"` (or
  the session field that identifies the user).
- Every get, update, delete and list API that must only reach the caller's own rows sets
  `authOptions.ownershipCheck: true`. The object's `dataObjectAccess` is a default for its
  APIs, not a replacement for this flag.
- `ownershipCheck` appears only on objects that have an owner field, and not on create
  APIs.
- A create API does not write the owner property from a data clause item or a request
  value.

**Why.** The owner of a row is the user who created it, taken from the session. With no
owner field nothing identifies the owner, so no gate can be generated. On a create there
is no row yet, so the flag does nothing. An owner written from the request lets a caller
create rows in someone else's name; an owner written from a data clause on a create is
discarded, because the session wins, and on an event-triggered create the session is the
triggering actor, so the row lands with the wrong owner.

**Fix.** Mark the owning property (`isOwnerField`, `sessionParam`). Set `ownershipCheck`
on each private get, update, delete and list API. For a create under a parent the caller
must own, use `authOptions.parentOwnershipChecks` instead of `ownershipCheck`. Remove
owner entries from create data clauses.

| Code | Severity | Rule |
|---|---|---|
| `OWNERSHIP_CHECK_WITHOUT_OWNER_FIELD` | error | `ownershipCheck` on an object with no owner field |
| `OWNERSHIP_CHECK_NOT_APPLICABLE` | warning | `ownershipCheck` on a create API |
| `OWNER_CLAUSE_SHADOWED_BY_SESSION` | error | a create data clause item writes the owner field |
| `OWNER_PROVENANCE_PAYLOAD_WITH_REST_CREATE` | error | the owner comes from the payload on a create callers can reach |
| `PARENT_OWNERSHIP_OWNER_FIELD_NOT_FOUND`, `PARENT_OWNERSHIP_OBJECT_NOT_FOUND` | error | a parent ownership check names an owner field or object that does not exist |

## 2. Tenant scope

**Check.** In a multi-tenant project
(`authentication.loginDefinition.tenantSettings.useMultiTenantFeature: true`):

- every object that holds one tenant's data sets
  `authorization.objectDataIsInTenantLevel: true` explicitly;
- every object that is shared by all tenants (a global catalogue, reference data) sets it
  to `false` explicitly;
- every API with `authOptions.apiInSaasLevel: true` really is a cross-tenant surface and
  says so with `authOptions.crossTenantScopeOf`.

**Why.** Only a stored `true` adds the tenant column and the tenant filter. The schema
lists `true` as the default, but an object that omits the flag gets no column and no
filter, so its rows are visible to every tenant. `apiInSaasLevel` removes the tenant
filter from an API's reads: rows of every tenant come back.

**Fix.** Write the flag on every data object. Remove `apiInSaasLevel` from APIs that are
not meant to cross tenants; on the ones that are, add `crossTenantScopeOf` naming the
source.

| Code | Severity | Rule |
|---|---|---|
| (none) | manual | a tenant-owned object without an explicit `objectDataIsInTenantLevel: true` |
| `SAAS_LEVEL_TENANT_READ_UNDECLARED` | warning | `apiInSaasLevel` reads a tenant-scoped object without `crossTenantScopeOf` |
| `CROSS_TENANT_READ_WITHOUT_SAAS_LEVEL` | warning | `crossTenantScopeOf` without `apiInSaasLevel`, so nothing is waived |

## 3. Relations and `onDeleteAction`

**Check.** For every property with `relationSettings`:

- the `onDeleteAction` is written, not left to the default;
- a required foreign key (`basicSettings.isRequired: true`) does not use `setNull`;
- a relation with `relationIsRequired: true` does not use `setNull`;
- the target object (and service, for `service:object`) exists.

**Why.** Deleting a parent applies each child's delete action. `setNull` on a NOT NULL
column is a constraint violation at run time, every time a parent is deleted. An omitted
action behaves as `doDelete` in the reference, which may delete more than intended.
Relations to another service and self-references do not cascade at all.

**Fix.** Choose by the shape of the relation. A child that is part of the parent and
meaningless without it: `doDelete`. An independent record that points at the parent and
must keep pointing: `restrict` (the parent's delete answers 409 `RELATION_RESTRICTED`
while children exist) or `doNothing` (with soft delete, the reference still resolves to
the archived parent). Only a pointer that may go empty gets `setNull`, and then the
column is not required.

| Code | Severity | Rule |
|---|---|---|
| `RELATION_SETNULL_ON_REQUIRED_FK` | error | `setNull` on a required foreign key |
| `RELATION_SETNULL_ON_REQUIRED_RELATION` | warning | `setNull` with `relationIsRequired: true` |
| `RELATION_TARGET_SERVICE_NOT_FOUND` | error | the relation names a service that does not exist |
| (none) | manual | `onDeleteAction` omitted |

## 4. Required properties without a value source

**Check.** For every create API, every required property of its object gets a value from
exactly one source: a `query.dataClauseItems` entry, the session
(`sessionSettings.sessionParam`), a static join (`staticJoin.jointSource`), a default
(`basicSettings.defaultValue` or `defaultFn`), or a database sequence. Every required
request parameter that matches a stored property is written by a data clause item.
Every property says `isRequired` explicitly.

**Why.** A required column with no source fails every insert at run time. A required
parameter that nothing stores makes the caller send a value that is thrown away. An
omitted `isRequired` makes the column nullable, so no create is asked for a value.

**Fix.** Add the data clause item (`{ "name": "<property>", "value": { "js":
"this.<param>" } }`), or a default, or a session binding. Do not hand-write a value for
a credential column (`basicSettings.hashed` or `isSecret`): generate it server side in an
action. Set `isRequired` on every property.

| Code | Severity | Rule |
|---|---|---|
| `MISSING_DATA_CLAUSE_ITEM` | error | a create API leaves a required property without a value |
| `CHILD_CREATE_MISSING_VALUE_SOURCE` | error | a create action inside a workflow leaves a required property without a value |
| `REQUIRED_PARAM_NOT_STORED` | warning | a required parameter matches a property no data clause writes |
| `IS_REQUIRED_UNSPECIFIED` | warning | a property does not say whether it is required |

## 5. Public APIs and their where clauses

**Check.** For every API with `authOptions.loginRequired: false`:

- it carries no `checkRoles`, `ownershipCheck`, `permissionCheck` or parent ownership
  check (they are all switched off by `loginRequired: false`);
- a public get or list has a where clause that returns only rows meant for the public
  (for example `{ "js": "{ status: 'published' }" }`), not every row of the object;
- a public create, update or delete is intended, and its abuse limits are designed;
- a public object with a geo property, or a view read by a public API, limits what it
  exposes.

For every update and delete API (public or not): the route or the where clause names the
row it acts on.

**Why.** `loginRequired: false` short-circuits every role, permission and ownership
check: the gates written beside it guard nobody. A public list without a where clause
publishes drafts, deleted-by-status rows and other users' data. An update with no row
selector, or a where clause with no request value in it, changes every matching row on
every call.

**Fix.** Remove the gates, or set `loginRequired: true`. Add the where clause that limits
public reads to public rows. Restrict the response with a select clause. Give updates and
deletes a `:id` path parameter or a `selectBy`.

| Code | Severity | Rule |
|---|---|---|
| `PUBLIC_API_WITH_ROLE_GATE` | error | a gate on an API that `loginRequired: false` switches off |
| `PUBLIC_MUTATION_AUTHZ_PIPELINE_OFF` | warning | an anonymous write that authors gates that guard nobody |
| `ABSOLUTE_ROLES_ONLY_ON_PUBLIC_WRITE` | error | a write whose only gate is `absoluteRoles`, which is a bypass list, so every logged-in caller passes |
| `GEO_PUBLIC_SURFACE_UNFILTERED` | warning | a public object with a geo property and no visibility filter on its geo routes |
| `DATAVIEW_PUBLIC_UNPROJECTED` | warning | a view without a property list read by a public API |
| `EXPOSE_SECRETS_ON_ANONYMOUS_API` | warning | a secret column exposed by an API anonymous callers reach |
| `UPDATE_DELETE_WITHOUT_ROW_SELECTOR` | error | an update or delete that does not identify its row |
| `WHERECLAUSE_UNSCOPED_CASCADE` | warning | an update or delete action whose where clause uses no request value |
| (none) | manual | a public get or list with no where clause on an object that has non-public rows |

## 6. Secrets

**Check.**

- Every credential value in the blueprint (provider keys, client secrets, webhook
  secrets, tokens, passwords of external systems) is a **reference**, never the value: an
  environment reference such as `"$ENV:STRIPE_SECRET_KEY"` (recommended in a committed
  blueprint) or the `"ENTER_CREDENTIAL"` placeholder with `"secret": true` while the value
  is not provided yet. The two forms and how they relate are in
  [Secrets in a blueprint](../openappl/guides/blueprint/secrets.md). The fields that hold
  credentials are marked `"secret": true` in the provider catalogue of `openappl.json`.
- A custom variable with a secret-shaped name is not marked as plain.
- Library code does not read secret environment variables directly.
- The seeded super-admin password is not a real password. It is readable by everyone who
  reads the blueprint, so it is either an environment reference (`"$ENV:SUPERADMIN_PASSWORD"`)
  or a placeholder that the administrator changes on first login
  (`"change-me-on-first-login"`), and never the well-known default.
- Properties that hold secrets are marked `basicSettings.hashed` or `isSecret`, and are
  not added back to responses, joins or filters.

**Why.** A blueprint is stored, exported, reviewed and published. A literal secret in it
is a leaked secret. The compiler keeps secrets out of generated code and makes each one
configurable through the environment (Part 3, chapter 10), but only an environment
reference keeps it out of the blueprint itself.

**Fix.** Replace each literal with `$ENV:<NAME>` and set the variable in the deployment (or
with `ENTER_CREDENTIAL` while no value exists).
Rotate any secret that was ever committed. Read secrets in library code through the
generated configuration, not `process.env.SECRET*`.

| Code | Severity | Rule |
|---|---|---|
| (none) | manual | a literal credential where a reference (`$ENV:` or `ENTER_CREDENTIAL`) belongs (`mind-set validate` and `mind-set spec-coverage` warn with `secret-literal` on a credential field or a credential-shaped value) |
| `CUSTOM_VARIABLE_SECRET_SHAPED_PLAIN` | warning | a secret-shaped custom variable marked `secret: false` |
| `PROCESS_ENV_SECRET_FORBIDDEN` | error | library code reads `process.env.SECRET*` |
| `SUPERADMIN_PASSWORD_IS_DEFAULT` | warning | the super-admin seed password is the default |
| `SELECT_JOIN_SECRET_COLUMN` | error | a join embeds a secret column of the joined object |
| `RUNTIME_FILTER_SECRET_FIELD` | warning | a list lets callers filter on a secret column |

## 7. Select clauses on owner-checked writes

**Check.** Every update and delete API with `ownershipCheck: true` declares
`query.selectClause.selectProperties`.

**Why.** Without a list, the answer carries the full stored row, including bookkeeping
columns the caller has no use for. The owner sees their own row, but the response shape
then changes whenever the object gains a column.

**Fix.** List the properties the caller needs. The response is then those properties
plus `id` and `_type`; the write, the check and the events keep the full row.

| Code | Severity | Rule |
|---|---|---|
| `OWNERSHIP_WRITE_RESPONSE_UNBOUNDED` | warning | an owner-checked update or delete with no select list |

## 8. Enums and their defaults

**Check.** For every property of type `Enum`:

- `enumOptions` has at least one value, with one casing project-wide (lowercase is the
  convention, status values in passive form: `approved`, `rejected`);
- no two options differ only by case, underscore or one letter;
- a required enum has a `defaultValue` that is one of its options, or every create API
  writes it;
- `defaultValue` is a literal, not an MScript object;
- MScript compares the property only with values from its options.

**Why.** Options that drift in spelling (`canceled`, `cancelled`) are two different
values at run time, and comparisons against the other spelling never match. A default
that is not an option writes a value the API boundary then refuses. A required enum with
no default and no data clause item fails every create.

**Fix.** Normalise the option list, pick a default from it, and use the same strings in
every expression and every design document.

| Code | Severity | Rule |
|---|---|---|
| `ENUM_MIN_OPTIONS` | error | an enum without options |
| `ENUM_DUPLICATE_VALUE`, `ENUM_NEAR_DUPLICATE_VALUE`, `ENUM_TYPO_VALUE` | warning | options that are the same value in different spellings |
| `INVALID_DEFAULT_VALUE` | error | a default that is an MScript object instead of a literal |
| `MSCRIPT_ENUM_LITERAL_UNKNOWN` | error | an expression compares the property with a value outside its options |
| (none) | manual | a `defaultValue` that is not one of the options |

## 9. Values the caller should not choose

**Check.** Data clause items of create and update APIs do not take from the request any
value the system must decide: prices and amounts, statuses that a workflow or a payment
moves, owner and tenant ids, counters, approval flags.

**Why.** A request value is whatever the caller sends. An order whose amount comes from
the request is paid at the price the buyer chose. The payment flow itself reads the
amount from the stored order, so the stored value has to be right.

**Fix.** Compute the value server side: from a related record (a static join or a fetch
action), from a constant in the data clause (`{ "js": "'pending'" }`), or from a library
function.

| Code | Severity | Rule |
|---|---|---|
| (none) | manual | a money, status or identity value written from a request parameter |

## 10. Derived surface surprises

**Check.** For every high-level pattern in the blueprint, read what it adds in
`../openappl/compiler/12-derived-surface.md`, then check:

- no declared data object, API or property uses a name the pattern adds (`sys_<X>Payment`,
  `get<X>PaymentByOrderId`, `isDefault`, `moderationStatus`, ...), and no declared object
  starts with `sys_`;
- the implicit routes the pattern adds are acceptable for this product (payment routes and
  the provider webhook, bucket upload and download routes, the four geo routes of every
  stored geo property);
- data-change events are on for every stored object by default; objects whose changes
  must not leave the service set `objectSettings.basicSettings.publishDbEvents: false`,
  and nothing consumes those topics;
- every published topic has a consumer, or the announcement is intended.

**Why.** The author does not see lowered elements in the blueprint they edit. A
collision either fails the build or lets one definition silently replace the other. An
implicit route is reachable by clients whether or not anyone planned for it.

**Fix.** Rename the colliding element. Narrow or switch off what the pattern exposes
through its own settings (route access, visibility filters, `publishDbEvents`). Document
the intended announcements.

| Code | Severity | Rule |
|---|---|---|
| `API_NAME_COLLISION` | error | two APIs with one name, declared or added |
| `SYSTEM_RESERVED_NAME_COLLISION` | error | a declared object uses a name the framework reserves |
| `RESERVED_SYSTEM_OBJECT_PREFIX` | error | a declared object uses the `sys_` prefix |
| `RESERVED_PROPERTY_NAME` | error | a declared property uses a reserved name |
| `GEO_PUBLIC_SURFACE_UNFILTERED` | warning | see item 5 |
| `DB_EVENTS_SWITCH_CONSUMED` | error | `publishDbEvents: false` on an object something in the project consumes |
| `TOPIC_NO_CONSUMER` | warning | a published topic that no service consumes (often intended, such as the login announcement) |

## 11. Whole-project checks

**Check.** These cross service boundaries, so no single-service validation finds them. Run
them after the last service is written ([delivery](delivery.md) sections 1 and 3):

- every topic a Kafka-triggered API or event subscription **consumes** has a producer (an
  API that raises it, an explicit publish action, or a data-change event of a stored
  object). The mirror rule of item 10 checks the other direction: every published topic has
  a consumer or an intended announcement;
- every DataView has at least one consuming API, with `dataViewName` **wired** on a get or
  list API, not merely defined;
- every cross-service reference names a service and object that exist (or a service of the
  `servicePlan`, which downgrades the finding to a warning until it is written);
- every module the design turns on (`bffService`, notification wiring, `agentHub`) holds
  its artifact (`mind-set spec-coverage`);
- every provider a pattern names exists in `projectSettings`
  ([project settings](project-settings.md));
- the findings are all **read**: each warning code is fixed or has a recorded decision
  pinned to its count ([the warnings ledger](delivery.md) section 5).

**Why.** A consumer of a topic nobody raises never runs and nothing reports it. A DataView
nothing consumes is dead weight and the sign that the BFF was authored but never wired. A
validation that is keyed on severity passes a delivery whose 43 warnings were never read.

**Fix.** Author the missing producer, consumer or wiring; or remove the dead element
deliberately; or record the decision in the ledger.

| Code | Severity | Rule |
|---|---|---|
| (none) | manual | a consumed topic without a producer; a DataView without a consuming API |
| `FETCH_SCALAR_CONSUMED_AS_LIST`, `MSCRIPT_ASYNC_LIB_NOT_AWAITED`, `OPTIONAL_FETCH_RESULT_READ_UNGUARDED`, `SECONDARY_KEY_NOT_DISCOVERABLE`, `LIB_UNDECLARED_IDENTIFIER` | error / warning | the authoring rules of [Rules the validator enforces](../openappl/guides/best-practices/validator-rules.md) |

## 12. Shapes a compiler refuses to build

**Check.** A compiler may refuse some insecure shapes even when the author asks to skip
validation. A blueprint with one of them cannot be delivered, so find them by reading too:

- a cart-related action, agent tool or DataView that reaches a cart which is not
  operator-only (`CART_*` codes);
- an unenforced gate: `PUBLIC_API_WITH_ROLE_GATE`, `ABSOLUTE_ROLES_WITHOUT_GATE`,
  `ABSOLUTE_ROLES_ONLY_ON_PUBLIC_WRITE`, `OWNERSHIP_CHECK_WITHOUT_OWNER_FIELD`,
  `PARENT_OWNERSHIP_CHECK_INCOMPLETE`;
- `INTERNAL_API_OWNERSHIP_UNENFORCEABLE`: an `ownershipCheck` on an API with an internal
  call controller. An internal call runs as the system on any row, so the check can never
  hold;
- `OWNER_PROVENANCE_PAYLOAD_WITH_REST_CREATE`, `JOBSTREAM_ENQUEUE_ACCESS_WEAKENS_TARGET`,
  `PRE_AUTH_MACHINE_AUTHORITY_ACTION`;
- `AUTH_USER_ROLE_WRITE_UNGUARDED`: a custom authentication API or action that writes the
  user's `roleId` outside the guarded role doors. Use the role-update and create-user doors
  the authentication service provides, model an earned label ("verified seller") as a
  **badge object** that holds the label, and keep a real role change in a
  machine-to-machine-only authentication API;
- a read that returns withheld data: `DATAVIEW_PUBLIC_PROJECTION_LEAK`,
  `CROSS_TENANT_READ_DECLARATION_MISMATCH`, `LIST_ROW_REDACTION_ON_NON_LIST`,
  `LIST_ROW_REDACTION_WRONG_STAGE`.

**Why.** Each of these is a blueprint that looks complete and is open to someone it was
meant to exclude.

**Fix.** Change the blueprint. Do not retry with validation skipped: a compiler that
refuses the shape refuses it again.

| Code | Severity | Rule |
|---|---|---|
| (the codes above) | error | the shapes a compiler does not build; their rules are in items 1, 2, 5 and 9 |

## Reporting

For each finding write the severity, the JSON path, the item and code, why it matters
for this blueprint, and the fix. A finding without a path is not a finding. When no
semantic validator ran, say that the review was done by reading.
