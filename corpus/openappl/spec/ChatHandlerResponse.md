# ChatHandlerResponse

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatHandlerResponse in Part 1](../ontology/ChatHandlerResponse.md)

The reply of a chat handler, plain text cut at 4096 characters: `text`, then one line per row of `list`, or `list.emptyText` when the list is empty. `errorText` replaces both when the API call fails.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `text` | `Text` | no |  |  |  | The reply text, a template over the message roots plus `result.<path>` (the API's JSON answer). Null = the list alone. |
| `list` | [`ChatHandlerResponseList`](./ChatHandlerResponseList.md) | no |  |  |  | A list rendered from an array in the API answer. Null = no list. |
| `errorText` | `Text` | no |  |  |  | Sent when the API call fails, a template that may read `error.message` and `error.code`. Null = a generic failure reply. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
