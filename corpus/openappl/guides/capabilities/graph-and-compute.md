---
title: "Graph intelligence: combining the graph and compute layers"
---

# Graph intelligence: combining the graph and compute layers

Two of the heaviest capabilities of the language meet at one point. The
[**graph layer**](graph-layer.md) gives a service *relationship memory*: a property-graph
projection over its relational data objects, plus cheap traversal queries (reachability,
shortest path, access over a hierarchy, neighborhood). The
[**compute layer**](compute-layer.md) gives a service *heavy calculation*: asynchronous,
queued jobs that run matrix factorization, embeddings, ranking, batch scoring, community
detection or centrality on a curated recipe. They are **complementary, not alternatives**.
Used together they form what this guide calls a **Graph Intelligence Layer**: facts and
*computed* edges live together in the graph, the expensive learning happens offline in a
compute worker, and the request path stays a cheap traversal.

This page is the best-practice guide to coordinating the two. It assumes you have skimmed
the two sibling guides. The exact field and enum names live on the pattern pages,
linked throughout.

> **What this combines.** The graph layer (projection, edges, queries) and the compute
> layer (the async job lifecycle) are both first-class. The *declarative bridge* between
> them is the `graphIO` block on a `ComputeJob`
> ([ComputeJobGraphIO](../../spec/ComputeJobGraphIO.md)). Declaring `graphIO` produces the
> graph read (the input subgraph) and the computed-edge write-back around your job body.
> This page documents the declarative shape and also shows the hand-authored
> read, compute, write pipeline for jobs that need full control of the driver.

---

## Why Python is the meeting point

The compute layer has a hard rule: only **`rust`** and **`python`** services may *host*
compute work. That is the *only* restriction on compute. A compute host is still a full
service (data objects, data layer, business APIs, the lot); hosting compute is one extra
capability it carries. Every other language (Node, Java, Go, C#) *submits* a job over
machine-to-machine calls and reacts to its completion event rather than running the math
itself.

The hybrid needs **both** capabilities on the same host, because it reads the graph *and*
runs the heavy algorithm, and only **one** language hosts both. The
[graph layer](graph-layer.md) is available on every target with an official Neo4j driver
(Node.js, Python, Java, .NET, Go) but **not** on Rust. The compute layer is
**Rust/Python-only**. Intersect the two and exactly one language remains:

| | Hosts compute? | Hosts the graph layer? |
|---|---|---|
| **Python** | **yes** | **yes** |
| Rust | yes | no (no official Neo4j driver) |
| Node, Java, Go, .NET | no | yes |

So Rust, often the better pure-compute host, **cannot** be the graph-side host at all, and
the graph-hosting languages other than Python cannot run the job. The graph and compute
hybrid therefore lands on **Python**, the lone overlap.

It helps that **Python is also where the graph-intelligence ecosystem lives.** Graph
traversal answers *structural* questions cheaply in Cypher, but the moment you need a
*learned* or *iterative* analytic (PageRank, Louvain community detection, node2vec
embeddings, collaborative filtering, similarity) you reach for the data-science stack:
`networkx`, `igraph`, `scikit-learn`, `numpy`, `PyTorch`, `node2vec`. A Python host can
both read the graph and run the algorithm with mature, off-the-shelf libraries.

That is the literal sense in which "the graph layer and the compute layer meet at the
Python language."

---

## Graph vs compute vs hybrid: the decision table

Before reaching for the hybrid, decide whether you need it at all. Most questions are
answered by *one* layer.

| Your question | Reach for | Why |
|---|---|---|
| "Is user X connected to resource Y?" / "what's the shortest path?" | **Pure graph** (Cypher) | Structural, exact, real-time. A traversal, not a calculation. |
| "Can user X read this document, and *why*?" | **Pure graph** (`permissionExplain`, see [the graph layer](graph-layer.md)) | Access over a hierarchy is a path query; explainability is the path itself. |
| "Users who viewed the same docs also viewed..." (simple co-occurrence) | **Pure graph** (`recommendation` query spec) | Cheap one-hop-out, one-hop-back traversal. No model to learn. |
| "What's this account's risk score?" / "transform 10M rows" / "run ONNX inference" | **Pure compute** | Heavy calculation with no relationship structure to traverse. |
| "Recommend with a *learned* model (matrix factorization, embeddings)" | **Hybrid** | Structure (who viewed what) **plus** learning (latent factors). |
| "Detect communities / find central nodes in this network" | **Hybrid** (or in-graph graph-data-science, deferred) | Iterative graph algorithm over a subgraph; results persist as edges. |
| "More like this" by content or category similarity | **Hybrid** | Embeddings and cosine similarity computed offline, served as edges. |

The rule of thumb: **structure only: graph. Calculation without structure: compute.
Structure *and* learning: hybrid.** And keep the heavy work off the request path:
precompute edges in a job, serve cheap reads.

---

## The read, compute, write pattern

This is the core of graph intelligence. Five steps:

```
 1. relational writes  --(fire-and-forget projection)-->  GRAPH
                                facts:  (:User)-[:VIEWED]->(:Document)
                                        (:User)-[:MEMBER_OF]->(:Group)
                                        (:User)-[:PURCHASED]->(:Product)
                                        (:Folder)-[:CONTAINS]->(:Document)
                                                  |
 2.  a (nightly / batch) PYTHON ComputeJob  READS a subgraph
        via a named GraphQuery / the graph query runner
                                                  |
 3.  it runs the heavy algorithm in Python
        (matrix factorization, clustering, centrality, embeddings)
                                                  |
 4.  it WRITES results back as COMPUTED EDGES
        (:User)-[:RECOMMENDED {score: 0.92, reason: "..."}]->(:Document)
                                                  |
 5.  a cheap GraphQuery serves the top-N pre-computed edges
        at REQUEST TIME: no compute on the hot path
```

Step 1 is ordinary graph projection: a `graphProjection` block on the data objects and
`graphEdge` blocks (or edge objects) project facts into the graph on every write,
fire-and-forget. See the [graph layer guide](graph-layer.md).

Steps 2 to 4 are the compute job. The [`graphIO`](../../spec/ComputeJobGraphIO.md) block
declares the read end ([GraphIORead](../../spec/GraphIORead.md)) and write end
([GraphIOWrite](../../spec/GraphIOWrite.md)) and produces the read and write-back around
your algorithm, or you author them by hand for full control. Both are shown below.

Step 5 is an ordinary [GraphQuery](../../spec/GraphQuery.md) served at request time.
Because step 4 already wrote the `RECOMMENDED` edges, step 5 is a one-hop
`MATCH ... ORDER BY score DESC LIMIT N`: no model, no calculation, just a read.

**The key architectural property:** computed edges are *first-class graph data*. They sit
beside the projected facts, are traversable like any edge, and are served by the same
query surface. The expensive part happened offline.

---

## The declarative shape

The way to express the read and write ends is the `graphIO` block on a
[ComputeJob](../../spec/ComputeJob.md). It sits beside the job's existing `input` /
`result` blocks and swaps the I/O ends without inventing a new job taxonomy: the job keeps
its normal `type` and `spec` (one of the curated archetypes) and only gains a graph input
and a computed-edge output.

```jsonc
// service.computeJobs[]: a ComputeJob with graph input + computed-edge output
{
  "jobBasics": {
    "name": "documentRecommendations",
    "type": "optimization",            // ComputeJobType: the curated archetype
    "executionMode": "job"             // async, queued, batch / nightly (the default)
  },
  "spec": { "optimization": { /* matrix-factorization recipe: OptimizationSpec */ } },

  "graphIO": {                         // ComputeJobGraphIO (optional, beside input/result)
    "provider": "mainGraph",           // -> a projectSettings.graphProvidersSettings.graphProviders[].name
    "reads":  { "query": "viewedSubgraph" },              // GraphIORead -> a graphLayer.queries[].name
    "writes": { "relationshipType": "RECOMMENDED",        // GraphIOWrite
                "from": "user", "to": "document",
                "edgeProperties": ["score", "reason"] }
  }
}
```

What each field means ([ComputeJobGraphIO](../../spec/ComputeJobGraphIO.md)):

- **`provider`**: the named graph connection this job reads from and writes to.
- **`reads`** ([GraphIORead](../../spec/GraphIORead.md)): `query` names a declared
  [GraphQuery](../../spec/GraphQuery.md) whose result subgraph is the job's input (for
  example the `VIEWED` bipartite subgraph).
- **`writes`** ([GraphIOWrite](../../spec/GraphIOWrite.md)): `relationshipType` is the
  [GraphEdge](../../spec/GraphEdge.md) the job writes back; `from` and `to` are the
  endpoint node labels; `edgeProperties` are the computed properties placed on each edge.

> **What this produces.** From the `graphIO` block the compiler generates the driver read
> for the named query (the input subgraph) and the computed-edge write-back around your job
> body, so the body shrinks to the algorithm in the middle. The `reads.query` names the
> [GraphQuery](../../spec/GraphQuery.md) whose subgraph is fed in; the `writes` block
> describes the [GraphEdge](../../spec/GraphEdge.md) the job `MERGE`s back, with the listed
> `edgeProperties`.

### Hand-authoring the read and write (full control)

When a job needs to drive the graph itself (a custom traversal, a multi-query read, a
bespoke write pattern), a Python `ComputeJob` can do the read and write in its own body
instead of, or alongside, `graphIO`. Use the `custom` archetype (or any archetype whose
`spec` carries your recipe) and, inside the worker:

1. **Read the subgraph.** Either call the service's generated graph query runner for a
   named [GraphQuery](../../spec/GraphQuery.md) (the same `viewedSubgraph` you would name
   in `reads`), or open the graph driver for the provider and run the parameterized Cypher
   directly. Either way, **scope the read to the tenant**: pass `tenantId` and filter on
   it, exactly as the generated queries do.
2. **Compute** in Python with the library of choice (`networkx`, `scikit-learn`, `numpy`,
   `node2vec`, ...).
3. **Write computed edges back** through the graph write path: `MERGE` the `RECOMMENDED`
   (or `SAME_COMMUNITY` / `FLAGGED_ACCOUNT` / `SIMILAR_TO`) edges with their computed
   properties. Declare the target edge as a standalone
   [GraphEdge](../../spec/GraphEdge.md) on the service so the registry knows its shape and
   the serving query can traverse it.

Even when you hand-author the body, keeping a `graphIO` block on the job documents the
read and write contract and lets the generated plumbing handle whichever end you do not
take over yourself.

---

## Worked examples

Each example follows the same five-step shape: **facts projected, the GraphQuery that reads
the subgraph, the Python algorithm, the computed edge written back, the request-time query
that serves it.**

### 1. Collaborative-filtering recommendations

- **Facts projected.** `(:User)-[:VIEWED]->(:Document)` and
  `(:User)-[:PURCHASED]->(:Product)`, projected fire-and-forget on every view or purchase
  write.
- **Read.** A `viewedSubgraph` [GraphQuery](../../spec/GraphQuery.md) returns the
  tenant-scoped `(User)-[:VIEWED]->(Document)` bipartite edges as rows.
- **Compute (Python).** Build the user-by-item interaction matrix; run matrix factorization
  (or item-item co-occurrence, or implicit ALS) to get a predicted score for every (user,
  unseen document) pair.
- **Write back.** For the top results per user, `MERGE`
  `(:User)-[:RECOMMENDED {score, reason}]->(:Document)`.
- **Serve (request time).** `MATCH (u:User {id})-[r:RECOMMENDED]->(d:Document) RETURN d
  ORDER BY r.score DESC LIMIT 20`: a one-hop read, no model in the request path.

> The pure-graph alternative (a `recommendation` `GraphQuery` spec: "users who viewed the
> same docs also viewed...") is right for **simple co-occurrence**. Reach for the hybrid
> only when the recommendation is a *learned* model.

### 2. Community detection

- **Facts projected.** A co-authorship or interaction network, for example
  `(:User)-[:CO_AUTHORED]->(:User)` or `(:User)-[:INTERACTED_WITH]->(:User)`.
- **Read.** An `interactionSubgraph` query returns the tenant-scoped edge list.
- **Compute (Python).** Load into `networkx` or `igraph`; run **Louvain** (or label
  propagation) community detection; each node gets a `communityId`.
- **Write back.** `MERGE (:User)-[:SAME_COMMUNITY {communityId}]->(:User)` for nodes
  sharing a community (or set a `communityId` property on the node).
- **Serve.** "People in your community": `MATCH (u:User {id})-[:SAME_COMMUNITY]->(p:User)
  RETURN p`.

### 3. Centrality and fraud risk

- **Facts projected.** A transaction network: `(:Account)-[:TRANSFERRED_TO]->(:Account)`,
  plus shared-device and shared-person edges.
- **Read.** A `transactionNetwork` query returns the tenant-scoped transfer graph.
- **Compute (Python).** Run **PageRank** or betweenness centrality (or a ring-detection
  pass) to score how central each account is to suspicious structure.
- **Write back.** `MERGE (:Account)-[:FLAGGED_ACCOUNT {riskScore, reason}]->(:RiskBucket)`
  or set a `riskScore` property on the account node.
- **Serve.** "High-risk accounts": `MATCH (a:Account) WHERE a.riskScore > $t RETURN a
  ORDER BY a.riskScore DESC`.

> This pairs naturally with a `risk-calculation` compute spec
> ([ComputeJobBasics](../../spec/ComputeJobBasics.md) `type: risk-calculation`) and its
> sealed audit trail: the centrality pass surfaces *who* to scrutinize; the
> risk-calculation job produces the auditable score. Structure feeds the calculation.

### 4. Entity embeddings and similarity ("more like this")

- **Facts projected.** A content and category network, for example
  `(:Document)-[:IN_CATEGORY]->(:Category)` and shared-tag edges.
- **Read.** A `contentNetwork` query returns the document, category and tag subgraph.
- **Compute (Python).** Compute node embeddings (`node2vec` over the graph, or content
  embeddings from text); then **cosine similarity** between document vectors to find
  nearest neighbors.
- **Write back.** `MERGE (:Document)-[:SIMILAR_TO {score}]->(:Document)` for the top-K
  neighbors of each document.
- **Serve.** "More like this": `MATCH (d:Document {id})-[s:SIMILAR_TO]->(o:Document)
  RETURN o ORDER BY s.score DESC LIMIT 10`.

---

## Best-practice guidance

**Keep heavy work off the request path.** The whole point of the hybrid is that the
expensive learning runs in a batch job and the request is a one-hop read of pre-computed
edges. Never compute a recommendation, run PageRank or factorize a matrix *during* a
request. If you find yourself wanting to, you want a job, not a query.

**Computed edges are a projection, not a source of truth.** A `RECOMMENDED` or
`SAME_COMMUNITY` edge is *derived*: exactly like the projected facts, it is rebuildable.
Recompute it on a schedule; never let business logic treat it as authoritative state. If
the computed edges are wrong or stale, rerun the job; nothing downstream should depend on
them being permanent.

**Recommendations are eventually fresh, not instant.** The compute job is asynchronous
(`executionMode: "job"`, the default for batch and nightly work). The graph reflects the
*last batch run*, not the user's most recent click. Choose the cadence (nightly, hourly)
to match how fresh the results need to be; for near-real-time, the answer is usually a
cheaper pure-graph query, not a faster job.

**Tenant-scope the subgraph read.** Always pass and filter on `tenantId` when reading the
subgraph, and write computed edges within the same tenant boundary. The generated graph
queries inject a `tenantId` predicate; your hand-authored read must do the same, or you
will leak one tenant's structure into another's recommendations.

**Choose the layer by question shape, not by habit.** Re-read the decision table above
before building a hybrid. A surprising number of "recommendation" and "who's connected"
needs are answered by a single Cypher traversal with no compute job at all, and a
surprising number of "scoring" needs have no relationship structure and want pure compute.
The hybrid is for the genuine overlap: *structure plus learning.*

**Where Neo4j graph-data-science fits (deferred).** Community detection, centrality and
PageRank can also run *inside* Neo4j through its Graph Data Science library (a
`graphAlgorithm` query spec, deferred). Rule of thumb: if the algorithm ships in that
library and the graph fits Neo4j's working set, the in-graph route avoids the round-trip;
if you need custom ML, embeddings or out-of-core data, use a Python compute job that reads
the subgraph and writes scores back. Either way the results land as graph edges or
properties, so the serving path is identical.

---

## See also

- [Graph layer guide](graph-layer.md): projection, edges, the GraphQuery surface, and the
  explainable-authorization flagship.
- [Compute and calculation layer](compute-layer.md): the async job lifecycle, the curated
  archetypes, and the Rust/Python host rule.
- [The compiler specification](../../compiler/index.md): why only Rust and Python host
  compute, and how every other language submits over machine-to-machine calls.
- Patterns: [ComputeJob](../../spec/ComputeJob.md),
  [ComputeJobGraphIO](../../spec/ComputeJobGraphIO.md),
  [GraphIORead](../../spec/GraphIORead.md), [GraphIOWrite](../../spec/GraphIOWrite.md),
  [GraphQuery](../../spec/GraphQuery.md), [GraphEdge](../../spec/GraphEdge.md).
