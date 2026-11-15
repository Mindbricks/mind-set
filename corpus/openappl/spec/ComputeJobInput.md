# ComputeJobInput

**Level:** `section` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [ComputeJobInput in Part 1](../ontology/ComputeJobInput.md)

Declares a ComputeJob's input source. Large inputs cross the submit boundary as bucket references (`type: bucketRef`), never inline blobs (§10). `schema` names the DataObject the input conforms to.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `type` | `String` | no |  |  |  | How the input is delivered to the worker. `bucketRef` (a RemoteBucket/DbBucket object key — the default for large inputs), `inline` (small serializable payloads only), or `dataObjectQuery` (a query over the service's own data). Kept as String in v1. |
| `schema` | [`DataObjectName`](./DataObjectName.md) | no |  |  | names a [DataObject](./DataObject.md) | Name of the DataObject the input rows/records conform to (DataObjectName). |

## Constraints

Property rules:

- `schema` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
