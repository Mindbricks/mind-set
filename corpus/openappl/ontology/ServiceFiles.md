# ServiceFiles

**Level:** `chapter` · **Family:** [ServiceFiles](./families.md#servicefiles) (domain `Service`)

**Specification:** [ServiceFiles in Part 2](../spec/ServiceFiles.md)

The service's design-time static files (`service.serviceFiles`): a chapter holding one `manifest` section that lists every file the service carries. The bytes are not in the blueprint: the manifest names each file by path and pins it by size and sha256, and the build fetches the bytes from the platform bucket (a missing or mismatched file fails the build and names every bad path). Upload, list, read and delete files with the `uploadServiceFile`, `listServiceFiles`, `getServiceFile` and `deleteServiceFile` tools rather than editing entries by hand: only the upload tool computes the hash, enforces the limits and refuses a file that carries a secret.

## Contained in

- [AgentHubConfig](./AgentHubConfig.md) as `serviceFiles`
- [Service](./Service.md) as `serviceFiles`

Blueprint paths:

- `agentHub.serviceFiles`
- `services.serviceFiles`

## Contains

- `manifest`: [ServiceFileManifest](./ServiceFileManifest.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
