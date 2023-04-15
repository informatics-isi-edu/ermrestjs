const q = require('q');
const requireReload = require('./require-reload.js').reload;
const includes = require(__dirname + '/../utils/ermrest-init.js').init();
const ermrestUtils = require('@isrd-isi-edu/ermrest-data-utils');

/**
 * This function will import all the given schemas.
 * It's using the bulk ermrest API. We didn't want to change all the config files,
 * so this function is taking care of changing the config files to the new
 * config file that the ErmrestDataUtils expects for bulk creation api.
 * @param  {string[]} configFilePaths list of configuration file locations.
 * @param  {string} catalogId         the catalog id (might be undefined)
 */
exports.importSchemas = function (configFilePaths, catalogId) {
  var defer = q.defer(), entities = {}, schemas = {}, catalog = {};
  var config, schema, schemaName;

  if (!configFilePaths || configFilePaths.length === 0) {
    return defer.resolve({ catalogId: catalogId, entities: {} }), defer.promise;
  }

  // for the structure of settings, please refer to ErmrestDataUtils
  var settings = {
    url: includes.url,
    authCookie: includes.authCookie
  };

  configFilePaths.forEach(function (filePath) {
    config = requireReload(process.env.PWD + "/test/specs" + filePath);

    // copy annotations and ACLs over to the submitted catalog object
    if (config.catalog && typeof config.catalog === "object") {
      // if empty object, this loop is skipped
      for (var prop in config.catalog) {
        // if property is set already
        if (catalog[prop]) {
          console.log(prop + " is already defined on catalog object, overriding previously set value with new one")
        }
        catalog[prop] = config.catalog[prop];
      }
    }

    schemas[config.schema.name] = {
      path: config.schema.path
    };

    if (config.entities) {
      schemas[config.schema.name].entities = config.entities.path;
    }
  });

  //NOTE we're not honoring the catalog object that is passed in each config
  //     so if you add any acls there, it will be ignored.
  //     if we want to add a default acl, it should be added here.
  // honoring the catalog object now, anything defined in it will be passed to ErmrestDataUtils
  // NOTE: the catalog is not created here, so we will continue to ignore the catalog object.
  //     Default ACLs are being set in jasmine-runner-utils.js
  settings.setup = { catalog: catalog, schemas: schemas };
  if (catalogId) {
    settings.setup.catalog.id = catalogId;
  }

  ermrestUtils.createSchemasAndEntities(settings).then(function (data) {
    process.env.catalogId = data.catalogId;

    // create the entities object
    if (data.schemas) {
      for (schemaName in data.schemas) {
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
    defer.resolve({ entities: entities, catalogId: data.catalogId });
  }).catch(function (err) {
    console.log("error while importing the schemas.");
    defer.reject(err);
  });

  return defer.promise;
};


exports.importAcls = function (params) {
  var defer = q.defer();
  ermrestUtils.importACLS({
    url: includes.url,
    authCookie: includes.authCookie,
    setup: params
  }).then(function () {
    defer.resolve();
  }, function (err) {
    defer.reject(err);
  });
  return defer.promise;
};

exports.setCatalogAnnotations = function (id, annotations) {
  return new Promise((resolve, reject) => {
    ermrestUtils.createOrModifyCatalog(
      { url: includes.url, id },
      annotations,
      null,
      includes.authCookie
    ).then(() => resolve()).catch((err) => reject(err));
  });
};

var cleanup = function (configFilePaths, defer, catalogId, deleteCatalog) {

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
    url: includes.url,
    authCookie: includes.authCookie
  }).then(function (data) {
    cleanup(configFilePaths, defer, catalogId, deleteCatalog);
  }, function (err) {
    defer.reject(err);
  }).catch(function (err) {
    console.log(err);
    defer.reject(err);
  });
};

exports.tear = function (configFilePaths, catalogId, deleteCatalog) {
  var defer = q.defer();

  if (!configFilePaths || !configFilePaths.length || !catalogId) {
    defer.resolve();
    return defer.promise;
  }

  configFilePaths = configFilePaths.reverse();

  cleanup(configFilePaths, defer, catalogId, deleteCatalog);

  return defer.promise;
};
