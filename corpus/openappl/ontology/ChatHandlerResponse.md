# ChatHandlerResponse

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ChatHandlerResponse in Part 2](../spec/ChatHandlerResponse.md)

The reply of a chat handler, plain text cut at 4096 characters: `text`, then one line per row of `list`, or `list.emptyText` when the list is empty. `errorText` replaces both when the API call fails.

## Contained in

- [ChatHandler](./ChatHandler.md) as `response`

## Contains

- `list`: [ChatHandlerResponseList](./ChatHandlerResponseList.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
