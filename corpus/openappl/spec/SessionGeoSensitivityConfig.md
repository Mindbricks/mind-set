# SessionGeoSensitivityConfig

**Level:** `subsection` · **Family:** [ProjectAuthentication](../ontology/families.md#projectauthentication)

**Ontology:** [SessionGeoSensitivityConfig in Part 1](../ontology/SessionGeoSensitivityConfig.md)

Defines how a location change is detected and what happens when it occurs.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enforcementMode` | `GeoEnforcementMode` | no | `"loginTime"` | `loginTime`, `perRequest`, `both` |  | When the rule is applied: 'loginTime' (resolve + compare once per login), 'perRequest' (re-check the live session's location on each authenticated request) or 'both'. |
| `trackBy` | `GeoTrackBy` | no | `"country"` | `country`, `region`, `city`, `ip` |  | The granularity of a 'location change': by 'country', 'region' (state/province, within a country), 'city', or 'ip' (the raw client IP — the runtime's ipChange sensitivity; strictest and noisiest, and the only one that needs no geoip lookup). |
| `onLocationChange` | `GeoLoginAction` | no | `"stepUpEmail"` | `stepUpEmail`, `stepUpMobile`, `forceRelogin`, `notify` |  | Login-time action when a login arrives from a new location: 'stepUpEmail' / 'stepUpMobile' (require a verification challenge before the session is issued), 'forceRelogin' (reject + terminate the user's other sessions) or 'notify' (issue the session and publish a new-location alert event). |
| `onSessionDrift` | `GeoDriftAction` | no | `"invalidateSession"` | `invalidateSession`, `notify` |  | Per-request action when a live session's request location drifts from where it was issued: 'invalidateSession' (drop the session, force a fresh login) or 'notify' (allow, publish an alert event). |
| `graceWindowMinutes` | `Integer` | no | `0` |  |  | Grace period in minutes after a session is issued during which location changes are ignored (mobile networks can hop between cities/regions). 0 disables the grace window. |

## Constraints

Property rules:

- `enforcementMode`, `trackBy`, `onLocationChange`, `onSessionDrift` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
