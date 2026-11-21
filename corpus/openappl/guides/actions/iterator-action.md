---
title: IteratorAction
---

# IteratorAction

Generic streaming primitive. `sourceScript` evaluates to an async iterable (an async generator, a readable stream, anything that can be iterated asynchronously) and the action yields its items. It is also the way to stream LLM tokens: wrap the provider's token stream in a service-library async generator and iterate it here ([`AiCallAction`](./ai-call-action.md) returns the whole completion).

The action is a generator: the workflow consumes it item by item at the milestone that lists it. On an API running over SSE each yielded item is written to the stream as a `chunk` frame; otherwise the items are collected into the action's result slot.

## When to use it

- Surface a custom server-side feed (log tail, build steps, image-generation frames) to an SSE client.
- Bridge a third-party SDK's async-iterable response into the streaming pipeline.
- Wrap a library function that produces results incrementally (an async generator) without writing low-level SSE plumbing.
- For one-shot LLM completions use [`AiCallAction`](./ai-call-action.md). For sending arbitrary mid-workflow SSE `progress` frames use [`EmitSseEventAction`](./emit-sse-event-action.md).

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `sourceScript` | `MScript` | yes | Expression that evaluates to an async iterable (or sync iterable, or a single value). |

## Behaviour

At runtime the action:

1. Evaluates `sourceScript`. A null source returns immediately (no events).
2. If the source is an async iterable, awaits each item and yields it.
3. If the source is a sync iterable (e.g. a plain array), iterates synchronously and yields each item.
4. Otherwise yields the source itself as a single value.

The workflow stage that runs the action consumes it:

- **Over SSE** (an output channel is open), every yielded item is written as one `chunk` frame whose `data` is the item. Nothing is stored on the context.
- **Otherwise** (REST, Kafka, cron), the items are collected: when every item is a string (or a byte buffer) they are joined into one string, a single item is kept as itself, and several items become an array. The value lands on `this.<contextPropertyName>`, or `this.<name>` when no `contextPropertyName` is set.

`sseSettings.streamSource` is not read by the SSE route; the action streams from the workflow milestone that lists it.

## Example

Define an iterator that wraps a service-library async generator and stream its values via SSE, after the main operation of a `stream`-mode API:

```json
"actions": {
  "iteratorActions": [
    {
      "name": "tailJobLog",
      "writeToResponse": false,
      "sourceScript": { "js": "LIB.tailJobLog(this.jobId, { fromCursor: this.fromCursor })" }
    }
  ]
},
"workflow": {
  "get": { "afterMainGetOperation": ["tailJobLog"] }
}
```

The downstream client opens the API as SSE and receives one `chunk` event per log line, after the `meta` frame and the record's own chunk.

Inline with another workflow:

```json
{
  "name": "frames",
  "writeToResponse": false,
  "contextPropertyName": "frameStream",
  "sourceScript": { "js": "LIB.renderFrames(this.scene, { fps: 24 })" }
}
```

## Errors

- A `sourceScript` that resolves to something that is neither an async iterable nor a sync iterable is yielded as a single value: useful as a fallback, but if the caller expects a stream, ensure the underlying source produces an iterable.
- Errors thrown from the underlying iterable propagate to the SSE consumer; the connection closes with an error event.

## See also

- [`AiCallAction`](./ai-call-action.md): single-shot LLM call
- [`AgentCallAction`](./agent-call-action.md): agent invocation
- [`EmitSseEventAction`](./emit-sse-event-action.md): ad-hoc SSE events
- [SSE streaming](../business-apis/sse-streaming.md)
