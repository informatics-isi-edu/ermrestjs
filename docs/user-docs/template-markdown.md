# Template And Markdown Guide

> **Disclaimer**:
> We are only supporting mustache features that are explained in this document. We are not responsible for other features that Mustache is supporting. Those features might or might not work in context of ERMrestJS.

For information on the annotation **tag:isrd.isi.edu,2016:column-display** specifics you can refer this [document](https://github.com/informatics-isi-edu/ermrest/blob/master/docs/user-doc/annotation.md#2016-column-display)


The annotation is represented as follows:

```javascript
{
   "CONTEXT_NAME" : {
       "markdown_pattern": "[{{{title}}}](https://dev.isrd.isi.edu/chaise/search?name={{{name}}})"
   }
}
```
The `markdown_pattern` parameter of the annotation accepts a markdown string which can contain templated columns for replacing them with their formatted values. It uses [Mustache](https://github.com/janl/mustache.js) for templating and returns a markdown string.


# Table of Contents

- [Mustache Templating](#mustache-templating)
  * [Variables](#variables)
    + [Usage](#usage)
    + [Raw Values](#raw-values)
    + [Foreign Key Values](#foreign-key-values)
      - [JSON](#json)
      - [Array](#array)
    + [Encoding variables for URL manipulation](#encoding-variables-for-url-manipulation)
    + [Escaping Content](#escaping-content)
  * [Examples](#examples)
    + [1. Normal replacement - "{{{name}}}"](#1-normal-replacement---name)
    + [2. Replacement with URL encoding - "{{#encode}}{{{name}}}{{/encode}}"](#2-replacement-with-url-encoding---encodenameencode)
    + [3. Replacement with escaping - "{{date}}"](#3-replacement-with-escaping---date)
    + [4. Replacement with null check, disabled escaping and url encoding - "{{#name}}...{{/name}}"](#4-replacement-with-null-check-disabled-escaping-and-url-encoding---namename)
    + [5. Replacement with negated-null check - "{{^name}}...{{/name}}"](#5-replacement-with-negated-null-check---namename)
    + [6. Null Handling](#6-null-handling)
      - [Limitations](#limitations)
    + [Using Pre-defined Attributes](#using-pre-defined-attributes)
      - [$moment Usage](#-moment-usage)
- [Handlebars Templating](#handlebars-templating)
- [Markdown Formatting](#markdown-formatting)
  * [Inline Vs. Block](#inline-vs-block)
  * [Attributes](#attributes)
  * [Examples](#examples-1)
    + [1. Link (Anchor)](#1-link-anchor-)
    + [2. Download Button](#2-download-button)
    + [3. Image](#3-image)
    + [4. Thumbnail Image With Aspect Ratio and Height](#4-thumbnail-image-with-aspect-ratio-and-height)
      - [Multiple Adjacent Images](#multiple-adjacent-images)
    + [5. Thumbnail With Link To Original Image And A caption](#5-thumbnail-with-link-to-original-image-and-a-caption)
    + [6. Iframe](#6-iframe)
      - [Iframe With a linkable caption](#iframe-with-a-linkable-caption)
      - [Iframe with a linkable caption positioned at its bottom](#iframe-with-a-linkable-caption-positioned-at-its-bottom)
      - [Iframe with a linkable caption positioned at its bottom with iframe class and style](#iframe-with-a-linkable-caption-positioned-at-its-bottom-with-iframe-class-and-style)
      - [Iframe with caption positioned at its bottom with caption class and style](#iframe-with-caption-positioned-at-its-bottom-with-caption-class-and-style)
      - [Iframe with iframe class, style, caption class and style](#iframe-with-iframe-class--style--caption-class-and-style)
    + [7. Dropdown download button](#7-dropdown-download-button)
    + [8. Vocabulary](#8-vocabulary)
    + [9. Video](#9-video)
    + [10. Subscript](#10-subscript)
    + [11. Superscript](#11-superscript)
    + [12. Span (Attach Attributes To Text)](#12-span-attach-attributes-to-text)

# Mustache Templating

The **Mustache** template format can be understood [here](https://github.com/janl/mustache.js#templates). Once templating is done, the returned string is passed to the markdown renderer. To learn about the markdown syntax please refer to the [markdown Formatting](#markdown-formatting) section.

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

### Foreign Key Values

You can access table's outbound foreign key data using `$fkeys` variable. To do so, you can use the constraint name of the foreign key. For instance having `["schema", "constraint"]` as schema-constraint pair for the foreign key, you can use `$fkeys.schema.constraint` to access its attributes. The following are available attributes for foreign keys:

1. `values`: An object containing values of the table that the foreign key refers to. Both formatted and unformatted column values will be available here. For instance `$fkeys.schema.const.values.col1` will give you the formatted value for the `col1` and `$fkeys.schema.const.values._col1` the unformatted.
2. `rowName`: Row-name of the foreign key.
3. `uri.detailed`: a uri to the foreign key in `detailed` context (record app).

```
# Create a link to Foreign key:

{{#$fkeys.schema.constraint}}
  [{{rowName}}]({{{uri.detailed}}})
{{/$fkeys.schema.constraint}}

# Access column values of a foreign key:

{{{$fkeys.schema.constraint.values.col1}}} - {{{$fkeys.schema.constraint.values.col2}}}
```
The current implementation of `$fkeys` has the following limitations:

- Using $fkeys you can only access data from tables that are one level away from the current table. This can cause problem when you are using $fkeys in your `row_markdown_pattern` annotation. Let's say the following is the ERD of your database.

  ![$fkeys example](https://dev.isrd.isi.edu/~ashafaei/wiki-images/fkeys_1.png)

  And you have defined the `row_markdown_pattern` of table A as `{{$fkeys.schema.fk1.values.term}}`. If you navigate to record app for any records of A, the rowname will be displayed as you expect it. But if you go to the table C, the rowname of A won't be as you expected since we don't have access to the table B's data.
   Therefore it's advised to use `$fkeys` only for the `column-display` annotation (or any other annotation that is controlling data for the same table).


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

```sh

- This is some value in COLUMN **{{{name}}}**

# MUSTACHE OUTPUT: Mustache formatted String - 'This is some value in COLUMN **BiomassProdBatch for Virus=7782 Target=5HT1B site=USC**'
# MARKDOWN OUTPUT: <p>This is some value in COLUMN <strong>BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</strong></p>
```
> <p>This is some value in COLUMN <strong>BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</strong></p>

### 2. Replacement with URL encoding - "{{#encode}}{{{name}}}{{/encode}}"

```sh

[{{name}}](https://dev.isrd.isi.edu/chaise/search?name={{#encode}}{{name}}{{/encode}})

# MUSTACHE OUTPUT: [BiomassProdBatch for Virus&#x3D;7782 Target&#x3D;5HT1B site&#x3D;USC](https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC)
# MARKDOWN OUTPUT: <p><a href="https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC">BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</a></p>
```
> <p><a href="https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC">BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</a></p>

### 3. Replacement with escaping - "{{date}}"

```sh
# name="BiomassProdBatch for Virus=7782 Target=5HT1B site=USC and date=2013-02-11 11:27:20"

Research **{{name}}** was conducted on {{{date}}}

# MUSTACHE OUTPUT: Research **BiomassProdBatch for Virus&#x3D;7782 Target&#x3D;5HT1B site&#x3D;USC** was conducted on 08/25/2016
# MARKDOWN OUTPUT: <p>Research <strong>BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</strong> was conducted on 08/25/2016</p>
```
> <p>Research <strong>BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</strong> was conducted on 08/25/2016</p>

### 4. Replacement with null check, disabled escaping and url encoding - "{{#name}}...{{/name}}"

With null value for title
```sh
#title = null;

Research on date {{{date}}} : {{#title}}[{{{title}}}](https://dev.isrd.isi.edu/chaise/search?name={{#encode}}{{{name}}}{{/encode}}){{/title}}

# MUSTACHE OUTPUT: "Research on date 08/25/2016 : "
# MARKDOWN OUTPUT: "<p>Research on date 08/25/2016 :</p>\n"
```
> <p>Research on date 08/25/2016 :</p>

With non-null value for title and null value for name
```sh
# title = "BiomassProdBatch for Virus=7782 Target=5HT1B site=USC"

Research on date {{{date}}} : {{#title}}[{{{title}}}](https://dev.isrd.isi.edu/chaise/search?name={{#encode}}{{{name}}}{{/encode}}){{/title}}

# MUSTACHE OUTPUT: Research on date 08/25/2016 : [BiomassProdBatch for Virus=7782 Target=5HT1B site=USC](https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC)
# MARKDOWN OUTPUT: <p>Research on date 08/25/2016 : <a href="https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC">BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</a></p>
```
> <p>Research on date 08/25/2016 : <a href="https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC">BiomassProdBatch for Virus=7782 Target=5HT1B site=USC</a></p>

### 5. Replacement with negated-null check - "{{^name}}...{{/name}}"

In cases where you need to check whether a value is null, then use this string, you can use this syntax.
```sh
#title = null;

Research on date {{{date}}} : {{^title}}[This is some title](https://dev.isrd.isi.edu/chaise/search?name={{#encode}}{{{name}}}{{/encode}}){{/title}}

# MUSTACHE OUTPUT: "Research on date 08/25/2016 : [This is some title](https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC)"
# MARKDOWN OUTPUT: "<p>Research on date 08/25/2016 : <a href="https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC">This is some title</a></p>"
```
> <p>Research on date 08/25/2016 : <a href="https://dev.isrd.isi.edu/chaise/search?name=BiomassProdBatch%20for%20Virus%3D7782%20Target%3D5HT1B%20site%3DUSC">This is some title</a></p>

### 6. Null Handling

If the value of any of the columns which are being used in the `markdown_pattern` are either null or empty, then the pattern will fall back on the `show_nulls` display annotation to return respective value. For example, if title property in the json object is not defined or null then following template `[{{{title}}}]({{{url}}})` will resolve as null and use the `show_nulls` annotation to determine what should be done.

To make sure that you handle above case, wrap properties which can be null inside null handling blocks as mentioned in last 2 samples.

```js
 [{{#title}}{{{title}}}{{/title}}{{^title}}No title defined{{/title}}]({{{url}}})
```
#### Limitations

- If you're using [Raw values](#raw-values) and have logic to check for boolean false values then please don't try using it. Mustache block for null handling evaluates to false if the value is false, empty, null or zero. This will also not work for raw json values where you plan to check whether an array is null or not. If the array is not null the block converts to an iterator and will fire internal code n times.
- If in any part of the mustache template you are using the block syntax (`{{# COL }}`), we will not apply this null handling logic.


### Using Pre-defined Attributes

Ermrestjs now allows users to access some pre-defined variables in the template environment for ease. You need to make sure that you don't use these variables as column-names in your tables to avoid them being overridden in the environment.  

One of those variable is `$moment`.

#### $moment Usage

`$moment` is a datetime object which will give you access to date and time when the app was loaded. For instance if the app was loaded at Thu Oct 19 2017 16:04:46 GMT-0700 (PDT), it will contain following properties

* date: 19
* day: 4
* month: 10
* year: 2017
* dateString: Thu Oct 19 2017
* hours: 16
* minutes: 4
* seconds: 14
* milliseconds: 873
* timeString: 16:04:46 GMT-0700 (PDT)
* ISOString: 2017-10-19T23:04:46.873Z
* GTMString: Thu, 19 Oct 2017 23:04:46 GMT
* UTCString: Thu, 19 Oct 2017 23:04:46 GMT
* LocaleDateString: 10/19/2017
* LocaleTimeString: 4:04:46 PM
* LocalString: 10/19/2017, 4:04:46 PM

The `$moment` object can be referred directly in the Mustache environment

**Examples**
```js
Todays date is {{$moment.month}}/{{$moment.date}}/{{$moment.year}}
```
```js
Current time is {{$moment.hours}}:{{$moment.minutes}}:{{$moment.seconds}}:{{$moment.milliseconds}}
```
```js
UTC datetime is {{$moment.UTCString}}
```
```js
Locale datetime is {{$moment.LocaleString}}
```
```js
ISO datetime is {{$moment.ISOString}}
```

# Handlebars Templating

The **Handlebars** template format can be understood [here](handlebars.md). Once templating is done, the returned string is passed to the markdown renderer. To learn about the markdown syntax please refer to the [markdown Formatting](#markdown-formatting) section.


# Markdown Formatting

The renderer that we use ([markdown-it](https://github.com/markdown-it/markdown-it)), supports the default markdown syntax with some extra features. Please refer to [markdown reference sheet](http://commonmark.org/help/) for markdown syntax.


## Inline Vs. Block

In HTML we have block and inline elements. Block elements usually add a newline and extra spaces around the content, while inline elements will only take up as much width as is needed to display the content. Paragraphs `<p>`, headers `<h#>`, and division `<div>` are some of the common block elements. Span `<span>`, images `<img>`, and anchors `<a>` are examples for inline blocks.

This concept exists in markdown-it too. If we parse the content as a block, if the given markdown value does not produce a proper block element, it will be wrapped in a `<p>` tag.  While rendering it inline, will not add the `<p>` tag. Also newline (`\n`) is not acceptable in values of inline elements.

```html
[caption](http://example.com)

#inline output
<a href="http://example.com">caption</a>

#block output
<p>
  <a href="http://example.com">caption</a>
</p>
```

Therefore sometimes we prefer to render the value as inline. markdown-it also has different set of rules for inline and block. All the inline tags are acceptable while rendering a block, but not the other way around. For example you cannot have a header in inline. So you need to be careful while using the blocks. The following are different places that we are rendering inline. Other parts of code accept block elements.

- row-name logic. More specifcally the logic for processing `row_markdown_pattern`.
- While processing `markdown_name` (used on facets, columns, tables, and schemas).


## Attributes

You can attach attributes to any element in your markdown. Generally you can attach the attributes in `{}` to your element. For example if you want to add attributes to a link, you can use the `[caption](link){attributes}` template. The acceptable format for attributes:

- Any attribute that starts with a `.` will be treated as class name.
```html
[class example](http://example.com){.test}

#OUTPUT
<p>
  <a href="http://example.com" class="test">class example</a>
</p>
```
> <p><a href="http://example.com" class="test">class example</a></p>

- If you want to define multiple attributes just seperate them with space.

```html
**Multiple attributes Example**{.test .cls-2 val=1 disabled}

#OUTPUT
<p>
  <strong class="test cls-2" val="1" disabled="">Multiple attributes Example</strong>
</p>
```
> <p><strong class="test cls-2" val="1" disabled="">Multiple attributes Example</strong></p>

 - Attach attributes to markdown table

```html
|header|\n|-|\n|text|{.class-name}

#OUTPUT
<table class="class-name">
  <thead>
    <tr>
      <th>heading</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>text</td>
    </tr>
  </tbody>
</table>
```

> <table class="class-name"><thead><tr><th>heading</th></tr></thead><tbody><tr><td>text</td></tr></tbody></table>


## Examples

### 1. Link (Anchor)

This is part of commonMark specification. Links are [inline](#inline-vs.-block) elements.
```html
[ChaiseLink](https://dev.isrd.isi.edu/chaise/search)

#OUTPUT:
<p>
   <a href="https://dev.isrd.isi.edu/chaise/search">ChaiseLink</a>
</p>
```


> <p><a href="https://dev.isrd.isi.edu/chaise/search">ChaiseLink</a></p>

You can attach attributes to the link.
```html
[ChaiseLink](https://dev.isrd.isi.edu/chaise/search){target=_blank}

# OUTPUT:
<p>
	<a href="https://dev.isrd.isi.edu/chaise/search" target="_blank">ChaiseLink</a>
</p>
```
> <p><a href="https://dev.isrd.isi.edu/chaise/search" target="_blank">ChaiseLink</a></p>

### 2. Download Button

Download button is a link with some predefined attributes. You can use these attributes to ensure consistent display for the download buttons.`download` and `target="_blank"` which will allow it to open in a new tab with classes `.btn` and `.btn-primary` for CSS styling.
```html
[Jquery Download](https://code.jquery.com/jquery-3.1.0.js){download .btn .btn-primary target=_blank}

# OUTPUT:
<p>
	<a href="https://code.jquery.com/jquery-3.1.0.js" download="" class="btn btn-primary" target="_blank">Jquery Download</a>
</p>
```
> <p><a href="https://code.jquery.com/jquery-3.1.0.js" download="" class="btn btn-primary" target="_blank">Jquery Download</a></p>

**NOTE:** please stick to the above format only to generate a download link.

### 3. Image

By adding `!` at the begining of a link definition, it will display the image. Images are [inline](#inline-vs.-block) elements.
```html
![Image](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg)

# OUTPUT:
<p>
	<img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image">
</p>
```
> <p><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image"></p>


You can define the `width` and `height` attributes for an image.

```html
![ImageWithSize](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){width=800 height=300}

# OUTPUT:
<p>
	<img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="ImageWithSize" width="800" height="300">
</p>
```

> <p><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="ImageWithSize" width="800" height="300"></p>


You can also add extra styles to the image to ensure it is displayed correctly.

```html
![ImageWithSize](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){width=500 style="max-height:300px;max-width:800px;"}

# OUTPUT:
<p>
	<img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="ImageWithSize" width="500" style="max-height:300px;max-width:800px;">
</p>
```

> <p><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="ImageWithSize" width="500" style="max-height:300px;max-width:800px;"></p>

**NOTE**: You can add any style content to your markdown. For more info on styling you can refer this [tutorial](http://www.w3schools.com/html/html_css.asp)

### 4. Thumbnail Image With Aspect Ratio and Height

With attributes height=400 and target=_blank is to open it in new tab
```html
# [![alt text](thumbnail-URL){height=400}](destination-URL){target=_blank}

[![Image](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){height=400}](https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg){target=_blank}

# OUTPUT:
<p>
	<a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank">
		<img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image" height="400">
	</a>
</p>
```

> <p><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank"><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image" height="400"></a></p>

#### Multiple Adjacent Images

With attributes height=200 and target=_blank is to open it in new tab
```html
# [![alt text](thumbnail-URL){height=200}](destination-URL){target=_blank}

[![Image](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){height=200}](https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg){target=_blank} [![Image](https://c.fastcompany.net/multisite_files/fastcompany/imagecache/1280/poster/2015/06/3046722-poster-p-1-the-psychology-of-living-in-skyscrapers.jpg){height=200}](https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg){target=_blank}

# OUTPUT:
<p>
	<a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank">
		<img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image" height="200">
	</a>
	<a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank">
		<img src="https://c.fastcompany.net/multisite_files/fastcompany/imagecache/1280/poster/2015/06/3046722-poster-p-1-the-psychology-of-living-in-skyscrapers.jpg" alt="Image" height="200">
	</a>
</p>
```

> <p><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank"><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image" height="200"></a> <a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank"><img src="https://c.fastcompany.net/multisite_files/fastcompany/imagecache/1280/poster/2015/06/3046722-poster-p-1-the-psychology-of-living-in-skyscrapers.jpg" alt="Image" height="200"></a></p>

### 5. Thumbnail With Link To Original Image And A caption

This is not part of commonMark specification and it will result in a [block](#inline-vs-block). You have to follow the syntax completely (notice the newline in the closing tag).

With attributes width=500, height=400 and a linkable caption to open it in new tab(All of them are optional)
```html
# :::image [caption](thumbnail-URL){width=500 height=400 link="destination-URL"} \n:::

:::image [Skyscrapers](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){width=500 height=400 link="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg"} \n:::

# OUTPUT:
<figure class="embed-block" style="display:inline-block;">
	<a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank">
		<figcaption class="embed-caption">Skyscrapers</figcaption>
		<img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" height="200"  />
	</a>
</figure>

```

> <figure class="embed-block" style="display:inline-block;"><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank"><figcaption class="embed-caption">Skyscrapers</figcaption><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" height="200"  /></a></figure>

### 6. Iframe

This is not part of commonMark specification and it will result in a [block](#inline-vs-block). You have to follow the syntax completely (notice the newline in the closing tag).

Without any attributes (eg: height and width)
```html
::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search) \n:::

# OUTPUT:
<figure class="embed-block">
	<figcaption class="embed-caption">CAPTION</figcaption>
	<iframe src="https://dev.isrd.isi.edu/chaise/search"></iframe>
</figure>
```

With attributes width=800, height=300
```html
::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){width=800 height=300} \n:::

# OUTPUT:
<figure class="embed-block">
	<figcaption class="embed-caption">CAPTION</figcaption>
	<iframe src="https://dev.isrd.isi.edu/chaise/search" width="800" height="300" ></iframe>
</figure>
```

If you provide an invalid link then instead of an iframe you will just get the internal markdown rendered
```html
:::iframe *Invalid [CAPTION](https://dev.isrd.isi.edu/chaise/search) \n:::

# OUTPUT:
<p>
	<em>Invalid</em>
	<a href="https://dev.isrd.isi.edu/chaise/search">CAPTION</a>
</p>
```
> <p><em>Invalid</em> <a href="https://dev.isrd.isi.edu/chaise/search">CAPTION</a></p>

#### Iframe With a linkable caption

```html
::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){width="800" height="300" link="https://dev.isrd.isi.edu/chaise/search"} \n:::

# OUTPUT:
<figure class="embed-block">
	<figcaption class="embed-caption">
		<a href="https://dev.isrd.isi.edu/chaise/search" target="_blank">CAPTION</a>
	</figcaption>
	<iframe src="https://dev.isrd.isi.edu/chaise/search" width="800" height="300"></iframe>
</figure>
```

#### Iframe with a linkable caption positioned at its bottom
```html
::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){width="800" height="300" link="https://dev.isrd.isi.edu/chaise/search" pos="bottom" } \n:::

# OUTPUT:
<figure class="embed-block">
	<iframe src="https://dev.isrd.isi.edu/chaise/search" width="800" height="300"></iframe>
        <figcaption class="embed-caption">
		<a href="https://dev.isrd.isi.edu/chaise/search" target="_blank">CAPTION</a>
	</figcaption>
</figure>
```

#### Iframe with a linkable caption positioned at its bottom with iframe class and style

To style the whole iframe enclosing block you can either specify classes using `iframe-class` or CSS style using `iframe-style`.

```html
::: iframe [CAPTION](https://example.com){pos="bottom" iframe-class="iclass" iframe-style="border:1px solid;"  link="https://example.com} \n:::

# OUTPUT:
<figure class="embed-block iclass">
	<figcaption class="embed-caption">
		<a href="https://example.com" target="_blank">CAPTION</a>
	</figcaption>
	<iframe src="https://example.com" width="800" height="300"></iframe>
</figure>
```

#### Iframe with caption positioned at its bottom with caption class and style

To style the caption of an iframe you can either specify classes using `caption-class` or CSS style using `caption-style`.

```html
::: iframe [CAPTION](https://example.com){pos="bottom" caption-class="cclass" caption-style="font-weight:500;"  link="https://example.com} \n:::

# OUTPUT:
<figure class="embed-block">
	<figcaption class="embed-caption cclass" style="font-weight:500;">CAPTION</a></figcaption>
	<iframe src="https://example.com" width="800" height="300"></iframe>
</figure>
```

#### Iframe with iframe class, style, caption class and style

```html
::: iframe [CAPTION](https://example.com){pos="bottom" iframe-class="iclass" iframe-style="border:1px solid;" caption-class="cclass" caption-style="font-weight:500;"  link="https://example.com} \n:::

# OUTPUT:
<figure class="embed-block iclass" style="border:1px solid;">
	<figcaption class="embed-caption cclass" style="font-weight:500;">CAPTION</a></figcaption>
	<iframe src="https://example.com" width="800" height="300"></iframe>
</figure>
```

### 7. Dropdown download button

This is not part of commonMark specification and it will result in a [block](#inline-vs-block). You have to follow the syntax completely (notice the newline in the closing tag).

```sh
# :::dropdown CPATION [LINKCAPTION1](URL1){download} [LINKCAPTION2](URL2){download}
::: dropdown DROPDOWNCAPTION [CAPTION1](https://dev.isrd.isi.edu/chaise/search){download}                     [CAPTION2](https://dev.isrd.isi.edu/chaise/search){download}  \n:::
# OUTPUT: <div class="btn-group markdown-dropdown"><button type="button"  class="btn btn-primary ">DROPDOWNCAPTION</button><button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"  class="btn btn-primary dropdown-toggle "><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button><ul class="dropdown-menu"><li><a href="https://dev.isrd.isi.edu/chaise/search" download="" >CAPTION1</a></li><li><a href="https://dev.isrd.isi.edu/chaise/search" download="" >CAPTION2</a></li></ul></div>
```

The button has an appearance similar to the [Bootstrap dropdown button](http://getbootstrap.com/components/#btn-dropdowns-split)

You can test the `markdown_pattern` string [here](https://tonicdev.com/chiragsanghvi/57b4b5f94c7bbd13004b43f6). Just scroll down and change the `markdown_pattern` string and `obj` object according to your requirement.

### 8. Vocabulary

To show text as vocabulary, you can use the predefined `vocab` class. The following markdown pattern turns a bock of text, to a gray bold bubble with color blue.

```sh
**some bold term**{.vocab}
# OUTPUT: <strong class="vocab">some bold term</strong>
```

### 9. Video

This is not part of commonMark specification and it will result in a [block](#inline-vs-block). You have to follow the syntax completely (notice the newline in the closing tag).

```
markdown syntax: '::: video [<caption>](<source>)[{attribute list}] \n:::'
```
**There must be a space before `\n:::`**.

- **caption**: The caption provides a short description of the video
- **source**: The address to the location of the video
- **attribute list:** The attributes supported will be (height, width, preload, loop, muted, autoload, pos)
    - height: Sets the height of the video player
    - width: Sets the width of the video player
    - preload: Specifies if and how the author thinks the video should be loaded when the page loads
    - loop: Specifies that the video will start over again, every time it is finished
    - muted: Specifies that the audio output of the video should be muted
    - pos: Specifies where the caption of video should appear (`top` or `bottom`)

**Examples**
- Without any attributes
```html
::: video [This is sample video](http://techslides.com/demos/sample-videos/small.mp4)\n:::

# OUTPUT:
<figure>
     <figcaption>This is sample video</figcaption>
     <video controls ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4">
     </video>
</figure>
```

- With attributes width=400, height=300
```html
::: video [This is sample video](http://techslides.com/demos/sample-videos/small.mp4){width=400 height 300} \n:::

# OUTPUT:
<figure>
    <figcaption>This is sample video</figcaption>
    <video controls width=400 height=300 ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4">
    </video>
</figure>"
```

- With boolean attributes muted, autoload, loop, preload
```html
::: video [This is sample video](http://techslides.com/demos/sample-videos/small.mp4){autoload muted loop preload} \n:::

# OUTPUT:
<figure>
    <figcaption>This is sample video</figcaption>
    <video controls autoload muted loop preload ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4">
    </video>
</figure>
```
- To put the video caption at bottom or top, use the `pos` attribute (bootom or top)
```html

::: video [My Caption](http://techslides.com/demos/sample-videos/small.mp4){pos=bottom loop preload} \n:::
# Output:
<figure>
    <video controls loop preload><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4">
    </video>
    <figcaption>My Caption</figcaption>
</figure>
```
- With invalid attributes
Invalid attributes provided to the attribute list will be simple ignored.
```html
::: video [This is sample video](http://techslides.com/demos/sample-videos/small.mp4){preplay mute} \n:::
`preplay and mute being invalid attribute`

# OUTPUT:
<figure>
    <figcaption>This is sample video</figcaption>
    <video controls ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4">
    </video>
</figure>
```

- Valid attributes after a set of invalid attributes will be used while templating
```html
::: video [This is sample video](http://techslides.com/demos/sample-videos/small.mp4){muted=3 height=300} \n:::
`muted beign a boolean swtich for video tag, muted=3 makes it an invalid attribute but height is treated as a valid attribute here`

# OUTPUT:
<figure>
    <figcaption>This is sample video</figcaption>
    <video controls height=300 ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4">
    </video>
</figure>
```

### 10. Subscript

This is not part of commonMark specification and it will result in an [inline](#inline-vs-block) element.

```html
~This~ should be subscript.

# OUTPUT:
<p>
	<sub>This</sub> should be subscript.
</p>
```
> <p><sub>This</sub> should be subscript.</p>

With attributes

```html

~This~{.class-name} should be subscript.

# OUTPUT:
<p>
	<sub class="class-name">This</sub> should be subscript.
</p>
```
> <p> <sub class="class-name">This</sub> should be subscript.</p>


### 11. Superscript

This is not part of commonMark specification and it will result in an [inline](#inline-vs-block) element.

Without attributes

```html
~This~ should be superscript.

# OUTPUT:
<p>
	<sup>This</sup> should be superscript.
</p>
```
> <p><sup>This</sup> should be superscript.</p>


With attributes

```html
^This^{.class-name} should be superscript.

# OUTPUT:
<p>
	<sup class="class-name">This</sup> should be superscript.
</p>
```
> <p> <sup class="class-name">This</sup> should be superscript.</p>

### 12. Span (Attach Attributes To Text)

This is not part of commonMark specification and it will result in an [inline](#inline-vs-block) element.  Openning tag is `:span:` and closing is `:/span:`.

```html
This :span:text:/span:{.cl-name style="color:red"} has new color.

# OUTPUT:
<p>
	This <span class="cl-name" style="color:red">text</span> has new color.
</p>
```
>This <span class="cl-name" style="color:red">text</span> has new color.</p>

You can also have empty span. You can use this to display glyphicons.

```html
:span::/span:{.glyphicon .glyphicon-download-alt}

# OUTPUT:
<p>
	<span class="glyphicon glyphicon-download-alt"></span>
</p>
```
> <p><span class="glyphicon glyphicon-download-alt"></span></p>
