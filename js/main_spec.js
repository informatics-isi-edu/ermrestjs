"use strict";

if (typeof chai == 'undefined')
    // Works in 'mocha' for command line testing
    var expect = require('chai').expect;
else
    // Works in 'testem' for browser based testing
    var expect = chai.expect;

describe('ERMrest', function(){

    it('Promise is available', function() {
        expect(Promise).to.exist;
    });

    it('ERMrest namespace should exist', function(){
        expect(ERMrest).to.exist;
    });

    it('ERMrest.rest provider should exist', function(){
        expect(ERMrest.rest).to.exist;
    });

    it('ERMrest.rest(url) should return an ERMrest.Catalog instance', function(){
        expect(typeof ERMrest.rest('https://localhost/ermrest') == 'ERMrest.Catalog').to.exist;
    });

    it('ERMrest.rest(url).catalog(name) should return an ERMrest.Catalog.Schema instance', function(){
        var service = ERMrest.rest('http://localhost/ermrest');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        expect(typeof schema == 'ERMrest.Catalog.Schema').to.exist;
    });

    it('Schema should be initialized', function(){
        var service = ERMrest.rest('http://localhost/ermrest');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        expect(schema.name).to.exist;
        expect(schema.catalog).to.not.exist;
    });
});

