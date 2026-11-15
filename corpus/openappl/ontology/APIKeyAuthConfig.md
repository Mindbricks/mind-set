# APIKeyAuthConfig

**Level:** `subsection` · **Family:** [AuthBasics](./families.md#authbasics) (domain `ProjectAuthentication`)

**Specification:** [APIKeyAuthConfig in Part 2](../spec/APIKeyAuthConfig.md)

Fine-tune API key authentication behavior. Controls which key types are generated, where keys are located in requests, and the custom header, query parameter, cookie or body field name. With its fields left unset (an empty object), the generated service defaults to secret-only keys in the Authorization Bearer header with the sk_mbx_ prefix — no additional configuration needed for standard usage. Note: public API key fields (publicApiKeyLocation, publicApiKeyName) are reserved for future support and have no effect currently.

## Contained in

- [APIKeyAuth](./APIKeyAuth.md) as `configuration`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
