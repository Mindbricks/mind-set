# SignDataWithProjectKeyAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [SignDataWithProjectKeyAction in Part 2](../spec/SignDataWithProjectKeyAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Signs an arbitrary value with the project's Ed25519 private key and stores a verifiable envelope on the workflow context. The envelope shape is `{ sig, kid, jwks_url }`. Any receiver (in this project or another trusted one) can verify the signature by fetching the project JWKS at `jwks_url` — defense against payload spoofing for webhooks, downstream API calls, or anywhere a designer wants to attach an origin proof to data. The signing form is canonical JSON with recursively sorted keys, so both sides reproduce identical bytes regardless of insertion order.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `signDataWithProjectKeyActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.signDataWithProjectKeyActions`
- `services.businessLogic.actions.signDataWithProjectKeyActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
