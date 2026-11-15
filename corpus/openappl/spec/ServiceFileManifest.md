# ServiceFileManifest

**Level:** `section` · **Family:** [ServiceFiles](../ontology/families.md#servicefiles) (domain `Service`)

**Ontology:** [ServiceFileManifest in Part 1](../ontology/ServiceFileManifest.md)

The manifest of the service's files (section): the `files` list of `ServiceFile` entries. A path is unique within the service, compared case-insensitively and across both visibilities, so a macOS or Windows checkout never folds two files onto one.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `files` | [`ServiceFile`](./ServiceFile.md)[] | no |  |  |  | The service's files (ServiceFile[]). Each entry is `{path, visibility, contentType, size, sha256}`; the path is the identity. Written by `uploadServiceFile` and removed by `deleteServiceFile` (which keeps the stored bytes, because older blueprint versions still reference them). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
