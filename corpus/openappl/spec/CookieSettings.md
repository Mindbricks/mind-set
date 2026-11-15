# CookieSettings

**Level:** `section` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [CookieSettings in Part 1](../ontology/CookieSettings.md)

Arranges the allow-list for the session cookie. The cookie itself is always httpOnly; Secure and SameSite come from the runtime env (COOKIE_SECURE, SESSION_COOKIE_SAMESITE). This section decides two things: which hosts may receive the cookie at all, and what its Domain attribute is.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `allowedDomains` | `String`[] | no |  |  | format [noSpace](./value-formats.md#nospace) | The hosts allowed to receive the session cookie, each given either as a base domain (xapp.com - the cookie is then shared across all of its subdomains, which is what enables SSO between app. and api. hosts) or as a specific host (web.xapp.com). Emitted as the COOKIE_DOMAINS environment variable into the stage/prod/test slots only, so local development is never gated. Leave it empty to keep the permissive default; once it is set, a login served on a host outside the list receives NO session cookie and the refusal is logged. List the API hosts that actually serve the login response, not only the frontend origins. |

## Constraints

Property rules:

- `allowedDomains` must be in the [`noSpace`](./value-formats.md#nospace) format. (`INVALID_NO_SPACE`)
