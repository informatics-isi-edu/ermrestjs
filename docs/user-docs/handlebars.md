# Handlebars Templating

This document summarizes the key concepts of Handlebars that are relevant to Deriva.

## Table of contents

- [Handlebars vs. Mustache](#handlebars-vs-mustache)
  - [Null checking](#null-checking)
  - [Encode syntax](#encode-syntax)
  - [Restriction in the adjacency of opening and closing tags](#restriction-in-the-adjacency-of-opening-and-closing-tags)
- [Usage](#usage)
  - [Handlebars Paths](#handlebars-paths)
  - [Raw values](#raw-values)
  - [Foreign Key Values](#foreign-key-values)
  - [Automatic null detection](#automatic-null-detection)
  - [Accessing current context](#accessing-current-context)
  - [HTML-escaping](#html-escaping)
  - [Using Arrays](#using-arrays)
  - [Escaping Handlebars expressions](#escaping-handlebars-expressions)
  - [Accessing keys with spaces and special characters](#accessing-keys-with-spaces-and-special-characters)
  - [Subexpressions](#subexpressions)
- [Using Pre-defined Attributes](#using-pre-defined-attributes)
  - [$moment](#moment)
  - [$catalog](#catalog)
  - [$dcctx](#dcctx)
  - [$location](#location)
  - [$session](#session)
- [Helpers](#helpers)
  - [printf helper](#printf-helper)
  - [formatDate helper](#formatdate-helper)
  - [humanizeBytes helper](#humanizebytes-helper)
  - [stringLength helper](#stringLength-helper)
  - [Math Helpers](#math-helpers)
    - [add](#add)
    - [subtract](#subtract)
- [Block Helpers](#block-helpers)
  - [If helper](#if-helper)
  - [Unless helper](#unless-helper)
  - [Each helper](#each-helper)
  - [With helper](#with-helper)
  - [Lookup helper](#lookup-helper)
  - [Encode helper](#encode-helper)
  - [Escape helper](#escape-helper)
  - [Encodefacet helper](#encodefacet-helper)
  - [JsonStringify helper](#jsonstringify-helper)
  - [Findfirst helper](#findfirst-helper)
  - [Findall helper](#findall-helper)
  - [Replace helper](#replace-helper)
  - [ToTitleCase helper](#totitlecase-helper)
- [Boolean Helpers](#boolean-helpers)
  - [Comparison Helpers](#comparison-helpers)
  - [Regular Expression Match](#regular-expression-match)
  - [Access Control (ACL) check](#access-control-acl-check)
  - [Logical Helpers](#logical-helpers)


## Handlebars vs. Mustache

[Handlebars](http://handlebarsjs.com/) is almost similar to Mustache with additional benefits. There are some things you can't do in Mustache (e.g., if-else statement) that Handlebars allows us to do easily using `helpers`.

The following are the most notable things to consider while migrating from Mustache to handlebars:

### Null checking

Mustache doesn't have a dedicated boolean operator or null-checking mechanism. Instead, you have to use the block syntax (`{{#name}}...{{/name}}`), which does a "falsy" check and doesn't distinguish between `0`, `false`, `null`, or `""`.


Handlebars offer a proper [`if` helper](#if-helper), which can be used for null or boolean checking. With this operator, you can use more complicated expressions and more accurate comparisons (e.g., null v.s. false).

Mustache:
```
{{#name}}Hello {{{name}}}{{/name}}{{^name}}No name available{{/name}}
```

Handlebars:
```
{{#if name}}Hello {{{name}}}{{else}}No name available{{/if}}
```

Depending on the value of the key, the mustache block syntax will also change the context. That's why it can be used to [iterate over array values](mustache-templating.md#array) or [access JSON properties](mustache-templating.md#json). That's why you could do something like the following:

Mustache:
```
{{#name}}Hello {{{.}}}{{/name}}

{{#$fkey_schema_constraint}}{{{values.RID}}}{{/fkey_schema_constraint}}
```

But the handlebars `if` block doesn't change the context. So if you're looking for an equivalent syntax for mustache block that also changes context, you should use the [`with` helper](#with-helper).

The equivalent handlebars template would be:
```
{{#with name}}Hello {{{.}}}{{/with}}

{{#with $fkey_schema_constraint}}{{{values.RID}}}{{/with}}
```

### Encode syntax

Mustache blocks don't allow additional parameters. That's why you must wrap the value you want to encode while using' encode' in the block itself. With handlebars, you can just pass the value as a second parameter.

Mustache:
```
{{#encode}}My URL{{/encode}}

{{#encode}}{{{col}}}{{/encode}}
```

Handlebars:
```
{{#encode 'My URL'}}{{/encode}}

{{#encode col}}{{/encode}}
```

### Restriction in the adjacency of opening and closing tags

As we described [in the markdown document](markdown-formatting.md#attributes), you can add attributes to markdown elements using the `{}` syntax. Now imagine you want to create a link and the attribute value comes from one of the columns. In Mustache, you could do the following (assume `btn_class` is the name of the column):

Mustache:
```
[click here](https://example.com){{{{btn_class}}}}
```

But this syntax in handlebars returns an error as it doesn't recognize `{{{{}}}}`, and you have to add an extra space to distinguish between the attribute block and template variables.

Handlebars:
```
[click here](https://example.com){ {{{btn-class}}} }
```

## Usage

### Handlebars Paths

The most basic tag type is a simple variable. A `{{{name}}}`` tag renders the value of the name key in the current context. The triple curly braces will replace the column value as is.

```
{{{COLUMN_NAME}}}
```

Handlebars also supports nested paths, making it possible to look up properties nested below the current context.

```
The body for book with {{title}} authored by {{author.name}} is {{body}}
```

That template works with this context
```json
{
  "title": "My First Blog Post!",
  "author": {
    "id": 47,
    "name": "Yehuda Katz"
  },
  "body": "My first post. Wheeeee!"
}
```

This makes it possible to use Handlebars templates with more raw JSON objects.

Nested handlebars paths can also include `../` segments, which evaluate their paths against a parent context.

For example, with the following context:
```json
{
  "permalink": "https://example.com/post/1",
  "comments": [
    {
      "id": "c1",
      "title": "comment 1",
      "body": "I liked it."
    },
    {
      "id": "c2",
      "title": "comment 2",
      "body": "Meh."
    }
  ]
}
```

You could do:
```
{{#each comments}}
  [{{title}}](/posts/{{../permalink}}#{{id}})
  {{body}}
{{/each}}
```


Even though the link is printed while in the context of a comment, it can still go back to the main context (the post) to retrieve its permalink.
The exact value that `../` will resolve to varies based on the helper that is calling the block. Using `../` is only necessary when context changes, so children of helpers such as `each` would require the use of `../` while children of helpers such as `if` do not.

```
{{permalink}}
{{#each comments}}
    {{../permalink}}

    {{#if title}}
      {{../permalink}}
    {{/if}}
{{/each}}
```

In this example, all of the above reference the same `permalink` value even though they are located within different blocks.

**NOTE**: Handlebars also allows for name conflict resolution between helpers and data fields via a `this` reference:
```
<p>{{./name}} or {{this/name}} or {{this.name}}</p> or {{this.[name with a space]}}
```
Any of the above would cause the name field in the current context to be used rather than a helper of the same name.

### Raw values

By default ERMrestJS returns formatted values for a column by using `{{{COLUMN_NAME}}}`. If you need to access the raw values returned by ERMrest you should prepend the column name with an underscore **"_"** in the template.

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

{{#with $fkey_schema_constraint}}
  [{{rowName}}]({{{uri.detailed}}})
{{/with}}

# Access column values of a foreign key:

{{{$fkey_schema_constraint.values.col1}}} - {{{$fkey_schema_constraint.values.col2}}}
```
The current implementation of `$fkeys` has the following limitations:

- Using $fkeys you can only access data from tables that are one level away from the current table. This can cause problem when you are using $fkeys in your `row_markdown_pattern` annotation. Let's say the following is the ERD of your database.

  ![fkey example](https://github.com/informatics-isi-edu/ermrestjs/raw/master/docs/resources/fkeys-example-erd.png)

  And you have defined the `row_markdown_pattern` of table A as `{{{$fkey_schema_fk1.values.term}}}`. If you navigate to record app for any records of A, the rowname will be displayed as you expect it. But if you go to the table C, the rowname of A won't be as you expected since we don't have access to the table B's data.
   Therefore it's advised to use `$fkey` only for the `column-display` annotation (or any other annotation that is controlling data for the same table).


### Automatic null detection

To avoid the need for adding individual checks for each `{{{column_name}}}` usage, we apply an automatic null detection. If the value of any of the columns that are being used in the `markdown_pattern` are either null or empty, then the pattern will fall back on the `show_null` display annotation to return the respective value. For example, if the title property in the JSON object is not defined or null, then the following template `[{{{title}}}]({{{url}}})` will resolve as null and use the `show_null` annotation to determine what should be done.

That being said, our current implementation has the following limitations/flaws:

1. If you use the block syntax (`{{# `) in any part of the template, we will not apply this null detection logic.

2. As we described in [here](#accessing-keys-with-spaces-and-special-characters), you can use the `[]` syntax to access columns with special characters. The null detection will not work properly if your column name has `#` in it. For instance, assume you have a column named `# Released` and want to show its value. Doing `{{{[# Released]}}}` will not work as it's breaking our null detection. As we mentioned in the previous limitation, usage of block syntax will turn off the null detection. So, to get around this, we suggest using any block helpers. For instance, you could use the [with helper](#with-helper):

    ```
    {{#with [# Released]}}{{{.}}}{{/with}}
    ```

    Since `with` is changing the context, it might not be ideal in complicated templates. If you want to turn off the null detection without any side effect, you could wrap it in a `{{#if true}}` block.

### Accessing current context

The `this` keyword can be used for accessing the current context. It's mainly useful when dealing with arrays or JSON objects, allowing you to access the values of an array of objects. For example, if you have the following JSON column:

```jsson
{
  "person": {
    "firstname": "John",
    "lastname": "smith"
  }
}
```

While you can use `{{{person.firstname}}}` to access the values inside the object, you can use a block like the following and utilize the `this` keyword:

```
{{#person}}
{{{this.firstname}}} {{{this.lastname}}}
{{/person}}
```

As we mentioned `this` is also useful for arrays, for more information please refer to the [Each Helper](#each-helper) section. To expand on this, you can also use `this` in the case that you have an array of objects. For example:

```json
{
  "authors": [
    {
      "firstname": "John",
      "lastname": "smith"
    },
    {
      "firstname": "Joe",
      "lastname": "Doe"
    }
  ]
}
```

Where you can do

```
{{#each authors}}
  {{{this.firstname}}} - {{{this.lastname}}}
  {{#unless @last}}\n{{/unless}
{{/each}}
```

In this case, `this` refers to each element of the array that is an object and can use the `.` notation to access their attributes.


### HTML-escaping

In Handlebars, the values returned by the `{{expression}}` are HTML-escaped. Say, if the expression contains `&`, then the returned HTML-escaped output is generated as `&amp;`. If you don't want Handlebars to escape a value, use the "triple-stash", `{{{`:

You can learn how to produce the HTML escaped and raw output in the template below.

```
raw: {{{specialChars}}}
html-escaped: {{specialChars}}
```

Pass the special characters to the template

```
{ specialChars: "& < > \" ' ` =" }
```

Expressions enclosed by "triple-stash" (`{{{`) produce the raw output. Otherwise, HTML-escaped output is generated as below.

```
raw: & < > " ' ` =
html-escaped: &amp; &lt; &gt; &quot; &#x27; &#x60; &#x3D;
```

### Using Arrays

You can use the [Each Helper](#each-helper) to iterate over its data. You can also use the `{{array.INDEX}}` pattern if you want to access array data by index, where the index starts from zero and it is the position of the element that you want to access.

Template:
```
{{{arr.0.value}}}
```

When used in this context:
```json
{
  "arr": [
      {"value": "first element"},
      {"value": "second element"},
      {"value": "third element"}
  ]
}
```

Result:
```
first element
```

### Escaping Handlebars expressions

Handlebars content may be escaped using inline escapes. Inline escapes are created by prefixing a mustache block with `\\`

For example,
```
\\{{{escaped}}}
```
Would return
```
{{{escaped}}}
```

### Accessing keys with spaces and special characters

Handlebars allows you to access keys/variables which have spaces ` ` or special characters like `{}` in their names. You need to enclose those variables in square brackets.


```
{{[str with a space]}}
```

To access these variables in another block helper

```
{{#encode [str with a space]}}{{/encode}}
{{#escape [str with a space]}}{{/escape}}
```

This syntax can also be used for accessing properties of an object. For example with this context,

```
{
  "values": {
    "name": "resonant scan",
    "power (uW)": 123.4,
  }
}
```

You can do
```
{{{values.name}}} power: {{{values.[power (uW)]}}}
```
Which returns
```
resonant scan power: 123.4
```



### Subexpressions

Handlebars offers support for `subexpressions`, which allows you to invoke multiple helpers within a single mustache `{{}}`, and pass in the results of inner helper invocations as arguments to outer helpers. Subexpressions are delimited by parentheses.

```
{{#escape (encode arg1) arg2}}{{/escape}}
```

In this case, `encode` will get invoked with the string argument `arg1`, and whatever the encode function returns will get passed in as the first argument to escape (and `arg2` will get passed in as the second argument to escape).

## Using Pre-defined Attributes

Ermrestjs allows users to access some pre-defined variables in the template environment. You must ensure you don't use these variables as column names in your tables to avoid overriding them in the environment. These pre-defined attributes are available in both Mustache and Handlebars templating environments. The following are the attributes:

### $moment

`$moment` is a datetime object which will give you access to date and time when the app was loaded. For instance if the app was loaded at Thu Oct 19 2017 16:04:46 GMT-0700 (PDT), it will contain following properties

* `date`: Day of the month: 19
* `day`: Day of the week: 4
* `month`: 10
* `year`: 2017
* `dateString`: Thu Oct 19 2017
* `hours`: 16
* `minutes`: 4
* `seconds`: 14
* `milliseconds`: 873
* `timeString`: 16:04:46 GMT-0700 (PDT)
* `ISOString`: 2017-10-19T23:04:46.873Z
* `GTMString`: Thu, 19 Oct 2017 23:04:46 GMT
* `UTCString`: Thu, 19 Oct 2017 23:04:46 GMT
* `LocaleDateString`: 10/19/2017
* `LocaleTimeString`: 4:04:46 PM
* `LocalString`: 10/19/2017, 4:04:46 PM

The `$moment` object can be referred directly in the Mustache environment. If you would like to display the current date and time in a different format, you can use `$moment.ISOString` with [`formatDate`](#formatDate) helper.

**Examples**

```js
Today's date is {{formatDate $moment.ISOString "YYYY/M/D"}}.
```

```js
Today's is date {{{$moment.month}}}/{{{$moment.date}}}/{{{$moment.year}}}
``

```js
Current time is {{{$moment.hours}}}:{{{$moment.minutes}}}:{{{$moment.seconds}}}:{{{$moment.milliseconds}}}
```
```js
UTC datetime is {{{$moment.UTCString}}}
```
```js
Locale datetime is {{{$moment.LocaleString}}}
```
```js
ISO datetime is {{{$moment.ISOString}}}
```


### $catalog
`$catalog` is an object that gives you access to the catalog information including version if it is present. The following properties are currently included:
```
{
  "snapshot": <id>@<version>,
  "id": id,
  "version": version
}
```


### $dcctx
`$dcctx` is an object that gives you access to the current `pid` and `cid` of the app. You may use this attribute to generate links with `ppid` and `pcid` as query parameters.
```
{
    "pid": "the page id",
    "cid": "the context id(name of the app)"
}
```

### $location
`$location` is an object that gives you access to information about the current location of the document based on the URL. The following properties are included:
```
{
    "origin": "the origin of the URL",
    "host": "the host of the URL, which is the hostname, and then, if the port of the URL is nonempty, a ':', and the port",
    "hostname": "the hostname of the URL",
    "chaise_path": "the path after the origin pointing to the install location of chaise. By default, this will be '/chaise/'"
}
```

For example, if the web url is `https://dev.example.com:8080/chaise/recordset/#1/isa:dataset`, the above object would look something like:
```json
{
    "origin": "https://dev.example.com",
    "host": "dev.example.com:8080",
    "hostname": "dev.example.com",
    "chaise_path": "/chaise/"
}
```

### $session
`$session` is an object that gives you access to information about the current logged in user's session. The properties are the same properties returned from the webauthn response. The following are some of the properties included (subject to change as properties are added and removed from webauthn):
```
{
  "attributes": "the `attributes` array from the webauthn response. More info below about the objects in the `attributes` array"
  "client": {
    "display_name": "the `display_name` of the user from webauthn client object",
    "email": "the `email` of the user from webauthn client object",
    "extensions": "an object containing more permissions the user might have. Used in the CFDE project for communicating ras permissions.",
    "full_name": "the `full_name` of the user from webauthn client object",
    "id": "the `id` of the user from webauthn client object",
    "identities": "the `identities` array of the user from webauthn client object",
  }
}
```

Each object in the `attributes` array has the same values as the objects returned from the webauthn attributes array, with 2 added values, `webpage` and `type`. The returned array is composed of globus groups and different globus identities associated with the user. It has any objects with duplicate `id` values merged together. The following values can be found in each object of `attributes`:
 - `display_name`: the display name of the group or identity
 - `email`: the email of the identity (if present)
 - `full_name`: the full_name of the identity (if present)
 - `id`: the id of the group or identity
 - `identities`: the identities array of the current identity (if present)
 - `type`: the type of the entry (`identity` or `globus_group`). The type is set as a `globus_group` if the display_name is defined and the id is NOT in the list of identities associated with the logged in user. The type is set as an `identity` if the id is in the list of identities associated with the logged in user (`client.identities`). Otherwise, no type will be set.
 - `webpage`: If the `type` is set to `globus_group`, the webpage is then set to the globus group page. If the globus group id is "https://auth.globus.org/ff766864-a03f-11e5-b097-22000aef184d", then the webpage will be created by extracting the id value and setting it like "https://app.globus.org/groups/ff766864-a03f-11e5-b097-22000aef184d/about".

 The `extensions` object currently contains 3 properties with permissions for dbgap studies. These properties are:
  - `has_ras_permissions`: boolean value if ras dbgap permissions are present
  - `ras_dbgap_permissions`: array of objects with information about which dbgap studies the user has permissions for
  - `ras_dbgap_phs_ids`: map of `phs_id` values as the keys with `true` as the value


## Helpers

A Handlebars helper call is a simple identifier, followed by zero or more parameters (separated by space). Each parameter is a Handlebars expression.

```
{{HELPER_NAME PARAM1 PARAM2 }}
```

### printf helper

You can use the `printf` helper to format a value. The expected format follows the same syntax as [PreFormat](pre-format.md#syntax).

Syntax:
```
{{printf value format }}
```

Example:
```
{{printf 3.1415 "%.1f" }} ==> "3.1"

{{printf 43 "%4d" }} ==> "  43"
```

Keep in mind that `printf` doesn't check the validity of the given values. So for example if the value might not be a number, you cannot blindly use the `d` type and should guard against it.

### formatDate helper

You can use the `formatDate` helper to take any `date`, `timestamp`, or `timestamptz` value and format it according to the [Pre Format Guide](pre-format.md#syntax-for-dates-and-timestamps).

Syntax:
```
{{formatDate value format}}
```

Example:
```
{{formatDate "30-08-2018' 'YYYY'}} ==> '2018'

{{formatDate '30-08-2018' 'YYYY/M/D'}} ==> '2018/8/30'
```

### humanizeBytes helper

You can use `humanizeBytes` helper to convert byte count to human readable format.

Syntax:
```
{{humanizeBytes value}}
```
This will format the given value to a human readable string using "si" mode. If you would like to modify the behavior, you can also pass named optional arguments. You can choose to pass any combiniation of these named arguments.

Examples:

```
{{humanizeBytes 41235532}} ==> '41.2 MB'

{{humanizeBytes 41235532 precision=4 }} ==> '41.23 MB'

{{humanizeBytes 41235532 mode='binary'}} ==> '39.32 MiB'

{{humanizeBytes 41235532 mode='binary' precision=5}} ==> '39.325 MiB'

{{humanizeBytes 41235532 mode='binary' tootlip=true}} ==> ':span:39.32 MiB:/span:{data-chaise-tooltip="41235532 bytes (1 MiB = 1,048,576 bytes)"}'

{{humanizeBytes 41235532 mode='binary' precision=5 tootlip=true}} ==> ':span:39.325 MiB:/span:{data-chaise-tooltip="41235532 bytes (1 MiB = 1,048,576 bytes)"}'
```

The arguments are:

#### `mode`

This argument will allow you to change the output format. It can either be a string `"si"` or `"binary"`. Any other value will be ignored.

```
{{humanizeBytes value mode="si"}}

{{humanizeBytes value mode='si'}}

{{humanizeBytes value mode="binary"}}

{{humanizeBytes value mode='binary'}}
```

#### `precision`

An integer specifying the number of digits.
  - If we cannot show all the fractional digits of a number due to the defined precision, we will truncate the number (we will not round up or down). So for example `999999` with precision=3 will result in `999 kB`, and with precision=4 will be `999.9 kB`.
  - In 'si' mode, you cannot define precision of less than 3 since it would mean that we have to potentially truncate the integer part of the `value`. Similarly, precision of less than 4 are not allowed in `binary`.
  - Any invalid precision will be ignored and the minimum number allowed will be used (3 in `si` and 4 in `binary`).

```
{{humanizeBytes value precision=6}}
```

#### `tooltip`

A boolean value specifying whether you want the output to include a tooltip or not. If this argument is missing, we will not return any tooltips.

```
{{humanizeBytes value tooltip=true}}
```

### stringLength helper

You can use `stringLength` helper to get the length of a given string.

Syntax:
```
{{stringLength value }}
```

Example:
```
{{stringLength "123123" }} ==> 6

{{stringLength value }} ==> assuming value is "sometext" returns 8.


[{{{caption}}}](https://example.com){ {{#if (gt (stringLength caption) 100)}}.lengthy-caption{{else}}.short-caption{{/if}} }
```



### Math Helpers

We have basic math functionality support available in handlebars templating. The following are the currently available math helpers.

#### add
The `add` helper can be used to add 2 numbers together. It will always add the `value2` to `value1`. If the provided value is a string, we will try to convert it to a number before doing the calculation to avoid string concatenation. Note: This may behave oddly with float values.
```
{{add value1 value2}}
```
#### subtract
The `subtract` helper can be used to subtract 2 numbers. It will always subtract `value2` from `value1`. If the provided value is a string, we will try to convert it to a number before doing the calculation to avoid string subtraction. Note: This may behave oddly with float values.
```
{{subtract value1 value2}}
```

## Block Helpers

Block helpers make it possible to define custom iterators and other functionality that can invoke the passed block with a new context. These helpers are very similar to functions that we have in Mustache.

```
{{#HELPER_NAME}}
 CONTENT
{{/HELPER_NAME}}
```

### If helper

You can use the `if` helper to conditionally render a block. If its argument returns `false`, `undefined`, `null`, `""`, `0`, or `[]`, Handlebars will not render the block. You can use this helper with any of the [Boolean Helpers](#boolean-helpers) to do more complicated logical operations.

```
{{#if isVisible}} {{{firstName}}} {{{lastName}}}{{/if}}
```

> If you're using `if` block only to check for a JSON object and then using it, consider using [`with` helper](#with-helper) which will do the truthy check and changes context at the same time similar to [how Mustache null checking works](#null-checking).


When using a block expression, you can specify a template section to run if the expression returns a falsy value. The section, marked by `{{else}}` is called an "else section".

```
{{#if isVisible}} {{{firstName}}} {{{lastName}}}{{else}}Hidden Author{{/if}}
```

You can also use `else if`:

```
{{#if isVisible}} {{firstName}} {{lastName}}{{else if isKnown}} Unknown Author {{/if}}

{{#if isVisible}} {{firstName}} {{lastName}}{{else if isKnown}} Unknown Author {{else}} Hidden and Unknown Author{{/if}}
```

Plesae refer to [Boolean Helpers](#boolean-helpers) section to learn how you can achieve more complicated comparisons inside the `if` block.


### Unless helper

You can use the `unless` helper as the inverse of the `if` helper. Its block will be rendered if the expression returns a falsy value.

```
{{#unless license}}WARNING: This entry does not have a license!{{/unless}}
```

If looking up `license` under the current context returns a `falsy` value, Handlebars will render the warning. Otherwise, it will render nothing.

**NOTE**: You can use inverted if (`^if`) to get the same effect of `unless`

### Each helper

You can iterate over a list using the built-in `each` helper. Inside the block, you can use `this` to reference the element being iterated over.

```
{{#each people}}{{this}}{{/each}}
```

when used with context
```js
{
  "people": [
    "Yehuda Katz",
    "Alan Johnson",
    "Charles Jolley"
  ]
}
```

Yields the following output

```
Yehuda Katz Alan Johnson Charles Jolley
```
You can use the `this` expression in any context to reference the current context.

You can optionally provide an `{{else}}` section which will display only when the list is empty.

```
{{#each paragraphs}}
  {{this}}
{{else}}
  No content
{{/each}}
```

When looping through items in `each`, you can optionally reference the current loop index via `{{@index}}`.

```
{{#each array}}
  {{@index}}: {{this}}
{{/each}}
```

Additionally for object iteration, `{{@key}}` references the current key name:

```
{{#each object}}
  {{@key}}: {{this}}
{{/each}}
```

The first and last steps of iteration are noted via the `@first` and `@last` variables when iterating over an array. When iterating over an object only the `@first` is available.

When looping throw items in `each`, you can reference the iterable object using `../` syntax. The following will allow you to access the array and calculate its length:
```
{{#each array}}
  {{../array.length}}
{{/each}}
```


Nested `each` blocks may access the iteration variables via depth-based paths. To access the parent index, for example, `{{@../index}}` can be used.

The `each` helper also supports block parameters, allowing for named references anywhere in the block.

```
{{#each array as |value key|}}
  {{#each child as |childValue childKey|}}
    {{key}} - {{childKey}}. {{childValue}}
  {{/each}}
{{/each}}
```

Will create a `key` and `value` variable that children may access without the need for depthed variable references. In the example above, `{{key}}` is identical to `{{@../key}}` but in many cases is more readable.

### With helper

`With` helper can be used to shift the context. For example with the following context:

```json
{
  "title": "My first post!",
  "author": {
    "firstName": "Charles",
    "lastName": "Jolley"
  }
}
```

You can do:
```
{{title}}
{{#with author}}
  By {{{firstName}}} {{{lastName}}}
{{/with}}
```

Which results in
```
My first post! By Charles Jolley
```

#### Accessing outer context

If inside the `with` block you want to access the outer context, you need to prepend the column names with `../`. For example:

```
{{#with author}}
  {{{firstName}}} {{{lastName}}} wrote {{{../title}}}.
{{/with}}
```

#### Accessing current value

As we described in [here](#null-checking), `with` can also be used for doing a "truthy" check. You can use `.` to access
the value of the `with` block. For example:

```
{{#with column}}{{{.}}}{{{/with}}}
```

- With `{"column": null}` doesn't return anything.
- WIth `{"column": "some value"}` returns `"some value"`.


You can also use `else` as we decribed [here](#using-else-with-with-block). That being said, we recommend using [`if` helper](#if-helper) instead of `with` for boolean operations as its more flexible and doesn't change the context.

#### Define known reference

`with` can also be used with block parameters to define known references in the current block. The example above can be converted to

```
{{#with author as |myAuthor|}}
  {{{myAuthor.firstName}}} {{{myAuthor.lastName}}} wrote {{{title}}}.
{{/with}}
```
This allows for complex templates to potentially provide clearer code than `../` depthed references allow for.

#### Using `else` with `with` block

You can optionally provide an `{{else}}` section which will display only when the passed value is empty.

```
{{#with author}}
  {{name}}
{{else}}
  No content
{{/with}}
```

### Lookup helper

You can use the `lookup` helper to do dynamic parameter resolution with Handlebars variables.

One example assumes you have a map similar to what is defined below and use an `id` to resolve the value of one of the keys in the map.
```
var map = {"id1": true, "id2": "alpha", "id3": 123}

{{lookup map id}}
```

The example that will be used in CFDE uses a map attached to the `$session` template variable:
```
{{lookup $session.client.extensions.ras_dbgap_phs_ids dbgap_study_id}}
```

NOTE: When looking up a key to get its value, `null` (if value is `null`) or `undefined` (if key is not present) will be returned so make sure to guard against those negative cases in templating.

### Encode helper

You can use the `encode` helper to get strings in URL encoded format. It accepts more than one string that needs to be encoded
```
age={{#encode ageVar}}{{/encode}}
```
for context `ageVar=10` will result in `age%3D10`

In addition, you can provide multiple inputs too which are concatenated and then encoded. For example,
```
{{#encode key '=' value}}
```
for context `key="name" and value="John"` will result in `name%3DJohn`

### Escape helper

You can use the `escape` helper to specifically escape values; for example, hyphens "-" etc., you can use the escape block in this way. It accepts more than one string that needs to be escaped
```
name={{#escape key}}{{/escape}}
```
for context `key="**somevalue ] which is ! special"` will result in `name=\*\*somevalue \] which is \! special`

In addition, you can provide multiple inputs too which are concatenated and then encoded. For example,
```
{{#escape key '-' value}}{{/escape}}
```
for context `key="**somevalue ] which is ! special" and value="John"` will result in `\*\*somevalue \] which is \! special\-John`

### Encodefacet helper

You can use the `encodeFacet` helper to compress a JSON object. The compressed string can be used for creating a URL path with facets. This helper can be used for encoding both JSON objects and string representation of a JSON object.

#### 1. Passing the string representation of a facet blob

The string that you are passing as content MUST be JSON parsable. It will be ignored otherwise.

Template (newline and indentation added for readability and should be removed):
```
[caption](example.com/chaise/recordset/#1/S:T/*::facets::{{#encodeFacet}}
{
  \"and\": [
    {
      \"source\": [{\"inbound\": [\"schema\", \"fk_1\"]}]}, \"RID\"],
      \"choices\": [\"{{{RID}}}\"]
    }
  ]
}
{{/encodeFacet}})
```
Result:
```
<a href="example.com/chaise/recordset/#1/S:T/*::facets::<facet-blob-representation>">caption</a>
```

As you can see in this example we are escaping all the `"`s. This is because you are usually passing this value in a string in a JSON document. So all the `"`s must be escaped.

You can also pass the string representation of the JSON object like the following:

```
{{encodeFacet json_str}}
```

or
```
{{#encodeFacet json_str}}{{/encodeFacet}}
```

With the following context:

```json
{
  "json_str": "{\"and\": [{\"source\": [{\"inbound\": [\"schema\", \"fk_1\"]}]}, \"RID\"], \"choices\": [\"{{{RID}}}\"]}]}"
}
```

#### 2. Passing the JSON object representing a facet


For instance, assuming `obj` is the name of the `jsonb` column that stores the facet object:
```
[caption](example.com/chaise/recordset/#1/S:T/*::facets::{{encodeFacet obj}})
```

or

```
[caption](example.com/chaise/recordset/#1/S:T/*::facets::{{#encodeFacet obj}}{{/encodeFacet}})
```

Result:
```
<a href="example.com/chaise/recordset/#1/S:T/*::facets::<facet-blob-representation>">caption</a>
```


### JsonStringify helper

The `jsonStringify` helper will convert the supplied JSON object into a string representation of the JSON object. This helper behaves the same way as the `JSON.stringify` function in javascript.

The following are different ways of using this helper (assume `column` stores a JSON object):
```
{{#jsonStringify}}{{{column}}}{{/jsonStringify}}

{{#jsonStringify column}}{{/jsonStringify}}
```

This can be used in conjunction with the `encodeFacet` helper for creating facet URL strings. For example:

```
[caption](example.com/chaise/recordset/#1/S:T/*::facets::{{encodeFacet (jsonStringify col)}})
```

Wher `col` is:

```
{
  "and": [
    {
      "source": [{"inbound": ["schema", "fk_1"]}]}, "RID"],
      "choices": ["{{{RID}}}"]
    }
  ]
}
```

This would result in:
```
<a href="example.com/chaise/recordset/#1/S:T/*::facets::<facet-blob-representation>">caption</a>
```

### Findfirst helper

The `regexFindFirst` helper will take the input regular expression and return the first matching substring from the supplied string. Will return `""` otherwise.

> The regular expression syntax that Javascript supports is a bit different from other languages, please refer to [MDN regular expressions document](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) for more information.

A simple example where we try to match the file extension `jpg` or `png` with testString="jumpng-fox.jpg":
```
{{#regexFindFirst testString "jpg|png"}}{{this}}{{/regexFindFirst}}
```

Result:
```
"png"
```

An example template to extract the filename from a given path with testString = "/var/www/html/index.html":
```
{{#regexFindFirst testString "[^\/]+$"}}{{this}}{{/regexFindFirst}}
```

Result:
```
"index.html"
```

You can also use the `flags` named optional argument to pass [regular expression flags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#advanced_searching_with_flags). For example you can use the `i` flag for case-insensitive searching:
```
{{#regexFindFirst testString "human" flags="i" }}{{this}}{{/regexFindFirst}}
```

> If `flags` argument is not used, by default we are using the `g` (global search) flag for the regular expression search.

### Findall helper

The `regexFindAll` helper will take the input regular expression and return all the matching substrings from the supplied string in an array. Will return `[]` otherwise.

> The regular expression syntax that Javascript supports is a bit different from other languages, please refer to [MDN regular expressions document](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) for more information.

A simple example where we try to match the file extension `jpg` or `png` with testString="jumpng-fox.jpg":
```
{{#each (regexFindAll testString "jpg|png")}}{{this}}\n{{/each}}
```

Result:
```
"png\njpg\n"
```

You can also use the `flags` named optional argument to pass [regular expression flags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#advanced_searching_with_flags). For example you can use the `i` flag for case-insensitive searching:
```
{{#regexFindAll testString "ACO1" flags="i" }}{{this}}{{/regexFindFirst}}
```

> If `flags` argument is not used, by default we are using the `g` (global search) flag for the regular expression search.

### Replace helper

The `replace` helper will take the input regular expression (first argument) and replace all matches in the supplied string with the supplied substring (second argument). This helper behaves the same way as the `replace` function for Strings in javascript.

> The regular expression syntax that Javascript supports is a bit different from other languages, please refer to [MDN regular expressions document](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) for more information.

One example would be to replace all underscores with whitespace characters for table name display.

Template:
```
{{#replace "_" " "}}table_name_with_underscores{{/replace}}
```

Result:
```
table name with underscores
```

You can also use the `flags` named optional argument to pass [regular expression flags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#advanced_searching_with_flags). By default we're using the `g` flag, that's why the example above is replacing all the matches. Examples of using the `flags` named argument:

- If you only want to replace the first match, you can pass empty string for flags:
  - Template:
  ```
  {{#replace "_" " " flags=""}}table_name_with_underscores{{/replace}}
  ```

  - Result:
  ```
  table name_with_underscores
  ```

- Use the `i` flag for case-insensitive searching (in this example we're also using `g` flag to make sure we're still replacing all the matches):
  - Template:
  ```
  {{#replace "aco1" "ACO1" flags="ig"}}{{{Gene_Names}}}{{/replace}}
  ```

  - Result (assuming `Gene_Names` is `"Aco1, ACO1"`):
  ```
  ACO1, ACO1
  ```

### ToTitleCase helper

The `toTitleCase` helper will change the first character of each word (split by whitespace) in the string to a capital letter. The rest of the case of the string will remain unchanged.

Template:
```
{{#toTitleCase}}this is the title of my page{{/toTitleCase}}
```

Result:
```
This Is The Title Of My Page
```


## Boolean Helpers

In this section we go over the helpers that can be used to do boolean operations. These helpers are commonly used with `if` or `unless`.

### Comparison Helpers

- Equality (`eq`)
```
{{#if (eq var1 var2)}}
  .. content
{{/if}}
```

- Inequality (`ne`)

```
{{#if (ne var1 var2)}}
  .. content
{{/if}}
```

- Lower than (`lt`)

```
{{#if (lt var1 var2)}}
  .. content
{{/if}}
```

- Greater than (`gt`)

```
{{#if (gt var1 var2)}}
  .. content
{{/if}}
```

- Lower than equal (`lte`)

```
{{#if (lte var1 var2)}}
  .. content
{{/if}}
```

- Greater than equal (`gte`)

```
{{#if (gte var1 var2)}}
  .. content
{{/if}}
```


### Regular Expression Match

Using the `regexMatch` function you can check whether a given value matches the given regular expression. The regular expression syntax that Javascript supports is a bit different from other languages, please refer to [MDN regular expressions document](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) for more information.

```
{{#if (regexMatch value "jpg|png" )}}
.. content
{{/if}}
```

You can also use the `flags` named optional argument to pass [regular expression flags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#advanced_searching_with_flags). For example you can use the `i` flag for case-insensitive matching:
```
{{#if (regexMatch value "film analysis" flags="i" )}}
.. content
{{/if}}
```

> If `flags` argument is not used, by default we are using the `g` (global search) flag for the regular expression search.

### Access Control (ACL) check

Using the `isUserInAcl` function you can check whether the current user is in a given ACL group or not. You may pass one or multiple groups, or a variable that represents an array. As long as the user is in one of the group ACL groups, this function will return true.

```
{{isUserInAcl "https:/group-id" }}
{{isUserInAcl "https:/group-id1" "https://group-id2" }}
{{isUserInAcl groupArray }}

{{#if (isUserInAcl "https:/group-id")}}
  has access
{{/if}}

{{#if (isUserInAcl "https:/group-id1" "https://group-id2")}}
  has access
{{/if}}

{{#if (isUserInAcl groupArray)}}
  has access
{{/if}}
```


### Logical Helpers

- And (`and`)

```
{{#if (and var1 var2)}}
  .. content
{{/if}}
```

- Or (`or`)

```
{{#if (or var1 var2)}}
  .. content
{{/if}}
```

- Negate (`not`)

```
{{#if (not var1)}}
  .. content
{{/if}}
```

Logical operators can be applied recursively. This will allow for more complicated logical statements.

```
{{#if (or (eq filename "foo.png") (regexMatch type "jpg|png") )}}
.. content
{{/if}}

{{#if (or (and (gt value 1) (lt value 5) ) (and (gt value 10) (lt value 15) ) )}}
1-5 or 10-15
{{else}}
outside the range
{{/if}}
```

You can also have more than two operators inside the `or`/`and` statement.

```
{{#if (or cond1 cond2 cond3)}}
.. content
{{/if}}


{{#if (or cond1 (not cond2) cond3)}}
.. content
{{/if}}
```
