# Pseudo-Column Display

By using `display` attribute in the [source-syntax](pseudo-columns.md), you can customize the presented value to the users. The following is the accepted syntax:

```
{
    "source": <any acceptable source>,
    "display": {
        "markdown_pattern": <markdown pattern value>,
        "template_engine": <"handlebars" | "mustache">
    }
}
```

In the `markdown_pattern` you can access the current pseudo-column data with `$self` namespace. The structure of the available data is going to be different based on pseudo-column type. In the following, we summarized the structure of object that you have access to.

<!-- TODO If you want to just look at some examples, go to the [examples](#examples) section. -->


- Inline table: When entity-mode source without any aggregate functions is defined on the `visible-foreign-keys` or in `visible-columns` for `detailed` context.

```javascript
{
  "$self": [
    {
      "values": {
        "col": "", // formatted
        "_col": "", // raw
        ... // other columns
        "$fkey_schema_fk1": {
          "values": {
            "fk_col": "", // formatted
            "_fk_col": "", // raw
            ...
          },
          "rowName": "",
          "uri": {"detailed": ""}
        },
        ... // other outbound foreign keys
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
Example: `{{#each $self}}[{{{this.rowName}}}]({{{this.uri.detailed}}}){{/each}}`


- Entity `array` or `array_d` aggregate

```javascript
{
  "$self": [
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
Example: `{{#each $self}}[{{{this.rowName}}}]({{{this.uri.detailed}}}){{/each}}`


- All-outbound entity:

```javascript
{
  "$self": {
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
Example: `[{{{$self.rowName}}}]({{{$self.uri.detailed}}})`


- Scalar `array` or `array_d` aggregate:

```javascript
{
  "$self":  "1,234, 1,235", // formatted
  "$_self":  [1234, 1235] // raw
}
```
Example: `values: {{{$self}}}`

- min/max/cnt_d aggregate or any scalar column:

```javascript
{
  "$self":  "1,234", // formatted
  "$_self":  1234 // raw
}
```
Example: `{{{$self}}} cm`

<!-- TODO
## Examples
-->
