# Handlebars Templating

[Handlebars](http://handlebarsjs.com/) is almost similar to Mustache with some additional benefits. There are some things that you can't do in Mustache (e.g if-else statement) that Handlebars allows us to do easily using `helpers`.

Handlebars supports most of the Mustache syntax. However, there are a few features that are not supported by Handlebars. For example:
- Block syntax `{{#name}}...{{/name}}`: This is primarily used in Deriva annotations to perform boolean (or null) checks. With handlebars you need to pass the variables to an `if` helper to do the check e.g. `{{#if name}}...{{/if}}`.

```js
// Mustache

{{#name}}Hello {{{name}}}{{/name}}{{^name}}No name available{{/name}}

// name="John" (or any object that evaluates to true in javascript)                 => Hello John
// name=null (or any object that evaluate to false such as '', 0, false, [], etc)   => No name available

// handlebards

{{#if name}}Hello {{{name}}}{{else}}No name available{{/if}}
```

- encode/decode `{{#encode}}...{{/encode}}`/`{{#decode}}...{{/decode}}`: With handlebars the value to be encoded is passed to the `encode`/`decode` helper e.g. `{{#encode ...}}{{/encode}}` or `{{#decode ...}}{{/decode}}`.

```
// Mustache
{{#encode}}My URL{{/encode}}

// handlebards
{{#encode 'My URL'}}{{/encode}}
```

Handlebars supports more complicated expression syntax and allow the comparison to be done at the finer level e.g. null v.s. false comparison. This document summarizes the key concepts of Handlebars that are relevant to Deriva.

## Table of contents

* [Handlebar Paths](#handlebars-paths)
* [HTML-escaping](#html-escaping)
* [Accessing current context](#accessing-current-context)
* [Using Arrays](#using-arrays)
* [Escaping Handlebars expressions](#escaping-handlebars-expressions)
* [Accessing keys with spaces and special characters](#accessing-keys-with-spaces-and-special-characters)
* [Subexpressions](#subexpressions)
* [Helpers](#helpers)
   * [FormatDate](#formatdate-helper)
   * [Math Helpers](#math-helpers)
* [Block Helpers](#block-helpers)
   * [If](#if-helper)
   * [Unless](#unless-helper)
   * [Each](#each-helper)
   * [With](#with-helper)
   * [Lookup](#lookup-helper)
   * [Encode](#encode-helper)
   * [Escape](#escape-helper)
   * [EncodeFacet](#encodefacet-helper)
   * [JsonStringify](#jsonstringify-helper)
   * [FindFirst](#findfirst-helper)
   * [FindAll](#findall-helper)
   * [Replace](#replace-helper)
   * [ToTitleCase](#totitlecase-helper)
* [Boolean Helpers](#boolean-helpers)
  * [Comparison Helpers](#comparison-helpers)
  * [Logical Helpers](#Logical-helpers)
  * [Regular Expression Match](#regular-expression-match)

## HTML-escaping

In Handlebars, the values returned by the `{{expression}}` are HTML-escaped. Say, if the expression contains `&`, then the returned HTML-escaped output is generated as `&amp;`. If you don't want Handlebars to escape a value, use the "triple-stash", `{{{`:

In the below template, you can learn how to produce the HTML escaped and raw output.

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

## Handlebars Paths

Handlebars supports simple paths, just like Mustache.

```
<p>{{{name}}}</p>
```

Handlebars also supports nested paths, making it possible to lookup properties nested below the current context.


```
The body for book with {{title}} authored by {{author.name}} is {{body}}
```

That template works with this context
```js
var context = {
  title: "My First Blog Post!",
  author: {
    id: 47,
    name: "Yehuda Katz"
  },
  body: "My first post. Wheeeee!"
};
```

This makes it possible to use Handlebars templates with more raw JSON objects.

Nested handlebars paths can also include ../ segments, which evaluate their paths against a parent context.

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

In this example all of the above reference the same `permalink` value even though they are located within different blocks.

**NOTE**: Handlebars also allows for name conflict resolution between helpers and data fields via a `this` reference:
```
<p>{{./name}} or {{this/name}} or {{this.name}}</p> or {{this.[name with a space]}}
```
Any of the above would cause the name field in the current context to be used rather than a helper of the same name.

## Accessing current context

The `this` keyword can be used for accessing the current context. It's mainly useful when dealing with arrays or JSON objects where it will allow you to access the values of an array of objects. For example, if you have the following JSON column:

```js
{
  person: {
    firstname: "John",
    lastname: "smith"
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

```js
{
  authors: [
    {
      firstname: "John",
      lastname: "smith"
    },
    {
      firstname: "Joe",
      lastname: "Doe"
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


## Using Arrays

You can use the [Each Helper](#each-helper) to iterate over its data. You can also use the `{{array.INDEX}}` pattern if you want to access array data by index; where the index starts from zero and it is the position of the element that you want to access.

Template:
```
{{{arr.0.value}}}
```

When used in this context:
```js
{
  arr: [
      {value: "first element"},
      {value: "second element"},
      {value: "third element"}
  ]
}
```

Result:
```
first element
```
## Escaping Handlebars expressions

Handlebars content may be escaped using inline escapes. Inline escapes are created by prefixing a mustache block with `\\`

For example,
```
\\{{{escaped}}}
```
Would return
```
{{{escaped}}}
```

## Accessing keys with spaces and special characters

Handlebars allows you to access keys/variables which have spaces ` ` or special characters like `{}` in their names. You need to enclose those variables in square brackets.


```
{{[str with a space]}}
```

To access these variables in another block helper

```
{{#encode [str with a space]}}{{/encode}}
{{#escape [str with a space]}}{{/escape}}
```

## Subexpressions

Handlebars offers support for `subexpressions`, which allows you to invoke multiple helpers within a single mustache `{{}}`, and pass in the results of inner helper invocations as arguments to outer helpers. Subexpressions are delimited by parentheses.

```
{{#escape (encode arg1) arg2}}{{/escape}}
```

In this case, `encode` will get invoked with the string argument `arg1`, and whatever the encode function returns will get passed in as the first argument to escape (and `arg2` will get passed in as the second argument to escape).

## Helpers

A Handlebars helper call is a simple identifier, followed by zero or more parameters (separated by space). Each parameter is a Handlebars expression.

```
{{HELPER_NAME PARAM1 PARAM2 }}
```

### FormatDate helper

You can use the `formatDate` helper to take any `date` or `timestamp[tz]` value and format it according to the [Pre Format Guide](pre-format.md#syntax-for-dates-and-timestamps).

Syntax:
```
{{formatDate value format}}
```

Example:
```
{{formatDate '30-08-2018' 'YYYY'}} ==> '2018'
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

Block helpers make it possible to define custom iterators and other functionality that can invoke the passed block with a new context. These helpers are very similar to functions that we have in mustache.

```
{{#HELPER_NAME}}
 CONTENT
{{/HELPER_NAME}}
```

### If helper

You can use the `if` helper to conditionally render a block. If its argument returns `false`, `undefined`, `null`, `""`, `0`, or `[]`, Handlebars will not render the block. You can use this helper in combination with any of the [Boolean Helpers](#boolean-helpers) to do more complicated logical operations.

```
{{#if author}} {{firstName}} {{lastName}}</h1>{{/if}}
```
when used with an empty (`{}`) context, `author` will be `undefined`, resulting in an empty string:

When using a block expression, you can specify a template section to run if the expression returns a falsy value. The section, marked by `{{else}}` is called an "else section".

```
{{#if author}} {{firstName}} {{lastName}}{{else}} Unknown Author {{/if}}
```
The above method will return `Unknown Author`.

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
  people: [
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

Normally, Handlebars templates are evaluated against the context of the template.

```
template => {{lastName}}, {{firstName}}
contenxt => {firstName: "Alan", lastName: "Johnson"}
```
results in
```
Johnson, Alan
```

You can shift the context for a section of a template by using the built-in `with` block helper.

```
{{title}}
{{#with author}}
  By {{firstName}} {{lastName}}
{{/with}}
```

when used in this context:
```js
{
  title: "My first post!",
  author: {
    firstName: "Charles",
    lastName: "Jolley"
  }
}
```
results in
```
My first post! By Charles Jolley
```

`with` can also be used with block parameters to define known references in the current block. The example above can be converted to

```
{{title}}
{{#with author as |myAuthor|}}
  By {{myAuthor.firstName}} {{myAuthor.lastName}}</h2>
{{/with}}
```
This allows for complex templates to potentially provide clearer code than `../` depthed references allow for.

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

You can use the `encodeFacet` helper to compress a JSON object. The compressed string can be used for creating a URL path with facets. The string that you are passing as content MUST be JSON parsable. It will be ignored otherwise.


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

As you can see in this example I am escaping all the `"`s. This is because you are usually passing this value in a string in a JSON document. So all the `"`s must be escaped.

### JsonStringify helper

The `jsonStringify` helper will convert the supplied JSON object into a string representation of the JSON object. This helper behaves the same way as the `JSON.stringify` function in javascript. This can be used in conjunction with the `encodeFacet` helper for creating facet URL strings.

Template (newline and indentation added for readability and should be removed):
```
[caption](example.com/chaise/recordset/#1/S:T/*::facets::{{#encodeFacet}}
    {{#jsonStringify}}
      {{{col}}}
    {{/jsonStringify}}
{{/encodeFacet}}
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


### Findall helper

The `regexFindAll` helper will take the input regular expression and return all the matching substrings from the supplied string in an array. Will return `[]` otherwise.

A simple example where we try to match the file extension `jpg` or `png` with testString="jumpng-fox.jpg":
```
{{#each (regexFindAll testString "jpg|png")}}{{this}}\n{{/each}}
```

Result:
```
"png\njpg\n"
```

### Replace helper

The `replace` helper will take the input regular expression (first argument) and replace all matches in the supplied string with the supplied substring (second argument). This helper behaves the same way as the `replace` function for Strings in javascript. One example would be to replace all underscores with whitespace characters for table name display.

Template:
```
{{#replace "_" " "}}table_name_with_underscores{{/replace}}
```

Result:
```
table name with underscores
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

You can use the following helper to check for specific equality checks using the default `if` helper

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
