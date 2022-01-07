# Export Annotation

Using the [export annotation](annotation.md#tag-2019-export) you can define export templates that will be used for deriva-py export service integration with the client tools. To make the process of writing export annotation simpler and modular, you can use [export fragment annotation](annotation.md#tag-2021-export-fragment-annotations). In this document, we will explain how you can write these two annotations and how export integration works in ERMrestJS/Chaise.

If you just want to see the overall structure of export annotation go [here](#overall-structure) or you can look at some examples in [here](#examples).

## Table of contents
- [Export Templates](#export-templates)
  - [Overall structure](#overall-structure)
  - [Details](#details)
    - [root](#root-object)
    - [template](#template-object)
    - [output](#output-object)
    - [source](#source-object)
    - [destination](#destination-object)
    - [output type](#type)
- [How it works](#how-it-works)
- [Default BDBag template](#default-bdbag-template)
- [Default CSV template](#default-csv-template)
- [Examples](#examples)

## Export Templates

Export of data from Chaise is configured through the use of *export templates*. An export template is a JSON object that is used in an ERMrest table/schema/catalog annotation payload.  The annotation is specified using `tag:isrd.isi.edu,2016:export` key.

The annotation payload is a JSON object containing a single array of `template` objects. One or more templates can be specified for a given table entity.  Templates specify a format name and type, followed by a set of output descriptor objects. A template output descriptor maps one or more source table queries to one or more output file destinations.


### Overall structure

To have a overall picture of how the export templates look like, you can refer to the following demonstration:

```js
"tag:isrd.isi.edu,2019:export": {
  "*": {
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
}
```

### Details

The object structure of an export template annotation is defined as follows:

#### root (object)
| Variable | Type | Inclusion| Description |
| --- | --- | --- | --- |
| `templates` | array[`template`] | required | An array of `template` objects.
#### `template` (object)
| Variable | Type | Inclusion| Description |
| --- | --- | --- | --- |
| `displayname` | string | required | The display name that will be used to populate the Chaise export format drop-down box for this `template`.
| `type` | string, enum [`"FILE"`,`"BAG"`] | required | One of two keywords; `"FILE"` or `"BAG"`, used to determine the container format for results.
| `outputs` | array[`output`] | required | An array of `output` objects. See below.

#### `output` (object)
| Variable | Type | Inclusion| Description |
| --- | --- | --- | --- |
| `source` | `source` | required | An object that contains parameters used to generate source data by querying ERMrest.
| `destination` | `destination` | required | An object that contains parameters used to render the results of the source query into a specified destination format.


- The table entity that the template is bound to is considered the *root* of the query for join purposes. Therefore this is how a query is going to be constructed based on the given attributes:

        <output.api>/<current root path>/<output.path>

- We are reserving the `M` alias for referring to the table entity that the template is bound to. So if you need to refer to that table in your path, you can use the reserved alias name.

- The leading and trailing slash that you might have defined in your `path` will be stripped off and ignored.

The following are some examples to better understand the output syntax. These are written for the table `pnc:metrics_v`,

 - To export the `pnc:metrics_v` table data, your output would be

    ```
    {
        "api": "entity"
    }
    ```
 - To export data for the `pnc:snp_v` table that has a foreign key relationship with `pcn:metrics_v`, your output would be

    ```
    {
        "api": "entity",
        "path": "pnc:snap_v"
    }
    ```

- To export only `RID`s of the table `pnc:metrics_v` that have exist in the foreign key relationship with `pnc:snap_v`, your output would be

    ```
    {
        "api": "attributegroup",
        "path": "pnc:snap_v/M:RID"
    }
    ```
    In this example we are using the reserved alias `M` to refer to the table `pnc:metrics_v`.



#### `source` (object)
| Variable | Type | Inclusion| Description |
| --- | --- | --- | --- |
| `api` | string, enum [`entity`,`attribute`, `attributegroup`] | required | The type of ERMrest query projection to perform.  Valid values are `entity`,`attribute`, and `attributegroup`.
| `path` | string | optional | An optional ERMrest path predicate. The string MUST be escaped according to [RFC 3986](https://tools.ietf.org/html/rfc3986) if it contains user-generated identifiers that use the reserved character set. See the [ERMRest URL conventions](https://github.com/informatics-isi-edu/ermrest/blob/master/docs/api-doc/index.md#url-conventions) for additional information.

#### `destination` (object)
| Variable | Type | Inclusion| Description |
| --- | --- | --- | --- |
| `name` | string | required | The base name to use for the output file.
| `type` | string | required | A type keyword that determines the output format. Supported values are dependent on the `template`.`type` selected. For the `FILE` type, the values `csv`, `json`, are currently supported. For the `BAG` type, the values `csv`, `json`, `fetch` and `download` are currently supported. See additional notes on destination format types.
| `params` | object | conditionally required | An object containing destination format-specific parameters.  Some destination formats (particularly those that require some kind of post-processing or data transformation), may require additional parameters  to be specified.

#### `type`
The following output format types are supported by default:

| Tag | Format | Description|
| --- | --- | --- |
|[`csv`](#csv)|CSV|CSV format with column header row.
|[`json`](#json)|JSON|JSON Array of row objects.
|[`download`](#download)|Asset download|File assets referenced by URL are downloaded to local storage relative to `destination.name`.
|[`fetch`](#fetch)|Asset reference|`Bag`-based. File assets referenced by URL are assigned as remote file references via `fetch.txt`.

Each _output format processor_ is designed for a specific task, and the task types may vary for a given data export task.
Some _output formats_ are designed to handle the export of tabular data from the catalog, while others are meant to handle the export of file assets that are referenced by tables in the catalog.
Other _output formats_ may be implemented that could perform a combination of these tasks, implement a new format, or perform some kind of data transformation.
<a name="csv"></a>
##### `csv`
This format processor generates a standard Comma Separated Values formatted text file. The first row is a comma-delimited list of column names, and all subsequent rows are comma-delimted values.  Fields are not enclosed in quotation marks.

Example output:
```
subject_id,sample_id,snp_id,gt,chipset
CNP0001_F09,600009963128,rs6265,0/1,HumanOmniExpress
CNP0002_F15,600018902293,rs6265,0/0,HumanOmniExpress
```

<a name="json"></a>
##### `json`
This format processor generates a text file containing a JSON Array of row data, where each JSON object in the array represents one row.

Example output:
```json
[{"subject_id":"CNP0001_F09","sample_id":"600009963128","snp_id":"rs6265","gt":"0/1","chipset":"HumanOmniExpress"},
 {"subject_id":"CNP0002_F15","sample_id":"600018902293","snp_id":"rs6265","gt":"0/0","chipset":"HumanOmniExpress"}]
 ```

<a name="download"></a>
##### `download`
This format processor performs multiple actions. First, it issues a `json-stream` catalog query using the parameters specified in `source`,
in order to generate a _file download manifest_ file named `download-manifest.json`. This manifest is simply a set of rows which MUST contain at least one field named `url`, and MAY contain a field named `filename`,
and MAY contain other arbitrary fields. If the `filename` field is present, it will be appended to the final (calculated) `destination.name`, otherwise the service will perform a _HEAD_ HTTP request against
the `url` for the `Content-Disposition` of the referenced file asset. If this query fails to determine the filename, the application falls back to using the final string component of the `url` field after the last `/` character.

After the _file download manifest_ is generated, the application attempts to download the files referenced in each result row's `url` field to the local filesystem, storing them at the base relative path specified by `destination.name`.

IMPORTANT: When configuring the `source` parameter block for a `download` destination, each row in the result MUST contain a column named `url` that is the actual URL path to the content that will be downloaded.
The type of `source.api` that is used does not matter, as long as the result data rows contain a `url` column. However, in general it is suggested to use the `attribute` type as the `source.api` so that only the minimum amount of tuples required to
perform the download are returned.  Additionally, use of the `attribute` API allows for easy renaming of column names, in case the target table stores the file location using a column name other than `url`.

For more information on ERMRest attribute API syntax, see the following [documentation](https://github.com/informatics-isi-edu/ermrest/blob/master/docs/api-doc/data/naming.md#attribute-names).
<a name="fetch"></a>
##### `fetch`
This format processor performs multiple actions. First, it issues a `json-stream` catalog query against the specified `query_path`, in order to generate a  _file download manifest_.
This manifest is simply a set of rows which MUST contain at least one field named `url`, and SHOULD contain two additional fields: `length`,
which is the size of the referenced file in bytes, and (at least) one of the following _checksum_ fields; `md5`, `sha1`, `sha256`, `sha512`. If the _length_ and appropriate _checksum_ fields are missing,
an attempt will be made to dynamically determine these fields from the remote `url` by issuing a _HEAD_ HTTP request and parsing the result headers for the missing information.
If the required values cannot be determined this way, it is an error condition and the transfer will abort.

Unlike the `download` processor, the `fetch` processor does not actually download any asset files, but rather uses the query results to create a `bag` with checksummed manifest entries that reference each remote asset via the `bag`'s `fetch.txt` file.

Similar to the `download` processor, the output of the catalog query MAY contain other fields. If the `filename` field is present, it will be appended to the final (calculated) `source.destination`, otherwise the application will perform a _HEAD_ HTTP request against
the `url` for the `Content-Disposition` of the referenced file asset. If this query fails to determine the filename, the application falls back to using the final name component of the `url` field after the last `/` character.

Also, like the `download` processor, when configuring the `source` parameter block for `fetch` output, each row in the result of the query MUST contain the required columns stated above.
The type of `source.api` that is used does not matter, as long as the result data rows contain the necessary columns. As with the `download` processor, the use of the `attribute` ERMRest query API is recommended.


## How it works

For processing export, we have to consult [export annotation](annotation.md#tag-2019-export) and [export fragment annotation](annotation.md#tag-2021-export-fragment-annotations). The following is how ERMrestJS looks at these two annotations:

1. We start by creating a fragment object that can be used while writing export annotation. To do so,

    1.1. The following is the starting default object:
      ```js
      {
        "$chaise_default_bdbag_template": {
          "type": "BAG",
          "displayname": {"fragment_key": "$chaise_default_bdbag_displayname"},
          "outputs": [
            {"fragment_key": "$chaise_default_bdbag_outputs"}
          ]
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

3. Now that we have the export definition as well as fragments, we just need to make sure any usage of `fragment_key` is replace with the actual definition. While doing so, if we find a `fragment_key` that is not valid, we're going to invalidate the whole template and ignore it.

4. As the last step, to just ensure Chaise is not throwing a terminal error, we will validate the templates and ignore the ones that are problematic. The following are the checks that we're doing:
    - Template is an array.
    - Template has `displayname` and `type`.
    - `type` value is either `FILE` or `BAG`.
    - `outputs` is a non-empty array.
    - Each output in the `outputs` array has `source` and `destination`.
    - `source` has `api` property.
    - `destination` has `type` property.
## Default BDBag template

If export annotation is missing for `detailed` context, we will add a default BDBag template. This default template is also accessible through the export fragment definitions annotation as well using `$chaise_default_bdbag_template` key. The following are the `outputs` of the generated default export template:

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


## Default CSV template

Chaise will add a default CSV option to the presented list of export templates. This option will prompt a download for a `csv` file that uses `attributegroup` API of ERMrest. The projection list is created based on the `visible-columns` and depending on the app it will use different contexts.

- In recordset app, Chaise will use `export/compact` context of `visible-columns`. If not defined, it will try `export` and then `compact`.
- In record app, Chaise will use `export/detailed`context of `visible-columns`. If not defined, it will try `export` and then `detailed`.

If you don't want Chaise to add this option, you should define an empty `visible-columns` list like the following:
```json
"tag:isrd.isi.edu,2016:visible-columns": {
  "export": []
}
```

## Examples

### Example 1
This example shows how a Bag can be created that includes both tabular data and localized assets by using an attribute query to select a filtered set of files from an image asset table.
```json
{
  "templates": [
    {
      "displayname":"BDBag",
      "type":"BAG",
      "outputs": [
        {
          "source": {
            "api": "entity"
          },
          "destination": {
            "name": "metrics",
            "type": "csv"
          }
        },
        {
          "source": {
            "api": "attribute",
            "path": "pnc:image_files/url:=uri",
          },
          "destination": {
            "name": "images",
            "type": "download"
          }
        }
      ]
    }
  ]
}
```
### Example 2
This example shows how a Bag can be created with remote file references by using an attribute query to select a filtered set of file types and mapping columns from an image asset table, which can then be used to automatically create the bag's `fetch.txt`.
```json
{
  "templates": [
    {
      "displayname":"BDBag",
      "type":"BAG",
      "outputs": [
        {
          "source": {
            "api": "entity"
          },
          "destination": {
            "name": "metrics",
            "type": "csv"
          }
        },
        {
          "source": {
            "api": "entity",
            "path": "pnc:snp_v"
          },
          "destination": {
            "name": "genotypes",
            "type": "csv"
          }
        },
        {
          "source": {
            "api": "entity",
            "path": "pnc:subject_phenotypes_v"
          },
          "destination": {
            "name": "phenotypes",
            "type": "csv"
          }
        },
        {
          "source": {
            "api": "attribute",
            "path": "pnc:image_files/url:=uri,length:=bytes,filename:=filepath,sha256:=sha256sum"
          },
          "destination": {
            "name": "images",
            "type": "fetch"
          }
        }
      ]
    }
  ]
}
```
### Example 3
This example maps multiple single table queries to single FILE outputs using the FASTA format.
```json
{
  "templates": [
    {
      "displayname": "FASTA (ORF)",
      "type": "FILE",
      "outputs": [
        {
          "source": {
            "api": "attribute",
            "path": "!orf::null::&!orf=%3F/title,orf"
          },
          "destination": {
            "name": "orf",
            "type": "fasta",
            "params": {
              "column_map": {
                "title":"comment",
                "orf":"data"
              }
            }
          }
        }
      ]
    },
    {
      "name": "protein",
      "displayname": "FASTA (Protein)",
      "type": "FILE",
      "outputs": [
        {
          "source": {
            "api": "attribute",
            "path": "!receptor_protein_sequence::null::/title,receptor_protein_sequence"
          },
          "destination": {
            "name": "protein",
            "type": "fasta",
            "params": {
              "column_map": {
                "title":"comment",
                "receptor_protein_sequence":"data"
              }
            }
          }
        }
      ]
    },
    {
      "displayname": "FASTA (Nucleotide)",
      "type": "FILE",
      "outputs": [
        {
          "source": {
            "api": "attribute",
            "path": "!exptnucseq::null::&!exptnucseq=NONE/title,exptnucseq"
          },
          "destination": {
            "name": "nucleotide",
            "type": "fasta",
            "params": {
              "column_map": {
                "title":"comment",
                "exptnucseq":"data"
              }
            }
          }
        }
      ]
    }
  ]
}
```
### Example 4
This example uses the same queries from Example 1, but instead packages the results in a Ba archive rather than as a set of individual files.
```json
{
  "templates": [
    {
      "displayname": "BDBag (ALL FASTA)",
      "type": "BAG",
      "outputs": [
        {
          "source": {
            "api": "attribute",
            "path": "!orf::null::&!orf=%3F/title,orf"
          },
          "destination": {
            "name": "orf",
            "type": "fasta",
            "params": {
              "column_map": {
                "title":"comment",
                "orf":"data"
              }
            }
          }
        },
        {
          "source": {
            "api": "attribute",
            "path": "!receptor_protein_sequence::null:://title,receptor_protein_sequence"
          },
          "destination": {
            "name": "protein",
            "type": "fasta",
            "params": {
              "column_map": {
                "title":"comment",
                "receptor_protein_sequence":"data"
              }
            }
          }
        },
        {
          "source": {
            "api": "attribute",
            "path": "!exptnucseq::null::&!exptnucseq=NONE/title,exptnucseq"
          },
          "destination": {
            "name": "nucleotide",
            "type": "fasta",
            "params": {
              "column_map": {
                "title":"comment",
                "exptnucseq":"data"
              }
            }
          }
        }
      ]
    }
  ]
}
```

### Example 5

In this example, we want to add a new template to a table that uses the same default BDBag template, but with a customized post process. To do so, we just have to make sure we're using the predefined `fragment_key`:

```js
{
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
```

### Example 6
Let's assume you want to create global templates that should be used on every table. To do so,

1. Define the templates as a fragment that can be used later. Since we want a global template, we would define this on catalog:
    ```js
    {
      "tag:isrd.isi.edu,2021:export-fragment-definitions": {
        "my_default_templates": [
          // your templates go here
        ]
      }
    }
    ```

2. To make sure tables/schemas without export annotation are using the templates defined in `my_default_templates` fragment, you can define a catalog-level export annotation like this:
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

3. And for schemas/tables that already have export annotation, you have to make sure the `my_default_templates` fragment is added to the list of templates:
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


