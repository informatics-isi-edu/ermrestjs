import axios from 'axios';

import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

import { InvalidInputError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import { isObjectAndNotNull } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { simpleDeepCopy } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';

export type AppLinkFnType = (tag: string, location: any, context: string) => string;

export default class ConfigService {
  private static _http = axios;
  // private static _q: any;
  private static _clientConfig: any;
  private static _session: any;
  private static _appLinkFn: AppLinkFnType;
  private static _systemColumnsHeuristicsMode: (context: string) => any;

  /**
   * This function is used to configure the module
   * @param http any http service (like Angular $http or axios)
   * @param q Any promise library (like Angular $q or Q library)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static configure(http: any, q: any) {
    // TODO this function is added for backwards compatibility with the old code and should eventually be removed.
    // ConfigService._http = axios;
    // ConfigService._q = q;
    $log.warn('ConfigService.configure is deprecated and will eventually be removed. You do not need to call it anymore.');
  }

  static get http() {
    return ConfigService._http;
  }

  /**
   * This function will be called to set the config object
   */
  static async setClientConfig(clientConfig: any) {
    return new Promise<void>((resolve) => {
      const inp = isObjectAndNotNull(clientConfig) ? clientConfig : {};
      const res: Record<string, any> = {};

      // defaults used when `clientConfig` wasn't properly initialized in chaise or other webapps
      const defaultConfig: Record<string, { type: string; value: any }> = {
        internalHosts: { type: 'array', value: [] },
        disableExternalLinkModal: { type: 'boolean', value: false },
        facetPanelDisplay: { type: 'object', value: {} },
        templating: { type: 'object', value: {} },
      };

      // make sure the value is correct and has the valid type
      for (const key in defaultConfig) {
        if (!Object.prototype.hasOwnProperty.call(defaultConfig, key)) continue;
        const def = defaultConfig[key as keyof typeof defaultConfig];

        if (def.type === 'array') {
          res[key] = Array.isArray(inp[key]) ? inp[key] : def.value;
        } else if (typeof inp[key] === def.type) {
          res[key] = inp[key];
        } else {
          res[key] = def.value;
        }
      }

      ConfigService._clientConfig = res;

      // now that the client-config is done, call the functions that are using it:
      // TODO 2025-refactoring
      // module
      //   .onload()
      //   .then(function () {
      //     module._markdownItLinkOpenAddExternalLink();
      //     return defer.resolve(), defer.promise;
      //   })
      //   .catch(function (err) {
      //     // fail silently
      //     module._log.error("couldn't apply the client-config changes");
      //     return defer.resolve(), defer.promise;
      //   });

      resolve();
    });
  }

  static get clientConfig() {
    return ConfigService._clientConfig;
  }

  /**
   * check whether the client config is set or not
   */
  static verifyClientConfig(dontThrowError?: boolean) {
    if (ConfigService._clientConfig === null || ConfigService._clientConfig === undefined) {
      if (dontThrowError) return false;
      throw new InvalidInputError('this function requires cliet-config which is not set properly.');
    }
    return true;
  }

  static setClientSession(session: object) {
    ConfigService._session = simpleDeepCopy(session);
  }

  static get session() {
    return ConfigService._session;
  }

  static setAppLinkFn(fn: AppLinkFnType) {
    ConfigService._appLinkFn = fn;
  }

  /**
   * Given an app tag, location object and context will return the full url.
   * @param tag the tag that is defined in the annotation. If null, should use context.
   * @param location the location object that ERMrest will return.
   * @param context - optional, used to determine default app if tag is null/undefined
   */
  static get appLinkFn() {
    return ConfigService._appLinkFn;
  }

  static setSystemColumnsHeuristicsMode(fn: (context: string) => any) {
    ConfigService._systemColumnsHeuristicsMode = fn;
  }

  static get systemColumnsHeuristicsMode() {
    return ConfigService._systemColumnsHeuristicsMode;
  }

  /**
   * Expose authCookie function, to reset ermrest cookie
   * NOTE meant to be used only in node environments
   */
  static resetUserCookie() {
    ConfigService._http.defaults.headers.common.Cookie = '';
  }

  /**
   * Expose authCookie function, to set ermrest cookie
   * NOTE meant to be used only in node environments
   */
  static setUserCookie(authCookie: string) {
    ConfigService._http.defaults.withCredentials = true;
    ConfigService._http.defaults.headers.common.Cookie = authCookie || '';
  }
}
