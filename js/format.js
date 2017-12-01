var ERMrest = (function(module) {

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
                            throw new Error(printf('[printf] property "%s" does not exist', ph.keys[k]));
                        }
                        arg = arg[ph.keys[k]];
                    }
                }

                if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
                    throw new TypeError(printf('[printf] expecting number but found %T', arg));
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
                            arg = arg.toLocaleString();
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

    module._printf = function(options, value) {
        return printf_format(printf_parse(options.format), value, options);
    };

    return module;
    
})(ERMrest || {});