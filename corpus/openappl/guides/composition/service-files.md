---
title: Service files
---

# Service files

A **service file** is a file you upload once, at design time, and that then
ships with one service: an agreement text, a JSON rate table, a logo, an
e-mail template, a sample CSV. You do not write a DataObject, a bucket or an
upload API for it. The file rides in the generated service's source, so
every runner of the service has it without a network call.

Each file is either:

- **public**: served by the service at `/service-files/<path>`, and also
  readable by the service's own code; or
- **private** (the default): readable only by the service's own code, through
  `LIB.serviceFiles`. No route serves it.

> **A private file is NOT secret.** It is committed to the service's source
> and copied into every image built from it. Anyone who can read that source
> can read it, and so can anyone with access to a deployed image or to the
> blueprint's hosting platform. "Private" only means "no public URL". Never put
> a credential, an API key, a token or a password in a service file: use
> secret custom variables or provider secrets for those. The upload refuses
> text that looks like a credential, but that scan is a safety net, not a
> guarantee.

## The manifest

The blueprint records one manifest entry per file under the service's
[`serviceFiles`](../../spec/ServiceFiles.md) chapter, at
`services/<service>/serviceFiles/manifest`:

```json
{
  "serviceFiles": {
    "manifest": {
      "files": [
        {
          "path": "legal/terms-v3.md",
          "visibility": "public",
          "contentType": "text/markdown",
          "size": 18342,
          "sha256": "<64 lowercase hex characters>"
        }
      ]
    }
  }
}
```

| Field | Rule |
|---|---|
| `path` | Relative POSIX path. Segments of letters, digits, `.`, `_` and `-`, joined by `/`. No leading `/`, no `.` or `..` segment, at most 200 characters and 10 levels deep. Unique per service, compared case-insensitively, across both visibilities. |
| `visibility` | `public` or `private`. Unset means `private`. |
| `contentType` | A MIME type, for example `text/markdown` or `application/json`. Parameters such as `; charset=utf-8` are allowed. |
| `size` | The byte count, an integer of 0 or more. |
| `sha256` | The sha256 of the bytes, 64 lowercase hex characters. |

Do not write these entries by hand. The hosting platform's upload operation
computes the size and the hash from the bytes and writes the entry for you; a
hand-written entry whose bytes were never uploaded fails the next build. See
[`ServiceFile`](../../spec/ServiceFile.md) and
[`ServiceFileManifest`](../../spec/ServiceFileManifest.md) for the pattern
reference.

A service named `agentHub` stands for the agent hub's own files
(`agentHub.serviceFiles`), which hold the [AgentHarness](agent-harness.md)
assets.

## Uploading, replacing and deleting

The hosting platform stores the bytes (the blueprint carries only the
manifest) and offers operations to upload, list, read, delete and copy service
files. The rules those operations apply are part of the contract:

- A new file is `private` unless the upload asks for `visibility: "public"`.
- Uploading to an existing path replaces the file and keeps its visibility.
  Passing a different visibility for an existing path is refused: delete the
  file, then upload it again.
- A path that differs from an existing one only in letter case is refused.
- A path that is another file's folder, or the reverse, in the same
  visibility (`docs` and `docs/a.md`) is refused with
  `SERVICE_FILE_PATH_CONFLICT`: the source tree cannot hold a file and a
  folder under one name.
- Uploading the same bytes again changes nothing and writes nothing.
- When `contentType` is omitted, it is inferred from the file extension, or
  `application/octet-stream` when the extension is unknown.
- Textual content is scanned for credentials: any `text/*` type, JSON, XML,
  YAML, SVG, HTML and JavaScript; UTF-16 text that starts with a byte-order
  mark (a Windows "Unicode" text file), whatever its declared type; any other
  bytes that are valid UTF-8 without a NUL byte; and UTF-8 text with only a
  few stray bytes (a NUL, a lone `0xFF`), unless the declared type is a
  binary format such as an image, a font or a PDF. A hit is refused with
  `SECRET_IN_SERVICE_FILE`, naming the kind of credential and the line, never
  the value. A binary file such as a PNG is not scanned.
- Deleting a file removes the manifest entry. The stored object is kept,
  because older blueprint versions still point at it.

### Copying or importing a project

The blueprint carries only the manifest. The bytes are stored per project, so
a project made by copying or importing another one has the manifest entries
but not the files, and its builds fail with a "missing from the platform
store" error until the bytes are copied across too. A conforming platform
copies every object the SOURCE project's manifest names into the target
project and checks each copy's size and sha256 against the manifest. It only
reads from the source project, so an entry whose bytes are not found there is
reported `missing` and has to be uploaded again in the target. It writes no
blueprint: a manifest entry names a sha256, not a project, so the target's
entries find the copied bytes as they are. A copy is refused with
`SERVICE_FILE_COPY_LIMIT_EXCEEDED` (HTTP 413) before anything is copied when a
manifest names more than 2000 distinct objects or the source objects add up to
more than 100 MB.

### Size limits

| Limit | Value |
|---|---|
| One file | 10 MB (10485760 bytes) |
| All service files of a project together | 100 MB (104857600 bytes) |

A replacement counts its new size, not old plus new. An over-limit upload is
refused with `SERVICE_FILE_TOO_LARGE` or
`SERVICE_FILES_PROJECT_QUOTA_EXCEEDED`, and the same limits are checked again
when the blueprint is validated.

## A file reaches the service through a rebuild and a deploy

Uploading changes the blueprint and the platform's store of file bytes, not a
running service. The next build fetches every file of the service from that
store, checks its size and sha256 against the manifest, and places it in the
service's source under a `public` or `private` folder by visibility, at its
manifest path.

A file that is missing from the store, or whose bytes no longer match the
manifest, stops the build before anything is written, and the error names
every such path. So after uploading or replacing a file, **rebuild the
service and deploy it**. Until then the running service keeps serving and
reading the previous version. For the layout the compiler produces, see
[the compiler specification](../../compiler/index.md).

## Public files: `/service-files/<path>`

A public file is served by its own service at:

```
GET  <service base URL>/service-files/<path>
HEAD <service base URL>/service-files/<path>
```

For example, a public `legal/terms-v3.md` on a service whose route is
`legal-api` is served at
`https://<host>/legal-api/service-files/legal/terms-v3.md`.

- The route looks the path up in the manifest only. An unknown path and a
  private path get the same `404` with the same body, so the route never
  reveals which private files exist. There is no directory listing.
- The response carries `Content-Type` (the declared type),
  `Content-Length`, `ETag: "<sha256>"` (a matching `If-None-Match` answers
  `304`), `Cache-Control: public, max-age=3600` and
  `X-Content-Type-Options: nosniff`.
- **Every** response of the route, the `404` included, carries
  `Content-Security-Policy: default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox`.

**Active types.** HTML (`text/html`, `application/xhtml+xml`) and SVG
(`image/svg+xml`) are served inline, so an agreement page stays viewable in a
browser, but the `sandbox` policy keeps them inert: no script runs, and the
page cannot reach the service's origin. JavaScript (`text/javascript`,
`application/javascript`, `application/ecmascript` and the legacy names a
browser also runs as script, such as `application/x-javascript`,
`text/ecmascript` and `text/jscript`) and XML (`text/xml`, `application/xml`
and every `+xml` type such as `application/rss+xml`, except SVG and XHTML)
are always sent with `Content-Disposition: attachment`, so the browser
downloads them instead of running or rendering them. Do not plan
on hosting a script for a frontend here.

If a file listed in the manifest is missing or altered on the running
service, its URL answers `500` with `SERVICE_FILE_UNAVAILABLE` and the bytes
are never served.

## Reading files in the service: `LIB.serviceFiles`

The service's own code reads every file, public or private, through the
synchronous `LIB.serviceFiles` accessor. The path argument is the manifest
`path`:

| Call | Returns |
|---|---|
| `LIB.serviceFiles.text(path)` | The bytes decoded as UTF-8. |
| `LIB.serviceFiles.json(path)` | The parsed JSON, a fresh copy on every call. |
| `LIB.serviceFiles.bytes(path)` | A copy of the bytes. |
| `LIB.serviceFiles.info(path)` | `{ path, visibility, contentType, size, sha256 }`. |
| `LIB.serviceFiles.has(path)` | Whether the manifest lists the path. |

The calls are synchronous because the files are local: do not `await` them.
The first read of a file checks its size and sha256 against the manifest and
caches the bytes. An unlisted path throws `ServiceFileNotFoundError`; a
missing or altered file throws `ServiceFileIntegrityError`. Each call returns
a value the caller owns, so changing it never changes what the next caller
reads.

### Example: put an agreement text into the API response

An [`AddToContextAction`](../../spec/AddToContextAction.md) loads the file
into the API context, and a later action or the response reads it from there:

```json
{
  "name": "loadTerms",
  "writeToResponse": false,
  "context": [
    { "contextName": "terms", "contextValue": { "js": "LIB.serviceFiles.text('legal/terms-v3.md')" } },
    { "contextName": "rates", "contextValue": { "js": "LIB.serviceFiles.json('data/rates.json')" } }
  ]
}
```

`this.terms` and `this.rates` are then available to the actions that follow.
Who may see them is decided by the API's own authentication and
authorization, exactly as for any other value: a private file read into a
public API's response is public from then on.

### What validation checks

| Code | Level | When |
|---|---|---|
| `LIB_SERVICE_FILE_UNKNOWN` | error | A literal `LIB.serviceFiles.<method>('<path>')` names a path the service's manifest does not list (with a did-you-mean on a letter-case difference), names a method that does not exist, or the service has no files at all. |
| `LIB_SERVICE_FILE_DYNAMIC_PATH` | warning | The path is not a literal, so validation cannot check it. |
| `SERVICE_FILE_PRIVATE_UNREAD` | warning | A private file is never read by a literal `LIB.serviceFiles` call anywhere in the service. A dynamic-path call in the service turns this warning off. |
| `SERVICE_FILE_INVALID_PATH`, `SERVICE_FILE_DUPLICATE_PATH`, `SERVICE_FILE_INVALID_SHA256`, `SERVICE_FILE_INVALID_SIZE`, `SERVICE_FILE_INVALID_CONTENT_TYPE`, `SERVICE_FILE_TOO_LARGE` | error | A manifest entry breaks the field rules above. |
| `SERVICE_FILE_PATH_CONFLICT` | error | One path is another's folder in the same visibility (`docs` and `docs/a.md`, compared case-insensitively). |
| `SERVICE_FILES_PROJECT_QUOTA_EXCEEDED` | error | All service files of the project add up to more than 100 MB. |
| `SERVICE_FILES_LANGUAGE_NOT_PORTED` | warning | The service's target language does not implement the public route and the accessor. |

## Target languages

The build places the files in the source of every service, whatever its
language. The public route and the `LIB.serviceFiles` accessor are generated
only for the target languages that implement them. A service in another
language gets the files and a `SERVICE_FILES_LANGUAGE_NOT_PORTED` warning, but
no route and no accessor. See [the compiler specification](../../compiler/index.md).

## See also

- [AgentHarness](agent-harness.md): harness skills, documents and scripts are
  service files of the agent hub.
- Patterns: [`ServiceFiles`](../../spec/ServiceFiles.md),
  [`ServiceFileManifest`](../../spec/ServiceFileManifest.md),
  [`ServiceFile`](../../spec/ServiceFile.md).
