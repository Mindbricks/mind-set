# APIKeyAuth

**Level:** `section` · **Family:** [AuthBasics](./families.md#authbasics) (domain `ProjectAuthentication`)

**Specification:** [APIKeyAuth in Part 2](../spec/APIKeyAuth.md)

Enables API key authentication for the project. When enabled, an OpenAPPL compiler generates an apiKey data object, management APIs (create, list, delete), and validation endpoints. Secret API keys use the sk_mbx_ prefix and allow tokenless, session-based authentication — ideal for server-to-server integrations, AI agents, CI/CD pipelines, and MCP connections. Public API keys are defined in the configuration schema for future support but are not yet implemented.

## Contained in

- [AuthBasics](./AuthBasics.md) as `apiKeyAuthentication`

Blueprint paths:

- `authentication.authenticationEssentials.apiKeyAuthentication`

## Contains

- `configuration`: [APIKeyAuthConfig](./APIKeyAuthConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
