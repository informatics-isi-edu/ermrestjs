# Facet JSON Structure

## Structure

The overall structure of filters is as follows. Each facet term combines a data source and constraint spec, and so all combinations of constraint kind and data source path are possible in the syntax.

```
<FILTERS>:  { <logical-operator>: <TERMSET> }

<TERMSET>: '[' <TERM> [, <TERM>]* ']'

<TERM>:     { <logical-operator>: <TERMSET> }
            or
            { "source": <data-source>, <constraint(s)>, <extra-attribute(s)> }
```

In the following sections each of location operators, data source, constraints, and extra attributes are explained. You can also find some examples at the end of this document.

## Logical operators

We want the structure to be as general as possible, so we don't need to redesign the whole structure when we need to support more complex queries. Therefore as the top level, we have logical operators.

    { "and": [ term... ] }
    { "or": [ term... ]}
    { "not": term }

## Data Source

The difference between base table columns and columns in related entities is just a difference in data source. It shouldn't involve a completely different set of filter structures. Instead, the single filter structure should conceptually allow various forms of data source specification

    "Column1"
    [{"inbound": ["S1", "FK1"]}, "Column2"]
    [{"inbound": ["S1", "FK1"]}, {"outbound": ["S2", "FK2"]}, "Column3"]

The simple form `"Column1"` might be allowed as a short-hand for `["Column1"]` since it isn't ambiguous. But any foreign key path also needs to end with the actual column that will be projected and filtered. The _direction_ field labels `"inbound"` and `"outbound"` remove any ambiguity for self-referencing table navigation scenarios. The constraint name pairs `["S1", "FK1"]` etc. reuse the same names appearing in the ERMrest model introspection document.

Even if we are faceting on a vocabulary concept and just want the user to pick values by displayed *row name* and we substitute the actual entity keys in the ERMrest query, we must record this column choice explicitly in the facet spec, e.g. `[{"inbound": ["S1", "Fk1"]}, "id"]` so that the resulting faceting app URL is unambiguous even if there have been subtle model changes in the interim, which might change the default key selection heuristics etc.

> Based on this, we are not supporting filtering on foreign keys with composite keys.


<!-- TODO this has not been implemented yet
### Specific occurrences of rows

If we ever need to model a set of constraints where the same related entity  row must simultaneously satisfy multiple facet constraints, we could add these optional instance identifier to the path elements:

- `"context"` which can reference a table instance alias other than the default which is the one immediately left of it in the path.  This is analogous to the `$Alias` path reset notation in ERMrest join paths.

- `"alias"` which can assign an alias to the newly joined table instance.  This is analogous to the `Alias:=` binding notation in ERMrest join paths.

So, a completely explicit path example might look like this in the future:

    [{"inbound": ["S1", "FK1"], "alias": "A"}, {"context": "A", "outbound": ["S2", "FK2"]}, "My Column"]

the binding and use of "A" above wouldn't actually change the meaning unless another facet definition also included the same first element, in which case they would both share the same table instance "A" instead of each one joining on a separate copy via the same foreign key.

When querying ERMrest, we would detect that the same instance ID is in use and map these to constrain the *same* joined table instance in the query. By default, each path element without a pre-assigned ID should get a new, unique ID assigned. Thus, every source path would imply a different joined table instance for each separate constraint.

Some extra validation work may be needed once we introduce specific occurrence IDs. For example, the same instance ID cannot be assigned to elements at different depths in a source path nor to elements with different constraints. All paths with shared IDs must be identical in structure for the shared components, but may branch off with unshared suffixes.
-->

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

## Extra Attributes

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
