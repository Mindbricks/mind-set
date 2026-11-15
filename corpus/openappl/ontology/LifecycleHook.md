# LifecycleHook

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LifecycleHook in Part 2](../spec/LifecycleHook.md)

A designer-authored MScript handler fired by the payment dispatcher when a normalized payment event advances the state machine. Hooks replace the legacy edge-function-driven post-payment plumbing — instead of writing a Kafka edge controller plus an edgeFunction, the designer writes the trigger + script inline. The dispatcher invokes hooks after the FSM transition completes and the state has been persisted; failures inside a hook DO NOT roll back the state transition and DO NOT fail the dispatch — they are logged loudly as PaymentLifecycleHookFailed (hook name, trigger, event id, error) and the event still settles processed, so the hook's effect is operator-reconcilable from the log. An internal API call made from a hook (await API.<name>(...)) that answers a non-2xx now raises a typed ApiError instead of resolving the error envelope as data, so a refused call lands in that same log instead of vanishing.

## Contained in

- [CheckoutConfig](./CheckoutConfig.md) as `lifecycleHooks` (a list)
- [MarketplaceConfig](./MarketplaceConfig.md) as `lifecycleHooks` (a list)
- [SubscriptionConfig](./SubscriptionConfig.md) as `lifecycleHooks` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
