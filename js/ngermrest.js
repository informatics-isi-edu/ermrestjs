angular.module('ERMrest', [])

    .factory('ermrestServerFactory', ['$http', '$q', function($http, $q) {
        ERMrest.configure($http, $q);
        return ERMrest.ermrestFactory;
    }])
    .factory('myHttpInterceptor', ['$q', function($q){

        // this is for testing utilities._makeRequest retry case
        // by intercepting ermrest response and fake it to a 500 error
        return {
            // optional method
            'response': function(response) {
                // fake error response
                response.status = 500;
                return $q.reject(response);
                //return response;
            }
        };
    }]);
    // uncommet this block if testing error retry using myHttpInterceptor
    //.config(['$httpProvider', function($httpProvider) {
    //    $httpProvider.interceptors.push('myHttpInterceptor');
    //}]);