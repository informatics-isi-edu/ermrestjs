# Pseudo-Columns Logic And Heuristics

ERMrestJS **pseudo columns** refer to virtual columns created from key and foreign key constraints in the model, as well as aggregation function of those entities/columns. ERMrestJS supports the following categories of pseudo columns:
* Key (self link)
* Outbound ForeignKey (single- and multi-hops)
* Inbound ForeignKey (single- and multi-hops)
* Aggregate columns
* Virtual columns (columns without any source)


## Table of contents

- [Pseudo-Columns Logic And Heuristics](#pseudo-columns-logic-and-heuristics)
  * [Where To Use](#where-to-use)
  * [Syntax](#syntax)
    + [Simple Syntax](#simple-syntax)
    + [General Syntax](#general-syntax)
    + [Source Definition Attributes](#source-definition-attributes)
      - [source](#source)
      - [entity (v.s. scalar)](#entity--vs-scalar-)
      - [self-link](#self-link)
      - [aggregate](#aggregate)
      - [sourcekey](#sourcekey)
    + [Display Attributes](#display-attributes)
      - [markdown_name](#markdown-name)
      - [comment](#comment)
      - [display](#display)
        * [markdown_pattern](#markdown-pattern)
        * [show_foreign_key_link](#show-foreign-key-link)
        * [array_ux_mode](#array-ux-mode)
      - [array_options](#array-options)
  * [Logic And Heuristics](#logic-and-heuristics)
      - [Displayname](#displayname)
      - [Value](#value)
      - [Sort](#sort)
  * [Virtual Column](#virtual-column)
  * [Examples](#examples)
    + [Visible Column List](#visible-column-list)
    + [Visible ForeignKey List](#visible-foreignkey-list)
    + [Specific Pseudo Columns](#specific-pseudo-columns)

## Where To Use

You can use pseudo-columns while defining list of [visible columns](annotation.md#tag-2016-visible-columns) and [visible foreign keys](annotation.md#tag-2016-visible-foreign-keys). You can use any type of pseudo-columns in your list of visible columns, but only the pseudo-columns that have a path to another table will be allowed for visible foreign keys.


## Syntax

ERMrestJS supports both Simple syntax and General syntax. The Simple syntax only supports a small set of pseudo columns including keys, immediate outbound foreign keys, immediate inbound foreign keys, and immediate inbound foreign key of pure and binary association tables. The General syntax supports all types of psuedo-columns mentioned above.      

### Simple Syntax
```
  <column name>
```
or
```
  [<schema name>, <constraint name>]
```

where
* `<Column name>` is the name of the scalar columns
* `<schema name>` is the name of the schema. For Ermrest psuedo-constraint, the schema name is `""`
* `<constraint name>` is the name of the key and foreign key constraints.

Note: If the `[<schema name>, <constraint name>]` is an inbound foreign key from pure and binary association, Chaise will display the table specified by the other foreing key (instead of the pure and binary assocation table itself).   

### General Syntax
```
{
  "source" : <data source>,
  "entity": <true or false>,
  "aggregate": <aggregate function>,
  "self_link": <boolean>
  "markdown_name": <display name>,
  "comment": <tooltip message>,
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

or

```
{
  "sourcekey" : <source key>,
  "markdown_name": <display name>,
  "comment": <tooltip message>,
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

### Source Definition Attributes

These sets of attributes are used to define a pseudo-column. To detect duplicate pseudo-columns we only look for these attributes.


#### source
To define a pseudo column, you need an object with at least the `source` attribute. Please refer to [facet `data source` syntax](facet-json-structure.md#data-source) for more information on how to define `<data source>`.


#### entity (v.s. scalar)
 If the pseudo column can be treated as entity (the column that is defined in data source is key of the table), setting `entity` attribute to `false` will force the scalar mode. This will affect different logic and heuristics. In a nutshell, entity-mode means we try to provide a UX around a set of entities (table rows).  Scalar mode means we try to provide a UX around a set of values like strings, integers, etc.

    "entity": false


#### self-link
If you want to show a self-link to the current row, you need to make sure the source is based on a not-null unique column of the current table and add the `"self_link": true` to the definition.


#### aggregate

This is only applicable in visible columns definition (Not applicable in Facet definition). You can use this attribute to get aggregate values instead of a table. The available functions are `cnt`, `cnt_d`, `max`, `min`, `array`, and `array_d`.
- `min` and `max` are only applicable in scalar mode.
- `array` will return ALL the values including duplicates associated with the specified columns. For data types that are sortable (e.g integer, text), the values will be sorted alphabetically or numerically. Otherwise, it displays values in the order that it receives from ERMrest. There is no paging mechanism to limit what's shown in the aggregate column, therefore please USE WITH CARE as it can incur performance overhead and ugly presentation.
- `array_d` will return the distinct values. It has the same performance overhead as `array`, so pleas USE WITH CARE.


#### sourcekey
Instead of defining a pseudo-column in place, you can define them in the [`source-definitions` annotations](annotation.md#tag-2019-source-definitions), and refer to those definitions using `sourcekey`. If `sourcekey` is defined on a pseudo-column, the rest of _source definition attributes_ defined on the pseudo-column will be ignored (but you still can modify the display and other types of attributes).



### Display Attributes

The following attributes can be used to manipulate the display settings of the column.


#### markdown_name
`markdown_name` captures the display name of the column. You can change the default display name by setting the markdown_name attribute.

    "markdown_name": "**new name**"


#### comment

In Chaise, comment is displayed as tooltip associated with columns. To change the default tooltip for the columns, the `comment` attribute can be used.

    "comment": "New comment"


#### hide_column_header

By setting this to `true`, chaise will hide the column header (and still show the value). This is only supported in `detailed` context. If this attribute is missing, we are going to use the inherited behavior from the [column display](annotation.md#tag-2016-column-display) annotation. If that one is missing too, [display annotation](annotation.md#tag-2015-display) will be used.

#### display

By using this attribute you can customize the presented value to the users. The following is the accepted syntax:

```
{
    "source": <any acceptable source>,
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

In the `markdown_pattern` you can access the current pseudo-column data with `$self` namespace alongside the defined source definitions. Please refer to the [pseudo-column display documentation](pseudo-column-display.md) for more information.

##### wait_for

Used to signal Chaise that this pseudo-column relies on the values of other pseudo-columns. It's an array of `sourcekey`s that are defined in the [`source-definitions` annotation](annotation.md#tag-2019-source-definitions) of the table. You can access the value of pseudo-columns that you define here, in your defined `markdown_pattern`. Please refer to the [pseudo-column display documentation](pseudo-column-display.md) for more information.

##### show_foreign_key_link

While generating a default presentation for all outbound foreign key paths, ermrestjs will add a link to the referred row. Using this attribute you can modify this behavior. If this attribute is missing, we are going to use the inherited behavior from the [foreign key](annotation.md#tag-2016-foreign-key) annotation defined on the last foreign key in the path. If that one is missing too, [display annotation](annotation.md#tag-2015-display) will be applied.

##### show_key_link

While generating a default presentation for key pseudo-columns (self link), ermrestjs will add a link to the referred row. Using this attribute you can modify this behavior. If this attribute is missing, we are going to use the inherited behavior from the [key display](annotation.md#tag-2017-key-display) annotation. If that one is missing too, [display annotation](annotation.md#tag-2015-display) will be applied.

##### array_ux_mode

If you have `"aggregate": "array"` or `"aggregate": "array_d"` in your pseudo-column definition, you can use `array_ux_mode` attribute to change the display of values. You can use
- `olist` for ordered bullet list.
- `ulist` for unordered bullet list.
- `csv` for comma-seperated values (the default presentation).
- `raw` for space-seperated values.



#### array_options

If you have `"aggregate": "array"` or `"aggregate": "array_d"` in your pseudo-column definition, you can use `array_options` to change the array of data that client will present. It will not have any effect on the generated ERMrest query and manipulation of the array is happening on the client side. The available options are:

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



## Logic And Heuristics

In this section, we will summarize the heuristics and logic of pseudo column attributes. To make it easier to read, they all are written in the steps and the first applicable will be used. The following are some of the general rules that are being used for all the attributes:

1. If the data-source is not a path and is in entity mode, it's the same as having a Key pseudo-column. So the same heuristics should be applied.
2. If the data-source is an all-outbound path and is in scalar mode, the underlying column logic should be applied.
3. If the data-source is defining an inbound foreign key path of length one (or pure and binary association path), it should behave the same as having the constraint name of foreign key in the list of columns.

#### Displayname

1. Use the defined `markdown_name`.
2. If the given data-path is defining a more specific pseudo-column type (Key, ForeignKey, or Inbound-Foreignkey) then the value that is returned will be based on that type.
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
3. If the pseudo-column is aggregate, get the result based on the defined (or default) array_options.
4. If the given data-path is defining a more specific pseudo-column type (Key, ForeignKey, or Inbound-Foreignkey) then the value that is returned will be based on that type.
5. In scalar mode, return the column's value.
6. In entity mode, return the end foreign key value.

#### Sort
1. If the given data-path is defining a more specific pseudo-column type (Key, ForeignKey, or Inbound-Foreignkey), use the logic of the more specific pseudo-column.
2. Disable sort if the given pseudo-column has aggregate, or it not all-outbound.
3. In entity mode, use the last foreignkey's logic for sorting.
4. In scalar mode, use the constituent column's logic for sorting.


## Virtual Column

If you want to have a pseudo-column that its value is made up of multiple pseudo-columns, you don't need to define any `source` or `sourcekey`. The only required attributes for these types of columns (we call them virtual columns) are `markdown_name` that is used for generating the display name, and `markdown_pattern` to get the value. For instance the following is an acceptable virtual column:

```
{
  "markdown_name": "displayname value",
  "display": {
      "markdown_pattern": "{{{column1}}}, {{{column2}}}"
  }
}
```

In order to access the data of other pseudo-columns in this virtual column, you can use the `wait_for` option.


## Examples

Let's assume the following is the ERD of our database. In all the examples we're defining column list for the `Main` table (assuming `S` is the schema name).

![erd_01](https://raw.githubusercontent.com/informatics-isi-edu/ermrestjs/master/docs/resources/pseudo_columns_erd_01.png)

### Visible Column List

The following summarizes the different types of columns and syntaxes that are acceptable:

| Type                                     | Simple Syntax                                                          | General Syntax                                                                                               | Acceptable Contexts | Behavior                                           |
|------------------------------------------|------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|---------------------|----------------------------------------------------|
| Normal Columns                           | `"id"`                                                                 | `{"source": "id"}`                                                                                           | All                 |                                                    |
| Asset Columns                            | `"asset_col"` (assuming `asset_col` is a column with asset annotation) | `{"souce": "asset_col"}`                                                                                     | All                 | dl button in read-only upload in edit mode         |
| Key Columns                              | `["s", "key_cons"]`                                                    | `{"source": "id", "entity": true, "self_link": true}`                                                        | read-only           | self-link                                          |
| ForeignKey Columns                       | `["s", "fk1_cons"]`                                                    | `{"source": [{"outbound": ["s", "fk1_cons"]}, "f1_id"], "entity": true}`                                     | All                 | Link to row in read-only Modal picker in edit mode |
| Inbound ForeignKey Columns               | `["s", "fk2_cons"]`                                                    | `{"source": [{"inbound": ["s", "fk2_cons"]}, "f2_id"], "entity": true}`                                      | detailed            | Inline Table                                       |
| Associative Inbound ForeignKey Columns   | `["s", "fk3_cons"]`                                                    | `{"source": [{"inbound": ["s", "fk3_cons"]}, {"outbound": ["s", "main_f3_cons"]}, "f3_id"], "entity": true}` | detailed            | Inline Table                                       |
| Pseudo Column (entity mode with inbound) | N.A.                                                                   | `{"source": <any acceptable source with inbound in path and in entity mode>, "entity": true}`                | detailed            | Inline Table                                       |
| Pseudo Column (Aggregate)                | N.A.                                                                   | `{"source": <any acceptable source>, "aggregate": <any acceptable aggregate function>}`                      | read-only           | Aggregated value                                   |
| Pseudo Column (All outbound)             | N.A.                                                                   | `{"source": <any acceptable source with only outbound>, "entity": true}`                                      | read-only           | entity mode: link to row scalar mode: scalar value |

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

### Specific Pseudo Columns
As we mentioned, you can define the specific pseudo columns using the general syntax for pseudo-columns. If you use the both syntax, one of them will be ignored (the one that comes first in the column list will be used. The only implication currently is that you cannot use the general pseudo columns in entry contexts). The following are alternative syntaxes for specific and general pseudo column definition:

1. ForeignKey Pseudo Column:

  ```
  ["S", "fk1_cons"]   ==   {"source":[ {"outbound": ["S", "fk1_cons"]}, "f1_id" ]}
  ["S", "fk1_cons"]   =/=  {"source":[ {"outbound": ["S", "fk1_cons"]}, "f1_id" ], "entity": false}
  ["S", "fk1_cons"]   =/=  {"source":[ {"outbound": ["S", "fk1_cons"]}, "f1_text" ]}  
  ```

2. Inbound ForeignKey Pseudo Column:

  ```
  ["S", "fk2_cons"]   ==   {"source":[ {"inbound": ["S", "fk2_cons"]}, "f2_id"]}

  ["S", "fk3_cons"]   ==   {"source":[ {"inbound": ["S", "fk3_cons"]}, {"outbound": ["S", "main_f3_cons"]}, "f3_id"}
  ["S", "fk3_cons"]   =/=   {"source":[ {"inbound": ["S", "fk3_cons"]}, "main_f3_id"}
  ```

3. Key Pseudo Column:

  ```
  ["S", "main_key_constraint"] ==  {"source": "id"}
  ["S", "main_key_constraint"] =/= {"source": "id", "entity": false}
  ```
