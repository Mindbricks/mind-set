# Provider brands - the enum is not the shipped list

Read by the interview and by the project-basic-setup, service-spec and
notification-definitions writers.

A provider enum names every brand the framework has a NAME for. It does not
name the brands that WORK. Three states, and only one may be designed
against:

- **shipped** - a framework adapter exists. Bind it.
- **roadmap** - declarable and catalogued, with NO adapter behind it. The
  blueprint validates, the service generates, the build is green, the deploy
  succeeds - and the first call answers a typed 501 naming the phase. Nothing
  before runtime says no.
- **bringYourOwn** - the framework ships no adapter ON PURPOSE, because the
  project registers its own adapter. Design against it only when the project
  has committed to writing that adapter, and say so.

**The rule.** A roadmap brand may be MENTIONED as roadmap ("Parasut is on the
roadmap; today the system of record would be `internal`"). It is never offered
as a choice, never chosen, never named as the provider a design assumes, and
never written into a blueprint or a provider registry. If the designer names
one: say it is roadmap and take the design to a shipped brand - or to no
provider at all, where the pattern works without one.

**Never guess a brand's state** from its name, from its credential keys being
catalogued (that means the SHAPE is final, not that the adapter exists), or
from the enum accepting it. The shipped state is written in the provider
type's pattern page (for invoices `openappl/spec/InvoiceProvider.md`,
"SHIPPED STATE"); the type's entry in `openappl.json` lists the brands the
enum accepts and the configuration keys a brand takes, never which brands
work.

- **Invoice providers:** invoicing is fully functional with NO provider
  (`internal` needs no credentials and no registry entry), so a roadmap brand
  never blocks a design - it only changes the system of record. The
  enterprise bridge brands additionally bind through an enterprise
  integration.
- **Fiscal providers:** the Turkey-first integrators with adapters are
  treated as shipped, `mock` is non-production only, and there is no internal
  fiscal brand. Where this contradicts the pattern page, the pattern page
  wins.
