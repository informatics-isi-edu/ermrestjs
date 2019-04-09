## JavaScript constructs incompatible with IE-11

Following are some of the coding constructs that are incompatible with Internet Explorer: 

1. JavaScript classes: The JavaScript `classes` as well as `class constructors` and the keywords `extends` and `static` associated with a class are incompatible with IE (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Browser_compatibility). These can be replaced with function expressions.

For Example:
```
    // declaration 
    class filterModel {
        constructor(param) {
            this.toStageOptions = param.toStageOptions;
            this.strength = "present";
            this.source = {
                "name": ""
            };
            this.pattern = "";
            this.location = "";
        }
    }
    // instantiation
    let filter = new filterModel(defaultOptions);
```
The above could be replaced with:

``` 
    // declaration      
    var filterModel = function filterModel(param) {
        this.toStageOptions = param.fromStageOptions;
        this.strength = "present";
        this.source = {
            "name": ""
        };
        this.pattern = "";
        this.location = "";
    };

    // instantiation
    var filter = new filterModel(defaultOptions);
```

2. Arrow functions: Arrow functions (=>) are incompatible with IE (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions#Browser_compatibility). Replace these shorthand notations with regular functions.

For Example:
```
var match = data.filter(source => (source.Name === filter.source.name));
```
Replace the above code with:
```
    var match = data.filter(function (source) {
        return source.Name === row.source.name;
    });
```

3. Array.includes(): This function which is used to check if an array contains a particular value is not supported in IE (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes#Browser_compatibility). Replace it with `Array.indexOf(value) >= 0` to make it compatible with IE.

4. window.origin: Instead of using `window.origin` use `window.location.origin` for IE compatibility.

5. Function.prototype.name: This read-only property indicating the function's name is not supported by IE (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name#Browser_compatibility). 