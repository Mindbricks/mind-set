# MailAccountsSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [MailAccountsSettings in Part 1](../ontology/MailAccountsSettings.md)

Container for project-level mail-account configurations (docs/ADR-mail-account-family.md). An entry is a mailbox the project owns or, with ownerScope tenant / user, a mailbox template that tenants or users connect their own mailboxes to. A MailAccount is a REAL MAILBOX the project owns — unlike a NotificationProvider (a fire-and-forget outbound channel), a mail account is bidirectional: it can be listened to (autoListen → normalized inbound-mail envelopes on Kafka), checked and read on demand, and used to send or reply on behalf of the account. The mcpbff bridge host owns ALL mailbox connectivity — regular services never open an IMAP/API connection; they consume the Kafka envelope topic and reach the mailbox through mail actions (the amqpProvidersSettings / enterpriseIntegrationsSettings precedent). The generator emits MAIL_ACCOUNT_<NAME>_* environment variables per account so the bridge can construct the mailbox client at runtime without revisiting the project config. Mirrors the notificationProvidersSettings shape — a named array; multiple entries can share the same platform (e.g. two IMAP hosts, or one Gmail plus one Microsoft 365 account).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mailAccounts` | [`MailAccount`](./MailAccount.md)[] | no |  |  |  | List of configured mail accounts. Add one entry per mailbox you want available. Multiple entries can share the same platform (e.g. two IMAP/SMTP accounts on different hosts, or one Gmail and one Microsoft 365 account — distinct names). |

## Constraints

Property rules:

- The items of `mailAccounts` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
