# Writer guide: notification-definitions

The project's notification layer: one canonical notification per business
event, derived by collecting the `## Notification Needs` of every service
spec and of the auth spec. The notification blueprint procedure
(`procedures/notifications-blueprint.md`) transcribes it, and the BFF spec reads it
to plan notification payload views - this document is what breaks the
notifications / BFF dependency. Owed when `hasNotifications` is on; written
after every service spec, in parallel with the agent-hub spec.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `project-basic-setup` (its `## Providers` - provider names by
  channel), `prd`, `use-cases` (the completeness cross-check),
  `microservice-definitions` (the Event Contracts table: topics, emission,
  payload keys).
- Supplementary: every service spec (`service-spec-*`) and the `auth-spec`
  (when the project has authentication) - their `## Notification Needs`
  sections are the primary source (the auth spec's is usually `- (none)`;
  the auth module's system notices are sent by the platform and never
  appear); the project codename (the blueprint's `codename`).
- Canon: `procedures/design/canon/event-envelope.md`,
  `procedures/design/canon/provider-shipped-state.md`.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `notification-definitions` in
`procedures/design/pipeline.json`; write each exactly as given. The per-notification
H2 sections between them are named after each notification.

- `## Service Settings`
- `## Provider Matrix`
- `## Open Questions`

## Document skeleton

```markdown
# Notification Definitions

## Service Settings
## Provider Matrix
## <NotificationName>        <- one H2 per notification, repeated
## Open Questions
```

Per notification, EXACTLY these fields:

```markdown
## <NotificationName>
- **event:** <service>:<event> - topic: <exact derived topic>
- **emission:** derived | explicit
- **trigger source:** kafka (default) | geofence <action/fenceTags/condition>
- **condition:** <fire-or-not intent over named payload keys, or (none)>
- **jobType:** email | sms | push | telegram | whatsapp | inApp
- **stored:** true|false
- **targets:** one line per target - name, targetKind, targetPathInData,
  isArray, per-target condition
- **data:** raw payload | dataView <ViewName> (idPath <path>) | includeData mappings
- **template:** subject + body content requirements (the fields each renders)
- **action:** deepLink intent + actionText (or none)
- **provider:** default per channel | named override
```

## Rules

Collect every entry each spec declared under `## Notification Needs`, dedupe,
and normalize into one canonical notification per business event. Do NOT
invent notifications a spec did not ask for (the only exception is the PRD
cross-check below, with an explicit `source: PRD` marker), and do NOT include
system notifications (password reset, verification codes, login alerts) - the
platform sends those.

**`## Service Settings`** - `storedNotice` (on whenever any definition is
`inApp` or `stored: true`), `notificationLogRetentionDays` (integer), `defaultProviders`
(one line per channel in use, `channel -> <provider name>`, names from
project-basic-setup `## Providers` only).

**`## Provider Matrix`** - one line per channel any definition uses:
`- <channel> -> <provider name> -> <provider type>`. A channel with NO
configured provider is a blocking gap: `- <channel> -> **GAP: no provider
configured** - blocks <NotificationName>, ...`, also listed under
`## Open Questions`. Never invent a provider to fill it.

Field rules:

- **event / topic** - the raising service and event; the topic is the derived,
  lowercase, codename-prefixed string (event-envelope canon section 3) and
  must be a row of the msd Event Contracts table. A table topic with a wrong
  prefix or camelCase segments: use the correct form and note the
  discrepancy.
- **emission** - copied from the contract row; it decides WHICH keys the
  payload carries (the record for `derived`, the authored keys for
  `explicit`). If the row promises keys the record does not carry and no
  explicit publish exists, write `- **payload gap:** producer must publish
  explicitly` instead of aliasing.
- **condition** - only when the event fires in cases the notification must
  skip; intent over NAMED payload keys, bound by the blueprint.
- **jobType** - from the REQUIREMENT documents: if the PRD scopes email or push
  out, every user-facing definition is `inApp`; email only for flows the PRD
  keeps. The default channel is email unless the requirements need another.
- **stored** - decided for every definition (true for anything the user should
  find later in the bell center; `inApp` is stored unless you say why not).
- **targets** - `targetKind: userId` is the default for a user id carried in
  the payload; the audience kinds `role` and `userGroup` address a declared
  role value or user group (`targetValue`, no data path) and are resolved at
  delivery time - in a multi-tenant project state the audience's `scope`
  (`tenant`, the default: the event's tenant only, and the target fails
  visibly when no tenant is resolvable; `global` for a deliberate
  cross-tenant audience such as every saasAdmin), and a `userGroup` audience
  needs user groups on in the auth spec; direct handles (email, phoneNumber, whatsappPhone,
  telegramHandle, deviceToken) are ONLY for recipients who are not platform
  users. `targetPathInData` is an exact BARE key (the listener unwraps the
  envelope) - view-relative when the data source is a DataView. `isArray:
  true` for fan-out targets.
- **data** - the enrichment decision. A DataView named here MUST be designed
  by the bff-spec: name it precisely so the BFF spec designs it, and never
  name a view no consumer needs.
- **template** - every field the subject and body render, and where it comes
  from (payload key or view field); a field the data source does not carry is
  a defect.
- **provider** - write `default` explicitly or the named override.

Hard rules:

- **Admin recipients:** a notification for every admin (or every holder of
  another role) is a role audience: `targetKind: role`, `targetValue: admin`
  (a built-in or a declared custom role value - `admin` in a single-tenant
  project; `tenantAdmin` or `saasAdmin` in a multi-tenant one). A data-dependent subset (the
  admins of one organization) targets an id array the PRODUCER stamps at
  publish time, named in the contract row; if no row carries it, record
  `- **payload gap:** producer must stamp <key>`. Never target the event's
  user, owner or creator fields for admins.
- **Never notify the ACTOR about their own action.** The recipient key is the
  affected party's id (the content owner for a comment, the followee for a
  follow). If the payload carries no key for the true recipient, record
  `- **payload gap:** producer must add <key>`.
- **Appeals** (both directions: submitted -> admins, outcome -> appellant)
  and **follower fan-out** when in scope. The fan-out mechanism is the ONE the
  Event Contracts table names (e.g. the producer stamps `followerUserIds[]`);
  target that key with `isArray: true`. If the table names none, record a
  payload gap - never invent a fan-out.
- **Every event is produced by a real element:** a `raiseApiEvent` on the
  named API (the derived topic of that API's own object) or an explicit
  publish the contract table names. An outcome event on a different object
  than the producer API needs an explicit publish with the exact topic.
- **PRD completeness cross-check:** list every notification the PRD and use
  cases imply (approved / rejected -> owner, appeal outcome -> appellant, new
  follower, new comment -> content owner, escalation -> admins, new
  publication -> followers). One a spec missed is ADDED with `- **source:**
  PRD (missing from <service> spec)`.
- No secrets: providers are names; credentials never appear.

Worked example (shape, not content):

```markdown
## CommentOnContent
- **event:** content:comment-created - topic: acme-content-service-comment-created
- **emission:** derived
- **trigger source:** kafka
- **condition:** (none)
- **jobType:** inApp
- **stored:** true
- **targets:** contentOwner - targetKind: userId - targetPathInData:
  contentOwnerId - isArray: false - condition: contentOwnerId is not
  commenterUserId (actor exclusion)
- **data:** dataView CommentNotificationView (idPath commentId) - carries the
  commenter fullname and avatar and the content title
- **template:** subject "New comment on <contentTitle>"; body renders
  commenterFullname, a commentText excerpt, contentTitle (all from the view)
- **action:** deepLink to the content's comment thread - actionText "View comment"
- **provider:** default
```

If the project genuinely needs no notifications, say so explicitly.

## Completeness check

1. Every spec's `## Notification Needs` entry is represented (or its dedupe
   target named); every PRD-implied notification is present.
2. Every topic is a contract-table row, lowercase and codename-prefixed.
3. Every target path, condition and template field is a real payload or view
   key; no definition targets the actor of its own event.
4. Channels match the PRD's channel scope; every used channel has a Provider
   Matrix row or a recorded blocking gap.
5. Every DataView named under **data** is precise; every stored / inApp
   decision is explicit; no system notification is included.
6. Every unresolved item is under `## Open Questions` marked `OPEN`.

## Output

Write the document to `design/notification-definitions.md` (writer contract
section 4).
