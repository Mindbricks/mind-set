---
title: Native kernels (C/C++ via FFI)
---

# Native kernels (C/C++ via FFI)

Some capabilities cannot be written in the service's language and cannot be ported: a
CUDA/oneAPI/MKL routine, OpenCV, a proprietary physics or finance kernel, an HPC library
with no equivalent in the service's language. You do not want to generate a *C++ service*
for that: C++ has no canonical build and dependency story and the web layer is all niche.
You want to **call an existing C/C++ library** from a service generated in some other
language.

A **`NativeKernel`** is exactly that mechanism. It is a thin `extern "C"` **shim** that
wraps an existing native library and is **compiled and linked directly into the consuming
service**: in-process FFI, zero IPC, no network hop. OpenAPPL owns *only* the shim signature
and its body; a compiler never parses, translates, or re-implements the C++ library. The
kernel is declared on the service library's `nativeKernels[]` and called from MScript like
any other helper:

```js
LIB.computeShippingBatch(this.weights, this.zone)
```

This is **not** a "C++ service language": there is no such target. A kernel is a narrow
function surface, not a service. It exists for the one honest reason to reach for C++: *a
specific library must be linked that the service's language cannot provide.* If you cannot
name such a library, write a [service library](../../spec/ServiceLibrary.md) function
instead.

> **Audience.** An AI agent or human author who needs to link a specific native library
> into a generated service. This is the deep conceptual guide; the
> [`NativeKernel`](../../spec/NativeKernel.md) and [`ServiceLibrary`](../../spec/ServiceLibrary.md)
> reference pages give the field-level contract. How a given compiler builds and loads the
> shim per target language is described in
> [the compiler specification](../../compiler/index.md).

---

## Four things called through `LIB.<name>(...)`, four resolutions

A kernel shares its call syntax with three other constructs. They look identical in a
blueprint (`LIB.foo(...)`) but resolve very differently, and choosing the wrong one is the
most common mistake. Read this table before anything else:

| Construct | What you author | Runtime shape | Crash safety | Use when |
| --- | --- | --- | --- | --- |
| **`NativeKernel`** | a tiny `extern "C"` C/C++ **shim** over an *existing* native library | request-time FFI call, **in-process**, off-thread (`async`) | **None**: a segfault or out-of-memory kills the whole service (no sandbox) | you must link a specific C/C++ library that has no equivalent in the service's language |
| **`CustomSpec`** (compute layer) | your own **native Rust/Python source** | long-running **async job** on a bounded worker pool | crash-guarded: a fault fails the *job*, not the service | heavy/long compute you author, run cross-request as a job |
| **`Calculation`** (compute layer) | MScript or a curated **recipe** over a well-known crate | request-time bounded math, inline or off-thread | runs as native Rust/Python; bounded | small/bounded math that belongs *inside* a request |
| **`LibModule` function** | code in the **service's own language** | in-process call from the target-native `moduleBody` key (never bridged; a missing key emits a failing stub) | normal language exceptions | ordinary reusable logic, parsers, helpers |

The dividing lines:

- **Kernel vs CustomSpec** is the sharpest. A kernel wraps *existing, un-authored C/C++* and
  runs **in-process at request time with no crash guard**. A `CustomSpec` is *native
  Rust/Python source you write*, run as a crash-guarded **job** off-thread on a bounded
  pool. See [the compute layer](compute-layer.md) for the contrast in depth.
- **Kernel vs Calculation**: both are request-time; a `Calculation` is a curated math
  primitive in Rust/Python, a kernel is your shim over foreign native code.
- **Kernel vs function**: a function is the service's *own* language. A kernel is foreign
  native code with a C ABI seam.

Only `NativeKernel` has no crash guard. That is the intentional, honest cost of in-process
FFI; everything below exists to keep that boundary small.

---

## The C-ABI invariant

C++ has no stable ABI, so the **universal contract for every host language is an
`extern "C"` shim**. The compiler generates and owns that C-shaped contract; it binds to the
C++ library only through the shim you author. Two rules fall out, and the generated bindings
enforce both:

1. **No exception crosses the ABI.** The generated shim wraps your body in `try/catch` and
   returns a **status code (0 = ok, non-zero = error) plus an error buffer**. Host wrappers
   turn a non-zero status into the host language's error (a Rust `Result`, a JS `throw`, a
   Go `error`).
2. **Explicit memory ownership.** The default is a **caller-allocated** output buffer sized
   from the inputs; the generated host wrapper allocates and decodes it.

Data crosses as **flat scalars, numeric buffers, raw bytes, and UTF-8 strings**, never host
objects.

### Value types (`KernelValueType`)

A [`KernelParam`](../../spec/KernelParam.md) type and the kernel `returns` type are drawn
from this flat set:

| Type | C ABI shape |
| --- | --- |
| `f64` `f32` `i64` `i32` | the matching scalar (`double`/`float`/`int64_t`/`int32_t`) |
| `bool` | `int32_t` |
| `string` | `const char*` (UTF-8, NUL-terminated) |
| `bytes` | `const uint8_t* ptr` + an injected `size_t <name>_len` |
| `f64[]` `f32[]` `i64[]` `i32[]` | `const <elem>* ptr` + a single injected `size_t n` (the first buffer param sizes them all) |

A buffer **return** is a caller-allocated `<elem>* out` whose length is the same `n`, so a
buffer-returning kernel must have a buffer input to size the output. The signature always
ends with `char* err, size_t err_len`.

> **Deferred:** a `string` *return* (and other rich C++ return types such as
> `std::vector<std::string>` or classes) is **not lowered in v1**; it raises an
> `UNSUPPORTED_RETURN_TYPE` warning. v1 returns are scalars and numeric buffers only.

---

## Declaring a kernel

A [`NativeKernel`](../../spec/NativeKernel.md) lives at `services[].library.nativeKernels[]`:

| Field | Meaning |
| --- | --- |
| `name` | camelCase; the MScript name (`LIB.<name>`) and file basename. |
| `lang` | `KernelLang`: `cpp` (default) or `c`. |
| `params` | ordered [`KernelParam`](../../spec/KernelParam.md)[] (flat types only). |
| `returns` | a `KernelValueType`. |
| `includes[]` | headers of the existing library the shim `#include`s. |
| `links[]` | linker names of the existing system library or libraries, for example `blas`, `fftw3`. |
| `sources[]` | [`KernelSource`](../../spec/KernelSource.md)[]: the library's own source when it is not in a package manager. |
| `hostBindings[]` | `KernelHostBinding`: `rust` \| `nodejs` \| `golang` \| `java` \| `dotnet` \| `python`. Defaults to the consuming service's language. |
| `async` | default `true`: dispatch off the request thread. |
| `shimBody` | the C/C++ body you author, the *only* native code per kernel. |

`shimBody` sees the params by name, plus `n` (buffer element count), `out` (the
caller-allocated output), and `err`/`err_len`. Keep it tiny: it is a wrapper, never a paste
of the library's own source.

### Getting the existing library into the build

The shim wraps an *existing* library; that library's code reaches the build by one of two
routes:

- **Package manager**: for a well-known library (OpenCV, FFTW, BLAS), declare it once on the
  service via `serviceBasics.packages[]` (see [`Package`](../../spec/Package.md)) with a
  native manager (`vcpkg` / `conan` / `apt`). The compiler provisions it into the build
  image; you list its linker name in the kernel's `links`.
- **Source reference**: for a small, proprietary, or agent-authored routine that is in no
  registry, carry its source via the kernel's `sources[]`. Each
  [`KernelSource`](../../spec/KernelSource.md) has an `origin`, a `ref`, and a `dest` under
  the service's `native/` folder:

  | `origin` | `ref` is... | Status |
  | --- | --- | --- |
  | `bucket` *(preferred)* | a bucket object key in the project's bucket | **Deferred**: bucket-origin resolution is not available in every compiler yet; today use `url`/`git`/`inline`. |
  | `url` | an HTTPS URL | `sha256` **required** (the compiler verifies and fails on mismatch). |
  | `git` | a git remote (optionally `#ref`) | `sha256` **required**. |
  | `inline` | the literal content in `ref` | Only for a tiny single-file header. |

  The compiler fetches each into `native/<dest>` at generation time. `extract: true` unpacks
  a `.tar.gz`/`.zip` archive into `dest`.

Whichever route, **the only native code you author is the `shimBody`**: the library itself
is provisioned (a package) or acquired (a source file), never re-implemented or pasted in.
`url`/`git` origins are content-pinned by a required `sha256`; the preferred `bucket` origin
keeps the artifact inside the project's trust boundary.

#### Pre-built binaries (`.so` / `.a` / `.lib` / `.dll`)

A pre-built object, not source, is the exception. The compiler builds your shim from source
and links the library, so a pre-built binary is **platform-locked**: an x86-64 Linux `.so`
will not load on an arm64 macOS or a Windows build, which defeats reproducible
cross-platform generation. Prefer *source plus a package manager*. When you genuinely must
carry a pre-built object, list it as a `sources[]` artifact (origin `bucket`/`url`, written
into `native/`) and put its linker name in `links` so the build **links** rather than
compiles it, accepting that the build image and the deploy target must match that binary's
platform. For portable, sandboxed native code with no per-platform binary, use the
[WebAssembly module](../../spec/WasmModule.md) pattern instead.

#### Pure C vs C++ (`lang`)

The `lang` field selects how the shim bridges to the library:

- **`lang: "c"`**: the library already exposes a C ABI, so the shim is near-passthrough: it
  just adapts the call to the `params` / `out` / `err` convention. No `extern "C"` wrapper
  or exception guard is needed.
- **`lang: "cpp"`** (default): the shim is an `extern "C"` function that calls into the C++
  library and **must catch C++ exceptions** (they cannot cross the C ABI) and turn them into
  a non-zero status plus an `err` message, which the host wrapper raises as a `throw` /
  `Result::Err` / Go `error`. The C++ library's own source still arrives via `packages[]` or
  `sources[]`, never pasted into the shim.

---

## Authoring source for a kernel

Authors reach the platform through a hosted blueprint and, often, an AI agent, not a local
filesystem, so kernel source is never pasted inline (beyond a tiny header). An author that
produces `.cpp`/`.hpp` files uploads the file (or a vendored tarball) to a location the
compiler can fetch from and references it from a `KernelSource`. The intended end state is
`origin: "bucket"` (stays inside the trust boundary); until the bucket origin is available,
host the file at a URL and use `origin: "url"` with the file's `sha256`.

---

## Worked example: batch shipping over an existing C++ library

A service generated in **Node** needs to price a whole batch of parcels through an existing
C++ routine in `libshipping`. The library is on the build image via `apt`; the shim is a few
lines.

```jsonc
// services[].serviceSettings.serviceBasics
{
  "name": "fulfillment",
  "packages": [
    // provisions the existing system lib into the build image
    { "manager": "apt", "name": "libshipping-dev", "version": "*" }
  ]
}
```

```jsonc
// services[].library.nativeKernels[]
{
  "name": "computeShippingBatch",
  "lang": "cpp",
  "params": [
    { "name": "weights", "type": "f64[]" },   // a batch: coarse-grained
    { "name": "zone",    "type": "string" }
  ],
  "returns": "f64[]",                           // one fee per weight, length n
  "includes": [ "existing_shipping.hpp" ],      // header of the existing lib
  "links":    [ "shipping" ],                   // links libshipping (from apt)
  "hostBindings": [ "nodejs" ],                 // omit to default to the service's language
  "async": true,
  "shimBody": "for (size_t i = 0; i < n; ++i) { out[i] = ship_quote(weights[i], zone); } return 0;"
}
```

```js
// any MScript field / FunctionCallAction on this service
LIB.computeShippingBatch(this.parcelWeights, this.session.zone)
```

Note `weights` is an **array in, array out** in a single call, never a per-parcel kernel
call in a loop. Each FFI crossing copies and validates the buffer, so chatty per-element
calls defeat the purpose.

The compiler emits the language-neutral C ABI contract (a header with the `extern "C"`
signature derived from `params` / `returns`, and the shim source with the `try/catch`
envelope around your `shimBody`) and then the binding for each wired host. The lines between
the shim's begin and end markers are exactly your authored body. `LIB.<name>` is awaited on
runtimes where the kernel is `async` (dispatched off the request thread) and is a straight
call run off-thread elsewhere. How each host language loads the shim (a dynamic FFI library,
a static link, a compiler-driven build) is described in
[the compiler specification](../../compiler/index.md).

### Which hosts exist

`hostBindings` accepts `rust`, `nodejs`, `golang`, `java`, `dotnet` and `python`. The
`extern "C"` shim is identical across them; only *how the host loads it* differs. A
language with no native FFI kernel emitter (for example PHP) gets portable native code
through the [WebAssembly module](../../spec/WasmModule.md) pattern instead. When both Rust
**and** Node consume the same kernel you *may* make Rust the sole FFI host and expose its
safe wrapper to Node through a native addon layer (one unsafe C seam, written once), at the
cost of a Rust build step in the Node service.

---

## Validation and compiler warnings

Planning is pure analysis; it never fails generation, it warns:

| Code | Raised when |
| --- | --- |
| `NO_HOST_BINDING` | `hostBindings` does not include the consuming service's language: no binding is emitted for it. |
| `UNPINNED_REMOTE_SOURCE` | a `url`/`git` source has no `sha256` (a mismatch *does* fail generation; this warns about the missing pin). |
| `UNSUPPORTED_RETURN_TYPE` | a `returns` the v1 emitter cannot lower (for example a `string` return). |
| `NODE_SYNC_KERNEL` | `async: false` on a Node service: a long synchronous native call blocks the event loop. |

---

## Safety and the author rules

A kernel is a **failure domain**. There is **no sandbox at the kernel boundary**: a
segfault, out-of-memory condition, or unbounded write in native code takes the whole process
down. The generated shim catches C++ *exceptions*, but it cannot make C++ memory-safe. This
raises the bar for what is acceptable as `shimBody`. Reserve kernels for the narrow case
where a specific library must be linked.

The non-negotiable rules:

- **Keep calls coarse-grained.** One large unit of work per call: *pass an array, get an
  array*. Never a per-element kernel call in a loop; every crossing copies and validates the
  buffer.
- **Do not block the runtime.** Keep `async: true` (the default). It dispatches off the
  request thread so long compute never blocks the event loop or async runtime.
- **Pure compute, no database or session.** A kernel sees only its arguments; it has **no
  access** to the service's models or request session. Pass the minimal serialisable inputs.
- **Native build dependency.** A service with a kernel gains a C++ toolchain at build time,
  or a prebuilt library at deploy time. The `links` drive the system packages the build image
  must contain. The deployment memory budget for the build is a compiler concern, see
  [the compiler specification](../../compiler/index.md).

---

## See also

- [The compute layer](compute-layer.md): `Calculation` and `ComputeJob`; the `CustomSpec`
  contrast (native Rust/Python source, crash-guarded job) drawn above.
- Reference: [`NativeKernel`](../../spec/NativeKernel.md) ·
  [`KernelSource`](../../spec/KernelSource.md) ·
  [`KernelParam`](../../spec/KernelParam.md) ·
  [`ServiceLibrary`](../../spec/ServiceLibrary.md) ·
  [`Package`](../../spec/Package.md).
