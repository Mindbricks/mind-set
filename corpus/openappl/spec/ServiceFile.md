# ServiceFile

**Level:** `subsection` · **Family:** [ServiceFiles](../ontology/families.md#servicefiles) (domain `Service`)

**Ontology:** [ServiceFile in Part 1](../ontology/ServiceFile.md)

One design-time service file: `{path, visibility, contentType, size, sha256}`. The path is the identity (there is no name). A public file is served at `/service-files/<path>`; a private file is readable only through `LIB.serviceFiles.*`. Every response of the public route carries `X-Content-Type-Options: nosniff` and a sandbox Content-Security-Policy: HTML and SVG render inline but inert, JavaScript and XML are always sent as an attachment. Unknown and private paths answer the same 404.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `path` | `String` | yes |  |  |  | Relative POSIX path of the file, also its URL tail and its place under `service-files/<visibility>/` in the repo, e.g. `legal/terms-v3.md`. Segments use letters, digits, `.`, `_` and `-`, joined by `/`; no leading `/`, no `.` or `..` segment, at most 200 characters and 10 levels (SERVICE_FILE_INVALID_PATH). Unique within the service, case-insensitively (SERVICE_FILE_DUPLICATE_PATH). REQUIRED. |
| `visibility` | `ServiceFileVisibility` | no | `"private"` | `public`, `private` |  | `public` serves the file at `GET <serviceBaseUrl>/service-files/<path>` (nodejs, dotnet and java services); `private` (the default) only puts it in the repo, where custom code and MScript read it through `LIB.serviceFiles.*`. A private file that no `LIB.serviceFiles.*('<path>')` call names is reported (SERVICE_FILE_PRIVATE_UNREAD, warning). Private is not secret: anyone who can read the repo can read the file. |
| `contentType` | `String` | yes |  |  |  | MIME type of the file, `type/subtype` with optional parameters (e.g. `text/markdown; charset=utf-8`), sent as the Content-Type of the public route (SERVICE_FILE_INVALID_CONTENT_TYPE). REQUIRED. |
| `size` | `Integer` | yes |  |  |  | Size of the file in bytes: an integer of at least 0 and at most 10 MB, 10485760 (SERVICE_FILE_INVALID_SIZE, SERVICE_FILE_TOO_LARGE). The sum over every service of the project is at most 100 MB, 104857600 (SERVICE_FILES_PROJECT_QUOTA_EXCEEDED). Set by the upload tool, verified again at build. REQUIRED. |
| `sha256` | `String` | yes |  |  |  | sha256 of the bytes, 64 lowercase hex characters (SERVICE_FILE_INVALID_SHA256). Computed by the upload tool; the build refuses bytes whose hash differs. REQUIRED. |

## Constraints

Property rules:

- `path`, `contentType`, `size`, `sha256` must be present. (`REQUIRED_FIELD_MISSING`)
- `visibility` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
