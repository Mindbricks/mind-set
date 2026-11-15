# PropertyUploadSettings

**Level:** `section` · **Family:** [DataProperty](../ontology/families.md#dataproperty) (domain `DataObject`)

**Ontology:** [PropertyUploadSettings in Part 1](../ontology/PropertyUploadSettings.md)

Where the through-server upload of a RemoteBucket / NativeBucket takes a `{name}RemoteFile` twin column from. Only meaningful on an entry of `remoteBucketSettings.additionalColumns`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `fromUploadField` | `Boolean` | no | `false` |  |  | When true, the upload route reads the multipart text field named exactly like this column and writes its value into the twin row it creates, so a client that knows the value at upload time (a lifecycle status, the id of the record the file belongs to) needs no second update call. Only flagged columns are read from the multipart body; no other body field reaches the row, and the framework-owned base columns can never be flagged (their names are reserved). The value is checked against the column type before anything is stored: ID (a UUID or a 24-hex ObjectId), String (at most 255 characters), Text, Integer, Short, Double, Float, Decimal (a plain decimal number), Boolean (true / false), Date (an ISO 8601 date or date-time) or Enum (one of its enumOptions, exact spelling); a mismatch answers 400 UPLOAD_FIELD_INVALID naming the field, before the object is stored. An absent field leaves the column to its default. Array columns, Object / Geo / Blob types and columns whose value has another source (autoIncrement, sessionSettings, staticJoin, decisionSource) cannot be flagged (REMOTE_BUCKET_UPLOAD_FIELD_UNSUPPORTED); a column named `file` or `fileKey` cannot be flagged either, the route reads those multipart fields itself (REMOTE_BUCKET_UPLOAD_FIELD_NAME_RESERVED). The presigned `/upload-url` path writes no row and carries no fields. Implemented by the nodejs, java, dotnet, rust and python lanes; elsewhere the flag has no effect yet (REMOTE_BUCKET_UPLOAD_FIELD_NOT_IMPLEMENTED warning). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
