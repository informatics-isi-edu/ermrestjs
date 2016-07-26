exports.reload = function(name) {
    var id = require.resolve(name),
        oldCache = require.cache[id];
    delete require.cache[id];
    try {
        return require(id);
    } catch (e) {
        if (oldCache !== undefined) {
            require.cache[id] = oldCache; //restore the old cache since the new failed
        }
        throw e;
    }
    return null;	
};