# GraphQueryAction

Run a named or inline parameterized Cypher query against a declared graph provider. The context value is `{ records, total, ok, status }`. Check `ok` before using a result. `status: unavailable` or `status: error` represents a failed query, distinct from an executed query with zero records.

See the [pattern reference](../../spec/GraphQueryAction.md) and the [graph layer guide](../capabilities/graph-layer.md).
