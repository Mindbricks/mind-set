---
title: SignDataWithProjectKeyAction
---

# SignDataWithProjectKeyAction

`SignDataWithProjectKeyAction` signs an arbitrary value with the project's Ed25519 private key and writes a verifiable envelope onto the workflow context. The envelope shape is `{ sig, kid, jwks_url }`: any receiver (this project or another trusted one) verifies the signature by fetching the project's JWKS at `jwks_url` and validating `sig` against the canonical form of the original data.

The signing form is **canonical JSON with recursively sorted keys**, so both sides reproduce identical bytes regardless of object insertion order. Don't sign pretty-printed JSON or otherwise pre-formatted text: feed in the object and let the compiler's runtime canonicalize it.

## When to use it

- Sign an outbound webhook payload so the receiver can verify it actually came from this project.
- Attach an origin proof to a response body that the client (or another service) hands to a downstream consumer.
- Build cross-project trust: projects exchange signed envelopes, each verifying against the other's JWKS.

Distinguish from [`CreateJWTTokenAction`](./create-jwt-token-action.md): that action mints a short-lived HMAC bearer token; this action signs *arbitrary data* with an asymmetric (Ed25519) key whose public half is published at a stable JWKS URL.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `inputData` | `MScript` | ✓ | Expression evaluating to the value to sign. May be an object (canonicalized: recursively sorted keys), a string (used as-is), or a Buffer-like (used as-is). Has access to `this`, the API context. |
| `contextPropertyName` | `String` |   | Context property to write the resulting envelope under. Other actions reference the signature via `this.<contextPropertyName>.sig`, the kid via `.kid`, and the JWKS URL via `.jwks_url`. When `null`, the envelope is appended to the action's default result slot. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

At runtime:

1. The action evaluates `inputData`.
2. If the value is an object, it is canonicalized (recursively-sorted-keys JSON) before signing. Strings and buffers are used as-is.
3. The runtime signs the canonical bytes with the project's Ed25519 private key.
4. The result `{ sig, kid, jwks_url }` is written to context under `contextPropertyName`.

Receivers verify by:

1. Fetching the JWKS document at `jwks_url`.
2. Selecting the key by `kid`.
3. Re-canonicalizing the data the same way and checking `sig` against the public key.

The Ed25519 keypair is project-provisioned; the JWKS endpoint is served by the hosting platform at the project's stable URL. There is no per-service configuration to author.

## Example

Sign a webhook payload and attach the signature alongside the body:

```json
[
  {
    "name": "buildPayload",
    "inputData": { "js": "{ event: 'order.shipped', orderId: this.order.id, ts: Date.now() }" },
    "contextPropertyName": "payload"
  },
  {
    "name": "signPayload",
    "inputData": { "js": "this.payload" },
    "contextPropertyName": "envelope"
  },
  {
    "name": "callDownstream",
    "_kind": "ApiCallAction",
    "url": "this.webhook.url",
    "method": "POST",
    "body": "{ payload: this.payload, signature: this.envelope.sig, keyId: this.envelope.kid, jwksUrl: this.envelope.jwks_url }"
  }
]
```

A receiver that wants to verify the signature reads `keyId`, fetches the key from `jwksUrl`, re-canonicalizes `payload`, and verifies `signature` against the public key.

## Errors

- Missing, null, or non-string primitive `inputData` is refused with `ApiError(400, 'Signing input must be a string or object')` before signing credentials are loaded. Strings, objects, Buffer and Uint8Array values pass through unchanged. Guard with a `condition` if the input is optional.
- Project key not provisioned: startup-time configuration failure (typically not seen in production).

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`CreateJWTTokenAction`](./create-jwt-token-action.md): HMAC bearer tokens (different model, different lifetime).
- [`ReadJwtTokenAction`](./read-jwt-token-action.md): HMAC bearer verification.
- [`VerifyWebhookAction`](./verify-webhook-action.md): inbound webhook signature verification (their signature, our verification).
- Keys and JWKS: the `kid` / `jwks_url` envelope a receiver resolves to verify the signature (Ed25519 / EdDSA service-identity surface).
