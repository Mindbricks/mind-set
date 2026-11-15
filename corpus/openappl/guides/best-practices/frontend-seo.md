---
title: Public SEO for your frontend
---

# Public SEO for your frontend

The frontend is an application the project owns; the examples here assume a
single-page application built to static files and served by a web server such as
nginx. The blueprint describes the backend and may carry a frontend briefing, but
it does not generate the frontend app, its container image or its web server
configuration. A plain SPA fallback can answer `200 index.html` for `/robots.txt`,
`/llms.txt` and `/sitemap.xml`, and supplies no per-route metadata before
JavaScript runs. Most AI crawlers do not run JavaScript. Unprefixed paths on the
page host go to the frontend.

## Static public files

Ship real `public/robots.txt` and `public/llms.txt` with the static build.
For example:

```text
User-agent: *
Allow: /
Sitemap: https://<page-host>/sitemap.xml
```

`llms.txt` describes the site and links its key public pages. Configure the web
server so missing static files answer 404 rather than HTML from the SPA fallback.
The live `/sitemap.xml` route below needs its own proxy handling.

## Live sitemap and route fragments

Use project-authored backend **EdgeController** functions to return a live XML
sitemap and per-route HTML head/body fragments. The frontend's web server exposes
the sitemap on the page host with a reverse proxy, and uses server-side includes
(SSI) on `index.html` to include the head and body fragments for each mapped public
route. The SSI form is `<!--# include virtual="<project-owned-fragment-path>" -->`;
this is an architecture sketch, not a ready web server configuration.

The project owns the frontend route mapping and passes an explicitly mapped
route/path query to its edge functions. Do not derive page URLs from object
names or assume an edge context `url` or `path` property. Edge controllers mount
under an `/edge` prefix by default; `edgeRestSettings.path` is relative to that
prefix, and query/body values reach `ctx.body`. No standard SEO routes are
generated. Return the existing `{ status, headers, body }` envelope with a raw
string body and an explicit XML or HTML Content-Type. A plain returned string is
JSON-serialized. Declare public auth mode only for intentionally public data.

Include only records a public visitor can read, with only public fields.
The project-authored functions own this public-read decision and the exact
frontend route names. Build absolute URLs on the page host, use `updatedAt` as
`lastmod`, and page a large sitemap through a sitemap index. The content models'
`GET /<service>-api/content/_sitemap` JSON feed can be one data source: it has no
host, covers routed public ContentModels only, and is not an automatic map of
actual frontend routes. Other public pages need the project's explicit mapping.

Fragments supply title, description, canonical, Open Graph, JSON-LD and a
minimal semantic body in the initial HTML. Escape data for its HTML/JSON
context, and serve the same public content to every user agent. A routed
ContentModel's `seo` object can supply metadata; `routingSettings.seoEnabled`
controls that object, not sitemap inclusion. The content feed lists
routed models with `publicRead` (singletons need an explicit `basePath`).

## Required proxy behavior and fallback

The web server configuration must **not forward visitor headers or cookies**,
Authorization, bearer tokens or user sessions to sitemap/fragment functions.
Explicitly suppress incoming request headers and forward only project-defined,
non-visitor metadata plus the mapped route query. Server defaults, or clearing
Cookie alone, do not satisfy this requirement. Public SEO output must not
change with a visitor's identity.

On **any upstream or SSI failure**, serve the plain SPA shell without a broken
fragment or an upstream error page. The project must implement and test this
fallback for both head and body includes as well as proxy failures; merely
enabling SSI does not provide the contract. Confirm addresses, TLS and routing
with the project's deployment configuration.

## Verify on a deployed environment

A development server that serves the static build with its own SPA fallback does
not exercise these proxy/SSI routes. On a deployed environment, check the static
text files, XML Content-Type and public URLs, initial route head/body HTML,
absence of visitor metadata upstream, and the plain-shell fallback for every
failure mode.

Declarative SEO settings and emitters in the language (public field/object
opt-in, tenant, private and soft-delete handling, paging/cost limits and a
declared route mapping) do not exist yet; until they do, the project-authored
edge functions above are the way.
