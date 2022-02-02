# Facet JSON Structure

## Structure

The overall structure of filters is as follows. Each facet term combines a data source and constraint spec, and so all combinations of constraint kind and data source path are possible in the syntax.

```
<FILTERS>:  { <logical-operator>: <TERMSET> }

<TERMSET>: '[' <TERM> [, <TERM>]* ']'

<TERM>:     { <logical-operator>: <TERMSET> }
            or
            { "source": <data-source>, <constraint(s)>, <extra-properties(s)> }
            or
            { "sourcekey": <source-key>, <constraint(s)>, <extra-properties(s)> }
```

In the following sections each of location operators, data source, constraints, and extra properties are explained. You can also find some examples at the end of this document.

## Logical operators

We want the structure to be as general as possible, so we don't need to redesign the whole structure when we need to support more complex queries. Therefore as the top level, we have logical operators.

    { "and": [ term... ] }
    { "or": [ term... ]}
    { "not": term }

The current implementation of faceting in Chaise only supports `and`. The rest of logical operators are currently not supported.

## Source path

Source path captures the source of filter. It can either be
- one of current table's column.
- a column in a table that has a valid foreign key relationship with the current table.

Even if we are faceting on a vocabulary concept and just want the user to pick values by displayed *row name* and we substitute the actual entity keys in the ERMrest query, we must record this column choice explicitly in the facet spec so that the resulting faceting app URL is unambiguous even if there have been subtle model changes in the interim, which might change the default key selection heuristics etc.

> Based on this, we are not supporting filtering on foreign keys with composite keys.

For more information about source path refer to column directive's documentation in [here](column-directive.md#source).

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

## Extra properties

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

### Example 3 (Entity vs. Scalar)

All the following examples are based on the given ERD and we are creating facet list for the `main` table.

![ERD](https://dev.isrd.isi.edu/~ashafaei/wiki-images/faceting_example_erd.png)

In chaise we have two facet types:

 1. Entity: When the facet filter is a path, and facet column is a simple key, and `entity:false` is not available in the definition. Entity picker will show list of table rows instead of column values.
    Clicking on "show more" will open up the complete table. We're using the same annotation and logic for the row-name and row-order.

    ```JavaScript

    {"source": [{"outbound": ["s", "fk1_cons"]}, "f1_id"]}

    {"source": [{"inbound": ["s", "fk2_cons"]}, "f2_id"]}

    {"source": [{"inbound": ["s", "fk3_cons"]}, "main_f3_id"]}

    {"source": [{"inbound": ["s", "fk3_cons"]}, {"outbound": ["s", "fk4_cons"]}, "f3_id"]}
    ```

2. Scalar: If the given description for entity picker does not apply.Scalar picker will show list of possible values for the column sorted by their frequency. Currently it is not supporting any column display annotations.


    ```JavaScript
    {"source": "id"}

    {"source": "fk_col"}

    {"source": "text_col"}

    {"source": [{"outbound": ["s", "fk1_cons"]}, "f1_text"]}

    {"source": [{"outbound": ["s", "fk1_cons"]}, "f1_id"], "entity": false}

    {"source": [{"inbound": ["s", "fk2_cons"]}, "f2_id"], "entity": false}

    {"source": [{"inbound": ["s", "fk3_cons"]}, "main_f3_id"], "entity": false}

    {"source": [{"inbound": ["s", "fk3_cons"]}, {"outbound": ["s", "fk4_cons"]}, "f3_id"], "entity": false}
    ```

### Example 4 (Choice Vs. Range)

In scalar mode, you can define your preferred UX mode. You can set that by setting the `ux_mode` attribute to `choices` or `ranges`.
By default (If `ux_mode` is unavailable or invalid) we are showing range for the following column types:

```JavaScript
{"source": "id", "ux_mode": "choices"}
{"source": "id", "ux_mode": "ranges"}
{"source": [{"outbound": ["s", "fk1_cons"]}, "f1_id"], "entity": false, "ux_mode": "ranges"}
```

### Example 5 (Facet Title)

You can change the facet title by defining `markdown_name` in your facet. This attribute is available in all possible facet modes (entity, scalar, choices, ranges, etc.).

```JavaScript
{"source": "fk_col", "markdown_name": "My new Title"}
{"source": [{"outbound": ["s", "fk1_cons"]}, "f1_text"], "markdown_name": "_Italic Title_"}
```

### Example 6 (Open Vs. Close)

If you want the facet to be open by default, you can add `open:true` to any of the facets. This attribute is available in all possible facet modes (entity, scalar, choices, ranges, etc.)

```JavaScript
{"source": "fk_col", "open": true}
{"source": [{"outbound": ["s", "fk1_cons"]}, "f1_text"], "open": true}
```

### Example 7 (Change order of scalar values)

In a scalar facet that is using the `choices` UX mode, the values are sorted in a desencing order of "Number of occurences" (frequency), and tie breaking is done based on the ascending value of the scalar column:


```js
// if you just want to hide the "Number of occurences"
{
    "source": [{"outbound": ["s", "fk1_cons"]}, "f1_text"],
    "entity": false,
    "hide_num_occurrences": true
}

// if you don't want to show nor sort based on "Number of occurences"
{
    "source": [{"outbound": ["s", "fk1_cons"]}, "f1_text"],
    "entity": false,
    "hide_num_occurrences": true,
    "order": [
        {"column": "f1_text", "descending": false}
    ]
}
```
