# GetOptions

**Level:** `section` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [GetOptions in Part 1](../ontology/GetOptions.md)

Options specific to `get`-type Business APIs for customizing how a single record is fetched.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `setAsRead` | [`DataMapItem`](./DataMapItem.md)[] | no |  |  |  | RETIRED — leave this empty. The post-read write it describes was never emitted by any lane; the declaration validated and did nothing. A NON-EMPTY value is now refused at design time (RETIRED_LIST_SETTING) rather than silently ignored; an empty array stays legal because it asks for nothing. Declare an `update` BusinessApi and call it after the read, so the mutation carries its own auth, its own contract and its own errors. |

## Constraints

Property rules:

- The items of `setAsRead` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
