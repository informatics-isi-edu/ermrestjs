#!/usr/bin/env node
const path = require('path');
const ERMrest = require(path.join(__dirname, '..', '..' , 'dist', 'ermrest.js'));

/**
 * This scrip will get the data of the given table and print it
 */

// TODO modify the following:
const server = 'https://dev.isrd.isi.edu';
const catalog = '1';
const table = 'isa:dataset';

if (!server || !catalog || !table) {
  throw new Error('Please properly define server, catalog, and table.');
}

// set the user cookie if you want to perform actions that are not public
// ERMrest.setUserCookie(cookie)

// provide an applink function
// This is required when you're accessing tuple values (otherwise you will get an error)
ERMrest.appLinkFn((tag, location) => {
  let app;
  switch (tag) {
    case 'tag:isrd.isi.edu,2016:chaise:recordset':
      app = 'recordset';
      break;
    case 'tag:isrd.isi.edu,2016:chaise:recordedit':
      app = 'recordedit';
      break;
    case 'tag:isrd.isi.edu,2016:chaise:viewer':
      app = 'viewer';
      break;
    default:
      app = 'record';
      break;
  }
  return `${server}/chaise/${app}/${location.path}`;
});

// resolve a uri to be able to use reference API
const uri = `${server}/ermrest/catalog/${catalog}/entity/${table}`;
let columns;
ERMrest.resolve(uri, { cid: 'test' }).then((reference) => {
  console.log('resolved the `' + reference.displayname.value + '` displayname.');

  // change the context
  reference = reference.contextualize.compact;

  // the columns
  columns = reference.columns;

  // you can sort/search the reference
  // reference = reference.sort([{'column':'id', 'descending': true}]);
  // reference = reference.search('value')

  // read the reference values
  return reference.read(5);
}).then((page) => {

  // you can use the returned page to get the previous and next one
  /*
  if (page.hasPrevious) {
      var prevReference = page.previous;
  }
  if (page.hasNext) {
      var nextReference = page.next;
  }
  */

  // get the tuples
  page.tuples.forEach(function (tuple, tIndex) {
    console.log('values for tuple index=' + tIndex);

    // get values of tuple which is an array in the same order of columns.
    tuple.values.forEach(function (value, vIndex) {
      console.log(columns[vIndex].displayname.value + ' = ' + value);
    });
  });

}).catch((err) => {
  console.log(err);
});
