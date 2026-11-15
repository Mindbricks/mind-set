# ServiceBasics

**Level:** `section` · **Family:** [ServiceSettings](../ontology/families.md#servicesettings) (domain `Service`)

**Ontology:** [ServiceBasics in Part 1](../ontology/ServiceBasics.md)

Provides core identifiers and metadata for the service. Includes the service's internal ID, a unique name (used in code, routing, and service naming), a descriptive text for documentation, and any custom variables required for runtime configuration.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | `String` | no |  |  |  | Unique identifier of the service, automatically managed within the project. |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Service name used for naming files, folders, endpoints, and routes. Use short, single-word names in camelCase if needed. This field impacts many system-level identifiers. |
| `description` | `Text` | no |  |  |  | A clear, human-readable explanation of what the service does. This description appears in service-level documentation and interface annotations. |
| `frontendDocument` | `Text` | no |  |  |  | A text based information to inform the frontend developer or frontend AI agent about the service specific UX behaviour of the service logic based on user stories and use cases. The format may be either text or markdown(recommended). Write the document as an AI prompt and describe service gneric UX behaviours. Any data object specific information should be given as a brief key sentence, since they will be detailed in their own objects. Note that this document will be given to the AI agent or human developer combined with all technical details that is generated from the servic design,so this document should only focus on service-specific behavioral UX business logic. |
| `customVariables` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | A list of custom key-value pairs that will be available to all scripts and functions within the service. Useful for environment-specific settings or reusable values. A variable whose name has a secret-shaped segment (TOKEN, SECRET, KEY, PASSWORD, ...) is a deploy secret unless its entry says secret: false: its value stays out of the committed env files and is pushed as a CI/CD variable. |
| `packages` | [`Package`](./Package.md)[] | no |  |  |  | A unified, language-agnostic list of third-party package dependencies for this service. Each entry names a package manager (`npm`, `pip`, `maven`, `nuget`, `gomod`, `cargo`), the manager-native package id, and a version. The codegen target for the service's language picks the entries whose `manager` matches that language's ecosystem and injects them into the generated manifest (package.json, pyproject.toml, pom.xml, .csproj, go.mod, Cargo.toml). This is the canonical replacement for the deprecated `nodejsPackages` field. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `customVariables` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `packages` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `FRAMEWORK_MANAGED_NPM_PACKAGE` | error | packages entry "…" (…) collides with the framework-managed nodejs dependency "…" (…, …): the nodejs codegen emits its own pin for this package and the framework version wins, so this entry would be silently dropped from … |
| `INVALID_NPM_PACKAGE_NAME` | error | packages entry "…" is not a legal npm package name: …. |
| `NON_LOWERCASE_NPM_PACKAGE_NAME` | warning | packages entry "…" contains uppercase letters. |
| `NPM_PACKAGE_NAME_IS_MODULE_ALIAS` | error | packages entry "…" cannot be installed as an npm dependency: "…" is a module alias, and the generated service maps it to its own emitted folder "…" in BOTH resolvers (tsconfig compilerOptions.paths and jest … |
| `NPM_PACKAGE_NOW_FRAMEWORK_MANAGED` | warning | packages entry "…" (…) is now provided by the framework: the nodejs codegen emits "…" … itself, so this entry is ignored (the framework version is installed, once) and can be removed. |
| `PACKAGE_MANAGER_NOT_CONSUMED` | warning | packages entry … declares manager "…", one of the system / C++ managers (…). |
| `RESERVED_ENV_NAME` | error | customVariables entry "…" collides with a reserved service env name. |
| `RESERVED_SERVICE_SLUG` | error | Service name "…" normalizes to the URL slug "…", which the platform reserves for …. |
| `SERVICE_SLUG_COLLISION` | error | Service name "…" normalizes to the URL slug "…" — the same slug as … in this project. |
