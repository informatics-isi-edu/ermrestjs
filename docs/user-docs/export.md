# Export Annotation

Using the [export annotation](annotation.md#tag-2019-export) you can define export templates that will be used for `ioboxd` service integration with the client tools. For detailed information please refer to [the ioboxd documentation](https://github.com/informatics-isi-edu/ioboxd/blob/master/doc/integration.md).

To make the process of writing export annotation simpler and modular, you can use [export fragment annotation](annotation.md#tag-2021-export-fragment-annotations). 


## Export Template Structure

The following is how ERMrestJS and Chaise leverage the different values defined in the export annotation:

```js
{
  "templates": [
    {
      "displayname": <chaise-display-name>, // name displayed in dropdown menu in the client
      "type": <FILE or BAG>, // whether we should call export module or send a direct request to ERMrest
      "outputs": [
        {
          "source": {
            "api": <ermrest-query-type>, // entity, attribute, attribute-group
            "path": <optional-ermrest-predicate> // used to represent more complex queries
          },
          destination: {
            "name": <output-file-base-name>,
            "type": <output-format-suffix>, // FILE supports csv, json; BAG supports csv, json, fetch, download
            "params": {} // conditionally optional
          }
        }, ...
      ],
      "transforms": [], // refer to export module for more details
      "postprocessors": [], // refer to export module for more details
      "public": <Boolean>, // refer to export module for more details
      "bag_archiver": <string> // refer to export module for more details
    }
  ]
}
```

## How it works

For processing export, we have to consult [export annotation](annotation.md#tag-2019-export) and [export fragment annotation](annotation.md#tag-2021-export-fragment-annotations). The following is how ERMrestJS looks at these two annotations:

1. We start by creating a fragment object that can be used while writing export annotation. To do so, 

    1.1. The following is the starting default object:
      ```js
      {
        "$chaise_default_bdbag_template": {
          "type": "BAG",
          "displayname": {"fragment_key": "$chaise_default_bdbag_displayname"},
          "outputs": {"fragment_key": "$chaise_default_bdbag_outputs"}
        },
        "$chaise_default_bdbag_displayname": "BDBag",
        "$chaise_default_bdbag_outputs": <chaise-default-bdbag>
      }
      ```
      > for more information about the chaise default BDBag, please navigate to [this section](#default-bdbag-template).

    1.2. We look for the export fragment definitions annotation on catalog, if defined, we will merge the starting object with what's defined on catalog. This will allow you to override the default properties that we're adding. This step will continue for schema, as well as, table. 

2. In this step, we will find the export templates that should be used. Given that this annotation is used for a specific table in a specific context, the following is how we find the proper definition:
    - If the annotation is defined for the context on table, use it.
    - Otherwise, if the annotation is defined for the context on schema, use it.
    - Otherwise, if the annotation is defined for the context on catalog, use it.
    - Otherwise, if chaise-config `disableDefaultExport` is not set to `true`, apply the following default annotation:
      ```json
      {
        "tag:isrd.isi.edu,2019:export": {
          "*": {
            "templates": []
          },
          "detailed": {
            "templates": { "fragment_key": "$chaise_default_bdbag_template"}
          }
        } 
      }
      ```

3. Now that we have the export definition as well as fragments, we just need to make sure any usage of `fragment_key` is replace with the actual definition.

<!-- TODO REQUIRES MORE INFO -->

4. As the last step, to just ensure Chaise is not throwing a terminal error, we will validate the templates and ignore the ones that are problematic. The following are the checks that we're doing:
  - Template is an array.
  - Template has `displayname` and `type`.
  - `type` value is either `FILE` or `BAG`.
  - `outputs` is a non-empty array.
  - Each output in the `outputs` array has `source` and `destination`.
  - `source` has `api` property.
  - `destination` has `type` property.

### Examples


#### Example 1

In this example, we want to add a new template to a table that uses the same default BDBag template, but with a customized post process. To do so, we just have to make sure we're using the predefined `fragment_key`:

```js
{
  "tag:isrd.isi.edu,2019:export": {
    "detailed": {
      "templates": [
        {
          "displayname": "New template",
          "type": "BAG",
          "outputs": [
            {"fragment_key": "$chaise_default_bdbag_template"}
          ],
          "postprocessors": [
            // the custom post process goes here
          ]
        }
      ]
    }
  }
}
```

#### Example 2
Let's assume you want to create global templates that should be used on every table. To do so,

- First define the templates as a fragment that can be used later. Since we want a global template, we would define this on catalog:
    ```js
    {
      "tag:isrd.isi.edu,2021:export-fragment-definitions": {
        "my_default_templates": [
          // your templates go here
        ]
      }
    }
    ```

- To make sure tables/schemas that don't have any annotation inject these templates, you can define a catalog-level export annotation like this:
    ```js
    {
      "tag:isrd.isi.edu,2019:export": {
        "*": {
          "templates": [
            {"fragment_key": "my_default_templates"}
          ]
        }
      }
    }
    ```

- For tables that already have this annotation, you can just inject this fragment in the list of templates:
    ```js
    {
      "tag:isrd.isi.edu,2019:export": {
        "*": {
          "templates": [
            {"fragment_key": "my_default_templates"},
            // other templates that are defined for this specific table
          ]
        }
      }
    }
    ```


### Default BDBag template

If export annotation is missing for `detailed` context, we will add a default BDBag template. This default template is also accessible through the export fragment definitions annotation as well. The following are the `outputs` of the generated default export template:

- `csv` of `attributegroup` API request to the main table.
  - The projection list is created based on the `visible-columns` defined for the `export/detailed` context (or `detailed` if `export` context is not specified).


- `csv` of `attributegroup` API for all the other related entities.
  - The List of related entities is populated using the `export/detailed` (or `export` or `detailed`) context in `visible-foreign-keys` annotation.
  - The projection list includes all the visible columns of the related table based on `export` (or `detailed`) context.
  - The foreign key column of the main entity is added to the projection list, so we don't lose the relationship of the related entity.
  - This request is grouped by the value of table's key and foreign key value.


- `fetch` all visible assets of the main entity in `export/detailed` (or `export` or `detailed`) context.
   - The `destination.name` is generated using the `assets/<column name>` pattern, where `<column name>` is the name of your asset column.


- `fetch` all visible assets of the related entities in `export/detailed` (or `export` or `detailed` ) context.
  - The `destination.name` is generated using the `assets/<table displayname>/<column name>` pattern, where `<table displayname>` is the displayname of the related table, and `<column name>` is the name of your asset column.

> If the generated path for any of the `attributegroup` API requests is lengthy, we will use the `entity` API instead.


### Default CSV template

Chaise will add a default CSV option to the presented list of export templates. This option will prompt a download for a `csv` file that uses `attributegroup` API of ERMrest. The projection list is created based on the `visible-columns` and depending on the app it will use different contexts.

- In recordset app, Chaise will use `export/compact` context of `visible-columns`. If not defined, it will try `export` and then `compact`.
- In record app, Chaise will use `export/detailed`context of `visible-columns`. If not defined, it will try `export` and then `detailed`.

If you don't want Chaise to add this option, you should define an empty `visible-columns` list like the following:
```json
"tag:isrd.isi.edu,2016:visible-columns": {
  "export": []
}
```



