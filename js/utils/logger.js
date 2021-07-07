var logMethods = [
    "trace",
    "debug",
    "info",
    "warn",
    "error"
];
var noop = function () { };

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

    self.enableAll = function () {
        self.setLevel(self.levels.TRACE);
    };

    self.disableAll = function () {
        self.setLevel(self.levels.SILENT);
    };

    self.bindMethod = bindMethod;
}

module._log = new Logger();
module._log.setLevel("info");