# Facet JSON Structure

## Structure

The overall structure of filters is as follows. Each facet term combines a data source and constraint spec, and so all combinations of constraint kind and data source path are possible in the syntax.

```
<FILTERS>:  { <logical-operator>: <TERMSET> }

<TERMSET>: '[' <TERM> [, <TERM>]* ']'

<TERM>:     { <logical-operator>: <TERMSET> }
            or
            { "source": <data-source>, <constraint(s)>, <extra-attribute(s)> }
            or
            { "sourcekey": <source-key>, <constraint(s)>, <extra-attribute(s)> }
```

In the following sections each of location operators, data source, constraints, and extra attributes are explained. You can also find some examples at the end of this document.

## Logical operators

We want the structure to be as general as possible, so we don't need to redesign the whole structure when we need to support more complex queries. Therefore as the top level, we have logical operators.

    { "and": [ term... ] }
    { "or": [ term... ]}
    { "not": term }

The current implementation of faceting in Chaise only supports `and`. The rest of logical operators are currently not supported.

## Data source

Data source captures the source of filter. It can either be
- one of current table's column.
- a column in a table that has a valid foreign key relationship with the current table.

Even if we are faceting on a vocabulary concept and just want the user to pick values by displayed *row name* and we substitute the actual entity keys in the ERMrest query, we must record this column choice explicitly in the facet spec so that the resulting faceting app URL is unambiguous even if there have been subtle model changes in the interim, which might change the default key selection heuristics etc.

> Based on this, we are not supporting filtering on foreign keys with composite keys.

Therefore the following are acceptable ways of defining data source:

- A column name string literal (an array of one string is also acceptable):
  ```
  {"source": "column"}
  {"source": ["column"]}
  ```
- An array of _path element_ that ends with a _columnname_ that will be projected and filtered.

  - `[` _path element_  `,`  _columnname_`]`

  Each anterior element MAY use one of the following sub-document structures:

  - `{ "sourcekey":` _sourcekey prefix_ `}`
    - Only acceptable as the first element. Please refer to [Data source with reusable prefix](#data-source-with-reusable-prefix) for more information.
    - _sourcekey prefix_ is a string literal that refers to any of the defined sources in [`source-definitions` annotations](annotation.md#tag-2019-source-definitions)

  - `{` _direction_ `:` _fkeyname_ `}`
    - Links a new table instance to the existing path via join.
    - _direction_ can either be `"inbound"`, or `"outbound"`.
    - _fkeyname_ is the given name of the foreign key which is usually in the following format: `[` _schema name_ `,` _constraint name_ `]`

  - `{ "and": [` _filter_ `,` ... `], "negate": ` _negate_ `}`
    - A logical conjunction of multiple _filter_ clauses is applied to the query to constrain matching rows.
	- The logical result is negated only if _negate_ is `true`.
	- Each _filter_ clause may be a terminal filter element, conjunction, or disjunction.

  - `{ "or": [` _filter_ `,` ... `], "negate": ` _negate_ `}`
    - A logical disjunction of multiple _filter_ clauses is applied to the query to constrain matching rows.
	  - The logical result is negated only if _negate_ is `true`.
	  - Each _filter_ clause may be a terminal filter element, conjunction, or disjunction.

  - `{ "filter":` _column_ `, "operand_pattern":` _value_ `, "operator":` _operator_ `, "negate":` _negate_ `}`
    - An individual filter _path element_ is applied to the query or individual _filter_ clauses participate in a conjunction or disjunction.

    - The filter constrains a named _column_ in the current context table.

    - The _operator_ specifies the constraint operator via one of the valid operator names in the ERMrest REST API, which are

        | operator  | meaning |
        |-----------|---------|
        | `::null::`| column is `null`     |
        | `=`      | column equals value |
        | `::lt::` | column less than value |
        | `::leq::` | column less than or equal to value |
        | `::gt::` | column greater than value |
        | `::geq::` | column greater than or equal to value |
        | `::regexp::` | column matches regular expression value |
        | `::ciregexp::` | column matches regular expression value case-insensitively |
        | `::ts::` | column matches text-search query value |

      > If `operator` is missing, we will use `=` by default.

    - The _value_ specifies the constant operand for a binary constraint operator and must be computed to a non-empty value. [Pattern expansion](annotation.md#pattern-expansion) MAY be used to access [the pre-defined values in templating envorinment](mustache-templating.md#using-pre-defined-attributes). Like other pattern expansions the default `template_engine` will be applied and if you want to change it, you can define `template_engine` alongside the `operand_pattern`.

    - The logical result of the constraint is negated only if _negate_ is `true`.


  The following are some examples of defining data source:
  ```
  [{"inbound": ["S1", "FK1"]}, "Column2"]
  [{"inbound": ["S1", "FK1"]}, {"outbound": ["S2", "FK2"]}, "Column3"]
  [{"inbound": ["S1", "FK1"]}, {"filter": "RCB", "operand_pattern": "{{{$session.id}}}"}, "Column3"]
  ```
### Data source with reusable prefix

 In some cases, the defined foreign key paths for different columns/facets might be sharing the same prefix. In those cases, reusing the prefix allows sharing certain joined table instances rather than introducing more "copies" as each facet is activated which in turn will increase the performance.

 To do this, you would have to use [`2019:source-definitions`](annotation.md#tag-2019-source-definitions) annotation and define the shared prefix. Then you can use `sourcekey` to refer to this shared prefix in the data source.

 - When using a prefix, the prefix's last column and all the other extra attributes on it will be ignored for the purpose of prefix.
- You can use recursive prefixes. If we detect a circular dependency, we're going to invalidate the given definition.
- While using prefix, you MUST add extra foreign key paths to the relationship. The following is not an acceptable source:
  ```
  [ {"sourcekey": "path_2"}, "RID" ]
  ```
 - Since our goal is to reuse the join instance as much as we can, all-outbound foreign keys can also share the same join instances.


 For example, assume the following is the ERD of table:

![erd_01](https://raw.githubusercontent.com/informatics-isi-edu/ermrestjs/master/docs/resources/facet-json-structure-path-prefix-erd-01.png)

And the following is source-definition and visible-columns annotation:

 ```json
"tag:isrd.isi.edu,2019:source-definitions`": {
  "sources": {
    "path_to_o1": {
        "source": [
            {"outbound": ["schema", "const1"]},
            "o1_col"
        ]
    },
    "path_to_o1_o1": {
        "source": [
            {"sourcekey": "path_to_path_prefix_o1"},
            {"outbound": ["schema", "const2"]},
            "o1_o1_col"
        ]
    }
  }
},
"tag:isrd.isi.edu,2016:visible-columns": {
  "compact": [
    "id",
    {
      "sourcekey": "path_to_o1",
    },
    {
      "sourcekey": "path_to_o1_o1",
    },
    {
      "source": [
        {"sourcekey": "path_to_o1"},
        {"outbound": ["schema", "const3"]},
        "o1_o1_o1_col"
      ]
    }
  ]

}
```

Then this is a valid facet blob:
```json
{
  "and": [
    {
        "source":  [
            {"sourcekey": "path_to_o1_o1"},
            {"inbound": ["faceting_schema", "const4"]},
            "o1_o1_i1_col"
        ],
        "choices": ["v1"]
    },
    {
        "sourcekey": "path_to_o1_o1",
        "choices": ["v2"]
    }
  ]
}
```
Which is roughly translated to the following ERMrest query:

```
M:=schema:main/
M_P2:=(fk_col)=(schema:o1:RID)/M_P1:=(fk_col)=(schema:o1_o1:RID)/
(RID)=(schema:o1_o1_i1:fk_col)/o1_o1_i1_col=v1/$M/

$M_P1/o1_o1_col=v2/$M/

$M_P1/F3:=left(fk_col)=(schema:o1_o1_o1:RID)/$M/
RID;M:=array_d(M:*),F3:=array_d(F3:*),F2:=array_d(M_P1:*),F1:=array_d(M_P2:*)@sort(RID)
```
## Source key

Instead of defining a new `source`, you can refer to the sources that are defined in [`2019:source-definitions`](annotation.md#tag-2019-source-definitions) by using `sourcekey` attribute. For instance, assuming `path_to_table_1` is a valid source definition, you can do

```
{"sourcekey": "path_to_table_1"}
```

## Constraints

There are three kinds of constraint right now:
1. Discrete choice e.g. maps to a checklist or similar UX
2. Half-open or closed intervals, e.g. maps to a slider or similar UX
3. Substring search, e.g. maps to a search box UX
4. Match any record with value (not-null).

Conceptually, this should correspond to three possible syntactic forms:

    {"choices": [ value, ... ]}
    {"ranges": [ {"min": lower, "max": upper}, ...]}
    {"search": [ "box content" ]}
    {"not_null": true}

A half-open range might be `{"min" lower}` or `{"max": upper}`. By default both `min` and `max` are inclusive. To use exclusive ranges you can use `min_exclusive:true` or `max_exclusive: true`.

## Extra attributes

#### entity v.s. scalar facet
 If the facet can be treated as entity (the column that is being used for facet is key of the table), setting `entity` attribute to `false` will force the facet to show scalar mode.

```javascript
"entity": false
```

<!-- Not implemented
#### Mix-ins
If a multi-modal facet control UX is available, we might even mix-in several forms of constraint on the same source. We also probably need a way to specify the preferred `ux_mode` when the facets are first rendered. For now, these options are `choices`, `search`, or `range`. We can change these values when we are done withe the UX. :

    {"source": "Column1", "choices": ["outlier"], "search": ["sub"], "ranges": [{"min": "xylephone"], "ux mode":"choices"}

The mixing of several constraints would be disjunctive to be consistent with the disjunctive list of options in each constraint.
-->

#### markdown_name

To change the default displayname of facets, `markdown_name` can be used.

```javascript
"markdown_name": "**new name**"
```

### comment

The tooltip to be used in place of the default heuristics for the facet. Set this to `false` if you don't want any tooltip.
#### open

Using `open` you can force the facet to open by default.

```javascript
"open": true
```

#### ux_mode

 If a multi-modal facet control UX is available, it will specify the default UX mode that should be used (If `ux_mode` is defined, the other type of constraint will not be displayed even if you have defined it in the annotation). The available options are
  - `choices`: for a list of selectable values.
  - `ranges`: for providing a range input.
  - `check_presence`: Will present only two options to the users, "null" and "not-null".

### hide_null_choice/hide_not_null_choice

If applicable we are going to add "null" and "not-null" options in the choice picker by default. Setting any of these variables to `true`, will hide its respective option.


### bar_plot

This attribute is meant to be an object of properties that control the display of the histogram. Setting this attribute to `false` will force the histogram to not be shown in the facet in the facet panel. If unspecified, default is `true` (or show the histogram). Available options in this object are:

  - `n_bins`: Used to define the number of bins the histogram uses to fetch and display data. If undefined, default is 30 bins.

### order

Using this attribute you can modify the default sort order of _scalar_ facets (entity facets will use the row_order defined on the table). Its syntax is simmilar to `column_order`.

Assuming your path ends with column `COL`, the default order is the following:

```javascript
[
    {"num_occurrences": true, "descending": true},
    {"column": "COL", "descending": false}
]
```

As you can see, you can use `"num_occurrences": true` to refer to the number of occurrences (frequency) column.

## hide_num_occurrences

In _scalar_ facets we show an extra column called "number of occurrences". Use this attribute to hide the column from users.

```javascript
    "hide_num_occurrences": true
```


## Examples


### Example 1
Consider this logical filter set:
  - and
    - column1 multi-choice 1, 2, 3
    - column2 across S1:FK1 range [5,10]

It can be encoded in the following JSON using the above abbreviation techniques:

```javascript
{
  "and": [
    {"source": "column1", "choices": [1, 2, 3]},
    {"source": [{"inbound": ["S1", "FK1"]}, "column2"], "ranges": [{"min": 5, "max": 10}]}
  ]
}
```

Which will be translated to the following in ermrest syntax:

    /M:=S:T/(column1=1;column1=2;column1=3)/$M/(fk)=(S1:T2:key)/(column2::gt::5&column2::lt::10)/$M


### Example 2

A more complex example that this structure can support but as the first implementation we are not supporting:

JSON object:

```javascript
{
    "and": [
         {
             "or": [
                 {"source": "c1", "ranges": [{"min": 1, "max": 5}]},
                 {"source": "c2", "choices":[1, 2]}
             ]
         },
         {"source": [{"inbound": ["S1", "FK1"]}, "c3"], "search": ["text"]}
    ]
}
```

which translates to:


    /M:=S:T/(c1::gt::1&c1::lt::5);(c2=1;c2=1)/$M/(fk)=(S1:T2)/(c3::ciregexp::text)/$M


### More Examples

For more examples please refer to the [facet examples document](facet-examples.md).
