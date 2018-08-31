# Handlebars

[Handlebars](http://handlebarsjs.com/) is almost similar to Mustache with some additional benefits. There are some things that you can't do in Mustache that Handlebars allows us to do easily using `helpers`.

The syntax of blocks in Mustache changes a lot in Handlebars. For instance, something in Mustache that allows to do a null check would be

```js
// Mustache

{{#name}}Hello {{name}}{{/name}}{{^name}}No name available{{/name}}

// name="John" => Hello John
// name=null   => No name available
```
With handlebars you need to pass the variables to an `if` helper to do the check.

```
{{#if name}}Hello {{name}}{{else}}No name available{{/if}}
```
All the other `encode`, `decode` helpers also change accordingly.


## Notable differences between Mustache and Handlebars

* [Handlebar Paths](#handlebars-paths)
* [Block Helpers](#block-helpers)
   * [If](#if-helper)
   * [Unless](#unless-helper)
   * [Each](#each-helper)
   * [With](#with-helper)
   * [Encode](#encode-helper)
   * [Escape](#escape-helper)
   * [Format Date](#format-date-helper)
* [Accessing keys with spaces and special characters](#accessing-keys-with-spaces-and-special-characters)
* [Subexpressions](#subexpressions)
* [Additional Helpers for Comparison](#additional-helpers-for-comparision)
  * [Comparison](#comparison-helper)
  * [Ifcond](#ifcond-helper)


## Handlebars Paths

Handlebars supports simple paths, just like Mustache.

```
<p>{{name}}</p>
```

Handlebars also supports nested paths, making it possible to look up properties nested below the current context.


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

**NOTE**: Handlebars also allows for name conflict resolution between helpers and data fields via a this reference:
```
<p>{{./name}} or {{this/name}} or {{this.name}}</p> or {{this.[name with a space]}}
```
Any of the above would cause the name field on the current context to be used rather than a helper of the same name.

## Block Helpers

### If helper

You can use the `if` helper to conditionally render a block. If its argument returns `false`, `undefined`, `null`, `""`, `0`, or `[]`, Handlebars will not render the block.

```
{{#if author}} {{firstName}} {{lastName}}</h1>{{/if}}
```
when used with an empty (`{}`) context, `author` will be `undefined`, resulting in empty string:

When using a block expression, you can specify a template section to run if the expression returns a falsy value. The section, marked by `{{else}}` is called an "else section".

```
{{#if author}} {{firstName}} {{lastName}}{{else}} Unknown Author {{/if}}
```
Above method will return `Unknown Author`.

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

Nested `each` blocks may access the iteration variables via depth based paths. To access the parent index, for example, `{{@../index}}` can be used.

The each helper also supports block parameters, allowing for named references anywhere in the block.

```
{{#each array as |value key|}}
  {{#each child as |childValue childKey|}}
    {{key}} - {{childKey}}. {{childValue}}
  {{/each}}
{{/each}}
```

Will create a `key` and `value` variable that children may access without the need for depthed variable references. In the example above, `{{key}}` is identical to `{{@../key}}` but in many cases is more readable.

### With helper

Normally, Handlebars templates are evaluated against the context to the template.

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

when used with this context:
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
Which allows for complex templates to potentially provide clearer code than `../` depthed references allow for.

You can optionally provide an `{{else}}` section which will display only when the passed value is empty.

```
{{#with author}}
	{{name}}
{{else}}
	No content
{{/with}}
```

### Encode helper

You can use the `encode` helper to get strings in URL encoded format. It accepts more than 1 strings which need to be encoded
```
age={{#encode age}}{{/encode}}
```
for context `age=10` will result in `age%3D10`

In addition you can provide multiple inputs too which're concatenated and then encoded. For example,
```
{{#encode key '=' value}}
```
for context `key="name" and value="John"` will result in `name%3DJohn`

### Escape helper

You can use the `escape` helper to specifically escape values; for example hyphens "-" etc., you can use the escape block in this way. It accepts more than 1 strings which that needs to be escaped
```
name={{#escape key}}{{/escape}}
```
for context `key="**somevalue ] which is ! special"` will result in `name=\*\*somevalue \] which is \! special`

In addition you can provide multiple inputs too which're concatenated and then encoded. For example,
```
{{#escape key '-' value}}{{/escape}}
```
for context `key="**somevalue ] which is ! special" and value="John"` will result in `\*\*somevalue \] which is \! special\-John`

### Format Date helper

You can use the `formatDate` helper to take any `date` or `timestamp[tz]` value and format it according to the [Pre Format Guide](https://github.com/informatics-isi-edu/ermrestjs/wiki/Pre-Format-Annotation#syntax-for-dates-and-timestamptzs).

Syntax:
```
{{formatDate value format}}
```

Example:
```
{{formatDate '30-08-2018' 'YYYY'}} ==> '2018'
```


## Accessing keys with spaces and special characters

Handlebars allows you to access keys/variables which have spaces ` ` or special characters like `{}` in their names. You needs to enclose those variables in square brackets.


```
{{[str with a space]}}
```

To access these variables in another block helper

```
{{#encode [str with a space]}}{{/ecnode}}
{{#escape [str with a space]}}{{/escape}}
```

## Subexpressions:

Handlebars offers support for `subexpressions`, which allows you to invoke multiple helpers within a single mustache `{{}}`, and pass in the results of inner helper invocations as arguments to outer helpers. Subexpressions are delimited by parentheses.

```
{{#escape (encode arg1) arg2}}{{/escape}}
```

In this case, `encode` will get invoked with the string argument `arg1`, and whatever the encode function returns will get passed in as the first argument to escape (and `arg2` will get passed in as the second argument to escape).

## Additional Helpers

### Comparison helper

You can use following helper to check for specific equality checks using the default `if` helper

```
{{#if (eq var1 var2)}}
	.. content
{{/if}}
```

```
{{#if (ne var1 var2)}}
	.. content
{{/if}}
```

```
{{#if (lt var1 var2)}}
	.. content
{{/if}}
```

```
{{#if (gt var1 var2)}}
	.. content
{{/if}}
```

```
{{#if (lte var1 var2)}}
	.. content
{{/if}}
```

```
{{#if (gte var1 var2)}}
  .. content
{{/if}}
```

```
{{#if (and var1 var2)}}
  .. content
{{/if}}
```

```
{{#if (and var1 var2)}}
  .. content
{{/if}}
```

### IfCond Helper

It accepts 2 arguments. First one and last one are the values and second one is the comparison operator..

```
{{#ifCond value "===" value2}}
    Values are equal!
{{else}}
    Values are different!
{{/ifCond}}
```
