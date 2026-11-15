# SessionGeoSensitivity

**Level:** `section` · **Family:** [ProjectAuthentication](../ontology/families.md#projectauthentication)

**Ontology:** [SessionGeoSensitivity in Part 1](../ontology/SessionGeoSensitivity.md)

**Activation:** the pattern is switched on by `locationSensitivityIsActive`.

Activates location-based session sensitivity. When active, the generated service compares each login's resolved location against the user's login history and enforces the configured action, and/or re-checks a live session's location on each request.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `locationSensitivityIsActive` | `Boolean` | no | `false` |  |  | Enables or disables location-sensitivity enforcement. Geo enrichment of sessions happens regardless; this flag gates only the enforcement rules. |
| `configuration` | [`SessionGeoSensitivityConfig`](./SessionGeoSensitivityConfig.md) | no | `{…}` |  |  | The configuration object for the location-sensitivity rules. Leave it null if locationSensitivityIsActive is false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
