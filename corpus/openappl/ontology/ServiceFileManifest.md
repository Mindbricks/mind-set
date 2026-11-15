# ServiceFileManifest

**Level:** `section` · **Family:** [ServiceFiles](./families.md#servicefiles) (domain `Service`)

**Specification:** [ServiceFileManifest in Part 2](../spec/ServiceFileManifest.md)

The manifest of the service's files (section): the `files` list of `ServiceFile` entries. A path is unique within the service, compared case-insensitively and across both visibilities, so a macOS or Windows checkout never folds two files onto one.

## Contained in

- [ServiceFiles](./ServiceFiles.md) as `manifest`

Blueprint paths:

- `agentHub.serviceFiles.manifest`
- `services.serviceFiles.manifest`

## Contains

- `files`: [ServiceFile](./ServiceFile.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
