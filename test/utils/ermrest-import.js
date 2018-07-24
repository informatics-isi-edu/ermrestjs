var q = require('q');
var requireReload = require('./require-reload.js').reload;
var includes = require(__dirname + '/../utils/ermrest-init.js').init();
var ermrestUtils = require(process.env.PWD + "/../ErmrestDataUtils/import.js");

exports.importSchemas = function (configFilePaths, catalogId) {
  var defer = q.defer(), entities = {}, schemas = {};
  var config, schema, schemaName;

  if (!configFilePaths || configFilePaths.length === 0) {
    return defer.resolve({catalogId: catalogId, entities: {}}), defer.promise;
  }

  var settings = {
    url: includes.url,
    authCookie: includes.authCookie
  };

  configFilePaths.forEach(function (filePath) {
    config = requireReload(process.env.PWD + "/test/specs" + filePath);
    schemas[config.schema.name] = {
      path: config.schema.path
    };

    if (config.entities) {
      schemas[config.schema.name].entities = config.entities.path;
    }
  });

  settings.setup = {catalog: {}, schemas: schemas};
  if (catalogId) {
    settings.setup.catalog.id =  catalogId;
  }

  ermrestUtils.createSchemasAndEntities(settings).then(function (data) {
    process.env.catalogId = data.catalogId;
    if (data.schemas) {
      for(schemaName in data.schemas) {
        if (!data.schemas.hasOwnProperty(schemaName)) continue;

        schema = data.schemas[schemaName];
        entities[schema.name] = {};

        for (var t in schema.tables) {
          if (!schema.tables.hasOwnProperty(t)) continue;

          entities[schema.name][t] = schema.tables[t].entities;
        }
      }
      console.log("Attached entities for the schemas");
    }
    defer.resolve({entities: entities, catalogId: data.catalogId});
  }).catch(function (err) {
    defer.reject(err);
  });

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
