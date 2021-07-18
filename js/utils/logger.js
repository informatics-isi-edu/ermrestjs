/**
 * The way the logger works is through levels as explained here https://sematext.com/blog/logging-levels/
 * Please check dev-guide.md for more details
 */
var logMethods = [
    "trace",
    "debug",
    "info",
    "warn",
    "error"
];
var noop = function () { };

/**
 * Bind the console logging methods to the methods of logging exposed by logger
 * @param {*} obj 
 * @param {*} methodName trace/debug/info/warn/error
 */
function bindMethod(obj, methodName) {
    if (typeof console === "undefined") {
        return false;
    } else if (console[methodName] !== undefined) {
        var method = obj[methodName];
        if (typeof method.bind === 'function') {
            return method.bind(obj);
        } else {
            try {
                return Function.prototype.bind.call(method, obj);
            } catch (e) {
                return function () {
                    return Function.prototype.apply.apply(method, [obj, arguments]);
                };
            }
        }
    }
    else {
        return noop;
    }
}

/**
 * Methods are bound to console logging methods if the logging level is below the set level of logging else it goes to no-op
 * For example, if logging level is warn then info logs will be suppressed but error logs will be working
 * @param {*} level trace/debug/info/warn/error
 */
function replaceLoggingMethods(level) {
    for (var i = 0; i < logMethods.length; i++) {
        var methodName = logMethods[i];
        this[methodName] = (i < level) ? noop : bindMethod(console, methodName);
    }
}

function Logger() {
    var self = this;
    var currentLevel;

    self.levels = {
        "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
        "ERROR": 4, "SILENT": 5
    };

    self.getLevel = function () {
        return currentLevel;
    };

    self.setLevel = function (level) {
        if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
            level = self.levels[level.toUpperCase()];
        }
        if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
            currentLevel = level;
            replaceLoggingMethods.call(self, level);
        } else {
            throw "Logger called with invalid level: " + level;
        }
    };

    /**
     * Enables all logs no matter what level
     */
    self.enableAll = function () {
        self.setLevel(self.levels.TRACE);
    };

    /**
     * Disables all logs no matter what level
     */
    self.disableAll = function () {
        self.setLevel(self.levels.SILENT);
    };

    self.bindMethod = bindMethod;
}

module._log = new Logger();
// Currently set level is info but eventually this should be coming from chaise-config and set to info only if nothing is setup there
module._log.setLevel("info");