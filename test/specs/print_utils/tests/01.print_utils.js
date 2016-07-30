exports.execute = function (options) {
    var module = options.includes.ermRest;
    describe("For pretty printing values based on a value's type, ", function () {
        // Test Cases:
        it('_printFloat() should format floats correctly.', function () {
            var _printFloat = module._printFloat;
            var options = {numDecDigits: 4};
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
            expect(_printInteger(12341234)).toBe('12,341,234');
            expect(_printInteger(0001)).toBe('1');
            expect(_printInteger(233)).toBe('233');
            expect(_printInteger(23.)).toBe('23');
            expect(_printInteger(23.000000000)).toBe('23');
            expect(_printInteger(.0000)).toBe('0');
            expect(_printInteger(23.101)).toBe('23');
            expect(_printInteger(.1)).toBe('0');
        });

        it('_printDate() should format dates correctly.', function () {
            var _printDate = module._printDate;
            expect(_printDate(null)).toBe('');
            expect(_printDate('2012-04-25 13:00:00.00 PST', {
                separator: '.',
                leadingZero: true
            })).toBe('2012.04.25');
            expect(function() {
                _printDate(123.45)
            }).toThrowError(module.InvalidInputError);
        });

        it('_printTimestamp() should format timestamps correctly.', function () {
            var _printTimestamp = module._printTimestamp;
            expect(_printTimestamp(null)).toBe('');
            expect(_printTimestamp('2015-04-25')).toBe('4/24/2015, 5:00:00 PM');
            expect(function() {
                _printTimestamp()
            }).toThrowError(module.InvalidInputError);
        });

        it('_printText() should format text correctly.', function() {
            var _printText = module._printText;
            expect(_printText(null)).toBe('');
            expect(_printText("<b>Some text! &amp;</b>")).toBe('<b>Some text! &amp;</b>');
        });

        it('_printMarkdown() should process the markdown into html.', function() {
            var _printMarkdown = module._printMarkdown;
            expect(_printMarkdown(null)).toBe('');
            expect(_printMarkdown('*markdown*')).toBe('<em>markdown</em>');
            expect(_printMarkdown('markdown')).toBe('markdown');
            expect(_printMarkdown("![a random image](random_image.com)"))
                .toBe('<img src="random_image.com" alt="a random image">');
            expect(_printMarkdown('H~2~0')).toBe('H<sub>2</sub>0');
            expect(_printMarkdown('13^th^')).toBe('13<sup>th</sup>');
        });
    });
};
