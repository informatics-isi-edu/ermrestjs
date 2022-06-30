# Google dataset annotation

By using [google-dataset](annotation.md#tag-2021-google-dataset) annotation, you can define the metadata that will be converted to valid and well-formed JSON-LD referencing a table. In terms of SEO, JSON-LD is implemented leveraging the Schema.org vocabulary, which is a unified structured data vocabulary for the web. [Google Dataset Search](https://datasetsearch.research.google.com/) discovers datasets when a valid JSON-LD of type [Dataset](https://www.schema.org/Dataset) is added to the HTML page.

The is how this annotation looks like:

```javascript
{
  "tag:isrd.isi.edu,2021:google-dataset": {
    "detailed": {
      "dataset": {
        // the JSON-LD defnition goes here
      },
      "template_engine": "handlebars"
    }
  }
}
```

## Expected Fields

Given that we expect a valid JSON-LD of Dataset, the following properties must be defined on top level:

- `@context`: It is a schema for your data, not only defining the property datatypes but also the classes of json resources. Default applied if none exists is `http://schema.org`.
- `@type`: Used to set the data type of a node or typed value. At the top level, only a value of `Dataset` is supported. Default applied if none exists is `Dataset`.

To make sure the given JSON-LD is valid and honors the [Schema.org](https://schema.org/Dataset) specifications, ERMrestJS uses [this](https://github.com/informatics-isi-edu/ermrestjs/blob/master/js/utils/json_ld_schema.js) file which is a subset of Schema.org vocabulary. Based on this file `name` and `description` are the other top-level required properties. Therefore the following is the bare minimum acceptable JSON-LD defnition:

```json
{
  "@type": "Dataset",
  "context": "https://schema.org",
  "name": "some name",
  "description": "Some description that must be at least 50 characters."
}
```

## Guidelines

In this section, we will summarize some of the best practices or common ways of writing this annotation.

> to make this document shorter and easier to read, we will only write the JSON-LD without the annotation tag and other properties. Also, all the templates are written based on `handlebars` template engine.

1. All the properties support [pattern expansion](annotation.md#pattern-expansion). Apart from the main table data and all-outbound foreign keys, the pattern has access to a `$self` object that has the following properties:
    - `rowName`: Row-name of the represented row.
    - `uri.detailed`: a uri to the row in `detailed` context.

    ```javascript
    {
      "@type": "Dataset",
      "context": "https://schema.org",
      "name": "Table: {{{$self.rowName}}}",
      "description": "{{{Description}}}",
      "url": "{{{$self.uri.detailed}}}"
    }
    ```

2. If you want to make sure this annotation is only added for certain rows, you can write conditional logic for the `name` or `description` properties (given that these two are required). In the following example, we are making sure that the JSON-LD is only added for rows with `Consortium=cons1`:

    ```javascript
    {
      "name": "{{#if (eq _Consortium \"cons1\" )}}{{{Title}}}{{/if}}",
      ...
    }
    ```

3. You can use [Google's documentation](https://developers.google.com/search/docs/advanced/structured-data/dataset#dataset) to find the recommended list of properties. In the following we summarized some of the key information in this document:
    - `description` must be between **50** and **5000** characters and may also include Markdown syntax.
    - Embedded images in `description` need to use absolute path URLs (instead of relative paths).
    - `identifier` can be used to denote a DOI or a Compact Identifier. If the dataset has more than one identifier, given that we're using JSON (and it must be JSON parsable), you can define an array of identifiers.

4. Any non-required JSON-LD properties can be an array. For instance, if you want to encode multiple `funder` you can do the following:
   ```javascript
   {
     "funder": [
       {
         "@type": "Organization",
         "name": "funder1"
       },
       {
         "@type": "Organization",
         "name": "funder2"
       }
     ],
     ...
   }
   ```

5. If the value of a property is the string representation of a JSON object, ERMrestJS will turn it into an object. This would allow us to write patterns that produce an object.

    5.1. For example assume that we have an array column called "authors" which has a value of `["John", "Jessica"]`, then we could do

    ```javascript
    {
      "creator": "{{#if authors}} [ {{#each _authors}} { \"@type\":\"Person\", \"name\":{{{this}}} } {{#unless @last}}, {{/unless}}{{/each}} ] {{/if}}",
      ...
    }
    ```
    which would return
    ```javascript
    {
      "creator": [
        {
          "@type": "Person",
          "name": "John"
        },
        {
          "@type": "Person",
          "name": "Jessica"
        }
      ]
    }
    ```

    5.2. Or let's say we want to store the value of a property in a jsonb column called `funder_jsonb_col`, then we could simply use the formatted value of that column:

    ```javascript
    {
      "funder": "{{{funder_jsonb_col}}}",
      ...
    }
    ```
    This only works because ERMrestJS returns the string representation of the raw value when you do `{{{funder_jsonb_col}}}`.

    5.3. But in a case where this value is stored in a field of a jsonb column, you cannot just directly pass the value and you have to turn it into a string first. For this case assume that we have a `DataCatalog` jsonb column where it has `funder` and `creator` fields. The following is how you can use this column:
    ```javascript
    {
      "funder": "{{#jsonStringify}}{{{_DataCatalog.funder}}}{{/jsonStringify}}",
      "creator": "{{#jsonStringify}}{{{_DataCatalog.funder}}}{{/jsonStringify}}",
      ...
    }
    ```
    Notice that we had to use `_DataCatalog` to access the raw value, and also call `jsonStringify` to turn the `funder` raw object into a string.


