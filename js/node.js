if (typeof module === 'object' && module.exports && typeof require === 'function') {
    ERMrest.configure(require('request-q'), require('q'));
    ERMrest.setUserCookie = function(authCookie) {
    	ERMrest._http.setDefaults({
		    headers: { 'Cookie': authCookie || '' },
		    json: true
		});
    };
    module.exports = ERMrest;
} else {
    window.ERMrest = ERMrest;
}