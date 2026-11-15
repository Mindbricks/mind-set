---
title: Remote authentication
---

# Remote authentication

OpenAPPL does not delegate authentication or session state to an external user service. The
auth service always owns the users, validates the credentials and mints the session token
itself; every other service verifies that token (see [Access tokens](./access-tokens.md)).

The schema still defines the remote types
([`RemoteServiceAuthentication`](../../../spec/RemoteServiceAuthentication.md),
[`RemoteServiceAuthenticationConfig`](../../../spec/RemoteServiceAuthenticationConfig.md),
[`RemoteSession`](../../../spec/RemoteSession.md),
[`RemoteSessionConfig`](../../../spec/RemoteSessionConfig.md)), but only as disabled slots:
[`AuthBasics`](../../../spec/AuthBasics.md), the type of `authenticationEssentials`, has no
`remoteServiceAuthentication` or `remoteSessionSettings` property. A blueprint that carries
either key under `authenticationEssentials` is refused at validation with
`UNKNOWN_PROPERTY`, and nothing is generated from it.

What to use instead:

| Need | Use |
|---|---|
| Users sign in at your organisation's identity provider | [SSO](./sso.md): the IdP handles the login step, and the auth service issues its own token afterwards. |
| Users sign in with Google, Apple, GitHub and other providers | [Social logins](./social-logins.md). |
| A program calls the APIs on behalf of a user | [API keys](./api-keys.md). |
| One service calls another without a user | [Machine-to-machine](./m2m.md). |

## See also

- [Access tokens](./access-tokens.md): the local-JWT path every service uses.
- [SSO](./sso.md): delegating the *login* step to an external IdP.
