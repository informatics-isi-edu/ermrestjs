if (chai)
    var expect = chai.expect;
else
    var expect = require('chai').expect;

describe('ERMrest', function(){

    it('ERMrest should exist', function(){
        expect(ERMrest).to.exist;
    });

    it('ERMrest.rest should exist', function(){
        expect(ERMrest.rest).to.exist;
    });

    it('ERMrest.rest(url) should exist', function(){
        expect(ERMrest.rest('http://localhost/ermrest')).to.exist;
    });

    it('Catalog should exist', function(){
        var service = ERMrest.rest('http://localhost/ermrest');
        var catalog = service.catalog('fubar');
        expect(catalog).to.exist;
    });

    it('Schema should exist', function(){
        var service = ERMrest.rest('http://localhost/ermrest');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        expect(schema).to.exist;
    });

    it('Schema initialization work', function(){
        var service = ERMrest.rest('http://localhost/ermrest');
        var catalog = service.catalog('fubar');
        var schema  = catalog.schema('foo');
        expect(schema.name).to.exist;
        expect(schema.catalog).to.not.exist;
    });
});

