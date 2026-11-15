# RemoteServiceAuthentication

**Level:** `unclassified` · **Family:** [Standalone patterns](../ontology/families.md#standalone-patterns)

**Ontology:** [RemoteServiceAuthentication in Part 1](../ontology/RemoteServiceAuthentication.md)

**Activation:** the pattern is switched on by `isRemoteServiceAuthenticationActive`.

Not available: AuthBasics carries this type only as a disabled slot, so no blueprint can enable it and nothing is generated from it. It describes delegating authentication to an external user service outside of the generated system, where the generated service would validate tokens and retrieve sessions via remote APIs.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `isRemoteServiceAuthenticationActive` | `Boolean` | yes |  |  |  | Declared remote-authentication activation switch, default false. AuthBasics currently exposes remote authentication only as a disabled slot, so a blueprint cannot activate this flow. The common runtime's dormant remote-verification hooks do not connect this field to generation. Restoring the feature and choosing replacement versus fallback verification remain undecided. |
| `configuration` | [`RemoteServiceAuthenticationConfig`](./RemoteServiceAuthenticationConfig.md) | no |  |  |  | The configuration object for remote service authentication. Leave it null if isRemoteServiceAuthenticationActive is false. |

## Constraints

Property rules:

- `isRemoteServiceAuthenticationActive` must be present. Enforced only while `isRemoteServiceAuthenticationActive` is on. (`REQUIRED_FIELD_MISSING`)
