---
title: EmitSseEventAction
---

# EmitSseEventAction

Emits a custom Server-Sent Events (SSE) event during workflow execution. When the API is invoked via REST (no SSE context), the action is a silent no-op: it is safe to leave in any workflow that can be called either way.

For automatic before/after progress events around a single action, set [`emitProgressInSSEContext`](../../spec/BusinessApiAction.md) to `true` on that action instead. `EmitSseEventAction` is the explicit path, with a `step` name and payload you choose.

The SSE controller mounts the same route as its parent business API's `restSettings.routePath`; the compiler does **not** append a `/stream` suffix. If a workflow needs a distinct streaming endpoint, declare a sibling business API whose `restSettings.routePath` is explicit (`/orders/stream`, `/orders/:id/tail`, ...) and place this action in that sibling. See [SSE streaming](../business-apis/sse-streaming.md).

## When to use it

- Surface a custom milestone in a long-running workflow (`jobCreated`, `phaseComplete`, `partialResults`).
- Stream intermediate values to the client during an SSE call without committing them to the final response.
- Re-use a workflow for both REST and SSE consumers: the action is a no-op in the REST path.
- For per-action progress (`Starting <action>` / `<action> completed`) prefer `emitProgressInSSEContext: true` on the relevant action.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `eventName` | `String` | yes | The name the client sees as the frame's `step` (e.g. `jobCreated`, `phaseComplete`). The SSE event type itself is always `progress`. |
| `data` | `MScript` | yes | Expression yielding the payload. An object's keys are spread into the frame's data beside `step` (with `message: ""`); a string becomes `message`. |

## Behaviour

The action evaluates `data`, then emits one progress frame carrying the event name, a message string and the data object, which is written as one SSE frame:

```text
event: progress
data: {"step":"<eventName>","message":"…", …data fields}
```

- If `data` is an object, its keys are spread into the frame (and `message` is `""`).
- If `data` is a string, it is the `message`.
- If the API is running in REST mode, emitting is a no-op.

A client listens for `progress` events and branches on `step`; an `EventSource` listener named after the `eventName` never fires.

The action does not return a value usable by downstream actions: `contextPropertyName` and `writeToResponse` are typically left unset.

## Example

Emit a structured progress event during a long-running import:

```json
"emitSseEventActions": [
  { "name": "started",      "writeToResponse": false, "eventName": "import.started",   "data": { "js": "({ total: this.rows.length })" } },
  { "name": "halfwayThere", "writeToResponse": false, "eventName": "import.progress",  "data": { "js": "({ done: this.imported, total: this.rows.length })" }, "condition": { "js": "this.imported * 2 >= this.rows.length" } },
  { "name": "finished",     "writeToResponse": false, "eventName": "import.completed", "data": { "js": "({ ok: this.imported, failed: this.failed })" } }
]
```

## See also

- [SSE streaming](../business-apis/sse-streaming.md)
- [`BusinessApiAction`](../../spec/BusinessApiAction.md): see `emitProgressInSSEContext`
- [`PublishEventAction`](./publish-event-action.md): message-bus events (not SSE)
- [`IteratorAction`](./iterator-action.md): async-iterable streaming
