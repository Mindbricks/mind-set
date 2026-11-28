---
title: ValidationAction
---

# ValidationAction

`ValidationAction` runs a script-based business-rule check during a Business API workflow. It is the generic, all-purpose validation, distinct from the auth-style checks ([`PermissionCheckAction`](./permission-check-action.md), [`ObjectPermissionCheckAction`](./object-permission-check-action.md), [`MembershipCheckAction`](./membership-check-action.md)) and from the passive `condition` field on the parent class. Use it for any domain rule that can be expressed as a boolean MScript expression: subscription status, quota limits, object state machines, feature flags, compliance rules.

`condition` vs `ValidationAction`: `condition` *silently skips* the action when false; `ValidationAction` *actively rejects* the request (or stores the result for later) when its expression doesn't match `shouldBeTrue`. Pick the right tool: skipping side effects is `condition`; enforcing a rule with a user-visible error is `ValidationAction`.

## When to use it

- Enforce a business rule that doesn't fit the permission or membership models ("must be in `draft` state to publish", "remaining quota > 0").
- Combine multiple `storedCheck` results from sibling actions into a single boolean decision.
- Surface a meaningful HTTP error code + message to the client when the rule fails.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `description` | `Text` | ✓ | Human-readable description of the rule. Documents intent for reviewers, not shown to the client. |
| `shouldBeTrue` | `Boolean` |   | Expected truthiness of `validationScript`. When `true` (default sense), the validation passes when the script returns truthy. Set to `false` when you want the rule to pass on a falsy expression (e.g., `!isUserBanned`). |
| `checkType` | `ApiCheckType` |   | `liveCheck` throws on failure and aborts the API. `storedCheck` writes the boolean result to context and lets execution continue: combine multiple checks later. |
| `validationScript` | `MScript` | ✓ | Expression returning a boolean. Compared against `shouldBeTrue` to decide pass/fail. |
| `errorMessage` | `String` |   | Message returned to the client on failure when `checkType: liveCheck`. Keep it actionable: "Your plan does not allow creating more projects." rather than "Validation failed." |
| `errorMessageScript` | `MScript` |   | Optional. Computes the refusal message; evaluated only when the check FAILS, in the same context as `validationScript`. A non-empty string result replaces `errorMessage`; any other result (null, an empty string) or a script that throws answers `errorMessage`. String results only. The status stays `errorStatus`. No effect with `storedCheck`, nor with `errorStatus` `500` / `503` (a 5xx answer never carries a computed message; a 503 keeps the static `errorMessage`): an `INERT_OPTION` warning. |
| `errorStatus` | `ErrorStatus` |   | HTTP status code to return on failure (`liveCheck` only). One of `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, `503`. Default `400`. See guidance below. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

### Choosing `errorStatus`

The status code matters: the wrong one is the difference between "client retries with the same data" and "client knows to surface a specific error to the user." Pick by semantics, not by habit:

- **`400`**: malformed or syntactically invalid input. Default; safe choice when nothing more specific applies.
- **`401`**: authentication missing or invalid. A compiler bypasses 401/403 entirely for users with absolute roles like `superAdmin`, so don't use these codes for fine-grained business checks.
- **`403`**: authorization failure where the user is authenticated but lacks rights. Same bypass caveat.
- **`404`**: the referenced resource doesn't exist.
- **`409`**: uniqueness or duplicate conflicts. *Prefer this over `403`* when the issue is "this slot is already taken" rather than "you can't do this in general", for example a team is already registered, a stage window already exists, an active application is already submitted.
- **`422`**: semantic / business-rule violations on otherwise valid input. *Prefer this when the request is shaped correctly but a business precondition isn't met*: eligibility not confirmed, prerequisite not satisfied, "you can't publish a draft with no items." Authors who default to `400` for business rules usually want `422`.
- **`429`**: rate limit or usage quota exceeded, for a refusal that clears with TIME (too many attempts in the window, this month's quota is used up). Answered as problem+json with `errorCode: "TOO_MANY_REQUESTS"` and your `errorMessage`. Callers treat 429 as retryable and back off, so a limit no retry can lift (the plan does not include the feature at all) is `403` or `422`, not `429`.
- **`500`**: internal error. Don't use for user-facing business rules. The response body is genericized (`errorCode: "INTERNAL_ERROR"`, detail `Internal server error`): your `errorMessage` never reaches the caller.
- **`503`**: a dependency this api needs is down RIGHT NOW (an upstream service, a provider, a maintenance switch). Answered as problem+json with `errorCode: "SERVICE_UNAVAILABLE"` and your `errorMessage` kept (unlike `500`), so write the message for the caller and keep internal detail out of it. Callers retry a 503, so never use it for a permanent refusal.

There is no `402`: a payment-required refusal is `422`.

## Behaviour

The runtime evaluates `validationScript` against the current context and compares the result to `shouldBeTrue`:

- Pass: `validationScript` matches `shouldBeTrue`. Execution continues.
- Fail with `liveCheck`: the API throws an error with `errorStatus` and `errorMessage`. Subsequent actions do not run.
- Fail with `storedCheck`: the boolean is written to `this.<contextPropertyName>` (or the action's default slot). Execution continues, and downstream actions can combine multiple stored checks.

**One refusal, every reason.** When one rule has several reasons to refuse, compute the message instead of writing one check per reason:

```json
{
  "name": "checkBookable",
  "checkType": "liveCheck",
  "validationScript": { "js": "this.patient && this.slotIsFree" },
  "errorMessage": "The appointment cannot be booked.",
  "errorMessageScript": { "js": "[this.patient ? null : 'patient not found', this.slotIsFree ? null : 'slot is taken'].filter(Boolean).join('; ')" },
  "errorStatus": "422"
}
```

The script runs only on the failure path, so it may assume the check failed; it never runs on a passing call.

## Example

A quota check that rejects with a semantic `422`:

```json
{
  "name": "ensureProjectQuota",
  "description": "Account must have remaining project quota.",
  "validationScript": { "js": "this.account.projectCount < this.account.plan.maxProjects" },
  "shouldBeTrue": true,
  "checkType": "liveCheck",
  "errorMessage": "Your plan does not allow creating more projects.",
  "errorStatus": "422"
}
```

A duplicate detection that uses `409`:

```json
{
  "name": "ensureTeamNameUnique",
  "description": "Reject duplicate team names within the same org.",
  "validationScript": { "js": "this.existingTeams.length === 0" },
  "shouldBeTrue": true,
  "checkType": "liveCheck",
  "errorMessage": "A team with this name is already registered in your organisation.",
  "errorStatus": "409"
}
```

A deferred check combined later:

```json
[
  {
    "name": "ownsResource",
    "description": "User owns the resource (storedCheck).",
    "validationScript": { "js": "this.resource.ownerId === this.session.userId" },
    "checkType": "storedCheck",
    "contextPropertyName": "isOwner"
  },
  {
    "name": "isAdmin",
    "permissionName": "canAccessAdminPanel",
    "checkType": "storedCheck",
    "contextPropertyName": "isAdmin"
  },
  {
    "name": "combinedAccessCheck",
    "description": "Allow if owner OR admin.",
    "validationScript": { "js": "this.isOwner || this.isAdmin" },
    "checkType": "liveCheck",
    "errorMessage": "You do not have access to this resource.",
    "errorStatus": "403"
  }
]
```

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class; in particular its `condition` field for passive skip.
- [`PermissionCheckAction`](./permission-check-action.md), [`ObjectPermissionCheckAction`](./object-permission-check-action.md), [`MembershipCheckAction`](./membership-check-action.md): auth-style siblings.
- [Error handling in workflows](../workflow/error-handling.md).
