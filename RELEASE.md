# Release Notes

This document is a summary of code changes in Chaise. This is the vocabulary used to introduce the changes:
  - `[Added]`: newly added features.
  - `[Improved]`: additions made to an existence feature.
  - `[Changed]`: modifications to existing features.
  - `[Fixed]`: bug fixes.
  - `[No changes]` means that Chaise hasn't been changed in the described duration.

# 09/31/19

  - [Added] RID markdown tag to generate resolvable link for a record given the RID value: [[RID]]
  - [Added] SystemColumnsDisplayCompact and SystemColumnsDisplayDetailed chaise-config properties support.
  - [Changed] asset presentation heuristics:
    - Added external origin information
    - Added support for external-link behavior
  - [Improved] default export template:
    - Removed duplicate columns from default export
    - Used visible-columns to order export columns for the default template.
    - Added inline tables to the default template.
  - [Added] pseudo-columns in templating environments for compact contexts (source-definition annotation)
  - [Changed] pure and binary heuristics to ignore system columns (even if they are part of foreign key)
  - [Fixed] Make sure the function used in add pure and binary that sets the paging works with facets.

# 06/01/19

  - N/A (This is the starting point of writing this summary.)
