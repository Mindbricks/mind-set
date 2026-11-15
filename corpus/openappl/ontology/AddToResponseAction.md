# AddToResponseAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [AddToResponseAction in Part 2](../spec/AddToResponseAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Adds one or more properties from the current context to the final response object after the main operation completes. This is useful when some values are computed or fetched indirectly (e.g., session-based, Redis-loaded, or generated) and need to be exposed in the API response explicitly.

ON A LIST API, `this.data` IS NOT THE ROW ARRAY. `this.data` is the main-operation alias of `this.result`, which on a db-backed list is the db-layer RESULT OBJECT `{ rows, count }`; the response envelope's `data` key is built from it later, by `buildOutput()`. An array idiom written against it (`(this.data ?? []).map(r => r.id)` at `afterBuildOutput`) therefore throws `this.data.map is not a function` and answers 500 on EVERY call, not just on an empty result, because `??` does not fall back on an object. The row array has exactly two documented spellings: the plural binding `this.<objects>` (e.g. `this.users` for a `user` object) and `this.data.rows`. Validation reports the wrong idiom as the warning `LIST_DATA_ALIAS_OBJECT_SHAPE`, naming both spellings and the api. A DataView list is exempt: its main operation answers the row array itself, so `this.data` IS the array there.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `addToResponseActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.addToResponseActions`
- `services.businessLogic.actions.addToResponseActions`

## Contains

- `context`: [ContextData](./ContextData.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
