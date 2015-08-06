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
var XMLHttpRequest = XMLHttpRequest || require("xmlhttprequest").XMLHttpRequest;

describe('ERMrest', function(){

    var SERVICE_URI = 'https://localhost:8443/ermrest';
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

    it('should get the catalog properties', function() {
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
            console.log("Success!", response);
        }, function(error) {
            console.error("Failed!", error);
        });
    });

});

