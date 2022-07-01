# Examples

In this folder, you can find examples of using ERMrestJS. While ERMrestJS is mainly designed to work with [Chaise](https://github.com/informatics-isi-edu/chaise) and tailored based on Chaise's needs, you can directly call its APIs to get similar results.

## NodeJS

### Presequites

Before running the scripts, ERMrestJS must be built appropriately. You can do so by calling the following Make command:

```
make dist
```

Please refer to [installation guide](../docs/user-docs/installation.md) for more information.

### Scripts

The following are the available scripts:

- [**Markdown renderer**](nodejs/markdown-render.js): In this script, we demonstrate how the `renderMarkdown` function can be called for rendering a markdown and getting the HTML output. 
  If you're testing this for Chaise, you have to make sure the same CSS rules that Chaise is applying are also applied here. To simplify this, during Chaise installation, we're creating a file under `dist/chaise-dependencies.html` in the Chaise repository. 
  You should not copy the contents of `dist/chaise-dependencies.html` manually and this should be part of the automated process of building Chaise and your other apps. Since Chaise is generating this file, its content might change. So you should ensure you're always getting the latest list of dependencies.

- [**read data**](nodejs/read-data.js): This script will read the data of a given table and print its values. You need to specify the server, catalog, and table information to be able to run this script.

## AngularJS

In [this example](angularjs/sample.app.js), we implemented a simplified version of Chaise where it will use the defined hash fragment to find the table of interest. And then will display some data related to the given table.

To be able to use this app properly, ERMrestJS must be installed on the same server, and its location must be specified in the `head` tag (there's a `TODO` for it in the code).


