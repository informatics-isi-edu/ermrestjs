exports.execute = function (options) {
    var module = options.includes.ermRest;
    var formatUtils = module._formatUtils;
    describe("Print utils, For pretty printing values based on a value's type, ", function () {
        // Test Cases:
        it('printFloat() should format floats correctly.', function () {
            var printFloat = formatUtils.printFloat;
            var options = {numFracDigits: 4};
            expect(printFloat(null)).toBe('');
            expect(printFloat(1234.0, options)).toBe('1,234.0000');
            expect(printFloat(23.0)).toBe('23.0000');
            expect(printFloat(.000)).toBe('0.0000');
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
            expect(printDate('2012-04-25 13:00:00.00 PST')).toBe('2012-04-25');
            expect(function() {
                printDate(123.45)
            }).toThrowError(module.InvalidInputError);
        });

        it('printTimestamp() should format timestamps correctly.', function () {
            var printTimestamp = formatUtils.printTimestamp;
            var testTime = '2011-05-06T13:25:25-07:00';
            expect(printTimestamp(null)).toBe('');
            expect(printTimestamp(testTime)).toBe('2011-05-06 13:25:25');
            expect(function() {
                printTimestamp()
            }).toThrowError(module.InvalidInputError);
        });

        it('printText() should format text correctly.', function() {
            var printText = formatUtils.printText;
            expect(printText(null)).toBe('');
            expect(printText("<b>Some text! &amp;</b>")).toBe('<b>Some text! &amp;</b>');
            expect(printText({key:123})).toBe('{"key":123}');
            expect(printText({key:123,subkey:{subsubkey:456}})).toBe('{"key":123,"subkey":{"subsubkey":456}}');
        });

        it('printJSON() should show stringified version of JSON value.', function() {
            var printJSON = formatUtils.printJSON;
            expect(printJSON(null)).toBe('null');
            expect(printJSON('')).toBe('null');
            expect(printJSON(true)).toBe('true');
            expect(printJSON(false)).toBe('false');
            expect(printJSON(2.9)).toBe('2.9');
            let valueToTest={"name":"testing"};
            let expectedJSON= JSON.stringify(valueToTest,undefined,2);
            expect(printJSON(valueToTest)).toBe(expectedJSON);
        });

        describe("printMarkdown(), ", function () {
            var printMarkdown = formatUtils.printMarkdown;
            var testPrintMarkdown = function (input, expected, error) {
                expect(printMarkdown(input)).toBe(expected, error);
            };

            it ("should return the input if it's invalid format.", function () {
                expect(formatUtils.printMarkdown("[test](test\r.com){.download download}", {inline: true})).toBe("[test](test\r.com){.download download}");
            });

            it ("should support default markdown tags.", function () {
                expect(printMarkdown('*markdown*')).toBe('<p><em>markdown</em></p>\n', "invalid em");
                expect(printMarkdown('markdown')).toBe('<p>markdown</p>\n', "invalid paragraph");
                expect(printMarkdown("![a random image](random_image.com)"))
                    .toBe('<p><img src="random_image.com" alt="a random image"></p>\n', "invalid image");
                // Check for anchor tags
                expect(printMarkdown('[NormalLink](https://dev.isrd.isi.edu/chaise/search)'))
                    .toBe('<p><a href=\"https://dev.isrd.isi.edu/chaise/search\">NormalLink</a></p>\n', "invalid link");
            });

            it ("should return empty string for null.", function () {
                expect(printMarkdown(null)).toBe('');
            });

            it ("should support elements with tags.", function () {
                // Check for link tag with download attribute
                expect(printMarkdown('[Link With Download](https://code.jquery.com/jquery-3.1.0.js){download .btn .btn-primary}'))
                    .toBe('<p><a href="https://code.jquery.com/jquery-3.1.0.js" download="" class="btn btn-primary">Link With Download</a></p>\n', "invalid link with tag");

                // Check for image tag with size
                expect(printMarkdown('**Image With Size** \n ![ImageWithSize](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){width=800 height=300}'))
                    .toBe('<p><strong>Image With Size</strong><br>\n<img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="ImageWithSize" width="800" height="300"></p>\n', "invalid image with tag");

                // Check for thumbnail with link to original image
                expect(printMarkdown("[![Image](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){width=500 height=400}](https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg){target=_blank}"))
                    .toBe('<p><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank"><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" alt="Image" width="500" height="400"></a></p>\n', "invalid thumbnail with tag");
            });

            it ("should support :::iframe.", function () {
                // Check for iframe ith height and width
                expect(printMarkdown('::: iframe [Chaise](https://dev.isrd.isi.edu/chaise/search){width=800 height=300} \n:::'))
                    .toBe('<figure class="embed-block" style=""><figcaption class="embed-caption" style="">Chaise</figcaption><iframe src="https://dev.isrd.isi.edu/chaise/search" width="800" height="300" ></iframe></figure>');

                // Check for iframe tag with a link and caption
                var iframeMarkdown = ':::iframe [SOME LINK CAPTION](https://dev.isrd.isi.edu/chaise/search){height=400 link=https://dev.isrd.isi.edu/chaise/search} \n:::';
                var iframeHTML = '<figure class="embed-block" style=""><figcaption class="embed-caption" style=""><a href="https://dev.isrd.isi.edu/chaise/search" target="_blank">SOME LINK CAPTION</a></figcaption><iframe src="https://dev.isrd.isi.edu/chaise/search" height="400"  ></iframe></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML);

                // Check for iframe tag with a link and caption at the bottom with no iframe-style and iframe-class
                var iframeMarkdown = '::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){link="https://dev.isrd.isi.edu/chaise/search" pos="bottom"} \n:::';
                var iframeHTML = '<figure class="embed-block" style=""><iframe src="https://dev.isrd.isi.edu/chaise/search"   ></iframe><figcaption class="embed-caption" style=""><a href="https://dev.isrd.isi.edu/chaise/search" target="_blank">CAPTION</a></figcaption></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML);

                // Check for iframe tag with a link and caption at the bottom with iframe-style and iframe-class
                var iframeMarkdown = '::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){link="https://dev.isrd.isi.edu/chaise/search" pos="bottom" iframe-class="iclass" iframe-style="border:1px solid;"} \n:::';
                var iframeHTML = '<figure class="embed-block iclass" style=" border:1px solid;"><iframe src="https://dev.isrd.isi.edu/chaise/search"     ></iframe><figcaption class="embed-caption" style=""><a href="https://dev.isrd.isi.edu/chaise/search" target="_blank">CAPTION</a></figcaption></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML);

                // Check for iframe tag with a caption at the bottom with caption-style and caption-class
                var iframeMarkdown = '::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){pos="bottom" caption-class="cclass" caption-style="font-weight:500;"} \n:::';
                var iframeHTML = '<figure class="embed-block" style=""><iframe src="https://dev.isrd.isi.edu/chaise/search"    ></iframe><figcaption class="embed-caption cclass" style=" font-weight:500;">CAPTION</figcaption></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML);


                // Check for iframe tag with a caption at the bottom with iframe-style and caption-class
                var iframeMarkdown = '::: iframe [CAPTION](https://dev.isrd.isi.edu/chaise/search){pos="bottom" caption-class="cclass" caption-style="font-weight:500;"} \n:::';
                var iframeHTML = '<figure class="embed-block" style=""><iframe src="https://dev.isrd.isi.edu/chaise/search"    ></iframe><figcaption class="embed-caption cclass" style=" font-weight:500;">CAPTION</figcaption></figure>';
                expect(printMarkdown(iframeMarkdown)).toBe(iframeHTML);


                // Check for dropdown tag
                var dropdownMarkdown = ':::dropdown MYCAPTION{.btn-lg} [CAPTION1](https://dev.isrd.isi.edu/chaise/search){.btn .btn-danger} [CAPTION2](https://dev.isrd.isi.edu/chaise/search) [CAPTION3](https://dev.isrd.isi.edu/chaise/search) \n:::';
                var dropdownHTML = '<div class="btn-group markdown-dropdown"><button type="button"  class="btn btn-primary btn-lg">MYCAPTION</button><button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"  class="btn btn-primary dropdown-toggle btn-lg"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button><ul class="dropdown-menu"><li><a href="https://dev.isrd.isi.edu/chaise/search" class="btn btn-danger" >CAPTION1</a></li><li><a href="https://dev.isrd.isi.edu/chaise/search" >CAPTION2</a></li><li><a href="https://dev.isrd.isi.edu/chaise/search" >CAPTION3</a></li></ul></div>';
                expect(printMarkdown(dropdownMarkdown)).toBe(dropdownHTML);

                expect(printMarkdown(iframeMarkdown + "\n" + dropdownMarkdown)).toBe(iframeHTML + dropdownHTML);
            });

            it ("should support :::image.", function () {
                // Check for thumbnail with link to original image and a caption
                expect(printMarkdown(":::image [Skyscrapers](http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg){height=200 link=https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg} \n:::"))
                .toBe('<figure class="embed-block" style="display:inline-block;"><a href="https://static.pexels.com/photos/2324/skyline-buildings-new-york-skyscrapers.jpg" target="_blank"><figcaption class="embed-caption">Skyscrapers</figcaption><img src="http://assets.barcroftmedia.com.s3-website-eu-west-1.amazonaws.com/assets/images/recent-images-11.jpg" height="200"  /></a></figure>');
            });

            it ("should support :::video", function () {

                //Check for proper rendering of video tag with no attributes
                var videoMarkDown = '::: video [caption](http://techslides.com/demos/sample-videos/small.mp4){} \n:::';
                var videoHTML = '<figure><figcaption>caption</figcaption><video controls ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video></figure>';
                expect(printMarkdown(videoMarkDown)).toBe(videoHTML, "The video tag is not rendered properly with no attributes ");

                //Check for proper rendering of video tag with height and width attributes
                var videoMarkDown = '::: video [caption](http://techslides.com/demos/sample-videos/small.mp4){width=800 height=200} \n:::';
                var videoHTML = '<figure><figcaption>caption</figcaption><video controls width=800 height=200 ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video></figure>';
                expect(printMarkdown(videoMarkDown)).toBe(videoHTML, "The video tag is not rendered properly with height and width attributes ");

                //Check for proper rendering of video tag with height and width attributes and some boolean attributes like loop and muted
                var videoMarkDown = '::: video [caption](http://techslides.com/demos/sample-videos/small.mp4){width=800 height=200 loop muted} \n:::';
                var videoHTML = '<figure><figcaption>caption</figcaption><video controls width=800 height=200 loop muted ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video></figure>';
                expect(printMarkdown(videoMarkDown)).toBe(videoHTML, "The video tag is not rendered properly with boolean attributes ");

                //Check for proper rendering of video tag with some invalid attributes
                var videoMarkDown = '::: video [caption](http://techslides.com/demos/sample-videos/small.mp4){loop=5 width=800} \n:::';
                var videoHTML = '<figure><figcaption>caption</figcaption><video controls width=800 ><source src="http://techslides.com/demos/sample-videos/small.mp4" type="video/mp4"></video></figure>';
                expect(printMarkdown(videoMarkDown)).toBe(videoHTML, "The video tag is not rendered properly with invalid attributes ");
            });

            it ("should support :::div", function () {
                testPrintMarkdown(
                    ":::div value \n:::",
                    '<div>value</div>\n',
                    "invalid string"
                );

                testPrintMarkdown(
                    ":::div value{.class-name} \n:::",
                    '<div class="class-name">value</div>\n',
                    "invalid string with tag"
                );

                // NOTE currently these are the only two use cases of this.
            });

            it ("should support superscript and subscript.", function () {
                expect(printMarkdown('H~2~0')).toBe('<p>H<sub>2</sub>0</p>\n', "invalid sub");
                expect(printMarkdown('H~2~{.test}0')).toBe('<p>H<sub class="test">2</sub>0</p>\n', "invalid sub with attrs");
                expect(printMarkdown('13^th^')).toBe('<p>13<sup>th</sup></p>\n', "invalid sup");
            });

            it ("should support :span:.", function () {
                expect(printMarkdown("This is :span: special case:/span:.")).toBe("<p>This is <span> special case</span>.</p>\n", "invalid span");
                expect(printMarkdown("This is :span: special case:/span:.", {inline: true})).toBe("This is <span> special case</span>.", "invalid inline span");
                expect(printMarkdown(":span:special:/span:{.test}", {inline: true})).toBe('<span class="test">special</span>', "invalid inline span with attrs");
                expect(printMarkdown(":span::/span:{.glyph-icon .glyph-danger}", {inline: true})).toBe('<span class="glyph-icon glyph-danger"></span>', "invalid empty inline span with attrs");
            });
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

        it('module._renderMustacheTemplate() should function correctly for Null and Non-null values', function() {
            expect(module._renderMustacheTemplate("My name is {{name}}", {name: 'John'})).toBe("My name is John");
            expect(module._renderMustacheTemplate("My name is {{name}}", { name: null })).toBe(null);
            expect(module._renderMustacheTemplate("My name is {{name}}", {})).toBe(null);
            expect(module._renderMustacheTemplate("My name is {{#name}}{{name}}{{/name}}", {})).toBe("My name is ");
            expect(module._renderMustacheTemplate("My name is {{^name}}{{name}}{{/name}}", {})).toBe("My name is ");
            expect(module._renderMustacheTemplate("My name is {{^name}}John{{/name}}", {})).toBe("My name is John");
        });

        it('module._renderMustacheTemplate() should inject $moment obj', function() {
            var moment = module._currDate;
            expect(moment).toBeDefined();
            expect(module._renderMustacheTemplate("{{name}} was born on {{$moment.day}} {{$moment.date}}/{{$moment.month}}/{{$moment.year}}", { name: 'John' })).toBe("John was born on " + moment.day + " " + moment.date + "/" + moment.month + "/" + moment.year);
            expect(module._renderMustacheTemplate("Todays date is {{$moment.dateString}}", {})).toBe("Todays date is " + moment.dateString);

            expect(module._renderMustacheTemplate("Current time is {{$moment.hours}}:{{$moment.minutes}}:{{$moment.seconds}}:{{$moment.milliseconds}} with timestamp {{$moment.timestamp}}", {})).toBe("Current time is " + moment.hours + ":" + moment.minutes + ":" + moment.seconds + ":" + moment.milliseconds + " with timestamp " + moment.timestamp);
            expect(module._renderMustacheTemplate("Current time is {{$moment.timeString}}", {})).toBe("Current time is " + moment.timeString);

            expect(module._renderMustacheTemplate("ISO string is {{$moment.ISOString}}", {})).toBe("ISO string is " + moment.ISOString);
            expect(module._renderMustacheTemplate("GMT string is {{$moment.GMTString}}", {})).toBe("GMT string is " + moment.GMTString);
            expect(module._renderMustacheTemplate("UTC string is {{$moment.UTCString}}", {})).toBe("UTC string is " + moment.UTCString);

            expect(module._renderMustacheTemplate("Local time string is {{$moment.localeTimeString}}", {})).toBe("Local time string is " + moment.localeTimeString);
        });

        it('module._valdiateMustacheTemplate() should accept templates that have $moment in them.', function () {
            expect(module._validateMustacheTemplate("{{name}} was born on {{$moment.day}} {{$moment.date}}/{{$moment.month}}/{{$moment.year}}", { name: 'John' })).toBe(true);
            expect(module._validateMustacheTemplate("Todays date is {{$moment.dateString}}", {})).toBe(true);

            expect(module._validateMustacheTemplate("Current time is {{$moment.hours}}:{{$moment.minutes}}:{{$moment.seconds}}:{{$moment.milliseconds}} with timestamp {{$moment.timestamp}}", {})).toBe(true);
            expect(module._validateMustacheTemplate("Current time is {{$moment.timeString}}", {})).toBe(true);

            expect(module._validateMustacheTemplate("ISO string is {{$moment.ISOString}}", {})).toBe(true);
            expect(module._validateMustacheTemplate("GMT string is {{$moment.GMTString}}", {})).toBe(true);
            expect(module._validateMustacheTemplate("UTC string is {{$moment.UTCString}}", {})).toBe(true);

            expect(module._validateMustacheTemplate("Local time string is {{$moment.localeTimeString}}", {})).toBe(true);
        });

        var obj = {
            "str.witha.": "**somevalue ] which is ! special and [ contains special <bold> characters 12/26/2016 ( and **",
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
              "template": "[a markdown link]({{#escape}}{{{u2}}}{{/escape}})",
              "after_mustache": "[a markdown link](http:\\/\\/example\\.com\\/foo\\/\\(a,b\\))",
              "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
            }, {
              "template": "[a markdown link](http://example.com/foo/id={{#escape}}({{#encode}}{{{p}}}{{/encode}}){{/escape}})",
              "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
              "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
              "note": "here, the escape block protects the bare parens for us"
            }, {
              "template": "[a markdown link](http://example.com/foo/id=\\({{#encode}}{{{p}}}{{/encode}}\\))",
              "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
              "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
              "note": "here, I markdown-escape the bare parens myself for the same final output HTML"
            }, {
              "template": "[a markdown link](http:://example.com/foo/{{{ǝɯɐu}}}={{{n}}})",
              "after_mustache": "[a markdown link](http:://example.com/foo/name=ǝɯɐu)",
              "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
              "note": "the URL in this HTML is not actually valid according to RFC 3986!"
            }, {
              "template": "[a markdown link](http:://example.com/foo/{{ǝɯɐu}}={{#encode}}{{{n}}}{{/encode}})",
              "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
              "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
              "note": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu"
            }, {
              "template": "[a markdown link](http:://example.com/foo/{{#escape}}{{{ǝɯɐu}}}={{#encode}}{{{n}}}{{/encode}}{{/escape}})",
              "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
              "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
              "note1": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu",
              "note2": "the {{#escape}}...{{/escape}} is unnecessary here but doesn't hurt anything"
            }, {
                "template" : "[{{str_witha_}}](https://dev.isrd.isi.edu/key={{str_witha_}})",
                "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **)",
                "after_render": '<p>[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)</p>',
                "note": "With no encoding and escaping. Should give malformed HTML"
            },{
                "template" : "[{{str_witha_}}](https://dev.isrd.isi.edu/key={{#encode}}{{{str_witha_}}}{{/encode}})",
                "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                "after_render": '<p>[**somevalue ] which is ! special and <a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A"> contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                "note": "With encoding but no escaping. Should give malformed HTML with a valid link but invalid caption"
            },{
                "template" : "[{{#escape}}{{{str_witha_}}}{{/escape}}](https://dev.isrd.isi.edu/key={{str_witha_}})",
                "after_mustache": "[\\*\\*somevalue \\] which is \\! special and \\[ contains special &lt;bold&gt; characters 12\\/26\\/2016 \\( and \\*\\*](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12&#x2F;26&#x2F;2016 ( and **)",
                "after_render": '<p>[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)</p>',
                "note": "With escaping but no encoding. Should give malformed HTML"
            },{
                "template" : "[{{#escape}}{{{str_witha_}}}{{/escape}}](https://dev.isrd.isi.edu/key={{#encode}}{{{str_witha_}}}{{/encode}})",
                "after_mustache": "[\\*\\*somevalue \\] which is \\! special and \\[ contains special &lt;bold&gt; characters 12\\/26\\/2016 \\( and \\*\\*](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                "after_render": '<p><a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A">**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                "note": "With encoding and escaping. Should give correct HTML with valid caption a link"
            }];

        it('module._renderMustacheTemplate() and module._renderMarkdown() should function correctly for Markdown Escaping and Encoding', function() {
            var printMarkdown = formatUtils.printMarkdown;

            templateCases.forEach(function(ex) {
                var template = module._renderMustacheTemplate(ex.template, obj);
                expect(template).toBe(ex.after_mustache);
                var html = printMarkdown(template);
                expect(html).toBe(ex.after_render + '\n');
            });
        });

        describe('module._renderHandlebarsTemplate() should function correctly for', function () {
            it('Null and Non-null values', function() {
                expect(module._renderHandlebarsTemplate("My name is {{name}}", { name: 'Chloe' })).toBe("My name is Chloe");
                expect(module._renderHandlebarsTemplate("My name is {{name}}", { name: null })).toBe(null);
                expect(module._renderHandlebarsTemplate("My name is {{name}}", {})).toBe(null);
                expect(module._renderHandlebarsTemplate("My name is {{#if name}}{{name}}{{/if}}", {})).toBe("My name is ");
                expect(module._renderHandlebarsTemplate("My name is {{^if name}}{{name}}{{/if}}", {})).toBe("My name is ", "For inverted if with variable");
                expect(module._renderHandlebarsTemplate("My name is {{^if name}}John{{/if}}", {})).toBe("My name is John", "For inverted if with string");
                expect(module._renderHandlebarsTemplate("My name is {{#unless name}}Jona{{/unless}}", {})).toBe("My name is Jona", "For unless");
            });

            it('ifCond helper', function() {
                expect(module._renderHandlebarsTemplate("Name {{#ifCond name \"===\" 'Chloe'}}{{name}} is equal to Chloe{{else}}{{name}} is not equal to Chloe{{/ifCond}}", { name: 'Chloe' })).toBe("Name Chloe is equal to Chloe");
                expect(module._renderHandlebarsTemplate("Name {{#ifCond name \"===\" 'Chloe'}}{{name}} is equal to Chloe{{else}}{{name}} is not equal to Chloe{{/ifCond}}", { name: 'John' })).toBe("Name John is not equal to Chloe");
            });

            it('each helper', function () {
                expect(module._renderHandlebarsTemplate("{{#each values}}{{this}}\n{{/each}}", { values: [2, 3, 7, 9] })).toBe("2\n3\n7\n9\n");
            });

            it('if eq (equals) helper', function () {
                expect(module._renderHandlebarsTemplate("Name {{#if (eq name 'Chloe')}}{{name}} is equal to Chloe{{else}}{{name}} is not equal to Chloe{{/if}}", { name: 'Chloe' })).toBe("Name Chloe is equal to Chloe");
                expect(module._renderHandlebarsTemplate("Name {{#if (eq name 'Chloe')}}{{name}} is equal to Chloe{{else}}{{name}} is not equal to Chloe{{/if}}", { name: 'John' })).toBe("Name John is not equal to Chloe");
            });

            it('if ne (not equals) helper', function () {
                expect(module._renderHandlebarsTemplate("Name {{#if (ne name 'Chloe')}}{{name}} is not equal to Chloe{{else}}{{name}} is equal to Chloe{{/if}}", { name: 'John' })).toBe("Name John is not equal to Chloe");
                expect(module._renderHandlebarsTemplate("Name {{#if (ne name 'Chloe')}}{{name}} is not equal to Chloe{{else}}{{name}} is equal to Chloe{{/if}}", { name: 'Chloe' })).toBe("Name Chloe is equal to Chloe");
            });

            it('if lt (less than) helper', function () {
                expect(module._renderHandlebarsTemplate("{{#if (lt value '10')}}{{value}} is less than 10{{else}}{{value}} is not less than 10{{/if}}", { value: 3 })).toBe("3 is less than 10");
                expect(module._renderHandlebarsTemplate("{{#if (lt value '10')}}{{value}} is less than 10{{else}}{{value}} is not less than 10{{/if}}", { value: 17 })).toBe("17 is not less than 10");
            });

            it('if gt (greater than) helper', function () {
                expect(module._renderHandlebarsTemplate("{{#if (gt value '10')}}{{value}} is greater than 10{{else}}{{value}} is not greater than 10{{/if}}", { value: 17 })).toBe("17 is greater than 10");
                expect(module._renderHandlebarsTemplate("{{#if (gt value '10')}}{{value}} is greater than 10{{else}}{{value}} is not greater than 10{{/if}}", { value: 3 })).toBe("3 is not greater than 10");
            });

            it('if lte (less than or equal to) helper', function () {
                expect(module._renderHandlebarsTemplate("{{#if (lte value '10')}}{{value}} is less than or equal to 10{{else}}{{value}} is not less than or equal to 10{{/if}}", { value: 3 })).toBe("3 is less than or equal to 10");
                expect(module._renderHandlebarsTemplate("{{#if (lte value '10')}}{{value}} is less than or equal to 10{{else}}{{value}} is not less than or equal to 10{{/if}}", { value: 10 })).toBe("10 is less than or equal to 10");
                expect(module._renderHandlebarsTemplate("{{#if (lte value '10')}}{{value}} is less than or equal to 10{{else}}{{value}} is not less than or equal to 10{{/if}}", { value: 17 })).toBe("17 is not less than or equal to 10");
            });

            it('if gte (greater than or equal to) helper', function () {
                expect(module._renderHandlebarsTemplate("{{#if (gte value '10')}}{{value}} is greater than or equal to 10{{else}}{{value}} is not greater than or equal to 10{{/if}}", { value: 17 })).toBe("17 is greater than or equal to 10");
                expect(module._renderHandlebarsTemplate("{{#if (gte value '10')}}{{value}} is greater than or equal to 10{{else}}{{value}} is not greater than or equal to 10{{/if}}", { value: 10 })).toBe("10 is greater than or equal to 10");
                expect(module._renderHandlebarsTemplate("{{#if (gte value '10')}}{{value}} is greater than or equal to 10{{else}}{{value}} is not greater than or equal to 10{{/if}}", { value: 3 })).toBe("3 is not greater than or equal to 10");
            });

            it('if and (conjunction) helper', function () {
                expect(module._renderHandlebarsTemplate("{{#if (and bool1 bool2)}}both booleans are true{{else}}one or more booleans are false{{/if}}", { bool1: true, bool2: true })).toBe("both booleans are true");
                expect(module._renderHandlebarsTemplate("{{#if (and bool1 bool2)}}both booleans are true{{else}}one or more booleans are false{{/if}}", { bool1: true, bool2: false })).toBe("one or more booleans are false");
            });

            it('if or (disjunction) helper', function () {
                expect(module._renderHandlebarsTemplate("{{#if (or bool1 bool2)}}one or more booleans are true{{else}}both booleans are false{{/if}}", { bool1: false, bool2: true })).toBe("one or more booleans are true");
                expect(module._renderHandlebarsTemplate("{{#if (or bool1 bool2)}}one or more booleans are true{{else}}both booleans are false{{/if}}", { bool1: false, bool2: false })).toBe("both booleans are false");
            });

            it('suppressed default helper log', function () {
                try {
                    module._renderHandlebarsTemplate("{{log 'Hello World'}}");
                } catch (err) {
                    expect(err.message).toBe("You specified knownHelpersOnly, but used the unknown helper log - 1:0");
                }
            });

            it('injecting $moment obj', function() {
                var moment = module._currDate;
                expect(moment).toBeDefined();
                expect(module._renderHandlebarsTemplate("{{name}} was born on {{$moment.day}} {{$moment.date}}/{{$moment.month}}/{{$moment.year}}", { name: 'John' })).toBe("John was born on " + moment.day + " " + moment.date + "/" + moment.month + "/" + moment.year);
                expect(module._renderHandlebarsTemplate("Todays date is {{$moment.dateString}}", {})).toBe("Todays date is " + moment.dateString);

                expect(module._renderHandlebarsTemplate("Current time is {{$moment.hours}}:{{$moment.minutes}}:{{$moment.seconds}}:{{$moment.milliseconds}} with timestamp {{$moment.timestamp}}", {})).toBe("Current time is " + moment.hours + ":" + moment.minutes + ":" + moment.seconds + ":" + moment.milliseconds + " with timestamp " + moment.timestamp);
                expect(module._renderHandlebarsTemplate("Current time is {{$moment.timeString}}", {})).toBe("Current time is " + moment.timeString);

                expect(module._renderHandlebarsTemplate("ISO string is {{$moment.ISOString}}", {})).toBe("ISO string is " + moment.ISOString);
                expect(module._renderHandlebarsTemplate("GMT string is {{$moment.GMTString}}", {})).toBe("GMT string is " + moment.GMTString);
                expect(module._renderHandlebarsTemplate("UTC string is {{$moment.UTCString}}", {})).toBe("UTC string is " + moment.UTCString);

                expect(module._renderHandlebarsTemplate("Local time string is {{$moment.localeTimeString}}", {})).toBe("Local time string is " + moment.localeTimeString);
            });

            var handlebarTemplateCases = [{
                  "template": "{{{m1}}}",
                  "after_mustache": "[a markdown link](http://example.com/foo)",
                  "after_render": "<p><a href=\"http://example.com/foo\">a markdown link</a></p>"
                }, {
                  "template": "{{{m2}}}",
                  "after_mustache": "[a markdown link](http://example.com/foo/\\(a,b\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
                }, {
                  "template": "[a markdown link]({{#escape u2}}{{/escape}})",
                  "after_mustache": "[a markdown link](http:\\/\\/example\\.com\\/foo\\/\\(a,b\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
                }, {
                  "template": "[a markdown link]({{escape u2}})",
                  "after_mustache": "[a markdown link](http:\\/\\/example\\.com\\/foo\\/\\(a,b\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/(a,b)\">a markdown link</a></p>"
                }, {
                  "template": "[a markdown link](http://example.com/foo/id={{#escape '(' (encode p) ')'}}{{/escape}})",
                  "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
                  "note": "here, the escape block protects the bare parens for us"
                }, {
                  "template": "[a markdown link](http://example.com/foo/id={{escape '(' (encode p) ')'}})",
                  "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
                  "note": "here, the escape block protects the bare parens for us"
                }, {
                  "template": "[a markdown link](http://example.com/foo/id=\\({{#encode p}}{{/encode}}\\))",
                  "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
                  "note": "here, I markdown-escape the bare parens myself for the same final output HTML"
                }, {
                  "template": "[a markdown link](http://example.com/foo/id=\\({{encode p}}\\))",
                  "after_mustache": "[a markdown link](http://example.com/foo/id=\\(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation\\))",
                  "after_render": "<p><a href=\"http://example.com/foo/id=(messy%28%29%7B%7D%5B%5D%3C%3E%2F%3B%2C%24%3D%2Apunctuation)\">a markdown link</a></p>",
                  "note": "here, I markdown-escape the bare parens myself for the same final output HTML"
                }, {
                  "template": "[a markdown link](http:://example.com/foo/{{{ǝɯɐu}}}={{{n}}})",
                  "after_mustache": "[a markdown link](http:://example.com/foo/name=ǝɯɐu)",
                  "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
                  "note": "the URL in this HTML is not actually valid according to RFC 3986!"
                }, {
                  "template": "[a markdown link](http:://example.com/foo/{{ǝɯɐu}}={{#encode n}}{{/encode}})",
                  "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
                  "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
                  "note": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu"
                }, {
                  "template": "[a markdown link](http:://example.com/foo/{{ǝɯɐu}}={{encode n}})",
                  "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
                  "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
                  "note": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu"
                }, {
                  "template": "[a markdown link](http:://example.com/foo/{{#escape ǝɯɐu '=' (encode n)}}{{/escape}})",
                  "after_mustache": "[a markdown link](http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u)",
                  "after_render": "<p><a href=\"http:://example.com/foo/name=%C7%9D%C9%AF%C9%90u\">a markdown link</a></p>",
                  "note1": "the URL here has a properly percent-encoded UTF-8 string: %C7%9D%C9%AF%C9%90u == ǝɯɐu",
                  "note2": "the {{#escape}}...{{/escape}} is unnecessary here but doesn't hurt anything"
                },{
                    "template" : "[{{str_witha_}}](https://dev.isrd.isi.edu/key={{str_witha_}})",
                    "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)",
                    "after_render": '<p>[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)</p>',
                    "note": "With no encoding and escaping. Should give malformed HTML"
                },{
                    "template" : "[{{str_witha_}}](https://dev.isrd.isi.edu/key={{#encode str_witha_}}{{/encode}})",
                    "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                    "after_render": '<p>[**somevalue ] which is ! special and <a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A"> contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                    "note": "With encoding but no escaping. Should give malformed HTML with a valid link but invalid caption"
                },{
                    "template" : "[{{str_witha_}}](https://dev.isrd.isi.edu/key={{encode str_witha_}})",
                    "after_mustache": "[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                    "after_render": '<p>[**somevalue ] which is ! special and <a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A"> contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                    "note": "With encoding but no escaping. Should give malformed HTML with a valid link but invalid caption"
                },{
                    "template" : "[{{#escape str_witha_}}{{/escape}}](https://dev.isrd.isi.edu/key={{str_witha_}})",
                    "after_mustache": "[\\*\\*somevalue \\] which is \\! special and \\[ contains special &lt;bold&gt; characters 12\\/26\\/2016 \\( and \\*\\*](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)",
                    "after_render": '<p>[**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **](https://dev.isrd.isi.edu/key=**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **)</p>',
                    "note": "With escaping but no encoding. Should give malformed HTML"
                },{
                    "template" : "[{{#escape str_witha_}}{{/escape}}](https://dev.isrd.isi.edu/key={{#encode str_witha_}}{{/encode}})",
                    "after_mustache": "[\\*\\*somevalue \\] which is \\! special and \\[ contains special &lt;bold&gt; characters 12\\/26\\/2016 \\( and \\*\\*](https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A)",
                    "after_render": '<p><a href="https://dev.isrd.isi.edu/key=%2A%2Asomevalue%20%5D%20which%20is%20%21%20special%20and%20%5B%20contains%20special%20%3Cbold%3E%20characters%2012%2F26%2F2016%20%28%20and%20%2A%2A">**somevalue ] which is ! special and [ contains special &lt;bold&gt; characters 12/26/2016 ( and **</a></p>',
                    "note": "With encoding and escaping. Should give correct HTML with valid caption a link"
                }];

            it('Markdown Escaping and Encoding', function() {
                var printMarkdown = formatUtils.printMarkdown;

                handlebarTemplateCases.forEach(function(ex) {
                    var template = module._renderHandlebarsTemplate(ex.template, obj);
                    expect(template).toBe(ex.after_mustache, "For template => " + ex.template);
                    var html = printMarkdown(template);
                    expect(html).toBe(ex.after_render + '\n', "For template => " + ex.template);
                });
            });
        });

    });
};
