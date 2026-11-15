# NativeKernel

**Level:** `section` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [NativeKernel in Part 2](../spec/NativeKernel.md)

Defines a native compute kernel exposed to the service as a library function. A NativeKernel wraps an existing native library (CUDA/MKL/OpenCV/a proprietary HPC routine) behind a stable `extern "C"` shim — the only native code an OpenAPPL compiler compiles. The compiler never binds to the C++ library directly and never parses it; it owns only the C-shaped shim contract. The kernel is compiled and linked into the consuming service via FFI (Rust `build.rs`/bindgen, Node napi-rs or koffi, and per-language FFI for the other targets) and is referenced from MScript like any other library function: `LIB.computeShippingBatch(this.weights, this.zone)`. Keep kernels coarse-grained (one large unit of work per call) because every FFI crossing copies the argument buffers. See `docs/ADR-cpp-kernel-native-lib.md`.

## Contained in

- [ServiceLibrary](./ServiceLibrary.md) as `nativeKernels` (a list)

Blueprint paths:

- `services.library.nativeKernels`

## Contains

- `params`: [KernelParam](./KernelParam.md), a list
- `sources`: [KernelSource](./KernelSource.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
