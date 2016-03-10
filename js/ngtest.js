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
                console.log(rows);
            }, function(response) {
                console.log(response);
            });

            // get entities with filters.js
            //var gtFilter = new BinaryPredicate("dataset_id", "::gt::", "12969");
            //var ltFilter = new BinaryPredicate("dataset_id", "::lt::", "12969");
            //var eqFilter = new BinaryPredicate("dataset_id", "=", "12969");
            //
            //t1.entity.get(eqFilter).then(function(rows) {
            //    console.log(rows);
            //}, function(response) {
            //    console.log(response);
            //});
            //
            //t1.entity.get(gtFilter).then(function(rows) {
            //    console.log(rows);
            //}, function(response) {
            //    console.log(response);
            //});
            //
            //t1.entity.get(ltFilter).then(function(rows) {
            //    console.log(rows);
            //}, function(response) {
            //    console.log(response);
            //});

            // conjunction and negation filters.js
            //var notGtFilter = new Negation(gtFilter);
            //var notLtFilter = new Negation(ltFilter);
            //var conjFilter = new Conjunction([notGtFilter, notLtFilter]);
            //var disjFilter = new Disjunction([gtFilter, ltFilter]);
            //
            //t1.entity.get(conjFilter).then(function(rows) {
            //    console.log(rows);
            //}, function(response) {
            //    console.log(response);
            //});
            //
            //
            //t1.entity.get(disjFilter).then(function(rows) {
            //    console.log(rows);
            //}, function(response) {
            //    console.log(response);
            //});
            //
            //// Unary Predicate filter
            //var unary = new UnaryPredicate("dataset_id", "::null::");
            //
            //t1.entity.get(unary).then(function(rows) {
            //    console.log(rows);
            //}, function(response) {
            //    console.log(response);
            //});


            //get entity from datapath
            var datapath1 = new DataPath($http, $q, t1);
            console.log("Datapath 1 context table name: " + datapath1.context._table.name);
            console.log("Datapath 1 URI: " + datapath1.getUri());
            datapath1.entity.get().then(function(data){
                console.log(data);
            }, function(response) {
                console.log("Datapath 1 get failed: " + response);
            });

            datapath1.extend(t2);
            console.log(datapath1.context._table.name);
            console.log(datapath1.getUri());

            datapath1.extend(t3);
            console.log(datapath1.context._table.name);
            console.log(datapath1.getUri());

            // create entities
            //var rows = [
            //    {"dataset_id":4277,"chromosome":"chr14","start_position":11111111,"end_position":22222222},
            //    {"dataset_id":4421,"chromosome":"chr14","start_position":33333333,"end_position":44444444}];
            //
            //t1.entity.post(rows).then(function(data){
            //    console.log(data);
            //
            //    t1.entity.get().then(function(rows) {
            //        console.log(rows);
            //    }, function(response) {
            //        console.log(response);
            //    });
            //}, function(response) {
            //    console.log(response);
            //});



        }, function(response) {
            console.log(response);
        });
}]);