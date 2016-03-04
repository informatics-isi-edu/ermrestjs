/**
 *
 * Created by shuai on 3/1/16.
 */


describe('In ERMrest,', function () {
    var ermrestClientFactory, ermrestClient, ermrestBaseUrl;
    var $rootScope, $httpBackend, $http, $q;
    var catalog_id = 1;
    var functionType = 'function';

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
        var catalog, schemas;

        beforeEach(function () {
            //fetch client
            ermrestClient = ermrestClientFactory.getClient(ermrestBaseUrl);
            //define mock data source for 'catalog.introspect()'
            $httpBackend.whenGET(ermrestBaseUrl + '/catalog/' + catalog_id + '/schema')
                .respond(getJSONFixture('catalog.1.schema.data.json'));
            catalog = ermrestClient.getCatalog(catalog_id);
            catalog.introspect();
            $httpBackend.flush();
        });

        describe('ermrest catalog', function () {
            it('should fetch schema data using its URI,', function (done) {
                //schemas['legacy'] ['public']
                schemas = catalog.getSchemas();
                expect(schemas).toBeDefined();
                done();
            });

            describe('ermrest schemas', function () {
                var legacy = 'legacy';
                var legacySchema, legacySchemaTables;
                it('should get undefined when retrieving non-existing schema,', function (done) {
                    expect(schemas['somethingDoesNotExist']).toBeUndefined();
                    done();
                });
                it('should get the \'legacy\' schema,', function (done) {
                    legacySchema = schemas[legacy];
                    expect(legacySchema).toBeDefined();
                    done();
                });
                describe('legacy schema', function () {
                    it('should have the \'legacy\' name property,', function (done) {
                        expect(legacySchema.name).toBe(legacy);
                        done();
                    });
                    it('should have the correct catalog property,', function (done) {
                        expect(legacySchema.catalog).toBe(catalog);
                        done();
                    });
                    it('should have >0 tables,', function (done) {
                        legacySchemaTables = legacySchema._tables;
                        var tableSum = 0;
                        for (var each in legacySchemaTables) {
                            tableSum++;
                        }
                        //tableSum should be 54
                        expect(tableSum).toBeGreaterThan(0);
                        done();
                    });
                    it('should have getTable() method available', function (done) {
                        expect(typeof legacySchema.getTable).toBe(functionType);
                        done();
                    });
                });

            });

        });

    });
});
