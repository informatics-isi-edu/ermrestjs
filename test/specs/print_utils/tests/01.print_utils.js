exports.execute = function (options) {
    var module = options.includes.ermRest;
    describe("For pretty printing values based on a value's type, ", function () {
        // Test Cases:
        it('_printFloat() should format floats correctly.', function () {
            var _printFloat = module._printFloat;
            var options = {
                numDecDigits: 4
            };
            expect(_printFloat(null)).toBe('');
            expect(_printFloat(1234.0, options)).toBe('1,234.0000');
            expect(_printFloat(23.0)).toBe('23.00');
            expect(_printFloat(.000)).toBe('0.00');
        });

        it('_printBoolean() should format booleans correctly.', function () {
            var _printBoolean = module._printBoolean;
            expect(_printBoolean(null)).toBe('');
            expect(_printBoolean(true)).toBe('true');
            expect(_printBoolean(false)).toBe('false');
        });

        it('_printInteger() should format integers correctly.', function () {
            var _printInteger = module._printInteger;
            expect(_printInteger(null)).toBe('');
            expect(_printInteger(1234.56)).toBe('1,234');
            expect(_printInteger(0001)).toBe('1');
        });
    });
};
