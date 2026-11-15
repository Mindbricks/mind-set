# ChatHandler

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ChatHandler in Part 2](../spec/ChatHandler.md)

One deterministic chat handler: a match, an optional business API call and a reply template. The `match` selects inbound messages, the `action` calls one business API with parameters filled from the message, and the `response` is rendered from the message and the API answer. No action = a static reply. The handler runs for a linked user with that user's session; `allowAnonymous: true` also runs it for a sender with no linked account, with no credential at all, so its API must be login-free. On Telegram the reply goes to the chat the message came from: a handler triggered in a group posts its reply, built from the sender's data, into that group.

## Contained in

- [ChatHandlingSettings](./ChatHandlingSettings.md) as `handlers` (a list)

## Contains

- `match`: [ChatHandlerMatch](./ChatHandlerMatch.md)
- `action`: [ChatHandlerAction](./ChatHandlerAction.md)
- `response`: [ChatHandlerResponse](./ChatHandlerResponse.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
