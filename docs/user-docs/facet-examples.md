# Facet Examples

In this document we will assume that you are familiar with facet filter syntax. If that is not the case, please read the [annotation document](https://github.com/informatics-isi-edu/ermrest/blob/master/docs/user-doc/annotation.md#2016-visible-columns).

All the examples are based on the given ERD and we are creating facet list for the `main` table.

![ERD](https://dev.isrd.isi.edu/~ashafaei/wiki-images/faceting_example_erd.png)

### Entity vs. Scalar

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

### Choice Vs. Range

In scalar mode, you can define your preferred UX mode. You can set that by setting the `ux_mode` attribute to `choices` or `ranges`.
By default (If `ux_mode` is unavailable or invalid) we are showing range for the following column types:

```JavaScript
{"source": "id", "ux_mode": "choices"}
{"source": "id", "ux_mode": "ranges"}
{"source": [{"outbound": ["s", "fk1_cons"]}, "f1_id"], "entity": false, "ux_mode": "ranges"}
```

### Facet Title

You can change the facet title by defining `markdown_name` in your facet. This attribute is available in all possible facet modes (entity, scalar, choices, ranges, etc.).

```JavaScript
{"source": "fk_col", "markdown_name": "My new Title"}
{"source": [{"outbound": ["s", "fk1_cons"]}, "f1_text"], "markdown_name": "_Italic Title_"}
```

### Open Vs. Close

If you want the facet to be open by default, you can add `open:true` to any of the facets. This attribute is available in all possible facet modes (entity, scalar, choices, ranges, etc.)

```JavaScript
{"source": "fk_col", "open": true}
{"source": [{"outbound": ["s", "fk1_cons"]}, "f1_text"], "open": true}
```
