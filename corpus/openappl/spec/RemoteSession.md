# RemoteSession

**Level:** `unclassified` · **Family:** [Standalone patterns](../ontology/families.md#standalone-patterns)

**Ontology:** [RemoteSession in Part 1](../ontology/RemoteSession.md)

**Activation:** the pattern is switched on by `useRemoteSession`.

Not available: AuthBasics carries this type only as a disabled slot, so no blueprint can enable it and nothing is generated from it. It describes retrieving session data from an external session service with an HTTP request to a remote endpoint, for session management handled outside of the generated application.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useRemoteSession` | `Boolean` | yes |  |  |  | Indicates whether remote session retrieval is enabled. If true, session data will be fetched from an external service using the settings defined in 'configuration'. |
| `configuration` | [`RemoteSessionConfig`](./RemoteSessionConfig.md) | no |  |  |  | The configuration object for remote session retrieval. Leave it null if useRemoteSession is false. |

## Constraints

Property rules:

- `useRemoteSession` must be present. Enforced only while `useRemoteSession` is on. (`REQUIRED_FIELD_MISSING`)
