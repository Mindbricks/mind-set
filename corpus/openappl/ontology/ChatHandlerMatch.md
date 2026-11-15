# ChatHandlerMatch

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ChatHandlerMatch in Part 2](../spec/ChatHandlerMatch.md)

What a chat handler claims. `kind` selects which one of the other fields is read: `command` (the word after `/`), `messageType`, `pattern` (a regular expression over the text) or `prompt` and `choice` (a reply to a push prompt of the same provider).

## Contained in

- [ChatHandler](./ChatHandler.md) as `match`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
