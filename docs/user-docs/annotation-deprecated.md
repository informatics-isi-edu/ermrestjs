# Deprecated Annotations

This document contains deprecated anntoation properties. In some cases the deprecated annotation is not completely removed but we discourage the usage of these properties as they will eventually be removed completely.

## Annotations

| Annotation                                                | Catalog | Schema | Table | Column | Key | FKR | Summary                                                        |
|-----------------------------------------------------------|---------|--------|-------|--------|-----|-----|----------------------------------------------------------------|
| [2016 Ignore](#tag-2016-ignore-deprecated)                | -       | X      | X     | X      | -   | -   | Ignore model element                                           |
| [2016 Export](#tag-2016-export-deprecated)                | X       | X      | X     | -      | -   | -   | Describes export templates                                     |
| [2015 Vocabulary](#tag-2015-vocabulary-deprecated)        | -       | -      | X     | -      | -   | -   | Table as a vocabulary list                                     |



### Tag: 2015 Vocabulary

`tag:misd.isi.edu,2015:vocabulary`

> This key has been completely removed and has no effect on ERMrestJS/Chaise.

It was allowed on any number of tables in the model, where the
table contains at least one key comprised of a single textual
column. A vocabulary table is one where each row represents a term or
concept in a controlled vocabulary.

Supported JSON payload patterns:

- `null` or `{}`: Default heuristics apply.
- `{`... `"uri":` _uri_ ...`}`: The _uri_ indicates the global identifier of the controlled vocabulary. The _uri_ MAY be a resolvable URL.
- `{`... `"term":` _column_ ...`}`: The named _column_ stores the preferred textual representation of the term. The referenced column MUST comprise a single-column key for the table.
- `{`... `"id":` _column_ ...`}`: The named _column_ stores the preferred compact identifier for the term, which MAY be textual or numeric. The referenced column MUST comprise a single-column key for the table.
- `{`... `"internal":` [_column_, ...] ...`}`: The one or more named _columns_ store internal identifiers for the term, used for efficient normalized storage in the database but not meaningful to typical users. The referenced columns MUST each comprise a single-column key for the table.
- `{`... `"description":` _column_ ...`}`: The named _column_ stores a longer textual representation of the term or concept. The referenced column SHOULD comprise a single-column key for the table.


### Tag: 2016 Ignore

`tag:isrd.isi.edu,2016:ignore`

> This key has been completely removed and has no effect on ERMrestJS/Chaise.

This key was previously specified for these model elements but such use is deprecated:

- Column (use [2016 Visible Columns](annotation.md#tag-2016-visible-columns) instead)
- Foreign Key (use [2016 Visible Foreign Keys](annotation.md#tag-2016-visible-foreign-keys) instead)

This annotation indicates that the annotated model element should be ignored in typical model-driven user interfaces, with the presentation behaving as if the model element were not present. The JSON payload contextualizes the user interface mode or modes which should ignore the model element.

Supported JSON payload patterns:
- `null` or `true`: Ignore in any presentation context. `null` is equivalent to `tag:misd.isi.edu,2015:hidden` for backward-compatibility.
- `[]` or `false`: Do **not** ignore in any presentation context.
- `[` _context_ `,` ... `]`: Ignore **only** in specific listed contexts, otherwise including the model element as per default heuristics. See [Context Names](annotation.md#context-names) section for the list of supported _context_ names.

This annotation provides an override guidance for Chaise applications
using a hierarchical scoping mode:

1. Hard-coded default behavior in Chaise codebase.
2. Server-level configuration in `chaise-config.js` on web server overrides hard-coded default.
3. Schema-level annotation overrides server-level or codebase behaviors.
4. Table-level annotation overrides schema-level, server-level, or codebase behaviors.
5. Annotations on the column or foreign key reference levels override table-level, schema-level, server-level, or codebase behaviors.



### Tag: 2016 Export

`tag:isrd.isi.edu,2016:export`

This tag is the old version of [2019 Export](annotation.md#tag-2019-export) tag. The new tag supports contextualization and is preferred. Templates defined under this tag will be interpreted as `"*"` context of `tag:isrd.isi.edu,2019:export`. If both `tag:isrd.isi.edu,2016:export` and `tag:isrd.isi.edu,2019:export` for `"*"` context are defined, the `tag:isrd.isi.edu,2016:export` will be ignored.

This key can be used to define export templates that will be used for `ioboxd` service integration with the client tools. For more information about the annotation payload please visit [the iobodx integration document](https://github.com/informatics-isi-edu/ioboxd/blob/master/doc/integration.md).

Supported JSON payload pattern:

- `{` `"templates":` `[`_template_`]` `}`: An array of _template_ objects to export.

Please refer to [2019 Export](annotation.md#tag-2019-export) for more information about the supported _template_ patterns.