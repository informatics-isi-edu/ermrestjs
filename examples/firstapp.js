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

// The firstApp module depends ont he ERMrest module. Note that this module
// does not add any variables to the global namespace by using the chaining
// pattern.
angular.module('firstApp', ['ERMrest'])

// Register the 'context' object which can be accessed by config and other
// services.
.constant('context', {
    serviceURL: 'https://localhost/ermrest',
    catalogID: '4',
    schemaName: 'rbk',
    tableName: 'image'
})

// Register work to be performed on module loading.
.config(['context', function(context) {
    // This config example shows how one might parse the window
    // location hash and configure the context for the search.
    //
    // Note that we do not like using angular's '$location' service because
    // it encodes and/or decodes the URL in ways that are incompatible with
    // our applications. We need control of the encoding of the URLs.

    // First, configure the service URL, assuming its this origin plus the
    // typical deployment location for ermrest.
    context.serviceURL = window.location.origin + "/ermrest";

    // Then, parse the URL fragment id (aka, hash)
    // Expected format: "#catalog_id/[schema_name:]table_name"
    var hash = window.location.hash;
    if (hash === undefined || hash == '' || hash.length == 1) {
        return;
    }

    var parts = hash.substring(1).split('/');
    context.catalogID = parts[0];
    if (parts[1]) {
        parts = parts[1].split(':');
        if (parts.length > 1) {
            context.schemaName = parts[0];
            context.tableName = parts[1];
        }
        else {
            context.schemaName = '';
            context.tableName = parts[0];
        }
    }
}])

// Register the 'entities' and 'selected' objects, which can be accessed by other
// services, but cannot be access by providers (and config, apparently).
.value('entities', [])

// Keep in mind that these are watched objects. Thus you do not assign a new
// to 'selected' you must mutate it. Since the view template depends on the
// data member, it must be initialized.
.value('selected', [{data:{}}])

// Register the context controller
.controller('contextController', ['$scope', 'context', function($scope, context) {
    $scope.context = context;
}])

// Register the entities controller
.controller('entitiesController', ['$scope', 'entities', 'selected', function($scope, entities, selected) {
    $scope.entities = entities;

    /* process a selected entity when user clicks a row in the view */
    $scope.selectEntity = function(entity) {
        selected[0] = entity;
    }
}])

// Register the entity controller
.controller('entityController', ['$scope', 'selected', function($scope, selected) {
    $scope.selected = selected;

    /* do something */
    $scope.doSomething = function() {
        console.log("doing something with " + selected[0]);
    }
}])

// Register work to be performed after loading all modules
.run(['context', 'entities', 'ermrestClientFactory', function(context, entities, ermrestClientFactory) {
    // This example gets all entities from the context serivce, catalog,
    // schema, and table.
    client = ermrestClientFactory.getClient(context.serviceURL);
    catalog = client.getCatalog(context.catalogID);
    catalog.introspect().then(function(schemas) {
        var schema = schemas[context.schemaName];
        if (schema) {
            var table = schema.getTable(context.tableName);
            if (table) {
                table.getEntities().then(function(_entities) {
                    for (var i in _entities) {
                        entities.push(_entities[i]);
                    } // for _entities
                }, function(response) {
                    console.log(response);
                }); // getEntities
            } // if table
            else {
                console.log("ERROR: no table for " + context.tableName);
            } // else
        } // if schema
        else {
            console.log("ERROR: no schema for " + context.schemaName);
        } // else
    }, function(response) {
        console.log(response);
    }); // introspect
}]);
