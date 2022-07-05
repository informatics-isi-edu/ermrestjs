#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const ERMrest = require(path.join(__dirname, '..', '..' , 'dist', 'ermrest.js'));

/**
 * This scrip will create a HTML document based on the given markdown value
 * 
 * If you're testing this for Chaise, you have to make sure the same CSS rules 
 * that Chaise is applying are also applied here. To simplify this, 
 * during Chaise installation, we're creating a file under 
 * `dist/chaise-dependencies.html` in the Chaise repository. 
 * You should not copy the contents of `dist/chaise-dependencies.html` manually 
 * and this should be part of the automated process of building Chaise and 
 * your other apps. 
 * Since Chaise is generating this file, its content might change, 
 * so you should ensure you're always getting the latest list of dependencies.
 * 
 */
const markdownContent = `
  [Link With Download](https://code.jquery.com/jquery-3.1.0.js){download .btn .btn-primary}
  ::: iframe [Chaise](https://example.com){width=800 height=300} \n:::
`;

const outputLocation = path.join(__dirname, 'markdown-output.html');

/**
 * renderMarkdown accepts two arguments. The second arguments whether we want
 * an inline rendering or not. Inline rendered is used in Chaise for places that 
 * we don't want to display "inline" values (as oppose to block), .e.g. row names
 * of the tables that are displayed as title of record page.
 */
const renderedValue = ERMrest.renderMarkdown(markdownContent);

// print the output
// console.log(renderedValue);

// save as HTML
const HTMLContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <!-- 
        TODO css should be added here to make sure it looks consistent with
        where it's deployed.
        If testing for chaise, add the contents of dist/chaise-dependencies.html here
       -->
    </head>
    <body>
      ${renderedValue}
    </body>
  </html>
`;
fs.writeFile(outputLocation, HTMLContent, function (err) {
  if (err) throw err;
  console.log(`HTML output saved to ${outputLocation}.`);
});



