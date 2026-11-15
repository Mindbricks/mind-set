---
title: DB buckets
---

# DB buckets

A [`DbBucket`](../../spec/DbBucket.md) is a database-backed file bucket. Bytes live in the service's own database (a `BYTEA` column in PostgreSQL or a `Buffer` field in MongoDB) and file metadata sits beside them on a generated data object. Use db buckets for small files (icons, avatars, signed PDFs, secret documents) where transactional consistency with the rest of the row matters more than CDN reach.

There is no separate "database bucket service". Each bucket lives as a chapter on the owning [`Service`](../../spec/Service.md) and its upload / download routes are emitted directly into that service.

For large files, video, regional placement, or provider-side lifecycle policies, use a [remote bucket](remote-buckets.md) instead.

## When to pick `DbBucket` over `RemoteBucket`

The declaring bucket's `{name}File.content` bytes stay in the database and HTTP response. Database events, search documents, and business API route events (when `raiseApiEvent` is enabled) omit `content`, including list items and the previous row in `old`. Other metadata remains available to subscribers.

- Small files (under ~10 MB).
- Strict transactional consistency: the file must exist if and only if the surrounding row exists, with no eventual-consistency window.
- Simple deploy: no cloud-provider credentials, no S3 bucket creation, no CDN setup.
- Air-gapped or on-premise environments where remote object storage is undesirable.

Avoid `DbBucket` for media, large documents, or any workload where the byte volume dwarfs the size of the row data. Storing bytes inline is heavier than indexed scalar columns in both engines: large `BYTEA` values (Postgres) or `Buffer` fields (MongoDB, subject to the 16 MB BSON document limit) bloat backups and slow row updates.

## Declaring a db bucket

A db bucket is declared under `services[].dbBuckets[]`:

```json
{
  "dbBuckets": [
    {
      "bucketBasics": {
        "name":             "userAvatar",
        "description":      "Per-user profile photo (small).",
        "maxFileSizeMb":    2,
        "allowedMimeTypes": "image/png,image/jpeg",
        "virusScan":        false
      },
      "bucketAuthorization": {
        "readAccess":  "public",
        "writeAccess": "authenticated"
      },
      "ownerDataObject": {
        "hasOwnerDataObject": true,
        "configuration": { "dataObjectName": "user" }
      }
    }
  ]
}
```

## Sub-blocks

A db bucket has two required sub-blocks and one optional one.

### `bucketBasics` ([`DbBucketBasics`](../../spec/DbBucketBasics.md))

| Field | Required | Notes |
|-------|----------|-------|
| `name` | ✓ | Unique within the service. Drives the route prefix (`/bucket/{name}/`), the metadata table name (`{name}File`), and API names. Must be a valid codeName. |
| `description` | ✓ | Human-readable purpose. |
| `maxFileSizeMb` |  | Hard upload cap. Default 10 MB. |
| `allowedMimeTypes` |  | Comma-separated MIME whitelist. An entry is an exact `type/subtype`, a family wildcard `type/*` (`image/*` accepts every image subtype) or `*/*`; matching is case-insensitive and ignores `;` parameters. Any other shape fails generation naming the bucket and the entry. The service additionally sniffs the file's magic bytes: a client-spoofed `Content-Type` is rejected when the sniffed type doesn't match. Null means allow any type. |
| `virusScan` |  | When true, every file is ClamAV-scanned before the file row is created, on EVERY path that creates one, not only the upload route. See [Where the scan runs](#where-the-scan-runs). Auto-promoted to true when `readAccess: 'public'`. The `virusScanStatus` column on the generated `{name}File` data object records the outcome (`clean`, `infected`, `quarantined`, `error`, or `skipped`) and is written by the guard, not by the caller. |
| `virusScanMode` |  | `block` (nothing persisted; 422 on the upload route, a thrown 422/503 at the row-creation seam) or `quarantine` (row persisted with `virusScanStatus='quarantined'`, downloads refused). Falls back to `projectSettings.clamAvSettings.configuration.defaultMode` (default `block`). See [Scan-mode precedence](#scan-mode-precedence). |

### `bucketAuthorization` ([`DbBucketAuthorization`](../../spec/DbBucketAuthorization.md))

Same shape as [`RemoteBucketAuthorization`](../../spec/RemoteBucketAuthorization.md):

| Field | Notes |
|-------|-------|
| `readAccess` | `public` (anyone, optionally via access key), `private` (owner + admins; default), `authenticated` (any signed-in user), `roles` (holders of a `readCheckRoles` role). |
| `writeAccess` | `authenticated` (default), `adminOnly`, or `roles` (holders of a `writeCheckRoles` role). There is no `public` write level. Governs upload only. |
| `deleteAccess` | `owner` (default: the account that uploaded the file, plus admin roles), `adminOnly`, or `authenticated` (any authenticated user may delete any file; keep it only as a deliberate choice). |
| `enableKeyAccess` | When true, a 12-character random `accessKey` issued at upload time grants read access regardless of `readAccess`. A separate runtime [share route](#share-routes-shareable-access-key-links) can also mint a signed, time-limited shareable link for an already-uploaded file. |
| `readAbsoluteRoles` / `writeAbsoluteRoles` | Roles that bypass all checks. |
| `readCheckRoles` / `writeCheckRoles` | Roles required for read / write when `readAccess` / `writeAccess` is `roles`. Every name in the four role lists must be a defined role (a system role, a `roleItems` name or value, or a `customRoleLookups` name): an undefined one is the warning `UNDEFINED_BUCKET_GATE_ROLE`, and a check list in force (`roles` mode) whose every name is undefined, with no defined role in the matching absolute list, is that code as an error, because the bucket then admits no defined-role session. A business membership accessLevel (for example `businessAdmin`) is not a session role. |
| `readAuthScript` / `writeAuthScript` | MScript expressions evaluated against the request context. Must return `true` to permit. On a read (`/download`, `/object`, `/share-url`) `readAuthScript` runs after the file-row lookup and sees the row as `data`; a key that resolves to no row is answered as missing (`404`) without running the script, and a denial answers `404 NOT_FOUND`, the same as a missing file. |

**Admin roles.** The "admins" of `private` reads, of `adminOnly` uploads and deletes, and of the owner-delete allowance are the project's platform operator roles: `superAdmin` and `saasAdmin` on a multi-tenant project (`admin` is not a role there, and a tenant administrator such as `tenantAdmin` is not admitted), `superAdmin`, `admin` and `saasAdmin` on a single-tenant project. `readAbsoluteRoles` / `writeAbsoluteRoles` widen a bucket for other roles deliberately.

### `ownerDataObject` (optional, [`DbBucketOwnerConfig`](../../spec/DbBucketOwnerConfig.md))

When set, every file row carries an FK to the named data object. Enables "list files for this user" / "delete this user, cascade their files". Set `hasOwnerDataObject: true` and configure `configuration.dataObjectName` plus an optional `relationProperty` (defaults to `<dataObjectName>Id`). `configuration.downloadRequiresActiveOwner` is described under [Remote buckets](remote-buckets.md) (section `ownerDataObject`) and applies to db buckets too.

## What the generated service provides per bucket

- **A metadata data object** named `{bucketName}File`, injected from the bucket declaration (see [Generated `{name}File` data object](#generated-namefile-data-object) below). The bucket router reads and writes rows through the object's data-layer create / get-by-id / delete-by-id functions.

- **Seven routes under `/bucket/{bucketName}/`** mounted into the owning service's bucket router:

  | Route | Purpose |
  |-------|---------|
  | `POST /bucket/{name}/upload-url` | Mint a short-lived JWT-stamped self-URL pointing back at `/upload`. Lets client code share the same two-step shape as `RemoteBucket` (request URL, then PUT/POST to it). |
  | `POST /bucket/{name}/upload` | Multipart upload. Bytes go straight into the row's `content` column. Honours `maxFileSizeMb`, `allowedMimeTypes` (whitelist + [magic-byte sniff](#magic-byte-mime-sniffing)), and `ownerDataObject` (FK enforcement). If the request carries a valid `?token=...` from `/upload-url` it bypasses the write gate; with no token the gate runs normally; a token that is PRESENT but does not verify is refused with `401 UPLOAD_TOKEN_INVALID` rather than re-judged as a token-less request. The row's `accessKey` is minted server-side either way: this route reads no `?key=`. |
  | `GET /bucket/{name}/download/:id`, `GET /bucket/{name}/download/key/:accessKey` | Stream the bytes back, by the file row's `id` or by its opaque `accessKey`; the payload lives in the `content` column. Sets `Content-Type`, `Content-Length`, and `Content-Disposition: attachment; filename="..."; filename*=UTF-8''...` (see **Filename encoding** below). There is no third-party hop: bytes live in this database. |
  | `POST /bucket/{name}/share-url/:key` | Mint a signed, time-limited [shareable link](#share-routes-shareable-access-key-links) for the file at `:key`. Requires normal read auth; returns a `/shared` URL that needs no session. |
  | `GET /bucket/{name}/shared/:key?token=...` | Access-key download. Verifies the signed `?token=` (scoped to this bucket + key) and streams the bytes **without a session**. The session-less read path that a `/share-url` link points at. |
  | `GET /bucket/{name}/object/:key` | Metadata-only sibling. Strips the `content` column and returns the rest of the row. Use when paginating a file table UI without dragging bytes over the wire. |
  | `DELETE /bucket/{name}/:key` | Hard-delete the row; the byte column vanishes with it. |

  A DbBucket `:key` is the file's opaque `accessKey` or its row `id`; neither ever contains `/`, so every DbBucket key route takes exactly one path segment (unlike the RemoteBucket storage-key routes, which also accept a key with plain slashes). Send it as `encodeURIComponent(key)` like any key; a key with an empty, `.` or `..` segment, a backslash or a NUL character answers `400 BUCKET_OBJECT_KEY_INVALID`.

## Generated `{name}File` data object

The `{bucketName}File` data object is injected whenever a service declares a `dbBuckets[]` entry. You do not declare it by hand. A user-authored data object of the same name takes precedence: declare it explicitly only when you need a non-standard column shape, knowing the router's reads and writes target the injected column names.

Properties of the injected data object:

| Column | Type | Notes |
|--------|------|-------|
| `id` | `ID` | UUID PK (added on every data object). |
| `originalName` | `String` | Client-supplied filename from the multipart upload, read as UTF-8, so a Turkish or French name is stored as sent. May be empty for stream uploads. |
| `storedName` | `String` | Server-generated 12-character access key. Unique, indexed in DB, secondary key. |
| `contentType` | `String` (required) | MIME type after magic-byte sniff. Defaults to `application/octet-stream`. |
| `sizeBytes` | `Integer` (required) | Byte length recorded at upload time. |
| `content` | `Binary` | Raw bytes (BYTEA in PostgreSQL, BLOB in MySQL, Buffer in MongoDB). |
| `uploadedAt` | `Date` (required) | Server timestamp when the row was inserted. |
| `uploaderUserId` | `ID` | `session.userId` at upload time (or the JWT-bound id when the upload uses `/upload-url`). Session-stamped, owner field, indexed. |
| `virusScanStatus` | `String` | `clean` / `infected` / `quarantined` / `error` / `skipped`. Indexed and filterable. Defaults to `skipped`. |
| `{owner}Id` | `ID` | Only when `ownerDataObject.hasOwnerDataObject: true`. Named `<dataObjectName>Id` (or `ownerDataObject.configuration.relationProperty`). `belongsTo` the owner data object with `onDelete: cascade`. Indexed, secondary key. |

The data object is private (`dataObjectAccess: accessPrivate`), tenant-scoped (`objectDataIsInTenantLevel: true`), and uses soft delete (`useSoftDelete: true`).

> Legacy column names (`fileName`, `mimeType`, `fileSize`, `fileData`) are still tolerated by the download path, so author-written data objects that predate the injected shape keep working. New designs should rely on the injection and use the names in the table above.

## Upload-token signing

`/upload-url` returns a JWT signed with HS256 over `BUCKET_TOKEN_SECRET`, the bucket router's own signing key (see [The signing key](#the-bucket-signing-key) below). The token carries `{ bucket: '<name>', userId, key, scope: 'upload', svc }` (plus `tenant` on a multi-tenant project); `/upload` re-verifies it, uses the embedded `userId` when stamping the row, and takes the row's `accessKey` from the `key` claim. Tokens are short-lived (default 5 minutes) and rebinding to a different bucket name fails verification.

**What the token is for, and whose it is.** Two claims bind it:

- `scope: 'upload'`. The share token (below) is signed with the same key and also names a bucket and a key. `/upload` requires exactly `scope: 'upload'`, and `/shared` requires exactly `scope: 'download'`, so a share link (a read grant, handed to people outside the tenant, 7-day TTL) cannot be replayed as an upload token to write into the bucket past its write gate, and an upload token is not a share link.
- `svc`: the minting service's identity, `SERVICE_CODENAME` (every generated env file carries it; the codename baked at build time is the fallback). A DbBucket name is unique only inside one service, so two services of one project can each declare a bucket called `files`. Both tokens carry `svc` and both verifiers require an exact match, so a token minted behind service A's write gate is refused by service B's same-named bucket (`401 UPLOAD_TOKEN_INVALID` on `/upload`, `401 INVALID_SHARE_TOKEN` on `/shared`) even where the two services were deployed with the same signing key.

A token without these claims (minted before they existed) is refused; there is no grace window. After an upgrade, clients request new upload URLs and share links.

### The access key is minted server-side

The `accessKey` a DbBucket row is addressed by (`/bucket/{name}/download/key/{accessKey}`) is generated by the server on every path, and the caller has no say in it:

- `/upload-url` mints it, signs it into the token as the `key` claim, and reports it in the response (`key`, and the ready-made `downloadUrl`). The `uploadUrl` it hands back carries only `?token=...`; there is no `&key=` in it, so there is nothing in the URL to edit.
- `/upload` reads the key from the VERIFIED claim only. A `?key=` appended to the request is ignored: not honoured, and not refused.
- An upload with no token at all (a plain authorised multipart POST) gets a fresh random key.

**URL base.** The `uploadUrl`, the `downloadUrl` stored in your columns and the share link are built on `SERVICE_URL`. When it is unset, a local run (`CONFIG_ENV=dev`) uses the request's host; every other slot records a service-relative URL (`/bucket/{name}/...`) and logs `BucketSelfUrlRelative` once, so a URL that other users later load never takes its origin from a request's `Host` header.

Letting the caller choose the key would make the endpoint an oracle. Because the `accessKey` column carries a real unique index, a caller-chosen key that already belonged to another owner's row would be REFUSED while a free one was accepted, so the endpoint would answer "does this access key exist" one guess at a time, across owners. Signing the key removes the caller from the decision instead of validating what it sends.

A verified token whose `key` claim is blank gets a fresh random key; such a caller reads `key` / `downloadUrl` off the `/upload` response.

`/upload` does NOT skip the write gate when no token is sent: it falls back to the ordinary write authorisation. A token that IS sent but does not verify (bad signature, expired, minted for another bucket or another service, or a share token) is refused with `401 UPLOAD_TOKEN_INVALID` and a reissue hint: it is not treated as token absence, so a session that would otherwise pass the write gate cannot silently upload unbound with a broken token, and the oversize-body guard answers such a request with `ACCESS_DENIED` rather than disclosing the byte limit. The token is a convenience that lets the original `/upload-url` caller's identity and minted key ride along; it isn't an auth bypass.

When `BUCKET_TOKEN_SECRET` is unset in the service environment, `/upload-url` answers `503 BUCKET_TOKEN_SECRET_NOT_CONFIGURED` instead of handing out a URL no upload can use, and the service logs one boot warning per DbBucket naming it.

### The bucket signing key

Every service that declares a bucket signs its DbBucket upload and share tokens, and derives its Remote/Native file access keys, with `BUCKET_TOKEN_SECRET`. It is a separate variable from `JWT_SECRET` on purpose: `JWT_SECRET` also enables the session-token HS256 verification arm, and a bucket signing key must not double as a session secret. `JWT_SECRET` is not read as a fallback.

The hosting platform normally provisions one key per service and delivers it with the other deployment secrets; the generated env files carry a blank `BUCKET_TOKEN_SECRET=` line. If you self-deploy, set a stable random value (32 bytes, for example `openssl rand -base64 32`) per service and never rotate it casually: Remote/Native access keys already handed out are HMACs under it and stop matching when it changes.

## Share routes: shareable access-key links

`enableKeyAccess` (above) issues an `accessKey` *at upload time*. The share routes are the runtime complement: they mint a fresh, signed, single-file access token for an **already-uploaded** file, so an author can hand out a link that downloads the bytes without a session.

### `POST /bucket/{name}/share-url/:key`

Mint a shareable link for the file whose id is `:key`.

- **Auth:** minting requires normal read auth. A denied caller gets `HTTP 401 { status: 'denied', reason }`. (The resulting link itself needs no session.)
- **Payload:** none beyond the `:key` path segment (the file row's `id`).
- **Response (200):**

  ```json
  {
    "status": "OK",
    "url": "https://host/bucket/{name}/shared/{key}?token=<jwt>",
    "token": "<jwt>",
    "expiresAt": "2026-06-10T00:00:00.000Z"
  }
  ```

- The token is a JWT signed HS256 over `BUCKET_TOKEN_SECRET`, carrying `{ bucket: '<name>', key: '<id>', scope: 'download', svc }` (`svc` is the minting service's identity, see [Upload-token signing](#upload-token-signing)); `/shared` on another service refuses it. TTL defaults to **7 days**, overridable via the `DB_BUCKET_SHARE_TTL_SECONDS` env var.
- When `BUCKET_TOKEN_SECRET` is unset the route answers `503` with `errorCode: 'BUCKET_TOKEN_SECRET_NOT_CONFIGURED'`.

### `GET /bucket/{name}/shared/:key?token=...`

The access-key read path. Verifies that `?token=` is valid and scoped to exactly this `(bucket, key, scope:'download', svc)`, then streams the bytes, with **no session required**.

- An invalid, expired, or wrong-scope token returns `HTTP 401 { status: 'denied', reason: 'invalid_or_expired_token' }`.
- On success it sets `Content-Type` (from the row's `contentType`), `Content-Length`, and, when an `originalName` is present, `Content-Disposition: attachment; filename="..."; filename*=UTF-8''...` (see **Filename encoding** below), then ends the response with the raw bytes. Same byte-streaming shape as `/download/:id`, but gated by the token instead of the read gate.

**Filename encoding.** `Content-Disposition` carries BOTH halves of RFC 6266: `filename="..."` reduced to printable US-ASCII for pre-RFC-5987 clients, and `filename*=UTF-8''...` carrying the stored name losslessly. This is what makes a Turkish, Cyrillic, CJK, Arabic or emoji filename downloadable at all: HTTP header APIs commonly reject every codepoint above U+00FF, so a service that wrote the raw name would fail on EVERY download of such a row. The name is reduced to its basename (no path ever reaches the client), the encoded half is capped, and `"`, `\`, `;` and `=` are dropped from the ASCII half so a name cannot forge a second parameter. `Content-Type` is validated as a media type INCLUDING its parameters; anything else is served as `application/octet-stream`, which matters most on the session-less `/shared/:key` route where the stored MIME is the uploader's.

## Where the scan runs

The scan is a property of the **file row**, not of the upload route.

A scan that lived only in `/bucket/{name}/upload` would leave a gap. No anonymous caller can reach that route (`DbBucketWriteLevel` has no `public` value and `writeAuthScript` can only NARROW an access level), so a product that must take a file from a stranger (a public job application with a CV, a public support ticket with a screenshot, a public RFP submission) would take the bytes through its own business api and write the `{name}File` row itself, on a path with no scanner on it. `virusScan: true` would be configured, the design review would read as protected, and the one upload population that is by definition untrusted would be the unscanned one.

So the hook sits where the row is created, because **the control belongs to the thing being protected, not to the door it usually arrives through**. A scan attached to a route is a scan every new route has to remember to carry; a scan attached to row creation is one a reviewer can check by looking at the row.

**Every door that writes the bytes carries it.** Creating a `{Name}File` row (one or in bulk) and updating one by id, by id list or by query all run the scan guard before they write. That covers the bucket's own upload route, a public `loginRequired: false` intake api, an author's `CreateCrudAction`, a seed, a bulk import and an in-process internal writer. The update door is gated on the byte column being present in the payload, so replacing the bytes is scanned and renaming the file is not: a clean insert followed by a payload update is not a way around the create guard.

**What each caller kind gets on a refusal.**

| Caller | Refusal |
|--------|---------|
| the bucket upload route | `422 VIRUS_DETECTED`, or `503 VIRUS_SCAN_UNAVAILABLE` when the scanner could not run. The route answers **before** it calls the data layer, so no row exists and the answer is not a 500. |
| a business api (REST, gRPC, MCP, Kafka) | the data layer throws a typed error; the api answers `422 VIRUS_DETECTED` / `503 VIRUS_SCAN_UNAVAILABLE` with that `errorCode`. No row exists. |
| an action / MScript / workflow | the throw propagates under the action's own error policy. An `onActionError: continueRoute` step logs and continues **without** the row; it never continues with one. |
| a seed, a cron job, an internal writer | the promise rejects, naming the bucket and the signature. |

It **throws** rather than returning a failure envelope on purpose. The api layer binds a create's result as `this.result = result?.data ?? result`, so a refusal returned in band would have ridden out inside a `200`: a green answer for work that did not happen.

**No row ever exists without a verdict.** The scan is awaited *before* the write on every path. In `block` mode the row is never created; in `quarantine` mode it is created already carrying `virusScanStatus: 'quarantined'`. There is no `pending` state, no window between the insert and the verdict, and no background re-scan.

**The verdict is not the caller's to write.** On a scanned bucket the guard stamps `virusScanStatus` on every create and on every byte-replacing update, overwriting whatever the payload claimed. A write that does NOT replace the bytes keeps the stored verdict: a `virusScanStatus` in its payload (any spelling of the column) is silently dropped and the rest of the payload writes. That holds on every update door (by id, by id list, by query, which `updateCrudAction` and `updateWhere` use) and on every create merge that keeps the existing bytes (a create `onDuplicate: doUpdate` merge, and a bulk create row that names an existing id or matches a `doUpdate` index); a merge that replaces them records the guard's verdict of the new bytes. The upload route, which already scanned the same bytes and already answered its caller, marks its payload with a key that no request body, query string, MScript data clause or JSON seed file can carry, so the route can say "already scanned" and a caller cannot.

**What is still not covered, stated rather than implied.**

- A `RemoteBucket` or `NativeBucket` stores its bytes in a storage provider, and the `{name}RemoteFile` row carries a `storageKey`, not bytes. There is nothing at row creation to scan, so for those buckets the scan remains a property of the through-server `/upload` route only: a presigned PUT from `/upload-url` goes straight to the provider, and a business api that writes a `{name}RemoteFile` row records a key for bytes nothing here ever saw. **An intake that must accept files from anonymous or untrusted callers belongs in a DbBucket.**
- A "cleared after manual review" flow cannot relabel a row by writing `virusScanStatus` alone (that write is dropped, see above). It writes the bytes again, which scans them and records the new verdict.
- Bytes a project never puts in a bucket at all (a base64 blob in an ordinary `String` column, an attachment posted straight to a third party) pass through no bucket layer and are scanned by nothing here.

## Scan-mode precedence

Two different knobs decide what an infected upload does, and they resolve in two different phases. Getting them confused is how a bucket declared `quarantine` ends up returning 422.

**Design time, per bucket.** The compiler resolves one value per bucket and builds it into the service:

1. the bucket's own `bucketBasics.virusScanMode`, if set;
2. otherwise `projectSettings.clamAvSettings.configuration.defaultMode`;
3. otherwise `block`.

Because this is resolved per bucket, two buckets in the same service can legitimately have different modes. The project-level `defaultMode` is a fallback for buckets that left the field null, never an override of buckets that set it.

**Runtime, per process.** The `CLAMAV_DEFAULT_MODE` environment variable is an operational escape hatch that overrides the resolved mode for every bucket in the process. It works in both directions: `quarantine` forces the row to be persisted with `virusScanStatus='infected'`, `block` forces a 422 with nothing persisted. Only those two spellings count (trimmed, case-insensitive); unset, empty or anything unrecognised means no override, and the per-bucket value wins.

Do NOT wire a deployment to emit `CLAMAV_DEFAULT_MODE` from `clamAvSettings.configuration.defaultMode`. The project default is already folded into the per-bucket value at step 2, so re-injecting it as the process-wide override makes it beat every per-bucket value and inverts the precedence above.

Not every target language implements this precedence in full; see [the compiler specification](../../compiler/index.md).

## The scanner: where the bytes go

Every scan (the upload route and the row-creation guard alike) goes through one runtime client. It speaks one of two transports.

| `protocol` | What the scanner does | Connection fields | Env vars |
|---|---|---|---|
| `rest` (default) | `POST <url>/api/v1/scan`, `multipart/form-data`, ONE file per request in the form field `FILES`. The answer is `{ success, data: { result: [ { name, is_infected, viruses } ] } }`; the part is sent with the filename `upload`. Redirects are not followed. | `url`, whose default is the platform's ClamAV REST service (see [`ClamAvSettingsConfig`](../../spec/ClamAvSettingsConfig.md)) | `CLAMAV_PROTOCOL=rest`, `CLAMAV_BASE_URL` |
| `clamd` | ClamAV INSTREAM over a TCP socket to a self-hosted clamd. | `host`, `port` (default 3310) | `CLAMAV_PROTOCOL=clamd`, `CLAMAV_HOST`, `CLAMAV_PORT` |

`scanTimeoutMs` (env `CLAMAV_TIMEOUT_MS`, default 30000) bounds the whole scan on both transports: the HTTP call (request and answer) for `rest`, the socket session for `clamd`.

**Which transport a project gets.** Set `projectSettings.clamAvSettings.useClamAv: true` and fill `configuration` ([`ClamAvSettings`](../../spec/ClamAvSettings.md)). The generator then writes the connection env vars into the `.env` files of every service that has a virus-scanning bucket, on all four slots. A key that is already set is never overwritten. If a blueprint custom variable or a per-env overlay row sets `CLAMAV_PROTOCOL`, `CLAMAV_HOST` or `CLAMAV_BASE_URL`, the author owns the transport in that slot: no protocol, url, host or port line is added beside it, and the runtime resolves from the author's values. For example, a custom `CLAMAV_HOST=clamd.acme.internal` alone stays on that clamd. With `useClamAv: false` nothing is emitted, and the scanner uses `rest` against the default platform endpoint.

`protocol` may be left null, which is the case for every blueprint written before the REST transport existed. Then:

- a `host` other than the default ClamAV host selects `clamd` on that `host:port`. A blueprint that named its own clamd keeps it, and its files are never sent to the platform service;
- anything else (no `host`, or the default host) selects `rest` against `url`. The default host serves REST only, so clamd INSTREAM against it could never answer.

The runtime applies the same rule to an env written by hand: with no `CLAMAV_PROTOCOL`, a `CLAMAV_HOST` other than the default host means clamd.

**What each answer means.** The mapping is the same for both transports, so the 422 / 503 / quarantine behaviour above does not depend on the transport:

| Scanner outcome | Result |
|---|---|
| exactly one well-formed entry with `is_infected: false`, whatever its `name`; or several, all clean, one of them named `upload` (clamd: `OK`) | clean |
| any well-formed `result` entry with `is_infected: true`, wherever it sits in the list (clamd: `FOUND`) | a detection, named by that entry's `viruses[0]` (`UNKNOWN` when the list is empty). It always blocks or quarantines, whatever `CLAMAV_ON_ERROR` says, even when other entries are unreadable |
| unreachable, timed out, a redirect (any 3xx), a non-2xx status, `success: false`, a body that is not JSON, no `result` entry, an entry without a boolean `is_infected` beside clean ones, or an all-clean answer of several entries none of which is named `upload` (clamd: `ERROR` or an unrecognised reply) | a scan that could not run: `503 VIRUS_SCAN_UNAVAILABLE` in block mode, or accepted and recorded as `error` where `CLAMAV_ON_ERROR=skip` |
| a file over 100 MB (`rest` only; the service's per-file limit) | not sent at all, and treated as a scan that could not run. The bucket's own size limit normally refuses such a file first |

The failure reason of a REST scan names the cause (`HTTP 502`, `transport error ECONNREFUSED`, `timed out after 30000ms`), never the scanner URL; the service logs the target origin as a `ClamAvRestScanFailed` warning. The reason of any scan failure, on either transport (a clamd one names the scanner's host and port), reaches the operator's log as a `VirusScanRefused` warning carrying the request's `requestId`. It is not part of a `422 VIRUS_DETECTED` or `503 VIRUS_SCAN_UNAVAILABLE` body: the caller sees the bucket, the signature name of a detection, and nothing about the scanner's address.

> **Clear text.** The default endpoint is published as plain HTTP, so uploaded file bytes travel unencrypted to it. If your own scanner offers HTTPS, set `url` to the `https://` address.

Support for the two transports differs between target languages (some implement only clamd INSTREAM, in which case the default target cannot answer and every scan is a scan that could not run); see [the compiler specification](../../compiler/index.md).

## Scanner errors per environment

For a scan that could not run (unreachable, timed out, a non-2xx answer, a malformed body), the deployment's `CLAMAV_ON_ERROR=skip` is authoritative **even when the effective `virusScanMode` is `block`**: the upload is accepted, the file is stored with `scanStatus='error'` (`virusScanStatus: 'error'` on a DbBucket row), and no `503 VIRUS_SCAN_UNAVAILABLE` is returned. The generated `dev`, `test` and `stage` env files carry this skip default; `prod` gets no skip line and refuses the same upload with `503 VIRUS_SCAN_UNAVAILABLE` in block mode. The line is written only for a service that actually has a virus-scanning bucket (db, native or remote), and only when the key is not already present: an author's own blueprint custom variable or a per-environment overlay always wins over it.

`CLAMAV_ON_ERROR=skip` affects **only** a scan that could not run. A scanner that DID run and found a virus still blocks (`block` mode) or quarantines (`quarantine` mode) the file on every slot: `CLAMAV_ON_ERROR` never turns a detection into an accept.

## Magic-byte MIME sniffing

When a db bucket sets `allowedMimeTypes`, `/upload` no longer trusts the client-declared `Content-Type`. It sniffs the uploaded buffer's leading bytes (the same sniffing a RemoteBucket uses) and the **sniffed type wins** over the declared one.

- The sniffed type becomes the persisted `contentType` on the file row.
- If the sniffed type isn't in the whitelist, the upload is rejected with:

  ```json
  {
    "status": "failed",
    "reason": "mime_type_not_allowed",
    "declaredMimeType": "image/png",
    "sniffedMimeType": "application/x-msdownload",
    "allowed": ["image/png", "image/jpeg"]
  }
  ```

  (`HTTP 400`.) Both the client-declared and the sniffed type are surfaced so a renamed file claiming an allowed type is caught.
- Sniffing only fires when `allowedMimeTypes` is non-empty. With no whitelist there is no sniff and the declared type is kept.

## ownerDataObject enforcement

When `ownerDataObject.hasOwnerDataObject: true`, `/upload` requires the configured FK property on the multipart body (default `<dataObjectName>Id`). Missing the value returns `HTTP 400` with error code `OWNER_REQUIRED`. The data-layer create call will surface a FK violation if the supplied id doesn't resolve.

## How the bytes are stored

The `content` column on the generated `{name}File` data object is a Postgres `BYTEA` (or the equivalent on other backends, `Buffer` in MongoDB). Bytes are stored on the same row as the rest of the metadata; reads and writes are transactional with everything else on that row.

The same row carries `originalName` (the client-supplied filename), `contentType` (sniffed MIME type), `sizeBytes` (byte count), `storedName` (a 12-character random access key the router exposes as the public route segment), `uploadedAt`, and `uploaderUserId`. When virus scan is on, the `virusScanStatus` column records the outcome (`clean`, `infected`, `quarantined`, `error`, `skipped`).

## Read URL behaviour

`GET /bucket/{name}/download/:id` (and its `download/key/:accessKey` form) is served by the owning service itself. The download response is either a short-lived signed URL (pointing back at the service's own download endpoint) or a direct byte stream: there is no third-party hop and no presigned URL to a remote provider, because the bytes live in this database.

Signed-URL expiry is short by default; treat the URL as single-use for embedding in `<img>` / `<a>` tags. For long-lived shareable access, either surface the file's upload-time `accessKey` with `enableKeyAccess: true`, or mint a fresh time-limited link at runtime with [`POST /bucket/{name}/share-url/:key`](#share-routes-shareable-access-key-links) (consumed at `GET /bucket/{name}/shared/:key?token=...` with no session).

## Lifecycle

- **Hard delete of the file row** removes both metadata and bytes: a single SQL `DELETE` because they share a row.
- **Soft delete on the file row** (`isActive: false`) hides the file from listings while keeping the bytes. To reclaim storage, follow up with a hard delete.
- **Cascading delete from the owner** (when `ownerDataObject` is set and the FK is configured with `onDeleteAction: "doDelete"`) removes file rows together with the owner. The other three values apply here too: `setNull` orphans the file row deliberately, `restrict` refuses the owner's delete with HTTP 409 `RELATION_RESTRICTED` while any live file row points at it, and `doNothing` leaves it pointing at the archived owner. See [On-delete cascades](../data-modeling/relations.md#on-delete-cascades).

## Limits and performance

The default `maxFileSizeMb` for `DbBucket` is **10 MB**. Even a few thousand 10 MB files in one table/collection noticeably affect backup size, replication lag, and the cost of any full scan. (On MongoDB, an individual document, bytes included, must also stay under the 16 MB BSON limit.) Treat `DbBucket` as the right answer for kilobyte-scale files (avatars, icons, small PDFs); switch to `RemoteBucket` as soon as the workload includes multi-megabyte files at scale.

Row/document writes that include the inline bytes are heavier than scalar updates in both engines. If a row's file content changes frequently, consider a separate metadata-only object that references the file row by FK, so updates to other fields don't touch the byte column.

## DbBucket vs RemoteBucket

| Aspect | `DbBucket` | `RemoteBucket` |
|--------|-----------|---------------|
| Byte location | Service database (`BYTEA` / `Buffer`) | Cloud provider (S3 / GCS / Azure / R2 / S3-compatible) |
| Default size cap | 10 MB | 100 MB |
| Provider credentials needed | None | Yes: a `bucketProvidersSettings` entry |
| Upload route | `POST /bucket/{name}/upload` (through-server) | `POST /bucket/{name}/upload-url` (presigned) or `/upload` (through-server), same prefix as `DbBucket` |
| Download host | The owning service | The provider (presigned URL; the service only issues the 302) |
| Transactional with row | Yes | No (separate write to provider, then row update) |
| CDN reach | None: served by the service | Whatever the provider supports |
| Backup impact | Bytes live in DB backups | Bytes live with the provider |
| Best for | Small, sensitive, transactionally consistent files | Media, large documents, anything benefiting from object storage |

## Worked example: User avatar

Pair a small db bucket with the `user` data object in an `auth` service:

```json
{
  "dbBuckets": [
    {
      "bucketBasics": {
        "name": "userAvatar",
        "description": "User profile photo (max 2 MB).",
        "maxFileSizeMb": 2,
        "allowedMimeTypes": "image/png,image/jpeg,image/webp"
      },
      "bucketAuthorization": {
        "readAccess": "public",
        "writeAccess": "authenticated"
      },
      "ownerDataObject": {
        "hasOwnerDataObject": true,
        "configuration": { "dataObjectName": "user" }
      }
    }
  ]
}
```

Upload from the client:

```bash
curl -X POST "https://<service-base-url>/bucket/userAvatar/upload" \
     -H "Authorization: Bearer $USER_TOKEN" \
     -F "file=@avatar.png" \
     -F "userId=$USER_ID"
```

The response carries the new `userAvatarFile` row's `id` plus the sniffed `contentType`, byte count, and the `storedName` access key. To embed:

```html
<img src="https://<service-base-url>/bucket/userAvatar/download/{id}" />
```

`:key` in the download route resolves through get-by-id against the file row's `id`.

## See also

- [Remote buckets](remote-buckets.md): cloud-storage variant.
- [Native buckets](native-buckets.md): object store managed by the hosting platform, no cloud account or credentials.
- Patterns: [`DbBucket`](../../spec/DbBucket.md), [`DbBucketBasics`](../../spec/DbBucketBasics.md), [`DbBucketAuthorization`](../../spec/DbBucketAuthorization.md), [`DbBucketOwnerConfig`](../../spec/DbBucketOwnerConfig.md).
