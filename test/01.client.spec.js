/**
 * To test the functionality of Client object in js/ermrest.js
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

    it('Promise should be available', function (done) {
        expect(Promise).toBeDefined();
        done();
    });
    it('ERMrest namespace should exist', function(done){
        expect(ERMrest).toBeDefined();
        done();
    });

    describe('ermrest factory,', function () {
        it('should not have ermrest client available before fetching it', function (done) {
            expect(ermrestClient).toBeUndefined();
            done();
        });
        it('should get client object using example URL', function (done) {
            ermrestClient = ermrestClientFactory.getClient(ermrestBaseUrl);
            expect(ermrestClient).toBeDefined();
            done();
        });

        describe('ermrest client,', function () {
            it('should have correct uri property', function (done) {
                expect(ermrestClient.uri).toBe(ermrestBaseUrl);
                done();
            });

            it('should have available \'getCatalog\' method', function (done) {
                expect(ermrestClient.getCatalog).toBeDefined();
                done();
            });

            it('should throw error when passing undefined to \'getCatalog\' method', function (done) {
                var errorMessage = 'ID is undefined or nul';
                expect(function () {ermrestClient.getCatalog(undefined)} ).toThrow(errorMessage);
                expect(function () {ermrestClient.getCatalog(null)} ).toThrow(errorMessage);
                done();
            });

        });

    });
});
