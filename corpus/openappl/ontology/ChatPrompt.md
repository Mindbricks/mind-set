# ChatPrompt

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ChatPrompt in Part 2](../spec/ChatPrompt.md)

A push prompt of a channel provider: an EventNotification delivered by this provider whose rendered text becomes a message with choices. A tapped choice is answered by the `promptReply` handler that names this prompt, within `ttlHours`, once, and only by the chat that received the prompt (and, when the notification resolved a user, only by that user).

## Contained in

- [ChatHandlingSettings](./ChatHandlingSettings.md) as `prompts` (a list)

## Contains

- `choices`: [ChatPromptChoice](./ChatPromptChoice.md), a list
- `data`: [ChatHandlerParameter](./ChatHandlerParameter.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
