# FrontendUrl

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [FrontendUrl in Part 2](../spec/FrontendUrl.md)

Per-environment base URLs for the frontend application. Sets the FRONTEND_URL environment variable used at runtime for social login callback redirects (defaults to FRONTEND_URL + /auth/callback), email notification links, and other frontend-facing URLs. If not set, defaults are derived from the project codename: dev=http://localhost:5173, test=`https://{codename}.<test-domain>`, stage=`https://{codename}-stage.<app-domain>`, prod=`https://{codename}.<app-domain>`, where the domains are set by the hosting platform.

## Contained in

- [BasicProjectSettings](./BasicProjectSettings.md) as `frontendUrl`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
