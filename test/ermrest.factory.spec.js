/**
 *
 * Created by shuai on 2/19/16.
 */


describe('ERMrest,', function () {
    var ERMrestClient;
    var ermrestUrl = 'https://example.com/ermrest';
    var $httpBackend, $http;

    beforeEach(module('ERMrest'));
    beforeEach(module('ngMock'));
    beforeEach(inject(function ($injector) {
        //inject service from AngularJS
        $http = $injector.get('$http');
        $httpBackend = $injector.get('$httpBackend');
        //jasmine get mock json file
        jasmine.getJSONFixtures().fixturesPath='base/test/mock_data';
        //register fake url and response
        $httpBackend.whenGET(ermrestUrl + '/catalog/1/schema').respond(getJSONFixture('catalog.num.schema.data.json'));
        $httpBackend.expectGET('');
    }));

    describe('after injecting factory,', function () {
        var catalog, table, schemas;
        beforeEach(inject(function (ermrestClientFactory) {
            ERMrestClient = ermrestClientFactory.getClient(ermrestUrl);
            catalog = ERMrestClient.getCatalog(1);
            catalog.introspect();
            schemas = catalog.getSchemas();
            $httpBackend.flush();
        }));

        it('ERMrest namespace should exist', function(done){
            expect(ERMrest).toBeDefined();
            console.log(ERMrestClient.uri);
            done();
        });

        it('Ermrest Factory should exist', function(done) {
            expect(ERMrestClient).toBeDefined();
            done();
        });

        it('Ermrest Factory should return catalog', function(done) {
            expect(schemas).toBeDefined();
            console.log(schemas);
            done();
        });

        xit('Table', function (done) {
            table = schemas['rbk'].getTable('roi');
            done();
        });
    });


});
