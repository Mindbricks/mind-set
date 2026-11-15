# Package

**Level:** `subsection` · **Family:** [ServiceSettings](../ontology/families.md#servicesettings) (domain `Service`)

**Ontology:** [Package in Part 1](../ontology/Package.md)

**Name:** an instance is named by `name`.

A unified, language-agnostic third-party package dependency declaration. A single `Package` shape covers every supported language: the `manager` field selects the ecosystem and the codegen target for the service's language injects only the matching entries into its native manifest. This generalizes the deprecated `NodeJsPackageItem` (npm-only) to all seven supported languages.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `manager` | `PackageManager` | yes |  | 10 values, see [PackageManager](#packagemanager) |  | The package manager / language ecosystem this dependency belongs to. Required. Only packages whose manager matches the service's language are injected into that language's manifest. |
| `name` | `String` | yes |  |  | format [noSpace](./value-formats.md#nospace) | The manager-native package identifier. Required. npm: `axios` or `@scope/x`; pip: `requests`; maven: `group:artifact`; nuget: `Newtonsoft.Json`; gomod: `github.com/foo/bar`; cargo: `serde`; composer: `vendor/package`. |
| `version` | `String` | yes |  |  |  | The version constraint for the package. Required. Use an asterisk (`*`) to request the latest version. |
| `importAs` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Intended package binding alias, generalizing npm defaultImportConst. Node.js currently does not activate this alias in generated function/MScript contexts; declaring it does not make an unknown MScript root valid. Lexical compiled contexts versus runtime string-evaluated and ES contexts require a scope ruling and precise validation/emission changes. Omitted aliases add no automatic import binding; manifest dependency handling remains separate. |
| `options` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | Optional manager-specific extras as key/value pairs (e.g. cargo `features`). Interpretation is manager-dependent. |

## Allowed values

### PackageManager

`npm`, `pip`, `maven`, `nuget`, `gomod`, `cargo`, `composer`, `vcpkg`, `conan`, `apt`

## Constraints

Property rules:

- `manager`, `name`, `version` must be present. (`REQUIRED_FIELD_MISSING`)
- `manager` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`noSpace`](./value-formats.md#nospace) format. (`INVALID_NO_SPACE`)
- `importAs` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `options` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

## Example

Declare a third-party dependency on a service. The `manager` selects the ecosystem and the matching language codegen injects it into the generated manifest. This example adds the npm `axios` HTTP client (latest) bound to the `axios` alias for use in function/MScript code, plus a cargo crate with a feature flag.

```json
{
  "packages": [
    {
      "manager": "npm",
      "name": "axios",
      "version": "*",
      "importAs": "axios"
    },
    {
      "manager": "pip",
      "name": "requests",
      "version": "2.31.0"
    },
    {
      "manager": "cargo",
      "name": "serde",
      "version": "1.0",
      "importAs": "serde",
      "options": [
        {
          "name": "features",
          "value": "derive"
        }
      ]
    }
  ]
}
```
