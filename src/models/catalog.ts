// models
import { Annotation, Annotations } from '@isrd-isi-edu/ermrestjs/src/models/annotation';
import type { AnnotationContent, CatalogJSON, RightsJSON, SchemaJSON } from '@isrd-isi-edu/ermrestjs/src/models/ermrest-json';
import { MalformedURIError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import { Schema, Schemas } from '@isrd-isi-edu/ermrestjs/src/models/schema';
import type { Server } from '@isrd-isi-edu/ermrestjs/src/models/server';
import type { Table } from '@isrd-isi-edu/ermrestjs/src/models/table';

// services
import CatalogService from '@isrd-isi-edu/ermrestjs/src/services/catalog';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';
import ErrorService from '@isrd-isi-edu/ermrestjs/src/services/error';

// utils
import { contextHeaderName, _annotations, _constraintTypes, _ERMrestFeatures } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

// legacy
import { _determineDisplayName, _processACLAnnotation } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { ForeignKeyRef } from './foreign-key';
import { Key } from './key';

/**
 * Container of the Catalog objects of a server, keyed by catalog id.
 */
export class Catalogs {
  _server: Server;
  _catalogs: Record<string, Catalog>;

  /**
   * @param server the server object.
   */
  constructor(server: Server) {
    this._server = server;
    this._catalogs = {};
  }

  /** not implemented (crud stub kept from the legacy api) */
  create(): void {}

  /**
   * Returns the length of the catalogs.
   */
  length(): number {
    return Object.keys(this._catalogs).length;
  }

  /**
   * Returns an array of names of catalogs.
   */
  names(): string[] {
    return Object.keys(this._catalogs);
  }

  /**
   * Get a catalog by id. This call does catalog introspection.
   * @param id Catalog ID.
   * @param dontFetchSchema whether we should fetch the schemas
   * @return a promise that returns the catalog if resolved or
   *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
   *     {@link ERMrest.NotFoundError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
   */
  get(id: string, dontFetchSchema?: boolean) {
    // do introspection here and return a promise

    const defer = ConfigService.q.defer<Catalog>();
    let catalog: Catalog;

    // create a new catalog object if the object has not been created before
    if (id in this._catalogs) {
      catalog = this._catalogs[id];
    } else {
      catalog = new Catalog(this._server, id);
    }

    // make sure the catalog is introspected.
    // the introspect function might or might not
    catalog
      ._introspect(dontFetchSchema)
      .then(() => {
        /**
         * TODO the catalog id might have changed if the version was corrected.
         * with the current implementation, the next time this function is called,
         * it will not use the cached catalog and will create a new one (so a new request).
         * We might be able to improve this in the future.
         */
        this._catalogs[id] = catalog;
        defer.resolve(catalog);
      })
      .catch((error: unknown) => {
        defer.reject(error);
      });

    return defer.promise;
  }
}

/**
 * A catalog in the ermrest model.
 */
export class Catalog {
  /**
   * For internal use only. A reference to the server instance.
   */
  server: Server;

  /**
   * The catalog identifier.
   */
  id: string;

  version?: string;

  _uri: string;

  schemas: Schemas;

  /**
   * The ERMrest features that the catalog supports
   */
  features: Record<string, boolean>;

  _jsonCatalog: CatalogJSON | null;

  _schemaFetched: boolean;

  // this property is needed by _determineDisplayName
  name: string;

  /**
   * Indicates whether the version in the catalog ID was corrected to match the server's snaptime.
   */
  versionCorrected: boolean;

  _nameStyle: Record<string, unknown>; // Used in the displayname to store the name styles.

  // the following are all populated during introspection (_introspect and _fetchSchema):

  snaptime?: string;

  rights?: RightsJSON;

  annotations!: Annotations;

  /**
   * whether catalog is generated.
   * This should be done before initializing tables because tables require this field.
   */
  isGenerated!: boolean | null;

  /**
   * whether catalog is immutable.
   * true: catalog is immutable (per annotation)
   * false: catalog is mutable (per annotation)
   * null: annotation is not defined
   */
  isImmutable!: boolean | null;

  /**
   * whether catalog is non-deletable
   */
  isNonDeletable!: boolean | null;

  _chaiseConfig?: AnnotationContent | null;

  /**
   * @param server the server object.
   * @param id the catalog id.
   */
  constructor(server: Server, id: string) {
    this.server = server;

    this.id = id;

    const catalogSnapshot = id.split('@');
    if (catalogSnapshot.length === 2) {
      this.version = catalogSnapshot[1];
    }

    this._uri = server.uri + '/catalog/' + id;

    this.schemas = new Schemas();

    this.features = {};

    for (const f in _ERMrestFeatures) {
      this.features[_ERMrestFeatures[f as keyof typeof _ERMrestFeatures]] = false;
    }

    this._jsonCatalog = null;

    this._schemaFetched = false;

    // this property is needed by _determineDisplayName
    this.name = id;

    this.versionCorrected = false;

    this._nameStyle = {};

    // NOTE we still haven't fetched the catalog, so we don't have the catalog annotation here.
  }

  /** not implemented (crud stub kept from the legacy api) */
  delete(): void {}

  /**
   * Can be used to send a request and get the catalog object from server.
   * @param contextHeaderParams - properties to log under the dcctx header
   * @param ignoreCache - whether we should ignore the cache and fetch new object
   * @return a promise that returns the catalog json if resolved or
   *      {@link ERMrest.ERMrestError} if rejected
   */
  _get(contextHeaderParams?: object, ignoreCache?: boolean) {
    const defer = ConfigService.q.defer<CatalogJSON>();
    const headers: Record<string, unknown> = {};

    if (ignoreCache !== true && isObjectAndNotNull(this._jsonCatalog)) {
      defer.resolve(this._jsonCatalog!);
      return defer.promise;
    }

    if (contextHeaderParams) {
      headers[contextHeaderName] = contextHeaderParams;
    } else {
      headers[contextHeaderName] = {
        action: ':,catalog;load',
        catalog: this.id,
      };
    }

    this.server.http.get(this._uri, { headers: headers }).then(
      (response: { data: CatalogJSON }) => {
        if (!isObjectAndNotNull(this._jsonCatalog)) {
          this._jsonCatalog = response.data;
        }
        defer.resolve(response.data);
      },
      (error: unknown) => {
        defer.reject(error);
      },
    );

    return defer.promise;
  }

  /**
   * This will return the snapshot from the catalog request instead of schema,
   * because it will return the snapshot based on the model changes.
   * @param contextHeaderParams - properties to log under the dcctx header
   * @return a promise that returns json object or snaptime if resolved or
   *      {@link ERMrest.ERMrestError} if rejected
   */
  currentSnaptime(contextHeaderParams?: object) {
    const defer = ConfigService.q.defer();
    if (!isObjectAndNotNull(contextHeaderParams)) {
      contextHeaderParams = {
        action: ':,catalog/snaptime;load',
        catalog: this.id,
      };
    }

    this._get(contextHeaderParams, true).then(
      (response: CatalogJSON) => {
        defer.resolve(response.snaptime);
      },
      (error: unknown) => {
        defer.reject(error);
      },
    );

    return defer.promise;
  }

  /**
   * fetch the schemas of the catalog and create the appropriate objects
   */
  _fetchSchema() {
    const defer = ConfigService.q.defer();

    if (this._schemaFetched) {
      defer.resolve();
      return defer.promise;
    }

    const headers: Record<string, unknown> = {};
    headers[contextHeaderName] = {
      action: ':,catalog/schema;load',
      catalog: this.id,
    };

    this.server.http
      .get(this._uri + '/schema', { headers: headers })
      .then((response: { data: { rights: RightsJSON; schemas: Record<string, SchemaJSON> } }) => {
        const jsonSchemas = response.data;

        this._schemaFetched = true;

        this.rights = jsonSchemas.rights;

        for (const s in jsonSchemas.schemas) {
          this.schemas._push(new Schema(this, jsonSchemas.schemas[s]));
        }

        // all schemas created
        // build foreign keys for each table in each schema
        const schemaNames = this.schemas.names();
        let schema, tables, table;
        for (let s = 0; s < schemaNames.length; s++) {
          schema = this.schemas.get(schemaNames[s]);
          tables = schema.tables.names();
          for (let t = 0; t < tables.length; t++) {
            table = schema.tables.get(tables[t]);
            table._buildForeignKeys();
          }
        }

        // find alternative tables and populate source definitions
        // requires foreign keys built
        // and source definitions need to be populated beforehand
        for (let s = 0; s < schemaNames.length; s++) {
          schema = this.schemas.get(schemaNames[s]);
          tables = schema.tables.names();
          for (let t = 0; t < tables.length; t++) {
            table = schema.tables.get(tables[t]);
            table._findAlternatives();
          }
        }

        defer.resolve();
      })
      .catch((response: unknown) => {
        defer.reject(response);
      });

    return defer.promise;
  }

  /**
   * @return a promise that returns json object or catalog schema if resolved or
   *     {@link ERMrest.TimedOutError}, {@link ERMrest.InternalServerError}, {@link ERMrest.ServiceUnavailableError},
   *     {@link ERMrest.NotFoundError}, {@link ERMrest.ForbiddenError} or {@link ERMrest.UnauthorizedError} if rejected
   */
  _introspect(dontFetchSchema?: boolean) {
    const defer = ConfigService.q.defer();

    // load the catalog (or use the one that is cached)
    this._get()
      .then((response: CatalogJSON) => {
        this.snaptime = response.snaptime;

        let versionCorrected = false;
        if (isStringAndNotEmpty(this.version) && this.version !== this.snaptime) {
          this.version = this.snaptime;
          this.id = this.id.split('@')[0] + '@' + this.version;
          this.versionCorrected = true;
          versionCorrected = true;
        }

        if ('features' in response) {
          for (const k in this.features) {
            this.features[k] = response.features![k];
          }
        }

        this.annotations = new Annotations();
        for (const uri in response.annotations) {
          this.annotations._push(new Annotation('catalog', uri, response.annotations[uri]));
        }

        this.isGenerated = _processACLAnnotation(this.annotations, _annotations.GENERATED, false);

        this.isImmutable = _processACLAnnotation(this.annotations, _annotations.IMMUTABLE, null);

        this.isNonDeletable = _processACLAnnotation(this.annotations, _annotations.NON_DELETABLE, false);

        /**
         * this will make sure the nameStyle is populated on the catalog as well,
         * so schema can use it.
         */
        _determineDisplayName(this, true);

        if (dontFetchSchema === true || this._schemaFetched) {
          defer.resolve({ versionCorrected });
        } else {
          // load all schemas
          this._fetchSchema()
            .then(() => {
              defer.resolve({ versionCorrected });
            })
            .catch((err: unknown) => {
              throw err;
            });
        }
      })
      .catch((response: unknown) => {
        defer.reject(ErrorService.responseToError(response));
      });

    return defer.promise;
  }

  /**
   * returns the constraint object for the pair.
   * @param pair constraint name array. Its length must be two.
   * @param subject the returned must have the same subject, otherwise return null.
   * @throws {NotFoundError} constraint not found
   */
  constraintByNamePair(pair: string[], subject?: _constraintTypes) {
    return CatalogService.getConstraintObject(this.id, pair[0], pair[1], subject);
  }

  // used in ForeignKeyRef to add the defined constraintNames.
  // subject can be one of _constraintTypes
  _addConstraintName(pair: string[], obj: Key | ForeignKeyRef, subject: _constraintTypes): void {
    CatalogService.addConstraintName(this.id, pair[0], pair[1], obj, subject);
  }

  /**
   * Given tableName, and schemaName find the table
   * @param tableName name of the table
   * @param schemaName name of the schema. Can be undefined.
   */
  getTable(tableName: string, schemaName?: string): Table {
    let schema;

    if (!schemaName) {
      const schemas = this.schemas.all();
      for (let i = 0; i < schemas.length; i++) {
        if (schemas[i].tables.names().indexOf(tableName) !== -1) {
          if (!schema) {
            schema = schemas[i];
          } else {
            throw new MalformedURIError('Ambiguous table name ' + tableName + '. Schema name is required.');
          }
        }
      }
      if (!schema) {
        throw new MalformedURIError('Table ' + tableName + ' not found');
      }
    } else {
      schema = this.schemas.get(schemaName);
    }

    return schema.tables.get(tableName);
  }

  /**
   * the chaise config object from the catalog annotation
   */
  get chaiseConfig(): AnnotationContent | null {
    if (this._chaiseConfig === undefined) {
      if (this.annotations.contains(_annotations.CHAISE_CONFIG)) {
        this._chaiseConfig = this.annotations.get(_annotations.CHAISE_CONFIG).content;
      } else {
        this._chaiseConfig = null;
      }
    }
    return this._chaiseConfig;
  }
}
