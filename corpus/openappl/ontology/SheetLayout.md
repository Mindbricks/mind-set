# SheetLayout

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [SheetLayout in Part 2](../spec/SheetLayout.md)

The layout of an exported xlsx worksheet around the data table. It covers a title block, where the table starts, header styling, freeze pane and auto filter, column widths, a totals row of real formulas, and `cells` - the free area where any address takes any MScript.

## Contained in

- [DataToFileAction](./DataToFileAction.md) as `sheetLayout`

## Contains

- `totals`: [SheetTotal](./SheetTotal.md), a list
- `cells`: [SheetCell](./SheetCell.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
