# Mailbox provider behavior

A mail account declares a mailbox template with a platform and an authentication kind. Read operations use the mailbox the caller is authorized to access. Outbound application notifications use a notification provider. Keep mailbox credentials out of the response data.

See the [configuration keys](../../spec/providers/mailAccount.md) and the [related guide](../capabilities/connected-mailboxes.md).

## Operations

Use the compiler's operations guide for environment and console setup.

For the Genesis compiler, these operations (environment variables, console configuration, credential setup, webhook registration and the go-live checklist) are in the `genesis-set` package, which installs next to mind-set.
