// placeholder for version=xxxxxxxxxx; written by makefile
var _scriptsLoaded = false, _defers = [];

// Check for whether the environment is Node.js or Browser
if (typeof module === 'object' && module.exports && typeof require === 'function') {

    /*
     *  Call configure with node.js request-q package for Http and
     *  q library for promise
     */
    ERMrest.configure(require('request-q'), require('q'));

    /*
     * Expose authCookie function, to reset ermrest cookie
     */
    ERMrest.resetUserCookie = function() {
        ERMrest._http.setDefaults({
            json: true
        });
    };

    /*
     * Expose authCookie function, to set ermrest cookie
     */
    ERMrest.setUserCookie = function(authCookie) {
        ERMrest._http.setDefaults({
            headers: { 'Cookie': authCookie || '' },
            json: true
        });
    };

    /*
     * Inject _moment module in ERMrest
     */
    ERMrest._moment = require('moment-timezone');

    /*
     * Inject _mustache module in ERMrest
     */
    ERMrest._mustache = require('mustache');

    /*
     * Inject _handlebars module in ERMrest as well as its helpers
     */
    ERMrest._handlebars = require('handlebars');
    ERMrest._injectHandlebarHelpers();

    /*
     * Inject _markdownIt module in ERMrest
     * Make markdownit use Sub, Sup and Attrs plugin
     */
    ERMrest._markdownIt = require('markdown-it')({ typographer : true, breaks: true })
                            .use(require('markdown-it-sub')) // add subscript support
                            .use(require('markdown-it-sup')) // add superscript support;
                            .use(require('../vendor/markdown-it-span')) // add span support
                            .use(require('../vendor/markdown-it-attrs.js')); // add attrs support


    // set custom markdown tags using markdown-it-container plugin
    ERMrest._bindCustomMarkdownTags(ERMrest._markdownIt, require("markdown-it-container"));

    ERMrest._LZString = require('lz-string');

    ERMrest._SparkMD5 = require('spark-md5');

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
      /* Load script from url and calls callback once it's loaded */
      var scriptTag = document.createElement('script');
      scriptTag.setAttribute("type", "text/javascript");
      // version variable is added in the makefile by the prepend-version command
      scriptTag.setAttribute("src", url + "?v=" + version);
      if (typeof callback !== "undefined") {
        if (scriptTag.readyState) {
          /* For old versions of IE */
          scriptTag.onreadystatechange = function () {
            if (this.readyState === 'complete' || this.readyState === 'loaded') {
              setTimeout(callback, 20);
            }
          };
        } else {
          scriptTag.onload = callback;
        }
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

    var ermrestJsPath = "../../ermrestjs/";

    /*
     * Call this function to load all dependent scripts in order
     * NOTE: This function does not always preserve the order of loading scripts
     */
    loadScripts([

        // lz-string script
        ermrestJsPath + "vendor/lz-string.min.js",

        ermrestJsPath + "vendor/spark-md5.min.js",

        // Moment.js script required for moment-timezone
        // NOTE: Moment-Timezone.js and dependent plugin scripts are attached to the bottom of vendor/moment.min.js because of the above note
        ermrestJsPath + "vendor/moment.min.js",
        // Mustache script
        ermrestJsPath + "vendor/mustache.min.js",
        // Handlebars script
        ermrestJsPath + "vendor/handlebars.min.js",
        // Markdown-it and dependent plugin scripts
        ermrestJsPath + "vendor/markdown-it.min.js",

        ermrestJsPath + "vendor/markdown-it-sub.min.js",
        ermrestJsPath + "vendor/markdown-it-sup.min.js",
        ermrestJsPath + "vendor/markdown-it-span.js",
        ermrestJsPath + "vendor/markdown-it-attrs.js",
        ermrestJsPath + "vendor/markdown-it-container.min.js"],
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
