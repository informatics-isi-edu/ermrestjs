// models
import { Catalogs } from '@isrd-isi-edu/ermrestjs/src/models/catalog';
import { InvalidInputError } from '@isrd-isi-edu/ermrestjs/src/models/errors';

// services
import ConfigService from '@isrd-isi-edu/ermrestjs/src/services/config';
import HTTPService from '@isrd-isi-edu/ermrestjs/src/services/http';

// utils
import { contextHeaderName } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

/**
 * An ERMrest server instance. Use `ermrestFactory.getServer` (src/services/ermrest-factory)
 * to create or reuse instances of this class.
 */
export class Server {
  /**
   * The URI of the ERMrest service
   */
  uri: string;

  /**
   * The host of the uri
   */
  host: string;

  /**
   * The wrapped http service for this server instance.
   */
  http: ReturnType<typeof HTTPService.wrapHTTP>;

  /**
   * context-id: shows the id of app that this server is being used for
   */
  cid: string;

  /**
   * page-id: shows the id of the page that this server is being used for
   */
  pid?: string;

  catalogs: Catalogs;

  /**
   * @param uri URI of the ERMrest service.
   * @param contextHeaderParams an object with at least `cid`
   */
  constructor(uri: string, contextHeaderParams: { cid: string; pid?: string }) {
    this.uri = uri;

    this.host = '';
    const hasProtocol = new RegExp('^(?:[a-z]+:)?//', 'i').test(uri);
    if (hasProtocol) {
      const urlParts = uri.split('/');
      if (urlParts.length >= 3) {
        this.host = urlParts[2];
      }
    }

    this.http = HTTPService.wrapHTTP(ConfigService.http);
    this.http.contextHeaderParams = contextHeaderParams;

    this.cid = this.http.contextHeaderParams.cid;

    this.pid = this.http.contextHeaderParams.pid;

    this.catalogs = new Catalogs(this);
  }

  /**
   * should be used to log client action information on the server
   * @param contextHeaderParams - the headers to be logged, should include action
   */
  logClientAction(contextHeaderParams: object) {
    const defer = ConfigService.q.defer();

    // make sure contextHeaderParams is an object and NOT an array
    if (!contextHeaderParams || (contextHeaderParams === Object(contextHeaderParams) && Array.isArray(contextHeaderParams))) {
      const error = new InvalidInputError('Context header params were not passed');
      // Errors for client action logging should not force a terminal error
      defer.reject(error);
      return defer.promise;
    }

    const headers: Record<string, unknown> = {};
    headers[contextHeaderName] = contextHeaderParams;

    const config = {
      headers: headers,
    };

    this.http.head(this.uri + '/client_action', config).then(
      function () {
        defer.resolve();
      },
      function (error: unknown) {
        defer.reject(error);
      },
    );

    return defer.promise;
  }
}
