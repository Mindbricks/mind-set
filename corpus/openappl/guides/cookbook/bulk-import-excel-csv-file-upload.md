---
title: Bulk data import from Excel/CSV (xlsx file upload and parse)
---

# Bulk data import from Excel/CSV (xlsx file upload and parse)

Import a spreadsheet (an Excel `.xlsx` file or a CSV) as many rows
of a data object: an employee roster, a product catalogue, a price
list. This recipe covers the recommended shape (client parses the
file, the backend takes `rows: Object[]` JSON), the three
alternatives (DbBucket upload + library parse, base64 body + a
spreadsheet package, `CreateBulkCrudAction`), the template-download
endpoint, and the localization traps (header names, `DD.MM.YYYY`
dates, decimal commas).

**Read this first: there is no multipart upload on a BusinessApi.**
BusinessApis and edge functions
receive JSON: an edge function gets one normalized `ctx` whose `body`
is the merged JSON payload, never a raw request object, so there is
no multipart parser, no raw buffer, no `req.files` on a custom route. The
only generated multipart endpoints are the bucket routes
(`POST /bucket/{name}/upload`). Every import pattern below follows
from that fact: "POST the .xlsx to my import API" is not one of the
options.

| Pattern | File parsed by | Pick when |
|---|---|---|
| **Recommended: client parses, API takes `rows: Object[]`** | Frontend (a spreadsheet library in the browser) | Almost always. No file storage, no server dependency, per-row workflow + per-row error report via `loopActions`. |
| **DbBucket upload + library parse** | Backend, from the bucket row's `content` bytes | You must keep the original file (audit), or rows are entered by an operator whose client cannot parse. |
| **Base64 body + a spreadsheet package** | Backend, from a base64 request parameter | Server-authoritative parsing of small files without storing them. |
| **`FileToDataAction` + `UpsertBulkCrudAction`** | Backend, declared: bucket key, pasted text or json body in, typed rows out, insert-or-update by key | The default for any spreadsheet / csv / json import; enrichment sheets; idempotent re-imports |
| **`CreateBulkCrudAction` alone** | Frontend (rows arrive ready) | Rows map 1:1 onto one local child object with no per-row branching and all-or-nothing semantics are fine. |

## The declared way: `FileToDataAction` + `UpsertBulkCrudAction`

The import is two declared actions and no library code. Upload
the workbook to a bucket (or paste csv / tsv text, or post the records as
json), parse it against the data object, write the rows with a match key:

```json
{
  "basics": { "apiOptions": { "name": "importProducts", "crudType": "list", "dataObjectName": "product" },
              "authOptions": { "loginRequired": true } },
  "controllers": { "restSettings": { "routePath": "/products/import", "forcePOSTMethod": true } },
  "parameters": { "requestParameters": [ { "name": "storageKey", "type": "String", "required": true, "httpLocation": "body" } ] },
  "actions": {
    "fileToDataActions": [ {
      "name": "parseSheet",
      "fileSource": { "js": "({ bucket: 'imports', storageKey: this.storageKey })" },
      "inputFormat": "xlsx",
      "targetObject": "product",
      "columns": [ { "property": "price", "header": "Unit Price" } ],
      "errorRowHandling": "collect",
      "contextPropertyName": "parsed", "writeToResponse": true
    } ],
    "upsertBulkCrudActions": [ {
      "name": "upsertProducts",
      "childObject": "product",
      "objects": { "js": "this.parsed.rows" },
      "matchBy": ["sku"], "matchMode": "upsert", "emptyCells": "skip",
      "columnPolicies": [ { "property": "price", "onExisting": "fillIfEmpty" } ],
      "contextPropertyName": "importResult", "writeToResponse": true
    } ]
  },
  "workflow": { "list": { "afterCheckParameters": ["parseSheet", "upsertProducts"] } }
}
```

Headers that equal a property name bind on their own; `columns` is only for
renamed headers, nested json paths, value maps and computed cells. Rejected
rows come back with their row number and reasons, the write reports
`{ inserted, updated, skipped, rejected }`, and the export direction is the
same list api plus a [`DataToFileAction`](../actions/data-to-file-action.md)
with an empty `inputData`. Full reference:
[`FileToDataAction`](../actions/file-to-data-action.md),
[`UpsertBulkCrudAction`](../actions/upsert-bulk-crud-action.md).

The sections below are the older approaches. They still work and remain
the right tool when the client must own the parsing, or when a row needs
per-row branching that a `LoopAction` expresses better.

## Alternative: client parses the file, the API takes `rows: Object[]`

The spreadsheet is a **client-side input format**, not a wire format.
The frontend reads the workbook (a spreadsheet library in the browser reads
the file's bytes and converts the first sheet to an array of row objects), and
the backend exposes a normal
BusinessApi whose input is the parsed rows as a JSON array. The
backend still owns normalization, validation, and the per-row
workflow: it just never touches binary.

### Step 1: an import-batch data object

Track each import as a record so the caller can see totals and
per-row failures later:

```json
{
  "name": "employeeImport",
  "properties": [
    { "name": "fileName",          "type": "String" },
    { "name": "initiatedByUserId", "type": "ID" },
    { "name": "totalRows",         "type": "Integer" },
    { "name": "successCount",      "type": "Integer" },
    { "name": "failureCount",      "type": "Integer" },
    { "name": "results",           "type": "Object", "isArray": true }
  ]
}
```

Every one of these properties must be written by a `dataClauseItems`
entry (or a crud action's `dataClause`) on some API: a property no
API writes is flagged as schema-only dead weight by the reachability
checks, and an agent's `changeCompleted` is rejected with
`SCHEMA-ONLY: no API dataClause writes it`.

### Step 2: the import BusinessApi with a `rows` parameter

A `create`-type BusinessApi on the import-batch object. The parsed
rows ride in the body as an `Object[]` parameter: this is the
"bulk import CSV main operation" shape; the batch row itself is the
main operation's write:

```json
{
  "apiSettings": { "basicSettings": { "name": "importEmployees", "crudType": "create" } },
  "parameters": {
    "requestParameters": [
      {
        "name": "rows",
        "type": "Object",
        "isArray": true,
        "required": true,
        "httpLocation": "body",
        "dataPath": "rows",
        "description": "Parsed rows of the uploaded spreadsheet, one object per data row.",
        "dataExample": "[{ \"sicil no\": \"E-1042\", \"ad\": \"Ayşe\", \"soyad\": \"Yılmaz\", \"e-posta\": \"ayse@acme.com\", \"departman\": \"Satış\", \"ünvan\": \"Uzman\", \"işe giriş tarihi\": \"03.02.2024\" }]"
      },
      {
        "name": "fileName",
        "type": "String",
        "required": false,
        "httpLocation": "body",
        "dataPath": "fileName"
      }
    ]
  }
}
```

`dataExample` is required-by-convention for `Object` / `Object[]`
parameters (the spec auditor errors on a required one without it):
it is the only place the caller learns the inner key shape.

### Step 3: normalize headers in a library function

Spreadsheet headers are human text: localized, cased, padded,
reordered. Normalize them **once**, in a
service-library function, before
any row-level work. The same function is the right home for date and
number parsing (see [Localization](#localization-headers-dates-numbers)):

```json
{
  "library": {
    "functions": [
      {
        "moduleName": "normalizeEmployeeRows",
        "moduleBody": {
          "js": "module.exports = function normalizeEmployeeRows(rows) {\n  const HEADERS = {\n    'sicil no': 'sicilNo', 'sicilno': 'sicilNo', 'sicilNo': 'sicilNo',\n    'ad': 'firstName', 'soyad': 'lastName',\n    'e-posta': 'email', 'eposta': 'email', 'email': 'email',\n    'departman': 'departmentText', 'department': 'departmentText',\n    'ünvan': 'unvanText', 'unvan': 'unvanText', 'title': 'unvanText',\n    'işe giriş tarihi': 'hireDate', 'ise giris tarihi': 'hireDate', 'hireDate': 'hireDate'\n  };\n  const parseDate = (v) => {\n    if (v == null || v === '') return null;\n    if (typeof v === 'number') { // Excel serial date\n      return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString().slice(0, 10);\n    }\n    const m = String(v).trim().match(/^(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})$/); // DD.MM.YYYY\n    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;\n    return String(v).slice(0, 10); // already ISO\n  };\n  return rows.map((raw, i) => {\n    const row = { _rowIndex: i + 2, _errors: [] }; // +2: 1-based + header row\n    for (const [key, value] of Object.entries(raw)) {\n      const target = HEADERS[String(key).trim().toLowerCase()] ?? HEADERS[String(key).trim()];\n      if (target) row[target] = typeof value === 'string' ? value.trim() : value;\n    }\n    row.hireDate = parseDate(row.hireDate);\n    if (!row.sicilNo) row._errors.push('sicil no missing');\n    if (!row.email || !/^[^@\\s]+@[^@\\s]+$/.test(row.email)) row._errors.push('invalid email');\n    return row;\n  });\n};"
        }
      }
    ]
  }
}
```

Call it from the workflow via `LIB.*`, for example in an
`addToContextActions` entry:

```json
{
  "name": "normalizeRows",
  "writeToResponse": false,
  "context": [
    { "contextName": "normalizedRows", "contextValue": { "js": "LIB.normalizeEmployeeRows(this.rows)" } }
  ]
}
```

### Step 4: per-row workflow with `loopActions`

Each row gets its own validation and writes: this is the
[`LoopAction`](../actions/loop-action.md) shape, not a bulk insert.
The loop iterates the normalized rows sequentially; inner actions
read the current row as `this.row`:

```json
"loopActions": [
  {
    "name": "importRowsLoop",
    "writeToResponse": false,
    "contextPropertyName": "rowResults",
    "loopFor": { "js": "this.normalizedRows" },
    "loopItemName": "row",
    "isParallel": false,
    "actions": ["skipInvalidRow", "createEmployeeRow", "provisionUserAccount"]
  }
]
```

Notes that save you a red validation run:

- Inner actions live in their own class-matching arrays of the same
  `actionStore` (`validationActions`, `createCrudActions`,
  `interserviceCallActions`, ...) and are referenced **by name**.
- Give failure-prone inner actions `"onActionError": "completeApi"`
  so one bad row does not abort the batch: the error lands on
  `this.<actionName>Error` and the loop continues to the next item.
- The loop's return value (one step-results entry per iteration) is
  kept only if you bind the loop's own `contextPropertyName`: that
  array is what you aggregate into `successCount` / `failureCount` /
  `results` in the main operation's `dataClauseItems`.
- Keep `isParallel: false` for imports: sequential order preserves
  row numbers in error reports and avoids write races.

### Step 5: cross-service provisioning with `forwardCallerToken`

An import row often needs a write in **another** service: creating a
login account in the auth service for each imported employee. That is
an [`InterserviceCallAction`](../actions/interservice-call-action.md)
inside the loop:

```json
{
  "name": "provisionUserAccount",
  "writeToResponse": false,
  "contextPropertyName": "provisionedUser",
  "condition": { "js": "this.row._errors.length === 0" },
  "targetService": "auth",
  "targetApi": "provisionUser",
  "isArray": false,
  "forwardCallerToken": true,
  "onActionError": "completeApi",
  "apiParameters": [
    { "name": "email",    "value": { "js": "this.row.email" } },
    { "name": "fullname", "value": { "js": "this.row.firstName + ' ' + this.row.lastName" } }
  ]
}
```

`forwardCallerToken: true` makes the downstream call run under the
**importing user's own session** instead of bare M2M. It is required
whenever the target API is login-gated and not `M2MAllowed`:
without it, validation rejects the call with
`INTERSERVICE_TARGET_UNREACHABLE` (custom Business APIs default to
`M2MAllowed: false`, so this is the common case). The fix the
validation message suggests is exactly this flag. The target's
`checkRoles` gate then applies to the importing user, which is
usually what you want for an HR/admin import.

### Step 6: a template download endpoint

Give users a file with the exact headers the import expects. Two
options:

- **CSV template (zero dependencies)**: a `list`-type BusinessApi
  (or a dedicated `get`) with a
  [`DataToFileAction`](../actions/data-to-file-action.md):
  `outputFormat: "csv"`, `sendToClient: true`, `inputData` the
  header line (plus one example row). Excel opens CSV directly.
  Note `xlsx` is **not** in the `FileFormats` enum: CSV is the
  native template format here.

```json
"dataToFileActions": [
  {
    "name": "employeeImportTemplate",
    "writeToResponse": false,
    "contextPropertyName": "employeeImportTemplate",
    "inputData": { "js": "'sicil no;ad;soyad;e-posta;departman;ünvan;işe giriş tarihi\\nE-1042;Ayşe;Yılmaz;ayse@acme.com;Satış;Uzman;03.02.2024'" },
    "outputFormat": "csv",
    "sendToClient": true
  }
]
```

- **Real `.xlsx` template**: declare a spreadsheet package (next
  section) and serve the workbook from an
  edge function: build the sheet
  with the package's sheet-building helpers, return
  `{ status: 200, headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": "attachment; filename=template.xlsx" }, body: <Buffer> }`:
  an edge function's `Buffer` body is sent raw, which is exactly the
  file-download path.

## Alternative A: DbBucket upload, parse in a library function

When the original file must be kept (audit trail, re-runs) or the
client cannot parse, store the file first and parse server-side:

1. Declare a [`DbBucket`](../composition/db-buckets.md) on the
   service (e.g. `"name": "importFiles"`). This generates
   `POST /bucket/importFiles/upload`, a real **multipart** route,
   plus a metadata data object
   `importFilesFile` whose `content` column holds the raw bytes.
2. The client uploads the `.xlsx`/`.csv` there and receives the file
   row (its `id` is the download key: the DbBucket equivalent of a
   RemoteBucket `storageKey`).
3. The import BusinessApi takes a `fileId` parameter; a library
   function loads the file row by id (and fails with a clear "import
   file not found" error when there is none), reads its `content`
   bytes, parses the first sheet with the declared spreadsheet package and
   returns the rows as objects. Parse with empty cells kept as `null`, so the
   keys stay visible instead of being dropped.

From step 3 on, everything is identical to the recommended pattern:
normalize, loop, provision, report. Mind the DbBucket size intent
(default 10 MB cap, bytes inline in the database row); for very large
recurring files prefer the recommended pattern or a
[`RemoteBucket`](../composition/remote-buckets.md).

### The same with a RemoteBucket or NativeBucket

A Remote/Native bucket keeps the bytes in object storage instead of a row;
the upload routes answer a `storageKey` (for example
`POST /nativebucket/importFiles/upload`). Read the bytes back in the library
function with the compiler's in-process bucket-read helper: do not build a
storage-provider client from environment names or guess the physical key. The
helper resolves the provider, physical bucket and key prefix exactly as the
bucket's own routes do, caps the read at the bucket's `maxFileSizeMb`, and
throws a typed bucket-object error (`BUCKET_OBJECT_NOT_FOUND`,
`BUCKET_OBJECT_TOO_LARGE`, ...). It is a trusted server-side read, so take
the `storageKey` from the import-batch row the caller owns, not straight
from a request parameter. See
[Reading an object's bytes in service code](../composition/remote-buckets.md#reading-an-objects-bytes-in-service-code).

## Alternative B: a spreadsheet package via `packages[]`

To parse server-side without storing the file, add the dependency to
the service and send the file as base64. Dependencies are declared on
`serviceSettings.serviceBasics.packages[]`: this is the
canonical replacement for the deprecated `nodejsPackages` field:

```json
{
  "serviceSettings": {
    "serviceBasics": {
      "name": "organization",
      "packages": [
        { "manager": "npm", "name": "xlsx", "version": "*" }
      ]
    }
  }
}
```

The import API then takes a `fileBase64: Text` body parameter, and a
library function decodes the base64 text into bytes, reads the workbook with
the declared package and returns the first sheet as row objects (empty cells
kept as `null`).

Base64 inflates the payload ~33% and rides through JSON body-size
limits, so keep this for small files. In a polyglot project remember
the dependency is per-ecosystem: an `npm` entry serves only the
service compiled for that ecosystem; a service also compiled for another
language needs its own sibling entry for that ecosystem's package manager and
a native parse path.

## Alternative C: `CreateBulkCrudAction`

When the rows map 1:1 onto **one local child object**, need no
per-row branching, and all-or-nothing is acceptable, skip the loop:
a single [`CreateBulkCrudAction`](../actions/create-bulk-crud-action.md)
inserts the whole array in one data-layer batch (one transaction: a
single bad row fails the batch):

```json
{
  "name": "bulkInsertEmployees",
  "writeToResponse": false,
  "contextPropertyName": "insertedEmployees",
  "childObject": "Employee",
  "objects": { "js": "LIB.normalizeEmployeeRows(this.rows).filter(r => r._errors.length === 0).map(({ _rowIndex, _errors, ...fields }) => fields)" }
}
```

You lose the per-row error report and the cross-service provisioning
hook: that is the trade. See
[Bulk actions](../business-apis/bulk-actions.md) for how bulk insert,
bulk update/delete-by-query and per-item loops divide the work; there
is deliberately no `crudType: "bulk"` and no auto-generated
`POST /<x>/bulk` route.

## Localization: headers, dates, numbers

Real spreadsheets arrive localized. Handle all of this inside the
normalization library function, never in per-action MScript:

- **Header normalization.** Trim, lowercase, and map through an
  explicit dictionary that lists every accepted spelling: localized
  headers (`sicil no`, `departman`, `ünvan`, `işe giriş tarihi`),
  their ASCII-folded variants (`unvan`, `ise giris tarihi`) and the
  camelCase field names, all mapping to the same target property.
  Column **order must not matter**; only headers do.
- **Date formats.** `DD.MM.YYYY` (and `DD/MM/YYYY`) strings must be
  parsed explicitly: `new Date("03.02.2024")` is either invalid or
  silently month-first depending on the runtime. Excel may also hand
  you a **serial number** (days since 1900) instead of a string when
  the cell is date-typed; handle both, as the example above does.
- **Decimal commas.** `1.234,56` needs
  `s.replace(/\./g, "").replace(",", ".")` before `Number(...)`.
- **Whitespace and empty cells.** Trim every string; treat `""` as
  missing (parsing the sheet with empty cells kept as `null` keeps them
  visible instead of dropping the keys).

## Per-row error reporting and result aggregation

Collect a result entry per row instead of failing the request:
inner actions carry `onActionError: "completeApi"`, each iteration's
outcome is readable from the loop's results array (or from a final
inner action that appends `{ rowIndex, status, error }` to a context
list), and the main operation's `dataClauseItems` compute
`successCount` / `failureCount` / `results` from it. The API answers
`201` with the batch row: the caller renders "38 imported, 2 failed:
row 7 invalid email, row 23 duplicate sicil no".

## If you searched for...

...any of these, this page is the answer: uploading an Excel file to a
BusinessApi (multipart, binary body, raw buffer) - not
supported, see the box at the top; parsing xlsx in an edge controller
or library function; reading an uploaded file's content from a
dbBucket storage key in a business api; adding a package /
`xlsx` dependency to a service (`serviceBasics.packages`, formerly
`nodejsPackages`); bulk operations as main operations /
`createBulkCrudActions` CSV import example with user data; per-row
`loopActions` with `loopItemName`, collected results and
`onActionError` handling; `interserviceCallActions` with
`forwardCallerToken` to provision accounts for imported rows; a
downloadable import template with localized headers (employee
roster: sicil no, departman, ünvan, hire date) and `DD.MM.YYYY`
dates; base64 CSV parsing in a library function.

## See also

- [Attach file uploads](./attach-file-uploads.md): RemoteBucket vs DbBucket for files as *data*, not as import carriers
- [Bulk actions](../business-apis/bulk-actions.md): the three bulk primitives
- [`LoopAction`](../actions/loop-action.md) · [`CreateBulkCrudAction`](../actions/create-bulk-crud-action.md) · [`InterserviceCallAction`](../actions/interservice-call-action.md) · [`DataToFileAction`](../actions/data-to-file-action.md)
- [DbBuckets](../composition/db-buckets.md): the multipart upload route
