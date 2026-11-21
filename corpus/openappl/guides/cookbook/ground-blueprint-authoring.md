---
title: Ground blueprint authoring against the docs
---

# Ground blueprint authoring against the docs

A meta recipe: how an AI agent (or human author) uses the language
documentation to write a correct **project blueprint** the first time:
no field-name hallucinations, no aspirational config blocks. It draws on
**two** kinds of page:

- the **narrative guides** (this guide tree and its cookbook recipes), to
  understand the **logic**: concepts, how-tos, and how features fit
  together;
- the **pattern reference** ([`openappl.json`](../../../openappl.json) and
  the [pattern reference pages](../../spec/all-patterns.md), with the
  [ontology overview](../../ontology/index.md)), the **discipline**: the
  exact blueprint SHAPE for a pattern and the purpose of every property
  in it.

> **Audience.** AI agents and humans writing their own blueprint JSON.
> The flow is the same either way.

## Three artefacts, three names

| Term | What | Who edits it |
|------|------|--------------|
| **Ontology** | The language's pattern catalog: `Project`, `DataObject`, `BusinessApi`, … (the schema in `openappl.json`) | The language specification only |
| **Blueprint** | A project's JSON file, an instance of the ontology | You / your AI agent |
| **Spec** | A project / service / data-object design narrative in markdown | You (often as prompt input) |

Specs are prose. Blueprints are JSON. The blueprint is what a compiler
compiles; the spec is what humans (and AI agents) read first to
*understand* the project. This recipe is about authoring the
**blueprint**: never "the ontology" or "ontology JSON". The same
convention holds for any tooling that reads, writes or validates a
project: it reads, writes and validates the project's blueprint.

## The flow

```
find the guide     →  narrow by intent  →  read the most-relevant guide page (LOGIC)
                                        →  read the pattern reference page(s) (SHAPE)
                                        →  copy the JSON shape verbatim
                                        →  validate before persisting
```

Five small steps.

The split is the whole point: the **narrative page** tells you *why*
and *when* to use a feature; the **pattern reference page** tells you the
exact field names, types, and each property's purpose so the JSON you
write actually compiles. Skip the pattern reference step and you are back
to guessing field names from memory.

## Step 1: find the guide

Start from the [guides index](../index.md), which groups the pages by
topic, and from the cookbook recipes in this folder. When you do not know
the page, search the corpus for 2-4 keywords rather than a full question:
the page titles and file names carry the vocabulary (`payment` finds
`add-payment-checkout.md` even when "payment" is missing from a body).

## Step 2: narrow by intent

The most useful page is almost always the one whose title matches your
*intent* (the verb you are about to perform), not the one with the most
keyword density:

| You want to … | Right page |
|---------------|------------|
| Configure a new provider | the capability page for the feature (for payments, [Payment workflow](../capabilities/payment-workflow.md)) |
| Pick between providers | the provider behaviour pages (for payments, [payment providers](../providers/payment.md)) |
| See per-provider field requirements | the provider page for the brand |
| Author the blueprint shape for one feature | the cookbook recipe for it |
| Look up a pattern class's field list | the pattern reference page |

Cookbook recipes ship grounded blueprint snippets; pattern reference
pages are the authoritative field list for the schema. Most authoring
sessions need both: the narrative page for the logic, the pattern
reference page for the shape.

## Step 3: read the full page

Read the whole page before you write blueprint JSON; partial reads bite
when the page has a "variations" section that is nominally relevant but
uses a different shape.

The narrative page gives you the **logic**: what the feature does and
when to reach for it. It does *not* guarantee the field names are
current. For the authoritative shape, go to the pattern reference page
next.

## Step 4: read the pattern reference page for the exact shape

The narrative page told you *which* pattern to use (for example a
`DataObject` with `checkout` settings, or a `BusinessApi` with a
`FetchObjectAction`). Now open the **pattern reference page** for that
pattern: it is the authoritative, field-by-field SHAPE plus the purpose
of every property.

If you do not know the exact pattern name, start from the
[pattern reference list](../../spec/all-patterns.md) (every pattern: name,
level, one-line description) or from the schema file
[`openappl.json`](../../../openappl.json).

If you are starting from a blueprint *path* rather than a pattern name,
for example you know you are writing under
`services/shop/dataObjects/Order/objectSettings/checkout` but not which
pattern class owns it, walk the schema from the root: each property of a
pattern has a type that names the pattern below it, so the path resolves
to one owning pattern page.

A pattern reference page returns more than a field list. It carries the
property table (name, type, required, default, allowed values), the
**Constraints** (the validation rules, with the code a validator reports),
the **Migration** notes for deprecated and relocated properties, and an
**Example**. So a single page gives you both the discipline (every
property's name, type, and purpose) **and** a worked example. That is the
page to copy field names from.

> Related reading: the [ontology overview](../../ontology/index.md)
> explains how the patterns are arranged by level.

## Step 5: author and validate the blueprint patch

Copy the JSON shape from the recipe verbatim. Edit only the parts that
differ from the example for your project. **Before saving** the
blueprint patch, validate it with the compiler's validator: against the
whole project, or against the sub-tree you are about to write (the path
of the owning pattern plus the data you intend to write).

Validation runs the full ontology check against your blueprint patch;
any field-name drift, type mismatch, or required-field omission
surfaces with the path of the violation. Don't skip this step: it's
the difference between "the agent thought it knew" and "the agent
confirmed".

## What NOT to do

- **Don't scaffold empty keys.** Sparse payloads are the canonical
  authoring form: include only the action-type arrays and workflow
  phases you populate (omitted arrays normalize to `[]`), and omit (or
  `null`) unused optional subobjects: never send `[]` for an
  object-typed subgroup. See the
  [authoring canon](../workflow/overview.md#authoring-actions-and-workflow).
- **Don't author from training-time memory of "what a payment config
  looks like."** The shape of the language evolves past what is in any
  model's training data. Always read the pattern reference page first.
- **Don't fetch the pattern reference page alone for new authoring.** The
  pattern pages list every field and carry an example, but the narrative
  page is what tells you *whether* a feature is the right one for your
  intent and how it composes with the rest of the blueprint. Pair the
  pattern reference page (shape) with a cookbook recipe or system-services
  page (logic).
- **Don't skip the pattern reference step (Step 4).** Authoring from a
  cookbook snippet alone is how stale or partial field names sneak in;
  the pattern page is the authoritative shape and confirms each
  property's purpose.
- **Don't skip step 5.** A clean validation is the cheapest feedback loop
  you'll get; treating it as optional means the next feedback is the
  runtime error in the generated service.
- **Don't say "I'm patching the ontology"** when you mean "I'm patching
  the project's blueprint". The ontology is fixed by the language
  specification; only the blueprint is yours to edit.

## See also

- [Guides index](../index.md)
- [Pattern reference](../../spec/all-patterns.md) and the
  [schema](../../spec/openappl-json.md)
- [Constraints](../../spec/constraints.md): the validation rules and codes
  every pattern page lists.
