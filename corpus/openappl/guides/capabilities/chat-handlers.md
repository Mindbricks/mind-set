---
title: Chat handlers (deterministic commands on a channel provider)
---

# Chat handlers (deterministic commands on a channel provider)

A **chat handler** answers an inbound WhatsApp or Telegram message with **no AI in
between**. You declare, on the channel provider, an ordered list of handlers. Each
one says which messages it takes (a `/command`, a message type, a pattern over the
text, or the tap on a button), which business API to call (or none), and which text
to reply with. The sender is resolved to a project user through the same chat
identity seam as an [AI chat surface](ai-chat-surfaces.md), the API is called **as
that user**, and the reply goes back over the same channel with the provider's own
credentials.

Use a handler when the answer must be **fixed and predictable**: a `/status` command
that reads one record, a shared location that lists the records near it, an approve
/ reject button on a notification. It costs no model call, does exactly what you
declared, and never improvises. Use an agent surface when the user should be able to
say anything and the model should decide which tools to run. Both can share one
provider: a message a handler claims never reaches the agent, and everything else
reaches it exactly as before.

The schema is the `chatHandling` object of a notification provider, in
`projectSettings.notificationProvidersSettings.notificationProviders[]`. The patterns
are [`ChatHandlingSettings`](../../spec/ChatHandlingSettings.md),
[`ChatHandler`](../../spec/ChatHandler.md),
[`ChatHandlerMatch`](../../spec/ChatHandlerMatch.md),
[`ChatHandlerAction`](../../spec/ChatHandlerAction.md),
[`ChatHandlerParameter`](../../spec/ChatHandlerParameter.md),
[`ChatHandlerResponse`](../../spec/ChatHandlerResponse.md),
[`ChatHandlerResponseList`](../../spec/ChatHandlerResponseList.md),
[`ChatPrompt`](../../spec/ChatPrompt.md) and
[`ChatPromptChoice`](../../spec/ChatPromptChoice.md).

## What a provider with handlers looks like

`chatHandling` is allowed only on a **channel provider**: kind `whatsapp` with
`provider: whatsapp` (Meta Cloud), or kind `telegram`. On any other provider it is
the error `CHAT_HANDLER_PROVIDER_KIND_UNSUPPORTED`. A provider that no agent surface
and no mcpbff exposure binds is called **handler-only** below.

| Field | Meaning |
|---|---|
| `chatHandling.identityStrategy` | `link` (default) or `phone`. `phone` is WhatsApp only. See [Identity](#identity). |
| `chatHandling.helpText` | First lines of the help reply. Optional. |
| `chatHandling.handlers[]` | The handlers **in match order**: the first one that fits claims the message. |
| `chatHandling.prompts[]` | Push prompts: notifications that carry choices. Optional. See [Prompts](#prompts-buttons-on-a-notification). |
| `handlers[].name` | Unique per provider (a code name). It names the handler in the logs. |
| `handlers[].description` | Shown after the command in the help reply. Optional. |
| `handlers[].match` | `kind` is `command`, `messageType`, `pattern` or `promptReply`; the other fields depend on it. See [Match kinds](#match-kinds-and-the-claim-order). |
| `handlers[].action` | The business API to call: `api`, optional `service`, optional `parameters[]` of `name` and `value`. No action means a static reply. |
| `handlers[].response` | `text`, `list` (`source`, `item`, `maxItems`, `emptyText`) and `errorText`. At least `text` or `list`. |
| `handlers[].allowAnonymous` | Default `false`. See [Senders who are not linked](#senders-who-are-not-linked-anonymous). |

### Example 1: a `/status` command that calls an API

The user sends `/status 42`. The handler calls the `getTicket` API of a `waLab`
service with the first word after the command as the ticket id, and replies with two
fields of the answer. If the call fails, the user gets the `errorText`.

```json
{
  "name": "waMeta",
  "kind": "whatsapp",
  "provider": "whatsapp",
  "chatHandling": {
    "identityStrategy": "link",
    "helpText": "Ticket desk. Commands:",
    "handlers": [
      {
        "name": "status",
        "description": "Show a ticket: /status 42",
        "match": { "kind": "command", "command": "status" },
        "action": {
          "api": "getTicket",
          "parameters": [ { "name": "ticketId", "value": "{{args.0}}" } ]
        },
        "response": {
          "text": "Ticket {{result.id}} belongs to {{result.customerPhone}}.",
          "errorText": "Could not read the ticket: {{error.message}}"
        }
      }
    ]
  }
}
```

### Example 2: a location message that lists nearby records

The user shares a location. The handler calls a login-free list API with the
coordinates and replies with up to five rows. `allowAnonymous: true` lets a sender
who has not linked an account use it, which is only allowed because the API is
login-free.

```json
{
  "name": "waMeta",
  "kind": "whatsapp",
  "provider": "whatsapp",
  "chatHandling": {
    "handlers": [
      {
        "name": "nearby",
        "match": { "kind": "messageType", "messageType": "location" },
        "allowAnonymous": true,
        "action": {
          "api": "listTickets",
          "parameters": [
            { "name": "lat", "value": "{{location.latitude}}" },
            { "name": "lon", "value": "{{location.longitude}}" }
          ]
        },
        "response": {
          "text": "Open tickets near you:",
          "list": {
            "source": "data",
            "item": "{{index}}. {{item.customerPhone}}",
            "maxItems": 5,
            "emptyText": "Nothing open near {{location.name}}."
          }
        }
      }
    ]
  }
}
```

### Example 3: approve / reject buttons on a notification

The notification `ticketOpened` (a WhatsApp event notification delivered by this
provider) is sent with two buttons. A tap on **Approve** closes the ticket; a tap on
**Reject** only acknowledges. The prompt records the ticket id when the notification
is sent (`{{event.id}}`), and the reply handlers read it back as
`{{prompt.data.ticket}}`.

```json
{
  "name": "waMeta",
  "kind": "whatsapp",
  "provider": "whatsapp",
  "chatHandling": {
    "handlers": [
      {
        "name": "approve",
        "match": { "kind": "promptReply", "prompt": "ticketDecision", "choice": "approve" },
        "action": {
          "api": "closeTicket",
          "parameters": [ { "name": "ticketId", "value": "{{prompt.data.ticket}}" } ]
        },
        "response": { "text": "Ticket {{prompt.data.ticket}} closed." }
      },
      {
        "name": "reject",
        "match": { "kind": "promptReply", "prompt": "ticketDecision", "choice": "reject" },
        "response": { "text": "Left open. You chose {{prompt.choice}}." }
      }
    ],
    "prompts": [
      {
        "name": "ticketDecision",
        "notification": "ticketOpened",
        "choices": [
          { "id": "approve", "title": "Approve" },
          { "id": "reject", "title": "Reject" }
        ],
        "ttlHours": 48,
        "data": [ { "name": "ticket", "value": "{{event.id}}" } ]
      }
    ]
  }
}
```

## Match kinds and the claim order

| `match.kind` | Fields | Takes |
|---|---|---|
| `command` | `command` | A text that starts with `/command`, compared case-insensitively. The word is 1 to 32 characters of `a-z`, `0-9` and `_`, written without the slash. The rest of the text is `{{args}}`. On Telegram a `/command@botname` suffix is accepted. A text without the slash (`status`) does not match; use a `pattern` for that. |
| `messageType` | `messageType` | A message of one type: `location`, `image`, `document`, `audio` (voice notes included), `video` or `contact`. |
| `pattern` | `pattern` | A text matching a regular expression (see [Patterns](#patterns)). The capture groups are `{{match.1}}` and `{{match.name}}`. |
| `promptReply` | `prompt`, optional `choice` | The tap on a choice of one of the provider's prompts. No `choice` means every choice of that prompt. |

For every inbound message the service decides in this order, and stops at the first
step that takes it:

1. **A prompt reply.** A button or list tap carrying the id of a prompt of this
   provider goes to the prompt reply path (see
   [Prompts](#prompts-buttons-on-a-notification)).
2. **The reserved link commands.** Telegram `/start` and `/start <code>`; WhatsApp
   `link <code>` and `/link <code>`. On a **handler-only** provider the handler
   runtime answers them itself (see [Identity](#identity)). On a provider that an
   agent or mcpbff exposure binds they are **not claimed**: they stay with that
   consumer, and no handler can take them. `start` and `link` are reserved command
   words (`CHAT_HANDLER_COMMAND_RESERVED`).
3. **Your handlers, in the order you declared them.** The first `command`,
   `messageType` or `pattern` handler that fits wins; a `promptReply` handler is
   never tried here. Two handlers on one command is an error
   (`CHAT_HANDLER_COMMAND_DUPLICATE`), because the second would never run.
4. **An unknown command.** A text that starts with `/word` and fits no handler. When
   an agent or mcpbff exposure is bound to the provider, the message is **not
   claimed** and reaches it as before. On a handler-only provider it is answered with
   the help reply.
5. **Anything else is not claimed.** With a conversational consumer bound, it reaches
   that consumer. On a handler-only provider nothing answers it: a WhatsApp message
   goes to the `-unrouted` topic with the WARN `WhatsAppIngressUnrouted`, and a
   Telegram update is acknowledged and ignored. If you want a catch-all reply, end
   the list with a `pattern` handler such as `.` and a static reply.

### The help reply

On a handler-only provider the help reply is sent for an unknown `/command`. It is
`helpText` (when set) followed by one line per `command` handler,
`/command - description` (just `/command` when the handler has no description). With
neither, the reply is "No commands are available.". A bare `/start` sends a greeting
and then the same help text.

### Patterns

A `pattern` is a JavaScript-syntax regular expression, compiled with the flag `i`
(case-insensitive) and tested against the **first 512 characters** of the text. It is
limited because it runs on text anyone can send to your number or bot:

- at most 200 characters;
- JavaScript semantics (`[]` and `[^]` are complete classes, `\]` is a member of a
  class);
- a backreference (`\1`, `\k<name>`), a repeated lookaround, and a **repeated group**
  (`*`, `+`, `{n,}`, `{n,m}` with m above 1) that itself contains a quantifier or an
  alternation `|` at any depth are refused with `CHAT_HANDLER_PATTERN_UNSAFE`. Write
  `^order (\d+)$` rather than `^(\w+\s?)+$`. A group with `?` is fine;
- at runtime every pattern run has a **50 ms budget**. A run that exceeds it is cut
  off and counts as no match. A handler whose pattern times out three times within 60
  seconds has the pattern switched off for 5 minutes (one `ChatHandlerPatternDisabled`
  warn line names the provider and the handler), then the pattern is tried again. A
  switched-off or timed-out pattern never claims a message. The counters are per
  process, per provider and handler.

The static check cannot catch every slow expression (adjacent unbounded quantifiers
are accepted); the runtime budget is the backstop.

## Senders who are not linked (anonymous)

A handler runs only for a sender whose chat is linked to an account. By default a
sender with no linked account is **denied**: no API call is made and they get one
reply, "Please link this chat to your account first: open the link from the app, then
try again."

A handler can opt in with `allowAnonymous: true`. Then it runs for an unlinked sender
too, and the API is called with **no credential at all** (no bearer token, no machine
token). Therefore its API must be login-free (`authOptions.loginRequired: false`);
otherwise it is the error `CHAT_HANDLER_ANONYMOUS_LOGIN_REQUIRED`. A handler with no
action (a static reply) may be anonymous. At runtime an anonymous sender is also
refused on a login-required API, whatever the handler says. In the templates an
anonymous sender has an empty `{{user.id}}`.

## Identity

The handler runtime never trusts a chat id as a user. The sender is resolved **only
through the auth service** (`resolveChatIdentity` of the surface and the sender id),
and the call then runs with a session minted for that user.

- **`link` (default).** The sender must have linked the chat. The app user asks auth
  for a link code and the sender sends it: Telegram `/start <code>` (the deep link
  `https://t.me/<bot_username>?start=<code>` does it), WhatsApp `link <code>` or
  `/link <code>`. On a handler-only provider the runtime answers the link command
  itself through auth's `bindChatIdentity`: "Your account is now linked." or "That link
  code is invalid or has expired. Generate a new one from the app." On a provider with
  an agent or mcpbff consumer the consumer answers it.
- **`phone` (WhatsApp only).** When the sender is not yet linked, the number WhatsApp
  asserts is handed to auth, which binds it only to the **one** active user whose
  verified mobile is that number (the rules of
  [the identity model](ai-chat-surfaces.md#the-identity-model)). Telegram does not
  assert a phone, so `phone` on a Telegram provider is the error
  `CHAT_HANDLER_IDENTITY_STRATEGY_INVALID`.
- **A blocked account.** When auth refuses to open a session for the linked user (the
  account is blocked), the sender gets "Your account is not available for chat right
  now. Please contact support." and nothing runs, even for a handler that allows
  anonymous senders. Any other failure of the session mint (auth unreachable, for
  example) is treated as an unknown sender, so a handler that allows anonymous runs
  without a credential and any other handler answers with the link reply.

**The cost of identity.** Every handled message resolves the sender through auth and
then mints a **new session** for the call: one session entry per message, kept for the
session lifetime. There is no per-sender cache yet, so a busy bot makes two calls to
auth for each message it handles.

## The action call

An action calls **one** business API over its ordinary **REST route**, so it goes
through the same controller, role checks and ownership rules as a direct client. The
API must have a REST controller (`CHAT_HANDLER_API_NO_REST`), and an API that a
JobStream hides without `keepPublicRoute` has no REST route either (also
`CHAT_HANDLER_API_NO_REST`). `action.service` is needed only when two services declare
an API of that name (`CHAT_HANDLER_API_AMBIGUOUS`) and for an API of a system service
such as auth.

- For a **linked** sender the call carries `Bearer` plus the token auth minted for
  that user. The API sees `session.userId` and checks roles and ownership against it.
- For an **anonymous** sender the call carries no credential.

**What the target sees.** A linked sender's call is a service call: the notification
service's verified machine token travels beside the forwarded user session. The target
API therefore sees a machine caller that also carries a user identity. This matters
when the API restricts its caller kind in its `authOptions` (under `basics`):

- `requiredCallerKind: "machineWithoutUserIdentity"` can never be satisfied: a linked
  sender is refused because the call carries a user identity, an anonymous one because
  it carries no machine token. This is the error `CHAT_HANDLER_API_CALLER_KIND`, and
  generation also fails for such a target (an API of a system service included).
- `requiredCallerKind: "machine"` is a **warning** of the same code. A linked sender's
  call passes that gate, because the machine token is there, so a person reaches an API
  declared machine-only through the chat. An anonymous sender is refused.
- `"any"` (the default) needs nothing.

Each `parameters[]` entry fills one API parameter by name, with a
[template](#placeholders). Where the value goes is decided when the project is
generated:

| Parameter | Goes to |
|---|---|
| A segment of the route (`:ticketId` in `/tickets/:ticketId/close`), or a parameter the API reads from `urlpath` | The **path**, URL-encoded. Every segment must be filled (`CHAT_HANDLER_PATH_PARAM_UNMAPPED`). |
| A parameter the API declares with a `query` or `body` location | That location, under the API's own wire name. |
| A name the API does not declare, on a `GET` or `DELETE` | The **query string**. |
| A name the API does not declare, on any other method | The JSON **body**. |

A parameter the API declares but reads from the session, the request, a cookie, a
header or a bearer cannot be filled by a handler (`CHAT_HANDLER_PARAM_UNKNOWN`); the
API fills those itself. A name the API does not declare is also
`CHAT_HANDLER_PARAM_UNKNOWN`, except on a `list` API, whose filters are not checked.
The parameter names `__proto__`, `constructor` and `prototype` are refused
(`CHAT_HANDLER_NAME_RESERVED`).

Values:

- A value that is **exactly one placeholder** keeps the JSON type of its source:
  `{{location.latitude}}` is sent as a number. Anything else (`lat={{...}}`) is a
  string.
- A placeholder with no value renders as an empty string. An empty query or body value
  is **left out** of the call. An empty **path** value stops the call before any
  request: the user gets the `errorText`, with `{{error.code}}` equal to
  `CHAT_HANDLER_PATH_PARAM_EMPTY`. A path value that is `.` or `..` would let the
  sender reach another route, so it stops the call the same way with
  `CHAT_HANDLER_PATH_PARAM_INVALID`; a value that only contains dots (`v1.2`) is sent
  as usual.
- An API that answers with an error gives `{{error.message}}` (the message of the
  API's error body) and `{{error.code}}` (its `errorCode`). Neither carries a URL or a
  credential.

The answer is the API's JSON body as its REST route returns it (see
[Response shape](../business-apis/response-shape.md)): a single-item API gives the
record at the root (`{{result.id}}`), a list API gives `data` and `paging`
(`source: "data"`).

## Placeholders

A template is plain text with `{{path}}` placeholders. It is **not** MScript or a
template language: nothing is evaluated, there are no expressions, and a value
substituted into a template is never scanned again, so a message that itself contains
`{{...}}` stays literal. A path with no value renders as an empty string. The
vocabulary is **closed**: an unknown root, a root the slot does not offer, or a leaf
the root does not have is the error `CHAT_HANDLER_PLACEHOLDER_UNKNOWN`.

| Placeholder | Value | Parameters | `response.text` and `emptyText` | `list.item` | `errorText` | Prompt `data` |
|---|---|---|---|---|---|---|
| `{{text}}` | The whole text, trimmed (empty for a button tap) | yes | yes | yes | yes | no |
| `{{args}}`, `{{args.0}}` | The text after the command, and its words (0-based) | yes | yes | yes | yes | no |
| `{{match.1}}`, `{{match.name}}` | Capture groups of a `pattern` handler (`match.0` is the whole match) | pattern handler | pattern handler | pattern handler | pattern handler | no |
| `{{location.latitude}}`, `.longitude`, `.name`, `.address` | A shared location | yes | yes | yes | yes | no |
| `{{media.id}}`, `.mimeType`, `.caption` | An image, document, audio or video | yes | yes | yes | yes | no |
| `{{contact.name}}`, `.phone` | A shared contact | yes | yes | yes | yes | no |
| `{{sender.id}}`, `.name` | The channel sender. An **input**, never an identity. | yes | yes | yes | yes | no |
| `{{user.id}}` | The resolved user id; empty for an anonymous sender | yes | yes | yes | yes | no |
| `{{channel}}`, `{{provider}}` | `whatsapp` or `telegram`; the provider name | yes | yes | yes | yes | no |
| `{{prompt.choice}}`, `{{prompt.data.key}}` | The tapped choice id; a value recorded with the prompt | promptReply handler | promptReply handler | promptReply handler | promptReply handler | no |
| `{{result}}`, `{{result.path}}` | The API's JSON answer | no | yes | yes | no | no |
| `{{item.path}}`, `{{index}}` | One row of `list.source`; its 1-based position | no | no | yes | no | no |
| `{{error.message}}`, `{{error.code}}` | The failed call | no | no | no | yes | no |
| `{{event.key}}` | A field of the event record of the notification that carries the prompt | no | no | no | no | yes |

`match.N` is checked against the compiled pattern: asking for a group the pattern
does not have is an error. `text`, `channel`, `provider` and `index` take no
sub-path; `location`, `media`, `contact`, `sender`, `user` and `error` take exactly
the leaves listed. `response.list.source` is not a template: it is the dotted path of
the array in the answer (an optional leading `result.` is accepted).

## The reply

The reply is **plain text** (no markup mode on either channel). It is the `text`, then
one line per row of `list`, at most `maxItems` rows (default 10, 1 to 50), or
`emptyText` when the array is empty or absent. A reply is cut at **4096 characters**
with a last line `...`. A reply that renders to nothing is sent as "Done.". When the
call fails, the reply is `errorText`, or "The request could not be completed. Please
try again later." when you set none.

Replies are text only: a handler cannot answer with a location, a media file or
buttons.

The other fixed texts the service sends:

| Situation | Reply |
|---|---|
| A prompt tap after expiry or after a first answer | "This request has expired or was already answered." |
| A tap from a chat other than the one the prompt was sent to | "This request was not sent to you." |
| Two taps racing; the second | "This request was already answered." |
| A tap on a choice no handler answers, or an unknown choice | "This choice is not available." |
| A tap while the prompt store does not answer | "This cannot be processed right now. Please try again later." |

## At most once, no retry

A handler runs **at most once per inbound message**. Before anything runs, the
service claims the message id in a shared store (7 days). A redelivery of the same
message runs nothing, and when the store does not answer nothing runs. A failed action
is answered with the error reply and **never retried**: the API behind it may not be
idempotent. A reply the channel refuses is logged (`ChatHandlerOutbound`, never with
the token, the URL or the text) and not retried.

Every message the handler runtime sees writes one `ChatHandlerInbound` log line:
channel, provider, handler, builtin, `outcome` (`ran`, `denied`, `duplicate`,
`ignored`, `failed`), a `reason`, the message type and a **hash** of the sender. It
never carries the text of the message.

## Prompts: buttons on a notification

A prompt turns an event notification into a message with choices, and a `promptReply`
handler answers the tap. The notification names the text; the prompt names the
choices.

- `prompts[].notification` is the name of a `notificationService.eventNotifications[]`
  entry whose `jobType` is this provider's channel and that **this provider
  delivers**, either through `eventNotificationBasics.providerName` or as the
  channel's default provider (`CHAT_HANDLER_PROMPT_NOTIFICATION_UNBOUND` otherwise).
  Its rendered text is the prompt text.
- `choices[]` are 1 to 10 entries; the `id` is 1 to 24 characters of `a-z`, `0-9` and
  `_` and unique, the `title` is 1 to 20 characters
  (`CHAT_HANDLER_PROMPT_CHOICES_INVALID`). The ids `__proto__`, `constructor` and
  `prototype` are refused (`CHAT_HANDLER_NAME_RESERVED`).
- `ttlHours` is 1 to 168 and defaults to 24 (`CHAT_HANDLER_PROMPT_TTL_INVALID`).
- `data[]` records values when the notification is sent, from the event record
  (`{{event.orderId}}`), and the reply handler reads them as `{{prompt.data.key}}`.
- A `promptReply` handler names a prompt of the same provider and, optionally, one of
  its choices (`CHAT_HANDLER_PROMPT_REPLY_UNKNOWN`). A choice no handler answers is the
  warning `CHAT_HANDLER_PROMPT_UNHANDLED`: the tap would be answered "This choice is
  not available." and call nothing.

### How the choices are shown

| Channel | Free-form text | Approved template |
|---|---|---|
| WhatsApp | 1 to 3 choices become **reply buttons**, 4 to 10 a **list** (one section, button text "Choose"). The body is cut at 1024 characters. | The send gets one quick-reply payload per choice, after the template's own components. The approved template must declare **as many quick-reply buttons as the prompt has choices**. |
| Telegram | An **inline keyboard**, one button per row. The message text is sent as for any Telegram notification. | not applicable |

Meta delivers free-form messages only inside the 24-hour customer-service window, so a
prompt you push outside it should be a template with quick-reply buttons. Only a real
provider can confirm that a template matches its choices.

### The correlation record

When a prompt notification is sent, the service stores a correlation record in a
shared store under a random 16-byte token. Each button carries an opaque callback
payload made of the token and the choice id (at most 52 bytes, inside Telegram's
64-byte limit).

- **Expiring:** it lives for `ttlHours` (capped at 7 days).
- **Single use:** it is consumed atomically **before** the action runs and is never
  restored, so of two taps exactly one wins, and a failed action does not re-arm the
  buttons.
- **Owner-bound:** it belongs to the chat address the prompt was sent to and to the
  sender who taps. A tap from another chat or sender is refused with a reply and **no
  API call**, and the record stays valid for its owner. When the notification resolved
  a user, only that user's identity may answer.
- **Fail closed:** when the store does not answer, the tap is refused.

Each recipient of a fan-out gets their own record and their own ids.

Choices are sent only when **one personal chat** can answer them. A Telegram group
chat (a negative chat id), a recipient list (`a, b`) and a Telegram `@handle` are not
such an address: the message is sent **without buttons** and one
`ChatPromptCorrelationFailed` line is logged (channel, provider, prompt; never the
recipient). The same happens when the store cannot write the record. A prompt nobody
could answer is never sent with buttons.

When the provider is in a mock mode (no credentials, the send goes to a channel sink)
the message lists the choice titles under `Choices:` and writes no record: the buttons
are not answerable there.

## Where messages go (transports)

The **notification service** runs every handler, for both channels. It consumes the
handler topic `<codename>-chat-handler-inbound` (one consumer; no dead-letter topic)
and calls auth and your APIs. The notification service is generated for any project
that declares chat handlers.

### WhatsApp

No new URL. The provider's one door, `/v1/whatsapp-webhooks/meta/<providerName>`,
claims the message before it routes it: a message a handler claims goes to the handler
topic **instead of** the agent's `-message` topic (or `-unrouted`); `routedTo` then
reads `handler:<name>` or `handler:link` / `handler:help` / `handler:promptReply`. An
**exclusive** explicit route in `whatsappIngress.routes[]` still wins over everything.
Statuses and other field changes are not touched.

### Telegram

Telegram has no shared door; where the update arrives depends on who is bound to the
bot:

- **An agent surface is bound to the provider.** The agent's own webhook
  (`/agents/<agent>/telegram/webhook` on its host) verifies the secret as before and
  then asks the handlers whether they claim the update. A claimed update is published
  to the handler topic and the agent does not run (a publish the bus refuses answers
  503 so Telegram redelivers). Everything else, including `/start <code>` and unknown
  commands, stays with the agent.
- **Nothing conversational is bound (handler-only).** The notification service mounts
  a door for the provider:

  ```
  POST <notification SERVICE_URL>/v1/telegram-webhooks/<providerName>
  ```

  with the gateway prefix (for example `/notification-api`), exactly as for the
  WhatsApp door. The provider name is case-sensitive. The door answers:

  | Status | Meaning |
  |---|---|
  | `404` `TELEGRAM_INGRESS_UNKNOWN_PROVIDER` | No such provider, or it is bound by an agent (its updates go to the agent's webhook). |
  | `503` `TELEGRAM_INGRESS_NOT_CONFIGURED` | `telegramWebhookSecret` is unset or a placeholder. |
  | `403` `TELEGRAM_INGRESS_UNVERIFIED` | Wrong `X-Telegram-Bot-Api-Secret-Token` (compared in constant time). |
  | `200` `{"ok":true,"claimed":true}` | A handler claimed it and it is on the bus. |
  | `200` `{"ok":true,"claimed":false}` | Nothing claimed it; nothing was published. An update with no `update_id` is never claimed. |
  | `503` `TELEGRAM_INGRESS_PUBLISH_FAILED` | The bus refused it; Telegram redelivers. |

  Register it with Telegram's `setWebhook` and the same `secret_token` as
  `telegramWebhookSecret`; add `callback_query` to `allowed_updates` when you use
  prompts.

#### Telegram groups

A bot that is a member of a group receives the commands addressed to it there. A
handler that a **linked** member triggers in a group runs **as that member**, and its
reply, built from that user's data, is posted into the **group chat**, where every
member can read it (the reply always goes to the chat the message came from). Prompts
are different: a prompt sent to a group gets no buttons, and a tap is accepted only in
the owner's own chat.

There is no per-handler "private chats only" switch yet. Until there is, the remedy is
the author's and the operator's:

- keep the bot out of groups: in BotFather send `/setjoingroups` and choose
  **Disable**, and leave privacy mode on;
- or give a bot that may sit in a group only handlers whose replies carry no personal
  data (static replies, public lookups).

On WhatsApp a handler's reply always goes to the sender's own number (the service
answers the sender, never a group), so this does not arise there. The rule above
applies to Telegram.

### The handler topic

| Topic | One envelope per | Producers | Consumer |
|---|---|---|---|
| `<codename>-chat-handler-inbound` | message a handler claimed | The notification service (WhatsApp door, Telegram door) and an agent host that claims a Telegram update | The notification service's handler consumer |

## Validation codes

Every refusal names the field to change. All are errors unless marked.

| Code | Meaning | Fix |
|---|---|---|
| `CHAT_HANDLER_PROVIDER_KIND_UNSUPPORTED` | `chatHandling` on a provider that is not a WhatsApp Meta or Telegram channel provider. | Move it to the channel provider, or remove it. |
| `CHAT_HANDLER_NAME_DUPLICATE` | Two handlers of a provider share a name. | Rename one. |
| `CHAT_HANDLER_MATCH_INVALID` | The match is incomplete: unknown `kind`, a bad command word, a missing `messageType`, `pattern` or `prompt`. | Complete the field the message names. |
| `CHAT_HANDLER_COMMAND_RESERVED` | A handler claims `/start` or `/link`. | Choose another command word. |
| `CHAT_HANDLER_COMMAND_DUPLICATE` | Two handlers claim one command; the second would never run. | Use another command, or remove one. |
| `CHAT_HANDLER_PATTERN_INVALID` | The pattern does not compile. | Fix the expression. |
| `CHAT_HANDLER_PATTERN_UNSAFE` | The pattern is longer than 200 characters, has a backreference, a repeated lookaround, or a repeated group that holds a quantifier or an alternation. | Rewrite it without those. |
| `CHAT_HANDLER_API_UNKNOWN` | `action.api` is missing or no service declares it. | Name a business API of a project service (and `action.service` for a system service). |
| `CHAT_HANDLER_API_AMBIGUOUS` | Two services declare the API name. | Set `action.service`. |
| `CHAT_HANDLER_API_NO_REST` | The API has no REST controller, or a JobStream hides its route. | Enable the REST controller, or set `targetApi.keepPublicRoute` on the JobStream. |
| `CHAT_HANDLER_PARAM_UNKNOWN` | The parameter is not one of the API's, or the API reads it from a place a handler cannot fill. | Use a declared body, query or path parameter. |
| `CHAT_HANDLER_PATH_PARAM_UNMAPPED` | A route segment of the API has no parameter. | Add a parameter named like the segment. |
| `CHAT_HANDLER_PLACEHOLDER_UNKNOWN` | A template names a placeholder that does not exist in its slot. | Use the [placeholder table](#placeholders). |
| `CHAT_HANDLER_ANONYMOUS_LOGIN_REQUIRED` | `allowAnonymous` on a handler whose API requires login. | Remove `allowAnonymous`, or call a login-free API. |
| `CHAT_HANDLER_API_CALLER_KIND` (error, or warning for `machine`) | The target API's `authOptions.requiredCallerKind` is `machineWithoutUserIdentity` (error: no chat sender can call it), or `machine` (warning: a linked sender's call passes the gate, so a person reaches a machine-only API; an anonymous one is refused). | Set `requiredCallerKind` of the API to `any`, or point the handler at another API. |
| `CHAT_HANDLER_RESPONSE_EMPTY` | The response has neither `text` nor a complete `list` (`source` and `item`). | Set one. |
| `CHAT_HANDLER_IDENTITY_STRATEGY_INVALID` | `identityStrategy: phone` on a Telegram provider. | Use `link`. |
| `CHAT_HANDLER_PROMPT_NAME_DUPLICATE` | Two prompts of a provider share a name. | Rename one. |
| `CHAT_HANDLER_PROMPT_NOTIFICATION_UNBOUND` | The prompt's notification is unknown, of another channel, or delivered by another provider. | Name a notification of this provider's channel, delivered by this provider. |
| `CHAT_HANDLER_PROMPT_CHOICES_INVALID` | Not 1 to 10 choices, a bad or duplicate id, or a title not 1 to 20 characters. | Fix the choices. |
| `CHAT_HANDLER_PROMPT_TTL_INVALID` | `ttlHours` outside 1 to 168. | Set it in range, or leave it empty. |
| `CHAT_HANDLER_PROMPT_REPLY_UNKNOWN` | A `promptReply` handler names a prompt or choice the provider does not declare. | Name a declared prompt and choice. |
| `CHAT_HANDLER_PROMPT_UNHANDLED` (warning) | A prompt choice no `promptReply` handler answers. | Add a handler for it. |
| `CHAT_HANDLER_NAME_RESERVED` | A parameter name, prompt data name or choice id is `__proto__`, `constructor` or `prototype`. | Rename it. |
| `CHAT_HANDLER_MCPBFF_TELEGRAM_UNSUPPORTED` | A Telegram provider with handlers is also bound by an mcpbff exposure. | Bind the mcpbff exposure to another provider, or move the handlers. |
| `CHAT_HANDLER_LANGUAGE_NOT_SUPPORTED` | The notification service, the auth service, or the host of a claiming agent is generated for a language that does not support chat handlers. | Generate that service in a supported language, or remove `chatHandling`. |
| `CHAT_HANDLER_TELEGRAM_UNCONFIGURED` (warning) | A Telegram provider with handlers has no `telegramWebhookSecret`. Its webhook refuses every update. | Add the secret. |

A `maxItems` outside 1 to 50 and a duplicate name are also reported by the generic
range and `DUPLICATE_ASSET_NAME` checks.

## Not supported yet

- A Telegram provider that an **mcpbff** exposure binds cannot carry handlers
  (`CHAT_HANDLER_MCPBFF_TELEGRAM_UNSUPPORTED`). A WhatsApp provider bound by an mcpbff
  exposure works, because the door claims first.
- Not every compiler target generates handlers: a project that declares them and
  generates its notification service, its auth service, or the host of a claiming
  Telegram agent for an unsupported language is refused
  (`CHAT_HANDLER_LANGUAGE_NOT_SUPPORTED`). See
  [the compiler specification](../../compiler/index.md) for the supported targets.
- Replies are **text only**: no location, media or buttons in a handler's reply.
- No per-handler "private chats only" switch for Telegram groups, and no per-sender
  cache of the identity and the session (each message resolves and mints again).

## Security notes

- **Identity only through auth.** `sender.id` is an input the channel asserted. Who
  the sender *is* comes only from auth's chat identity, and the action runs with a
  session auth minted for that user, so the target API enforces its own roles and
  ownership.
- **The notification service in auth's chat identity gate.** Auth's
  `resolveChatIdentity` and `bindChatIdentity` accept only trusted callers (by default
  the agent hub and the mcpbff). When the project declares chat handlers, the default
  also admits the notification service, because it is the component that verifies the
  channel's signature or secret and runs the handlers; without it every handler would
  deny every sender. A deployment can still replace the trusted-caller list. A project
  without handlers keeps the tight default.
- **Secrets.** A handler holds no secret. Replies use the provider's own credentials,
  and logs never carry a token, a URL, a reply id, the recipient or the message text.
- **Anonymous means no credential**, and only on a login-free API.
- **Patterns run under limits** (length, shape, 50 ms budget) because the text is
  attacker-controlled.
- **Telegram groups.** A handler a linked member triggers in a group runs as that
  member and posts its reply into the group, visible to every member. Keep the bot out
  of groups (BotFather `/setjoingroups`, privacy mode on), or give a bot that may sit
  in a group only handlers whose replies hold no personal data. A per-handler "private
  chats only" switch is not available yet.
- **A reply to a prompt cannot be borrowed**: it is owner-bound, single use and
  expiring.

## See also

- [AI chat surfaces](ai-chat-surfaces.md): the conversational consumers a provider can
  also have, and the identity model.
- [Notification service](../system-services/notification.md): the host of the
  handlers.
