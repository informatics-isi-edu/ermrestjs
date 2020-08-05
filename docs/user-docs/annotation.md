# Base Model Annotation

This document defines a set of annotations we suggest may be useful in
combination with ERMrest. We define a set of _annotation keys_, any
associated JSON _annotation values_, and their semantics. Communities
may use these conventions to modify their interpretation of ERMrest
catalog content.

These annotations do not affect the behavior of the ERMrest service
itself but merely inform clients about intended use beyond that
captured in the entity-relationship model. Further, as described in
the [REST API docs](https://github.com/informatics-isi-edu/ermrest/blob/master/docs/api-doc/index.md), the annotation system is
openly extensible so communities MAY use other annotation keys not
described here; in those cases, the community SHOULD publish similar
documentation on their use and interpretation.

## Notation and Usage

Each annotation key is defined in a section of this document and shown
as a literal string.  We prepend a date in each key name and promise
not to modify the semantics of an existing annotation key, once
published to GitHub. We may publish typographical or other small
textual clarifications, but if we need to change the proposed
semantics we will define a new key with a different date and/or key
text. We will follow the date stamp conventions from
[RFC 4151](http://www.faqs.org/rfcs/rfc4151.html) which allow for
abbreviated ISO dates such as `2015`, `2015-01`, and `2015-01-01`.

### Example to Set Annotation

This example sets the
[2015 Display](#tag-2015-display) annotation:

    PUT /ermrest/catalog/1/schema/MainContent/annotation/tag%3Amisd.isi.edu%2C2015%3Adisplay HTTP/1.1
    Host: www.example.com
    Content-Type: application/json

    {"name": "Main Content"}

TBD changes to propose for ERMrest:

1. Allow non-escaped characters in the annotation key since it is the final field of the URL and does not have a parsing ambiguity?
2. Allow an empty (0 byte) request body to represent the same thing as JSON `null`?

## Annotations

Some annotations are supported on multiple types of model element, so
here is a quick matrix to locate them.

| Annotation                                                  | Catalog | Schema | Table | Column | Key | FKR | Summary                                       |
|-------------------------------------------------------------|---------|--------|-------|--------|-----|-----|-----------------------------------------------|
| [2015 Display](#tag-2015-display)                           | X       | X      | X     | X      | X   | -   | Display options                               |
| [2015 Vocabulary](#tag-2015-vocabulary-deprecated) (_deprecated_)                     | -       | -      | X     | -      | -   | -   | Table as a vocabulary list                    |
| [2016 Table Alternatives](#tag-2016-table-alternatives)     | -       | -      | X     | -      | _   | _   | Table abstracts another table                 |
| [2016 Column Display](#tag-2016-column-display)             | -       | -      | -     | X      | -   | -   | Column-specific display options               |
| [2017 Key Display](#tag-2017-key-display)                   | -       | -      | -     | -      | X   | -   | Key augmentation                              |
| [2016 Foreign Key](#tag-2016-foreign-key)                   | -       | -      | -     | -      | -   | X   | Foreign key augmentation                      |
| [2016 Generated](#tag-2016-generated)                       | -       | X      | X     | X      | -   | -   | Generated model element                       |
| [2016 Ignore](#tag-2016-ignore-deprecated) (_deprecated_)              | -       | X      | X     | X      | -   | -   | Ignore model element                          |
| [2016 Immutable](#tag-2016-immutable)                       | -       | X      | X     | X      | -   | -   | Immutable model element                       |
| [2016 Non Deletable](#tag-2016-non-deletable)               | -       | X      | X     | -      | -   | -   | Non-deletable model element                   |
| [2016 App Links](#tag-2016-app-links)                       | -       | X      | X     | -      | -   | -   | Intra-Chaise app links                        |
| [2016 Table Display](#tag-2016-table-display)               | -       | -      | X     | -      | -   | -   | Table-specific display options                |
| [2016 Visible Columns](#tag-2016-visible-columns)           | -       | -      | X     | -      | -   | -   | Column visibility and presentation order      |
| [2016 Visible Foreign Keys](#tag-2016-visible-foreign-keys) | -       | -      | X     | -      | -   | -   | Foreign key visibility and presentation order |
| [2019 Export](#tag-2019-export)                             | -       | X      | X     | -      | -   | -   | Describes export templates                    |
| [2016 Export](#tag-2016-export-deprecated) (_deprecated_)              | -       | X      | X     | -      | -   | -   | Describes export templates                    |
| [2017 Asset](#tag-2017-asset)                               | -       | -      | -     | X      | -   | -   | Describes assets                              |
| [2018 Citation](#tag-2018-citation)                         | -       | -      | X     | -      | -   | -   | Describes citation                            |
| [2018 Required](#tag-2018-required)                         | -       | -      | -     | X      | -   | -   | Required model column                         |
| [2018 Indexing Preferences](#tag-2018-indexing-preferences) | -       | -      | X     | X      | -   | -   | Specify database indexing preferences         |
| [2019 Chaise Config](#tag-2019-chaise-config)               | X       | -      | -     | -      | -   | -   | Properties to configure chaise app UX         |
| [2019 Source Definitions](#tag-2019-source-definitions)     | -       | -      | X     | -      | -   | -   | Describe source definitions                   |

For brevity, the annotation keys are listed above by their section
name within this documentation. The actual key URI follows the form
`tag:misd.isi.edu,` _date_ `:` _key_ where the _key_ part is
lower-cased with hyphens replacing whitespace. For example, the
`2015 Display` annotation key URI is actually
`tag:misd.isi.edu,2015:display`.

### Tag: 2015 Display

`tag:misd.isi.edu,2015:display`

This key is allowed on any number of schemas, tables,
columns, and keys. This annotation indicates display options for the indicated
element and its nested model elements.

Supported JSON payload patterns:

- `{`... `"comment":` _comment_ ...`}`: The _comment_ (tooltip) to be used in place of the model element's original comment. Set this to `false` if you don't want any tooltips.
- `{`... `"name":` _name_ ...`}`: The _name_ to use in place of the model element's original name.
- `{`... `"markdown_name"`: _markdown_ `}`: The _markdown_ to use in place of the model element's original name.
- `{`... `"name_style":` `{` `"underline_space"`: _uspace_ `,` `"title_case":` _tcase_ `,` `"markdown"`: _render_ `}` ...`}`: Element name conversion instructions.
- `{`... `"show_null":` `{` _context_ `:` _nshow_ `,` ... `}`: How to display NULL data values.
- `{`... `"show_foreign_key_link":` `{` _context_ `:` _fklink_ `,` ... `}`: Whether default display of foreign keys should include link to the row.

Supported JSON _uspace_ patterns:

- `true`: Convert underline characters (`_`) into space characters in model element names.
- `false`: Leave underline characters unmodified (this is also the default if the setting is completely absent).

Supported JSON _tcase_ patterns:

- `true`: Convert element names to "title case" meaning the first character of each word is capitalized and the rest are lower cased regardless of model element name casing. Word separators include white-space, hyphen, and underline characters.
- `false`: Leave character casing unmodified (this is also the default if the setting is completely absent).

Supported JSON _render_ patterns:

- `true`: Interpret the model element's actual name as a Markdown string. This MAY include rendering visually in applications with such capability.
- `false`: Present the model element's actual name verbatim (this is also the default if the setting is completely absent).

Supported JSON _nshow_ patterns:

- `true` (or `""`): Show NULL values as an empty field.
- `"` _marker_ `"` (a quoted string literal): For any string literal _marker_, display the marker text value in place of NULLs.
- `false`: Completely eliminate the field if feasible in the presentation.

Supported JSON _fklink_ patterns:

- `true`: Present the foreign key values with a link to the referred row.
- `false`: Present the foreign key values without adding extra links.

Supported JSON _context_ patterns:
- See [Context Names](#context-names) section for the list of supported JSON _context_ patterns.

#### Tag: 2015 Display Settings Hierarchy

- The `"comment"` setting applies *only* to the model element which is annotated.
- The `"name"` and `"markdown_name"` setting applies *only* to the model element which is annotated. They bypass the `name_style` controls which only apply to actual model names.
  - The `"markdown_name"` setting takes precedence if both are specified.
- The `"name_style"` setting applies to the annotated model element and is also the default for any nested element.
- The `"show_null"` settings applies to the annotated model element and is also the default for any nested element.
  - The annotation is allowed on catalog in order to set the default for all schemas in the catalog.
  - The annotation is allowed on schemas in order to set the default for all tables in the schema.
  - Each _context_ `:` _nshow_ instruction overrides the inherited instruction for the same _context_ while still deferring to the inherited annotation for any unspecified _context_. The `"*"` wildcard _context_ allows masking of any inherited instruction.
  - A global default is assumed: `{`... `"show_null": { "detailed": false, "*": true` ... `}`
- The `"show_foreign_key_link"` settings applies to the annotated model element and is also the default for any nested element.
  - The annotation is allowed on catalog in order to set the default for all schemas in the catalog.
  - The annotation is allowed on schemas in order to set the default for all tables in the schema.
  - Each _context_ `:` _fklink_ instruction overrides the inherited instruction for the same _context_ while still deferring to the inherited annotation for any unspecified _context_. The `"*"` wildcard _context_ allows masking of any inherited instruction.
  - A global default is assumed: `{`... `"show_foreign_key_link": { "*": true` ... `}`

This annotation provides an override guidance for Chaise applications using a hierarchical scoping mode:

1. Column-level name
2. Column-level name_style.
3. Table-level name_style.
4. Schema-level name_style.

Note:
- An explicit setting of `null` will turn *off* inheritence and restore default behavior for that modele element and any of its nested elements.
- The name_style has to be derived separately for each field e.g. one can set `underline_space=true` at the schema-level and doesn't have to set this again.   

### Tag: 2015 Vocabulary (_deprecated_)

`tag:misd.isi.edu,2015:vocabulary`

This key has been deprecated. It was allowed on any number of tables in the model, where the
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

#### Heuristics

1. In the absence of an `internal` assertion, assume all keys are potentially meaningful to users.
2. In the absence of a `term` assertion
  - Try to find a single-column key named `term`
  - Try to find a single-column key named `name`
  - If no term column is found table SHOULD NOT be interpreted as a vocabulary.
3. In the absence of an `id` assertion
  - Try to find a column named `id`
  - Try to find an unambiguous single-column numeric key
  - If no `id` column is found, use the term column as the preferred compact identifier.
4. In the absence of a `description` assertion
  - Try to find a column named `description`
  - If no description column is found, proceed as if there is no description or use some other detailed or composite view of the table rows as a long-form presentation.

In the preceding, an "unambiguous" key means that there is only one
key matching the specified type and column count.

The preferred compact identifier is more often used in dense table
representations, technical search, portable data interchange, or
expert user scenarios, while the preferred textual representation is
often used in prose, long-form presentations, tool tips, or other
scenarios where a user may need more natural language understanding of
the concept.

### Tag: 2016 Ignore (_Deprecated_)

`tag:isrd.isi.edu,2016:ignore`

This key is allowed on any number of Schema, Table, or Column model elements. The only part of chaise that is using this annotation is search application. It does not have any effects on other applications (i.e., record, record-edit, and recordset).

This key was previously specified for these model elements but such use is deprecated:

- Column (use [2016 Visible Columns](#tag-2016-visible-columns) instead)
- Foreign Key (use [2016 Visible Foreign Keys](#tag-2016-visible-foreign-keys) instead)

This annotation indicates that the annotated model element should be ignored in typical model-driven user interfaces, with the presentation behaving as if the model element were not present. The JSON payload contextualizes the user interface mode or modes which should ignore the model element.

Supported JSON payload patterns:
- `null` or `true`: Ignore in any presentation context. `null` is equivalent to `tag:misd.isi.edu,2015:hidden` for backward-compatibility.
- `[]` or `false`: Do **not** ignore in any presentation context.
- `[` _context_ `,` ... `]`: Ignore **only** in specific listed contexts, otherwise including the model element as per default heuristics. See [Context Names](#context-names) section for the list of supported _context_ names.

This annotation provides an override guidance for Chaise applications
using a hierarchical scoping mode:

1. Hard-coded default behavior in Chaise codebase.
2. Server-level configuration in `chaise-config.js` on web server overrides hard-coded default.
3. Schema-level annotation overrides server-level or codebase behaviors.
4. Table-level annotation overrides schema-level, server-level, or codebase behaviors.
5. Annotations on the column or foreign key reference levels override table-level, schema-level, server-level, or codebase behaviors.


### Tag: 2016 App Links

`tag:isrd.isi.edu,2016:app-links`

This key is allowed on any number of schemas or tables in the
model. It is used to indicate which application in the Chaise suite
should be used for presentation in different context.

Supported JSON payload patterns:

- `{` ... _context_ `:` _app name_ `,` ... `}`: An _app name_ to be linked to in a different _context_ name.
  * _app name_ is one of the following chaise apps:
    - `tag:isrd.isi.edu,2016:chaise:record`,
    - `tag:isrd.isi.edu,2016:chaise:record-two`,
    - `tag:isrd.isi.edu,2016:chaise:viewer`,
    - `tag:isrd.isi.edu,2016:chaise:search`,
    - `tag:isrd.isi.edu,2016:chaise:recordset`
- `{` ... _context1_ `:` _context2_ `,` ... `}`: Configure _context1_ to use the same _app name_ configured for _context2_.

See [Context Names](#context-names) section for the list of supported _context_ names.

This annotation provides an override guidance for Chaise applications
using a hierarchical scoping mode:

1. Hard-coded default behavior in Chaise codebase:
  - `detailed` `:` `tag:isrd.isi.edu,2016:chaise:record`,
  - `compact` `:` `tag:isrd.isi.edu,2016:chaise:resultset`
2. Server-level configuration in `chaise-config.js` on web server overrides hard-coded default.
3. Schema-level annotation overrides server-level or codebase behaviors.
4. Table-level annotation overrides schema-level, server-level, or codebase behaviors.

### Tag: 2016 Immutable

`tag:isrd.isi.edu,2016:immutable`

This key indicates that the values for a given model element may not be mutated
(changed) once set. This key is allowed on any number of columns, tables, and schemas. There is no
content for this key.

### Tag: 2016 Generated

`tag:isrd.isi.edu,2016:generated`

This key indicates that the values for a given model element will be generated by
the system. This key is allowed on any number of columns, tables and schemas.
There is no content for this key.

### Tag: 2016 Non Deletable

`tag:isrd.isi.edu,2016:non-deletable`

This key indicates that the schema or table is non-deletable. This key is allowed
on any number tables and schemas. There is no content for this key.

### Tag: 2016 Visible Columns

`tag:isrd.isi.edu,2016:visible-columns`

This key indicates that the presentation order and visibility for
columns in a table, overriding the defined table structure.

Supported JSON payload pattern:

- `{` ... _context_ `:` _columnlist_ `,` ... `}`: A separate _columnlist_ can be specified for any number of _context_ names.
- `{` ... _context1_ `:` _context2_ `,` ... `}`: Configure _context1_ to use the same _columnlist_ configured for _context2_.
- `{` ... `"filter": { "and": [` _facetlist_ `,` ... `]} }` : Configure list of facets to be displayed.

For presentation contexts which are not listed in the annotation, or when the annotation is entirely absent, all available columns SHOULD be presented in their defined order unless the application has guidance from other sources.

See [Context Names](#context-names) section for the list of supported _context_ names.

Supported _columnlist_ patterns:

- `[` ... _columnentry_ `,` ... `]`: Present content corresponding to each _columnentry_, in the order specified in the list. Ignore listed _columnentry_ values that do not correspond to content from the table. Do not present table columns that are not specified in the list.

Supported _columnentry_ patterns:

- _columnname_: A string literal _columnname_ identifies a constituent column of the table. The value of the column SHOULD be presented, possibly with representation guided by other annotations or heuristics.
- `[` _schemaname_ `,` _constraintname_ `]`: A two-element list of string literal _schemaname_ and _constraintname_ identifies a constituent foreign key of the table. The value of the external entity referenced by the foreign key SHOULD be presented, possibly with representation guided by other annotations or heuristics. If the foreign key is representing an inbound relationship with the current table, it SHOULD be presented in a tabular format since it can represent multiple rows of data.
- `[` _schemaname_ `,` _constraintname_ `]`: A two-element list of string literal _schemaname_ and _constraintname_ identifies a constituent key of the table. The defined display of the key SHOULD be presented, with a link to the current displayed row of data. It will be served as a self-link.
- `{ "sourcekey": ` _sourcekey_ `}`: Defines a pseudo-column based on the given _sourcekey_. For more information please refer to [pseudo-column document](pseudo-columns.md).
- `{ "source": ` _sourceentry_ `}`:  Defines a pseudo-column based on the given _sourceentry_. For detailed explanation and examples please refer to [here](pseudo-columns.md#examples). Other optional attributes that this JSON document can have are:
  - `markdown_name`: The markdown to use in place of the default heuristics for title of column.
  - `display`: The display settings for generating the column presentation value. Please refer to [pseudo-columns display document](pseudo-column-display.md) for more information. The available options are:
    - `markdown_pattern`: Markdown pattern that will be used for generating the value.
    - `template_engine`: The template engine that should be used for the `markdown_pattern`.
    - `wait_for`: A list of pseudo-column [`sourcekey`](#tag-2019-source-definitions) that are use in the defined `markdown_pattern`. You should list all the all-outbound, aggregates, and entity sets that you want to use in your `markdown_pattern`. Entity sets (pseudo-columns with `inbound` path and no `aggregate` attribute) are only acceptable in `detailed` context.
    - `show_foreign_key_link`: It will override the inherited behavior of outbound foreign key displays. Set it to `false` to avoid adding extra link to the foreign key display.
    - `array_ux_mode`: If you have `"aggregate": "array"` or `"aggregate": "array_d"` in the pseudo-column definition, a comma-seperated value will be presented to the user. You can use `array_ux_mode` attribute to change that. The available options are,
      - `olist` for ordered bullet list.
      - `ulist` for unordered bullet list.
      - `csv` for comma-seperated values.
      - `raw` for space-seperated values.
  - `comment`: The tooltip to be used in place of the default heuristics for the column. Set this to `false` if you don't want any tooltip.
  - `entity`: If the _sourceentry_ can be treated as entity (the source column is key of the table), setting this attribute to `false` will force the scalar mode.
  - `self_link`: If the defined source is one of the unique not-null keys of the table, setting this attribute to `true` will switch the display mode to self-link.
  - `aggregate`: The aggregate function that should be used for getting an aggregated result. The available aggregate functions are `min`, `max`, `cnt`, `cnt_d`, `array`, and `array_d`.
    - `array` will return ALL the values including duplicates associated with the specified columns. For data types that are sortable (e.g integer, text), the values will be sorted alphabetically or numerically. Otherwise, it displays values in the order that it receives from ERMrest. There is no paging mechanism to limit what's shown in the aggregate column, therefore please USE WITH CARE as it can incur performance overhead and ugly presentation.
    - `array_d` will return distinct values. It has the same performance overhead as `array`, so pleas USE WITH CARE.
    - Using `array` or `array_d` aggregate in entity mode will provide an array of row-names instead of just the value of the column. Row-names will be derived from the `row_name/compact` context.
  - `array_display`: This attribute is _deprecated_. It is the same as `array_ux_mode` that is defined above.
  - `array_options`: This attribute is meant to be an object of properties that control the display of `array` or `array_d` aggregate column. These options will only affect the display (and templating environment) and have no effect on the generated ERMrest query. The available options are:
    - `order`: An alternative sort method to apply when a client wants to semantically sort by key values. It follows the same syntax as `column_order`. In scalar array aggregate, you cannot sort based on other columns values, you can only sort based on the scalar value of the column.
    - `max_length`: `<number>` A number that defines the maximum number of elements that should be displayed.
- If you want to have a pseudo-column that its value is made up of multiple pseudo-columns, you don't need to define any `source` or `sourcekey`. The only required attributes for these types of columns (we call them virtual columns) are `markdown_name` that is used for generating the display name, and `markdown_pattern` to get the value. For instance the following is an acceptable virtual column:
  ```
  {
      "markdown_name": "displayname value",
      "display": {
          "markdown_pattern": "{{{column1}}}, {{{column2}}}"
      }
  }
  ```

Supported _sourceentry_ pattern:
- _columnname_: : A string literal. _columnname_ identifies a constituent column of the table.
- _path_: An array of _foreign key path_ that ends with a _columnname_ that will be projected. _foreign key path_ is in the following format:

        "`{` _direction_ `:[` *schema name*`,` *constraint name* `]}` "
    Where _direction_ is either `inbound`, or `outbound`.

Supported _sourcekey_ pattern in here:
  - A string literal that refers to any of the defined sources in [`source-definitions` annotations](#tag-2019-source-definitions).

Supported _facetlist_ pattern:

- `[` ... _facetentry_ `,` ... `]`: Present content corresponding to each _facetentry_, in the order specified in the list. Ignore invalid listed _facetentry_. Do not present other facets that are not specified in the list.

_facetentry_ must be a JSON payload with the following attributes:

Required attributes:

You need to define one of these attributes which will refer to the source of the facet column.

- `source`: Source of the filter. If it is not specified or is invalid the _facetentry_ will be ignored. It has the same pattern as _sourceentry_ defined above.

- `sourcekey`: A string literal that refers to any of the defined sources in [`source-definitions` annotations](#tag-2019-source-definitions). You MUST avoid defining both `source` and `sourcekey` as the client will ignore the `source` and just uses the `sourcekey`.

Constraint attributes (optional):

You can use these attributes to define default preselected facets (Combination of these attributes are not supported yet, you cannot have both `choices` and `ranges` specified on a facet).
- `choices`: Discrete choice e.g. maps to a checklist or similar UX. Its value MUST be an array of values.
- `ranges`: Half-open or closed intervals, e.g. maps to a slider or similar UX. Its value MUST be an array of JSON payload, with `min` and `max` attributes. The `min` and `max` values will translate into inclusive range filters. In order to force exclusive range, you can use `min_exclusive: true`, or `max_exclusive: true`.
- `not_null`: Match any record that has a value other than `null`. Its value MUST be `true`. If you have this constraint defined in your annotation, other constraints will be ignored (other than `"choice": [null]`. In this case both of the filters will be ignored).
<!-- - `search`: Substring search, e.g. maps to a search box UX. -->


Configuration attributes (optional):
- `entity`: If the facet can be treated as entity (the column that is being used for facet is key of the table), setting this attribute to `false` will force the facet to show scalar mode.
- `markdown_name`: The markdown to use in place of the default heuristics for facet title.
- `comment`: The tooltip to be used in place of the default heuristics for the facet. Set this to `false` if you don't want any tooltip.
- `open`: Setting this attribute to `true`, will force the facet to open by default.
- `bar_plot`: This attribute is meant to be an object of properties that control the display of the histogram. Setting this attribute to `false` will force the histogram to not be shown in the facet in the facet panel. If unspecified, default is `true` (or show the histogram).
- `ux_mode`: `choices`, `ranges`, or `check_presence`. If a multi-modal facet control UX is available, it will specify the default UX mode that should be used (If `ux_mode` is defined, the other type of constraint will not be displayed even if you have defined it in the annotation). In `check_presence` mode only two options will be available to the users, "not-null" and "null".
- `hide_null_choice` and `hide_not_null_choice`: By default, we are going to add `null` and `not-null` options in the choice picker. Setting any of these variables to `true`, will hide its respective option.

`bar_plot` attributes (optional):
- `n_bins`: Used to define the number of bins the histogram uses to fetch and display data. If undefined, default is 30 bins.


The following is an example of visible-columns annotation payload for defining facets. You can find more examples in [here](facet-examples.md).

```
"filter": {
    "and" : [
        {"source": "column", "ranges": [{"min": 1}, {"min":5, "max":10}] ,"markdown_name": "**col**"},
        {"source": [{"outbound": ["S", "FK2"]}, "id"], "choices": [1, 2]},
        {"source": [{"inbound": ["S", "FK1"]}, {"outbound": ["S", "FK2"]}, "term"], "entity": false},
        {"sourcekey": "some-defined-source", "ux_mode": "choices"}
    ]
}
```

### Tag: 2017 Key Display

`tag:isrd.isi.edu,2017:key-display`

This key allows augmentation of a unique key constraint
with additional presentation information.

Supported JSON payload patterns:

- `{` _context_`:` _option_ ...`}`: Apply each _option_ to the presentation of referenced content for any number of _context_ names.

Supported display _option_ syntax:

- `"markdown_pattern":` _pattern_: The visual presentation of the key SHOULD be computed by performing [Pattern Expansion](#pattern-expansion) on _pattern_ to obtain a markdown-formatted text value which MAY be rendered using a markdown-aware renderer.
- `"column_order"`: `[` _columnorder_key_ ... `]`: An alternative sort method to apply when a client wants to semantically sort by key values.
- `"column_order": false`: Sorting by this key psuedo-column should not be offered.


Supported _columnorder_key_ syntax:

- `{ "column":` _columnname_ `, "descending": true }`: Sort according to the values in the _columnname_ column opposite of the order of current sort. For instance if asked to sort the key in descending order, sorting will be based on the ascending values of _columnname_ column.
- `{ "column":` _columnname_ `, "descending": false }`: Sort according to the values in the _columnname_ column.
- `{ "column":` _columnname_ `}`: If omitted, the `"descending"` field defaults to `false` as per above.
- _columnname_: A bare _columnname_ is a short-hand for `{ "column":` _columnname_ `}`.


Key pseudo-column-naming heuristics (use first applicable rule):

1. Use key name specified by [2015 Display](#display) if `name` attribute is specified.
2. For simple keys, use effective name of sole constituent column considering [2015 Display](#display) and column name from model.
3. Other application-specific defaults might be considered (non-normative examples):
  - Anonymous pseudo-column may be applicable in some presentations
  - A fixed name such as `Key`
  - The effective table name
  - A composite name formed by joining the effective names of each constituent column of a composite key

Key sorting heuristics (use first applicable rule):

1. Use the key's display `column_order` option, if present.
2. Determine sort based on constituent column, only if key is non-composite.
3. Otherwise, disable sort for psuedo-column.

The first applicable rule MAY cause sorting to be disabled. Consider that determination final and do not continue to search subsequent rules.

### Tag: 2016 Foreign Key

`tag:isrd.isi.edu,2016:foreign-key`

This key allows augmentation of a foreign key reference constraint
with additional presentation information.

Supported JSON payload patterns:

- `{` ... `"from_name":` _fname_ ... `}`: The _fname_ string is a preferred name for the set of entities containing foreign key references described by this constraint.
- `{` ... `"to_name":` _tname_ ... `}`: The _tname_ string is a preferred name for the set of entities containing keys described by this constraint.
- `{` ... `"display": {` _context_`:` _option_ ...`}` ... `}`: Apply each _option_ to the presentation of referenced content for any number of _context_ names.
- `{` ... `"domain_filter_pattern":` _pattern_ ...`}`: The _pattern_ yields a _filter_ via [Pattern Expansion](#pattern-expansion). The _filter_ is a URL substring using the ERMrest filter language, which can be applied to the referenced table. The defined _filter_ will be appended directly to the reference uri and therefore must be properly url encoded (chaise WILL NOT apply additional url encoding).

Supported display _option_ syntax:

- `"column_order"`: `[` _columnorder_key_ ... `]`: An alternative sort method to apply when a client wants to semantically sort by foreign key values.
- `"column_order": false`: Sorting by this foreign key psuedo-column should not be offered.
- `"show_foreign_key_link": true`: Override the inherited behavior of foreign key display and add a link to the referred row.
- `"show_foreign_key_link": false`: Override the inherited behavior of foreign key display by not adding any the extra.

Supported _columnorder_key_ syntax:

- `{ "column":` _columnname_ `, "descending": true }`: Sort according to the values in the _columnname_ column opposite of the order of current sort.For instance if asked to sort the foreign key in descending order, sorting will be based on the ascending values of _columnname_ column. _columnname_ can be the name of any columns from the table that the foreign key is referring to.
- `{ "column":` _columnname_ `, "descending": false }`: Sort according to the values in the _columnname_ column.
- `{ "column":` _columnname_ `}`: If omitted, the `"descending"` field defaults to `false` as per above.
- _columnname_: A bare _columnname_ is a short-hand for `{ "column":` _columnname_ `}`. _columnname_ can be the name of any columns from the table that the foreign key is referring to.

Set-naming heuristics (use first applicable rule):

1. A set of "related entities" make foreign key reference to a presentation context:
  - The _fname_ is a preferred name for the related entity set.
  - The name of the table containing the related entities may be an appropriate name for the set, particularly if the table has no other relationship to the context.
  - The name of the table can be composed with other contextual information, e.g. "Tablename having columnname = value".
2. To name a set of "related entities" linked to a presentation context by an association table:
  - The _tname_ of the foreign key from association table to related entities is a preferred name for the related entity set.
  - The name of the table containing the related entities may be an appropriate name for the set, particularly if the table has no other relationship to the context.

Foreign key sorting heuristics (use first applicable rule):

1. Use the foreign key's display `column_order` option, if present.
2. Use the referenced table display `row_order` option, if present.
3. Determine sort based on constituent column, only if foreign key is non-composite.
4. Otherwise, disable sort for psuedo-column.

The first applicable rule MAY cause sorting to be disabled. Consider that determination final and do not continue to search subsequent rules.

Domain value presentation heuristics:

1. If _pattern_ expands to _filter_ and forms a valid filter string, present filtered results as domain values.
    - With _filter_ `F`, the effective domain query would be `GET /ermrest/catalog/N/entity/S:T/F` or equivalent.
	- The _filter_ SHOULD be validated according to the syntax summary below.
	- If a server response suggests the filter is invalid, an application SHOULD retry as if the _pattern_ is not present.
2. If _filter_ is not a valid filter string, proceed as if _pattern_ is not present.
3. If _pattern_ is not present, present unfiltered results.

Supported _filter_ language is the subset of ERMrest query path syntax
allowed in a single path element:

- Grouping: `(` _filter_ `)`
- Disjunction: _filter_ `;` _filter_
- Conjunction: _filter_ `&` _filter_
- Negation: `!` _filter_
- Unary predicates: _column_ `::null::`
- Binary predicates: _column_ _op_ _value_
  - Equality: `=`
  - Inequality: `::gt::`, `::lt::`, `::geq::`, `::leq::`
  - Regular expressions: `::regexp::`, `::ciregexp::`

Notably, _filters_ MUST NOT contain the path divider `/` nor any other
reserved syntax not summarized above. All _column_ names and _value_
literals MUST be URL-escaped to protect any special characters. All
_column_ names MUST match columns in the referenced table and MUST NOT
be qualified with table instance aliases.

### Tag: 2016 Column Display

`tag:isrd.isi.edu,2016:column-display`

This key allows specification of column data presentation options at the column level of the model.

Supported JSON payload patterns:

- `{` ... _context_ `:` `{` _option_ ... `}` ... `}`: Apply each _option_ to the presentation of column values in the given _context_.
- `{` ... _context1_ `:` _context2_ ... `}`: Short-hand to allow _context1_ to use the same options configured for _context2_.

See [Context Names](#context-names) section for the list of supported _context_ names.

Supported _option_ syntax:

- `"pre_format"`: _format_: The column value SHOULD be pre-formatted by evaluating the _format_ string with the raw column value as its sole argument. Please refer to [Pre Format Annotation document](pre-format.md) for detailed explanation of supported syntax.
- `"markdown_pattern":` _pattern_: The visual presentation of the column SHOULD be computed by performing [Pattern Expansion](#pattern-expansion) on _pattern_ to obtain a markdown-formatted text value which MAY be rendered using a markdown-aware renderer.
- `"column_order"`: `[` _columnorder_key_ ... `]`: An alternative sort method to apply when a client wants to semantically sort by this column.
- `"column_order": false`: Sorting by this column should not be offered.

Supported _columnorder_key_ syntax:

- `{ "column":` _columnname_ `, "descending": true }`: Sort according to the values in the _columnname_ column opposite of the order of current sort. For instance if asked to sort the column in descending order, sorting will be based on the ascending values of _columnname_ column.
- `{ "column":` _columnname_ `, "descending": false }`: Sort according to the values in the _columnname_ column.
- `{ "column":` _columnname_ `}`: If omitted, the `"descending"` field defaults to `false` as per above.
- _columnname_: A bare _columnname_ is a short-hand for `{ "column":` _columnname_ `}`.

All `pre_format` options for all columns in the table SHOULD be evaluated **prior** to any `markdown_pattern`, thus allowing raw data values to be adjusted by each column's _format_ option before they are substituted into any column's _pattern_.

The `column_order` annotation SHOULD always provide a meaningful semantic sort for the presented column content. `column_order` MAY be present because the preferred semantic sort may differ from a lexicographic sort of the storage column, e.g. a secondary "rank" column might provide a better order for coded values in the annotated storage column.

Column sorting heuristics (use first applicable rule):

1. Use the column's display `column_order` option, if present.
2. Sort by presented column value.

The first applicable rule MAY cause sorting to be disabled. Consider that determination final and do not continue to search subsequent rules.

### Tag: 2016 Table Display

`tag:isrd.isi.edu,2016:table-display`

This key allows specification of table presentation options at the table level of the model.

- `{` ... _context_ `:` `{` _option_ ... `}` ... `}`: Apply each _option_ to the presentation of table content in the given _context_.
- `{` ... _context1_ `:` _context2_ ... `}`: Short-hand to allow _context1_ to use the same options configured for _context2_.

See [Context Names](#context-names) section for the list of supported _context_ names.

Supported JSON _option_ payload patterns:

- `"row_order":` `[` _sortkey_ ... `]`: The list of one or more _sortkey_ defines the preferred or default order to present rows from a table. The ordered list of sort keys starts with a primary sort and optionally continues with secondary, tertiary, etc. sort keys. The given _sortkey_ s will be used as is (_columnorder_ SHOULD not be applied recursivly to this).
- `"page_size":` `_number_`: The default number of rows to be shown on a page.  
- `"collapse_toc_panel":` `_boolean_`: Controls whether the table of contents panel is collapsed on page load (only supported in `detailed` context).
- `"hide_column_headers":` `_boolean_`: Controls whether the column names headers and reparators between column values are shown (only supported in `detailed` context).
- `"page_markdown_pattern"`: _pagepattern_: Render the page by composing a markdown representation only when `page_markdown_pattern` is non-null.
  - Expand _pagepattern_ to obtain a markdown representation of whole page of dat via [Pattern Expansion](#pattern-expansion. In the pattern, you have access to a `$page` object that has the following attributes:
      - `values`: An array of values. You can access each column value using the `{{{$page.values.<index>.<column>}}}` where `<index>` is the index of array element that you want (starting with zero), and `<column>` is the column name (`{{{$page.values.0.RID}}}`).
      - `parent`: This variable is available when used for getting table content of related entities. Currently the `row_markdown_pattern` in `compact` context is used to provide a brief summary of table data. When used in this context, you can access the parent attributes under `$page.parent`. The attributes are:
        - `values`: the parent data `{{{$page.parent.values.RID}}}`.
        - `table`: the parent table name `{{{$page.parent.table}}}`.
        - `schema`: the parent schema name `{{{$page.parent.schema}}}`.
- `"row_markdown_pattern":` _rowpattern_: Render the row by composing a markdown representation only when `row_markdown_pattern` is non-null.
  - Expand _rowpattern_ to obtain a markdown representation of each row via [Pattern Expansion](#pattern-expansion). The pattern has access to column values **after** any processing implied by [2016 Column Display](#column-display).
- `"separator_markdown":` _separator_: Insert _separator_ markdown text between each expanded _rowpattern_ when presenting row sets. (Default new-line `"\n"`.)
  - Ignore if `"row_markdown_pattern"` is not also configured.
- `"prefix_markdown":` _prefix_: Insert _prefix_ markdown before the first _rowpattern_ expansion when presenting row sets. (Default empty string `""`.)
  - Ignore if `"row_markdown_pattern"` is not also configured.
- `"suffix_markdown":` _suffix_: Insert _suffix_ markdown after the last _rowpattern_ expansion when presenting row sets. (Default empty string `""`.)
  - Ignore if `"row_markdown_pattern"` is not also configured.
- `"module":` _module_ (NOT SUPPORTED IN CHAISE): Activate _module_ to present the entity set. The string literal _module_ name SHOULD be one that Chaise associates with a table-presentation plug-in.
- `"module_attribute_path":` _pathsuffix_ (NOT SUPPORTED IN CHAISE): Configure the data source for activated _module_. Ignore if _module_ is not configured or not understood.
  - If _pathsuffix_ is omitted, use the ERMrest `/entity/` API and a data path denoting the desired set of entities.
  - If _pathsuffix_ is specified, use the ERMrest `/attribute/` API and append _pathsuffix_ to a data path denoting the desired set of entities and which binds `S` as the table alias for this entire entity set.
    - The provided _pathsuffix_ MUST provide the appropriate projection-list to form a valid `/attribute/` API URI.
	- The _pathsuffix_ MAY join additional tables to the path and MAY project from these tables as well as the table bound to the `S` table alias.
	- The _pathsuffix_ SHOULD reset the path context to `$S` if it has joined other tables.

It is not meaningful to use `page_markdown_pattern`, `row_markdown_pattern`, and `module` in for the same _context_. If they co-exist, the application will prefer `module` over `page_markdown_pattern` and `page_markdown_pattern` over `row_markdown_pattern`.

Supported JSON _sortkey_ patterns:

- `{ "column":` _columnname_ `, "descending": true }`: Sort according to the values in the _columnname_ column in descending order. This is equivalent to the ERMrest sort specifier `@sort(` _columnname_ `::desc::` `)`.
- `{ "column":` _columnname_ `, "descending": false }`: Sort according to the values in the _columnname_ column in ascending order. This is equivalent to the ERMrest sort specifier `@sort(` _columnname_ `)`.
- `{ "column":` _columnname_ `}`: If omitted, the `"descending"` field defaults to `false` as per above.
- _columnname_: A bare _columnname_ is a short-hand for `{ "column":` _columnname_ `}`.

#### Table Display Settings Hierarchy

The table display settings apply only to tables, but MAY be annotated at the schema level to set a schema-wide default, if appropriate in a particular model. Any table-level specification of these settings will override the behavior for that table. These settings on other model elements are meaningless and ignored.

For hierarchically inheritable settings, an explicit setting of `null` will turn *off* inheritance and restore default behavior for that model element and any of its nested elements.

### Tag: 2016 Visible Foreign Keys

`tag:isrd.isi.edu,2016:visible-foreign-keys`

This key indicates that the presentation order and visibility for
foreign keys referencing a table, useful when presenting "related entities".

Supported JSON payload pattern:

- `{` ... _context_ `:` _fkeylist_ `,` ... `}`: A separate _fkeylist_ can be specified for any number of _context_ names.
- `{` ... _context1_ `:` _context2_ ... `}`: Short-hand to allow _context1_ to use the same fkeylist configured for _context2_.

For presentation contexts which are not listed in the annotation, or when the annotation is entirely absent, all available foreign keys SHOULD be presented unless the application has guidance from other sources. See [Context Names](#context-names) section for the list of supported _context_ names.

Supported _fkeylist_ patterns:

- `[` `[` _schema name_`,` _constraint name_ `]` `,` ... `]`: Present foreign keys with matching _schema name_ and _constraint name_, in the order specified in the list. Ignore constraint names that do not correspond to foreign keys in the catalog. Do not present foreign keys that are not mentioned in the list. These 2-element lists use the same format as each element in the `names` property of foreign keys in the JSON model introspection output of ERMrest. The foreign keys MUST represent inbound relationships to the current table.
- `{ "source": ` _sourceentry_ `}`:  Defines a pseudo-column based on the given _sourceentry_. For detailed explanation and examples please refer to [here](pseudo-columns.md#examples). Other optional attributes that this JSON document can have are:
  - `markdown_name`: The markdown to use in place of the default heuristics for title of column.
  - `display`: The display settings to use for generating the value for this column. Please refer to [pseudo-columns display document](pseudo-column-display.md) for more information. The following are attributes that are applicable here:
     - `markdown_pattern`: The markdown pattern that can be used for generating a custom display for the related table. If this is missing, we're going to provided `row_markdown_pattern` in the `table-display` annotation for the custom display. And if it's missing from that annotation as well, Chaise will not provide any custom display.
     - `template_engine`: The template enginge that should be used for the `markdown_pattern`.
     - `wait_for`: List of pseudo-column [`sourcekey`](#tag-2019-source-definitions)s that used in `markdown_pattern`. You should list all the all-outbound, aggregates, and entity sets that you are using.
- `{ "sourcekey": ` _sourcekey_ `}`: Defines a pseudo-column based on the given _sourcekey_.

Supported _sourceentry_ pattern in here:
  - _path_: An array of _foreign key path_ that ends with a _columnname_ that will be projected. _foreign key path_ is in the following format:

          "`{` _direction_ `:[` *schema name*`,` *constraint name* `]}` "
      Where _direction_ is either `inbound`, or `outbound`.

Supported _sourcekey_ pattern in here:
  - A string literal that refers to any of the defined sources in [`source-definitions` annotations](#tag-2019-source-definitions).


### Tag: 2016 Table Alternatives

`tag:isrd.isi.edu,2016:table-alternatives`

This key indicates that the annotated table (e.g. the base storage table) has abstracted views/tables that should be used as _alternataive_ tables in different contexts. This means that they both represent the same _entity set_ but
the alternative one has modified the representation of each entity in some way.

Supported JSON payload patterns:

- `{` ... _context_ `:` [ _sname_, _tname_] `,` ... `}`: The table identified by _sname_:_tname_ is an alternative table to be used instead of the annoted table in the specified context.

A alternative table or view which abstracts another table _SHOULD_ have a non-null (psuedo) primary key which is also a foreign key to the base storage table. The base storage table is the one bearing this annotation. Otherwise, a consuming application would not know how to navigate from one abstracted representation of an entity to another representation from the base storage tables.

See [Context Names](#context-names) section for the list of supported _context_ names. It is assumed that any application context that is performing mutation (record creation, deletion, or editing) MUST use a base entity storage table that is not an abstraction over another table. However, the use of the `detailed` or `compact` context MAY offer an abstraction that augments the presentation of an existing record. An application offering mutation options while displaying an existing entity record might then present the data from the `detailed` or `compact` abstraction but only offer editing or data-entry controls on the fields available from the base storage table.

### Tag: 2019 Export

`tag:isrd.isi.edu,2019:export`

This key can be used to define export templates that will be used for `ioboxd` service integration with the client tools. For more information about the annotation payload please visit [this document](export.md).

Supported JSON payload patterns:

- `{` ... _context_ `:` `{` `"templates":` `[`_template_`]` `}` `,` ... `}`: An array of template objects to export.
- `{` ... _context1_ `:` _context2_ ... `}`: Short-hand to allow _context1_ to use the same templates configured for _context2_.

Supported _template_ patterns:
- `{` ... `"displayname:"` _displayname_ ... `}`: The display name that will be used to populate the Chaise export drop-down for this _template_.
- `{` ... `"type:"` _type_ ... `}` One of two keywords; _"FILE"_ or _"BAG"_, used to determine the container format for results.
- `{`... `"outputs":` `[`_output_`]` ... `}`: An array of _output_ objects. If the template type is _"BAG"_ you MAY leave this attribute and not define it. In this case, the default `outputs` that the client generates will be used.

Supported _output_ patterns:
- `{`... `"source:"` _sourceentry_ ... `}`: An object that contains parameters used to generate source data by querying ERMrest.
- `{`... `"destination":` _destinationentry_  ... `}`: An object that contains parameters used to render the results of the source query into a specified destination format.

Supported _sourceentry_ patterns:
- `{` ... `"api:"` _api_ ... `}`: The type of ERMrest query projection to perform. Valid values are _entity_, _attribute_, and _attributegroup_.
- `{` ... `"path":` _path_ ... `}`: An optional ERMrest path predicate. The string MUST be escaped according to [RFC 3986](https://tools.ietf.org/html/rfc3986) if it contains user-generated identifiers that use the reserved character set. See the [ERMRest URL conventions](https://github.com/informatics-isi-edu/ermrest/blob/master/docs/api-doc/index.md#url-conventions) for additional information.

Supported _destinationentry_ patterns:
- `{` ... `"name":` _name_ ... `}`: The base name to use for the output file.
- `{` ... `"type":` _type_ ... `}`: A type keyword that determines the output format. Supported values are dependent on the `template`.`type` selected. For the `FILE` type, the values `csv`, `json`, are currently supported. For the `BAG` type, the values `csv`, `json`, `fetch` and `download` are currently supported.
- `{` ... `"params":` _params_ ... `}`: An optional object containing destination format-specific parameters.  Some destination formats (particularly those that require some kind of post-processing or data transformation), may require additional parameters  to be specified.

#### Export Annotation Hierarchy

This annotation only applies to table but MAY be annotated at the schema level to set a schema-wide default. If the annotation is missing on the table, we will get the export definition from the schema.

#### Heurisistics

If the annotation is missing from the table and the schema, client MAY apply a set of heuristics. Currently, chaise will apply some heursitscs only in `detailed` context (record app) which you can find more information about it [in here](export.md#how-ermrestjs-interperts-it).

### Tag: 2016 Export (_Deprecated_)

`tag:isrd.isi.edu,2016:export`

> This tag is the old version of [2019 Export](#tag-2019-export) tag. The new tag supports contextualization and is preferred. Templates defined under this tag will be interpreted as `"*"` context of `tag:isrd.isi.edu,2019:export`. If both `tag:isrd.isi.edu,2016:export` and `tag:isrd.isi.edu,2019:export` for `"*"` context are defined, the `tag:isrd.isi.edu,2016:export` will be ignored.

This key can be used to define export templates that will be used for `ioboxd` service integration with the client tools. For more information about the annotation payload please visit [the iobodx integration document](https://github.com/informatics-isi-edu/ioboxd/blob/master/doc/integration.md).

Supported JSON payload pattern:

- `{` `"templates":` `[`_template_`]` `}`: An array of _template_ objects to export.

Please refer to [2019 Export](#tag-2019-export) for more information about the supported _template_ patterns.

### Tag: 2017 Asset

`tag:isrd.isi.edu,2017:asset`

This key indicates that the annotated column stores asset locations. An _asset_ is a generic, fixed-length octet-stream of data, i.e. a "file" or "object" which can be stored, retrieved, and interpreted by consumers.

An asset _location_ is a _globally unique_ and _resolvable_ string, used to reference and retrieve the identified asset either directly or indirectly through a resolution service. For example, an HTTP URL is both globally unique and resolvable. In the case of a relative URL, the client should resolve the URL within the context from which it was retrieved. Persistent identifier schemes MAY be used such as MINID, DOI, ARK, or PURL. It is up to client tooling to recognize and resolve identifiers in such schemes.

A new asset location may be specified via a pattern to induce a prospective asset location based on known metadata values, i.e. to normalize where to upload and store a new asset in a data-submission process. Only meaningful where clients can request creation of new assets with a desired location.

Supported JSON payload patterns:

- `{`... `"url_pattern": ` _pattern_ ...`}`: A desired upload location can be derived by [Pattern Expansion](#pattern-expansion) on _pattern_. This attribute is required for browser upload and if it is not specified the client will not provide the browser upload feature. See implementation notes below.
- `{`... `"browser_upload": ` `false` ... `}`: If `url_pattern` is availale and valid browser upload feature will be enabled. If you want to force disabling this feature set it to `false`.
- `{`... `"filename_column": ` _column_ ...`}`: The _column_ stores the filename of the asset.
- `{`... `"byte_count_column": ` _column_ ...`}`: The _column_ stores the file size in bytes of the asset. It SHOULD be an integer typed column.
- `{`... `"md5": ` _column_ | `true` ...`}`: If _column_, then the _column_ stores the checksum generated by the 'md5' cryptographic hash function. It MUST be ASCII/UTF-8 hexadecimal encoded. If `true`, then the client SHOULD generate a 'md5' checksum and communicate it to the asset storage service according to its protocol.
- `{`... `"sha256": ` _column_ | `true` ...`}`: If _column_, then the _column_ stores the checksum generated by the 'sha256' cryptographic hash function. It MUST be ASCII/UTF-8 hexadecimal encoded. If `true`, then the client SHOULD generate a 'sha256' checksum and communicate it to the asset storage service according to its protocol. See implementation notes below.
- `{`... `"filename_ext_filter": [` { _filename extension_ [`,` _filename extension_ ]\* } `]` ...`}`: This property specifies a set of _filename extension_ filters for use by upload agents to indicate to the user the acceptable filename patterns (`.jpg`, `.png`, `.pdf`, ...). For example, `.jpg` would indicate that only JPEG files should be selected by the user.

Default heuristics:
- The `2017 Asset` annotation explicitly indicates that the associated column is the asset location.
- `url_pattern` MUST be specified for browser upload. If it is not specified or if it produces a null value, the browser upload will be disabled.
- Column MUST be `text` typed. Otherwise the asset annotation will be ignored.
- In addition to native columns, the following properties are also available under the annotated column object and can be referred in the _pattern_ e.g. `{{{_URI.md5_hex}}}` where `URI` is the annotated column (notice the [underscore before the column name](mustache-templating.md#raw-values)).
  - `md5_hex` for hex  
  - `md5_base64` for base64
  - `filename` for filename
  - `size` for size in bytes
- Nothing may be inferred without additional payload patterns present.

Protocol-specific metadata retrieval MAY be applied once an asset location is known. How to present or reconcile contradictions in metadata found in multiple sources is beyond the scope of this specification.
- Some applications may treat ERMrest data as prefetched or cached metadata.
- Some applications may treat ERMrest data as authoritative metadata registries.
- Some location schemes may define authoritative metadata resolution procedures.

At present, the Chaise implementation of the asset annotation has the following limitations:
1. 'generated' column(s) participating in the `url_pattern` are only supported in the `entry/edit` context and _not_ in the `entry/create` context. This is because the `generated` column values are usually generated by the server during the record creation and will not be available to Chaise while the users are supplying information. If you wish to use 'generated' column(s) in the `url_pattern`, you will need to use the [2016 Visible Columns](#visible-columns) annotation and leave the asset column out of the list of visible columns for its `entry/create` context.
2. `sha256` is not presently supported.
3. If `url_pattern` is not available or `browser_upload` is `false` Chaise will show a disabled form field for the asset column. It will still provide the download button in read-only contexts.

### Tag: 2018 Citation

`tag:isrd.isi.edu,2018:citation`

This key indicates that the annotated table has a format for defining citations for the rows. A _citation_ defines the given row in a way that it can be shared and referenced in other works. Each pattern in the citation annotation is consumed by the client and presented in a way defined by the client.

Supported JSON payload patterns:

- `{`... `"journal_pattern": ` _pattern_ ...`}`: A desired journal value can be derived by [Pattern Expansion](#pattern-expansion) on _pattern_. This attribute is required for the citation feature and if it is not specified, the client will not provide the citation display feature. See implementation notes below.
- `{`... `"author_pattern": ` _pattern_ ...`}`: A desired author value can be derived by [Pattern Expansion](#pattern-expansion) on _pattern_.
- `{`... `"title_pattern": ` _pattern_ ...`}`: A desired title value can be derived by [Pattern Expansion](#pattern-expansion) on _pattern_.
- `{`... `"year_pattern": ` _pattern_ ...`}`: A desired year value can be derived by [Pattern Expansion](#pattern-expansion) on _pattern_. This attribute is required for the citation feature and if it is not specified, the client will not provide the citation display feature. See implementation notes below.
- `{`... `"url_pattern": ` _pattern_ ...`}`: A desired url value can be derived by [Pattern Expansion](#pattern-expansion) on _pattern_. This attribute is required for the citation feature and if it is not specified, the client will not provide the citation display feature. See implementation notes below.
- `{`... `"id_pattern": ` _pattern_ ...`}`: A desired id value can be derived by [Pattern Expansion](#pattern-expansion) on _pattern_.
- `{`... `"wait_for":` _waitForList_ ... `}`: List of pseudo-column [`sourcekey`](#tag-2019-source-definitions)s that are used in any of the provided patterns. You should list all the all-outbound, aggregates, and entity sets that you are using.

Supported _waitForList_ pattern:

- `[` ... _sourcekey_ `,` ... `]`: _sourcekey_ is the string literal that refers to the sources defined in the [`source-definitions` annotation](#tag-2019-source-definitions) of the table.

Default heuristics:
- `journal_pattern`, `year_pattern`, and `url_pattern` MUST be specified for citation. If any of the 3 are not specified or if one of them produces a null value, citation will be disabled.
- If any of the other values are not present or produce a null value, it is up to the client to decide how to display the citation.

At present, the Chaise implementation of the citation annotation has the following limitations:
1. If `journal_pattern`, `year_pattern`, or `url_pattern` is not available, Chaise will not show a Citation list option in the Share dialog.
2. Chaise will try to show the 3 non-required fields if they are present and their templates don't produce a null value.

### Tag: 2018 Required

`tag:isrd.isi.edu,2018:required`

This key indicates that the values for a given model element will be required by
the system. This key is allowed on any number of columns. There is no content for this key.

### Tag: 2018 Indexing Preferences

`tag:isrd.isi.edu,2018:indexing-preferences`

This key indicates that the annotated table or column should follow a different indexing strategy. At the time of writing, this is the only annotation recognized by ERMrest which affects service behavior (all others are opaque key-value storage only affecting clients).

Meaning on different model elements:
- On tables: requests a table-wide indexing strategy
- On columns: requests a column-specific indexing strategy (may override table-wide preferences)

Supported JSON payload patterns:
- `{`... `"btree"`: _preference_ ...`}`: Specifies a preference for PostgreSQL `btree` indexing.
- `{`... `"trgm"`: _preference_ ...`}`: Specifies a preference for PostgreSQL `pg_trgm` (text tri-gram) indexing.

Supported _preference_ patterns:
- `true`: An index is desired.
- `false`: An index is not desired.
- `null` (or field absent): The default is desired (currently all indexing is enabled by default).

If a column-level annotation sets a _preference_ of `null`, this suppresses any table-wide _preference_ for the same indexing type, requesting built-in service defaults for the column.

This annotation is a hint to ERMrest during table or column creation, when indexes are built. Therefore, administrators SHOULD supply the annotation within table or column creation requests. Manipulation of the annotation on existing tables or columns will not change the indexes which are already present (or absent) on those existing models. However, changes to the table annotation will affect any columns added later, unless their column-creation requests override the table-wide preferences.

### Tag: 2019 Chaise Config

`tag:isrd.isi.edu,2019:chaise-config`

This key indicates that the annotated catalog has a specific [chaise configuration](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/chaise-config.md) that should override the default chaise-config properties and any properties defined in `chasie-config.js`.

Supported JSON payload patterns:
The json object follows the same rules as [chaise-config.js](https://github.com/informatics-isi-edu/chaise/blob/master/chaise-config-sample.js). All properties can be defined at the root of the annotation, i.e:
  - `{`... `"<chaise-config-property>"`: _value_ ...`}`

The `chaise-config` property `configRules`, behaves the same way on the annotation that it does with the server wide config (`chaise-config.js`). The `configRules` will be checked for a match and apply and use those `chaise-config` properties over any other values defined for that same property. The order that the properties will be checked and then applied are as follows:
  1. Default values defined in [chaise configuration document](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/chaise-config.md).
  2. Any properties defined at the root of the object returned from [chaise-config.js](https://github.com/informatics-isi-edu/chaise/blob/master/chaise-config-sample.js).
  3. Any matching `configRules` in the order they appear in the `configRules` array. Properties in the last matching rule will take precedence
  4. Any properties defined at the root of the object returned from this annotation.
  5. Step 3 from above, but with the `configRules` from this annotation.

This means that as the `configRules` are checked, properties set in step 1 will be overridden by properties defined in step 2 that have the same name. This allows the server wide configuration to be a base configuration for the chaise apps and allows for further configuration based on a combination of hostname and catalog id.

Note: Some properties might not make sense to be used in this annotation. The `defaultCatalog`, for instance, would be ignored if defined it this annotation because we already fetched a matching catalog to then fetch this annotation.

### Tag: 2019 Source Definitions

`tag:isrd.isi.edu,2019:source-definitions`

Using this key you can,

- Define `sources` that can be used in `visible-columns` and `visible-foreign-keys` annotations.
- Define `sources` that can be used in the `wait_for` definition of `visible-columns`, `visible-foreign-keys`, and `citation` annotations.
- Define list of column names and outbound foreign keys that should be available in the templating environments (Please refer to [this document](pseudo-column-template.md) for more information).
- Modify the behavior of main search box in recordset page.

Example:

```json
"tag:isrd.isi.edu,2019:source-definitions": {
    "columns": true,
    "fkeys": true,
    "sources": {
        "source-1": {
            "source": [{"inbound": ["schema", "fk1"]}, "RID"],
            "entity": true,
            "aggregate": "array_d"
        },
        "search-box": {
            "or": [
                {"source": "column1", "markdown_name": "another name"},
                {"source": "column2"},
                {"source": "column3", "markdown_name": "Column 3 name"},
            ]
        }
    }
}
```

> If you define this annotation, you have to define all three attributes. If you do not providing any values for `columns` and `fkeys`, chaise will not provide data for any columns or outbound foreign keys in templating environments.

Supported JSON payload patterns:

- `{` ... `"sources":` _sourcedefinitions_ `,` ... `}`: the source definitions that will allow you to refer to them by just using the defined _sourcekey_.
- `{` ... `"fkeys":` _fkeylist_  `,` ... `}`: Array of foreign key constraints that will be mapped into `$fkey_schema_contraint` key in templating environments.
- `{` ... `"columns":` _columns_  `,` ... `}`: Array of column names that their data will be available in templating environments.


Supported _sourcedefinitions_ patterns:

- `{` ... `"` _sourcekey_ `":{ "source":` _sourceentry_ `},` ... `}`: where _sourcekey_ is a name that will be used to refer to the defined _sourceentry_. Since you're defining a pseudo-column here, you can use [any of the pseudo-column optional parameters that the syntax allows (e.g., `aggregate`, `entity`, `display`, `markdown_name`)](pseudo-columns.md).

- `{` ... `"search-box": { "or": [` _searchcolumn_ `,` ... `]} }`: Configure list of search columns.

Supported _sourcekey_ pattern:
 - A string literal that,
   - Cannot start with `$`.
   - Should not be any of the table's column names.
   - `search-box` is a reserved _sourcekey_ and cannot be used.

Supported _sourceentry_ pattern:
  - _columnname_: : A string literal. _columnname_ identifies a constituent column of the table.
  - _path_: An array of _foreign key path_ that ends with a _columnname_ that will be projected. _foreign key path_ is in the following format:

          "`{` _direction_ `:[` *schema name*`,` *constraint name* `]}` "
      Where _direction_ is either `inbound`, or `outbound`.

Supported _searchcolumn_ pattern:
 - `{ "source":` _columnname_  `}`: Defines a search column based on the given string literal of _columnname_. Other optional attributes that this JSON document can have are:
   - `markdown_name`: The client will show the displayname of columns as placeholder in the search box. To modify this default behavior, you can use this attribute.

Supported _fkeylist_ patterns:

- `[` `[` _schema name_`,` _constraint name_ `]` `,` ... `]`: Present foreign keys with matching _schema name_ and _constraint name_, in the order specified in the list. Ignore constraint names that do not correspond to foreign keys in the catalog. Do not present foreign keys that are not mentioned in the list. These 2-element lists use the same format as each element in the `names` property of foreign keys in the JSON model introspection output of ERMrest. The foreign keys MUST represent inbound relationships to the current table.
- `true`: By setting the value of `"fkeys"` to `true`, chaise will provide the data for all the outbound foreign keys fo the table in templating environments.
- _Any other values_ : In this case chaise will not provide any foreign key data in templating environments.

Supported _columns_ patterns:

- `[` _columname_ `,` ... `]`: A string literal _columnname_ identifies a constituent column of the table.
- `true`: By setting the value of `"columns"` to `true`, chaise will provide the data for all the outbound foreign keys fo the table in templating environments.
- _Any other values_ : In this case chaise will not provide any foreign key data in templating environments.

### Context Names

List of _context_ names that are used in ERMrest:

- `"compact"`: Any compact, tabular presentation of data from multiple entities.
  - `"compact/brief"`: A limited compact, tabular presentation of data from multiple entities to be shown under the `detailed` context. In this context, only a page of data will be shown with a link to the access the `compact` context for more detail (related entities section).  
  - `"compact/brief/inline"`: A limited inline, compact, tabular presentation of data from multiple entities to be shown under the `detailed` context. In this context, only a page of data will be shown with a link to the access the `compact` context for more detail (inline related entities section).  
  - `"compact/select"`: A sub-context of `compact` that is used for selecting entities, e.g. when prompting the user for choosing a foreign key or facet value.
- `"detailed"`: Any detailed read-only, entity-level presentation context.
- `"entry"`: Any data-entry presentation context, i.e. when prompting the user for input column values.
  - `"entry/edit"`: A sub-context of `entry` that only applies to editing existing resources.
  - `"entry/create"`: A sub-context of `entry` that only applies to creating new resources.
- `"export"`: Controls the presentations related to the export.
- `"filter"`: Any data-filtering control context, i.e. when prompting the user for column constraints or facets.
- `"row_name"`: Any abbreviated title-like presentation context.
  - `"row_name/title"`: A sub-context of `row_name` that only applies to title of page.
  - `"row_name/compact"`: A sub-context of `row_name` that only applies to compact, tabular presentation of a row (When a foreignkey value is displayed in a tabular presentation. Or when displaying an entity array aggregate pseudo-column).
  - `"row_name/detailed"`: A sub-context of `row_name` that only applies to entity-level presentation of a row (When a foreignkey value is displayed in the entity-level page).
- `"*"`: A default to apply for any context not matched by a more specific context name.

If more than one _context_ name in the annotation payload matches, the _options_ should be combined in the following order (first occurrence wins):

1. Prefer _option_ set in matching contexts with exact matching context name.
2. Prefer _option_ set in matching contexts with longest matching prefix, e.g. an option for `entry` can match application context `entry/edit` or `entry/create`.
3. Use default _option_ set in context `*`.

The following matrix illustrates which context is meaningful in which annotation.

| Annotation                                                  | compact | compact/brief | compact/brief/inline | compact/select | detailed | entry | entry/edit | entry/create | export | filter | row_name | * |
|-------------------------------------------------------------|---------|---------------|----------------------|----------------|----------|-------|------------|--------------|--------|--------|----------|---|
| [2015 Display](#tag-2015-display)                           | X       | X             | X                    | X              | X        | -     | -          | -            | -      | -      | -        | X |
| [2016 Ignore](#tag-2016-ignore)                             | X       | X             | X                    | X              | X        | X     | X          | X            | -      | -      | -        | X |
| [2016 Visible Columns](#tag-2016-visible-columns)           | X       | X             | X                    | X              | X        | X     | X          | X            | X      | X      | -        | X |
| [2017 Key Display](#tag-2017-key-display)                   | X       | X             | X                    | X              | X        | -     | -          | -            |        | -      | -        | X |
| [2016 Column Display](#tag-2016-column-display)             | X       | X             | X                    | X              | X        | X     | X          | X            | -      | -      | -        | X |
| [2016 Table Display](#tag-2016-table-display)               | X       | X             | X                    | X              | X        | -     | -          | -            | -      | -      | X        | X |
| [2016 Visible Foreign Keys](#tag-2016-visible-foreign-keys) | -       | -             | -                    | -              | X        | -     | -          | -            | -      | -      | -        | X |
| [2016 Table Alternatives](#tag-2016-table-alternatives)     | X       | X             | X                    | X              | X        | X     | X          | X            | -      | -      | -        | X |
| [2019 Export](#tag-2019-export)                             | X       | -             | -                    | -              | X        | -     | -          | -            | -      | -      | -        | - |

## Pattern Expansion

When deriving a field value from a _pattern_, the _pattern_ MAY contain markers for substring replacements of the form `{{column name}}` or `{{{ column name}}}` where `column name` MUST reference a column in the table. Any particular column name MAY be referenced and expanded zero or more times in the same _pattern_. Each pattern is passed through a templating environment. By default, this templating environment is `Mustache`. A `template_engine` parameter can be defined alongside any _pattern_ to define which templating engine to use. Currently you can choose between `handlebars` and `mustache`. For detailed explanation on template and markdown language please refer to [Mustache Templating](mustache-templating.md) and [Handlebars Templating](handlebars.md) documents.

As an example, a _column_ may have a [`tag:isrd.isi.edu,2016:column-display`](#tag-2016-column-display) annotation containing the following payload:

```
{
   "*" : {
       "markdown_pattern": "[{{{title}}}](https://dev.isrd.isi.edu/chaise/search?name={{{_name}}})",
       "template_engine": "handlebars"
   }
}
```

A web user agent that consumes this annotation and the related table data would likely display the following as the value of the column:

```
<p>
    <img src="https://dev.isrd.isi.edu/chaise/search?name=col%20name" alt="Title of Image">
</p>
```
