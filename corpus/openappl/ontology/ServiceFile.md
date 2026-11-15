# ServiceFile

**Level:** `subsection` · **Family:** [ServiceFiles](./families.md#servicefiles) (domain `Service`)

**Specification:** [ServiceFile in Part 2](../spec/ServiceFile.md)

One design-time service file: `{path, visibility, contentType, size, sha256}`. The path is the identity (there is no name). A public file is served at `/service-files/<path>`; a private file is readable only through `LIB.serviceFiles.*`. Every response of the public route carries `X-Content-Type-Options: nosniff` and a sandbox Content-Security-Policy: HTML and SVG render inline but inert, JavaScript and XML are always sent as an attachment. Unknown and private paths answer the same 404.

## Contained in

- [ServiceFileManifest](./ServiceFileManifest.md) as `files` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
