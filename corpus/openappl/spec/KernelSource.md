# KernelSource

**Level:** `subsection` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [KernelSource in Part 1](../ontology/KernelSource.md)

**Name:** an instance is named by `dest`.

A fetchable reference to one source file (or archive) of the existing native library a `NativeKernel` wraps. Designers work through the web and the AI agent, never a local filesystem, so source is never inlined — it is uploaded to the platform bucket (preferred) or hosted at a URL/git remote, and codegen downloads it into the service's `native/` folder at generation time. Use this only for libraries not available via a package manager; otherwise provision the library through the shared `serviceBasics.packages[]` and reference it via `links`/`includes`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `origin` | `KernelSourceOrigin` | yes |  | `bucket`, `url`, `git`, `inline` |  | Where the source is fetched from. `bucket` (preferred) resolves `ref` as a key in the project's platform bucket — the file/tarball the user or AI agent uploaded; it stays inside the platform trust boundary. `url` fetches `ref` over HTTPS. `git` clones the `ref` remote. `inline` carries the content directly in `ref` (only for tiny single-file headers). |
| `ref` | `Text` | yes |  |  |  | The locator, interpreted per `origin`: a bucket object key, an HTTPS URL, a git remote (optionally `#ref` for a tag/commit), or — when `origin` is `inline` — the literal file content. |
| `dest` | `String` | yes |  |  |  | Relative path under the generated service's `native/` folder where the fetched content is written (e.g. `existing_shipping.hpp`, or a directory like `vendor/` when `extract` is true). The kernel's `includes` and `shimBody` reference files by these paths. |
| `sha256` | `String` | no |  |  |  | Hex SHA-256 of the fetched bytes. Required for `url` and `git` origins — codegen verifies it after download and fails generation on mismatch, pinning the supply chain. Optional (but recommended) for `bucket`. |
| `extract` | `Boolean` | no | `false` |  |  | When true, `ref` points to an archive (`.tar.gz`/`.tgz`/`.zip`) that codegen extracts into `dest`. When false (default), the fetched bytes are written verbatim to `dest`. |

## Constraints

Property rules:

- `origin`, `ref`, `dest` must be present. (`REQUIRED_FIELD_MISSING`)
- `origin` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
