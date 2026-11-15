# MailAccount

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [MailAccount in Part 2](../spec/MailAccount.md)

A named mail account — a real mailbox the project can listen to, check, read, and send from (docs/ADR-mail-account-family.md). The `name` is the lookup key used by mail actions (check / read / send-on-behalf reference an account by name) and the env-var prefix (e.g. `support` → `MAIL_ACCOUNT_SUPPORT_*`). The `platform` enum selects the connector: `imapSmtp` speaks RFC-standard IMAP (listen/read) + SMTP (send) and works against any standards-compliant host — including Gmail and Microsoft 365 when paired with authKind=xoauth2; `gmail` selects the native Gmail API connector (users.messages/history, users.watch push); `microsoftGraph` selects the native Microsoft Graph connector (/me or /users/{address} messages, change-notification subscriptions with delta-query polling fallback). The `authKind` selects the credential model: `password` is basic auth and is valid ONLY for imapSmtp (Google and Microsoft retired basic auth on their mailboxes); `xoauth2` is the OAuth2 bearer model (SASL XOAUTH2 on IMAP/SMTP, native OAuth on the API connectors). The `configuration` is a free-form key/value list whose required keys depend on the (platform, authKind) pair; blueprint validation rejects incomplete combos.

Expected configuration keys per (platform, authKind):
- imapSmtp + password: imapHost, smtpHost, username, password (secret). Optional: imapPort (default 993), smtpPort (default 587), imapSecure (default true), smtpSecure (default false = STARTTLS on 587).
- imapSmtp + xoauth2: imapHost, smtpHost, username, clientId, clientSecret (secret), refreshToken (secret), tokenUrl (the OAuth2 token endpoint, e.g. https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token). Optional: imapPort, smtpPort, imapSecure, smtpSecure, scope.
- gmail + xoauth2: clientId, clientSecret (secret), refreshToken (secret). The account `address` doubles as the API principal. Optional: tokenUrl (default https://oauth2.googleapis.com/token), scope, pubsubTopic (full Pub/Sub topic name for users.watch push wake-ups — operator setup in the ADR).
- microsoftGraph + xoauth2: tenantId, clientId, clientSecret (secret) — app-only client-credentials against Microsoft Graph (the dynamics365 enterprise-integration precedent). Optional: tokenUrl (default the tenant-scoped Azure AD v2.0 endpoint https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/token), scope (default https://graph.microsoft.com/.default), refreshToken (secret — opt into the delegated flow, addressing /me instead of /users/<address>), notificationUrl (a public HTTPS callback for a Graph change-notification subscription — operator setup in the ADR).
- gmail + password / microsoftGraph + password: INVALID — both platforms retired basic auth; validation rejects the combo (MAIL_ACCOUNT_INVALID_AUTH_KIND).

Secret keys (password, clientSecret, refreshToken) are masked in API responses and emitted to MAIL_ACCOUNT_<NAME>_<KEY> env vars at codegen time.

Owner scope: `ownerScope` absent or `project` is everything above. `tenant` / `user` make the entry a MAILBOX TEMPLATE (see the ownerScope field): no `address`, no username / refreshToken / password in `configuration` (the owner's connection supplies the IMAP login and the credential), and `maxMailboxesPerOwner` (unset = 5, bounds 1 to 20) and `inlineBody` (unset = false, metadata-only events) apply. Required template keys per (platform, authKind): imapSmtp + password: none (imapHost / smtpHost optional: set, they fix the server; unset, the owner names a server at connect time, validated to public DNS on fixed ports); imapSmtp + xoauth2: imapHost, smtpHost, clientId, clientSecret (secret), tokenUrl; gmail + xoauth2: clientId, clientSecret (secret); microsoftGraph + xoauth2: tenantId, clientId, clientSecret (secret); the token endpoint is built from tenantId: a directory id admits that directory's mailboxes only, `organizations` (or `common`) admits any work or school directory of a multi-tenant app. The OAuth app keys stay project secrets on the MAIL_ACCOUNT_<NAME>_* env path.

## Contained in

- [MailAccountsSettings](./MailAccountsSettings.md) as `mailAccounts` (a list)

## Contains

- `configuration`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
