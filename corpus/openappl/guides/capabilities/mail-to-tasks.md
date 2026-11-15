---
title: "Mail to tasks: incoming mail opens tasks and meetings, answered from the owner's mailbox"
---

# Mail to tasks: incoming mail opens tasks and meetings, answered from the owner's mailbox

The recipe behind a company workspace: every user connects their own work mailbox to a
mailbox **template**, the platform watches those mailboxes, and each incoming mail runs in
that user's tenant and account, where an agent extracts a task or a meeting, the service
records it, and, when wanted, a reply leaves **from the user's own mailbox**. Nothing of the
mailbox leaves the MCP-BFF: the business service sees owner-stamped metadata events and
reads a body on demand.

This page is the worked flow. The template fields are on the
[`MailAccount`](../../spec/MailAccount.md) reference page, the connect side and the
listener on [Connected mailboxes](connected-mailboxes.md), the three actions on their own
pages ([CheckMailboxAction](../../spec/CheckMailboxAction.md),
[ReadMailAction](../../spec/ReadMailAction.md),
[SendMailAction](../../spec/SendMailAction.md)).

## The flow

1. **Connect.** A user opens "Connected mailboxes" in the frontend and connects their Google
   Workspace mailbox to the `workMail` template (one consent screen;
   `GET /my-mailboxes/workMail/connect`). The refresh token is sealed per mailbox in the
   auth service; the MCP-BFF starts listening to that mailbox within one listing interval.
2. **Event.** A mail arrives. The MCP-BFF publishes ONE event on the project-scoped topic of
   the template's listen topic (`<projectCodename>-work-mail`), keyed by the mailbox: the
   unified envelope every project event uses, with the owner as `actor` and metadata-only
   `data` (no body).
3. **Run in the owner's context.** A Kafka-triggered business api on `work-mail` consumes it.
   The event's `actor` becomes the run's session (the owner user, the tenant), so every row
   the api writes is stamped and filtered as that user's, and every mail action it runs is
   admitted as the owner.
4. **Read on demand.** `ReadMailAction` with the event's `mailbox` and `messageId` fetches
   the body (and attachments when needed).
5. **Extract.** `AgentCallAction` hands the subject and body to an agent that answers
   `{ kind: "task" | "meeting" | "none", title, dueAt, startsAt, endsAt, attendees, summary }`.
6. **Record.** The api creates the `task` or `meeting` row (the owner's `userId` and tenant
   come from the session, never from the mail).
7. **Reply (optional).** `SendMailAction` with the same `mailbox` sends a short
   acknowledgement **from the owner's mailbox**, threaded under the original (`inReplyTo`).

## The template

The author declares the mailbox template once; the users bring the mailboxes.

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
    { "name": "clientId", "value": "1234567890-abc.apps.googleusercontent.com" },
    { "name": "clientSecret", "value": "ENTER_CREDENTIAL", "secret": true },
    { "name": "pubsubTopic", "value": "projects/my-gcp-project/topics/work-mail" }
  ]
}
```

- `ownerScope: user` needs the auth service (every user connects their own); a shared
  `info@` inbox per company is the same template with `ownerScope: tenant`, connected by a
  tenant admin.
- `listenTopic: work-mail` is its own name on purpose: a listening template may not share a
  listen topic with a listening project mailbox (`MAIL_ACCOUNT_TEMPLATE_TOPIC_SHARED`),
  because the template publishes on the project-scoped wire name and the project mailbox on
  the bare one.
- `inlineBody` stays off: the body is read on demand in step 4. Switch it on only when every
  consumer of the topic may read the owners' mail.
- `markAsSeen: false` leaves the user's inbox untouched; the MCP-BFF keeps the delivery
  cursor itself.
- The OAuth app's redirect URI is `<auth service URL>/mailbox-connect/callback`;
  `pubsubTopic` turns Gmail push on (polling runs underneath either way).

## The event the api receives

```json
{
  "id": "6c6a...",
  "type": "mail.received",
  "source": "acme-mcpbff-service",
  "time": "2026-11-09T10:00:01.000Z",
  "requestId": null,
  "actor": { "userId": "u-ali", "tenantId": "t-acme" },
  "data": {
    "_type": "connectedMail",
    "template": "workMail",
    "scope": "user",
    "tenantId": "t-acme",
    "ownerUserId": "u-ali",
    "ownerTenantId": null,
    "mailbox": { "template": "workMail", "scope": "user", "ownerId": "u-ali", "tenantId": "t-acme", "credentialKey": "ali@acme.example", "ref": "9f2c0d1e8b7a6543" },
    "messageId": "<CAE1...@mail.gmail.com>",
    "inReplyTo": null,
    "references": [],
    "from": { "name": "Jane Doe", "address": "jane@customer.example" },
    "to": [{ "name": null, "address": "ali@acme.example" }],
    "cc": [],
    "subject": "Can we meet Thursday at 10?",
    "date": "2026-11-09T10:00:00.000Z",
    "attachments": [{ "filename": "agenda.pdf", "mimeType": "application/pdf", "size": 182044 }]
  }
}
```

- The Kafka controller maps `actor` onto the run's session: the api runs as `u-ali` in
  `t-acme`. A tenant template's event has `actor.userId: null` and the owning tenant; its
  api runs in that tenant with no user.
- `data.mailbox` is the **runtime mailbox reference** the mail actions take. It carries ids
  and the mailbox address; never a credential.
- `text` / `html` are absent unless the template sets `inlineBody`.

## The api

A Kafka-triggered `create` api on the `inboxItem` object. Abridged to the mail-relevant
parts (the object, `basics` and the `dataClauseItems` of the recorded row are the usual
ones):

```json
{
  "basics": {
    "apiOptions": {
      "name": "intakeWorkMail",
      "crudType": "create",
      "dataObjectName": "inboxItem"
    }
  },
  "controllers": {
    "kafkaSettings": { "hasKafkaController": true, "requestTopicName": "work-mail" }
  },
  "parameters": {
    "requestParameters": [
      { "name": "mailbox", "type": "Object", "required": true, "httpLocation": "body" },
      { "name": "messageId", "type": "String", "required": true, "httpLocation": "body" },
      { "name": "from", "type": "Object", "required": true, "httpLocation": "body" },
      { "name": "subject", "type": "String", "required": false, "httpLocation": "body" }
    ]
  },
  "workflow": {
    "create": {
      "afterCheckParameters": ["readMail", "extract"],
      "afterMainCreateOperation": ["recordTask", "recordMeeting", "acknowledge"]
    }
  }
}
```

The event's `data` is the Kafka message body, so `mailbox`, `messageId`, `from` and
`subject` bind as request parameters and read as `this.mailbox`, `this.messageId`,
`this.from`, `this.subject`. The controller subscribes to the authored name `work-mail`;
the runtime scopes it onto the produced `<projectCodename>-work-mail`.

### Read the body on demand

```json
{
  "name": "readMail",
  "mailAccount": "workMail",
  "mailbox": { "js": "this.mailbox" },
  "messageId": { "js": "this.messageId" },
  "includeAttachments": { "js": "false" },
  "contextPropertyName": "fullMail"
}
```

The action calls the MCP-BFF with the reference in the body and the run's caller context
signed into the machine token. The MCP-BFF admits the call because the session user **is**
the mailbox's owner (the event actor), looks the mailbox up for that owner only, and opens
it. Another user's mailbox, or a forged reference, is `MAILBOX_NOT_FOUND`, whether it exists
or not.

### Extract a task or a meeting

```json
{
  "name": "extract",
  "agentName": "mailTriage",
  "inputData": { "js": "{ subject: this.subject, from: this.from, text: this.fullMail.text }" },
  "contextPropertyName": "triage"
}
```

The `mailTriage` agent (an `aiAgents[]` entry of the project's agent hub, or of this
service) answers a fixed JSON shape, for example
`{ "kind": "meeting", "title": "Call with Jane", "startsAt": "2026-11-13T10:00:00Z", "endsAt": "2026-11-13T10:30:00Z", "attendees": ["jane@customer.example"], "summary": "..." }`
or `{ "kind": "none" }`. Keep the prompt's output contract small and typed; the api decides
what to record.

### Record

Two `createCrudActions` behind a `condition`: `recordTask` on `task` when
`this.triage.kind === 'task'`, `recordMeeting` on `meeting` when it is `'meeting'`. The
owner and the tenant are the session's (`this.session.userId`, the tenant field the project
names), never taken from the mail. Store `this.messageId` on the row: it is the dedupe key
when a message is redelivered (at-least-once).

### Acknowledge from the owner's mailbox

```json
{
  "name": "acknowledge",
  "mailAccount": "workMail",
  "mailbox": { "js": "this.mailbox" },
  "condition": { "js": "this.triage.kind !== 'none'" },
  "to": { "js": "this.from.address" },
  "subject": { "js": "`Re: ${this.subject}`" },
  "body": { "js": "this.triage.kind === 'meeting' ? `Thanks, I put the meeting \"${this.triage.title}\" in my calendar.` : `Thanks, I created the task \"${this.triage.title}\".`" },
  "inReplyTo": { "js": "this.messageId" }
}
```

`From` is the owner's address (the row the reference names), so the customer sees a reply
from the person they wrote to, threaded under their mail. The template's `sendEnabled` /
`replyEnabled` gates apply.

## Pulling instead of listening

A workflow that must look at a mailbox at a moment of its choosing (a nightly sweep) uses
`CheckMailboxAction` with the SESSION owner's mailbox named by its address:

```json
{
  "name": "sweepMyInbox",
  "mailAccount": "workMail",
  "mailbox": { "js": "this.mailboxAddress" },
  "unseenOnly": { "js": "true" },
  "limit": { "js": "50" },
  "contextPropertyName": "unread"
}
```

Here `this.mailboxAddress` is a request parameter the signed-in user supplies (one of the
addresses `GET /my-mailboxes` listed for them); the MCP-BFF admits only a mailbox that user
connected.

## Who may do what

| Caller | User template | Tenant template |
|---|---|---|
| the signed-in owner (REST api) | read, send from own mailboxes | tenantOwner / tenantAdmin: read, send from the tenant's mailboxes |
| the Kafka-triggered api of the event (session = the event actor) | read, send from the event's mailbox | read, send from the event's mailbox |
| an AgentKafkaController run (system session minted for the event, acting for the owner; its api tool calls carry the author) | read, send from the owner's mailbox | read, send from the tenant's mailbox |
| an agent harness session the event started (no event author) | `MAILBOX_NOT_FOUND` | read, send from the tenant's mailbox |
| another user, a plain tenant member, a platform operator, a machine job that is not an event run | `MAILBOX_NOT_FOUND` | `MAILBOX_NOT_FOUND` |

The same table holds for the frontend routes `POST /mail/workMail/{check,read,send,reply}`
(body `mailbox`) and the agent tools `mail_workMail_*` (argument `mailbox`), both decided
on the verified session.

## Checklist

- The template validates: user scope with authentication, no address, no owner credential in
  `configuration`, its own listen topic.
- The OAuth app lists `<auth service URL>/mailbox-connect/callback` as a redirect URI;
  `MAIL_ACCOUNT_WORKMAIL_CLIENT_SECRET` is set on the auth service and the MCP-BFF.
- A Redis connection reaches the MCP-BFF (leases and cursors); without it run ONE MCP-BFF
  replica.
- The Kafka api binds `mailbox` and `messageId` from the body and reads `this.mailbox` in
  every mail action; a `mailAccount` naming the template without `mailbox` fails validation
  (`MAIL_ACCOUNT_TEMPLATE_STATIC_REFERENCE`).
- Redelivery is at-least-once: dedupe on `messageId` before recording.
