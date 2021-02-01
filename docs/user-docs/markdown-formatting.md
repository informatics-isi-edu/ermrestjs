# Markdown Formatting

The renderer that we use ([markdown-it](https://github.com/markdown-it/markdown-it)), supports the default markdown syntax with some extra features. Please refer to [markdown reference sheet](http://commonmark.org/help/) for markdown syntax.

## Table of Contents
  * [Inline Vs. Block](#inline-vs-block)
  * [Attributes](#attributes)
    + [Special Classes](#special-classes)
  * [Examples](#examples)
    + [1. Link (Anchor)](#1-link-anchor)
    + [2. Download Button](#2-download-button)
    + [3. Image](#3-image)
    + [4. Thumbnail Image With Aspect Ratio and Height](#4-thumbnail-image-with-aspect-ratio-and-height)
      - [Multiple Adjacent Images](#multiple-adjacent-images)
    + [5. Thumbnail With Link To Original Image And A caption](#5-thumbnail-with-link-to-original-image-and-a-caption)
    + [6. Iframe](#6-iframe)
      - [a. Styling the Iframe](#a-styling-the-iframe)
        - [a.1. Without any attributes](#a1-without-any-attributes)
        - [a.2. With height and width defined](#a2-with-height-and-width-defined)
        - [a.3. Invalid link](#a3-invalid-link)
        - [a.4. Iframe without scrolling](#a4-iframe-without-scrolling)
        - [a.5. Class and style attached to the iframe element](#a5-class-and-style-attached-to-the-iframe-element)
        - [a.6. Iframe with figure class and style](#a6-iframe-with-figure-class-and-style)
        - [a.7. Iframe with caption styles and figure styles](#a7-iframe-with-caption-styles-and-figure-styles)
      - [b. Captions](#b-captions)
        - [b.1. Linkable caption](#b1-linkable-caption)
        - [b.2. Caption positioned at the bottom](#b2-caption-positioned-at-the-bottom)
        - [b.3. Caption class and style](#b3-caption-class-and-style)
      - [c. Responsiveness and Other Cases](#c-responsiveness-and-other-cases)
        - [c.1. Stretch to height and width of parent container](#c1-stretch-to-height-and-width-of-parent-container)
        - [c.2. Fill container with min-width](#c2-fill-container-with-min-width)
        - [c.3. Fill container with min-width and min-height and max-height](#c3-fill-container-with-min-width-and-min-height-and-max-height)
        - [c.4. Iframe with set height and responsive width](#c4-iframe-with-set-height-and-responsive-width)
    + [7. Dropdown download button](#7-dropdown-download-button)
    + [8. Vocabulary](#8-vocabulary)
    + [9. Youtube Video](#9-youtube-video)
    + [10. Video](#10-video)
    + [11. Subscript](#11-subscript)
    + [12. Superscript](#12-superscript)
    + [13. Span (Attach Attributes To Text)](#13-span-attach-attributes-to-text)
    + [14. RID link](#14-rid-link)



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


### Special Classes

The following is the list of special class names that you can use:

- `.chaise-btn`: This class is used to represent buttons. You should use it in conjunction with any of the following classes:
    - `.chaise-btn-primary`
    - `.chaise-btn-secondary`
    - `.chaise-btn-tertiary`
- `.download-alt`: Use this class to represent a download button. `.download` is the old and alternative class for it.
- `.asset-permission`: If used on a link element, chaise will validate whether the user can download the asset before a download is attempted.
- `.external-link`: By adding this to links, chaise shows a notification to the user when they are being navigated away from chaise for external links and assets hosted elsewhere.
- `.external-link-no-icon`: By default we're going to add a icon to any external links. If you don't want it in a particular link, you can use this class.
- `.vocab`: Use this to represent a vocabulary.
- `.chaise-autofill`: Use this to set the height and width to fill the parent container based on the user's browser.


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
> <p><a href="https://dev.isrd.isi.edu/chaise/search" target="\_blank">ChaiseLink</a></p>

### 2. Download Button

Download button is a link with some predefined attributes. You can use these attributes to ensure consistent display for the download buttons:
  - `download` and `target="_blank"` will allow it to open in a new tab and trigger the browser's default download behavior.
  - `.download-alt` will change the link to look like the following:
![download-alt btn](https://raw.githubusercontent.com/informatics-isi-edu/ermrestjs/master/docs/resources/download-alt-btn.png)

  - `.download` will change the link to look like the following:
![download btn](https://raw.githubusercontent.com/informatics-isi-edu/ermrestjs/master/docs/resources/download-btn.png)

  - `.asset-permission` can be added to validate whether the user can download the asset before a download is attempted.
  - `.external-link` can be added to show a notification to the user when they are being navigated away from chaise for external links and assets hosted elsewhere.

Example:
```html
[Filename](https://code.jquery.com/jquery-3.1.0.js){download .download-alt .asset-permission}

# OUTPUT:
<p>
	<a href="https://code.jquery.com/jquery-3.1.0.js" download="" class="download asset-permission">Jquery Download</a>
</p>
```

**NOTE:** please stick to the above formats only to generate a download link.

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

With attributes height=400 and target=\_blank is to open it in new tab
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

> <p><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="\_blank"><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image" height="400"></a></p>

#### Multiple Adjacent Images

With attributes height=200 and target=\_blank is to open it in new tab
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

> <p><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="\_blank"><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image" height="200"></a> <a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="\_blank"><img src="https://c.fastcompany.net/multisite_files/fastcompany/imagecache/1280/poster/2015/06/3046722-poster-p-1-the-psychology-of-living-in-skyscrapers.jpg" alt="Image" height="200"></a></p>

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

> <figure class="embed-block" style="display:inline-block;"><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="\_blank"><figcaption class="embed-caption">Skyscrapers</figcaption><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" height="200"  /></a></figure>


### 6. Iframe

This is not part of commonMark specification and it will result in a [block](#inline-vs-block). You have to follow the syntax completely (notice the newline in the closing tag). The following is the basic syntax structure:
```mkdn
::: iframe [CAPTION](www.link.com) {<attribute>=<value>} \n:::
```

Below are examples of how to apply height, width, style, and class to the iframe and caption.

#### a. Styling the Iframe
The following list of terms are used to describe how to style iframes:
 - `height` and `width` - used to specify iframe width and iframe height
 - `style` - the attribute used to attach any standard CSS properties directly to the iframe
   - more commonly used CSS properties for iframes include `min-height`, `min-width`, `max-height`, and `max-width`
 - `class` - the attribute used to attach a class to the iframe
   - any self defined class or classes defined as part of chaise are allowed
   - the `chaise-autofill` class will set the appropriate values for height and width based on the user's browser
   - CAUTION: using `chaise-autofill` will ignore the set `height` or `width`

#### a.1. Without any attributes
```html
::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search) \n:::

# OUTPUT:
<figure class="embed-block">
	<figcaption class="embed-caption">CAPTION</figcaption>
	<iframe src="https://dev.isrd.isi.edu/chaise/search"></iframe>
</figure>
```


#### a.2. With height and width defined
```html
::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){width="800" height="300"} \n:::

# OUTPUT:
<figure class="embed-block">
	<figcaption class="embed-caption">CAPTION</figcaption>
	<iframe src="https://dev.isrd.isi.edu/chaise/search" width="800" height="300" ></iframe>
</figure>
```


#### a.3. Invalid link
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


#### a.4. Iframe without scrolling
```html
::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){width="800" height="300" scrolling="no"} \n:::

# OUTPUT:
<figure class="embed-block">
	<figcaption class="embed-caption">
		CAPTION
	</figcaption>
	<iframe src="https://dev.isrd.isi.edu/chaise/search" width="800" height="300" scrolling="no"></iframe>
</figure>
```


#### a.5. Class and style attached to the iframe element
```html
::: iframe [CAPTION](https://example.com){pos="bottom" style="border: 5px solid;" class="iframe-element-class"} \n:::

# OUTPUT:
<figure class="embed-block">
	<iframe src="https://example.com" style="border: 5px solid;" class="iframe-element-class"></iframe>
    <figcaption class="embed-caption">CAPTION</a></figcaption>
</figure>
```


#### a.6. Iframe with figure class and style
To style the whole iframe enclosing block (`<figure>`) you can either specify classes using `figure-class` or CSS style using `figure-style`.
 - NOTE: `iframe-class` and `iframe-style` are deprecated.

```html
::: iframe [CAPTION](https://example.com){pos="bottom" figure-class="iclass" figure-style="border: 1px solid;"  link="https://example.com} \n:::

# OUTPUT:
<figure class="embed-block iclass" style="border: 1px solid;">
	<figcaption class="embed-caption">
		<a href="https://example.com" target="_blank">CAPTION</a>
	</figcaption>
	<iframe src="https://example.com"></iframe>
</figure>
```


#### a.7. Iframe with caption styles and figure styles

```html
::: iframe [CAPTION](https://example.com){pos="bottom" figure-class="iclass" figure-style="border: 1px solid;" caption-class="cclass" caption-style="font-weight: 500;"  link="https://example.com} \n:::

# OUTPUT:
<figure class="embed-block iclass" style="border: 1px solid;">
	<iframe src="https://example.com"></iframe>
    <figcaption class="embed-caption cclass" style="font-weight: 500;">
        <a href="https://example.com" target="_blank">CAPTION</a>
    </figcaption>
</figure>
```


#### b. Captions

#### b.1. Linkable caption
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


#### b.2. Caption positioned at the bottom
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


#### b.3. Caption class and style
To style the caption of an iframe you can either specify classes using `caption-class` or CSS style using `caption-style`.

```html
::: iframe [CAPTION](https://example.com){pos="bottom" caption-class="cclass" caption-style="font-weight: 500;"  link="https://example.com} \n:::

# OUTPUT:
<figure class="embed-block">
	<iframe src="https://example.com"></iframe>
    <figcaption class="embed-caption cclass" style="font-weight: 500;">CAPTION</a></figcaption>
</figure>
```


#### c. Responsiveness and Other Cases
Some best practices for creating responsive or specifically sized iframes are as follows:
 - For fixed iframe dimensions use `height` and `width`.
 - Responsive iframe dimensions:
   - To expand the iframe width to browser width, attach the `chaise-autofill` class and define `min-width` on the iframe as part of the `style`.
     - If browser width is less than the cell's width (or max width), a scrollbar will be present in the cell itself to scroll left/right to see the rest of the content.
   - To expand the iframe height to the cell height, attach the `chaise-autofill` class.
     - Specify `min-height` to initialize the iframe height with the min height value without removing the responsiveness from `chaise-autofill`
     - Defining `max-height` on the iframe will limit the responsiveness from continually stretching the iframe
 - Other cases:
   - For iframes that are accompanied by a potentially long caption, define `min-height` on the iframe to ensure the cell resizes to fit all of the caption and the iframe.
   - CSS styles can be applied to the `<td>` element with `id="entity-<column_name>"` to set height/width for the cell

#### c.1. Stretch to height and width of parent container
If parent container (cell in record app) has no styles, the iframe will only fill the minimum height of the cell

```html
::: iframe [CAPTION](https://example.com){class=chaise-autofill} \n:::

# OUTPUT:
<figure class="embed-block">
    <figcaption class="embed-caption">CAPTION</a></figcaption>
	<iframe src="https://example.com" class="chaise-autofill"></iframe>
</figure>
```


#### c.2. Fill container with min-width
When a min-width value is defined, the parent container will stop resizing once the viewport width forces the container to be smaller than the iframe.

```html
::: iframe [CAPTION](https://example.com){class=chaise-autofill style="min-width: 500px;"} \n:::

# OUTPUT:
<figure class="embed-block">
    <figcaption class="embed-caption">CAPTION</a></figcaption>
	<iframe src="https://example.com" class="chaise-autofill" style="min-width: 500px;"></iframe>
</figure>
```


#### c.3. Fill container with min-width and min-height and max-height
When a min-height value is defined, the parent container will resize to allow for the defined minimum height. Max height is defined to limit the iframe from continually stretching as noted in the best practices above.

```html
::: iframe [CAPTION](https://example.com){class=chaise-autofill style="min-width: 500px; min-height: 400px; max-height: 800px;"} \n:::

# OUTPUT:
<figure class="embed-block">
    <figcaption class="embed-caption">CAPTION</a></figcaption>
	<iframe src="https://example.com" class="chaise-autofill" style="min-width: 500px; min-height: 400px; max-height: 800px;"></iframe>
</figure>
```


#### c.4. Iframe with set height and responsive width
To have a responsive width and a set height, do not use `chaise-autofill` and set `height` or `min-height` with `width: 100%`.

```html
::: iframe [CAPTION](https://example.com){width=100% style="min-width: 300px; min-height: 400px;"} \n:::

# OUTPUT:
<figure class="embed-block">
    <figcaption class="embed-caption">CAPTION</a></figcaption>
    <iframe src="https://example.com" width=100% style="min-width: 300px; min-height: 400px;"></iframe>
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

### 9. Youtube Video

Assuming that `https://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID` is the link to a youtube video,

 - Video thumbnail is `https://img.youtube.com/vi/YOUTUBE_VIDEO_ID/0.jpg`
 - Embed link is `https://www.youtube.com/embed/YOUTUBE_VIDEO_ID`. You can also pass different query parameters to customize the way the video looks like. Please refer to the [Youtube API document](https://developers.google.com/youtube/player_parameters) for more information.

Therefore you have two options for showing a youtube video in your markdown templates:

- Use an iframe

```html
::: iframe [Video Caption](https://www.youtube.com/embed/YOUTUBE_VIDEO_ID){width=800 height=300} \n:::

# OUTPUT:
<figure class="embed-block">
	<figcaption class="embed-caption">CAPTION</figcaption>
	<iframe src="https://www.youtube.com/embed/YOUTUBE_VIDEO_ID" width="800" height="300" ></iframe>
</figure>
```

- Show the video thumbnail that is linked to the youtube video

```html
[![](https://img.youtube.com/vi/YOUTUBE_VIDEO_ID/0.jpg){width=800 height=300}](https://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID)

# OUTPUT:
<p>
    <a href="https://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID">
        <img src="https://img.youtube.com/vi/YOUTUBE_VIDEO_ID/0.jpg" alt="">
    </a>
</p>
```


### 10. Video

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

### 11. Subscript

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


### 12. Superscript

This is not part of commonMark specification and it will result in an [inline](#inline-vs-block) element.

Without attributes

```html
^This^ should be superscript.

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

### 13. Span (Attach Attributes To Text)

This is not part of commonMark specification and it will result in an [inline](#inline-vs-block) element.  Opening tag is `:span:` and closing is `:/span:`.

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

### 14. RID link

Takes an RID of an existing record and generates a resolvable link for that record. This is not part of commonMark specification. It will result in an [inline](#inline-vs-block) element. You have to follow the syntax completely.

```md
[[<RID>]]
```

- **RID**: A valid RID to an existing record

**Example**
```html
[[1-3X0H]]

# OUTPUT:
<a href="/id/1-3X0H">1-3X0H</a>
```
> <a href="/id/1-3X0H">1-3X0H</a>
