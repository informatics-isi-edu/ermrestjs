/**
 *
 * Created by shuai on 3/1/16.
 */



describe('In ERMrest,', function () {
    var ermrestClientFactory, ermrestClient, ermrestBaseUrl;
    var $rootScope, $httpBackend, $http, $q;
    var catalog_id = 1;

    beforeEach(module('ERMrest'));
    beforeEach(module('ngMock'));
    beforeEach(inject(function ($injector) {
        //inject service from AngularJS
        $http = $injector.get('$http');
        $httpBackend = $injector.get('$httpBackend');
        $q = $injector.get('$q');
        $rootScope = $injector.get('$rootScope');
        //inject self-defined constant from testing Factory
        ermrestBaseUrl = $injector.get('ermrestBaseUrl');
        //inject ermrest factory service
        ermrestClientFactory = $injector.get('ermrestClientFactory');
    }));

    beforeEach(function () {
        //define mock file path
        jasmine.getJSONFixtures().fixturesPath='base/test/mock_data';
    });

    describe('ermrest factory,', function () {
        var catalog;

        beforeEach(function () {
            //fetch client
            ermrestClient = ermrestClientFactory.getClient(ermrestBaseUrl);
            //define mock data source for 'catalog.introspect()'
            $httpBackend.whenGET(ermrestBaseUrl + '/catalog/' + catalog_id + '/schema')
                .respond(getJSONFixture('catalog.1.schema.data.json'));
        });

        describe('ermrest catalog,', function () {
            it('should have available getCatalog() method', function (done) {
                expect(ermrestClient.getCatalog).toBeDefined();
                done();
            });
            it('of id ' + catalog_id + ' should be fetched', function (done) {
                catalog = ermrestClient.getCatalog(catalog_id);
                expect(catalog).toBeDefined();
                done();
            });
            it('should have correct client property', function (done) {
                expect(catalog.client).toBe(ermrestClient);
                done();
            });
            var schemas;
            it('should fetch schema data using its URI', function (done) {
                catalog.introspect().then(function (data) {
                    schemas = data;
                    expect(schemas).toBeDefined();
                    done();
                });
                //$digest() enables Promise to be resolved
                $rootScope.$digest();
                //flush() enables the http request to be sent
                $httpBackend.flush();
            });
            it('should have initialized catalog with predefined id', function(done) {
                expect(ermrestClient._catalogs[catalog_id]).toBeDefined();
                done();
            });
            it('should have initialized catalog with non-existing id', function(done) {
                expect(ermrestClient._catalogs[catalog_id + 2]).toBeUndefined();
                done();
            });
            it('should have available getSchemas() method', function (done) {
                expect(catalog.getSchemas).toBeDefined();
                done();
            });
            it('should get the same schema data using getSchemas() method', function (done) {
                var schemasGotFromMethod = catalog.getSchemas();
                expect(schemasGotFromMethod).toBe(schemas);
                done();
            });

        });

    });
});
