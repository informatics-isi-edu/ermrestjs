(function() {
    module._injectHandlerbarMathHelpers = function(Handlebars) {

        Handlebars.registerHelper({
            add: function (arg1, arg2) {
                return Number(arg1) + Number(arg2);
            },

            subtract: function (arg1, arg2) {
                return Number(arg1) - Number(arg2);
            }
        });
    };
}());
