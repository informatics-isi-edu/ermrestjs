# Pseudo Column in Templating Environments

This document will explain which annotations you need to use and how to use them in order to be able to access more than the current table's values in the templating environment. To make this simpler, we will explain this using an example.

Let's assume the following is the ERD of our database. In all the examples we're defining column list for the `Main` table (assuming `schema` is the schema name).

![erd_01](https://raw.githubusercontent.com/informatics-isi-edu/ermrestjs/master/docs/resources/pseudo_columns_erd_01.png)

## 1. Defining Sources

First you need to define your source definitions. To do this, you have to define the [source-definitions](annotation.md#tag-2019-source-definitions) annotation which is in the following format:

```
"tag:isrd.isi.edu,2019:source-definitions": {
   "columns": [ cname, ... ] | true,
   "fkeys": [  [ schema, constraint ], ... ] | true,
   "sources": {
      <sourcekey>: {
          "source": <some valid path>,
          // the rest of attributes
      },
      ...
   }
}
```

Use the `sources` attribute to define the sources that you want to use in this table. You should be able to access the data by the given _sourcekey_. The available data will be [different based on the pseudo-column type](#Pseudo-Column-Templating-Variable-Data-Structure). Please make sure to follow these rules while specifying the _sourcekey_:

   - sourcekey cannot start with `$`.
   - sourcekey should not be any of the table's column names.

The following extra fields can be used to automatically configure the list of available columns and foreign keys in the templating environments (This syntactic sugar is of course a redundant way to specify the sources and you can just use the `sources` attribute):

- `"columns"`: List of table column names. Assuming one of the defined column names is `cname`, you can use `cname` to access the formatted value and `_cname` to access the raw value.
 - if field is boolean `true` instead of list, it implies all the columns.
- `"fkeys"`: List of outbound foreign keys. Assuming `["schema", "constraint"]` is the constraint name of one of the specified foreign keys, you can use the `$fkey_schema_constraint` namespace (in the format of `$fkey_<schema name>_<constraint name>`) to access the foreign key data.
 - if field is boolean `true` instead of list, it implies all the outbound foreign keys.

> If you define this annotation, you have to define all three attributes. If you do not providing any values for `columns` and `fkeys`, chaise will not provide data for any columns or outbound foreign keys in templating environments.

> Using `"fkeys": true` might cause performance issues since we have to fetch the data for all the outbound foreign keys of the table.


The following is the source definitions that we are going to use:

```javascript
{
    "tag:isrd.isi.edu,2019:source-definitions": {
        "columns": true, // a list of columns. true means all the columns
        "fkeys": [ // a list of fkeys. true means all
            ["schema", "fk1_cons"]
        ],
        "sources": {
            "self-link-custom-name": {
                "source": "id", "entity": true, "self_link": true
            },
            "all-outbound-entity-custom-name": {
                "source": [
                    {"outbound": ["schema", "fk1_cons"]},
                    {"outbound": ["schema", "fk5_cons"]}
                    "f5_id"
                ],
                "entity": true
            },
            "all-outbound-scalar-custom-name": {
                "source": [
                    {"outbound": ["schema", "fk1_cons"]},
                    {"outbound": ["schema", "fk5_cons"]}
                    "f5_int"
                ],
                "entity": false
            },
            "entity_array_d_aggregate-custom-name": {
                "source": [
                    {"inbound": ["schema", "fk3_cons"]},
                    {"outbound": ["schema", "main_f3_cons"]},
                    "f3_id"
                ],
                "entity": true,
                "aggregate": "array_d"
            },
            "scalar_array_d_aggregate-custom-name": {
                "source": [
                    {"inbound": ["schema", "fk3_cons"]},
                    {"outbound": ["schema", "main_f3_cons"]},
                    "f3_int"
                ],
                "entity": false,
                "aggregate": "array_d"
            },
            "cnt_d_aggregate-custom-name": {
                "source": [
                    {"inbound": ["schema", "fk2_cons"]}, "f2_int"
                ],
                "entity": false,
                "aggregate": "cnt_d"
            },
            "min_aggregate-custom-name": {
                "source": [
                    {"inbound": ["schema", "fk2_cons"]}, "f2_int"
                ],
                "entity": false,
                "aggregate": "min"
            },
            "max_aggregate-custom-name": {
                "source": [
                    {"inbound": ["schema", "fk2_cons"]}, "f2_int"
                ],
                "entity": false,
                "aggregate": "max"
            }
        }
    }
}
```

## 2. Defining Pseudo-Column Display

The following is the syntax for writing a custom display for a pseudo-column:

```javascript
{
    "source": <any acceptable source>,
    "display": {
        "markdown_pattern": <markdown pattern value>,
        "template_engine": <"handlebars" | "mustache">,
        "wait_for": <wait for list>
    }
}
```

### Accessing Columns and Fkeys

In the `markdown_pattern` defined, by default, you can access the `"columns"` and `"fkeys"` that you have in the `source-definitions` annotation.

Based on the given source-definition, the following is the object that is available in templating in all the `markdown_pattern`s defined in `visible-columns` and `visible-foreign-keys`:

```json
{
  "id": 1234,
  "_id": "1234",
  "text_col": "abc",
  "_text_col": "abc",
  "int_col": "1,234",
  "_int_col": 1234,
  "fk_col": 1,
  "_fk_col": "1",
  "$fkey_schema_fk1_cons": {
    "values": {
      "id": 1,
      "_id": 1,
      "f1_text": "t",
      "_f1_text": "t",
      "f1_int": "2,234",
      "_f1_int": 2234,
    },
    "rowName": "row name of 1",
    "uri": {
      "detailed": "link to record"
    }
  }
}
```

Example:

```
fk1 id: {{{$fkey_s_fk1_cons.values.id}}}

formatted: {{{int_col}}}, raw: {{{_int_col}}}

```

### Accessing Sources (Wait For)

If you want to access any extra `"sources"`, you need to list them in the `wait_for` of the pseudo-column. This will delay the processing of the pseudo-column value until the data for all the pseudo-columns defined in the `wait_for` list are available.

```javascript
{
    "source": {} //<any acceptable source>,
    "display": {
        "markdown_pattern": "{{#each entity_array_d_aggregate-custom-name}}[{{{this.rowName}}}]({{{this.uri.detailed}}}){{/each}}",
        "template_engine": "handlebars",
        "wait_for": ["entity_array_d_aggregate-custom-name"]
    }

}
```

#### Pseudo-Column Templating Variable Data Structure

The data structure that you have access to by using the given sourcekey is different based on its types. The data-structure is aligned with the $self structure which is as follows.

- Entity `array` or `array_d` aggregate

    ```javascript
    {
      "entity_array_d_aggregate-custom-name": [
        {
          "values": {
            "col": "", // formatted
            "_col": "", // raw
            ... // other columns
          },
          "rowName": "",
          "uri": {
            "detailed": "" // link to record page
          }
        },
        ... // other rows
      ]
    }
    ```
    Example: `{{#each entity_array_d_aggregate-custom-name}}[{{{this.rowName}}}]({{{this.uri.detailed}}}){{/each}}`

- All-outbound entity:

    ```javascript
    {
      "all-outbound-entity-custom-name": {
        "values": {
          "col": "", // formatted
          "_col": "", // raw
          ... // other columns
        },
        "rowName": "",
        "uri": {
          "detailed": "" // link to record page
        }
      }
    }
    ```
    Example: `[{{{all-outbound-entity-custom-name.rowName}}}]({{{all-outbound-entity-custom-name.uri.detailed}}})`

- All-outbound scalar:

    ```javascript
    {
        "all-outbound-scalar-custom-name": "1,234",
        "_all-outbound-scalar-custom-name": 1234
    }
    ```
    Example: `{{{all-outbound-scalar-custom-name}}} cm`

- Scalar `array` or `array_d` aggregate:

    ```javascript
    {
      "scalar_array_d_aggregate-custom-name":  "1,234, 1,235", // formatted
      "_scalar_array_d_aggregate-custom-name":  [1234, 1235] // raw
    }
    ```
    Example: `values: {{{scalar_array_d_aggregate-custom-name}}}`

- `min`/`max`/`cnt_d`/`cnt` aggregate or any scalar column:

    ```javascript
    {
      "min_aggregate-custom-name":  "1,234", // formatted
      "_min_aggregate-custom-name":  1234 // raw
      "cnt_d_aggregate-custom-name":  "2", // formatted
      "_cnt_d_aggregate-custom-name":  2 // raw
    }
    ```
    Example: `{{{min_aggregate-custom-name}}} cm`

- self-link:

    ```javascript
    {
      "self-link-custom-name": {
        "values": {
          "col": "", // formatted
          "_col": "", // raw
          ... // other columns
        },
        "rowName": "",
        "uri": {
          "detailed": "" // link to record page
        }
      }
    }
    ```

## Examples

In this section you can find some examples of how you can use this feature. These examples are based on the ERD and `source-definitions` that are explained in the previous sections.

1. min and max in one column:

    ```javascript
    "tag:isrd.isi.edu,2016:visible-columns": {
        "compact": [
            {
                "sourcekey": "min_aggregate-custom-name",
                "markdown_name": "Range",
                "comment": "Range of values",
                "display": {
                    "markdown_pattern": "{{{min_aggregate-custom-name}}} - max_aggregate-custom-name",
                    "template_engine": "handlebars",
                    "wait_for": ["min_aggregate-custom-name"]
                }
            }
        ]
    }
    ```

2. aggregate column values in a normal column value:

    ```javascript
    "tag:isrd.isi.edu,2016:visible-columns": {
        "compact": [
            {
                "source": "int_col",
                "markdown_name": "Integer Col + Array aggregate",
                "comment": "value",
                "display": {
                    "markdown_pattern": "current: {{{$self}}}, related values: {{#each entity_array_d_aggregate-custom-name}}[{{{this.rowName}}}]({{{this.uri.detailed}}}){{/each}}",
                    "template_engine": "handlebars",
                    "wait_for": ["entity_array_d_aggregate-custom-name"]
                }
            }
        ]
    }
    ```

3. Summary of multiple pseudo-columns:

    ```javascript
    "tag:isrd.isi.edu,2016:visible-columns": {
        "compact": [
            {
                "source": "int_col",
                "markdown_name": "Integer Col + Array aggregate",
                "comment": "value",
                "display": {
                    "markdown_pattern": "min: {{{min_aggregate-custom-name}}}, alloutbound: {{{ll-outbound-entity-custom-name.rowName}}}, related values: {{#each entity_array_d_aggregate-custom-name}}[{{{this.rowName}}}]({{{this.uri.detailed}}}){{/each}}",
                    "template_engine": "handlebars",
                    "wait_for": ["min_aggregate-custom-name", "all-outbound-entity-custom-name", "entity_array_d_aggregate-custom-name"]
                }
            }
        ]
    }
    ```
