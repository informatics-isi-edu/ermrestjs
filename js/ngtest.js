/*
 * Copyright 2015 University of Southern California
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

angular.module('testApp', ['ERMrest'])

// Create, updated, delete single entity
.controller('entityTestController', ['ermrestClientFactory', function(ermrestClientFactory) {
    client = ermrestClientFactory.getClient('https://dev.misd.isi.edu/ermrest', null);
    console.log(client);
    catalog = client.getCatalog(4); // dev server catalog 1 => fb
    catalog.introspect().then(function(schemas) {
        console.log(schemas);
        var table = schemas['rbk'].getTable('roi');
        console.log(table);

        // create, update then delete entity
        var data = [{
            "image_id":11,
            "timestamp":"2015-12-21T17:43:30.609-08:00",
            "anatomy":null,
            "context_uri":"https://dev.rebuildingakidney.org/~jessie/openseadragon-viewer/mview.html?url=https://dev.rebuildingakidney.org/data/8fed0117fc94d16590a46d58bf66c9b43c04ea0135d9c0eea3c1a52f2c9e4c12/Brigh/ImageProperties.xml&x=0.5&y=0.25750542661546166&z=0.5473114658864339",
            "coords":[-0.0566818558782389,0.0384655409052141,0.10898569923144,0.0769310818104284]}];

        table.createEntity(data, ['id', 'author']).then(function(response) {
            console.log("created");
            console.log(response);

            var id = response[0].id;

            // see all entities
            table.getEntities().then(function(entities) {
                console.log(entities);
            });

            var filter = "id=" + id;
            var filteredTable = table.getFilteredTable([filter]);
            filteredTable.getEntities().then(function(entities) {
                console.log(entities);

                // update entity
                entities[0].data.image_id = 13;
                entities[0].data.timestamp = "2016-12-21T17:44:50.609-08:00";
                entities[0].update().then(function(response) {
                    console.log("update successful");
                    console.log(response);

                    // delete entity
                    entities[0].delete().then(function(response){
                        console.log("deletion successful");

                        // see all entities
                        table.getEntities().then(function(entities) {
                            console.log(entities);
                        });

                    }, function(response) {
                        console.log("deletion failed");
                    })

                    table.getEntities().then(function(entities) {
                        console.log(entities);
                    });
                }, function(response) {
                    console.log("update failed");
                    table.getEntities().then(function(entities) {
                        console.log(entities);
                    });
                });

            });


        }, function(response) {
            console.log("creation failed");
            console.log(response);
        })

    });
}])

// create, update, delete multiple entities
.controller('multipleUpdateTestController', ['ermrestClientFactory', '$q', function(ermrestClientFactory, $q) {
    client = ermrestClientFactory.getClient('https://dev.misd.isi.edu/ermrest', null);
    console.log(client);
    catalog = client.getCatalog(4); // dev server catalog 1 => fb
    catalog.introspect().then(function(schemas) {
        console.log(schemas);
        var table = schemas['rbk'].getTable('roi');

        // create, update then delete entity
        var data = [{
            "image_id":11,
            "author":"isi",
            "timestamp":"2015-12-21T17:43:30.609-08:00",
            "anatomy":null,
            "context_uri":"https://dev.rebuildingakidney.org/~jessie/openseadragon-viewer/mview.html?url=https://dev.rebuildingakidney.org/data/8fed0117fc94d16590a46d58bf66c9b43c04ea0135d9c0eea3c1a52f2c9e4c12/Brigh/ImageProperties.xml&x=0.5&y=0.25750542661546166&z=0.5473114658864339",
            "coords":[-0.0566818558782389,0.0384655409052141,0.10898569923144,0.0769310818104284]}];

        // create 5 entities
        var promises_c = [];
        for (var i = 0; i < 5; i++) {
            promises_c.push(table.createEntity(data, ['id']));
        }
        $q.all(promises_c).then(function(results) {
            console.log(results);

            var filter = "author=isi";
            var filteredTable = table.getFilteredTable([filter]);
            filteredTable.getEntities().then(function(entities) {
                console.log(entities);

                // update multiple entities at the same time
                for (var j = 0; j < 5; j++) {
                    entities[j].data.author = "jennifer";
                    entities[j].data.image_id = 13;
                }
                filteredTable.updateEntities(entities).then(function(response) {
                    console.log("entities updated");

                    // get entities again to test updated entities
                    var filteredTable2 = table.getFilteredTable(["author=jennifer"]);
                    filteredTable2.getEntities().then(function(entities) {
                        console.log(entities);

                        // delete entities
                        var promises_d = [];
                        for (var k = 0; k < entities.length; k++) {
                            promises_d.push(entities[k].delete());
                        }
                        $q.all(promises_d).then(function(results) {
                            table.getEntities().then(function(entities) {
                                console.log(entities);
                            });
                        });
                    });
                });
            });

        });

    });
}])

.controller('testControllerFB', ['ermrestClientFactory', function(ermrestClientFactory) {
    client = ermrestClientFactory.getClient('https://dev.misd.isi.edu/ermrest', null);
    console.log(client);
    catalog = client.getCatalog(1); // dev server catalog 1 => fb
    catalog.introspect().then(function(schemas) {
        console.log(schemas);
        var table = schemas['legacy'].getTable('dataset');
        console.log(table);
        table.getEntities().then(function(entities) {
            console.log(entities);
            var relatedTable = entities[0].getRelatedTable('legacy', 'dataset_data_type');
            console.log(relatedTable);
            var filteredTable = table.getFilteredTable(["id::gt::200", "id::lt::300"]);
            console.log(filteredTable);
            filteredTable.getEntities().then(function(entities) {
                console.log(entities);
            });
        });
    });
}])

.controller('testControllerRBK', ['ermrestClientFactory', function(ermrestClientFactory) {
    client = ermrestClientFactory.getClient('https://dev.misd.isi.edu/ermrest', null);
    console.log(client);
    catalog = client.getCatalog(4); // dev server catalog 4 => rbk
    catalog.introspect().then(function(schemas) {
        console.log(schemas);
        var table = schemas['rbk'].getTable('image');
        console.log(table);
        var filteredTable = table.getFilteredTable(["id=46"]);
        filteredTable.getEntities().then(function(entities) {
            console.log(entities);
            var roiTable = entities[0].getRelatedTable('rbk', 'roi');
            console.log(roiTable);
            var filteredRoiTable = roiTable.getFilteredTable(["id=25"]);
            console.log(filteredRoiTable);
            filteredRoiTable.getEntities().then(function(roiEntities) {
                console.log(roiEntities);
                commentTable = roiEntities[0].getRelatedTable('rbk', 'roi_comment');
                console.log(commentTable);
                commentTable.getEntities().then(function(commentEntities) {
                    console.log(commentEntities);
                });
            });
        });
    });
}]);
