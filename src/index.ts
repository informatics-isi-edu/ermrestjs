/**
 * This file contains the functions and classes that we want to expose for standalone javascript ermrest bundle
 * vite will attach these to 'ERMrest' namespace which will allow accessing them using `window.ERMrest`
 */
import moment from 'moment-timezone';

// model
import {
  ERMrestError,
  TimedOutError,
  BadRequestError,
  QueryTimeoutError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  IntegrityConflictError,
  DuplicateConflictError,
  PreconditionFailedError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  NoConnectionError,
  InvalidFacetOperatorError,
  InvalidCustomFacetOperatorError,
  InvalidFilterOperatorError,
  InvalidSortCriteria,
  InvalidPageCriteria,
  InvalidInputError,
  InvalidServerResponse,
  MalformedURIError,
  NoDataChangedError,
  BatchUnlinkResponse,
  BatchDeleteResponse,
  UnsupportedFilters,
} from '@isrd-isi-edu/ermrestjs/src/models/errors';

// services
import CatalogService from '@isrd-isi-edu/ermrestjs/src/services/catalog';
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';
import ErrorService from '@isrd-isi-edu/ermrestjs/src/services/error';
// import HTTPService from '@isrd-isi-edu/ermrestjs/src/services/http';

// utils
import { contextHeaderName, ENV_IS_NODE } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';

// legacy imports
import { Checksum, Upload } from '@isrd-isi-edu/ermrestjs/js/hatrac';
import { onload, getElapsedTime } from '@isrd-isi-edu/ermrestjs/js/setup/node';
import printf from '@isrd-isi-edu/ermrestjs/js/format';
import { resolve, _createPage } from '@isrd-isi-edu/ermrestjs/js/reference';
import { ermrestFactory } from '@isrd-isi-edu/ermrestjs/js/core';
import { parse, createPath, createSearchPath, createLocation } from '@isrd-isi-edu/ermrestjs/js/parser';
import {
  _currDate,
  decodeFacet,
  encodeFacet,
  encodeFacetString,
  _formatUtils,
  processMarkdownPattern,
  renderMustacheTemplate,
  _validateMustacheTemplate,
  versionDecodeBase32,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import {
  AttributeGroupColumn,
  AttributeGroupReference,
  AttributeGroupLocation,
  BucketAttributeGroupReference,
} from '@isrd-isi-edu/ermrestjs/js/ag_reference';
import { BinaryPredicate } from '@isrd-isi-edu/ermrestjs/js/filters';
import { DataPath } from '@isrd-isi-edu/ermrestjs/js/datapath';
import HandlebarsService from '@isrd-isi-edu/ermrestjs/src/services/handlebars';
import { Exporter } from '@isrd-isi-edu/ermrestjs/js/export';
import validateJSONLD from '@isrd-isi-edu/ermrestjs/js/json_ld_validator.js';
import { onHTTPSuccess, _certifyContextHeader, setHTTP401Handler } from '@isrd-isi-edu/ermrestjs/js/http';

const logError = ErrorService.logError;
const responseToError = ErrorService.responseToError;

const configure = ConfigService.configure;
const appLinkFn = ConfigService.setAppLinkFn;
const setClientConfig = ConfigService.setClientConfig;
const setClientSession = ConfigService.setClientSession;
const systemColumnsHeuristicsMode = ConfigService.setSystemColumnsHeuristicsMode;
const resetUserCookie = ConfigService.resetUserCookie;
const setUserCookie = ConfigService.setUserCookie;

// const _certifyContextHeader = HTTPService.certifyContextHeader;
// const setHTTP401Handler = HTTPService.setHTTP401Handler;
// const onHTTPSuccess = HTTPService.setOnHTTPSuccess;

const renderHandlebarsTemplate = HandlebarsService.render;

const _clearConstraintNames = CatalogService.clearConstraintNames;

const _fixedEncodeURIComponent = fixedEncodeURIComponent;

// chaise relies on moment
if (!ENV_IS_NODE) {
  window.moment = moment;
}

export {
  // services
  // ConfigService,
  // ErrorService,
  // HTTPService,
  Exporter,

  // constants
  contextHeaderName,

  // functions
  resolve,
  configure,
  appLinkFn,
  _certifyContextHeader,
  ermrestFactory,
  _fixedEncodeURIComponent,
  decodeFacet,
  encodeFacet,
  versionDecodeBase32,
  setClientConfig,
  setClientSession,
  systemColumnsHeuristicsMode,
  onHTTPSuccess,
  setHTTP401Handler,
  getElapsedTime,
  onload,

  // markdown/template/print
  processMarkdownPattern,
  renderHandlebarsTemplate,
  renderMarkdown,
  renderMustacheTemplate,

  // parser
  parse,
  createPath,
  createSearchPath,
  createLocation,

  // attribute group
  AttributeGroupColumn,
  AttributeGroupReference,
  AttributeGroupLocation,
  BucketAttributeGroupReference,

  // hatrac
  Upload,
  Checksum,

  // error:
  logError,
  responseToError,
  ERMrestError,
  TimedOutError,
  BadRequestError,
  QueryTimeoutError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  IntegrityConflictError,
  DuplicateConflictError,
  PreconditionFailedError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  NoConnectionError,
  InvalidFacetOperatorError,
  InvalidCustomFacetOperatorError,
  InvalidFilterOperatorError,
  InvalidSortCriteria,
  InvalidPageCriteria,
  InvalidInputError,
  InvalidServerResponse,
  MalformedURIError,
  NoDataChangedError,
  BatchUnlinkResponse,
  BatchDeleteResponse,
  UnsupportedFilters,

  // used for testing
  resetUserCookie,
  setUserCookie,
  printf,
  _clearConstraintNames,
  _createPage,
  _formatUtils,
  encodeFacetString,
  _validateMustacheTemplate,
  _currDate,
  BinaryPredicate,
  DataPath,
  validateJSONLD,
};
