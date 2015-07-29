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

    it('ERMrest.service(url) should return an ERMrest.Service instance', function(){
        expect(typeof ERMrest.service('https://host/path', {}) == 'ERMrest.Service').to.exist;
    });

    it('ERMrest.service(url).catalog(name) should return an ERMrest.Catalog.Schema instance', function(){
        var service = ERMrest.service('http://host/path');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        expect(typeof schema == 'ERMrest.Catalog.Schema').to.exist;
    });

    it('Schema should be initialized', function(){
        var service = ERMrest.service('http://host/path');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        expect(schema.name).to.exist;
        expect(schema.catalog).to.not.exist;
    });
});

