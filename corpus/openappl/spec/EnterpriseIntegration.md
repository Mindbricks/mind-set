# EnterpriseIntegration

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [EnterpriseIntegration in Part 1](../ontology/EnterpriseIntegration.md)

**Name:** an instance is named by `name`.

**Provider catalog:** the configuration keys of each brand are in [enterpriseIntegration](./providers/enterpriseIntegration.md).

A named enterprise-platform integration. The `name` is the lookup key used by the mcpbff bridge and the env-var prefix (e.g. `salesProd` → `ENTERPRISE_SALESPROD_*`). The `platform` enum selects the connector implementation shipped under `_in/mcpbff/_template/src/enterprise/connectors/` — connectors are TypeScript-only and run exclusively in mcpbff. The `configuration` is a free-form key/value list whose required keys depend on the chosen `platform`; the UI and the agent ontology doc enforce the per-platform shape.

Expected configuration keys per platform:
- salesforce: loginUrl (required, My-Domain login URL e.g. https://acme.my.salesforce.com), clientId (required, Connected App consumer key), clientSecret (required, secret), apiVersion (optional, defaults to v60.0)
- sapS4Hana / sapEcc: baseUrl (required, Gateway/OData base URL), sapClient (optional, SAP client number), username (communication/service user — the normal on-prem option), password (secret), apiKey (secret — alternative auth for API-hub-style hosts; used when username/password absent), services (optional, array of OData service descriptors [{name,path}]). At least one complete auth family (username+password OR apiKey) must be present.
- dynamics365: tenantId (required, Azure AD/Entra tenant id), clientId (required, app registration client id), clientSecret (required, secret), environmentUrl (required, Dataverse environment URL)
- hubspot: accessToken (required, secret, private-app pat-… token), baseUrl (optional, defaults to https://api.hubapi.com)
- netsuite (anticipated — no connector yet, mcpbff answers 501): accountId (required, account/realm id), consumerKey, consumerSecret (secret), tokenId (secret), tokenSecret (secret) — token-based auth quartet
- servicenow (anticipated — no connector yet, mcpbff answers 501): instanceUrl (required), username + password (secret) OR clientId + clientSecret (secret)
- workday (anticipated — no connector yet, mcpbff answers 501): baseUrl (required), tenant (required), clientId + clientSecret (secret) + refreshToken (secret) OR username + password (secret, ISU)
- zoho (anticipated — no connector yet, mcpbff answers 501): clientId (required), clientSecret (required, secret), refreshToken (required, secret), accountsUrl (optional, defaults to https://accounts.zoho.com), apiDomain (optional, defaults to https://www.zohoapis.com)

Secret keys (clientSecret, password, apiKey, accessToken, consumerSecret, tokenId, tokenSecret, refreshToken) are masked in API responses and emitted to ENTERPRISE_<NAME>_<KEY> env vars at codegen time. sapEcc shares the exact SAP Gateway OData contract + connector as sapS4Hana — a distinct brand only so the integration records which ERP it really is.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique integration identifier within the project. Used as the lookup key by the mcpbff bridge and as the env-var prefix (ENTERPRISE_<NAME>_*). Must be a valid codeName. |
| `platform` | `EnterprisePlatformType` | no | `"salesforce"` | 9 values, see [EnterprisePlatformType](#enterpriseplatformtype) |  | The enterprise platform this integration connects to. Selects which connector the mcpbff bridge instantiates and which keys are expected in `configuration`. |
| `configuration` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | Free-form key/value list of platform-specific credentials and connection settings. The required keys depend on `platform` — see the EnterpriseIntegration doc string for the per-platform key list. Sensitive keys (clientSecret, password, apiKey, accessToken, consumerSecret, tokenId, tokenSecret, refreshToken) are masked in API responses and emitted to ENTERPRISE_<NAME>_* environment variables at codegen time. |

## Allowed values

### EnterprisePlatformType

`salesforce`, `sapS4Hana`, `sapEcc`, `dynamics365`, `hubspot`, `netsuite`, `servicenow`, `workday`, `zoho`

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `platform` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `configuration` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `UNIQUE_ENTERPRISE_INTEGRATION_NAME` | error | Enterprise integration name "…" is used by … entries in projectSettings.enterpriseIntegrationsSettings.enterpriseIntegrations[]. |
