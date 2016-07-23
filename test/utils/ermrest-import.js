var q = require('q');
var requireReload = require('./require-reload.js').reload;
var includes = require(__dirname + '/../utils/ermrest-init.js').init();
var ermrestUtils = require('ermrest-data-utils');

var importSchemas = function(configFilePaths, defer, catalogId) {
	if (configFilePaths.length == 0) {
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
    	importSchemas(configFilePaths, defer, data.catalogId);
    }, function (err) {
        console.log("Unable to import data");
        console.dir(err);
        defer.reject(err);
    });
};

exports.importSchemas = function(configFilePaths, catalogId) {
	var defer = q.defer();
	if (!configFilePaths || !configFilePaths.length) {
		defer.resolve();
		return defer.promise;
	}

	importSchemas(configFilePaths.slice(0), defer, catalogId);
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
        console.log("Unable to delete data");
        console.dir(err);
        defer.reject(err);
    });
};

exports.tear = function(configFilePaths, catalogId, deleteCatalog) {
	var defer = q.defer();
	
	if (!configFilePaths || !configFilePaths.length || !catalogId) {
		defer.resolve();
		return defer.promise;
	}
	
	cleanup(configFilePaths, defer, catalogId, deleteCatalog);

	return defer.promise;
};
