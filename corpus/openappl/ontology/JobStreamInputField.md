# JobStreamInputField

**Level:** `subsection` · **Family:** [JobStream](./families.md#jobstream) (domain `Service`)

**Specification:** [JobStreamInputField in Part 2](../spec/JobStreamInputField.md)

One field of a JobStream's enqueue input schema: `name`, `type` and `required`. The enqueue handler validates the request body against these fields and maps them onto the target BusinessApi input (per `targetApi.inputMapping`). Keep the payload small — large inputs belong in a bucket, referenced by key.

## Contained in

- [JobStreamBasics](./JobStreamBasics.md) as `inputSchema` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
