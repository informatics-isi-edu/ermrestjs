"use strict";
/*
 * Copyright 2015 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Import chai.expect if not defined
var expect = (typeof chai == 'object') ? chai.expect : require('chai').expect;

// Import Node package for XMLHttpRequest if not defined
if (XMLHttpRequest) {
    var SERVICE_URI = 'https://localhost:8443/ermrest';
    var INVALID_URI = 'https://localhost:8443/wrong';
}
else {
    var SERVICE_URI = 'http://localhost:8080/ermrest';
    var INVALID_URI = 'http://localhost:8080/wrong';
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
}

describe('ERMrest', function(){

    var CATALOG_ID  = '1';

    it('Promise is available', function() {
        // TBD This is really a prerequisite and probably doesn't belong here
        // but it serves as a sanity check before getting into the rest of 
        // the tests.
        expect(Promise).to.exist;
    });

    it('ERMrest namespace should exist', function(){
        expect(ERMrest).to.exist;
    });

    it('ERMrest.service should exist', function(){
        expect(ERMrest.service).to.exist;
    });

    it('ERMrest.service(uri) should return a Service instance', function(){
        var service = ERMrest.service('https://host/path');
        expect(typeof service).to.equal("object");
    });

    it('Service.catalog(id) should return a Catalog instance', function(){
        var service = ERMrest.service('https://host/path');
        var catalog = service.catalog('fubar');
        expect(typeof catalog).to.equal("object");
    });

    it('Catalog.schema(name) should return a Schema instance', function(){
        var service = ERMrest.service('https://host/path');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        expect(typeof schema).to.equal("object");
    });

    it('Schema should be initialized correctly', function(){
        var service = ERMrest.service('https://host/path');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        expect(schema.name).to.exist;
        expect(schema.catalog).to.not.exist;
    });

    it('Schema.table(name) should return a Table instance', function(){
        var service = ERMrest.service('https://host/path');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        var table   = schema.table('bar');
        expect(typeof table).to.equal("object");
    });

    it('catalog should have right uri', function() {
        var service = ERMrest.service(SERVICE_URI);
        var catalog = service.catalog(CATALOG_ID);
        expect(catalog.uri_).to.equal(SERVICE_URI+'/catalog/'+CATALOG_ID);
    });

    it('should get the catalog properties', function(done) {
        // TODO this is a work in progress
        // This only works with a test server
        //      - running on localhost
        //      - using this with testem
        //      - localhost apache must have cors enabled
        //      - ermrest service must not require user or attributes
        var service = ERMrest.service(SERVICE_URI);
        var catalog = service.catalog(CATALOG_ID);
        var p = catalog.get();
        p.then(function(response) {
            done();
        }, function(error) {
            done(error);
        });
    });

    it('should not find this catalog resource (error 404)', function(done) {
        // TODO this test is getting status=0 in 'testem'
        var service = ERMrest.service(INVALID_URI);
        var catalog = service.catalog(CATALOG_ID);
        var p = catalog.get();
        p.then(function(response) {
            done(Error('catalog should have returned error 404'));
        }, function(error) {
            done(error.status == 404 ? null : Error("Unexpected response: " + error.status));
        });
    });

    it('should introspect the catalog', function(done) {
        // TODO same caveats as above
        var service = ERMrest.service(SERVICE_URI);
        var catalog = service.catalog(CATALOG_ID);
        var p = catalog.introspect();
        p.then(function(response) {
            console.log(response);
            done();
        }, function(error) {
            done(error);
        });
    });

});


/**
 * @var http
 * @desc
 * This is a small utility of http routines that promisify XMLHttpRequest.
 */
var http = {

    /**
     * @private
     * @function
     * @param {String} url Location of the resource.
     * @return {Promise} Returns a promise object.
     * @desc
     * Gets a representation of the resource at 'url'. This function treats
     * only HTTP 200 as a successful response.
     */
    get: function (url) {

        return new Promise( function( resolve, reject ) {
            var err;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                // debug statements (to be removed)
                //console.log("readyState == " + xhr.readyState);
                //console.log("status == " + xhr.status);
                //console.log("response == " + xhr.responseText);
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    }
                    else if (xhr.status === 0) {
                        err = Error("Network error");
                        err.status = 0;
                        reject(err);
                    }
                    else {
                        err = Error(xhr.responseText);
                        err.status = xhr.status;
                        reject(err);
                    }
                }
            };
            xhr.open('GET', url);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.send();
        });
    }
};
