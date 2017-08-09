angular.module("testApp", ['ermrestjs'])

    .controller('mainController', ['ermrestServerFactory', function(ermrestServerFactory) {

        var server = ermrestServerFactory.getServer('https://dev.isrd.isi.edu/ermrest', {cid: 'ermrestjs-test'});

        console.log(server);

        // if authentication required, do it here

        // build catalog schemas
        server.catalogs.get(1).then(function(catalog){

            console.log(catalog);
            console.log(catalog.schemas.get("legacy"));

            // check tables
            try {
                var t1 = catalog.schemas.get("legacy").tables.get("dataset_chromosome");
                var t2 = catalog.schemas.get("legacy").tables.get("dataset");
                var t3 = catalog.schemas.get("legacy").tables.get("dataset_mouse_gene");
                var t4 = catalog.schemas.get("legacy").tables.get("fake_table");
            } catch (e) {
                console.log("Error getting table: ");
                console.log(e);
            }

            // check column and annotations
            try {

                var c1 = t1.columns.get("dataset_id");
                console.log(c1);
                console.log(c1.annotations.names());
            } catch (e) {
                console.log("Error getting column: ");
                console.log(e);
            }

            // check keys
            try {
                var colsets1 = t1.keys.colsets();
                console.log(colsets1);
                var colsets2 = t2.keys.colsets();
                console.log(colsets2);
            } catch (e) {
                console.log("Error getting colset: ");
                console.log(e);
            }


            // get all entities from table
            t1.entity.get().then(function(rows) {
                console.log("Get all rows from dataset_chromosome using Table.entity.get()");
                console.log(rows);
                // get a Row from Rows
                console.log(rows.get(0));
            }, function(error) {
                console.log("Error getting entities from table " + t1.name + ":");
                console.log(error);
            });

            // get entities with filters.js
            var gtFilter = new ERMrest.BinaryPredicate(c1, ERMrest.OPERATOR.GREATER_THAN, "12969");
            var ltFilter = new ERMrest.BinaryPredicate(c1, ERMrest.OPERATOR.LESS_THAN, "12969");
            var eqFilter = new ERMrest.BinaryPredicate(c1, ERMrest.OPERATOR.EQUAL, "12969");

            t1.entity.get(eqFilter).then(function(rows) {
                //console.log(rows);
            }, function(error) {
                console.log("Error getting entities from table with filter");
                console.log(error);
            });

            t1.entity.get(gtFilter, 5, ["dataset_id", "start_position"], [{"column": "start_position", "order": "desc"}]).then(function(rows) {
                console.log("Test Table.entity.get() with filter, limit, columns and sort. \n" +
                    "Get from table dataset_chromosome with dataset_id > 12969, \n" +
                    "limited columns to dataset_id and start_position, \n" +
                    "sort by start_position in decending order, limit to 5 rows");
                console.log(rows);
            }, function(error) {
                console.log(error);
            });

            t1.entity.get(ltFilter).then(function(rows) {
                //console.log(rows);
            }, function(error) {
                console.log(error);
            });

            // conjunction and negation filters.js
            var notGtFilter = new ERMrest.Negation(gtFilter);
            var notLtFilter = new ERMrest.Negation(ltFilter);
            var conjFilter = new ERMrest.Conjunction([notGtFilter, notLtFilter]);
            var disjFilter = new ERMrest.Disjunction([gtFilter, ltFilter]);

            t1.entity.get(conjFilter).then(function(rows) {
                //console.log(rows);
            }, function(response) {
                console.log(response);
            });


            t1.entity.get(disjFilter).then(function(rows) {
                //console.log(rows);
            }, function(response) {
                console.log(response);
            });

            // Unary Predicate filter
            var unary = new ERMrest.UnaryPredicate(c1, ERMrest.OPERATOR.NULL);

            t1.entity.get(unary).then(function(rows) {
                //console.log(rows);
            }, function(response) {
                console.log(response);
            });

            // use foreign to get referenced table values (with limit)
            t1.foreignKeys.all()[0].getDomainValues(10).then(function(data) {
                //console.log(data);
            }, function(response) {
                console.log(response);
            });

        }, function(error) {
            console.log("Error getting catalog:");
            console.log(error);
        });


    }])

    .controller('editController', ['ermrestServerFactory', function(ermrestServerFactory){

        var server = ermrestServerFactory.getServer('https://dev.isrd.isi.edu/ermrest');

        // build catalog schemas
        server.catalogs.get(1).then(function(catalog){
            var t1 = catalog.schemas.get("legacy").tables.get("dataset_chromosome");


            // post: create entities
            var rows = [
                {"dataset_id":4277,"chromosome":"chr14","start_position":11111111,"end_position":22222222},
                {"dataset_id":4421,"chromosome":"chr14","start_position":33333333,"end_position":44444444}];

            t1.entity.post(rows).then(function(data){
                console.log(data);

                t1.entity.get().then(function(rows) {
                    console.log(rows);
                }, function(response) {
                    console.log(response);
                });


                // put: modify entities
                var rows = [
                    {"dataset_id":4277,"chromosome":"chr14","start_position":11111111,"end_position":33333333},
                    {"dataset_id":4421,"chromosome":"chr14","start_position":33333333,"end_position":55555555}];

                t1.entity.put(rows).then(function(data){
                    console.log(data);


                    // delete: delete entities using table.entity
                    var colStartPos = t1.columns.get("start_position");
                    var delFilter1 = new ERMrest.BinaryPredicate(colStartPos, ERMrest.OPERATOR.EQUAL, "11111111");

                    t1.entity.delete(delFilter1).then(function(data){
                        console.log("Delete successful");
                    }, function(response){
                        console.log(response);
                    });

                    // delete entity using datapath
                    var datapath = new ERMrest.DataPath(t1);
                    var pathtable = datapath.context;
                    var pathcolumn = pathtable.columns.get("start_position");
                    var delFilter2 = new ERMrest.BinaryPredicate(pathcolumn, ERMrest.OPERATOR.EQUAL, "33333333");

                    datapath.entity.delete(delFilter2).then(function(data) {
                        console.log("delete successful");
                    }, function(response) {
                        console.log(response);
                    });

                }, function(response){
                console.log(response);
                });



            }, function(response) {
            console.log(response);
            });


        }, function(response) {
            console.log(response);
        });
    }])

.controller("ReferenceController", ['ERMrest', function(ERMrest) {
    var ref;
    ERMrest.resolve("https://dev.isrd.isi.edu/ermrest/catalog/1/entity/legacy:dataset/id::gt::1000&id::lt::5000@sort(id::desc::)", {cid: "test"}).then(function(reference) {
        console.log("Reference:", reference);
        ref = reference;
        return reference.read(10);
    }).then(function getPage(page) {
        // sorted by id
        console.log(page.tuples.map(function(tuple){
            return tuple._data.id;
        }));

        // change sort
        return ref.sort([{"column":"accession", "descending":true}]).read(10);
    }, function error(response) {
        throw response;
    }).then(function(page){

        // sorted by accession
        console.log(page.tuples.map(function(tuple){
            return tuple._data.accession;
        }));
    }, function(error) {
        throw error;
    }).catch (function genericCatch(exception) {
    });


    ERMrest.resolve("https://dev.isrd.isi.edu/ermrest/catalog/1/entity/legacy:dataset/id::gt::1000&id::lt::5000@sort(id)@after(4898)", {cid: "test"}).then(function(reference) {
        console.log("Reference:", reference);
        ref = reference;
        return reference.read(10);
    }).then(function getPage(page) {
        // sorted by id
        console.log(page.tuples.map(function(tuple){
            return tuple._data.id;
        }));

        return page.previous.read(10);
    }, function error(response) {
        throw response;
    }).then(function(page){

        console.log(page.tuples.map(function(tuple){
            return tuple._data.id;
        }));
    }, function(error) {
        throw error;
    }).catch (function genericCatch(exception) {
    });
}]);
