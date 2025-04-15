import axios from 'axios';

import { InvalidInputError } from '@isrd-isi-edu/ermrestjs/src/models/errors';

import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

import { isObjectAndNotNull } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { simpleDeepCopy } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { MarkdownIt } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { _classNames } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

import { _isSameHost } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { onload } from '@isrd-isi-edu/ermrestjs/js/setup/node';

export type AppLinkFnType = (tag: string, location: any, context: string) => string;

export default class ConfigService {
  private static _http = axios;
  // private static _q: any;
  private static _clientConfig: any;
  private static _session: any;
  private static _appLinkFn: AppLinkFnType;
  private static _systemColumnsHeuristicsMode: (context: string) => any | undefined;

  private static _markdownItDefaultLinkOpenRenderer: any;

  /**
   * This function is used to configure the module
   * @param http any http service (like Angular $http or axios)
   * @param q Any promise library (like Angular $q or Q library)
   * @deprecated
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
      onload()
        .then(() => {
          ConfigService._markdownItLinkOpenAddExternalLink();
          resolve();
        })
        .catch(() => {
          // fail silently
          $log.error("couldn't apply the client-config changes");
          resolve();
        });
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
   * @private
   * @desc
   * Change the link_open function to add classes to links, based on clientConfig
   * It will add
   *  - external-link-icon
   *  - exteranl-link if clientConfig.disableExternalLinkModal is not true
   *
   * NOTE we should call this function only ONCE when the setClientConfig is done
   */
  static _markdownItLinkOpenAddExternalLink() {
    ConfigService.verifyClientConfig();

    // if we haven't changed the function yet, and there's no internalHosts then don't do anything
    if (typeof ConfigService._markdownItDefaultLinkOpenRenderer === 'undefined' && ConfigService.clientConfig.internalHosts.length === 0) {
      return;
    }

    // make sure we're calling this just once
    if (typeof ConfigService._markdownItDefaultLinkOpenRenderer === 'undefined') {
      ConfigService._markdownItDefaultLinkOpenRenderer =
        MarkdownIt.renderer.rules.link_open ||
        function (tokens: any, idx: any, options: any, env: any, self: any) {
          return self.renderToken(tokens, idx, options);
        };
    }

    // the classes that we should add
    let className = _classNames.externalLinkIcon;
    if (ConfigService.clientConfig.disableExternalLinkModal !== true) {
      className += ' ' + _classNames.externalLink;
    }
    MarkdownIt.renderer.rules.link_open = function (tokens, idx, options, env, self) {
      const token = tokens[idx];

      // find the link value
      const hrefIndex = token.attrIndex('href');
      if (hrefIndex < 0 || !token || !token.attrs) return;
      const href = token.attrs[hrefIndex][1];

      // only add the class if it's not the same origin
      if (_isSameHost(href) === false) {
        const cIndex = token.attrIndex('class');
        if (cIndex < 0) {
          token.attrPush(['class', className]);
        } else {
          token.attrs[cIndex][1] += ' ' + className;
        }
      }

      return ConfigService._markdownItDefaultLinkOpenRenderer(tokens, idx, options, env, self);
    };
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
