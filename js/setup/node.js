var _scriptsLoaded = false, _defers = [];

// Check for whether the environment is Node.js or Browser
if (typeof module === 'object' && module.exports && typeof require === 'function') {

    /*
     *  Call configure with node.js axios package for Http and
     *  q library for promise
     */
    ERMrest.configure(require('axios'), require('q'));

    /*
     * Expose authCookie function, to reset ermrest cookie
     * NOTE meant to be used only in node environments
     */
    ERMrest.resetUserCookie = function() {
        ERMrest._http.defaults.headers.common.Cookie = '';
    };

    /*
     * Expose authCookie function, to set ermrest cookie
     * NOTE meant to be used only in node environments
     */
    ERMrest.setUserCookie = function(authCookie) {
        ERMrest._http.defaults.withCredentials = true;
        ERMrest._http.defaults.headers.common.Cookie = authCookie || '';
    };

    /*
     * Inject _moment module in ERMrest
     */
    ERMrest._moment = require('../vendor/moment.min.js');

    /*
     * Inject _mustache module in ERMrest
     */
    ERMrest._mustache = require('../vendor/mustache.min.js');

    /*
     * Inject _handlebars module in ERMrest as well as its helpers
     */
    ERMrest._handlebars = require('../vendor/handlebars.min.js');
    ERMrest._injectHandlebarHelpers();

    /*
     * Inject _markdownIt module in ERMrest
     * Make markdownit use Sub, Sup and Attrs plugin
     */
    ERMrest._markdownIt = require('../vendor/markdown-it.min.js')({ typographer : true, breaks: true })
                            .use(require('../vendor/markdown-it-sub.min.js')) // add subscript support
                            .use(require('../vendor/markdown-it-sup.min.js')) // add superscript support;
                            .use(require('../vendor/markdown-it-span.js')) // add span support
                            .use(require('../vendor/markdown-it-attrs.js')); // add attrs support


    // set custom markdown tags using markdown-it-container plugin
    // (using the local version to ensure consistency between browser and node versions)
    ERMrest._bindCustomMarkdownTags(ERMrest._markdownIt, require("../vendor/markdown-it-container.min.js"));

    ERMrest._LZString = require('../vendor/lz-string.min.js');

    ERMrest._SparkMD5 = require('../vendor/spark-md5.min.js');

    _scriptsLoaded = true;

    /*
     * Set ERMrest as a module
     */
    module.exports = ERMrest;
} else {
    /*
     * Set ERMrest in window scope
     */
    window.ERMrest = ERMrest;

    /*
     * Utility function to load a script in the page, which invokes the callback once the script has loaded
     * after a 20ms timeout to allow it to load
     */
    var loadScript = function (url, callback) {
      // already injected
      scriptTag = document.querySelector('script[src^="' + url + '"]');
      if (scriptTag) {
          if (typeof callback !== "undefined") {
              if (typeof ermrestjsVendorFileLoaded === "undefined") {
                  // script tag added but the file is not loaded
                  scriptTag.addEventListener('load', callback);
              } else {
                  // the file is completely loaded
                  callback();
              }
          }
          return;
      }

      // ermrestjsBuildVersion variable is added in the makefile by the pre-generate-files-for-build command
      url += "?v=" + ermrestjsBuildVariables.buildVersion;

      /* Load script from url and calls callback once it's loaded */
      scriptTag = document.createElement('script');
      scriptTag.setAttribute("type", "text/javascript");
      scriptTag.setAttribute("src", url);
      if (typeof callback !== "undefined") {
          scriptTag.addEventListener('load', callback);
      }
      (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(scriptTag);
    };

    /*
     * Utility function to include multiple scripts in the page, and then invoke the callback
     */
    var loadScripts = function(urls, callback) {
        var count = 0;
        urls.forEach(function(url) {
            loadScript(url, function() {
              if (++count == urls.length) callback();
            });
        });
    };

    /*
     * Call this function to load all dependent scripts in order
     * NOTE: This function does not always preserve the order of loading scripts
     */
    loadScripts([
        ermrestjsBuildVariables.ermrestjsBasePath + "ermrest.vendor.min.js"
    ],
        function() {
            /*
             * Inject _moment-timezone module in ERMrest as moment
             */
            ERMrest._moment = window.moment;

            /*
             * Inject _mustache module in Ermrest
             */
            ERMrest._mustache = window.Mustache;

            /*
             * Inject _handlebars module in Ermrest as well as its helpers
             */
            ERMrest._handlebars = window.Handlebars;
            ERMrest._injectHandlebarHelpers();

            /*
             * Inject _markdownIt module in ERMrest
             * Make markdownit use Sub, Sup and Attrs plugin
             */
            ERMrest._markdownIt = window.markdownit({ typographer : true, breaks: true })
                    .use(window.markdownitSub)
                    .use(window.markdownitSup)
                    .use(window.markdownItAttrs)
                    .use(window.markdownitSpan);

            // set custom markdown tags using markdown-it-container plugin
            ERMrest._bindCustomMarkdownTags(ERMrest._markdownIt, markdownitContainer);

            ERMrest._LZString = window.LZString;

            ERMrest._SparkMD5 = window.SparkMD5;

            _scriptsLoaded = true;

            if (_defers.length) {
                _defers.forEach(function(defer) {
                    defer.resolve(ERMrest);
                });
            }

    });

}

/**
 * @function
 * @private
 * @returns {Promise} A promise for {@link ERMrest} scripts loaded,
 * This function is used by http. It resolves promises by calling this function
 * to make sure thirdparty scripts are loaded.
 */
ERMrest.onload = function() {
    var defer = ERMrest._q.defer();

    if (_scriptsLoaded) defer.resolve(ERMrest);
    else _defers.push(defer);

    return defer.promise;
};


var startTime = Date.now();
/**
 * @function
 * @returns {integer} A value set to determine the elapsed time
 * since the ermrestJS has been available (milliseconds).
 */
ERMrest.getElapsedTime = function () {
    return Date.now() - startTime;
};
