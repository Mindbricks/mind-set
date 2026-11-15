# ServiceFiles

**Level:** `chapter` · **Family:** [ServiceFiles](../ontology/families.md#servicefiles) (domain `Service`)

**Ontology:** [ServiceFiles in Part 1](../ontology/ServiceFiles.md)

The service's design-time static files (`service.serviceFiles`): a chapter holding one `manifest` section that lists every file the service carries. The bytes are not in the blueprint: the manifest names each file by path and pins it by size and sha256, and the build fetches the bytes from the platform bucket (a missing or mismatched file fails the build and names every bad path). Upload, list, read and delete files with the `uploadServiceFile`, `listServiceFiles`, `getServiceFile` and `deleteServiceFile` tools rather than editing entries by hand: only the upload tool computes the hash, enforces the limits and refuses a file that carries a secret.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `manifest` | [`ServiceFileManifest`](./ServiceFileManifest.md) | yes |  |  |  | The file list (ServiceFileManifest): one `files` entry per file the service carries. |

## Constraints

Property rules:

- `manifest` must be present. (`REQUIRED_FIELD_MISSING`)
