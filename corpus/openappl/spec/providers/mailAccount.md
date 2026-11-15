# Provider catalog: mailAccount

Entries of this family are written with [`MailAccount`](../MailAccount.md); the keys below are what an entry's `configuration` takes, per `provider` brand.

## Environment names

| Prefix | Key style |
|---|---|
| `MAIL_ACCOUNT` | `upperSnake` |

The key style `upperSnake` turns a camelCase key into UPPER_SNAKE; `verbatim` keeps it as written.

## Brands

| Brand | Keys | Required | Secret |
|---|---|---|---|
| [`imapSmtp`](#imapsmtp) | 13 | 3 | 3 |
| [`gmail`](#gmail) | 6 | 3 | 2 |
| [`microsoftGraph`](#microsoftgraph) | 6 | 3 | 2 |

## Credentials

| Entry | Value |
|---|---|
| `overlayFamily` | mail |
| `credentialSets` | true |
| `credentialModes` | ["auto","sandbox","live"] |
| `mockCredentialMode` | refused |
| `mockBrand` |  |
| `liveDetection` | none |
| `credentialScopes` | ["saas","tenant","user"] |
| `scopeField` | ownerScope |
| `ownerScopes` | ["project","tenant","user"] |
| `note` | `ownerScope: project` (the default) is the saas level: the mailbox and its credentials are on the entry. `tenant` and `user` turn the entry into a template whose mailboxes the owners connect themselves (the scoped-credential store, family `mail`, at most `maxMailboxesPerOwner` per owner). |

## imapSmtp

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `imapHost` | string |  | yes |  |  |  | IMAP host. |
| `smtpHost` | string |  | yes |  |  |  | SMTP host. |
| `username` | string |  | yes |  |  |  | Mailbox username. |
| `password` | string | yes |  |  |  |  | Mailbox/app password (password auth). |
| `clientId` | string |  |  |  |  |  | OAuth client id (xoauth2 auth). |
| `clientSecret` | string | yes |  |  |  |  | OAuth client secret (xoauth2 auth). |
| `refreshToken` | string | yes |  |  |  |  | OAuth refresh token (xoauth2 auth). |
| `tokenUrl` | string |  |  |  |  |  | OAuth token endpoint (xoauth2 auth). |
| `imapPort` | number |  |  |  |  |  | IMAP port. |
| `smtpPort` | number |  |  |  |  |  | SMTP port. |
| `imapSecure` | boolean |  |  |  |  |  | IMAP TLS. |
| `smtpSecure` | boolean |  |  |  |  |  | SMTP TLS. |
| `scope` | string |  |  |  |  |  | OAuth scope override. |

## gmail

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | OAuth client id. |
| `clientSecret` | string | yes | yes |  |  |  | OAuth client secret. |
| `refreshToken` | string | yes | yes |  |  |  | OAuth refresh token. |
| `tokenUrl` | string |  |  |  |  |  | Token endpoint override. |
| `scope` | string |  |  |  |  |  | OAuth scope override. |
| `pubsubTopic` | string |  |  |  |  |  | Pub/Sub topic for push (optional). |

## microsoftGraph

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `tenantId` | string |  | yes |  |  |  | Azure AD tenant id. |
| `clientId` | string |  | yes |  |  |  | App (client) id. |
| `clientSecret` | string | yes | yes |  |  |  | App client secret. |
| `refreshToken` | string | yes |  |  |  |  | Refresh token (delegated flows). |
| `tokenUrl` | string |  |  |  |  |  | Token endpoint override. |
| `scope` | string |  |  |  |  |  | OAuth scope override. |
