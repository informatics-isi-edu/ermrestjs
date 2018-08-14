# Usage

We intend for ERMrestJS to be usable in browser and Node.js environments. To configure ERMrestJS, you need to call the `ERMrest.configure` and pass http and promise library that you want to use.

```javascript
// http is the http library that we want to use
// q is the promise library that we want to use
ERMrest.configure(http, q)
```

Using this method you can use ERMrestJS in any environments that you wish. Since we are using this library in Node.js and AngularJS environment, the package itself will do the configuration in these environments.

## AngularJS Binding

To use ERMrestJS and the `ERMrest` object in Angular applications, first your
modules will need to inject the `ermrestjs` module.

```javascript
angular.module("myapp", ['ermrestjs'])
```

Then you can inject the `ERMrest` service and use its public APIs.

```javascript
.run(['ERMrest', function(ERMrest) {
    var uri = 'http://example.org/ermrest/catalog/1/entity/s:t/k=1232';
    ERMrest.resolve(uri).then(...);
}]);
```

Note that you do not need to configure the ERMrest service by calling its
`ERMrest.configure(http, q)` function, because the service will handle the
configuration itself.


## Node.js

In Node.js environment, we're using [`request-q`](https://www.npmjs.com/package/request-q) as the http library and  [`q`](https://www.npmjs.com/package/q) for the promise library. You don't need to configure ERMrestJS.

```javascript
var ERMrest = require("./build/ermrest.js");

ERMrest.resolve(uri).then(function (response) {
    var reference = response;
}).catch(function (err) {
    console.log(err);
})
```


## Browser Support

ERMrestJS should work in modern versions of Firefox, Chrome, Safari, Edige, and Internet Explorer (10+).
