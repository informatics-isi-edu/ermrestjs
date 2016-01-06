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

.controller('entityTestController', ['ermrestClientFactory', function(ermrestClientFactory) {
    client = ermrestClientFactory.getClient('https://dev.misd.isi.edu/ermrest', null);
    console.log(client);
    catalog = client.getCatalog(4); // dev server catalog 1 => fb
    catalog.introspect().then(function(schemas) {
        console.log(schemas);
        var table = schemas['rbk'].getTable('roi');
        console.log(table);

        // test create entity
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

            // see all rows
            table.getRows().then(function(rows) {
                console.log(rows);
            });

            var filter = "id=" + id;
            var filteredTable = table.getFilteredTable([filter]);
            filteredTable.getRows().then(function(rows) {
                console.log(rows);

                // test delete entity
                rows[0].delete().then(function(response){
                    console.log("deletion successful");

                    // see all rows
                    table.getRows().then(function(rows) {
                        console.log(rows);
                    });

                }, function(response) {
                    console.log("deletion failed");
                })

            });


        }, function(response) {
            console.log("creation failed");
            console.log(response);
        })

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
        table.getRows().then(function(rows) {
            console.log(rows);
            var relatedTable = rows[0].getRelatedTable('legacy', 'dataset_data_type');
            console.log(relatedTable);
            var filteredTable = table.getFilteredTable(["id::gt::200", "id::lt::300"]);
            console.log(filteredTable);
            filteredTable.getRows().then(function(rows) {
                console.log(rows);
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
        filteredTable.getRows().then(function(rows) {
            console.log(rows);
            var roiTable = rows[0].getRelatedTable('rbk', 'roi');
            console.log(roiTable);
            var filteredRoiTable = roiTable.getFilteredTable(["id=25"]);
            console.log(filteredRoiTable);
            filteredRoiTable.getRows().then(function(roiRows) {
                console.log(roiRows);
                commentTable = roiRows[0].getRelatedTable('rbk', 'roi_comment');
                console.log(commentTable);
                commentTable.getRows().then(function(commentRows) {
                    console.log(commentRows);
                });
            });
        });
    });
}]);
