# Package

**Level:** `subsection` · **Family:** [ServiceSettings](./families.md#servicesettings) (domain `Service`)

**Specification:** [Package in Part 2](../spec/Package.md)

A unified, language-agnostic third-party package dependency declaration. A single `Package` shape covers every supported language: the `manager` field selects the ecosystem and the codegen target for the service's language injects only the matching entries into its native manifest. This generalizes the deprecated `NodeJsPackageItem` (npm-only) to all seven supported languages.

## Contained in

- [ServiceBasics](./ServiceBasics.md) as `packages` (a list)

## Contains

- `options`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
