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


This annotation only applies to a table, but MAY be annotated at the schema level to set a schema-wide default. If the annotation is missing on the table, we will get the export definition from the schema. If the annotation is missing from both schema and table, we are going to apply default heuristics for this annotation only in `detailed` context. This means if you navigate to a page with `detailed` context (record page in chaise) and you haven't defined any export annotation, we are going to use the default export template. The following is the content of the generated default export template:

- `csv` of `attributegroup` API request to the main table.
  - The projection list is created based on the `visible-columns` defined for the `export` context (or `detailed` if `export` annotation is not specified).


- `csv` of `attributegroup` API for all the other related entities.
  - The List of related entities is populated using the `export` (or `detailed`) context in `visible-foreign-keys` annotation.
  - The projection list includes all the visible columns of the related table based on `export` (or `detailed`) context.
  - The foreign key column of the main entity is added to the projection list, so we don't lose the relationship of the related entity.
  - This request is grouped by the value of table's key and foreign key value.


- `fetch` all visible assets of the main entity in `export` (or `detailed`) context.
   - The `destination.name` is generated using the `assets/<column name>` pattern, where `<column name>` is the name of your asset column.


- `fetch` all visible assets of the related entities in `export` (or `detailed` ) context.
  - The `destination.name` is generated using the `assets/<table displayname>/<column name>` pattern, where `<table displayname>` is the displayname of the related table, and `<column name>` is the name of your asset column.

> If the generated path for any of the `attributegroup` API requests is lengthy, we will use the `entity` API instead.
