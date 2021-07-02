/*
  This library has been built using sprintf https://github.com/alexei/sprintf.js
 */

var ERMrest = (function(module) {

    // A list of regular expression to extract flags, width and precision from format strings
    var re = {
        number: /[dief]/,
        numeric_arg: /[bcdiefuX]/,
        json: /[j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:\(([^\)]+)\))?((?:(\+)?(\s|0|#[^\n\r1-9])?(')?(-)?)*)(\d+)?(?:\.(\d+))?([b-ijostuvX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    };

    var printf_cache = {};

    var printf_format = function(parse_tree, value, options) {
        var tree_length = parse_tree.length, arg, output = '', i, k, ph, pad, pad_character, pad_length, is_positive, sign;
        for (i = 0; i < tree_length; i++) {
            arg = value;
            if (typeof parse_tree[i] === 'string') {
                output += parse_tree[i];
            }
            else if (typeof parse_tree[i] === 'object') {
                ph = parse_tree[i]; // convenience purposes only

                if (ph.keys) { // keyword argument
                    for (k = 0; k < ph.keys.length; k++) {
                        if (!arg.hasOwnProperty(ph.keys[k])) {
                            module._log.info('[printf] property "' + ph.keys[k] + '" does not exist');
                        }
                        arg = arg[ph.keys[k]];

                        // For values which don't exist in json object for corresponding keys we substitute them with empty string
                        if (arg === undefined || arg === null) {
                            arg = "";
                            break;
                        }
                    }
                }

                if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
                    throw new TypeError('[printf] expecting number but found ' + arg);
                }

                if (re.number.test(ph.type)) {
                    is_positive = arg >= 0;
                }

                switch (ph.type) {
                    case 'b':
                        arg = parseInt(arg, 10).toString(2);
                        break;
                    case 'c':
                        arg = String.fromCharCode(parseInt(arg, 10));
                        break;
                    case 'd':
                    case 'i':
                        arg = parseInt(arg, 10);
                        break;
                    case 'j':
                        arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0);
                        break;
                    case 'e':
                        arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential();
                        break;
                    case 'f':
                        arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg);
                        break;
                    case 'o':
                        arg = (parseInt(arg, 10) >>> 0).toString(8);
                        break;
                    case 's':
                        arg = String(arg);
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 't':
                        if (typeof arg === 'string') {
                            if (arg === 'true') arg = true;
                            else if (arg === 'false') arg = false;
                            else if (arg === '0') arg = 0;
                            else if (arg.length === 0) arg = false;
                        }
                        if (arg) {
                            arg = options.bool_true_value || String(!!arg);
                        } else {
                            arg = options.bool_false_value !== undefined ? options.bool_false_value : String(!!arg);
                        }
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 'u':
                        arg = parseInt(arg, 10) >>> 0;
                        break;
                    case 'v':
                        arg = arg.valueOf();
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 'X':
                        arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase();
                        break;
                }
                if (ph.type === 'j') {
                    output += arg;
                }
                else {
                    if (re.number.test(ph.type)) {

                        if (ph.has_thousand_separator) {
                            arg = Number(arg).toLocaleString();
                        }

                        if (!is_positive || ph.sign) {
                            sign = is_positive ? '+' : '-';
                            arg = arg.toString().replace(re.sign, '');
                        } else {
                            sign = '';
                        }

                    }
                    else {
                        sign = '';
                    }
                    pad_character = (ph.pad_char !== undefined) ? ph.pad_char : ' ';
                    pad_length = ph.width - (sign + arg).length;
                    pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : '';
                    output += ph.left_align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg);
                }
            }
        }
        return output;
    };

    var printf_parse = function(fmt) {
        if (printf_cache[fmt]) {
            return printf_cache[fmt];
        }

        var _fmt = fmt, match, parse_tree = [], arg_names = 0;
        var left_align, pad_char, sign, has_thousand_separator, flags, i;

        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree.push(match[0]);
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree.push('%');
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[1]) {
                    arg_names |= 1;
                    var field_list = [], replacement_field = match[1], field_match = [];
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1]);
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                            }
                            else {
                                throw new SyntaxError('[printf] failed to parse named argument key');
                            }
                        }
                    }
                    else {
                        throw new SyntaxError('[printf] failed to parse named argument key');
                    }
                    match[1] = field_list;
                }

                flags = match[2] || "";
                left_align = undefined;
                pad_char = undefined;
                sign = undefined;
                has_thousand_separator = undefined;
                i=0;

                while (i < flags.length) {
                    var flag = flags[i];
                    switch(flag) {
                        case "'":
                            if (has_thousand_separator !== undefined) {
                                throw new SyntaxError("[printf] format syntax " + match[0] + " is invalid as it contains more than 1 (') thousand separator");
                            } else {
                                has_thousand_separator = true;
                            }
                            break;

                        case "+":
                            if (sign !== undefined) {
                                throw new SyntaxError("[printf] format syntax " + match[0] + " is invalid as it contains more than 1 (+) signs");
                            } else {
                                sign = true;
                            }
                            break;

                        case "-":
                            if (left_align !== undefined) {
                                throw new SyntaxError("[printf] format syntax " + match[0] + " is invalid as it contains more than 1 (-) align operator");
                            } else {
                                left_align = true;
                            }
                            break;

                        case "#":
                            if (pad_char !== undefined) {
                                throw new SyntaxError("[printf] format syntax " + match[0] + " is invalid as it contains more than 1 (#) pad char syntax");
                            } else {
                                pad_char = flags[++i];
                            }
                            break;
                        case "0":
                        case " ":
                            if (pad_char !== undefined) {
                                throw new SyntaxError("[printf] format syntax " + match[0] + " is invalid as it contains more than 1 pad char syntax");
                            } else {
                                pad_char = flag;
                            }
                            break;
                        default:
                            throw new SyntaxError("[printf] format syntax " + match[0] + " is invalid as it contains invalid flag " + flag);
                    }

                    i++;
                }

                parse_tree.push({
                    placeholder: match[0],
                    keys: match[1],
                    sign: sign,
                    pad_char: pad_char,
                    has_thousand_separator: has_thousand_separator,
                    left_align: left_align,
                    width: match[7],
                    precision: match[8],
                    type: match[9]
                });
            }
            else {
                throw new SyntaxError('[printf] unexpected placeholder');
            }
            _fmt = _fmt.substring(match[0].length);
        }
        printf_cache[fmt] = parse_tree;
        return parse_tree;
    };

    /**
      * printf function allows you to format strings using POSIX statndard
      *
      * %[flags][width][.precision]type
      *
      * flags field: The Flags field can be zero or more (in any order) of:

           - (minus) Left-align the output of this placeholder. (The default is to right-align the output.).
                     This is used in conjunction with width field.
           + (plus)  Prepends a plus for positive signed-numeric types. positive = +, negative = -
                     (The default doesn't prepend anything in front of positive numbers.)
           0 (zero)  When the 'width' option is specified, prepends zeros for numeric types. (The default prepends spaces.)
                     For example, printf("%2X",3) produces  3, while printf("%02X",3) produces in 03.
           ' (quote) It separates numeric types by thousands using a comman(,) or other characters accroding to localization
           #{char}   An optional padding specifier that says what character to use for padding (if specified).
                     Possible values are any other character precedeed by a # (hash). print("%#_5d",10) produces ___10

      * Width field: The Width field specifies a minimum number of characters to output, and is typically used to pad fixed-width fields,
                     where the fields would otherwise be smaller, although it does not cause truncation of oversized fields.
                     For example, printf("%*d", 5, 10) will result in "   10" being printed, with a total width of 5 characters.
                     Though not part of the width field, a leading zero is interpreted as the zero-padding flag mentioned above,
                     and a negative value is treated as the positive value in conjunction with the left-alignment - flag also mentioned above.
                     When used with the j (JSON) type specifier, the padding length specifies the tab size used for indentation.

      * Precision field: The Precision field usually specifies a maximum limit on the output, depending on the particular formatting type.
                    For floating point numeric types, it specifies the number of digits to the right of the decimal point that the output should be rounded.
                    For the string type, it limits the number of characters that should be output, after which the string is truncated.
                    For example, printf("%.3s", 3.42134) will result in 3.421 being printed.

      * Type field: It can be any of:
                    % — yields a literal % character
                    b — yields an integer as a binary number
                    c — yields an integer as the character with that ASCII value
                    d or i — yields an integer as a signed decimal number
                    e — yields a float using scientific notation
                    u — yields an integer as an unsigned decimal number
                    f — yields a float as is; see notes on precision above
                    o — yields an integer as an octal number
                    s — yields a string as is
                    t — yields true or false
                    X — yields an integer as a hexadecimal number (upper-case)
                    j — yields a JavaScript object or array as a JSON encoded string

      * Named arguments:
                    Format strings may contain replacement fields rather than positional placeholders. Instead of referring to a certain argument,
                    you can now refer to a certain key within an object. Replacement fields are surrounded by rounded parentheses - `(` and `)` -
                    and begin with a keyword that refers to a key:

                        var user = { name: 'Dolly' }
                        sprintf('Hello %(name)s', user) // Hello Dolly

                    Keywords in replacement fields can be optionally followed by any number of keywords or indexes:

                        var users = [
                            {name: 'Dolly'},
                            {name: 'Molly'},
                            {name: 'Polly'},
                        ]
                        sprintf('Hello %(users[0].name)s, %(users[1].name)s and %(users[2].name)s', {users: users}) // Hello Dolly, Molly and Polly

                    Note: mixing positional and named placeholders is not (yet) supported

      * @param {Object} options A javascript object that contains format property and optional bool_true_value
                                and bool_false_value. These will be used to replace true and false in `t` type fields.
      * @param {String|Number|Object} value This would be the value that needs to be formatted.
      * @param {String} type The column type that the data is being formatted for
      * @returns {String}
      **/
    module._printf = function(options, value, type) {
        if (typeof options === "string") {
            options = {format: options};
        }
        if (typeof options.format !== 'string') throw new SyntaxError("[printf] should be supplied with proper pre_format annotation with format string. Eg: { format: '%d' }");
        if (type == 'date' || type == 'timestamp' || type == 'timestamptz') {
            return module._moment(value).format(options.format);
        } else {
            return printf_format(printf_parse(options.format), value, options);
        }
    };

    return module;

})(ERMrest || {});
