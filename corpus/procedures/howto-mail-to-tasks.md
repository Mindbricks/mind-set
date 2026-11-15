# How-to: incoming mail opens tasks and meetings, answered from the owner's mailbox

Harness-agnostic. The mail how-to, written in the shape of
`howto-payment-flow.md` and `howto-subscription.md`: the catalog says WHICH
pattern (`MailAccount` with `ownerScope`, `CheckMailboxAction`,
`ReadMailAction`, `SendMailAction`, a Kafka-triggered `BusinessApi`,
`AgentCallAction`); `blueprint-authoring.md` says how to write any service;
this document says how a mail-driven flow is ASSEMBLED so the first build
validates and the first incoming mail runs in the right tenant and user.
Every claim below was checked against the pattern ontology (`MailAccount`,
`CheckMailboxAction`, `ReadMailAction`, `SendMailAction`) and the emitted
code. The pattern pages (`openappl/spec/<Pattern>.md`) outrank this document.

**Task shape.** The spec describes a workspace where each user (or each
company) connects their own mailbox and incoming mail drives business logic:
"mails to the team open tasks", "a meeting request becomes a calendar entry",
"answer the sender from my mailbox". The mailbox is the CUSTOMER'S, not the
project's: that is a mailbox TEMPLATE (`ownerScope: user` or `tenant`),
never a project `MailAccount` with an `address` (`guides/capabilities/connected-mailboxes.md`).
Read the full page `guides/capabilities/mail-to-tasks.md` when you need the
event JSON or the admission table verbatim.

## 1. Declare the template (Phase 1, project settings)

One `mailAccounts[]` entry per kind of mailbox the customers bring:

```json
{
  "name": "workMail",
  "ownerScope": "user",
  "platform": "gmail",
  "authKind": "xoauth2",
  "autoListen": true,
  "listenTopic": "work-mail",
  "markAsSeen": false,
  "sendEnabled": true,
  "replyEnabled": true,
  "maxMailboxesPerOwner": 2,
  "configuration": [
    { "name": "clientId", "value": "<google oauth client id>" },
    { "name": "clientSecret", "value": "ENTER_CREDENTIAL", "secret": true },
    { "name": "pubsubTopic", "value": "projects/<gcp-project>/topics/work-mail" }
  ]
}
```

Rules the validator enforces: NO `address` on a template; NO `username`,
`refreshToken` or `password` in `configuration` (the owner's connection
supplies them); `user` needs authentication, `tenant` needs a multi-tenant
project; a listening template's `listenTopic` must differ from every
listening project account's (`MAIL_ACCOUNT_TEMPLATE_TOPIC_SHARED`): name it
(`work-mail`), never leave the default `new-email-arrived` when a project
mailbox also listens. Leave `inlineBody` unset (metadata-only events; the
body is read on demand). A `microsoftGraph` template needs `tenantId`
(`organizations` for any work directory); an `imapSmtp` + `password`
template needs nothing (the owner names the server at connect time). Tell
the user: a `gmail` / `microsoftGraph` template is an OAuth APP whose
redirect URI is `<auth service URL>/mailbox-connect/callback`.

## 2. The event (what your api receives)

The mcpbff listens to every connected mailbox of a listening template and
publishes each message ONCE as the unified event envelope on the
project-scoped topic `<codename>-work-mail`, keyed by mailbox:

- `actor`: `{ userId: <owner user>, tenantId }` for a user template,
  `{ userId: null, tenantId: <owner tenant> }` for a tenant template. The
  Kafka controller maps it onto the run's session: the api RUNS AS THE
  OWNER, in the owner's tenant.
- `data`: `_type: "connectedMail"`, `template`, `scope`, `tenantId`,
  `ownerUserId`, `ownerTenantId`, `mailbox` (the runtime reference:
  `{ template, scope, ownerId, tenantId, credentialKey, ref }`; the key is
  the address, never a credential), `messageId`, `inReplyTo`, `references`,
  `from`, `to`, `cc`, `subject`, `date`, `attachments` (metadata only).
  `text` / `html` only when the template sets `inlineBody`.

Your Kafka controller subscribes to the AUTHORED name (`work-mail`); the
runtime scopes it onto the produced wire name. Redelivery is at-least-once:
dedupe on `messageId` before you record anything.

## 3. The api (Phase 2, the consuming service)

A nodejs, dotnet or java service (the runtime mailbox reference is implemented
there; a service in another language cannot name a template yet,
`MAIL_ACCOUNT_TEMPLATE_LANGUAGE_UNSUPPORTED`). One `create` api on an
`inboxItem` object with a Kafka controller on `work-mail`, body parameters
bound from the event's `data`, and this action chain:

| Step | Action | What matters |
|---|---|---|
| bind | `requestParameters`: `mailbox` (Object), `messageId` (String), `from` (Object), `subject` (String), all `httpLocation: body` | the event's `data` IS the Kafka body |
| read | `ReadMailAction` `mailAccount: workMail`, `mailbox: { js: "this.mailbox" }`, `messageId: { js: "this.messageId" }` | `mailbox` is REQUIRED on a template (`MAIL_ACCOUNT_TEMPLATE_STATIC_REFERENCE` without it); the body comes back, `includeAttachments: false` unless you need bytes |
| extract | `AgentCallAction` `agentName: mailTriage`, `inputData: { js: "{ subject: this.subject, from: this.from, text: this.fullMail.text }" }` | the agent answers a SMALL typed shape: `{ kind: "task" \| "meeting" \| "none", title, dueAt, startsAt, endsAt, attendees, summary }` |
| record | `createCrudActions` on `task` / `meeting` behind `condition: this.triage.kind === '...'` | owner and tenant come from `this.session`, never from the mail; store `this.messageId` for the dedupe |
| reply | `SendMailAction` `mailAccount: workMail`, `mailbox: { js: "this.mailbox" }`, `to: this.from.address`, `inReplyTo: this.messageId`, `condition: this.triage.kind !== 'none'` | leaves FROM the owner's address; `sendEnabled` / `replyEnabled` of the template apply |

Workflow slots: `afterCheckParameters: ["readMail", "extract"]`,
`afterMainCreateOperation: ["recordTask", "recordMeeting", "acknowledge"]`.

A PULL variant (a nightly sweep from a REST api the owner calls):
`CheckMailboxAction` with `mailbox: { js: "this.mailboxAddress" }`, where
the request parameter is one of the addresses `GET /my-mailboxes` listed for
the signed-in user.

## 4. Who is admitted (do not fight it, design with it)

The mcpbff decides every mail action, frontend mail route
(`POST /mail/<template>/{check,read,send,reply}`, body `mailbox`) and agent
mail tool (`mail_<template>_*`, argument `mailbox`) with ONE rule, on the
caller the token or session proves:

- user template: the OWNER (the session user; a Kafka api whose actor is the
  owner), or an EVENT context acting for the owner (an AgentKafkaController
  run in the owner's tenant with the owner as the event author; its api tool
  calls carry the author);
- tenant template: a `tenantOwner` / `tenantAdmin` of the owning tenant, or
  an EVENT context of that tenant (the Kafka api of the event, the
  AgentKafkaController run, the agent harness session the event started);
- everyone else, platform operators and machine jobs that are not event runs
  included: `404 MAILBOX_NOT_FOUND`, whether the mailbox exists or not.

An event context is a run the project's Kafka transport started, nothing
else: a cron or a service-to-service job in the right tenant is NOT one. An
agent harness session carries no event author, so a harness-triggered flow
reaches the event tenant's mailboxes only; a user's own mailbox needs the
Kafka api or an AgentKafkaController run.

Consequences for the design: a REST api that reads a user's mailbox must
run under THAT user's session (never a cron, never an admin acting for
them); a shared `info@` is a tenant template and its screens are the tenant
admin's; a background job that must act on a user's mail is the Kafka api
of the event, not a scheduler. A revoked token answers
`409 MAILBOX_INVALID` to the owner: show "Reconnect".

## 5. Validate the blueprint

1. `mind-set validate blueprint.json` is clean, then the semantic validation
   of an OpenAPPL validation tool or compiler, when one is available, is
   green (the template has no address and its own listen topic; every mail
   action on it carries `mailbox`).
