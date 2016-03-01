/**
 *
 * Created by shuai on 2/19/16.
 */


xdescribe('ERMrest,', function () {
    var ermrestClientFactory, ERMrestClient;
    var ermrestBaseUrl;
    var $rootScope, $httpBackend, $http, $q;
    var catalog_id = 1;

    beforeEach(module('ERMrest'));
    beforeEach(module('ngMock'));
    beforeEach(inject(function ($injector) {
        ermrestBaseUrl = $injector.get('ermrestBaseUrl');
        //inject service from AngularJS
        $http = $injector.get('$http');
        $httpBackend = $injector.get('$httpBackend');
        $q = $injector.get('$q');
        $rootScope = $injector.get('$rootScope');
    }));
    beforeEach(function () {
        //jasmine get mock json file
        jasmine.getJSONFixtures().fixturesPath='base/test/mock_data';
        //register fake url and response
        $httpBackend.whenGET(ermrestBaseUrl + '/catalog/' + catalog_id + '/schema')
            .respond(getJSONFixture('catalog.1.schema.data.json'));
        $httpBackend.expectGET(ermrestBaseUrl + '/catalog/' + catalog_id + '/schema');
    });

    describe('after injecting factory,', function () {
        var catalog, table, schemas;
        var legacySchema;

        beforeEach(inject(function ($injector) {
            ermrestClientFactory = $injector.get('ermrestClientFactory');
            ERMrestClient = ermrestClientFactory.getClient(ermrestBaseUrl);
            catalog = ERMrestClient.getCatalog(catalog_id);
            catalog.introspect();
            schemas = catalog.getSchemas();
            $httpBackend.flush();
        }));

        it('ERMrest namespace should exist', function(done){
            expect(ERMrest).toBeDefined();
            done();
        });

        it('Ermrest Factory should exist', function(done) {
            expect(ERMrestClient).toBeDefined();
            done();
        });
        it('Ermrest client should have correct uri', function(done) {
            expect(ERMrestClient.uri).toBe(ermrestBaseUrl);
            done();
        });
        it('Ermrest catalog with predefined id should have be initialized', function(done) {
            expect(ERMrestClient._catalogs[catalog_id]).toBeDefined();
            done();
        });
        it('Ermrest catalog with id other than predefined one should not have be initialized', function(done) {
            expect(ERMrestClient._catalogs[catalog_id + 2]).toBeUndefined();
            done();
        });

        it('Ermrest Factory returning schemas should be defined', function(done) {
            expect(schemas).toBeDefined();
            done();
        });
        it('Ermrest Factory returning catalog should be defined', function(done) {
            legacySchema = schemas['legacy'];
            expect(legacySchema).toBeDefined();
            done();
        });
        it('Legacy schema should have correct name', function(done) {
            expect(legacySchema.name).toBe('legacy');
            done();
        });
        var legacySchemaTableNum = 54;
        it('Legacy schema should have ' + legacySchemaTableNum + ' tables', function(done) {
            var count = 0;
            for (var each in legacySchema._tables) {
                count++;
            }
            expect(count).toBe(legacySchemaTableNum);
            done();
        });
        var dataset = 'dataset';
        var datasetTable;
        it('\'Dataset\' table got from legacy schema should be defined', function(done) {
            datasetTable = legacySchema.getTable(dataset);
            expect(datasetTable).toBeDefined();
            done();
        });
        it('\'Dataset\' table got from legacy schema should have correct name', function(done) {
            expect(datasetTable.name).toBe(dataset);
            done();
        });
        it('', function(done) {
            console.log(datasetTable.uri);
            done();
        });
        describe('Entities promise testing', function () {
            beforeEach(inject(function ($injector) {
                //spyOn(datasetTable, 'getEntities').and.callThrough();
                //spyOn(datasetTable, 'getEntities').and.callFake(function () {
                //    var deferred = $q.defer();
                //    deferred.resolve('jb');
                //    return deferred.promise;
                //});
            }));

            it('Ermrest Factory\'s returning catalog should be defined', function(done) {
                //1.To test that service hit the correct uri
                //2.To fetch the result to test following functions
                $httpBackend.whenGET(datasetTable.uri)
                    .respond(getJSONFixture('catalog.1.entity.legacy:dataset.json'));
                //getEntities() return a Promise
                datasetTable.getEntities().then(function (data) {
                    console.log('I am here' + data);
                    done();
                });
                $rootScope.$digest();
                $httpBackend.flush();
            });
        });
        xit('Ermrest Factory\'s returning catalog should be defined', function(done) {
            done();
        });

        xit('Table', function (done) {
            table = schemas['rbk'].getTable('roi');
            done();
        });
    });


});
