# The route surface is READ, never derived

Read by the auth-spec and service-spec writers. A route path written from REST
habit puts a URL that does not exist into a spec that later stages certify and
test against.

**A route path is not a function of the API name.** The framework's
resource-path calculator splits the API NAME into action and resource, and
only collapses onto the pluralized object name when the resource IS the
object. Sibling APIs on one object land on very different paths:

| API | Mounted route | What a reader assumes |
|---|---|---|
| `updateUser` | `PATCH /users/:userId` | correct |
| `updateUserRole` | `PATCH /userrole/:userId` | wrong: `/users/:userId/role` |
| `updateUserPassword` | `PATCH /userpassword/:userId` | wrong |
| `changePassword` | `PATCH /changepassword/:userId` | wrong |
| `updateProfile` | `PATCH /profile/:userId` | wrong |
| `currentUser` | `GET /currentuser` | wrong: there is no `/me` |
| `login` / `logout` / `relogin` | `POST /login`, `POST /logout`, `POST /relogin` | correct (explicit route) |
| verification flows | `POST /api/auth/verify/<flow>/start` and `/complete` | wrong: not `/forgot-password` |

Two more facts that turn a nearly-right path into a 404:

- **The route path is the WHOLE path.** There is no `/v1` prefix to add.
- **A field name is not a URL segment.** A `roleId` field does not imply
  `/role`; a `:userId` parameter does not imply `/users/:userId/...`.

## Where the real list comes from

The compiler contract gives the real list: the business API rules
(`openappl/compiler/05-business-apis.md`, section 5.3 Routes) and the derived
surface (`openappl/compiler/12-derived-surface.md`) resolve each API of the
blueprint to its `method` and `routePath` (an explicit route when one is
given, the calculated path otherwise) and its guard fields. Two APIs that
resolve to the same `(METHOD, routePath)` are a collision. The `auth`,
`notification`, `bff` and `agentHub` services carry a FULL platform surface,
including the built-in auth routes no spec lists; read it from the system
service chapters (`openappl/compiler/09-system-services.md` and its
sections), never from habit.

When your inputs carry a live route surface (the auth-spec input
`auth-route-surface`), THAT is the enumeration: copy `method` and `routePath`
out of it verbatim. A capability that is not in the enumeration is "the design
declares no such route" - never a best-guess path.

## Reading the guard fields

- **`checkRoles` is the GATE** (any-of; the generated basic-auth check refuses
  with 403 without one of them).
- **`absoluteRoles` is a BYPASS list, not a gate.** It grants the named roles
  unconditional access; a non-empty `absoluteRoles` never restricts anything.
- **An empty `checkRoles` is ambiguous until you read `ownershipCheck`:**
  with `ownershipCheck: true` the gate is the ownership check and an empty
  `checkRoles` is correct; with `ownershipCheck: false`, empty `checkRoles`
  and a non-empty `absoluteRoles`, the API is genuinely open. The validator
  reports that shape as `ABSOLUTE_ROLES_WITHOUT_GATE`, an ERROR everywhere
  (validate, build, and every normal save that carries the api, even one
  saved long ago; #5531): design every such api with `checkRoles` (usually
  the same roles), an enforceable `ownershipCheck`, a `parentOwnershipChecks`
  entry when the owner of the PARENT row may call it, or without
  `absoluteRoles`. `skipValidation` on a write skips every save-time check;
  it does not make the project build.

Never describe an API as ungated, or as admin-only, without all three fields.
