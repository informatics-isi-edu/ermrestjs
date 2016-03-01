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

        //define mock file path
        jasmine.getJSONFixtures().fixturesPath='base/test/mock_data';
    }));

    describe('ermrest factory,', function () {
        var catalog, schemas, legacySchema;
        var legacy = 'legacy';
        var dataset = 'dataset', datasetTable, datasetTableEntities;

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
            beforeEach(function () {
                //schemas['legacy'] ['public']
                schemas = catalog.getSchemas();
                legacySchema = schemas[legacy];
            });

            it('should get \'dataset\' table,', function (done) {
                datasetTable = legacySchema.getTable(dataset);
                expect(datasetTable).toBeDefined();
                done();
            });
            describe('dataset table', function () {
                beforeEach(function () {
                    //define mock data for URL
                    $httpBackend.whenGET(datasetTable.uri)
                        .respond(getJSONFixture('catalog.1.entity.legacy:dataset.json'));
                });
                it('should have \'dataset\' as its name property,', function (done) {
                    expect(datasetTable.name).toBe(dataset);
                    done();
                });
                it('should have getEntites() method available,', function (done) {
                    expect(typeof datasetTable.getEntities).toBe(functionType);
                    done();
                });
                it('should get all of its entities,', function (done) {
                    datasetTable.getEntities().then(function (data) {
                        datasetTableEntities = data;
                        done();
                    });
                    //$digest() enables Promise to be resolved
                    $rootScope.$digest();
                    //flush() enables the http request to be sent
                    $httpBackend.flush();
                });
                it('should have >0 entities,', function (done) {
                    var num = 0;
                    for (var each in datasetTableEntities) {
                        num++;
                    }
                    expect(num).toBeGreaterThan(0);
                    done();
                });

            });

        });

    });
});
