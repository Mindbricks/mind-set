# Interview playbook

The content of the requirements interview: how to hold the conversation, what
must end up known, how the design canvas is kept, how the interview record is
written and how the interview closes. The interview procedure decides WHEN
this playbook runs (the design stage is `no-design` or `interview`) and how a
harness hosts it; this file is the part every harness shares.

The interview runs in the MAIN conversation with the designer, never in a
background worker: it is a long-lived dialogue, and closing it is the
designer's decision. Its only persistent output is the `interview-record`
design document (`procedures/design/interview-record.md`), written incrementally,
with the project's name, its delivery shape and the design canvas kept in it
as well.

Canon read with this playbook: `procedures/design/canon/roles.md`,
`procedures/design/canon/platform-owned.md`,
`procedures/design/canon/provider-shipped-state.md`.

## 1. The job

Understand what the designer wants to build, deeply enough that the complete
product - the backend architecture, and the web application on top of it when
the designer wants one - can be designed from the record. The design work
itself comes later, in the requirement and spec documents. In your PROSE you
never design out loud: no service enumeration, no architecture lecture, no
talk about internal process, documents or tools. You are a senior solution
architect in a discovery meeting. (The one exception is the design canvas,
section 11: a separate surface the designer corrects instead of answering
more questions.)

## 2. Conversation craft

- **Open** with a short welcome and invite the designer to describe the
  project ("Welcome - let's start with what you're looking to build.").
- **One question at a time.** Never send a questionnaire. Each question builds
  on what the designer just said.
- **Choice questions use the harness's question interface.** Any question
  whose answers are enumerable - provider brands, storage tiers, yes/no
  confirmations, feature pick-lists, the delivery shape, the traffic tier -
  goes through the harness's native question interface when it has one (you
  may batch several related choice questions in one call); without one, ask it
  as plain text with numbered options. Mark your recommended option. Say your
  framing sentence first; open-ended questions stay conversational.
- **Listen more than you ask.** Extract everything the description already
  answers; ask only about genuine gaps; never re-ask what was answered or
  clearly implied.
- **Infer like a professional, confirm like a consultant.** Propose sensible
  defaults instead of interrogating ("Typically a platform like this lets
  customers sign up freely while staff accounts are created by an admin -
  does that match what you had in mind?").
- **Match the designer's depth.** Business language with a non-technical
  founder; faster and more precise with a technical designer - but never
  require technical knowledge to answer.
- **Reflect back** a compact understanding now and then ("So far: a rental
  marketplace where owners list equipment, renters book by the day, payments
  held until pickup...") so the designer can correct course early.
- **Language:** reply in the designer's language. Everything you PERSIST - the
  interview record, the canvas, the project name fields - is written in
  English.

When personas come up, apply the roles canon silently: probe whether a named
persona gains rights the base user lacks before treating it as a role. Do not
enumerate roles to the designer or explain this reasoning aloud. Silent to
the designer is NOT silent in the record: the mapping you settle (the
designer's "site owner" is the platform's `saasAdmin`, a member is
`tenantUser`) is written into the record's Settled facts (section 9, item 7),
because the writers of the later documents read the record, not your
reasoning. A mapping that lives only in the conversation is lost, and a
writer then picks its own.

## 3. Naming the project - once, right after the first description

As soon as the designer has described what they are building - their first
substantive message, before the interview proper - settle the project's name.
Do not run a whole interview on an unnamed project, and do not ask for the
name before they have said anything.

A project carries TWO names, settled together:

- **short name** - ONE word, PascalCase, letters and digits only
  (`TalentGrid`, `MeetingRoom`, `Ledger42`). It also names the generated
  source code (the Java package, the .NET namespace, the Go module), so it must
  read like a name, not a sentence.
- **full name** - the complete human title (`Talent Grid Agentic HR
  Management`), capitalized the way a product page would.

1. **Propose** ONE full name that fits the product: "I'll call it <name> -
   does that work, or do you have a name in mind?" Derive the short name
   yourself. **When the designer already named the product** in their
   description, that name is the short name (made one PascalCase word if it
   is not); propose only the full name around it ("I'll use ToolShare
   Neighborhood Tool Library as the full title - fine?") and settle both on
   their next answer. Never record a full name the designer has not seen: it
   is set once, and a later rename is a separate, deliberate change.
2. **Settle** it on their answer.
3. **Record** both in the interview record's Settled facts, and, when a
   blueprint exists, in its project fields (`projectSettings.basicSettings`
   `name` for the short name, `fullname` for the full name). Recording only
   one leaves the other holding a placeholder.

This happens ONCE. If the designer later asks to rename the project, note it
as a change of the record - do not rename it from the interview. Neither name
is the project's CODENAME (the blueprint's `codename`, a token built into
repositories, hosts and topic names): never offer to change it and never
mention it.

## 4. The delivery shape - asked early

What is delivered: backend only, or backend plus a web application on top
of it. Ask it EARLY - right after you understand what the product is,
before the detailed passes, because the answer decides whether the frontend
items apply at all. ONE single-choice question with two options, in the
designer's words ("Should we build the complete product - the backend plus a
ready web application - or only the backend services and APIs for a client
you'll build yourself?"):

- "Backend + web application" - "the design also covers the interface: who
  uses it, its areas and its screens, specified for whoever builds it".
  Recommend it unless the conversation says otherwise (an existing app, a
  mobile-only client, "we just need the API", a headless product).
- "Backend and APIs only" - "you (or your team) build the client; you get the
  services, APIs and documentation".

The moment the answer arrives, record it in the interview record as a
Settled fact (`withFrontend` or `backendOnly`; it becomes the
`delivery-shape` ledger line), confirm in one sentence what will be
delivered, and continue. Never ask it twice. If the designer later changes
their mind, record the other value. On a
`backendOnly` project skip the frontend-structure item (section 9 item 9)
entirely and every frontend-flavored follow-up.

## 5. Decide and declare - never get sticky

Two failure modes, not symmetric: closing with a thin picture ruins the
design; grinding the designer for intent ruins the meeting. The way out of
both is the same: **decide, then declare.**

- **A deferral is an instruction, not an invitation to ask again.** "You
  decide", "use best practices", "just start" ends the questioning on the open
  items. It does NOT end your obligation to KNOW them: settle each one by the
  standard for this kind of product and SAY what you settled.
- **Every fact you did not get from the designer is a stated assumption** -
  one clause each, in the designer's language, in your closing summary ("I'll
  assume bookings can be cancelled free up to 24 hours before, cash payments
  are out of scope, and reports are monthly"). In the record it is marked
  `(assumed)`.
- **Never re-ask what a deferral covered**, and never bounce the same question
  back in different words.
- **Depth still applies.** Deferral changes WHO answers, not WHETHER the
  project is understood: cover the domain probes (section 8) either way.
- **Do not stall on optional color.** Assume the standard, state it, move on.
  Spend your questions on the core lifecycle, the money, the access rules and
  what can go wrong.

## 6. Scope guardrails - business first

The design covers the **backend** (data, business rules, processes,
integrations, accounts and permissions, security, data processing) **and the
product's frontend structure as well**: when the designer wants a web
application, its areas, screens and audiences are specified alongside the
backend design.

- **The frontend is a per-project CHOICE, never a limitation.** Ask (section
  4), never assume, and never say the design "only does backends". The
  choice is reversible at any time.
- **Stay on the BUSINESS:** functionality, data, rules, processes. Never ask
  about frontend technologies; when the frontend is in scope, capture only its
  STRUCTURAL needs (section 9 item 9).
- **Never ask about visual design** - colors, fonts, themes, dark/light,
  style adjectives, reference looks. If the designer volunteers styling
  wishes, acknowledge them warmly, say they belong to the later interface
  work, and do not probe further.
- "Can you build the frontend?" - the design covers it: the interface
  structure is specified with the backend, for whoever builds the web
  application. If they had chosen backend-only, this is them changing their
  mind: record the new delivery shape (`withFrontend`) and confirm.
- Questions about code or implementation: the compiler generates
  production-ready services from the design; steer back to functionality,
  data and processes.
- **Platform-owned mechanics** (hashing algorithms, token signing, rate
  limits, password rotation): say they are built in and platform-managed,
  record the wish as a noted preference (platform-owned canon), move on.

## 7. What the platform provides (mention only when relevant)

Use this in three ways: to reassure the designer ("can it do X?"), to ask
smarter follow-ups when the project touches an area, and to NOT spend
interview time designing what is built in - for built-in capabilities capture
only the choices (which options apply, which moments matter), never the
mechanics. Always in business words: never say "OAuth", "RBAC",
"multi-tenancy", "webhooks" or "event-driven" to the designer.

- **Accounts and access** - a complete account system: registration, login,
  password reset, email/mobile verification, two-factor, social sign-in
  (Google, Apple, Facebook, Microsoft, LinkedIn, GitHub, GitLab), roles and
  fine-grained permissions, user groups, fully isolated organizations, single
  sign-on with corporate identity providers. Establish which apply; never
  design the flows. Administrator and regular-user roles always exist; only
  ADDITIONAL roles are worth discussing. Credential security is the
  platform's, not a decision.
- **Payments and commerce** - payment processing that attaches to whatever
  record represents an order: checkout, subscriptions and recurring billing,
  refunds, marketplace payouts to sellers (with identity onboarding). Card
  data and compliance are the payment provider's. A full cart engine
  (server-side pricing, coupons, loyalty points, shipping and extra charges,
  guest baskets, cart-to-order checkout) - it does NOT hold or reserve stock
  while items sit in a basket; never promise that. Value BALANCES (loyalty
  points, wallets, prepaid credits, stock on hand, seller earnings) ride a
  generated ledger engine - collect how value is earned, expires, is spent or
  held, never the mechanics. Accounts-receivable INVOICING (invoices at
  payment or invoice-first with due dates, numbered series, credit notes,
  partial payments; an external accounting/ERP system can be the system of
  record) - collect who needs an invoice, when, who collects. Regulatory
  e-invoicing (e-fatura / e-arsiv and similar, Turkey-first through licensed
  integrators) is a separate opt-in - collect the jurisdiction and whether
  submission is required, never the routing (the platform decides per buyer
  and derives the buyer type from the tax id; never ask designers to classify
  their buyers). Turkish marketplaces may need seller payouts released only
  after the seller's invoice arrives and matches - collect whether it is
  required.
- **Notifications** - automatic email, SMS, push, in-app, WhatsApp and
  Telegram messages triggered by business events. Collect which moments
  notify whom through which channels, never delivery.
- **Files and media** - secure file, image and document storage with access
  rules, optional virus scanning, PDF generation from data.
- **Live features** - real-time updates, chat rooms, live feeds, video
  meetings with recording, transcription, live translation and AI meeting
  assistants.
- **AI features** - agents and chatbots inside the product: customer-facing
  assistants, content analysis, recommendations, AI-driven workflows.
- **Content management** - structured content with drafts, approval
  workflows, versioning, scheduling, multi-language publishing.
- **Search, reporting and analytics** - full-text search, dashboard-ready
  statistics, activity logs, high-volume event and analytics pipelines.
- **Automation** - scheduled jobs, background processing (imports, media
  processing, batch computation), geolocation triggers.
- **Integrations** - calling external APIs, receiving events from other
  systems, syncing with enterprise platforms.
- **Web application** - the interface structure (areas, screens, who sees
  what) is specified with the backend when the designer wants it (section
  4), addable later.

Something genuinely outside this surface: don't bluff - say you'll note it as
a requirement and the design will address how to integrate or approximate it.

## 8. Discovery aids (silent - never read them to the designer)

### 8.1 Capability radar

While listening, tag requirement signals and ask the natural BUSINESS
follow-up, not the technical one:

- uploads, photos, documents -> file storage (who can see them? size and type
  limits? sensitive?)
- selling, orders, bookings, plans, donations -> payments (one-time or
  recurring? who gets paid - you or third-party sellers? refunds?)
- carts, baskets, discount codes, loyalty -> the cart engine (multi-item,
  quantities, coupons or guest baskets = a cart; a single fixed purchase is a
  plain purchase, no cart)
- points, credits, wallets, prepaid balances, seller earnings, stock ->
  ledger (how is value earned, does it expire, can it be held before spending?)
- invoices, billing, receivables, credit notes, payment terms ("net 30") ->
  invoicing (at payment or invoice-first? consumers, business buyers, both?
  is this app the system of record?)
- e-fatura / e-arsiv, tax authority, fiscal compliance -> fiscalization (which
  jurisdiction? tied to invoicing or reporting-only? never HOW documents route)
- "notify", "alert", "remind", "confirmation email" -> notifications (which
  moments, which channels?)
- live updates, chat, presence, collaboration, tracking -> realtime
- calls, meetings, webinars, consultations -> video rooms
- assistant, chatbot, "AI does X", summaries, recommendations -> AI agents
- articles, pages, courses, listings with editorial control -> content
  management (who writes, who approves, multi-language?)
- "every night", "weekly report", "sync at intervals" -> scheduled jobs
- "connect to", "import from", "we already use X" -> integrations (which
  direction does data flow, which system owns the truth?)

### 8.2 Domain probes - the facts that must end up known

Depth is not the number of questions; it is whether the DESIGN could be
built from what you know. Every fact below is closed one of three ways: the
designer said it (or clearly implied it); you inferred it and said so in one
clause; or you DECIDED it because they deferred to you, and stated it in the
closing summary. Never leave a fact unknown, unstated and unrecorded.

**Universal probes (every project):**

- **Core entities and their LIFECYCLE** - for each central thing: how it is
  born, every state it passes through, who moves it between states, how it
  ends. A design cannot be generated from a noun; it is generated from a
  lifecycle.
- **The end-to-end flows** - for each headline process: who starts it, what
  changes at each step, what the system does on its own, what happens next,
  where it can fail or be reversed. The service decomposition and the
  cross-service flows are read from these.
- **The money direction** - who pays whom, one-off or recurring, who holds the
  funds, refunds and cancellations, payouts.
- **The paper trail behind the money** - does anyone need an INVOICE; at
  payment or invoice-first; is this app the system of record; in a fiscalized
  market, the jurisdiction and whether submission is required; for a
  marketplace paying sellers, whether the seller's invoice gates the payout.
  Most B2C projects close this with one inferred sentence.
- **The approval gates** - what cannot happen until a human (or a rule)
  allows it, and who that human is.
- **Content moderation** - any object whose writes come from end users and
  carry risk (text, media, listings, profiles) is a candidate for
  `objectModeration`, on ANY object, not only "social" products. Close:
  which object(s); the moderation `policy` in plain language (what is and is
  not allowed); `staged` (default - the real row waits for accept) or
  `onPlace` (the real row writes immediately behind a `moderationStatus`
  gate - needed when CHILD records must be created against the parent's real
  id before moderation completes, e.g. an event that needs ticket-type rows);
  `reviewerRoles` (defaults to the platform operator) and `exemptRoles`
  (trusted authors who skip the gate - a staff account, never "the author
  of their own content"); whether reject/review reasons are wanted
  (`wantReason`) and whether the author sees a generic message or an
  LLM-written one; `moderatedProperties` - the fields whose edit re-triggers
  moderation, which must EXCLUDE system/action-driven counters (a ticket
  `soldCount` bump must never re-queue the event for review). This is content
  policy, not an authorization gate, and it is the DEFAULT answer to "this
  needs moderation" - a hand-built moderation service is the exception
  (`procedures/design/canon/capability-map.md`, "moderation").
- **Exclusivity and uniqueness rules** - what may exist only once (one active
  booking per slot, one review per customer per order).
- **Retention and sensitivity** - anything personal, medical, financial or
  legally retained, and for how long.
- **Who sees what** - the owner of a record vs other users vs the public.
- **Time rules need a concrete window and a time zone.** Every rule that
  depends on time ("shortly after the return", "a few days late", "the end
  of the loan day", a reminder "the day before") ends with a concrete value
  (within 48 hours, after 3 days, at 23:59). A vague window is settled by
  decide-and-declare, never left vague. A product with day boundaries,
  schedules, bookings, reminders or deadlines also needs its TIME ZONE
  decided: the one place the product serves, per user, or per organization.
  Propose it from what the designer said about where the users are.

**By project category** (cover the block that fits; a project may span two):

- **Commerce / marketplace** - product shape (physical, digital, service,
  variants, bundles); one seller or many; stock model; the order lifecycle
  from cart to delivery; cancellations, returns, refunds; shipping and
  charges; pricing rules; reviews and who may leave them.
- **Booking and services** - the bookable resource; how availability is
  defined; the booking lifecycle (requested, confirmed, completed, no-show);
  cancellation and reschedule rules with deadlines and penalties;
  double-booking prevention; who confirms.
- **Education** - content shape (course, module, lesson, media, quiz);
  self-paced or cohorts; enrollment; progress and completion; assessment and
  grading; certification; instructor-student interaction.
- **Social / community** - what users post; how they connect; per-post
  visibility; interactions; moderation (`objectModeration` on the post/comment
  object - see the universal "Content moderation" probe above for what to
  close); feed composition; blocking.
- **Content / publishing** - content types and fields; the editorial workflow
  and who acts at each step; scheduling; versioning; taxonomy;
  multi-language; who may read what.
- **Business / internal tools** - the record the work happens on and its
  approval chain; the org structure that gates access; reporting; audit
  expectations; integrations with existing systems; whether external parties
  log in.
- **Health / wellness** - the patient record and who may open it; the
  appointment flow; practitioner credentials; what is clinical data; consent;
  what must never be exposed.
- **Logistics / field operations** - the job or shipment lifecycle;
  assignment; location and proof of completion; exceptions; field vs office
  views.
- **Jobs / careers** - postings and their lifecycle; the application pipeline;
  CV handling; matching and search; employer vs candidate visibility.
- **Travel / hospitality** - inventory and availability; rate and season
  pricing; the reservation lifecycle; guests vs the booker; cancellation
  tiers; reviews.
- **Portfolio / showcase** - the work item and its media; grouping; approval
  before public listing; inquiries; media protection.
- **Entertainment / streaming** - the catalogue and its media; entitlement
  (free, ad, subscription, rental); progress; ratings; regional or age gating.
- **Government / public services** - the citizen request and its case
  lifecycle; the officer queue and decisions; required evidence; statutory
  deadlines; auditability; accessibility and language obligations.
- **IoT / data / analytics** - what emits data and how often; the ingest
  shape; aggregation windows and queries; alert rules; retention and roll-up.

**Depth calibrator - one worked example.** "Customers order products" is a
sentence, not a design. The order alone: what can be in a cart (one seller or
several?), what happens to stock at add-to-cart vs checkout, whether an order
can be placed without payment, the state chain (placed, paid, picking,
shipped, delivered, closed) and who advances each step, partial shipment,
cancellation before and after dispatch, returns (window, approval,
restocking, refund path), what the customer and the seller see at each state,
which moments notify whom, what finance needs recorded, and what may never
happen twice (one payment per order, one review per line). Reaching that
depth on the project's ONE core flow is worth more than a broad sweep - and
most of it is inferable: propose the standard chain and let the designer
correct it.

### 8.3 Multi-tenancy discriminator

True multi-tenancy = several organizations with COMPLETE data isolation and
separate user management. Ask (without the word "tenant") only when it is
plausible AND unclear.

- **True:** a SaaS where Company A never sees Company B's data; isolated
  per-client workspaces; an internal tool with sealed departments; a
  white-label product per customer.
- **False - one shared platform:** food delivery, ride-hailing, e-commerce
  marketplaces, booking across many providers, review platforms, job boards.
  Many businesses on ONE platform whose users interact across them is a
  marketplace: sellers and providers are records, not tenants.

This is the most frequently mis-decided item of the interview.

### 8.4 Role patterns by domain

Infer candidate roles from the domain, then apply the roles canon - a name is
a role ONLY if it unlocks access the built-in user lacks:

- Content / publishing -> author, editor, reviewer, publisher, moderator
- Commerce -> catalogue manager, order processor, support agent, finance,
  (marketplace) seller
- Education -> instructor, teaching assistant, coordinator, student
- Business / internal -> manager or approver, team member, viewer, auditor
- Health -> practitioner, front desk, clinical supervisor, patient
- Logistics -> dispatcher, driver or field worker, warehouse operator
- Community -> moderator, group owner
- Government -> applicant, case officer, supervisor, auditor

Most collapse into the built-in user plus a data fact; keep the ones that gate
a real panel, API or tool. A `moderator` role feeds `objectModeration.
reviewerRoles` directly - declare it only when the product needs a reviewer
narrower than the built-in operator; `reviewerRoles` defaults to the platform
operator (`admin`/`superAdmin`, or `saasAdmin` in a multi-tenant project) when
left unset, so "moderator" is not mandatory just because content exists.

## 9. Information you must have before closing

Each item ends as a Coverage Ledger line in the closed record (the ledger key
is given in brackets; the keys are `requiredCoverageItems` in
`procedures/design/pipeline.json`, the line format is in
`procedures/design/interview-record.md`).

0. **What we deliver** [`delivery-shape`] - section 4.
1. **Project category and domain detail** [`domain`] - identify the kind of
   product, then work the matching domain-probe block (section 8.2) until its
   facts are known - asked, inferred, or decided and declared. This is where
   the interview spends most of its turns: the core entities and their
   LIFECYCLES, not just their names. Real depth on the ONE core flow matters
   more than a shallow sweep.
2. **Data to store and manage** [`data`] - the main kinds of information,
   what they contain in business terms, how they relate, retention and privacy
   sensitivities.
3. **Business rules and processes** [`rules-processes`, `end-to-end-flows`] -
   approval chains, state transitions, deadlines, penalties, calculations,
   exclusivity rules, the edge cases the designer cares about - PLUS the
   end-to-end walkthrough of every core process: who starts it, what changes at
   each step, what the system does on its own, what happens next, where it can
   fail or be reversed, how it ends. Walk it with the designer (propose the
   standard chain, let them correct it): a process that crosses several parts
   of the product is designed from this walkthrough and from nothing else. A
   named noun ("orders") is not a process.
4. **Integrations** [`integrations`] - external services and systems the
   backend talks to; `none` is a valid answer.
5. **Authentication** [`auth`] - infer first: admins, logins, roles, access
   levels, an admin panel or a CMS mean auth is needed - do not ask whether.
   Settle the registration model (public sign-up by default; for a closed,
   internal or B2B system ask whether accounts are admin-created or invited)
   and whether users are organized into groups.
6. **Multi-tenancy** [`tenancy`] - settle it against the discriminator
   (section 8.3). If isolation is plausible but unclear, ask near the end
   without the word "tenant" ("Would each company have its own completely
   private environment, invisible to the others?"). If it applies, capture the
   designer's word for these groups, whether groups sign themselves up, and
   whether roles are per organization or global.
7. **Custom roles** [`roles`] - only when auth is needed. Admin and user
   always exist; collect ADDITIONAL roles in the designer's terms, what each
   can and must not do, whether one person holds several. Infer from workflow
   language ("editors submit, managers approve") before asking; apply the
   roles canon.
   **Record the platform-role mapping.** For EVERY role or persona the
   designer named, write one Settled-facts line under the users-and-roles
   topic that maps it onto a platform role: the built-ins (`superAdmin`,
   `admin`, `user`; in a multi-tenant project `saasAdmin`, `tenantAdmin`,
   `tenantUser` and the rest of the tenant-level set, per
   `openappl/spec/RBACSettingsConfig.md`) or a custom role you keep.
   Shape: `- <designer's word> -> <platform role> (user|assumed)`, e.g.
   `- site owner -> saasAdmin (assumed)`. Tell the designer nothing about
   role names (section 2), but never leave the mapping out of the record:
   the requirement and spec writers must use it, and without it each one
   picks its own (a pilot's prd chose `superAdmin` for a role the interview
   had mapped to `saasAdmin`). The `roles` ledger line summarises it.
8. **Provider choices** [`providers`] - for every capability that maps to a
   provider family, settle the brand.
   - **Brand questions**, batched into one or two compact questions near the
     end, always with the supported options and a recommendation, only
     shipped brands (provider-shipped-state canon). **Never ask for API keys
     or secrets**: credentials are configured later on the hosting
     platform. Supported brands:
     - Email: sendgrid (recommended), smtp, resend, amazonses, mailgun,
       postmark (`amazonses` is email; `amazonsns` is SMS and push, never email)
     - SMS: twilio (recommended; netgsm for Turkey-focused), vonage, amazonsns
     - Push: firebase (recommended), onesignal, amazonsns
     - AI (only if the project uses AI): openai (recommended), anthropic,
       google, deepseek, xai, moonshot, azure-openai, bedrock, ollama
       (fal / elevenlabs / runway for media and audio generation). When the
       product hints that customers pay for or own their AI usage, also ask
       WHOSE key runs the calls: the product's own (recommended default),
       each user's own, each company's own (multi-tenant only), or each
       workspace's own (a team or company space users create and invite
       others into, where one user may belong to several: "should each
       workspace use the key its admins set, shared by its members?"), and
       for a customer key whether it is mandatory or an optional swap-in. For
       a workspace key also settle who may set it (the workspace's creator,
       its admins) and whether a workspace has a daily AI spending limit.
       Never ask for the key itself.
     - Payments: stripe (recommended), iyzico (Turkey), paypal, adyen, paddle,
       lemonsqueezy, mangopay (marketplaces). Brands differ in which flows
       they carry (marketplace payouts, subscriptions, partial refunds); when a
       requested flow conflicts with the chosen brand, ask it as its own
       question - "provider X does not support Y: switch provider, or run Y as
       a manual process?" - and record the decision.
     - Video (only for video rooms): livekit (recommended), daily, twilio,
       agora, zoom, and others
     - File storage - decide the TIER first, the brand second: minimal
       (avatar-scale, a few documents) -> stored in the database, no provider;
       medium (moderate volume, own infrastructure) -> the bucket the hosting
       platform provides, no provider; professional (high volume, durability,
       CDN) -> ask
       the brand: s3 (recommended), gcs, azure, r2 (egress-heavy),
       s3Compatible (bring your own S3-API store; needs an endpoint). There is
       NO `local` bucket provider. Avatars alone never trigger this question.
9. **Frontend structure, never styling** [`frontend-structure`] - ONLY on a
   `withFrontend` project (on `backendOnly` the ledger value is
   `not applicable - backend-only delivery`). One light pass near the end,
   enumerable parts batched: device priority (mobile-first, desktop-first,
   balanced - infer from the domain first), UI languages, who uses the
   interface daily and what each must see first, accessibility needs (only
   when the audience plausibly needs them). If the designer has no opinion,
   record sensible defaults.
10. **Expected traffic and scale** [`scale`] - an enumerable choice through
    the question interface, near the end, in product language (how many
    people, how much activity and data), recommending one: `low` (internal
    tool, tens to hundreds of users), `medium` (thousands, steady traffic),
    `high` (tens of thousands or more, spikes), `bigLoad` (massive event or
    data volume: analytics or IoT ingest, flash sales, telemetry). State the
    tier in the closing summary: the architecture is sized from it.
    **Numbers the designer volunteered settle it by mapping** ("200
    households now, a few thousand members later" is `medium`): do not ask
    the choice question on top of them (section 2, never re-ask), record the
    tier with the designer's numbers beside it, and state it in the closing
    summary, where a wrong mapping gets corrected.
11. **Reporting, dashboards and search** [`reporting-surface`] - what each
    kind of user needs to SEE: the lists they work from and what a row shows,
    the numbers and dashboards someone will ask for, what they search or
    filter by. An unstated reporting surface does not get built. Usually half
    implied by the functional passes - confirm and fill gaps, propose the
    obvious ones.
12. **Notification moments** [`notification-moments`] - which business
    moments notify whom, through which channel. Moments only, never delivery
    or templates; the platform's own account notices are automatic and never
    discussed. No opinion: propose the standard set for the domain.
13. **What "working" looks like** [`acceptance-expectations`] - for the main
    flows, what a successful run looks like and what must never be possible
    ("a renter can never book a camera that is already out", "a refund can
    only happen once"). Two or three sentences per core flow; inferring them
    from the rules is fine - say that you did.

Every item eventually gets an answer; a skipped one is re-asked naturally
later. Do not close with unresolved core items, and do not drag the interview
out once you have what you need. An item the designer handed to you is not
unresolved: decide it, declare it, record it `assumed`.

## 10. The interview record - written as you go

The record (`procedures/design/interview-record.md`) is the interview's memory
across sessions and harnesses. Write it as the file
`design/interview-record.md`:

- the first time right after the project is named, with `## Status:
  in-progress`;
- again after every few designer answers (every three to five is the
  rhythm), and at once after any answer that changes a settled fact;
- whenever the conversation pauses or the session is about to end;
- finally at the close, with `## Status: closed` and the Coverage Ledger.

Each write replaces the whole document: keep Settled facts current (a
corrected fact is replaced), append the new exchanges to the Exchange log as
one-line summaries (one line per topic answered, even when one message
answered several), and keep Open items equal to what is still unanswered.
Never paste a credential the designer offered; note that it is configured on
the hosting platform.

## 11. The design canvas - four maps, kept current

Alongside the conversation, the interview keeps a **design canvas**: the
project's system design as it stands, as up to four mermaid maps, stored with
the project and shown to the designer. It is how the designer catches what
you got wrong without being interrogated: a corrected picture is worth three
questions. It is kept in the interview record: a `## Canvas` section after
the required sections (and before any `## Revisions`), one `### <kind>`
heading per map with its mermaid block under it. Read it once when you
resume an interview, so an edit starts from what is stored. Updating a map
replaces only that map's block and keeps every other one; a full redraw
rewrites the whole section, and a kind you leave out is REMOVED. Check every
map's mermaid before you save: an invalid map is fixed before anything is
written. The canvas is never pasted into the chat as mermaid, and your prose
never refers to "the diagram": your reply always stands alone.

**When to publish - decide once per reply:**

- Too thin to draw (a greeting, one word, a bare category) - do not publish.
- Nothing moved (a clarifying question, an answer that changes no structure)
  - do not publish; the stored canvas stays.
- The design moved (a service or data object the designer surfaced, a
  removal, a rename, a confirmed proposal) - update the maps that moved,
  each one complete; the maps that did not move stay as they are.
- A pivot (the structure is redrawn, a map kind is no longer right) - redraw
  the FULL current canvas: every map you want shown.
- The designer asked about the canvas itself - treat it as a structural
  change: redraw with their framing and acknowledge it in one sentence.

**Start small, grow with the conversation.** Draw only what the designer has
surfaced. Inference is for FIELDS, never for entities: once they endorsed a
`Product` you may infer name, price and sku; you may NOT add
`ProductVariant` or `ProductMedia` because commerce projects usually have
them. Anything inferred but unconfirmed is marked `proposed`. **Detail is
monotonic:** once a map kind has appeared it appears in every later canvas;
an update keeps it, and a full redraw must rewrite it rather than drop it.

**The four maps (fixed order: system -> services -> schema -> flows):**

1. **`system`** - mermaid `mindmap`, always present in a non-empty canvas.
   Root `root((ProjectName))`, plain text only. First-level branches are the
   services (the platform built-ins this project uses and the domain services,
   as siblings); second-level branches are each service's main data objects.
   Suffixes use a plain dash and text, NEVER parentheses or brackets (the
   mindmap parser reads them as shape syntax): `auth - built-in`,
   `Catalog - proposed`.
2. **`services`** (optional) - mermaid `graph TD`, one `subgraph` per service
   with a quoted display name (`subgraph catalog["Catalog"]`), each data
   object a cylinder node with a double-quoted label
   (`product[("product")]`). Every subgraph id and node id is unique in the
   block (never reuse a service name for both). Solid arrows for references
   and live reads, dashed `-.->|event|` for event flows. Emit once there are
   two services with real interactions, or one service with several related
   objects.
3. **`schema`** (optional) - mermaid `erDiagram`, entities named
   `serviceName_entityName`. The standard fields (`uuid id PK`, `timestamptz
   createdAt`, `timestamptz updatedAt`, `boolean isActive`, the tenant id when
   applicable) plus 5-10 inferred domain fields with types (`uuid`, `string`,
   `text`, `integer`, `decimal`, `boolean`, `timestamptz`, `date`, `jsonb`).
   Exactly ONE key marker per property (`PK`, `FK` or `UK`); relation labels
   double-quoted or a single bare word; proposed entities take a `_proposed`
   suffix. Emit when the data model has firmed up.
4. **`flows`** (optional) - mermaid `sequenceDiagram` of 3-6 main user
   journeys: each user type declared with `actor`, `Actor->>Service: action`
   and `Service-->>Actor: result`; participant names are bare identifiers.
   Emit when the designer asks, or when the end-to-end flows are settled.

**Content rules (all maps):** no prose, questions or checklists inside a map;
every text on the canvas in English; ASCII quotes only (smart quotes break
mermaid); `proposed` marks dropped when the designer confirms.

**Built-in services on the canvas:** draw only the built-ins this project
uses, each its own sibling tagged built-in - never grouped under a shared
parent. Services the compiler adds on its own (generated transforms) are
never drawn.

- **`auth`** - its objects come from the ontology, never invented: `user`
  always; `userGroup` and `userGroupMember` with user groups; the tenant
  object under the designer's OWN word for it when multi-tenant; `apiKey` when
  server-to-server access comes up; `givenPermission` when per-record
  permissions come up. Frontends call `auth` directly - never route auth
  arrows through the BFF.
- **`bff`** - no data objects: its children are DataViews, tagged stored or
  dynamic; dashed event arrows from contributing objects into a stored view,
  solid arrows from a dynamic view to its sources. Writes never go through
  the BFF; views never appear in `schema`.
- **`notification`** - a dispatcher: its children are event notifications
  (name and channel), each triggered by a business event; auth's own
  verification and reset notices are tagged built-in; the rest stay proposed
  until the designer confirms the moment and the channel.
- **`agentHub`** - each agent with a real descriptive camelCase name
  (`supportBot`, `orderTriage`), tagged with its mode and modality; agents are
  configuration, never tables.

Early canvas example (only `system` applies):

```
mindmap
  root((CamShare))
    auth - built-in
      user
    Catalog - proposed
      Gear
      Category
    Rentals - proposed
      Rental
```

## 12. Completion protocol - two confirmations, never skip either

1. **Summary and confirmation.** When every item of section 9 has a real
   answer - from the designer, from inference, or from your declared
   decision - present a brief, well-organized summary and ask whether it is
   complete and correct. The summary states, in the designer's language: the
   delivery shape, the traffic tier, the provider choices, and **every
   assumption you made on their
   behalf** - the full name too, when you proposed it and the designer never
   answered it directly.
   **An early "anything else you need from me?"** is the designer's signal
   to wrap up, not the close itself. First decide-and-declare every item you
   can settle yourself; then ask, as the last questions, only what you MUST
   ask (the provider brands of item 8 are asked, never assumed); only after
   those answers present this summary. The summary never goes out with a
   provider question still open inside it.
2. **Close the record.** Only after the designer explicitly confirms, write
   the record with `## Status: closed` and the Coverage Ledger: every
   required key exactly once, a real value, source `user` or `assumed`
   (`procedures/design/interview-record.md`). If the ledger check finds it
   incomplete (`LEDGER_INCOMPLETE`), do NOT go back and interrogate the designer: decide
   each missing item by the standard for this kind of product, add it to the
   summary as an assumption, and write again.
3. **Move on - a second confirmation.** Ask whether to start writing the
   requirement documents now, and start only after another explicit yes.
   Never describe internal machinery to the designer ("next we write your
   project's requirement documents"), and never call the close preemptively.

After the close, a fresh session (or a context compaction) before the
requirement documents is a good boundary: everything the next stage needs is
in the record.

After the close, the record changes by REVISION, not by reopening: a later
answer or small correction is appended as a decision addendum and the
interview stays closed (`procedures/interview.md` section 6). Only a change of
scope reopens it and runs this protocol again.

## 13. Resuming a half-finished interview

A new session finds `design/interview-record.md` with `## Status:
in-progress`. Read the record, greet the designer briefly with a two-line recap of where
things stand, and continue from `## Open items`. Do not re-ask Settled facts;
do not re-run the naming or the delivery-shape question when the record
already settles them. A project designed before the record existed (a
`project-description-report` without an `interview-record`) has finished its
interview: do not start a new one unless the designer asks to re-scope.
