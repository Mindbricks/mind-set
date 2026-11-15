# ChatHandlerMatch

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatHandlerMatch in Part 1](../ontology/ChatHandlerMatch.md)

What a chat handler claims. `kind` selects which one of the other fields is read: `command` (the word after `/`), `messageType`, `pattern` (a regular expression over the text) or `prompt` and `choice` (a reply to a push prompt of the same provider).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `kind` | `ChatHandlerMatchKind` | yes |  | `command`, `messageType`, `pattern`, `promptReply` |  | The matcher: 'command' (a text starting with `/<command>`), 'messageType' (a location, image, document, audio, video or contact message), 'pattern' (a regular expression over the text) or 'promptReply' (a tapped choice of a push prompt). |
| `command` | `String` | no |  |  |  | kind 'command': the command word without the slash, 1-32 characters of `a-z`, `0-9` and `_`, matched case-insensitively (`/Status` matches `status`). The text after it is the `args` of the templates. `start` and `link` are reserved for account linking (CHAT_HANDLER_COMMAND_RESERVED). |
| `messageType` | `ChatHandlerMessageType` | no |  | `location`, `image`, `document`, `audio`, `video`, `contact` |  | kind 'messageType': the message type this handler claims. |
| `pattern` | `String` | no |  |  |  | kind 'pattern': a regular expression tested case-insensitively against the first 512 characters of the text; its capture groups are `match.<n>` and `match.<name>` in the templates. At most 200 characters; a backreference, a repeated group that contains a quantifier or an alternation, and a repeated lookaround are refused (CHAT_HANDLER_PATTERN_UNSAFE), because the text is attacker-controlled. At runtime a pattern runs under a 50 ms budget: a run past it does not match, and a handler whose pattern times out 3 times within 60 seconds has the pattern switched off for 5 minutes (one `ChatHandlerPatternDisabled` warn line), then tried again. |
| `prompt` | `String` | no |  |  |  | kind 'promptReply': the name of a prompt of this provider (`chatHandling.prompts[].name`). |
| `choice` | `String` | no |  |  |  | kind 'promptReply': the choice id this handler answers. Null = every choice of the prompt. |

## Constraints

Property rules:

- `kind` must be present. (`REQUIRED_FIELD_MISSING`)
- `kind`, `messageType` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
