# Column Directive

Column directive allows instruction of a data source and modification of its presentation. Column directives are defined relative to the table that they are part of. They can be used in `visible-columns` or a `visible-foreign-keys` annotation.

- In [Overall structure](#overall-structure) we briefly explain different methods of defining a column directive.
- In [Shorthand syntax](#shorthand-syntax) we mention the alternative and simpler way of defining column directives.
- Using [Properties](#properties) section you can find all the available properties in column directive.
- Please Find the examples in [this section](#examples).

## Overall structure

As it was described, column directives are meant to intruct the data source and its presentation. Based on how the data source is defined, we can categorize them into the following:

### 1. Column directive with `source`

In this category, you use the [`source`](#source) property to define the data source of the column directive in place. Other source related properties (i.e. [`entity`](#entity), [`aggregate`](aggregate)) can be used in combination with `source` to change the nature of the column directive. The following is an overview of such column directive with all the available properties (some might not be applicaple depending on where the column directive is used):

```
{
  "source" : <source path>,
  "entity": <true or false>,
  "aggregate": <aggregate function>,
  "self_link": <boolean>
  "markdown_name": <display name>,
  "comment": <tooltip message>,
  "comment_display": <inline|tooltip>,
  "hide_column_header": <boolean>
  "display": {
      "markdown_pattern": <pattern>,
      "template_engine": <handlebars or mustache>,
      "wait_for": <wait_for list>,
      "show_foreign_key_link": <boolean>,
      "show_key_link": <boolean>,
      "array_ux_mode": <csv|ulist|olist|raw>
  },
  "array_options": {
    "order": <change the default order>,
    "max_lengh": <max length>
  }
}
```

### 2. Column directive with `sourcekey`

In this category, the [`sourcekey`](#sourcekey) proprety is used to refer to one of the defines sources in the [`source-definitions` annotations](annotation.md#tag-2019-source-definitions). The following is an overview of such column directive with all the available properties (some might not be applicaple depending on where the column directive is used):

```
{
  "sourcekey" : <source key>,
  "markdown_name": <display name>,
  "comment": <tooltip message>,
  "comment_display": <inline|tooltip>,
  "hide_column_header": <boolean>
  "display": {
      "markdown_pattern": <pattern>,
      "template_engine": <handlebars or mustache>,
      "wait_for": <wait_for list>,
      "show_foreign_key_link": <boolean>,
      "show_key_link": <boolean>,
      "array_ux_mode": <csv|ulist|olist|raw>
  },
  "array_options":{
    "order": <change the default order>,
    "max_lengh": <max length>
  }
}
```

### 3. Column directive without any source

If you want to have a column directive that its value is made up of multiple column directives, you don't need to define any `source` or `sourcekey`. The only required attributes for these types of columns (we call them virtual columns) are [`markdown_name`](#markdown_name) that is used for generating the display name, and [`markdown_pattern`](#markdown_pattern) under [`display`](#display) to get the value. For instance the following is an acceptable virtual column:

```
{
  "markdown_name": "displayname value",
  "display": {
      "markdown_pattern": "{{{column1}}}, {{{column2}}}"
  }
}
```

In order to access the data of other column directives in this virtual column, you can use the [`wait_for`](#wait_for) option.


The following is an overview of such column directive with all the available properties (some might not be applicaple depending on where the column directive is used):
```
{
  "markdown_name": <display name>,
  "comment": <tooltip message>,
  "comment_display": <inline|tooltip>,
  "hide_column_header": <boolean>
  "display": {
      "markdown_pattern": <pattern>,
      "template_engine": <handlebars or mustache>,
      "wait_for": <wait_for list>
  }
}
```

## Properties

Some properties are only available in special scenarios and are not used in all the scenarios. As you can see in the overall structure, there are three different ways that you can define a column directive:

### 1. Data source properties

These sets of properties change the nature of the column directive, as they will affect the communication with server. To detect duplicate column-directives we only look for these attributes. The properties are:

- [`source`](#source)
- [`sourcekey`](#sourcekey)
- [`entity`](#entity)
- [`aggregate`](#aggregate)

These attribute will also dictate the default display heuristics that are used for the column. For instance if it's an aggregate, it will require an extra request and will therefore modify the heuristics for displaying the values.


#### source

This property allows the definition of "source path". As column directive is define on a table, it can either be
  - One of the current table's column.
  - A column in table that has a valid foreign key relationship with the current table.

> Even if the column directive is used in "entity" mode where it's suppsoed to represent the row and not just a column, we must record this column choice explicitly in the column directive so that we can use an unambiguous column while communicating with ERMrest.

Therefore the following are acceptable ways of defining source path:

- A column name string literal (an array of one string is also acceptable):
  ```
  {"source": "column"}
  {"source": ["column"]}
  ```
- An array of _path element_ that ends with a _columnname_ that will be projected and filtered.

  - `[` _path element_  `, ... , `  _columnname_`]`

  Each anterior element MAY use one of the following sub-document structures:

  - `{ "sourcekey":` _sourcekey prefix_ `}`
    - Only acceptable as the first element. Please refer to [source path with reusable prefix](#source-path-with-reusable-prefix) for more information.
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


  The following are some examples of defining source path:
  ```
  [{"inbound": ["S1", "FK1"]}, "Column2"]
  [{"inbound": ["S1", "FK1"]}, {"outbound": ["S2", "FK2"]}, "Column3"]
  [{"sourcekey": "path_to_f1"}, {"outbound": ["S2", "FK2"]}, "Column3"]
  [{"sourcekey": "path_to_f2"}, "Column3"]
  [{"inbound": ["S1", "FK1"]}, {"filter": "RCB", "operand_pattern": "{{{$session.client.id}}}"}, "Column3"]
  ```

##### Source path with reusable prefix

 In some cases, the defined foreign key paths for different columns/facets might be sharing the same prefix. In those cases, reusing the prefix allows sharing certain joined table instances rather than introducing more "copies" as each facet is activated which in turn will increase the performance.

 To do this, you would have to use [`2019:source-definitions`](annotation.md#tag-2019-source-definitions) annotation and define the shared prefix. Then you can use `sourcekey` to refer to this shared prefix in the source path.

 - When using a prefix, the prefix's last column and all the other extra attributes on it will be ignored for the purpose of prefix.
- You can use recursive prefixes. If we detect a circular dependency, we're going to invalidate the given definition.
- While using prefix, you MUST add extra foreign key paths to the relationship. The following is not an acceptable source:
  ```
  [ {"sourcekey": "path_2"}, "RID" ]
  ```
 - Since our goal is to reuse the join instance as much as we can, all-outbound foreign keys can also share the same join instances.


 For example, assume the following is the ERD of table:

![erd_01](https://raw.githubusercontent.com/informatics-isi-edu/ermrestjs/master/docs/resources/path-prefix-erd-01.png)

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

#### sourcekey
Instead of defining a column directive in place, you can define them in the [`source-definitions` annotations](annotation.md#tag-2019-source-definitions), and refer to those definitions using `sourcekey`. If `sourcekey` is defined on a column directive, the rest of _data source attributes_ defined on the column directive will be ignored (but you still can modify the display and other types of attributes).

#### entity
 If the column directive can be treated as entity (the column that is defined in source path is key of the table), setting `entity` attribute to `false` will force the scalar mode. This will affect different logic and heuristics. In a nutshell, entity-mode means we try to provide a UX around a set of entities (table rows).  Scalar mode means we try to provide a UX around a set of values like strings, integers, etc.

    "entity": false

#### aggregate

This is only applicable in visible columns definition (Not applicable in Facet definition). You can use this attribute to get aggregate values instead of a table. The available functions are `cnt`, `cnt_d`, `max`, `min`, `array`, and `array_d`.
- `min` and `max` are only applicable in scalar mode.
- `array` will return ALL the values including duplicates associated with the specified columns. For data types that are sortable (e.g integer, text), the values will be sorted alphabetically or numerically. Otherwise, it displays values in the order that it receives from ERMrest. There is no paging mechanism to limit what's shown in the aggregate column, therefore please USE WITH CARE as it can incur performance overhead and ugly presentation.
- `array_d` will return the distinct values. It has the same performance overhead as `array`, so pleas USE WITH CARE.


### 2. Presentation properties

The following attributes can be used to manipulate the presentation settings of the column directive.


#### markdown_name
`markdown_name` captures the display name of the column. You can change the default display name by setting the `markdown_name` attribute.

    "markdown_name": "**new name**"


#### comment

In Chaise, comment is displayed as tooltip associated with columns. To change the default tooltip for the columns, the `comment` attribute can be used.

    "comment": "New comment"

#### comment_display

By default Chaise will display `comment` as a tooltip. Set this value to `inline` to show it as text or `tooltip` to show as a hover tooltip. This property is only supported for related tables in detailed context of `visible-foreign-keys` annotation, and is not honored in other annotations.


#### hide_column_header

By setting this to `true`, chaise will hide the column header (and still show the value). This is only supported in `detailed` context. If this attribute is missing, we are going to use the inherited behavior from the [column display](annotation.md#tag-2016-column-display) annotation. If that one is missing too, [display annotation](annotation.md#tag-2015-display) will be used.

#### self-link
If you want to show a self-link to the current row, you need to make sure the source is based on a not-null unique column of the current table and add the `"self_link": true` to the definition.

#### display

By using this attribute you can customize the presented value to the users. The following is the accepted syntax:

```
{
    ...,
    "display": {
        "markdown_pattern": <markdown pattern value>,
        "template_engine": <"handlebars" | "mustache">,
        "wait_for": <wait_for list>,
        "show_foreign_key_link": <boolean>,
        "show_key_link": <boolean>
        "array_ux_mode": <csv|ulist|olist|raw>
    }
}
```

##### markdown_pattern

Allows modification of the displayed values for the column directive. You can access the current column directive data with `$self` namespace alongside the defined source definitions. Please refer to the [Column directive display documentation](column-directive-display.md) for more information.

##### wait_for

Used to signal Chaise that this column directive's `markdown_pattern` relies on the values of other column directives. It's an array of `sourcekey`s that are defined in the [`source-definitions` annotation](annotation.md#tag-2019-source-definitions) of the table. You should list all the all-outbound, aggregates, and entity sets that you want to use in your `markdown_pattern`. Entity sets (column directives with `inbound` path and no `aggregate` attribute) are only acceptable in `detailed` context. Please refer to the [column directive display documentation](column-directive-display.md) for more information.

##### show_foreign_key_link

While generating a default presentation for all outbound foreign key paths, ERMrestJS will display a link to the referred row. Using this attribute you can modify this behavior. If this attribute is missing, we are going to use the inherited behavior from the [foreign key](annotation.md#tag-2016-foreign-key) annotation defined on the last foreign key in the path. If that one is missing too, [display annotation](annotation.md#tag-2015-display) will be applied.

##### show_key_link

While generating a default presentation for key column directives (self link), ERMrestJS will add a link to the referred row. Using this attribute you can modify this behavior. If this attribute is missing, we are going to use the inherited behavior from the [key display](annotation.md#tag-2017-key-display) annotation. If that one is missing too, [display annotation](annotation.md#tag-2015-display) will be applied.

##### array_ux_mode

If you have `"aggregate": "array"` or `"aggregate": "array_d"` in your column directive definition, you can use `array_ux_mode` attribute to change the display of values. You can use
- `olist` for ordered bullet list.
- `ulist` for unordered bullet list.
- `csv` for comma-seperated values (the default presentation).
- `raw` for space-seperated values.

#### array_options

If you have `"aggregate": "array"` or `"aggregate": "array_d"` in your column directive definition, you can use `array_options` to change the array of data that client will present. It will not have any effect on the generated ERMrest query and manipulation of the array is happening on the client side. The available options are:

- `order`: An alternative sort method to apply when a client wants to semantically sort by key values. Its syntax is similar to `column_order`.
  - Assuming your path ends with column `col`, the default order is `{"column": "col", "descending": false}`.
  - In scalar mode, you can only sort based on the scalar value of the column (other table columns are not available). So you can only switch the sort from ascending to descending.


- `max_length`: A number that defines the maximum number of elements that should be displayed. We are not going to apply any default value for this attribute. If you don't provide any `max_length`, we are going to show all the values that ERMrest returns.

```
{
  "source": <a valid path in entity mode>,
  "entity": true,
  "aggregate": <array or array_d>,
  "array_options": {
    "order": [
      {
        "column": <a column in the projected table>,
        "descending": <boolean value>,
      },
      {
        "column": <another column in the projected table>,
        "descending": <boolean value>,
      },
      ...
    ],
    "max_length": <number>
  }
},
{
  "source": <a valid path in scalar mode>,
  "entity": false,
  "aggregate": <array or array_d>,
  "array_options": {
    "order": [
      {
        "column": <the scalar projected column>,
        "descending": <boolean value>,
      }
    ],
    "max_length": <number>
  }
}
```

<!-- TODO needs to be updated
## Logic And Heuristics

In this section, we will summarize the heuristics and logic of column directive attributes. To make it easier to read, they all are written in the steps and the first applicable will be used. The following are some of the general rules that are being used for all the attributes:

1. If the data-source is not a path and is in entity mode, it's the same as having a Key column directive. So the same heuristics should be applied.
2. If the data-source is an all-outbound path and is in scalar mode, the underlying column logic should be applied.
3. If the data-source is defining an inbound foreign key path of length one (or pure and binary association path), it should behave the same as having the constraint name of foreign key in the list of columns.

#### Displayname

1. Use the defined `markdown_name`.
2. If the given data-path is defining a more specific column directive type (Key, ForeignKey, or Inbound-Foreignkey) then the value that is returned will be based on that type.
3. Otherwise if `aggregate` is defined, it will be returning a value in the `<Agg-Fn> <col-displayname>` format. The `<Agg-Fn>` map is as follows:
```
min   -> Min
max   -> Max
cnt   -> #
cnt_d -> #
```
4. In entity mode, return the table's displayname.
5. In scalar mode, return the column's displayname.

#### Value

1. Return null in entry mode.
2. If the `display` is defined, return the value based on the given `display`. If the `display` has `wait_for`, the client will wait until all the data is available before showing the value.
3. If the column directive is aggregate, get the result based on the defined (or default) array_options.
4. If the given data-path is defining a more specific column directive type (Key, ForeignKey, or Inbound-Foreignkey) then the value that is returned will be based on that type.
5. In scalar mode, return the column's value.
6. In entity mode, return the end foreign key value.

#### Sort
1. If the given data-path is defining a more specific column directive type (Key, ForeignKey, or Inbound-Foreignkey), use the logic of the more specific column directive.
2. Disable sort if the given column directive has aggregate, or it not all-outbound.
3. In entity mode, use the last foreignkey's logic for sorting.
4. In scalar mode, use the constituent column's logic for sorting.

-->



## Shorthand syntax

While the general syntax of column directives is defining a JSON object, depending on where the column directive is used, you can use the shorthand syntax which heavily relies on heuristics. The following are other acceptable ways of defining column directives:

- In read-only non-filter context of `visible-columns` annotation, you can use string to refer to any of the columns in the table. For instance the two following syntax are alternative to each other:
  ```
  {
    "source": "column"
  }
  ```
  ```
  "column"
  ```
- In non-filter context of `visible-columns` annotation you can use the two-element list of string literal which identifies a constituent foreign key of the table. The value of the external entity referenced by the foreign key will be presented, with representation guided by other annotations or heuristics. Therefore the follow are alternative:
  ```
  {
    "source": [
      {"outbound": ["schema", "fkey1"]},
      "RID"
    ],
    "entity": true
  }
  ```
  ```
  ["schema", "fkey1"]
  ```
- In `detailed` context of `visible-columns` and `visible-foreign-keys` annotation you can use the two-element list of string literal which identifies a constituent foreign key that is referring to the current table (inbound relationship). Therefore the follow are alternative:
  ```
  {
    "source": [
      {"inbound": ["schema", "fkey_to_main"]},
      "RID"
    ],
    "entity": true
  }
  ```
  ```
  ["schema", "fkey_to_main"]
  ```
- In `detailed` context of `visible-columns` and `visible-foreign-keys` annotation you can use the two-element list of string literal which identifies a constituent foreign key from a pure and binary association table to the current table. Therefore the follow are alternative:
  ```
  {
    "source": [
      {"inbound": ["schema", "fkey_from_assoc_to_main"]},
      {"outbound": ["schema", "fkey_from_assoc_to_related"]},
      "RID"
    ],
    "entity": true
  }
  ```
  ```
  ["schema", "fkey_from_assoc_to_main"]
  ```
- In read-only non-filter context of `visible-columns` annotation you can use the two-element list of string literal which identifies a constituent key of the table. The defined display of the key will be presented, with a link to the current displayed row of data. This is the same as the `self_link` property on column directive JSON object. Therefore the follow are alternative:
  ```
  {
    "source": "RID",
    "entity": true
    "self_link": true
  }
  ```
  ```
  ["schema", "primary_key"]
  ```

## Examples

Let's assume the following is the ERD of our database. In all the examples we're defining column list for the `Main` table (assuming `S` is the schema name).

![erd_01](https://raw.githubusercontent.com/informatics-isi-edu/ermrestjs/master/docs/resources/column-directive-erd-01.png)

### Visible Column List

The following summarizes the different types of columns and syntaxes that are acceptable:

| Type                                     | General Syntax                                                                                               | Shorthand Syntax                                                             | Acceptable Contexts | Behavior                                           |
|------------------------------------------|--------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|---------------------|----------------------------------------------------|
| Normal Columns                           | `{"source": "id"}`                                                                                           | `"id"`                                                                 | All                 |                                                    |
| Asset Columns                            | `{"souce": "asset_col"}`                                                                                     | `"asset_col"` (assuming `asset_col` is a column with asset annotation) | All                 | dl button in read-only upload in edit mode         |
| Key Columns                              | `{"source": "id", "entity": true, "self_link": true}`                                                        | `["s", "key_cons"]`                                                    | read-only           | self-link                                          |
| ForeignKey Columns                       | `{"source": [{"outbound": ["s", "fk1_cons"]}, "f1_id"], "entity": true}`                                     | `["s", "fk1_cons"]`                                                    | All                 | Link to row in read-only Modal picker in edit mode |
| Inbound ForeignKey Columns               | `{"source": [{"inbound": ["s", "fk2_cons"]}, "f2_id"], "entity": true}`                                      | `["s", "fk2_cons"]`                                                    | detailed            | Inline Table                                       |
| Associative Inbound ForeignKey Columns   | `{"source": [{"inbound": ["s", "fk3_cons"]}, {"outbound": ["s", "main_f3_cons"]}, "f3_id"], "entity": true}` | `["s", "fk3_cons"]`                                                    | detailed            | Inline Table                                       |
| inline table (entity mode with inbound)  | `{"source": <any acceptable source with inbound in path and in entity mode>, "entity": true}`                | N.A.                                                                   | detailed            | Inline Table                                       |
| Aggregate                                | `{"source": <any acceptable source>, "aggregate": }`                                                         | N.A.                                                                   | read-only           | Aggregated value                                   |
| All outbound entity path                 | `{"source": <any acceptable source with only outbound>, "entity": true}`                                     | N.A.                                                                   | read-only           | entity mode: link to row scalar mode: scalar value |

Other examples:
1. To show scalar values of a foreignkey column in the main table:
```
{"source": [{"outbound": ["S", "fk1_cons"]}, "f1_text"]}
{"source": [{"outbound": ["S", "fk1_cons"]}, "f1_id"], "entity": false}
```
2. To show link to a row that main has foreignkey to.
```
{"source": [{"outbound": ["S", "fk1_cons"]}, "f1_id"], "entity": false}
```
3. To show list (table) of related entities:
```
{"source": [{"inbound": ["S", "fk3_cons"]}, "main_f3_id"]}
{"source": [{"inbound": ["S", "fk3_cons"]}, {"outbound": ["S", "main_f3_cons"]}, "f3_id"]}
{"source": [{"inbound": ["S", "fk3_cons"]}, {"outbound": ["S", "main_f3_cons"]}, {"inbound": ["S", "f4_cons"]}, "f4_id"]}
```

3. To show aggregate values:
```
{"source": [{"inbound": ["S", "fk3_cons"]}, "main_f3_id"], "aggregate": "cnt_d"}
{"source": [{"inbound": ["S", "fk3_cons"]}, {"outbound": ["S", "main_f3_cons"]}, "f3_id"], "aggregate": "array", "array_display": "olist"}
{"source": [{"inbound": ["S", "fk3_cons"]}, {"outbound": ["S", "main_f3_cons"]}, {"inbound": ["S", "f4_cons"]}, "f4_id"], "entity": false, "aggregate": "min"}
```

### Visible ForeignKey List

  ```
  {"source": [{"inbound": ["S", "fk3_cons"]}, "main_f3_id"]}
  {"source": [{"inbound": ["S", "fk3_cons"]}, {"outbound": ["S", "main_f3_cons"]}, "f3_id"]}
  {"source": [{"inbound": ["S", "fk3_cons"]}, {"outbound": ["S", "main_f3_cons"]}, {"inbound": ["S", "f4_cons"]}, "f4_id"]}
  ```

### Alternative syntax
As we mentioned, you can define the specific column directive using the general syntax. If you use the both syntax, one of them will be ignored (the one that comes first in the column list will be used. The following are examples of alternative ways of defining column directive that are only acceptable in `visible-columns` and `visible-foreign-keys`:

1. Foreign key:

  ```
  ["S", "fk1_cons"]   ==   {"source":[ {"outbound": ["S", "fk1_cons"]}, "f1_id" ]}
  ["S", "fk1_cons"]   =/=  {"source":[ {"outbound": ["S", "fk1_cons"]}, "f1_id" ], "entity": false}
  ["S", "fk1_cons"]   =/=  {"source":[ {"outbound": ["S", "fk1_cons"]}, "f1_text" ]}
  ```

2. Inbound foreign key:

  ```
  ["S", "fk2_cons"]   ==   {"source":[ {"inbound": ["S", "fk2_cons"]}, "f2_id"]}

  ["S", "fk3_cons"]   ==   {"source":[ {"inbound": ["S", "fk3_cons"]}, {"outbound": ["S", "main_f3_cons"]}, "f3_id"}
  ["S", "fk3_cons"]   =/=   {"source":[ {"inbound": ["S", "fk3_cons"]}, "main_f3_id"}
  ```

3. Key:

  ```
  ["S", "main_key_constraint"] ==  {"source": "id"}
  ["S", "main_key_constraint"] =/= {"source": "id", "entity": false}
  ```
