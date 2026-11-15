# ListMapAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [ListMapAction in Part 2](../spec/ListMapAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

This action creates a new list out of a current list by mapping its items with MScript. By default the new list is stored under `contextPropertyName` for later actions to read — it does NOT change the api response. On a `list` api set `replacesResult: true` to make the mapped rows BE the response rows: this is the supported way to add a derived field to every row (or to reshape rows) of a list, and it must run in the `afterMainListOperation` stage, before `buildOutput` composes the envelope. To only DROP fields per row, prefer `RemoveFromResponseAction` with `applyToListRows: true` — it is declarative and needs no MScript.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `listMapActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.listMapActions`
- `services.businessLogic.actions.listMapActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
