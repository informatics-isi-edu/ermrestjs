"use strict";
/*
 * Copyright 2015 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Import chai
if (typeof chai == 'undefined')
    // Works in 'mocha' for command line testing
    var expect = require('chai').expect;
else
    // Works in 'testem' for browser based testing
    var expect = chai.expect;

describe('ERMrest', function(){

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
        var service = ERMrest.service('http://host/path');
        expect(typeof service).to.equal("object");
    });

    it('Service.catalog(id) should return a Catalog instance', function(){
        var service = ERMrest.service('http://host/path');
        var catalog = service.catalog('fubar');
        expect(typeof catalog).to.equal("object");
    });

    it('Catalog.schema(name) should return a Schema instance', function(){
        var service = ERMrest.service('http://host/path');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        expect(typeof schema).to.equal("object");
    });

    it('Schema should be initialized correctly', function(){
        var service = ERMrest.service('http://host/path');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        expect(schema.name).to.exist;
        expect(schema.catalog).to.not.exist;
    });

    it('Schema.table(name) should return a Table instance', function(){
        var service = ERMrest.service('http://host/path');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        var table   = schema.table('bar');
        expect(typeof table).to.equal("object");
    });

});

