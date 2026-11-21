# Social login provider behavior

Declare one provider entry per brand. The provider account link identifies a previously linked user. To create an account link by email, the provider's email must satisfy the project's `emailVerification` rule. An email address in the profile alone does not establish that it is verified.

See the [configuration keys](../../spec/providers/socialLoginProvider.md) and the [related guide](../system-services/authentication/social-logins.md).

## Operations

Use the compiler's operations guide for environment and console setup.

For the Genesis compiler, these operations (environment variables, console configuration, credential setup, webhook registration and the go-live checklist) are in the `genesis-set` package, which installs next to mind-set.
