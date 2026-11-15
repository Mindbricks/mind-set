# SessionGeoSensitivity

**Level:** `section` · **Family:** [ProjectAuthentication](./families.md#projectauthentication)

**Specification:** [SessionGeoSensitivity in Part 2](../spec/SessionGeoSensitivity.md)

Activates location-based session sensitivity. When active, the generated service compares each login's resolved location against the user's login history and enforces the configured action, and/or re-checks a live session's location on each request.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `sessionGeoSensitivity`

Blueprint paths:

- `authentication.sessionGeoSensitivity`

## Contains

- `configuration`: [SessionGeoSensitivityConfig](./SessionGeoSensitivityConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
