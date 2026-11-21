# HubScheduledAction

Run a room script at a fixed interval and broadcast its returned `serverMessages`. The timer starts on first join and stops after the last disconnect, unless `keepAlive` is enabled. If no messages appear, check that the room timer is active and that the script returned the object shape specified for `serverMessages`.

See the [pattern reference](../../spec/HubScheduledAction.md) and the [realtime hub guide](../capabilities/realtime.md).
