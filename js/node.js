if (typeof module === 'object' && module.exports && typeof require === 'function') {
    ERMrest.configure(require('request-q'), require('q'));
    ERMrest.setUserCookie = function(authCookie) {
    	ERMrest._http.setDefaults({
		    headers: { 'Cookie': authCookie || '' },
		    json: true
		});
    };
    ERMrest._markdownIt = require('markdown-it')()
    						.use(require('markdown-it-sub')) // add subscript support
        					.use(require('markdown-it-sup')); // add superscript support;
    module.exports = ERMrest;
} else {
    window.ERMrest = ERMrest;
    ERMrest._markdownIt = window.markdownit()
    			.use(window.markdownitSub)
    			.use(window.markdownitSup);
}