# FrontendUrl

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [FrontendUrl in Part 1](../ontology/FrontendUrl.md)

Per-environment base URLs for the frontend application. Sets the FRONTEND_URL environment variable used at runtime for social login callback redirects (defaults to FRONTEND_URL + /auth/callback), email notification links, and other frontend-facing URLs. If not set, defaults are derived from the project codename: dev=http://localhost:5173, test=`https://{codename}.<test-domain>`, stage=`https://{codename}-stage.<app-domain>`, prod=`https://{codename}.<app-domain>`, where the domains are set by the hosting platform.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `dev` | `String` | no | `null` |  |  | Frontend base URL for local development environment. Default: http://localhost:5173 |
| `test` | `String` | no | `null` |  |  | Frontend base URL for the test/preview environment. Default: `https://{projectCodename}.<test-domain>`, where the domain is set by the hosting platform |
| `stage` | `String` | no | `null` |  |  | Frontend base URL for the staging environment. Default: `https://{projectCodename}-stage.<app-domain>`, where the domain is set by the hosting platform |
| `prod` | `String` | no | `null` |  |  | Frontend base URL for the production environment. Default: `https://{projectCodename}.<app-domain>`, where the domain is set by the hosting platform |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
