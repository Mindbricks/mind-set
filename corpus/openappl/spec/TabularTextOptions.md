# TabularTextOptions

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [TabularTextOptions in Part 1](../ontology/TabularTextOptions.md)

Serializer options for the text formats of a ROWS mode export.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `delimiter` | `String` | no |  |  |  | csv: the field delimiter, `,` by default; `;` is what a Turkish / German Excel expects. |
| `includeHeader` | `Boolean` | no | `true` |  |  | csv / tsv: write the header row. Default true. |
| `bom` | `Boolean` | no | `false` |  |  | csv / tsv / json / ndjson: prefix the file with a UTF-8 byte order mark. Excel needs it to read non-ASCII text in a csv correctly. Default false. |
| `jsonWrapper` | `String` | no |  |  |  | json: wrap the array in an object under this key, e.g. `data` gives `{ "data": [ ... ] }`. Empty writes the bare array. |
| `pretty` | `Boolean` | no | `true` |  |  | json: indent the output. Default true. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
