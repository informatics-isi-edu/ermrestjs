"use strict";

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

    it('ERMrest.service(url) should return a Service instance', function(){
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

