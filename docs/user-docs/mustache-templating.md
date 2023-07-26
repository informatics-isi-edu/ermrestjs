# Mustache Templating

The Mustache template format can be understood [here](https://github.com/janl/mustache.js#templates). Once templating is done, the returned string is passed to the Markdown renderer. Templates are usually used in combiniation with markdown, to learn about the Markdown syntax please refer to the [markdown Formatting](markdown-formatting.md) page.


**While we still support mustache, we highly recommend using [handlebars](handlebars.md) instead. In the near future we are planning to deprecate mustache support**.

## Table of contents

  - [Variables](#variables)
    - [Usage](#usage)
    - [Raw Values](#raw-values)
    - [Foreign Key Values](#foreign-key-values)
      - [JSON](#json)
      - [Array](#array)
    - [Encoding variables for URL manipulation](#encoding-variables-for-url-manipulation)
    - [Escaping Content](#escaping-content)
  - [Examples](#examples)
    - [1. Normal replacement - "{{{name}}}"](#1-normal-replacement---name)
    - [2. Replacement with URL encoding - "{{#encode}}{{{name}}}{{/encode}}"](#2-replacement-with-url-encoding---encodenameencode)
    - [3. Replacement with HTML escaping - "{{name}}"](#3-replacement-with-html-escaping---name)
    - [4. Replacement with null check, disabled escaping and url encoding - "{{#name}}...{{/name}}"](#4-replacement-with-null-check-disabled-escaping-and-url-encoding---namename)
    - [5. Replacement with negated-null check - "{{^name}}...{{/name}}"](#5-replacement-with-negated-null-check---namename)
    - [6. Null Handling](#6-null-handling)
      - [Limitations](#limitations)
    - [Using Pre-defined Attributes](#using-pre-defined-attributes)



## Variables

The most basic tag type is a simple variable. A {{{name}}} tag renders the value of the name key in the current context.

### Usage

* `{{{COLUMN_NAME}}}` : The triple curly braces will replace the column value as is.

### Raw Values

By default ermrestJS returns formatted values for a column. If you need to access the raw values returned by Ermrest you should prepend the column name with an underscore **"_"** in the template.

```sh
# {{{_COUMN_NAME}}}

{{{_user}}}
```

In case of `jsonb` columns, `{{{col}}}` will return the string representation of the value, while `{{{_col}}}` can be used to access the raw value of the column. This will allow you to access the fields in the jsonb value. For instance if the jsonb value is `{"name": 1234}`, then you can use `{{{_col.name}}}` to access the `name` field. While accessing the raw jsonb column, we don't allow you to access the "formatted" values and the returned value is the raw field value. In the example above, `{{{_col.name}}}` will return "1234" and not "1,234".

### Foreign Key Values

You can access table's outbound foreign key data using `$fkeys` variable. To do so, you can use the constraint name of the foreign key. For instance having `["schema", "constraint"]` as schema-constraint pair for the foreign key, you can use `$fkey_schema_constraint` (`$fkeys.schema.constraint` syntax is still supported but it's deprecated) to access its attributes. The following are available attributes for foreign keys:

1. `values`: An object containing values of the table that the foreign key refers to. Both formatted and unformatted column values will be available here. For instance `$fkey_schema_const.values.col1` will give you the formatted value for the `col1` and `$fkey_schema_const.values._col1` the unformatted.
2. `rowName`: Row-name of the foreign key.
3. `uri.detailed`: a uri to the foreign key in `detailed` context (record app).

```
# Create a link to Foreign key:

{{#$fkey_schema_constraint}}
  [{{rowName}}]({{{uri.detailed}}})
{{/$fkey_schema_constraint}}

# Access column values of a foreign key:

{{{$fkey_schema_constraint.values.col1}}} - {{{$fkey_schema_constraint.values.col2}}}
```
The current implementation of `$fkeys` has the following limitations:

- Using $fkeys you can only access data from tables that are one level away from the current table. This can cause problem when you are using $fkeys in your `row_markdown_pattern` annotation. Let's say the following is the ERD of your database.

  ![$fkey example](https://dev.isrd.isi.edu/~ashafaei/wiki-images/fkeys_1.png)

  And you have defined the `row_markdown_pattern` of table A as `{{{$fkey_schema_fk1.values.term}}}`. If you navigate to record app for any records of A, the rowname will be displayed as you expect it. But if you go to the table C, the rowname of A won't be as you expected since we don't have access to the table B's data.
   Therefore it's advised to use `$fkey` only for the `column-display` annotation (or any other annotation that is controlling data for the same table).


#### JSON
To access inner properties of a JSON column just use Mustache block scope.

```
{{#_user}}
   {{{FirstName}}}
   {{{LastName}}}
{{/_user}}
```

**NOTE**: Internal properties of a JSON column don't require underscore to be prepended.

#### Array

To access an array column, use the Mustache block scope for the column and access the value with a `.`. The scope works as an iterator if the value is an array.

```
{{#_ids}}
  {{{.}}}
{{/_ids}}
```

### Encoding variables for URL manipulation

To specifically encode values; for example query strings of a url, you can use the **encode** block in this way.
```javascript
{{#encode}}{{{COLUMN_NAME}}}{{/encode}}
```
Whatever that is present in the opening and closing of the encode block will be URL encoded.

### Escaping Content

To specifically escape values; for example slashes "/" or hyphens "-" etc., you can use the **escape** block in this way.
```javascript
{{#escape}}{{{COLUMN_NAME}}}{{/escape}}
```
Whatever that is present in the opening and closing of the escape block will be escaped. Escaping is necessary whenever you feel that your content might contain some special characters that might interfere with the markdown compiler.

These special characters are as follows:
```
{  }  [  ]  (  )  #  *  !  .  +  -  `  /  >  <
```


## Examples

**NOTE**: we will be using following object for values

```javascript
{
  date: "08/25/2016",
  url: "https://dev.isrd.isi.edu/chaise/recordset/#1/legacy:dataset/title=",
  name: "BiomassProdBatch for Virus=7782 Target=5HT1B site=USC"
}
```

### 1. Normal replacement - "{{{name}}}"

```

This is some value in COLUMN **{{{name}}}**

# MUSTACHE OUTPUT: "This is some value in COLUMN **BiomassProdBatch for Virus=7782 Target=5HT1B site=USC**""
# MARKDOWN OUTPUT: "<p>This is some value in COLUMN <strong>BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</strong></p>"
```
> 'This is some value in COLUMN **BiomassProdBatch for Virus=7782 Target=5HT1B site=USC**'

### 2. Replacement with URL encoding - "{{#encode}}{{{name}}}{{/encode}}"

```

[{{name}}](https://dev.isrd.isi.edu/chaise/search?name={{#encode}}{{{name}}}{{/encode}})

# MUSTACHE OUTPUT: "[BiomassProdBatch for Virus&#x3D;7782 Target&#x3D;5HT1B site&#x3D;USC](https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC)"
# MARKDOWN OUTPUT: "<p><a href="https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC">BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</a></p>"
```
> [BiomassProdBatch for Virus&#x3D;7782 Target&#x3D;5HT1B site&#x3D;USC](https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC)

### 3. Replacement with HTML escaping - "{{name}}"

```

Research **{{name}}** was conducted on {{{date}}}

# MUSTACHE OUTPUT: "Research **BiomassProdBatch for Virus&#x3D;7782 Target&#x3D;5HT1B site&#x3D;USC** was conducted on 08/25/2016"
# MARKDOWN OUTPUT: "<p>Research <strong>BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</strong> was conducted on 08/25/2016</p>"
```
> Research **BiomassProdBatch for Virus&#x3D;7782 Target&#x3D;5HT1B site&#x3D;USC** was conducted on 08/25/2016

### 4. Replacement with null check, disabled escaping and url encoding - "{{#name}}...{{/name}}"

With null value for title

```
# title = null

Research on date {{{date}}} : {{#title}}[{{{title}}}](https://dev.isrd.isi.edu/chaise/search?name={{#encode}}{{{name}}}{{/encode}}){{/title}}

# MUSTACHE OUTPUT: "Research on date 08/25/2016 : "
# MARKDOWN OUTPUT: "<p>Research on date 08/25/2016 :</p>\n"
```
> Research on date 08/25/2016 :

With non-null value for title and null value for name

```
# title = "BiomassProdBatch for Virus=7782 Target=5HT1B site=USC"

Research on date {{{date}}} : {{#title}}[{{{title}}}](https://dev.isrd.isi.edu/chaise/search?name={{#encode}}{{{name}}}{{/encode}}){{/title}}

# MUSTACHE OUTPUT: "Research on date 08/25/2016 : [BiomassProdBatch for Virus=7782 Target=5HT1B site=USC](https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC)"
# MARKDOWN OUTPUT: "<p>Research on date 08/25/2016 : <a href="https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSCBiomassProdBatch for Virus=7782 Target=5HT1B site=USC</a></p>"
```
> Research on date 08/25/2016 : [BiomassProdBatch for Virus=7782 Target=5HT1B site=USC](https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC)

### 5. Replacement with negated-null check - "{{^name}}...{{/name}}"

In cases where you need to check whether a value is null, then use this string, you can use this syntax.

```
#title = null;

Research on date {{{date}}} : {{^title}}[This is some title](https://dev.isrd.isi.edu/chaise/search?name={{#encode}}{{{name}}}{{/encode}}){{/title}}

# MUSTACHE OUTPUT: "Research on date 08/25/2016 : [This is some title](https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC)"
# MARKDOWN OUTPUT: "<p>Research on date 08/25/2016 : <a href="https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC">This is some title</a></p>"
```
> Research on date 08/25/2016 : [This is some title](https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC)



### 6. Null Handling

If the value of any of the columns which are being used in the `markdown_pattern` are either null or empty, then the pattern will fall back on the `show_null` display annotation to return respective value. For example, if title property in the json object is not defined or null then following template `[{{{title}}}]({{{url}}})` will resolve as null and use the `show_null` annotation to determine what should be done.

To make sure that you handle above case, wrap properties which can be null inside null handling blocks as mentioned in last 2 samples.

```js
 [{{#title}}{{{title}}}{{/title}}{{^title}}No title defined{{/title}}]({{{url}}})
```
#### Limitations

- If you're using [Raw values](#raw-values) and have logic to check for boolean false values then please don't try using it. Mustache block for null handling evaluates to false if the value is false, empty, null or zero. This will also not work for raw json values where you plan to check whether an array is null or not. If the array is not null the block converts to an iterator and will fire internal code n times.
- If in any part of the mustache template you are using the block syntax (`{{# COL }}`), we will not apply this null handling logic.


### Using Pre-defined Attributes

Ermrestjs now allows users to access some pre-defined variables in the template environment for ease. You need to make sure that you don't use these variables as column-names in your tables to avoid them being overridden in the environment. These pre-defined attributes are available in both Mustache and Handlebars templating environments. Please refer to [here](handlebars.md#using-pre-defined-attributes) for more information.
