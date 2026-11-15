---
title: Action composition
---

# Action composition

How to assemble a business API's actions so the workflow is easy to read
and hard to break. Actions are declared in `actions.<partition>[]` — one
partition per action class (`actions.validationActions`,
`actions.fetchObjectActions`, …) — and run only where `workflow` lists
them. Under the key of the API's crudType, `workflow` holds one array of
action names per milestone (`workflow.create.afterCheckParameters:
["limitCheck"]`). The milestones run in the pipeline's fixed order;
inside one milestone the actions run in array order. The milestone list
of each crudType is in
[Actions and workflow — overview](../workflow/overview.md).

## Order matters; default to deny

The pipeline runs the language's own gates in a fixed order: the login
check right after `afterStartBusinessApi`, the declared parameter checks
(required, type) before `afterCheckParameters`, and the `authOptions`
role, permission and ownership gates before `afterCheckBasicAuth`. Place
your own actions against that order:

| Milestone | Put here |
|---|---|
| `afterCheckParameters` | Checks that read only the request — a `ValidationAction` on a parameter. |
| `afterCheckBasicAuth` | Checks that read the caller's grants or a row: `PermissionCheckAction`, `MembershipCheckAction`, a `FetchObjectAction` and the `ValidationAction` that inspects its result. |
| `afterFetchInstance` / `afterCheckInstance` (update, delete) | Checks on the row being changed, loaded as `this.instance`: `ObjectPermissionCheckAction`, a `MembershipCheckAction` keyed on its parent, state rules. |
| `afterBuildDataClause` | A write that may fail and must leave the database untouched when it does. |
| `afterMain<Crud>Operation` | Side effects of the committed write: `PublishEventAction`, child CRUD actions, mail. |
| `afterBuildOutput` | Response shaping: `AddToResponseAction`, `RemoveFromResponseAction`. |

A check that reads a row answers differently for a row that exists and
one that does not. Run before the access gates, its error tells a caller
who may not see the row whether it exists — so access first, data checks
second. Within one milestone, put the cheapest and strictest check
first: a `liveCheck` that fails stops the API, and the actions after it
never run.

## One responsibility per action

A `ValidationAction` rule with three predicates is OK. A rule with
twenty predicates is a smell — split it into named validations, each
with its own message and status:

```json
{
  "actions": {
    "fetchObjectActions": [
      { "name": "loadAccount", "targetObject": "account", "matchValue": { "js": "this.accountId" }, "localKey": "id", "isRequired": true, "contextPropertyName": "account" }
    ],
    "validationActions": [
      { "name": "limitCheck",    "description": "Cap per-request withdrawal amount", "validationScript": { "js": "this.amount <= 10000" },                    "errorMessage": "Amount exceeds withdrawal cap.",     "errorStatus": "422" },
      { "name": "currencyCheck", "description": "Only USD/EUR accepted",             "validationScript": { "js": "['USD', 'EUR'].includes(this.currency)" }, "errorMessage": "Unsupported currency.",              "errorStatus": "400" },
      { "name": "windowCheck",   "description": "Enforce 24h withdrawal cooldown",   "validationScript": { "js": "!this.account.lastWithdrawalAt || Date.now() - new Date(this.account.lastWithdrawalAt).getTime() >= 24 * 3600 * 1000" }, "errorMessage": "Withdrawal window has not elapsed.", "errorStatus": "422" }
    ]
  },
  "workflow": {
    "create": {
      "afterCheckParameters": ["limitCheck", "currencyCheck"],
      "afterCheckBasicAuth":  ["loadAccount", "windowCheck"]
    }
  }
}
```

Three named actions = three named failure modes for the caller.
`limitCheck` and `currencyCheck` read only request parameters
(`this.amount`, `this.currency`), so they run first; `windowCheck` reads
the account row, so it runs after the access gates, once `loadAccount`
has put the row on `this.account`.

## Pull data once

If several actions need the same record, fetch it once with a
`FetchObjectAction` whose `contextPropertyName` names it, and read
`this.<contextPropertyName>` in every later action, as `windowCheck`
reads `this.account` above. The generated service does not dedupe
repeated fetches. On an update or delete, the row being changed is
already loaded as `this.instance` from `afterFetchInstance` on; don't
fetch it again.

## Compose responses with `AddToResponse`

Build the response progressively, by adding fields rather than computing
the whole payload at the end. Easier to debug "what's missing in the
response" when each field has a named source.

## Skip the trivial cases early

```json
{
  "basics": {
    "apiOptions":  { "name": "publishOrder", "crudType": "update", "dataObjectName": "order" },
    "authOptions": { "loginRequired": true }
  },
  "query": {
    "dataClauseItems": [ { "name": "status", "value": { "js": "'published'" } } ]
  },
  "actions": {
    "validationActions": [
      {
        "name":             "isPublishable",
        "description":      "Block publish unless the order is still a draft",
        "validationScript": { "js": "this.instance.status === 'draft'" },
        "errorMessage":     "Order is not in a publishable state.",
        "errorStatus":      "422"
      }
    ]
  },
  "workflow": { "update": { "afterCheckInstance": ["isPublishable"] } }
}
```

A `ValidationAction` is the cheap, terminal "stop here if X" — better
than wrapping every subsequent action with a `condition`.

## Branch on state, don't conditionalize every step

When an API has two paths (e.g. "new member → send welcome; replayed
signup → skip"), put the `condition` on the one action that differs —
don't sprinkle `condition`s through every entry.

```json
{
  "actions": {
    "renderDataActions": [
      { "name": "welcomeBody", "template": "welcomeEmail", "inputData": { "js": "this.member" } }
    ],
    "sendMailActions": [
      {
        "name":      "welcome",
        "condition": { "js": "this.createOutcome === 'created'" },
        "provider":  "sendgrid",
        "subject":   { "js": "'Welcome to Acme!'" },
        "body":      { "js": "this.welcomeBody" },
        "to":        { "js": "this.member.email" }
      }
    ]
  },
  "workflow": { "create": { "afterMainCreateOperation": ["welcomeBody", "welcome"] } }
}
```

Here the `member` object declares a unique index on `email` with
`onDuplicate: "stopOperation"`, so a replayed signup answers 2xx without
inserting a row, and `this.createOutcome` says which case ran (see
[What the create actually did](../workflow/workflow-context.md#what-the-create-actually-did-thiscreateoutcome)).
`SendMailAction.body` is MScript — the rendered content comes from a
prior `RenderDataAction`, whose `template` names an entry of the service
library's `templates[]` partition and whose result lands on
`this.welcomeBody` (its `name`, since no `contextPropertyName` is set).
`SendMailAction` has no template field of its own; the rendering step is
separate. Its `provider` names an email provider of
`projectSettings.notificationProvidersSettings`; a send needs either
that or a `mailAccount` (`MAIL_TRANSPORT_REQUIRED`).

## Receive → read → reply (mailbox workflows)

A `MailAccount` with `autoListen` pushes every inbound mail onto the
`new-email-arrived` Kafka topic as a metadata-only envelope (attachment
bytes are deliberately NOT on the bus). A mailbox TEMPLATE (`ownerScope`
tenant / user) publishes the unified event envelope instead, stamped with
the owner, the tenant and the `mailbox` the actions take: see
[Mail to tasks](../capabilities/mail-to-tasks.md) for that variant. The canonical mail workflow is a
Kafka-triggered API (`controllers.kafkaSettings: { "hasKafkaController":
true, "requestTopicName": "new-email-arrived" }`) that composes the
three mailbox actions. The envelope is the Kafka message body, so a
request parameter binds its `messageId`:

```json
{
  "parameters": {
    "requestParameters": [
      { "name": "messageId", "type": "String", "required": true, "httpLocation": "body" }
    ]
  },
  "actions": {
    "readMailActions": [
      {
        "name":                "readMail",
        "mailAccount":         "support",
        "messageId":           { "js": "this.messageId" },
        "contextPropertyName": "fullMail"
      }
    ],
    "renderDataActions": [
      { "name": "replyBody", "template": "supportReply", "inputData": { "js": "this.fullMail" } }
    ],
    "sendMailActions": [
      {
        "name":        "sendReply",
        "mailAccount": "support",
        "to":          { "js": "this.fullMail.from.address" },
        "subject":     { "js": "`Re: ${this.fullMail.subject}`" },
        "body":        { "js": "this.replyBody" },
        "inReplyTo":   { "js": "this.fullMail.messageId" },
        "references":  { "js": "this.fullMail.references" }
      }
    ]
  },
  "workflow": {
    "create": {
      "afterCheckParameters":     ["readMail"],
      "afterMainCreateOperation": ["replyBody", "sendReply"]
    }
  }
}
```

(Abridged: the API is a `create` that records the mail as a row before
it replies, so it also carries its `basics`, `controllers` and the
`dataClauseItems` of that row.)

Three rules make this composition work:

- **Read on demand, not from the envelope.** `ReadMailAction` fetches
  bodies + attachment content (`contentBase64`) by `messageId`; the
  Kafka envelope stays small. Leave `markSeen` at its default `false` —
  on an autoListen account the seen flag is the listener's delivery
  cursor.
- **Reply as the account, not a provider.** `mailAccount` on
  `SendMailAction` sends on behalf of the mailbox identity (`From` is
  always the account's address) and enforces its `sendEnabled`/
  `replyEnabled` gates.
- **Thread with `inReplyTo` + `references`.** Copy both from the
  original mail; the service emits RFC 5322 `In-Reply-To`/`References`
  headers so the reply lands inside the customer's existing
  conversation. For a pull-based variant (cron sweep instead of Kafka
  trigger), start with `CheckMailboxAction` and feed each summary's
  `messageId` into the same read → reply tail.

## Atomic writes win

Prefer one `UpdateCrudAction` whose `whereClause` carries the
precondition and whose `dataClause` value is an atomic operator
(`{ $inc: n }`, `{ $dec: n }`) over fetch-modify-write. See
[Race conditions](../workflow/race-conditions.md).

## Logging follows action names

Name actions for what they decide. A failure is logged under the
action's name — for example `ActionFailedButApiCompleted` when
`onActionError: "completeApi"` lets the API go on — and that failure is
kept as `this.<actionName>Error` for later actions to inspect. A value
you need when diagnosing a request belongs in a named context or
response field, not in a log line printed from an `ArrowFunctionAction`
body.

## Use loops for sets, parallel for independents

- Iterating a list with side effects: `LoopAction`. It runs its inner
  actions for one item at a time, in list order — also when
  `isParallel` is set.
- Independent reads: `ParallelAction` (its actions run concurrently).

Don't reach for `ParallelAction` to "speed things up" if the branches
depend on each other. The first branch's output isn't visible to
siblings; sequential is what you want.

## See also

- [Actions and workflow — overview](../workflow/overview.md)
- [Workflow context](../workflow/workflow-context.md)
- [Race conditions](../workflow/race-conditions.md)
- [Error handling](../workflow/error-handling.md)
