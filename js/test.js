console.log(ERMrest);
console.log(ERMrest.rest('http://localhost'));
var svc = ERMrest.rest('http://localhost');
var cat = svc.catalog('fubar');
console.log(cat);
console.log(cat.name);
var sch = cat.schema('foo');
console.log(sch);
