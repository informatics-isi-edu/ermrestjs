/**
 * Make sure to have ermrest on the same server (cross origin issues)
 * 
 * The location of ermrestjs must be consistent with what's used while building ermrestjs
 * By default it would be in the /ermrest/ermrest.js location. Please refer to installation
 * guide on how you can customize this location by defining environment variables.
 */
const serviceURL = 'https://dev.derivacloud.org/ermrest';

/**
* @function
* @param {String} str string to be encoded.
* @desc
* converts a string to an URI encoded string
*/
function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/**
 * The function that will be passed to ermrestjs for appLinkFn
 * TODO this sample function is discarding different contexts, usually you
 * want to map different contexts to different locations
 * @param {string} tag the tag that is defined in the annotation. If null, should use context.
 * @param {ERMrest.Location} location the location object that ERMrest will return.
 * @param {string} context - optional, used to determine default app if tag is null/undefined
 * @returns {string} url the chaise url
 */
function appLinkFn(tag, location, context) {
  var baseUrl = window.location.href.replace(window.location.hash, '');
  return baseUrl + '/#' + fixedEncodeURIComponent(location.catalog) + '/' + location.path;
}

function hashToERMrestURL() {
  var hash = window.location.hash;
  if (hash === undefined || hash == '' || hash.length == 1) {
    return '';
  }

  var catalogId = hash.substring(1).split('/')[0];
  hash = hash.substring(hash.indexOf('/') + 1);

  return [serviceURL, 'catalog', catalogId, 'entity', hash].join('/');
}

function escape(s) {
  let lookup = {
      '&': "&amp;",
      '"': "&quot;",
      '\'': "&apos;",
      '<': "&lt;",
      '>': "&gt;"
  };
  return s.replace( /[&"'<>]/g, c => lookup[c] );
}

function changeDisplay(showResults, showLoading, showErrors) {
  const results = document.querySelector('#result-container');
  const errors = document.querySelector('#error-container');
  const loading = document.querySelector('#loading-container');
  results.style.display = showResults ? 'block' : 'none';
  errors.style.display = showErrors ? 'block' : 'none';
  loading.style.display = showLoading ? 'block' : 'none';
}


// register the applink function
ERMrest.appLinkFn(appLinkFn);

// generate the ermestjs uri
const uri = hashToERMrestURL();
if (!uri) {
  changeDisplay(false, false, true);
  throw new Error('Hash is required');
}

ERMrest.resolve(uri, { cid: 'demo' }).then(function (reference) {
  reference = reference.contextualize.compact;

  document.querySelector('#parser-output').innerHTML = [
    `<p><b>Service URL:</b> ${reference.location.service}</p>`,
    `<p><b>Catalog ID:</b> ${reference.location.catalog}</p>`,
    `<p><b>Schema name:</b> ${reference.location.schemaName}</p>`,
    `<p><b>Table name:</b> ${reference.location.tableName}</p>`
  ].join('');

  changeDisplay(true, true, false);
  return reference.read(10);
}).then(function (page) {
  
  let table = '';
  table += '<thead><tr><th>#</th>';
  table += page.reference.columns.map((col) => {
    const val = col.displayname.value;
    return `<th><span>${col.displayname.isHTML ? val : escape(val)}</span></th>`;
  }).join('');
  
  table += '</tr></thead>';
  table += '<tbody>';
  if (page.length === 0) {
    table += '<tr><td>No Result Found.</td></tr>';
  } else {
    table += page.tuples.map((tuple, index) => {
      return `<tr><td>${index + 1}</td>` +
      tuple.values.map((val, index) => {
        return `<td><span>${tuple.isHTML[index] ? val : escape(val)}</span></td>`;
      }).join('') + '</tr>'; 
    }).join('');
  }
  table += '</tbody>'
  
  document.querySelector('#result-table').innerHTML = table;
  changeDisplay(true, false, false);
}).catch(function (err) {
  changeDisplay(false, false, true);
  console.error(err);
});
