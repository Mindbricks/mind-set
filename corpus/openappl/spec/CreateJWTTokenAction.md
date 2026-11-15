# CreateJWTTokenAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [CreateJWTTokenAction in Part 1](../ontology/CreateJWTTokenAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Generates a signed JWT token from a given payload. This token can be stored in context or included in the API response for client use. Typically used for authentication or temporary session flows.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `JWTKey` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that defines the value of the JWT key to sign the payload. It is mostly an environement variable reference. |
| `payload` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that defines the object payload to be encoded inside the JWT. May include user ID, scopes, expiration, or other claims. |

## Constraints

Property rules:

- `JWTKey`, `payload` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `JWT_KEY_REQUIRED` | error | CreateJWTTokenAction.JWTKey is required — provide an MScript expression for the signing key. |
| `JWT_PAYLOAD_REQUIRED` | error | CreateJWTTokenAction.payload is required — provide an MScript expression for the token payload. |

## Example

Use to mint a signed JWT from a context-built payload — share links, temporary sessions, or single-use action tokens — to return to the client or store for later validation.

```json
{
  "name": "issueShareToken",
  "description": "Create a view-only token scoped to a single document, valid for one hour.",
  "JWTKey": { "js": "process.env.SHARE_LINK_SECRET" },
  "payload": { "js": "{ documentId: this.document.id, scope: 'view', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 3600 }" },
  "contextPropertyName": "shareToken",
  "writeToResponse": true
}
```
