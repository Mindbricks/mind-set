# VideoRoomTokenAction

Authorize a participant against the room's policy, then mint its join token or broadcast playback grant. The default identity is the session user's id. An empty room id is rejected with 400. A denied room authorization yields no credential.

See the [pattern reference](../../spec/VideoRoomTokenAction.md) and the [video provider guide](../../spec/providers/videoProvider.md).
