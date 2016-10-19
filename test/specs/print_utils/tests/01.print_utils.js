exports.execute = function (options) {
    var module = options.includes.ermRest;
    var formatUtils = module._formatUtils;
    describe("For pretty printing values based on a value's type, ", function () {
        // Test Cases:
        it('printFloat() should format floats correctly.', function () {
            var printFloat = formatUtils.printFloat;
            var options = {numDecDigits: 4};
            expect(printFloat(null)).toBe('');
            expect(printFloat(1234.0, options)).toBe('1,234.0000');
            expect(printFloat(23.0)).toBe('23.00');
            expect(printFloat(.000)).toBe('0.00');
        });

        it('printBoolean() should format booleans correctly.', function () {
            var printBoolean = formatUtils.printBoolean;
            expect(printBoolean(null)).toBe('');
            expect(printBoolean(true)).toBe('true');
            expect(printBoolean(false)).toBe('false');
        });

        it('printInteger() should format integers correctly.', function () {
            var printInteger = formatUtils.printInteger;
            expect(printInteger(null)).toBe('');
            expect(printInteger(12341234)).toBe('12,341,234');
            expect(printInteger(0001)).toBe('1');
            expect(printInteger(233)).toBe('233');
            expect(printInteger(23.)).toBe('23');
            expect(printInteger(23.000000000)).toBe('23');
            expect(printInteger(.0000)).toBe('0');
            expect(printInteger(23.101)).toBe('23');
            expect(printInteger(.1)).toBe('0');
            expect(printInteger(.5)).toBe('1');
            expect(printInteger(-435.00)).toBe('-435');
            expect(printInteger(-1435.00)).toBe('-1,435');
        });

        it('printDate() should format dates correctly.', function () {
            var printDate = formatUtils.printDate;
            expect(printDate(null)).toBe('');
            expect(printDate('2012-04-25 13:00:00.00 PST', {
                separator: '.',
                leadingZero: true
            })).toBe('2012.04.25');
            expect(function() {
                printDate(123.45)
            }).toThrowError(module.InvalidInputError);
        });

        it('printTimestamp() should format timestamps correctly.', function () {
            var printTimestamp = formatUtils.printTimestamp;
            var testTime = '2011-05-06T08:25:25-07:00';
            expect(printTimestamp(null)).toBe('');
            /* Default behavior w/o options parameter = transform time via toLocaleString().
            Cannot use a static timestamp because toLocaleString() will return
            different values in different test environments. */
            expect(printTimestamp(testTime)).toBe(new Date(testTime).toLocaleString());
            expect(function() {
                printTimestamp()
            }).toThrowError(module.InvalidInputError);
        });

        it('printText() should format text correctly.', function() {
            var printText = formatUtils.printText;
            expect(printText(null)).toBe('');
            expect(printText("<b>Some text! &amp;</b>")).toBe('<b>Some text! &amp;</b>');
        });

        it('printMarkdown() should process Markdown into HTML.', function() {
            var printMarkdown = formatUtils.printMarkdown;
            expect(printMarkdown(null)).toBe('');
            expect(printMarkdown('*markdown*')).toBe('<p><em>markdown</em></p>\n');
            expect(printMarkdown('markdown')).toBe('<p>markdown</p>\n');
            expect(printMarkdown("![a random image](random_image.com)"))
                .toBe('<p><img src="random_image.com" alt="a random image"></p>\n');
            expect(printMarkdown('H~2~0')).toBe('<p>H<sub>2</sub>0</p>\n');
            expect(printMarkdown('13^th^')).toBe('<p>13<sup>th</sup></p>\n');
            
            // Check for iframe ith height and width
            expect(printMarkdown('::: iframe [Chaise](https://dev.isrd.isi.edu/chaise/search){width=800 height=300} \n:::'))
                .toBe('<figure class="embed-block"><figcaption class="embed-caption">Chaise</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/search" width="800" height="300" ></iframe></figure>');
            
            // Check for anchor tags
            expect(printMarkdown('[NormalLink](https://dev.isrd.isi.edu/chaise/search)'))
                .toBe('<p><a href=\"https://dev.isrd.isi.edu/chaise/search\">NormalLink</a></p>\n');
        
            // Check for link tag with download attribute
            expect(printMarkdown('[Link With Download](https://code.jquery.com/jquery-3.1.0.js){download .btn .btn-primary}'))
                .toBe('<p><a href="https://code.jquery.com/jquery-3.1.0.js" download="" class="btn btn-primary">Link With Download</a></p>\n');
            
            // Check for image tag with size
            expect(printMarkdown('**Image With Size** \n ![ImageWithSize](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){width=800 height=300}'))
                .toBe('<p><strong>Image With Size</strong><br>\n<img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="ImageWithSize" width="800" height="300"></p>\n');
            
            // Check for thumbnail with link to original image
            expect(printMarkdown("[![Image](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){width=500 height=400}](https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg){target=_blank}"))
                .toBe('<p><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank"><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image" width="500" height="400"></a></p>\n');

            // Check for thumbnail with link to original image and a caption
            expect(printMarkdown(":::image [Skyscrapers](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){height=200 link=https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg} \n:::"))
                .toBe('<figure class="embed-block" style="display:inline-block;"><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank"><figcaption class="embed-caption">Skyscrapers</figcaption><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" height="200"  /></a></figure>');

            // Check for iframe tag with a link and caption
            var iframeMarkdown = ':::iframe [SOME LINK CAPTION](https://dev.isrd.isi.edu/chaise/search){height=400 link=https://dev.isrd.isi.edu/chaise/search} \n:::';
            var iframeHTML = '<figure class="embed-block"><figcaption class="embed-caption"><a href="https://dev.isrd.isi.edu/chaise/search" target="_blank">SOME LINK CAPTION</a></figcaption><iframe src="https://dev.isrd.isi.edu/chaise/search" height="400"  ></iframe></figure>';
            expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML);

            // Check for dropdown tag
            var dropdownMarkdown = ':::dropdown MYCAPTION{.btn-lg} [CAPTION1](https://dev.isrd.isi.edu/chaise/search){.btn .btn-danger} [CAPTION2](https://dev.isrd.isi.edu/chaise/search) [CAPTION3](https://dev.isrd.isi.edu/chaise/search) \n:::';
            var dropdownHTML = '<div class="btn-group markdown-dropdown"><button type="button"  class="btn btn-primary btn-lg">MYCAPTION</button><button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"  class="btn btn-primary dropdown-toggle btn-lg"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button><ul class="dropdown-menu"><li><a href="https://dev.isrd.isi.edu/chaise/search" class="btn btn-danger" >CAPTION1</a></li><li><a href="https://dev.isrd.isi.edu/chaise/search" >CAPTION2</a></li><li><a href="https://dev.isrd.isi.edu/chaise/search" >CAPTION3</a></li></ul></div>';
            expect(printMarkdown(dropdownMarkdown)).toBe(dropdownHTML);  

            expect(printMarkdown(iframeMarkdown + "\n" + dropdownMarkdown)).toBe(iframeHTML + dropdownHTML);

        });

        it('printGeneSeq() should format gene sequences correctly.', function() {
            var printGeneSeq = formatUtils.printGeneSeq;
            expect(printGeneSeq(null)).toBe('');
            expect(printGeneSeq('sample', {increment: 0})).toBe('<code>sample</code>');
            var testCases = [
                {
                    input: 'as',
                    defaultFormat: '<code>as</code>',
                    negativeIncrement: '<code>a s</code>',
                    incrementOf5WithDashes: '<code>as</code>',
                },
                {
                    input: 'GATCTCGATGACTGAGAGGTA',
                    defaultFormat: '<code>GATCTCGATG ACTGAGAGGT A</code>',
                    negativeIncrement: '<code>G A T C T C G A T G A C T G A G A G G T A</code>',
                    incrementOf5WithDashes: '<code>GATCT-CGATG-ACTGA-GAGGT-A</code>',
                }
            ];

            for (var i = 0, len = testCases.length; i < len; i++) {
                var testCase = testCases[i];
                expect(printGeneSeq(testCase.input)).toBe(testCase.defaultFormat);
                expect(printGeneSeq(testCase.input, {increment: -34})).toBe(testCase.negativeIncrement);
                expect(printGeneSeq(testCase.input, {separator: '-', increment: 5})).toBe(testCase.incrementOf5WithDashes);
            }
        });

        it('module._renderTemplate() should function correctly for Null and Non-null values', function() {
            expect(module._renderTemplate("My name is {{name}}", {name: 'John'})).toBe("My name is John");
            expect(module._renderTemplate("My name is {{name}}", { name: null })).toBe(null);
            expect(module._renderTemplate("My name is {{name}}", {})).toBe(null);
            expect(module._renderTemplate("My name is {{#name}}{{name}}{{/name}}", {})).toBe("My name is ");
            expect(module._renderTemplate("My name is {{^name}}{{name}}{{/name}}", {})).toBe("My name is ");
            expect(module._renderTemplate("My name is {{^name}}John{{/name}}", {})).toBe("My name is John");
        });

        var obj = {
            str: "**somevalue ] which is ! special and [ contains special <bold> characters 12/26/2016 ( and **",
            "m1": "[a markdown link](http://example.com/foo)",
            "m2": "[a markdown link](http://example.com/foo/\\(a,b\\))",
            "u2": "http://example.com/foo/(a,b)",
            "p": "messy(){}[]<>/;,$=*punctuation",
            "n": "ǝɯɐu",
            "ǝɯɐu": "name"
        };

        var templateCases = [{
              "template": "{{{m1}}}",
              "after_mustache": "[a markdown link](http://example.com/foo)",
              "after_render": "<p><a href=\"http://example.com/foo\">a markdown link</a></p>"
            }, {
              "template": "{{{m2}}}",
              "after_mustache": "[a markdown link](http://example.com/foo/\\(a,b\\))",
              "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
            }, {
              "template": "[a markdown link]({{#escape}}{{u2}}{{/escape}})",
              "after_mustache": "[a markdown link](http:\\/\\/example\\.com\\/foo\\/\\(a,b\\))",
              "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
            }, {
              "template": "[a markdown link](http://example.com/foo/id={{#escape}}({{#encode}}{{{p}}}{{/encode}}){{/escape}})",
              "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
              "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
              "note": "here, the escape block protects the bare parens for us"
            }, {
              "template": "[a markdown link](http://example.com/foo/id=\\({{#encode}}{{p}}{{/encode}}\\))",
              "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
              "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
              "note": "here, I markdown-escape the bare parens myself for the same final output HTML"
            }, {
              "template": "[a markdown link](http:://example.com/foo/{{{ǝɯɐu}}}={{{n}}})",
              "after_mustache": "[a markdown link](http:://example.com/foo/name=ǝɯɐu)",
              "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
              "note": "the URL in this HTML is not actually valid according to RFC 3986!"
            }, {
              "template": "[a markdown link](http:://example.com/foo/{{ǝɯɐu}}={{#encode}}{{n}}{{/encode}})",
              "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
              "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
              "note": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu"
            }, {
              "template": "[a markdown link](http:://example.com/foo/{{#escape}}{{ǝɯɐu}}={{#encode}}{{n}}{{/encode}}{{/escape}})",
              "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
              "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
              "note1": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu",
              "note2": "the {{#escape}}...{{/escape}} is unnecessary here but doesn't hurt anything"
            }, {
                "template" : "[{{str}}](https://dev.isrd.isi.edu/key={{str}})",
                "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **)",
                "after_render": '<p>[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)</p>',
                "note": "With no encoding and escaping. Should give malformed HTML"
            },{
                "template" : "[{{str}}](https://dev.isrd.isi.edu/key={{#encode}}{{str}}{{/encode}})",
                "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                "after_render": '<p>[**somevalue ] which is ! special and <a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A"> contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                "note": "With encoding but no escaping. Should give malformed HTML with a valid link but invalid caption"
            },{
                "template" : "[{{#escape}}{{str}}{{/escape}}](https://dev.isrd.isi.edu/key={{str}})",
                "after_mustache": "[\\*\\*somevalue \\] which is \\! special and \\[ contains special &lt;bold&gt; characters 12\\/26\\/2016 \\( and \\*\\*](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **)",
                "after_render": '<p>[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)</p>',
                "note": "With escaping but no encoding. Should give malformed HTML"
            },{
                "template" : "[{{#escape}}{{str}}{{/escape}}](https://dev.isrd.isi.edu/key={{#encode}}{{str}}{{/encode}})",
                "after_mustache": "[\\*\\*somevalue \\] which is \\! special and \\[ contains special &lt;bold&gt; characters 12\\/26\\/2016 \\( and \\*\\*](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                "after_render": '<p><a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A">**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                "note": "With encoding and escaping. Should give correct HTML with valid caption a link"
            }];

        it('module._renderTemplate() and module._renderMarkdown() should function correctly for Markdown Escaping and Encoding', function() {
            var printMarkdown = formatUtils.printMarkdown;  
            
            templateCases.forEach(function(ex) {
                var template = module._renderTemplate(ex.template, obj);
                expect(template).toBe(ex.after_mustache);
                var html = printMarkdown(template);
                expect(html).toBe(ex.after_render + '\n');
            });
        });

    });
};
