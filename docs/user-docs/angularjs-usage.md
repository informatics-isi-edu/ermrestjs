# AngularJS Binding

To use ermrestjs and the `ERMrest` object in Angular applications, first your
modules will need to inject the `ermrestjs` module.

```
angular.module("myapp", ['ermrestjs'])
```

Then you can inject the `ERMrest` service and use its public APIs.

```
.run(['ERMrest', function(ERMrest) {
    var uri = 'http://example.org/ermrest/catalog/1/entity/s:t/k=1232';
    ERMrest.resolve(uri).then(...);
}]);
```

Note that you do not need to configure the ERMrest service by calling its
`ERMrest.configure(http, q)` function, because the service will handle the
configuration itself.
