# ImageVariant

**Level:** `subsection` · **Family:** [RemoteBucket](./families.md#remotebucket) (domain `Service`)

**Specification:** [ImageVariant in Part 2](../spec/ImageVariant.md)

One resized copy of every image a bucket stores (see RemoteBucketBasics.imageVariants). The variant is produced with `sharp`: auto-orient, resize to `width` (and `height` when set) under `fit`, encode as `format` at `quality`, metadata stripped. The original is never modified.

## Contained in

- [RemoteBucketBasics](./RemoteBucketBasics.md) as `imageVariants` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
