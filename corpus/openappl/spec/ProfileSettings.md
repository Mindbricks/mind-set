# ProfileSettings

**Level:** `section` · **Family:** [ProjectAuthentication](../ontology/families.md#projectauthentication)

**Ontology:** [ProfileSettings in Part 1](../ontology/ProfileSettings.md)

The project's declaration of a readable user profile — the sanctioned way to show WHO a record belongs to. Two independent axes: `hasPublicProfile` (is there a profile route at all — default TRUE, so an app can always render a display identity) and `loginRequired` (who may call it — default true, logged-in callers only). While `hasPublicProfile` is on, the auth service generates `GET /userprofiles/:userId`, which serves the user object's own display identity (`fullname`, or the `name` + `surname` pair when the project splits the name, plus `avatar`) and every property named in `publicFields`, projected AT THE QUERY so no other column is ever read. The response rides the standard envelope with `_type: "user"` (the discriminator is always the data object's name); it is a PROJECTION of the user record — only the served columns are present, never the full row. There is deliberately no public LIST of profiles: a list makes the user set enumerable, so a profile is only ever readable by id.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hasPublicProfile` | `Boolean` | no | `true` |  |  | Master switch for the generated profile route. TRUE by default: an app that shows an author name beside a post, an avatar in a member list, or an assignee on a task needs this surface, and a project that silently lacked it could not render a user's identity at all. Set it false for projects where users must stay invisible to each other — then NO route is generated and nothing about a user is readable by anyone but that user and admins (`GET /users/:userId` is owner/admin-only by design). Leaving it on does not by itself expose anything to the anonymous internet — see `loginRequired`. |
| `loginRequired` | `Boolean` | no | `true` |  |  | The AUDIENCE of the generated profile route. True (the default) shares the profile with the LIMITED public — any logged-in user of the project — which is the right choice when identities are shown inside the app to signed-in people. False is the deliberate widening to the WIDER public: anonymous callers with no session; set it when the project genuinely serves public-facing pages (blog authors, marketplace sellers, a public directory). Widening the audience never changes WHICH columns are served — that is `publicFields` alone. Anonymous-by-default was considered and declined: it would make a project's entire user base — names and avatars — enumerable by iterating userIds without a session, which is personal data under KVKK/GDPR, so the widening stays an explicit act by the designer. |
| `publicFields` | `String`[] | no |  |  |  | Extra properties of the user object to serve on the profile, on top of the always-included display identity (the user object's own name shape — `fullname`, or `name` + `surname` — and `avatar`). Entries MUST name CUSTOM user properties declared in `authentication.userProperties` (e.g. `bio`, `title`, `websiteUrl`); naming a property that does not exist is a design-time error. Confidential system columns are refused outright — email, mobile, password-derived columns, verification/2FA flags, role and tenant columns, and session/login bookkeeping can never be listed here, whatever the project declares. Leave empty to serve the display identity only. |

## Constraints

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PROFILE_NO_DISPLAY_NAME` | error | The user object declares no display name: a profile needs either a "fullname" property or the "name" + "surname" pair. |
| `PROFILE_PUBLIC_FIELD_CONFIDENTIAL` | error | "…" can never be served on a user profile: …. |
| `PROFILE_PUBLIC_FIELD_NOT_CUSTOM` | error | "…" is a built-in user column, not one of this project's custom user properties. |
| `PROFILE_PUBLIC_FIELD_NOT_FOUND` | error | Property "…" not found on the user object. |
