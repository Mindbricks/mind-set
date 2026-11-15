# ProfileSettings

**Level:** `section` · **Family:** [ProjectAuthentication](./families.md#projectauthentication)

**Specification:** [ProfileSettings in Part 2](../spec/ProfileSettings.md)

The project's declaration of a readable user profile — the sanctioned way to show WHO a record belongs to. Two independent axes: `hasPublicProfile` (is there a profile route at all — default TRUE, so an app can always render a display identity) and `loginRequired` (who may call it — default true, logged-in callers only). While `hasPublicProfile` is on, the auth service generates `GET /userprofiles/:userId`, which serves the user object's own display identity (`fullname`, or the `name` + `surname` pair when the project splits the name, plus `avatar`) and every property named in `publicFields`, projected AT THE QUERY so no other column is ever read. The response rides the standard envelope with `_type: "user"` (the discriminator is always the data object's name); it is a PROJECTION of the user record — only the served columns are present, never the full row. There is deliberately no public LIST of profiles: a list makes the user set enumerable, so a profile is only ever readable by id.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `profileSettings`

Blueprint paths:

- `authentication.profileSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
