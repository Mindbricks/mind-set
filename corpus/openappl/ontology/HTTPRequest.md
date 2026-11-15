# HTTPRequest

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [HTTPRequest in Part 2](../spec/HTTPRequest.md)

Defines a reusable HTTP request configuration to interact with a remote service and retrieve a JSON response. This object is used across the platform for scenarios such as remote authentication, remote data access, and integration with external APIs (CRUD operations, searches, etc.).

## Contained in

- [ApiCallAction](./ApiCallAction.md) as `apiCallRequest`
- [RedirectAction](./RedirectAction.md) as `redirectUrl`
- [RemoteServiceAuthenticationConfig](./RemoteServiceAuthenticationConfig.md) as `remoteServiceRequest`
- [RemoteSessionConfig](./RemoteSessionConfig.md) as `sessionRequest`

## Contains

- `httpRequestParameters`: [HTTPRequestParameters](./HTTPRequestParameters.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
