angular.module("testApp", ['ERMrest'])

    .controller('mainController', ['ermrestServerFactory', '$http', '$q', function(ermrestServerFactory, $http, $q) {

        var server = ermrestServerFactory.getServer('https://dev.isrd.isi.edu/ermrest');

        // build catalog schemas
        server.catalogs.get(1).then(function(catalog){

            console.log(catalog);
            console.log(catalog.schemas.get("legacy"));

            // check tables
            var t1 = catalog.schemas.get("legacy").tables.get("dataset_chromosome");
            var t2 = catalog.schemas.get("legacy").tables.get("dataset");
            var t3 = catalog.schemas.get("legacy").tables.get("dataset_mouse_gene");
            console.log(t1);
            console.log(t2);

            // check column and annotations
            var c1 = t1.columns.get("dataset_id");
            console.log(c1);
            console.log(c1.annotations.names());

            // check keys
            var colsets1 = t1.keys.colsets();
            console.log(colsets1);
            var colsets2 = t2.keys.colsets();
            console.log(colsets2);


            // get entities from table
            t1.entity.get().then(function(rows) {
                //console.log(rows);
            }, function(response) {
                console.log(response);
            });

            // get entities with filters.js
            var gtFilter = new ERMrest.BinaryPredicate(c1, ERMrest.OPERATOR.GREATER_THAN, "12969");
            var ltFilter = new ERMrest.BinaryPredicate(c1, ERMrest.OPERATOR.LESS_THAN, "12969");
            var eqFilter = new ERMrest.BinaryPredicate(c1, ERMrest.OPERATOR.EQUAL, "12969");

            t1.entity.get(eqFilter).then(function(rows) {
                //console.log(rows);
            }, function(response) {
                console.log(response);
            });

            t1.entity.get(gtFilter, 5, t1.keys.all()[0].colset.columns).then(function(rows) {
                //console.log(rows);
            }, function(response) {
                console.log(response);
            });

            t1.entity.get(ltFilter).then(function(rows) {
                //console.log(rows);
            }, function(response) {
                console.log(response);
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






            //get entity from datapath
            var datapath1 = new ERMrest.DataPath(t1);
            console.log("Datapath 1 context table name: " + datapath1.context._table.name);
            console.log("Datapath 1 URI: " + datapath1.getUri());
            datapath1.entity.get().then(function(data){
                //console.log(data);
            }, function(response) {
            //    console.log("Datapath 1 get failed: " + response);
            });

            var pathtable2 = datapath1.extend(t2);
            //console.log(datapath1.context._table.name);
            //console.log(datapath1.getUri());

            var pathtable3 = datapath1.extend(t3);
            //console.log(datapath1.context._table.name);
            //console.log(datapath1.getUri());

            // create new datapath from datapath1 with filter
            //var c3 = t3.columns.get("dataset_id");
            var pathcolumn2 = pathtable2.columns.get("id");
            var pathcolumn3 = pathtable3.columns.get("dataset_id");
            var gtFilter3 = new ERMrest.BinaryPredicate(pathcolumn2, ERMrest.OPERATOR.GREATER_THAN, "4542");
            var datapath3 = datapath1.getFilter(gtFilter3);
            //console.log(datapath1);
            //console.log(datapath3);
            console.log(datapath1.getUri());
            console.log(datapath3.getUri());

            datapath3.entity.get().then(function(data){
                console.log(data);
            }, function(response) {
                // console.log("Datapath 1 get failed: " + response);
            });

            /**
            // create entities
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
            }, function(response) {
                console.log(response);
            });
            **/


        }, function(response) {
            console.log(response);
        });
}]);