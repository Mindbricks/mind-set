# LedgerExpiry

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerExpiry in Part 2](../spec/LedgerExpiry.md)

Lot expiry sweep and pre-expiry reminders. When enabled, lots whose expiry falls due are swept in batches by the expire cron. THE SWEEP CONSUMES THE UNRESERVED REMAINDER ONLY: value held by an OPEN reservation survives expiry until the reservation commits or releases — a hold must never be silently voided by the calendar (framework-owned subtlety). `reminderLeadDays` + `reminderCron` drive the notifyExpiring job that publishes a pre-expiry reminder event.

## Contained in

- [LedgerConfig](./LedgerConfig.md) as `expiry`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
