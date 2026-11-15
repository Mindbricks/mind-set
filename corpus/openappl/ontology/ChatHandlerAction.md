# ChatHandlerAction

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ChatHandlerAction in Part 2](../spec/ChatHandlerAction.md)

The one business API call of a chat handler, over the API's REST route. The call carries the resolved user's session (a token minted for the linked user), or no credential at all for an anonymous sender of an `allowAnonymous` handler. A failed call is answered with `response.errorText` and never retried.

## Contained in

- [ChatHandler](./ChatHandler.md) as `action`

## Contains

- `parameters`: [ChatHandlerParameter](./ChatHandlerParameter.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
