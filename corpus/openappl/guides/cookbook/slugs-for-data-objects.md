---
title: Slugs for data objects
---

# Slugs for data objects

Give a data object a human-readable, URL-safe key - `/books/kucuk-prens`
instead of `/books/6f1c...` - minted once from another field when the record
is created, unique where it has to be, and readable through its own get api.
Everything here is ordinary blueprint: a String property, an index, one
`dataClauseItems` entry and a get api with `selectBy`.

> **Audience.** AI agent or human author adding SEO-friendly URLs to a
> DataObject (books, authors, products, lists). ContentModel pages already
> mint their own slugs (`slugSource`, frozen at first publish); this recipe
> is for a plain DataObject. Do not hand-roll a slugify function in a service
> library: the shared `LIB.common.slugify` is the same transform ContentModel
> uses, with per-locale maps.

## The helper: `LIB.common.slugify`

```text
LIB.common.slugify(text, { locale, separator, maxLength })
```

| Option | Default | Meaning |
| --- | --- | --- |
| `locale` | none | Primary language subtag (`tr`, `tr-TR`, `de`, `de-AT`). `tr` folds both i letters to `i` and drops the marks of s-cedilla, g-breve, c-cedilla, o/u umlaut; `de` spells the umlauts out (`ae`, `oe`, `ue`) and sharp s as `ss`. Any other value uses the fallback map only. |
| `separator` | `-` | Literal word separator. It must not contain a letter or a digit. Dollar tokens and backslashes are literal: `slugify('a b c', { separator: '$$' })` returns `a$$b$$c`. |
| `maxLength` | none | Cut to at most this many characters, on a separator boundary (a single word longer than the limit is cut inside the word). |

The result is lowercase `a-z`, digits and single separators, never starting
or ending with the separator; an input with nothing transliterable (only
punctuation, or a non-Latin script) gives `''`. Without a locale, letters
NFKD does not decompose (dotless i, sharp s, o-stroke, the ae / oe ligatures,
thorn, ...) are transliterated by the fallback map and every other accented
letter loses its mark.

| Input | Options | Result |
| --- | --- | --- |
| `Kucuk Prens` written with the Turkish letters | `{ locale: 'tr' }` | `kucuk-prens` |
| `Muller Strasse` written with u-umlaut and sharp s | `{ locale: 'de' }` | `mueller-strasse` |
| the same German input | `{}` | `muller-strasse` |
| `The Quick Brown Fox` | `{ maxLength: 12 }` | `the-quick` |
| `Hello World` | `{ separator: '_' }` | `hello_world` |

A separator that contains a letter or a digit, or a `maxLength` of zero, is
refused with an error.

`LIB.common.slugify(text, { locale, separator, maxLength })` is the name an
author's MScript calls; it belongs to the common library every service has.
A compiler that does not implement the helper refuses the call; a
service-library function that provides the same transform can supply it in
that case.

## Step 1 - the slug property

```json
{
  "basicSettings": {
    "name": "slug",
    "type": "String",
    "isRequired": false,
    "allowUpdate": "untilSet"
  },
  "indexSettings": {
    "indexedInDb": true,
    "unique": true,
    "isSecondaryKey": true,
    "cacheSelect": true
  }
}
```

- `allowUpdate: "untilSet"` makes the column write-once: the create writes
  it, and an update can only fill it while it is still null (the update is
  guarded `WHERE slug IS NULL` at the database). A published URL therefore
  never moves, and a backfill of old rows is still possible.
- `indexedInDb` + `isSecondaryKey` make the by-slug read an indexed lookup;
  `cacheSelect` registers the slug as a lookup key of the Redis entity cache.
- `unique: true` makes the slug unique across the whole object. When it only
  has to be unique inside a tenant or under a parent, drop `unique` here and
  use the composite index of Step 2 instead.

## Step 2 - uniqueness inside a tenant or a parent (optional)

On a tenant-level object the slug is usually unique PER TENANT, and a child
object's slug unique per parent. Declare a composite index over the scope
column and the slug, with `onDuplicate: "throwError"`, and leave
`indexSettings.unique` off the slug property (a unique property that a
composite strictly contains loses its own single-column index; the validator
warns with `UNIQUE_PROPERTY_INDEX_DROPPED_BY_COMPOSITE`).

```json
{
  "basicSettings": { "name": "book" },
  "authorization": { "objectDataIsInTenantLevel": true },
  "compositeIndexSettings": [
    { "indexName": "bookSlugPerStore", "indexFields": ["storeId", "slug"], "onDuplicate": "throwError" }
  ]
}
```

`storeId` is the tenant column of a project whose tenant is named `store`
(the column is always `<tenantName>Id`). For a per-parent slug use the parent
reference instead, for example `["publisherId", "slug"]`.

The validator answers this shape with one warning,
`COMPOSITE_INDEX_NULLABLE_MEMBER`: the slug is nullable (write-once needs a
nullable column, `WRITE_ONCE_REQUIRES_NULLABLE`), and a row whose slug is
null is never a duplicate. That is the intended trade-off here: every row
created through the api of Step 3 carries a slug, and a row created without
one stays out of the uniqueness check until a slug is written.

## Step 3 - mint the slug in the create api

```json
{
  "basics": {
    "apiOptions": { "name": "createBook", "crudType": "create", "dataObjectName": "book" },
    "authOptions": { "loginRequired": true }
  },
  "controllers": {
    "restSettings": { "hasRestController": true, "routePath": "/books" }
  },
  "parameters": {
    "requestParameters": [
      { "name": "title", "type": "String", "required": true, "httpLocation": "body" }
    ]
  },
  "query": {
    "dataClauseItems": [
      { "name": "title", "value": { "js": "this.title" } },
      { "name": "slug", "value": { "js": "LIB.common.slugify(this.title, { locale: 'tr', maxLength: 80 })" } }
    ]
  }
}
```

The slug is derived on the server, so a caller cannot choose it. A title
that is already taken is refused by the duplicate check of the
index: the caller gets a 409 with errorCode `DUPLICATE_RECORD` (the index
name is in the service log only); there is no automatic `-2` suffix for a
plain DataObject yet. When two records may legitimately share a title, put
a disambiguator into the source, for example
`LIB.common.slugify(this.title + ' ' + this.publicationYear, { locale: 'tr' })`.

## Step 4 - read by slug

```json
{
  "basics": {
    "apiOptions": { "name": "getBookBySlug", "crudType": "get", "dataObjectName": "book" },
    "authOptions": { "loginRequired": false }
  },
  "controllers": {
    "restSettings": { "hasRestController": true, "routePath": "/books/by-slug/:slug" }
  },
  "query": {
    "whereClause": { "selectBy": ["slug"] }
  }
}
```

`selectBy: ["slug"]` makes the slug the required selector: the api reads
`slug` from the route and no id parameter is created. Give it its own route
segment (`/books/by-slug/:slug`) when the object also keeps the default
`getBook` on `/books/:bookId`, since both would otherwise match the same URL.

## Related

- [MScript overview](../mscript/overview.md) - what `LIB.common` is.
- [Indexes](../data-modeling/indexes.md) - `unique`, `isSecondaryKey`,
  composite indexes.
- [PropertyBasicSettings](../../spec/PropertyBasicSettings.md) -
  `allowUpdate: "untilSet"`.
- [WhereClauseSettings](../../spec/WhereClauseSettings.md) - `selectBy`.
