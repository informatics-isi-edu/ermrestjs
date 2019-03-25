# Export Annotation

Using the [export annotation](annotation.md#tag-2019-export) you can define export templates that will be used for `ioboxd` service integration with the client tools. For detailed information please refer to [the ioboxd documentation](https://github.com/informatics-isi-edu/ioboxd/blob/master/doc/integration.md).


## Structure

The following is how ERMrestJS and Chaise leverage the different values defined in the export annotation:

```js
"templates": [
  {
    "displayname": <chaise-display-name>, // name displayed in dropdown menu in the client
    "type": <FILE or BAG>,
    "outputs": [
      {
        "source": {
          "api": <ermrest-query-type>, // entity, attribute, attribute-group
          "path": <optional-ermrest-predicate> // used to represent more complex queries
        },
        destination: {
          "name": <output-file-base-name>,
          "type": <output-format-suffix>, // FILE supports csv, json; BAG supports csv, json, fetch(?), download(?)
          "params": <not-sure> // conditionally optional
        }
      }, ...
    ]
  }
]
```

## How ERMrestJS Interperts It

This annotation only applies to table but MAY be annotated at the schema level to set a schema-wide default. If the annotation is missing on the table, we will get the export definition from the schema. If the annotation is missing from both schema and table, we are going to apply default heuristics for this annotation in detailed context. This means if you navigate to a page with `detailed` context (record page in chaise) and you haven't defined any export annotation on the table, we are going to use the default export template. The following is how the content of default export anntoation:

- `csv` of `entity` API request to the main table.
- `csv` of `entity` API for all the related entities that are one level away from the main table.
- `csv` of `attributegroup` API for all the other related entities. The projection list should include all the columns of the table, plus the foreignkey value of the main entity. This request will be grouped by the value of table's key and foreignkey value.
- `fetch` all assets on the main entity that have `byte_count_column`, `filename_column`, and `md5` (or `sha256`) defined on the asset annotation.
- `fetch` all assets of related entities that have `byte_count_column`, `filename_column`, and `md5` (or `sha256`) defined on the asset annotation.
