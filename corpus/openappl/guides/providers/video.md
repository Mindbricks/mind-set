# Video provider behavior

Video room actions control a provider's room and issue credentials for joining or playback. The room decides whether to grant access before a participant token is issued. The provider transports the media and the generated service runs authorization and control operations.

See the [configuration keys](../../spec/providers/videoProvider.md) and the [related guide](../actions/video-room-token-action.md).

## Operations

Use the compiler's operations guide for environment and console setup.

For the Genesis compiler, these operations (environment variables, console configuration, credential setup, webhook registration and the go-live checklist) are in the `genesis-set` package, which installs next to mind-set.
