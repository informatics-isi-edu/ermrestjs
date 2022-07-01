/**
 * Make sure to have ermrest on the same server (cross origin issues)
 * 
 * The location of ermrestjs must be consistent with what's used while building ermrestjs
 * By default it would be in the /ermrest/ermrest.js location. Please refer to installation
 * guide on how you can customize this location by defining environment variables.
 */

(function () {
  'use strict';

  angular
    .module('sample', ['ermrestjs', 'ngSanitize'])

    .constant('context', {
      serviceURL: 'https://dev.isrd.isi.edu/ermrest'
    })

    .factory('UriUtils', ['context', '$window', function (context, $window) {

      /**
      * @function
      * @param {String} str string to be encoded.
      * @desc
      * converts a string to an URI encoded string
      */
      function fixedEncodeURIComponent(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
          return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
      }

      /**
       * The function that will be passed to ermrestjs for appLinkFn
       * TODO this sample function is discarding different contexts, usually you
       * want to map different contexts to different locations
       * @param {string} tag the tag that is defined in the annotation. If null, should use context.
       * @param {ERMrest.Location} location the location object that ERMrest will return.
       * @param {string} context - optional, used to determine default app if tag is null/undefined
       * @returns {string} url the chaise url
       */
      function appLinkFn(tag, location, context) {
        var baseUrl = $window.location.href.replace($window.location.hash, '');
        return baseUrl + '/#' + fixedEncodeURIComponent(location.catalog) + '/' + location.path;
      }

      function hashToERMrestURL() {
        var hash = $window.location.hash;
        if (hash === undefined || hash == '' || hash.length == 1) {
          return '';
        }

        var catalogId = hash.substring(1).split('/')[0];
        hash = hash.substring(hash.indexOf('/') + 1);

        return [context.serviceURL, 'catalog', catalogId, 'entity', hash].join('/');
      }

      return {
        appLinkFn: appLinkFn,
        hashToERMrestURL: hashToERMrestURL
      };
    }])

    .run(['ERMrest', '$rootScope', 'UriUtils', function (ERMrest, $rootScope, UriUtils) {

      // register the applink function
      ERMrest.appLinkFn(UriUtils.appLinkFn);

      // generate the ermestjs uri
      var uri = UriUtils.hashToERMrestURL();
      if (!uri) {
        $rootScope.hasError = true;
        throw new Error('Hash is required');
      }

      ERMrest.resolve(uri, { cid: 'demo' }).then(function (reference) {
        reference = reference.contextualize.compact;
        $rootScope.reference = reference;
        $rootScope.hasLoaded = true;
        $rootScope.columns = reference.columns;

        return reference.read(20);
      }).then(function (page) {
        $rootScope.page = page;
        $rootScope.hasData = true;
      }).catch(function (err) {
        $rootScope.hasError = true;
        throw err;
      });

    }]);
})();
