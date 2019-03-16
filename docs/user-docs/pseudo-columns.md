# Pseudo-Columns Logic And Heuristics

ERMrestJS **pseudo columns** refer to virtual columns created from key and foreign key constraints in the model, as well as aggregation function of those entities/columns. ERMrestJS supports the following categories of pseudo columns:
* Key
* Outbound ForeignKey (single- and multi-hops)
* Inbound ForeignKey (single- and multi-hops)
* Aggregate columns

If you want to just look at some examples, go [here](#examples).

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
  "markdown_name": <display name>,
  "comment": <tooltip message>,
  "display": {
      "markdown_pattern": <pattern>,
      "template_engine": <handlebars or mustache>
  },
  "aggregate": <aggregate function>
}
```

#### source
To define a pseudo column, you need an object with at least the `source` attribute. Please refer to [facet `data source` syntax](facet-json-structure.md#data-source) for more information on how to define `<data source>`.

#### entity (v.s. scalar)
 If the pseudo column can be treated as entity (the column that is defined in data source is key of the table), setting `entity` attribute to `false` will force the scalar mode. This will affect different logic and heuristics. In a nutshell, entity-mode means we try to provide a UX around a set of entities (table rows).  Scalar mode means we try to provide a UX around a set of values like strings, integers, etc.

    "entity": false

#### self-link
If you want to show a self-link to the current row, you need to make sure the source is based on a not-null unique column and add the `"self_link": true` to the definition.

#### markdown_name
markdown_name captures the display name of the column. You can change the default display name by setting the markdown_name attribute.

    "markdown_name": "**new name**"

#### comment

In Chaise, comment is displayed as tooltip associated with columns. To change the default tooltip for the columns, the `comment` attribute can be used.

    "comment": "New comment"

### display

By using this attribute you can customize the presented value to the users. The following is the accepted syntax:

```
{
    "source": <any acceptable source>,
    "display": {
        "markdown_pattern": <markdown pattern value>,
        "template_engine": <"handlebars" | "mustache">
    }
}
```

In the `markdown_pattern` you can access the current pseudo-column data with `$self` namespace. The structure of the available data is going to be different based on pseudo-column type. Please refer to the [pseudo-column display documentation](#pseudo-column-display.md) for more information.

#### aggregate

This is only applicable in visible columns definition (Not applicable in Facet definition). You can use this attribute to get aggregate values instead of a table. The available functions are `cnt`, `cnt_d`, `max`, `min`, `array`, and `array_d`.
- `min` and `max` are only applicable in scalar mode.
- `array` will return ALL the values including duplicates associated with the specified columns. For data types that are sortable (e.g integer, text), the values will be sorted alphabetically or numerically. Otherwise, it displays values in the order that it receives from ERMrest. There is no paging mechanism to limit what's shown in the aggregate column, therefore please USE WITH CARE as it can incur performance overhead and ugly presentation.
- `array_d` will return the distinct values. It has the same performance overhead as `array`, so pleas USE WITH CARE.

#### aggregate array_display

If you have `"aggregate": "array"` or `"aggregate": "array_d"` in your pseudo-column definition, you can use `array_display` attribute to change the display of values. You can use
- `olist` for ordered bullet list.
- `ulist` for unordered bullet list.
- `csv` for comma-seperated values (the default presentation).


#### aggregate array_options

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

1. Return null in entry mode, the paths that are not all-outbound (It's not applicable in these cases), and when aggregate is defined.
2. If the given data-path is defining a more specific pseudo-column type (Key, ForeignKey, or Inbound-Foreignkey) then the value that is returned will be based on that type.
3. In scalar mode, return the column's value.
4. In entity mode, return the end foreign key value.

#### Sort
1. If the given data-path is defining a more specific pseudo-column type (Key, ForeignKey, or Inbound-Foreignkey), use the logic of the more specific pseudo-column.
2. Disable sort if the given pseudo-column has aggregate, or it not all-outbound.
3. In entity mode, use the last foreignkey's logic for sorting.
4. In scalar mode, use the constituent column's logic for sorting.


## Examples

Let's assume the following is the ERD of our database. In all the examples we're defining column list for the `Main` table (assuming `S` is the schema name).

![ERD](https://dev.isrd.isi.edu/~ashafaei/wiki-images/pseudo_col_erd.png)


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
| Pseudo Column (All outbound)             | N.A.                                                                   | `{"source": <any acceptable source with only outbound>, "entity": true}                                      | read-only           | entity mode: link to row scalar mode: scalar value |

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
