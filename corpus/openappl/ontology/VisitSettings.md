# VisitSettings

**Level:** `subsection` · **Family:** [BusinessApiBasics](./families.md#businessapibasics) (domain `BusinessApi`)

**Specification:** [VisitSettings in Part 2](../spec/VisitSettings.md)

Api-level visit trigger (docs/ADR-object-visits-pattern.md section 2.2). It declares which call of this BusinessApi records a visit of its data object, with which signal, how the visit is confirmed and which visits are counted. The api's object must declare an enabled `objectSettings.visitTracking` (the storage decision is made once per object). The recording runs after the response, skipped on errors, idempotent replays, completed misses, unlisted controllers and `excludeRoles`. The frontend contract (the `_visit` block and the confirm route) is documented in the generated frontend prompt docs.

## Contained in

- [ApiOptions](./ApiOptions.md) as `visitSettings`

## Contains

- `context`: [VisitContextField](./VisitContextField.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
