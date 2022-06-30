# Demo

In this folder, you can find examples of using ERMrestJS. While ERMrestJS is mainly designed to work with [Chaise](https://github.com/informatics-isi-edu/chaise) and tailored based on Chaise's needs, you can directly call its APIs to get similar results.

The following are the available demos:

## NodeJS

### Presequites

Before running the ermrestjs must be properly built. You can do so by calling the following Make command:

```
make dist
```

Please refer to [installation guide](../docs/user-docs/installation.md) for more information.

### Scripts

The following are available scripts:

- [**Markdown renderer**](nodejs/markdown-render.js): In this script, we demonstrate how the `renderMarkdown` function can be called for rendering a markdown and getting the HTML output.

- [**read data**](nodejs/read-data.js): This script will read the data of a given table and print its values.

## AngularJS

In [this example](angularjs/sample.app.js), we implemented a simplified version of Chaise where it will use the defined hash fragment to find the table of interest. And then will display some data related to the given table.

To be able to properly use this app, ERMrestJS must be first installed on the same server and its location must be specificed in the `head` tag (there's a `TODO` for it in the code).


