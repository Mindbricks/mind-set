# ChatHandler

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatHandler in Part 1](../ontology/ChatHandler.md)

**Name:** an instance is named by `name`.

One deterministic chat handler: a match, an optional business API call and a reply template. The `match` selects inbound messages, the `action` calls one business API with parameters filled from the message, and the `response` is rendered from the message and the API answer. No action = a static reply. The handler runs for a linked user with that user's session; `allowAnonymous: true` also runs it for a sender with no linked account, with no credential at all, so its API must be login-free. On Telegram the reply goes to the chat the message came from: a handler triggered in a group posts its reply, built from the sender's data, into that group.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique handler name within the provider; it names the handler in the logs. Must be a valid codeName. |
| `description` | `String` | no |  |  |  | Shown after the command in the help reply (`/command - description`). Null = the command alone. |
| `match` | [`ChatHandlerMatch`](./ChatHandlerMatch.md) | yes |  |  |  | Which inbound messages this handler claims: a `/command`, a message type (a location, an image, ...), a pattern over the text, or the reply to a push prompt. |
| `action` | [`ChatHandlerAction`](./ChatHandlerAction.md) | no |  |  |  | The business API the handler calls. Null = a static reply (the response text alone, no call). |
| `response` | [`ChatHandlerResponse`](./ChatHandlerResponse.md) | yes |  |  |  | The reply sent to the sender: a text, a list rendered from the API answer, and the text sent when the call fails. At least one of `text` and `list` (CHAT_HANDLER_RESPONSE_EMPTY). |
| `allowAnonymous` | `Boolean` | no | `false` |  |  | When true the handler also runs for a sender with no linked account; the API is then called with NO credential (no bearer, no machine token), so `action.api` must declare `authOptions.loginRequired: false` (CHAT_HANDLER_ANONYMOUS_LOGIN_REQUIRED otherwise). Default false: an unlinked sender gets one reply asking to link the account, and no call is made. A blocked account is refused even here. |

## Constraints

Property rules:

- `name`, `match`, `response` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
