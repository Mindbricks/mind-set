# BasicProjectSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [BasicProjectSettings in Part 1](../ontology/BasicProjectSettings.md)

Defines the basic settings of your OpenAPPL project, including its identity, descriptive metadata, environment variables, and current lifecycle stage. These values are essential for naming, documentation, and runtime configuration.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The short name of the project. This is a required field and is often a single word. It is used as a prefix for naming project assets and resources. |
| `fullname` | `String` | yes |  |  |  | The full, descriptive name of the project. This will appear in dashboards, documentation, and UIs. |
| `description` | `Text` | no |  |  |  | A long-form description of the project. This text is used in documentation materials and for internal references. |
| `avatar` | `String` | no |  |  | format [url](./value-formats.md#url) | A URL to the project's avatar icon. This image is shown in UI panels and documentation headers. |
| `frontendDocument` | `Text` | no |  |  |  | A text based information to inform the frontend developer or frontend AI agent about the general UX behaviour of the application based on user stories and use cases. The format may be either text or markdown(recommended). Write the document as an AI prompt and describe application gneric UX behaviours. Any service or data object specific information should be given as a brief key sentence, since they will be detailed in their own objects. Note that this document will be given to the AI agent or human developer combined with all technical details that is generated from the project design,so this document should only focus on application-global behavioral UX business logic. |
| `hasAuthentication` | `Boolean` | no | `true` |  |  | Project authentication intent, declared default true. Auth-service creation currently depends on the authentication chapter being present; this Boolean does not itself create or remove the auth service or runtime security middleware. The project API guide also consults it when describing authentication. Contradictions between false, an authentication chapter and authenticated APIs require a ruling; do not rely on false to disable security. |
| `ignoreDeploymentSpecificFiles` | `Boolean` | no | `false` |  |  | Use this in your custom deployment not to generate auto-deployemnt specific files so you can integrate your own files to your repository. AI Agents should keep this false. |
| `explicitMode` | `Boolean` | no | `true` |  |  | Project-wide pattern mode — always `true` in this framework (the only mode). Every BusinessApi declares its full request shape via `requestParameters` and its full dataClause map via `dataClauseItems`; the framework auto-injects values from `sessionSettings` and `staticJoin` when those blocks are present on the property. Legacy implicit constructs (autoParams, DataProperty `source`) are accepted ONLY at blueprint-migration time and converted to explicit before validation/build. |
| `customVariables` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | Key-value pairs defining custom environment variables for the project. These variables are available in runtime and can be accessed in service logic and functions. A variable whose name has a secret-shaped segment (TOKEN, SECRET, KEY, PASSWORD, ...) is a deploy secret unless its entry says secret: false: its value stays out of the committed env files and is pushed as a CI/CD variable. |
| `frontendUrl` | [`FrontendUrl`](./FrontendUrl.md) | no |  |  |  | Per-environment base URLs for the frontend application. Used to derive callback URLs (e.g. social login redirect). Defaults: dev=http://localhost:5173, test=`https://{codename}.<test-domain>`, stage=`https://{codename}-stage.<app-domain>`, prod=`https://{codename}.<app-domain>`, where the domains are set by the hosting platform. Override when using a custom domain. |

## Constraints

Property rules:

- `name`, `fullname` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `avatar` must be in the [`url`](./value-formats.md#url) format. (`INVALID_URL`)
- The items of `customVariables` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `RESERVED_ENV_NAME` | error | customVariables entry "…" collides with a reserved project env name. |
