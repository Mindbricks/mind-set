# LibModuleBody

**Level:** `subsection` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [LibModuleBody in Part 2](../spec/LibModuleBody.md)

Multi-language body of a `LibModule` — one optional body per language/format key. Code keys (`js`, `ts`, `csharp`, `python`, `rust`, `go`, `php`, `java`) match the MScript compiler set plus js/ts for the nodejs reference; the generated service emits the body matching its target language natively (nodejs prefers `ts` then `js`). Asset/format keys (`html`, `txt`, `svg`, `ejs`, `json`) are language-agnostic — the key is the file extension. All keys are optional `Text`; the key itself names the body's language/extension (there is no separate `moduleExtension`).

## Contained in

- [LibModule](./LibModule.md) as `moduleBody`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
