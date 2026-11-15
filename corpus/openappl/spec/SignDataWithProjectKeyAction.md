# SignDataWithProjectKeyAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [SignDataWithProjectKeyAction in Part 1](../ontology/SignDataWithProjectKeyAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Signs an arbitrary value with the project's Ed25519 private key and stores a verifiable envelope on the workflow context. The envelope shape is `{ sig, kid, jwks_url }`. Any receiver (in this project or another trusted one) can verify the signature by fetching the project JWKS at `jwks_url` — defense against payload spoofing for webhooks, downstream API calls, or anywhere a designer wants to attach an origin proof to data. The signing form is canonical JSON with recursively sorted keys, so both sides reproduce identical bytes regardless of insertion order.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `inputData` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the value being signed. May be an object (canonicalized via the shared canonicalize() helper), a string (used as-is), or a Buffer-like (used as-is). Has access to `this` — the API context. |
| `contextPropertyName` | `String` | no |  |  |  | Context property to write the resulting envelope under. Other actions can reference the signature via `this.<contextPropertyName>.sig`, the kid via `.kid`, and the JWKS URL via `.jwks_url`. If null, the envelope is appended to the action's default result slot. |

## Constraints

Property rules:

- `inputData` must be present. (`REQUIRED_FIELD_MISSING`)

## Example

Use to attach an Ed25519 origin proof to data before sending it downstream (outbound webhooks, cross-project calls); the receiver verifies via the project JWKS. Produces an envelope { sig, kid, jwks_url } on context.

```json
{
  "name": "signWebhookPayload",
  "description": "Sign the order-shipped event so the partner can verify it came from this project.",
  "inputData": { "js": "{ event: 'order.shipped', orderId: this.order.id, trackingNumber: this.order.trackingNumber }" },
  "contextPropertyName": "signedEnvelope"
}
```
