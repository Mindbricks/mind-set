# Provider catalog: enterpriseIntegration

Entries of this family are written with [`EnterpriseIntegration`](../EnterpriseIntegration.md); the keys below are what an entry's `configuration` takes, per `provider` brand.

## Environment names

| Prefix | Key style |
|---|---|
| `ENTERPRISE` | `upperSnake` |

The key style `upperSnake` turns a camelCase key into UPPER_SNAKE; `verbatim` keeps it as written.

## Brands

| Brand | Keys | Required | Secret |
|---|---|---|---|
| [`salesforce`](#salesforce) | 4 | 3 | 1 |
| [`sapS4Hana`](#saps4hana) | 6 | 1 | 2 |
| [`sapEcc`](#sapecc) | 6 | 1 | 2 |
| [`dynamics365`](#dynamics365) | 4 | 4 | 1 |
| [`hubspot`](#hubspot) | 2 | 1 | 1 |
| [`netsuite`](#netsuite) | 5 | 1 | 3 |
| [`servicenow`](#servicenow) | 5 | 1 | 2 |
| [`workday`](#workday) | 7 | 2 | 3 |
| [`zoho`](#zoho) | 5 | 3 | 2 |

## Credentials

| Entry | Value |
|---|---|
| `overlayFamily` |  |
| `credentialSets` | false |
| `credentialModes` | [] |
| `mockCredentialMode` | refused |
| `mockBrand` |  |
| `liveDetection` | none |
| `credentialScopes` | ["saas"] |
| `scopeField` |  |
| `note` | Not an organization or overlay family: no sets, no credential mode. The credentials live once on the entry and every bridge brand that names it reads them. |

## salesforce

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `loginUrl` | string |  | yes |  |  |  | Salesforce login URL. |
| `clientId` | string |  | yes |  |  |  | Connected-app client id. |
| `clientSecret` | string | yes | yes |  |  |  | Connected-app client secret. |
| `apiVersion` | string |  |  |  |  |  | Salesforce API version. |

## sapS4Hana

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `baseUrl` | string |  | yes |  |  |  | SAP OData base URL. |
| `sapClient` | string |  |  |  |  |  | SAP client (mandant). |
| `username` | string |  |  |  |  |  | Communication user (basic auth family). |
| `password` | string | yes |  |  |  |  | Communication user password (basic auth family). |
| `apiKey` | string | yes |  |  |  |  | API key (apiKey auth family). |
| `services` | json |  |  |  |  |  | OData service catalog (JSON). |

## sapEcc

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `baseUrl` | string |  | yes |  |  |  | SAP OData base URL. |
| `sapClient` | string |  |  |  |  |  | SAP client (mandant). |
| `username` | string |  |  |  |  |  | Communication user (basic auth family). |
| `password` | string | yes |  |  |  |  | Communication user password (basic auth family). |
| `apiKey` | string | yes |  |  |  |  | API key (apiKey auth family). |
| `services` | json |  |  |  |  |  | OData service catalog (JSON). |

## dynamics365

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `tenantId` | string |  | yes |  |  |  | Azure AD tenant id. |
| `clientId` | string |  | yes |  |  |  | App (client) id. |
| `clientSecret` | string | yes | yes |  |  |  | App client secret. |
| `environmentUrl` | string |  | yes |  |  |  | Dataverse environment URL. |

## hubspot

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `accessToken` | string | yes | yes |  |  |  | Private-app access token. |
| `baseUrl` | string |  |  |  |  |  | HubSpot API base URL override. |

## netsuite

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `accountId` | string |  | yes |  |  |  | NetSuite account id (realm), e.g. 1234567 or 1234567-sb1. No connector ships yet. |
| `consumerKey` | string |  |  |  |  | group `auth` (one full group is required) | Integration-record consumer key (token-based auth). |
| `consumerSecret` | string | yes |  |  |  | group `auth` (one full group is required) | Integration-record consumer secret (token-based auth). |
| `tokenId` | string | yes |  |  |  | group `auth` (one full group is required) | Access-token id (token-based auth). |
| `tokenSecret` | string | yes |  |  |  | group `auth` (one full group is required) | Access-token secret (token-based auth). |

## servicenow

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `instanceUrl` | string |  | yes |  |  |  | ServiceNow instance URL, e.g. https://acme.service-now.com. No connector ships yet. |
| `username` | string |  |  |  |  | group `auth` (one full group is required) | Integration user (basic auth family). |
| `password` | string | yes |  |  |  | group `auth` (one full group is required) | Integration user password (basic auth family). |
| `clientId` | string |  |  |  |  | group `auth` (one full group is required) | OAuth client id (OAuth auth family). |
| `clientSecret` | string | yes |  |  |  | group `auth` (one full group is required) | OAuth client secret (OAuth auth family). |

## workday

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `baseUrl` | string |  | yes |  |  |  | Workday REST API base URL, e.g. https://wd2-impl-services1.workday.com. No connector ships yet. |
| `tenant` | string |  | yes |  |  |  | Workday tenant id. |
| `clientId` | string |  |  |  |  | group `auth` (one full group is required) | API-client id (OAuth refresh-token auth family). |
| `clientSecret` | string | yes |  |  |  | group `auth` (one full group is required) | API-client secret (OAuth refresh-token auth family). |
| `refreshToken` | string | yes |  |  |  | group `auth` (one full group is required) | OAuth refresh token (OAuth refresh-token auth family). |
| `username` | string |  |  |  |  | group `auth` (one full group is required) | Integration system user (ISU basic auth family). |
| `password` | string | yes |  |  |  | group `auth` (one full group is required) | Integration system user password (ISU basic auth family). |

## zoho

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | Zoho API console client id. No connector ships yet. |
| `clientSecret` | string | yes | yes |  |  |  | Zoho API console client secret. |
| `refreshToken` | string | yes | yes |  |  |  | OAuth refresh token (self-client or authorization-code grant). |
| `accountsUrl` | string |  |  | `https://accounts.zoho.com` |  |  | Data-center accounts host, e.g. https://accounts.zoho.eu. |
| `apiDomain` | string |  |  | `https://www.zohoapis.com` |  |  | Data-center API domain, e.g. https://www.zohoapis.eu. |
