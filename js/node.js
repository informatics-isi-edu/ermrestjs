// Check for whether the environment is Node.js or Browser
if (typeof module === 'object' && module.exports && typeof require === 'function') {
    
    /*
     *  Call configure with node.js request-q package for Http and
     *  q library for promise
     */
    ERMrest.configure(require('request-q'), require('q'));
    

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
     * Inject _mustache module in Ermrest
     */
    ERMrest._mustache = require('mustache');

    /*
     * Inject _markdownIt module in ERMrest
     * Make markdownit use Sub, Sup and Attrs plugin
     */
    ERMrest._markdownIt = require('markdown-it')()
                            .use(require('markdown-it-sub')) // add subscript support
                            .use(require('markdown-it-sup')) // add superscript support;
                            .use(require('markdown-it-attrs')); // add attrs support

    // set custom markdown tags using markdown-it-container plugin
    ERMrest._bindCustomMarkdownTags(ERMrest._markdownIt, require("markdown-it-container"));

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
      scriptTag.setAttribute("src", url);
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
     */
    loadScripts([
        // Mustache script
        ermrestJsPath + "vendor/mustache.min.js", 

        // Markdown-it and dependent plugin scripts
        ermrestJsPath + "vendor/markdown-it.min.js", 

        ermrestJsPath + "vendor/markdown-it-sub.min.js", 
        ermrestJsPath + "vendor/markdown-it-sup.min.js",
        ermrestJsPath + "vendor/markdown-it-attrs.js",
        ermrestJsPath + "vendor/markdown-it-container.min.js"], 
        function() {
            /*
             * Inject _mustache module in Ermrest
             */
            Ermrest._mustache = window.Mustache;

            /*
             * Inject _markdownIt module in ERMrest
             * Make markdownit use Sub, Sup and Attrs plugin
             */
            ERMrest._markdownIt = window.markdownit()
                    .use(window.markdownitSub)
                    .use(window.markdownitSup)
                    .use(window.markdownItAttrs);

            // set custom markdown tags using markdown-it-container plugin
            ERMrest._bindCustomMarkdownTags(ERMrest._markdownIt, markdownitContainer);
    });

}