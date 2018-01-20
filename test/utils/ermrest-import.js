var q = require('q');
var requireReload = require('./require-reload.js').reload;
var includes = require(__dirname + '/../utils/ermrest-init.js').init();
var ermrestUtils = require(process.env.PWD + "/../ErmrestDataUtils/import.js");
process.env.SCHEMAS = {};

var importSchemas = function(configFilePaths, defer, catalogId) {

	if (!configFilePaths.length) {
		defer.resolve(catalogId);
		return;
	}

	var configFilePath = configFilePaths.shift();

	var config = requireReload(process.env.PWD + "/test/specs" + configFilePath);

	if (catalogId) config.catalog.id = catalogId;
	else delete config.catalog.id;

	ermrestUtils.importData({
        setup: config,
        url: includes.url,
        authCookie: includes.authCookie
    }).then(function (data) {
    	process.env.catalogId = data.catalogId;
		if (data.schema) {
			console.log("ATTACHED SCHEMA " + data.schema.name);
			process.env.SCHEMAS[data.schema.name] = data.schema;
		}
    	importSchemas(configFilePaths, defer, data.catalogId);
    }, function (err) {
        defer.reject(err);
    }).catch(function(err) {
    	console.log(err);
    	defer.reject(err);
    });
};

exports.importSchemas = function(configFilePaths, catalogId) {
	var defer = q.defer();
	if (!configFilePaths || !configFilePaths.length) {
		defer.resolve(catalogId);
		return defer.promise;
	}

	importSchemas(configFilePaths.slice(0), defer, catalogId);
	return defer.promise;
};

exports.importAcls = function(params) {
	var defer = q.defer();
	ermrestUtils.importACLS({
		url: includes.url,
        authCookie: includes.authCookie,
        setup: params
	}).then(function() {
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});
	return defer.promise;
};

var cleanup = function(configFilePaths, defer, catalogId, deleteCatalog) {

	if (configFilePaths.length == 0) {
		defer.resolve(catalogId);
		return;
	}

	var configFilePath = configFilePaths.shift();
	var config = requireReload(process.env.PWD + "/test/specs" + configFilePath);

	if (deleteCatalog) {
		configFilePaths = [];
		delete config.catalog.id;
	} else {
		config.catalog.id = catalogId;
	}

	ermrestUtils.tear({
        setup: config,
        catalogId: catalogId,
        url:  includes.url ,
        authCookie : includes.authCookie
    }).then(function(data) {
    	cleanup(configFilePaths, defer, catalogId, deleteCatalog);
    }, function(err) {
        defer.reject(err);
    }).catch(function(err) {
    	console.log(err);
    	defer.reject(err);
    });
};

exports.tear = function(configFilePaths, catalogId, deleteCatalog) {
	var defer = q.defer();

	if (!configFilePaths || !configFilePaths.length || !catalogId) {
		defer.resolve();
		return defer.promise;
	}

	configFilePaths = configFilePaths.reverse();

	cleanup(configFilePaths, defer, catalogId, deleteCatalog);

	return defer.promise;
};
