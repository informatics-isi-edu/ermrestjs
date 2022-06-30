#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const ERMrest = require(path.join(__dirname, '..', '..' , 'dist', 'ermrest.js'));

/**
 * This scrip will create a HTML document based on the given markdown value
 * NOTE: if you're testing this for chaise, you have to make sure the same
 * CSS rules that chaise are applying is applied here as well.
 * This includes the chaise's default CSS rules as well as your custom CSS.
 */
const markdownContent = `
  [Link With Download](https://code.jquery.com/jquery-3.1.0.js){download .btn .btn-primary}
  ::: iframe [Chaise](https://dev.isrd.isi.edu/chaise/search){width=800 height=300} \n:::
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
  <DOCTYPE html>
  <html>
    <head>
      <!-- TODO custom css should be added here -->
    </head>
    <body>
      ${renderedValue}
    </body>
  </html>
`;
fs.writeFile(outputLocation, HTMLContent, function (err) {
  if (err) throw err;
  console.log(`HTML output saved to ${outputLocation}`);
});



