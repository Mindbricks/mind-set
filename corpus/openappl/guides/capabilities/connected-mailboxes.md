---
title: "Connected mailboxes: how a tenant or a user connects a mailbox"
---

# Connected mailboxes: how a tenant or a user connects a mailbox

A [`MailAccount`](../../spec/MailAccount.md) whose **owner scope** is `tenant` or `user`
is a mailbox **template**: it fixes the platform, the authentication kind, the OAuth app
and the server, and every tenant (through a tenant admin, for a shared inbox such as
`info@`) or every user (for their own company mailbox) connects their own mailboxes to
it, up to the template's **max mailboxes per owner** (`maxMailboxesPerOwner`; unset = 5,
bounds 1 to 20). The mailbox's secret, an OAuth refresh token or an IMAP password, is
sealed per mailbox in the auth service's scoped-credential store (family `mail`); the
project's business services never see it.

This page is the connect side: the routes a frontend calls, what each one checks, and
what comes back. The template itself is the `MailAccount` pattern (see its
[reference page](../../spec/MailAccount.md) for every field and validation code).

## Which connect flow a template has

| Template | Connect flow | What the owner supplies |
|---|---|---|
| `gmail` + `xoauth2` | OAuth consent (Google Workspace) | nothing but the consent; the mailbox address comes from Google |
| `microsoftGraph` + `xoauth2` | OAuth consent (Microsoft 365, delegated) | nothing but the consent; the address comes from Microsoft Graph |
| `imapSmtp` + `password` | the IMAP / SMTP form | address, login, password; the hosts and ports when the template fixes no server |
| `imapSmtp` + `xoauth2` | none (paste a token) | a refresh token through `PUT /my-provider-credentials/mail/:template/:address` |

`GET /my-mailboxes` names the flow of every template as `connect: oauth | form | none`, so
a screen never has to derive it.

## Routes (auth service)

The auth service mounts the routes when a mail template enables a scope: the
`/my-mailboxes` routes when a template's owner scope is `user`, the `/tenant-mailboxes`
routes in a multi-tenant project when one is `tenant`, the callback whenever either
exists. Every owner route needs a logged-in session; a machine token is refused
`403 PROVIDER_CREDENTIAL_FORBIDDEN`. Problems are `application/problem+json` with an
`errorCode`.

| Method and path | Who | What |
|---|---|---|
| `GET /my-mailboxes` | the calling user | the user's templates and connected mailboxes |
| `GET /my-mailboxes/:template/connect?returnUrl=` | the calling user | starts the OAuth consent: `302` to the provider |
| `POST /my-mailboxes/:template` | the calling user | the IMAP / SMTP form: `201` the masked row |
| `DELETE /my-mailboxes/:template/:address` | the calling user | disconnects the mailbox |
| `GET /tenant-mailboxes` | tenantOwner / tenantAdmin (own tenant); superAdmin / saasAdmin (`?tenantId=`) | the tenant's templates and mailboxes |
| `GET /tenant-mailboxes/:template/connect?returnUrl=` | same | starts the consent for the tenant's mailbox |
| `POST /tenant-mailboxes/:template` | same | the form for the tenant's mailbox |
| `DELETE /tenant-mailboxes/:template/:address` | same | disconnects |
| `GET /mailbox-connect/callback` | the mail provider's redirect | completes the consent (no session needed: the signed state names the owner) |

A tenant route acts on the caller's own tenant; a platform operator names another tenant
with `?tenantId=<id>`, and every such action is audited as cross-tenant, exactly as on the
credential routes. A tenant owner or admin who names a different tenant gets
`403 PROVIDER_CREDENTIAL_FORBIDDEN`.

### The list

```json
{
  "scope": "user",
  "templates": [
    { "name": "workMail", "platform": "gmail", "authKind": "xoauth2", "connect": "oauth",
      "maxMailboxesPerOwner": 5, "connected": 1, "hostsFromOwner": [] },
    { "name": "legacyImap", "platform": "imapSmtp", "authKind": "password", "connect": "form",
      "maxMailboxesPerOwner": 2, "connected": 0, "hostsFromOwner": ["imapHost", "imapPort", "smtpHost", "smtpPort"] }
  ],
  "mailboxes": [
    { "template": "workMail", "platform": "gmail", "credentialKey": "ali@acme.example", "address": "ali@acme.example",
      "username": null, "status": "valid", "lastError": null, "connectedAt": "2026-11-09T10:00:00.000Z",
      "lastVerifiedAt": "2026-11-09T10:00:00.000Z", "updatedAt": "2026-11-09T10:00:00.000Z", "hosts": {} }
  ]
}
```

- `credentialKey` is the lowercase mailbox address: one row per address per owner. It is
  the segment a `DELETE` names.
- `status` is `valid` after a connection; `invalid` with `lastError` (for example
  `invalid_grant`) once the provider revokes the token. The screen offers **reconnect**
  then: starting the same connect flow again replaces the invalid row.
- `hostsFromOwner` lists the form fields the owner must fill for an `imapSmtp` template; a
  template that fixes its server lists none.
- Nothing in the list is a secret: no token, no password, no fragment of either.

### The OAuth consent

1. The frontend sends the browser to
   `GET /my-mailboxes/:template/connect?returnUrl=/settings/mailboxes` (or the tenant
   twin). The route checks the scope, the owner's bound (`409
   PROVIDER_CREDENTIAL_LIMIT_REACHED` when full, unless an invalid row waits for a
   reconnect), the rate limit (5 connection attempts a minute per owner, shared by the
   consent start and the IMAP / SMTP form, refused attempts included, `429
   PROVIDER_CREDENTIAL_RATE_LIMITED`) and the return URL, then answers `302` to the
   provider with a signed `state` and sets a browser-bound cookie.
2. The owner grants access. Google is asked for offline access (`access_type=offline`,
   `prompt=consent`) and the `https://www.googleapis.com/auth/gmail.modify` scope;
   Microsoft for `offline_access User.Read Mail.ReadWrite Mail.Send` (delegated). A
   template's `scope` key overrides the mail scope; a Microsoft scope list keeps
   `offline_access` either way.
3. The provider redirects to `GET /mailbox-connect/callback?code=&state=`. The auth service
   verifies the state (its own signature and audience, a one-shot nonce, the cookie it set
   at start, and a session, when the browser carries one, that is the same user),
   exchanges the code with the template's OAuth client, reads the mailbox address from the
   provider (`users/me/profile` on Gmail, `/me` on Graph), stores the refresh token
   `valid`, and sends the browser to the return URL with
   `?template=<name>&mailbox=<address>`, or with `?template=<name>&error=<code>` when
   something failed.

The **return URL** must be the frontend's origin (as configured on the auth service) or a
path under it; another origin, a scheme-relative `//host`, a `javascript:` URL or a URL
with credentials is refused `400 MAILBOX_CONNECT_RETURN_URL_REFUSED` before the provider
is contacted. An operator can allow more origins on the auth service. Without a return
URL and without a configured frontend origin, the callback answers JSON.

The **redirect URI** registered with the OAuth app is
`<auth service URL>/mailbox-connect/callback` (the service's own base URL, its gateway
base path kept), one per deployment slot; an operator can override it on the auth
service. The template's client secret must be available to the auth service as
`MAIL_ACCOUNT_<NAME>_CLIENT_SECRET` (the same secret the MCP-BFF reads); without it the
start route answers `503 MAILBOX_CONNECT_NOT_CONFIGURED`.

Codes a callback can send back in `error`: `MAILBOX_CONNECT_DENIED` (the owner declined, or
the provider refused the app), `MAILBOX_CONNECT_EXCHANGE_FAILED`,
`MAILBOX_CONNECT_NO_REFRESH_TOKEN` (offline access was not granted: connect again),
`MAILBOX_CONNECT_PROFILE_FAILED`, `MAILBOX_ALREADY_CONNECTED` (the address is already
connected and is not invalid; add `&replace=true` to the start route to replace it),
`PROVIDER_CREDENTIAL_LIMIT_REACHED`, `MAILBOX_CONNECT_NOT_CONFIGURED`. A tampered, expired
or replayed state is `400 MAILBOX_CONNECT_STATE_INVALID` as a problem (there is no trusted
place to redirect to).

### The IMAP / SMTP form

```http
POST /my-mailboxes/legacyImap
Content-Type: application/json

{ "address": "ali@acme.example", "username": "ali", "password": "...",
  "imapHost": "imap.acme.example", "imapPort": 993,
  "smtpHost": "smtp.acme.example", "smtpPort": 587 }
```

- `address` and `password` are required; `username` defaults to the address.
- When the template fixes a server (`imapHost` / `smtpHost` in its configuration), the form
  may not send host keys (`422 PROVIDER_CREDENTIAL_UNSUPPORTED_KEY` naming the key). When
  it fixes none, `imapHost` is required and `smtpHost` optional (without it the mailbox is
  listened to but not sent from). Any other key is refused by name.
- Every host the owner names goes through the public-host guard: it must be a DNS name (no
  IP literal in any spelling: `127.0.0.1`, `127.1`, `0x7f.0.0.1`, `0177.0.0.1`,
  `2130706433` and the like never reach the resolver), not a local or metadata name, and
  every address it resolves to must be public (private, loopback, link-local,
  carrier-grade NAT, unique-local and multicast ranges are refused, in IPv4 and in every
  IPv6 spelling). A refusal is `422 MAILBOX_CONNECT_HOST_REFUSED` with the field and a
  short reason.
- Ports are fixed: IMAP **993** (implicit TLS; the default when absent). Port 143 is not
  accepted by the form: the login that proves the password would travel in the clear
  before any STARTTLS. SMTP **465** (implicit TLS, the default) or **587** (submission with
  STARTTLS); 25 is not a submission port. `imapSecure` / `smtpSecure`, when sent, must
  agree with the port.
- The password is proved with an IMAP `LOGIN` before anything is stored, dialled at the
  address the guard resolved (so a DNS record cannot flip between the check and the
  connect). A refused login is `422 PROVIDER_CREDENTIAL_INVALID` (field `password`); an
  unreachable server is `503 PROVIDER_CREDENTIAL_VERIFY_UNAVAILABLE`, and nothing is stored
  in either case.
- A second connection of the same address is `409 MAILBOX_ALREADY_CONNECTED` unless the row
  is `invalid` or the body carries `"replace": true`; the template's bound is
  `409 PROVIDER_CREDENTIAL_LIMIT_REACHED` (judged with the address the form names, before
  the login probe, so a refused mailbox never sends the password anywhere); five
  connection attempts a minute per owner, shared with the consent start and counting
  refused attempts, then `429`.
- The answer is the masked row (`201`): the address, the login and the validated hosts as
  `extraFields`, never the password.

### Disconnect

`DELETE /my-mailboxes/:template/:address` removes the row (`404
PROVIDER_CREDENTIAL_NOT_FOUND` when there is none) and publishes `providerCredentialChanged`
with `family: mail` and the mailbox key. The listener stops that mailbox at its next
listing sync (default 30 s; the MCP-BFF polls the store, it does not consume the event): it
ends the push registration, forgets the mailbox's cursor and gives its lease back. A
mailbox no replica runs at that moment has its cursor forgotten too. A mailbox marked
`invalid` is not disconnected: it keeps its cursor, and **Reconnect** resumes from it (the
mail that arrived meanwhile is delivered). The deletion is audited with the actor.

## Listening to connected mailboxes

The MCP-BFF listens to every connected mailbox of a template with `autoListen: true`.
Project accounts keep their own listener, unchanged.

- **The mailbox set.** Every listing interval (default 30 s) the MCP-BFF walks the
  store's machine listing (family `mail`, page by page until the cursor ends; a page may
  hold no row and still carry a cursor). A new mailbox starts; a disconnected one stops at
  the next listing sync; a reconnected one (a new secret, other extra fields) restarts; a
  mailbox marked `invalid` is not listened to. When the listing fails, every running
  mailbox keeps running.
- **One replica per mailbox.** A mailbox runs on the one MCP-BFF replica that holds its
  lease: a shared-store key with a TTL (default 60 s), renewed at a third of it, with a
  fencing token, so a replica that paused past its TTL cannot move the cursor another
  replica now owns. The lease's local validity is counted from the moment the acquire or
  renew request was sent, and every message checks it, so a replica whose reply came late
  never delivers past the store's TTL. A replica that cannot renew stops the mailbox
  without touching its push registration (the new holder's watch or subscription stays);
  another picks it up at its next sync. A replica runs a bounded number of mailboxes
  (default 200) and leaves the rest to the others. The leases and cursors live in the
  project's Redis. Without a Redis connection the MCP-BFF keeps the state in memory, logs a
  warning, and must then run as ONE replica (a restart re-seeds the cursors).
- **Push first, polling underneath.** A Gmail template that names `pubsubTopic` registers a
  `users.watch` per mailbox (renewed daily, stopped when the mailbox stops); a Microsoft 365
  template that names `notificationUrl` creates a change subscription per mailbox
  (delegated: the owner's refresh token, `/me`; renewed daily, deleted when the mailbox
  stops). An IMAP mailbox holds an IDLE connection within the replica's connection budget
  (default 50; a fifth stays free for polling) and is polled beyond it. Polling always runs:
  a push only wakes the sweep. A push that reaches a replica not holding the mailbox is
  acknowledged and ignored; the holder's poll delivers the mail.
- **Cursors survive a restart.** With `markAsSeen: false` the cursor (the IMAP UID with its
  UIDVALIDITY, the Gmail history id, the Graph delta link) is written after every delivered
  message, together with the provider ids delivered since, so a restart neither re-delivers
  nor skips. With `markAsSeen: true` the read flag is the cursor, as for a project account.
- **Owner-named servers.** An IMAP mailbox whose server the owner named passes the
  public-host guard again before every connect (the same rule as the form) and the MCP-BFF
  dials the address it validated; a refused host stops the mailbox and retries it after a
  park interval (default 10 min). The same holds for every on-demand operation on such a
  mailbox: the IMAP server before a check or read, the SMTP server before a send or reply
  (`422 MAILBOX_HOST_REFUSED` when a record no longer resolves to a public address; the
  owner reconnects).
- **Tokens.** When a provider answers a new refresh token (Microsoft rotates it on every
  refresh), the MCP-BFF seals it itself and writes it back to the owner's row; the
  plaintext never leaves the process, and the write-back does not restart the listener.
  Every write-back (and invalidation) carries the ciphertext the MCP-BFF read as a
  precondition: when the owner reconnected in between, the auth service answers
  `409 PROVIDER_CREDENTIAL_CONFLICT`, nothing is overwritten, and the next sync restarts
  the mailbox with the owner's new credential. A provider that answers `invalid_grant`
  marks the row `status: invalid`, `lastError: invalid_grant` (the owner's list shows it,
  and **Reconnect** starts the same flow again), and the listener stops until then.
- **Backoff.** Each mailbox backs off on its own, exponentially up to a ceiling (default
  5 min); a provider's throttling of one mailbox never slows the others.
- **Events.** Every message of a connected mailbox is published as ONE event in the unified
  envelope every project event uses (`id`, `type: mail.received`, `source`, `time`,
  `requestId`, `actor`, `data`): the `actor` is the owner (`{ userId, tenantId }` for a user
  template, `{ userId: null, tenantId }` for a tenant template), so a Kafka controller, an
  AgentKafkaController or an agent harness trigger consuming it runs in the owner's tenant
  and user; `data` carries `tenantId`, `ownerUserId` / `ownerTenantId`, the `mailbox`
  reference the mail actions take (`{ template, scope, ownerId, tenantId, credentialKey,
  ref }`; the key is the lowercase address, never a credential), `messageId`, `inReplyTo`,
  `references`, `from`, `to`, `cc`, `subject`, `date` and the attachment metadata. The body
  (`text`, `html`) rides only when the template sets **inline body** (`inlineBody`);
  otherwise it is read on demand with [`ReadMailAction`](../../spec/ReadMailAction.md). The
  topic is the project-scoped wire name of the template's `listenTopic`
  (`<projectCodename>-<listenTopic>`), keyed by the mailbox; a Kafka controller subscribing
  to the bare `listenTopic` is scoped onto it, which is why a listening template may not
  share its listen topic with a listening project mailbox
  (`MAIL_ACCOUNT_TEMPLATE_TOPIC_SHARED`). A project mailbox keeps publishing its bare
  envelope on its bare topic exactly as before. The worked consumer is
  [Mail to tasks](mail-to-tasks.md).
- **Health.** The MCP-BFF's operator-gated health-detail endpoint carries a
  `connectedMailboxes` block when a template listens: the lease store kind, counts (listed,
  listening, held by another replica, over capacity, parked by reason) and one line per
  running mailbox with a hash reference, never the address or a credential.

## Using a connected mailbox from the backend

A connected mailbox is used, never named statically: a template has no mailbox of its own,
so every door takes a **runtime mailbox reference** and decides whether the **caller** may
use that mailbox before it is opened.

**The reference.** Either the `mailbox` object a connected-mailbox event carries (the usual
case inside a Kafka-triggered api: `this.mailbox` from a body parameter), or a string, the
address of a mailbox the signed-in owner connected (the key `GET /my-mailboxes` lists).

**The admission** (one rule on every door):

| Template | Admitted | Refused (`404 MAILBOX_NOT_FOUND`, whether the mailbox exists or not) |
|---|---|---|
| `user` | the owner (the session user, or the actor of the triggering event); an event context acting for the owner (an AgentKafkaController run in the owner's tenant with the owner as the event author) | another user, a tenant admin, a platform operator, a caller with no identity, a machine job that is not an event run, a reference naming another template or scope |
| `tenant` | a `tenantOwner` / `tenantAdmin` of the owning tenant; an event context of that tenant (the Kafka api of a tenant mailbox event, the AgentKafkaController run or the agent harness session that event started) | a plain tenant member, another tenant's admin, a platform operator naming the tenant, a caller with no identity, a machine job that is not an event run |

An **event context** is exactly a run the project's Kafka transport started: a
Kafka-triggered api, or a system session minted for the event (the AgentKafkaController's
run, the agent harness trigger's session, including their tool calls to other services).
Any other machine session (a cron, a service-to-service job, an operator's machine call) is
not one, whatever tenant it runs in. A harness-triggered session carries no event author,
so it reaches the event tenant's mailboxes but never a user's.

A mailbox whose token was revoked answers `409 MAILBOX_INVALID` to its owner (reconnect);
an owner-named server that no longer resolves to a public address answers
`422 MAILBOX_HOST_REFUSED`. A send or reply always leaves **from the owner's own address**
(the row the reference names).

**The doors.**

- **Mail actions.** [`CheckMailboxAction`](../../spec/CheckMailboxAction.md),
  [`ReadMailAction`](../../spec/ReadMailAction.md) and
  [`SendMailAction`](../../spec/SendMailAction.md) name the template as `mailAccount` and
  the mailbox as `mailbox` (an MScript). The action calls the MCP-BFF with the reference in
  the body and the run's caller context (user, tenant, roles, whether the run is an event
  context, the event author it acts for) signed into the machine token; the MCP-BFF reads it
  only from the verified token. A template named without `mailbox` is
  `MAIL_ACCOUNT_TEMPLATE_STATIC_REFERENCE`; `mailbox` on a project mailbox is
  `MAIL_ACCOUNT_MAILBOX_ON_PROJECT`; a service whose target language cannot name a template
  yet is refused with `MAIL_ACCOUNT_TEMPLATE_LANGUAGE_UNSUPPORTED` (see
  [the compiler specification](../../compiler/index.md)).
- **Frontend mail routes.** `POST /mail/<template>/{check,read,send,reply}` on the MCP-BFF
  with `mailbox` (the address) in the body, decided on the verified session: a user reaches
  their own mailboxes, a tenant admin the tenant's. These routes need no frontend allow-list
  opt-in (that allow-list exists for project mailboxes, which have no owner); `send` /
  `reply` exist only when the template's send / reply switches are on.
- **Agent mail tools.** `mail_<template>_{check,read,send,reply}` on the MCP-BFF chat
  surface take a required `mailbox` argument (the address) and are decided on the verified
  caller the same way; `send` and `reply` ask for approval like a project mailbox's.

The worked flow, incoming mail to tasks and meetings with a reply from the owner's mailbox,
is [Mail to tasks](mail-to-tasks.md).

## For the frontend

- A user profile page "Connected mailboxes" shows the user's templates and mailboxes from
  `GET /my-mailboxes`; one **Connect** per template (a consent link for `oauth`, a form for
  `form`), a **Disconnect** per mailbox, a **Reconnect** on an `invalid` one.
- A tenant admin page "Shared mailboxes" is the same over `/tenant-mailboxes`.
- A mailbox screen (inbox, read, reply) for a connected mailbox calls the MCP-BFF
  `POST /mail/<template>/{check,read,send,reply}` routes with the mailbox address in the
  body and the user's session credential; a `404 MAILBOX_NOT_FOUND` means the signed-in user
  does not own that mailbox.
- Never show, store or log a credential; the password field is write-only and is not
  echoed.
- After the consent the browser lands on the return URL with `template` and either
  `mailbox` or `error`; refresh the list then.

## See also

- [`MailAccount`](../../spec/MailAccount.md): the template fields.
- [Mail to tasks](mail-to-tasks.md): the worked consumer: incoming mail to tasks and
  meetings, answered from the owner's mailbox.
- [MCP-BFF system service](../system-services/mcpbff.md): the service that listens to the
  mailboxes and serves the mail routes.
