# EnterpriseIntegration

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [EnterpriseIntegration in Part 2](../spec/EnterpriseIntegration.md)

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

## Contained in

- [EnterpriseIntegrationsSettings](./EnterpriseIntegrationsSettings.md) as `enterpriseIntegrations` (a list)

## Contains

- `configuration`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
