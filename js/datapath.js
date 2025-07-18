/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { NotFoundError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
// import DeferredPromise from '@isrd-isi-edu/ermrestjs/src/models/deferred-promise';

import ErrorService from '@isrd-isi-edu/ermrestjs/src/services/error';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';

import { contextHeaderName } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { isObject } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent, shallowCopy } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';

// legacy
import { _nextChar } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

/**
 * @memberof ERMrest.Datapath
 * @param {Table} table
 * @constructor
 */
export function DataPath(table) {
  this._nextAlias = 'a'; // TODO better way to doing alias?

  /**
   *
   * @type {Catalog}
   */
  this.catalog = table.schema.catalog;

  /**
   *
   * @type {Datapath.PathTable}
   */
  this.context = new PathTable(table, this, this._nextAlias);

  this._nextAlias = _nextChar(this._nextAlias);

  this.attribute = null;

  this.attributegroup = null;

  this.aggregate = null;

  this.entity._bind(this);

  this._pathtables = [this.context]; // in order

  this._filter = null;

  this.server = this.catalog.server;
}

DataPath.prototype = {
  constructor: DataPath,

  _copy: function () {
    // shallow copy
    var dp = Object.create(DataPath.prototype);
    shallowCopy(dp, this);
    dp.entity._bind(dp);
    return dp;
  },

  /**
   *
   * @param {Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate} filter
   * @returns {Datapath.DataPath} a shallow copy of this datapath with filter
   * @desc
   * this datapath is not modified
   */
  filter: function (filter) {
    var dp = this._copy();
    dp._filter = filter;
    return dp;
  },

  /**
   *
   * @param {Table} table
   * @param context
   * @param link
   * @returns {Datapath.PathTable}
   * @desc extend the Datapath with table
   */
  extend: function (table, context, link) {
    // TODO context? link?
    this.context = new PathTable(table, this, this._nextAlias);
    this._nextAlias = _nextChar(this._nextAlias);
    this._pathtables.push(this.context);
    return this.context;
  },

  _getUri: function () {
    var uri = '';
    for (var i = 0; i < this._pathtables.length; i++) {
      if (i === 0) uri = this._pathtables[i].toString();
      else uri = uri + '/' + this._pathtables[i].toString();
    }

    // filter strings
    if (this._filter !== null) {
      uri = uri + '/' + this._filter.toUri();
    }

    return uri;
  },

  /**
   * @desc
   * entity container
   */
  entity: {
    scope: null,

    _bind: function (scope) {
      this.scope = scope;
    },

    /**
     * @returns {Promise} promise that returns a row data if resolved or
     *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
     *     {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
     */
    get: function (contextHeaderParams) {
      const defer = ConfigService.q.defer();
      var baseUri = this.scope.server.uri;
      var catId = this.scope.catalog.id;
      var uri =
        baseUri + // base
        '/catalog/' +
        catId + // catalog
        '/entity/' + // interface
        this.scope._getUri(); // datapath

      if (!contextHeaderParams || !isObject(contextHeaderParams)) {
        contextHeaderParams = { action: 'get' };
      }
      var headers = {};
      headers[contextHeaderName] = contextHeaderParams;
      this.scope.server.http.get(uri, { headers: headers }).then(
        function (response) {
          defer.resolve(response.data); // TODO rowset?
        },
        function (response) {
          var error = ErrorService.responseToError(response);
          defer.reject(error);
        },
      );

      return defer.promise;
    },

    /**
     *
     * @param {Filters.Negation | ERMrest.Filters.Conjunction | ERMrest.Filters.Disjunction | ERMrest.Filters.UnaryPredicate | ERMrest.Filters.BinaryPredicate} filter
     * @desc delete entities
     * @returns {Promise} promise that returns deleted entities if resolved or
     *     {@link ERMrest.Errors.TimedOutError}, {@link ERMrest.Errors.InternalServerError}, {@link ERMrest.Errors.ServiceUnavailableError},
     *     {@link ERMrest.Errors.ConflictError}, {@link ERMrest.Errors.ForbiddenError} or {@link ERMrest.Errors.UnauthorizedError} if rejected
     */
    delete: function (filter) {
      const defer = ConfigService.q.defer();
      var baseUri = this.scope.server.uri;
      var catId = this.scope.catalog.id;
      var uri = baseUri + '/catalog/' + catId + '/entity/' + this.scope._getUri();

      uri = uri + '/' + filter.toUri();

      this.scope.server.http.delete(uri).then(
        function (response) {
          defer.resolve(response.data);
        },
        function (response) {
          var error = ErrorService.responseToError(response);
          defer.reject(error);
        },
      );

      return defer.promise;
    },
  },
};

/**
 *
 * @memberof ERMrest.Datapath
 * @param {Table} table
 * @param {Datapath.DataPath} datapath
 * @param {string} alias
 * @constructor
 */
function PathTable(table, datapath, alias) {
  /**
   *
   * @type {Datapath.DataPath}
   */
  this.datapath = datapath;

  /**
   *
   * @type {Table}
   */
  this.table = table;

  /**
   *
   * @type {string}
   */
  this.alias = alias;

  /**
   *
   * @type {Datapath.PathColumns}
   */
  this.columns = new PathColumns(table, this); // pathcolumns
}

PathTable.prototype = {
  constructor: PathTable,

  /**
   *
   * @returns {string} uri of the PathTable
   */
  toString: function () {
    return this.alias + ':=' + fixedEncodeURIComponent(this.table.schema.name) + ':' + fixedEncodeURIComponent(this.table.name);
  },
};

/**
 *
 * @memberof ERMrest.Datapath
 * @param {Table} table
 * @param {Datapath.PathTable} pathtable
 */
function PathColumns(table, pathtable) {
  this._table = table;
  this._pathtable = pathtable;
  this._pathcolumns = {};
}

PathColumns.prototype = {
  constructor: PathColumns,

  _push: function (pathcolumn) {
    this._pathcolumns[pathcolumn.column.name] = pathcolumn;
  },

  /**
   *
   * @returns {Number} number of path columns
   */
  length: function () {
    return Object.keys(this._pathcolumns).length;
  },

  /**
   *
   * @returns {String[]} a list of pathcolumn names
   */
  names: function () {
    // TODO order by position
    return Object.keys(this._pathcolumns);
  },

  /**
   *
   * @param {string} colName column name
   * @returns {Datapath.PathColumn} returns the PathColumn
   * @throws {Errors.NotFoundError} column not found
   * @desc get PathColumn object by column name
   */
  get: function (colName) {
    if (colName in this._pathcolumns) return this._pathcolumns[colName];
    else {
      if (this._table.columns.get(colName)) {
        // create new PathColumn
        var pc = new PathColumn(this._table.columns.get(colName), this._pathtable);
        this._pathcolumns[colName] = pc;
        return pc;
      } else {
        throw new NotFoundError('', 'Column not found in table');
      }
    }
  },

  getByPosition: function (pos) {},
};

/**
 * @memberof ERMrest.Datapath
 * @param {Column} column
 * @param {Datapath.PathTable} pathtable
 * @constructor
 */
function PathColumn(column, pathtable) {
  /**
   *
   * @type {Datapath.PathTable}
   */
  this.pathtable = pathtable;

  /**
   *
   * @type {Column}
   */
  this.column = column;

  this.operators = new Operators(); // TODO

  this.pathtable.columns._push(this);
}

/**
 *
 * @memberof ERMrest.Datapath
 */
function Operators() {
  this._operators = {};
}

Operators.prototype = {
  constructor: Operators,

  length: function () {
    return Object.keys(this._operators).length;
  },

  names: function () {
    return Object.keys(this._operators);
  },

  get: function (name) {
    return this._operators[name];
  },
};
