/*
 * Copyright 2016 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
if (typeof angular === 'object' && angular.module) {

    /* This is the current way to use ERMrest in an Angular application.
     * First, your application or module should depend on 'ERMrestJS' then
     * when you need ERMrest services, use a dependency on 'ERMrest'.
     */
    angular.module('ermrestjs', [])
    .factory('ERMrest', ['$window', '$http', '$q', function ($window, $http, $q) {
        if ($window.ERMrest) {
            // we assume that http and q have not been passed yet
            $window.ERMrest.configure($http, $q);
            // now save a copy in _thirdParty for future reference
            $window._thirdParty = $window._thirdParty || {};
            $window._thirdParty.ERMrest = $window.ERMrest;
            // delete or undefine the global var
            try {
                delete $window.ERMrest;
            }
            catch (e) {
                // <IE8 does not permit delete of window vars
                // see http://jameshill.io/articles/angular-third-party-injection-pattern/
                $window.ERMrest = undefined;
            }
        }
        return $window._thirdParty.ERMrest;
    }]);

    /* The following style of Angular module is deprecated. We will leave it for
     * now until we have removed its usage from the UI applications.
     */
    angular.module('ERMrest', [])
    .factory('ermrestServerFactory', ['$http', '$q', function ($http, $q) {
        ERMrest.configure($http, $q);
        return ERMrest.ermrestFactory;
    }]);
}
