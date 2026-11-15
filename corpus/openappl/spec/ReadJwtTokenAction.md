# ReadJwtTokenAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ReadJwtTokenAction in Part 1](../ontology/ReadJwtTokenAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines a read jwt token operation from either context, session or request and write its payload to the context with the contextPropertyName after validating it. The token signature should be in HMAC format. The token payload may be used for allowing access to an object via a signed token instead of standard authentication. This is typically used for public or limited-access sharing workflows (e.g., view-only links). Once the token payload is in context any other validations may be performed using the payload values in further actions.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `readTokenFrom` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript value that evaluates to the encoded JWT string. It may be in the context through parameters like `this.accessToken`, it may be read directly from controller request like `this.request.query.payToken` or it may be read from the session in cases where users have their own tokens for authorization like this.session.userSubscription. |
| `jwtKey` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript value that evaluates to the Jwt key to validate the token signature. It may be an hardcoded value like `1234560987abcdef` or a reference to context like this.jwtKey or a env reference like process.env.SUBS_KEY. |
| `isRequired` | `Boolean` | yes |  |  |  | A Boolean value to define if the token is required. Set it true if you want the application throw an error if the token is null or can not be validated. |
| `statusCheck` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An optional check script that runs after the signature is verified and before the payload is written to the context, so it cannot read the payload: `this.<contextPropertyName>` is not set yet and no other name is bound to it. Use it for general status checks on other context, session or request values; if the check fails the token is considered invalid (a 400 when isRequired, otherwise the action stores null). To check values inside the payload, use a later action, such as a ValidationAction, that reads `this.<contextPropertyName>`. |

## Constraints

Property rules:

- `readTokenFrom`, `jwtKey`, `isRequired` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `JWT_KEY_REQUIRED` | error | ReadJwtTokenAction.jwtKey is required — provide an MScript expression for the verification key. |
| `JWT_READ_TOKEN_FROM_REQUIRED` | error | ReadJwtTokenAction.readTokenFrom is required — provide an MScript expression to locate the token. |

## Example

Use to validate an HMAC-signed JWT (from request, context, or session) and place its payload on context — typically to authorize access via a signed share link instead of a standard session.

```json
{
  "name": "readShareToken",
  "description": "Validate the view-only share token and expose its scope claims for later checks.",
  "readTokenFrom": { "js": "this.request.query.shareToken" },
  "jwtKey": { "js": "process.env.SHARE_LINK_SECRET" },
  "isRequired": true,
  "statusCheck": { "js": "this.shareToken.scope === 'view' && this.shareToken.documentId === this.data.documentId" },
  "contextPropertyName": "shareToken"
}
```
