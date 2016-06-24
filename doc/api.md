<a name="ERMrest"></a>
## ERMrest : <code>object</code>
The ERMrest module is a JavaScript client library for the ERMrest
service.

IMPORTANT NOTE: This module is a work in progress.
It is likely to change several times before we have an interface we wish
to use for ERMrest JavaScript agents.

**Kind**: global namespace  

* [ERMrest](#ERMrest) : <code>object</code>
    * [.Server](#ERMrest.Server)
        * [new Server(uri)](#new_ERMrest.Server_new)
        * [.uri](#ERMrest.Server+uri) : <code>String</code>
        * [.catalogs](#ERMrest.Server+catalogs) : <code>[Catalogs](#ERMrest.Catalogs)</code>
    * [.Catalogs](#ERMrest.Catalogs)
        * [new Catalogs(server)](#new_ERMrest.Catalogs_new)
        * [.length()](#ERMrest.Catalogs+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Catalogs+names) ⇒ <code>Array</code>
        * [.get(id)](#ERMrest.Catalogs+get) ⇒ <code>Promise</code>
    * [.Catalog](#ERMrest.Catalog)
        * [new Catalog(server, id)](#new_ERMrest.Catalog_new)
        * [.server](#ERMrest.Catalog+server) : <code>[Server](#ERMrest.Server)</code>
        * [.id](#ERMrest.Catalog+id) : <code>String</code>
        * [.schemas](#ERMrest.Catalog+schemas) : <code>[Schemas](#ERMrest.Schemas)</code>
    * [.Schemas](#ERMrest.Schemas)
        * [new Schemas()](#new_ERMrest.Schemas_new)
        * [.length()](#ERMrest.Schemas+length) ⇒ <code>Number</code>
        * [.all()](#ERMrest.Schemas+all) ⇒ <code>Array</code>
        * [.names()](#ERMrest.Schemas+names) ⇒ <code>Array</code>
        * [.get(name)](#ERMrest.Schemas+get) ⇒ <code>[Schema](#ERMrest.Schema)</code>
    * [.Schema](#ERMrest.Schema)
        * [new Schema(catalog, jsonSchema)](#new_ERMrest.Schema_new)
        * [.catalog](#ERMrest.Schema+catalog) : <code>[Catalog](#ERMrest.Catalog)</code>
        * [.name](#ERMrest.Schema+name)
        * [.tables](#ERMrest.Schema+tables) : <code>[Tables](#ERMrest.Tables)</code>
        * [.ignore](#ERMrest.Schema+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.Schema+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
        * [.displayname](#ERMrest.Schema+displayname) : <code>String</code>
    * [.Tables](#ERMrest.Tables)
        * [new Tables()](#new_ERMrest.Tables_new)
        * [.all()](#ERMrest.Tables+all) ⇒ <code>Array</code>
        * [.length()](#ERMrest.Tables+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Tables+names) ⇒ <code>Array</code>
        * [.get(name)](#ERMrest.Tables+get) ⇒ <code>[Table](#ERMrest.Table)</code>
    * [.Table](#ERMrest.Table)
        * [new Table(schema, jsonTable)](#new_ERMrest.Table_new)
        * _instance_
            * [.schema](#ERMrest.Table+schema) : <code>[Schema](#ERMrest.Schema)</code>
            * [.name](#ERMrest.Table+name)
            * [.entity](#ERMrest.Table+entity) : <code>[Entity](#ERMrest.Table.Entity)</code>
            * [.columns](#ERMrest.Table+columns) : <code>[Columns](#ERMrest.Columns)</code>
            * [.keys](#ERMrest.Table+keys) : <code>[Keys](#ERMrest.Keys)</code>
            * [.foreignKeys](#ERMrest.Table+foreignKeys) : <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>
            * [.ignore](#ERMrest.Table+ignore) : <code>boolean</code>
            * [.annotations](#ERMrest.Table+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
            * [.displayname](#ERMrest.Table+displayname) : <code>String</code>
        * _static_
            * [.Entity](#ERMrest.Table.Entity)
                * [new Entity(table)](#new_ERMrest.Table.Entity_new)
                * [.count([filter])](#ERMrest.Table.Entity+count) ⇒ <code>Promise</code>
                * [.get([filter], [limit], [columns], [sortby])](#ERMrest.Table.Entity+get) ⇒ <code>Promise</code>
                * [.getBefore(filter, limit, [columns], [sortby], row)](#ERMrest.Table.Entity+getBefore) ⇒ <code>Promise</code>
                * [.getAfter(filter, limit, [columns], [sortby], row)](#ERMrest.Table.Entity+getAfter) ⇒ <code>Promise</code>
                * [.delete(filter)](#ERMrest.Table.Entity+delete) ⇒ <code>Promise</code>
                * [.put(rows)](#ERMrest.Table.Entity+put) ⇒ <code>Promise</code>
                * [.post(rows, defaults)](#ERMrest.Table.Entity+post) ⇒ <code>Promise</code>
    * [.RowSet](#ERMrest.RowSet)
        * [new RowSet(table, jsonRows, filter, limit, columns, [sortby])](#new_ERMrest.RowSet_new)
        * [.data](#ERMrest.RowSet+data) : <code>Array</code>
        * [.length()](#ERMrest.RowSet+length) ⇒ <code>number</code>
        * [.after()](#ERMrest.RowSet+after) ⇒ <code>Promise</code>
        * [.before()](#ERMrest.RowSet+before) ⇒ <code>Promise</code>
    * [.Columns](#ERMrest.Columns)
        * [new Columns()](#new_ERMrest.Columns_new)
        * [.all()](#ERMrest.Columns+all) ⇒ <code>Array</code>
        * [.length()](#ERMrest.Columns+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Columns+names) ⇒ <code>Array</code>
        * [.get(name)](#ERMrest.Columns+get) ⇒ <code>[Column](#ERMrest.Column)</code>
    * [.Column](#ERMrest.Column)
        * [new Column(table, jsonColumn)](#new_ERMrest.Column_new)
        * [.table](#ERMrest.Column+table) : <code>[Table](#ERMrest.Table)</code>
        * [.name](#ERMrest.Column+name) : <code>String</code>
        * [.type](#ERMrest.Column+type) : <code>[Type](#ERMrest.Type)</code>
        * [.nullok](#ERMrest.Column+nullok) : <code>Boolean</code>
        * [.default](#ERMrest.Column+default) : <code>String</code>
        * [.comment](#ERMrest.Column+comment) : <code>String</code>
        * [.ignore](#ERMrest.Column+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.Column+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
        * [.displayname](#ERMrest.Column+displayname) : <code>String</code>
        * [.memberOfKeys](#ERMrest.Column+memberOfKeys) : <code>[Array.&lt;Key&gt;](#ERMrest.Key)</code>
        * [.memberOfForeignKeys](#ERMrest.Column+memberOfForeignKeys) : <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>
    * [.Annotations](#ERMrest.Annotations)
        * [new Annotations()](#new_ERMrest.Annotations_new)
        * [.all()](#ERMrest.Annotations+all) ⇒ <code>[Array.&lt;Annotation&gt;](#ERMrest.Annotation)</code>
        * [.length()](#ERMrest.Annotations+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Annotations+names) ⇒ <code>Array</code>
        * [.get(uri)](#ERMrest.Annotations+get) ⇒ <code>[Annotation](#ERMrest.Annotation)</code>
        * [.contains(uri)](#ERMrest.Annotations+contains) ⇒ <code>boolean</code>
    * [.Annotation](#ERMrest.Annotation)
        * [new Annotation(subject, uri, jsonAnnotation)](#new_ERMrest.Annotation_new)
        * [.subject](#ERMrest.Annotation+subject) : <code>String</code>
        * [.content](#ERMrest.Annotation+content) : <code>String</code>
    * [.Keys](#ERMrest.Keys)
        * [new Keys()](#new_ERMrest.Keys_new)
        * [.all()](#ERMrest.Keys+all) ⇒ <code>Array.&lt;Key&gt;</code>
        * [.length()](#ERMrest.Keys+length) ⇒ <code>Number</code>
        * [.colsets()](#ERMrest.Keys+colsets) ⇒ <code>[Array.&lt;ColSet&gt;](#ERMrest.ColSet)</code>
        * [.get(colset)](#ERMrest.Keys+get) ⇒ <code>[Key](#ERMrest.Key)</code>
    * [.Key](#ERMrest.Key)
        * [new Key(table, jsonKey)](#new_ERMrest.Key_new)
        * [.table](#ERMrest.Key+table) : <code>Table</code>
        * [.colset](#ERMrest.Key+colset) : <code>[ColSet](#ERMrest.ColSet)</code>
        * [.annotations](#ERMrest.Key+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
        * [.simple](#ERMrest.Key+simple) : <code>Boolean</code>
    * [.ColSet](#ERMrest.ColSet)
        * [new ColSet(columns)](#new_ERMrest.ColSet_new)
        * [.columns](#ERMrest.ColSet+columns) : <code>Array</code>
        * [.length()](#ERMrest.ColSet+length) ⇒ <code>Number</code>
    * [.Mapping](#ERMrest.Mapping)
        * [new Mapping(from, to)](#new_ERMrest.Mapping_new)
        * [.length()](#ERMrest.Mapping+length) ⇒ <code>Number</code>
        * [.domain()](#ERMrest.Mapping+domain) ⇒ <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code>
        * [.get(fromCol)](#ERMrest.Mapping+get) ⇒ <code>[Column](#ERMrest.Column)</code>
    * [.ForeignKeys](#ERMrest.ForeignKeys)
        * [.all()](#ERMrest.ForeignKeys+all) ⇒ <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>
        * [.colsets()](#ERMrest.ForeignKeys+colsets) ⇒ <code>[Array.&lt;ColSet&gt;](#ERMrest.ColSet)</code>
        * [.length()](#ERMrest.ForeignKeys+length) ⇒ <code>Number</code>
        * [.mappings()](#ERMrest.ForeignKeys+mappings) ⇒ <code>[Array.&lt;Mapping&gt;](#ERMrest.Mapping)</code>
        * [.get(colset)](#ERMrest.ForeignKeys+get) ⇒ <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>
    * [.ForeignKeyRef](#ERMrest.ForeignKeyRef)
        * [new ForeignKeyRef(table, jsonFKR)](#new_ERMrest.ForeignKeyRef_new)
        * [.colset](#ERMrest.ForeignKeyRef+colset) : <code>[ColSet](#ERMrest.ColSet)</code>
        * [.key](#ERMrest.ForeignKeyRef+key) : <code>[Key](#ERMrest.Key)</code>
        * [.mapping](#ERMrest.ForeignKeyRef+mapping) : <code>[Mapping](#ERMrest.Mapping)</code>
        * [.ignore](#ERMrest.ForeignKeyRef+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.ForeignKeyRef+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
        * [.simple](#ERMrest.ForeignKeyRef+simple) : <code>Boolean</code>
        * [.getDomainValues(limit)](#ERMrest.ForeignKeyRef+getDomainValues) ⇒ <code>Promise</code>
    * [.Type](#ERMrest.Type)
        * [new Type(name)](#new_ERMrest.Type_new)
        * [.name](#ERMrest.Type+name)
    * [.Datapath](#ERMrest.Datapath) : <code>object</code>
        * [.DataPath](#ERMrest.Datapath.DataPath)
            * [new DataPath(table)](#new_ERMrest.Datapath.DataPath_new)
            * [.catalog](#ERMrest.Datapath.DataPath+catalog) : <code>[Catalog](#ERMrest.Catalog)</code>
            * [.context](#ERMrest.Datapath.DataPath+context) : <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
            * [.entity](#ERMrest.Datapath.DataPath+entity)
                * [.get()](#ERMrest.Datapath.DataPath+entity.get) ⇒ <code>Promise</code>
                * [.delete(filter)](#ERMrest.Datapath.DataPath+entity.delete) ⇒ <code>Promise</code>
            * [.filter(filter)](#ERMrest.Datapath.DataPath+filter) ⇒ <code>[DataPath](#ERMrest.Datapath.DataPath)</code>
            * [.extend(table, context, link)](#ERMrest.Datapath.DataPath+extend) ⇒ <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
        * [.PathTable](#ERMrest.Datapath.PathTable)
            * [new PathTable(table, datapath, alias)](#new_ERMrest.Datapath.PathTable_new)
            * [.datapath](#ERMrest.Datapath.PathTable+datapath) : <code>[DataPath](#ERMrest.Datapath.DataPath)</code>
            * [.table](#ERMrest.Datapath.PathTable+table) : <code>[Table](#ERMrest.Table)</code>
            * [.alias](#ERMrest.Datapath.PathTable+alias) : <code>string</code>
            * [.columns](#ERMrest.Datapath.PathTable+columns) : <code>[Columns](#ERMrest.Datapath.Columns)</code>
            * [.toString()](#ERMrest.Datapath.PathTable+toString) ⇒ <code>string</code>
        * [.PathColumn](#ERMrest.Datapath.PathColumn)
            * [new PathColumn(column, pathtable)](#new_ERMrest.Datapath.PathColumn_new)
            * [.pathtable](#ERMrest.Datapath.PathColumn+pathtable) : <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
            * [.column](#ERMrest.Datapath.PathColumn+column) : <code>[Column](#ERMrest.Column)</code>
        * [.Columns(table, pathtable)](#ERMrest.Datapath.Columns)
            * [.length()](#ERMrest.Datapath.Columns+length) ⇒ <code>Number</code>
            * [.names()](#ERMrest.Datapath.Columns+names) ⇒ <code>Array.&lt;String&gt;</code>
            * [.get(colName)](#ERMrest.Datapath.Columns+get) ⇒ <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code>
        * [.Operators()](#ERMrest.Datapath.Operators)
    * [.Filters](#ERMrest.Filters) : <code>object</code>
        * [.Negation](#ERMrest.Filters.Negation)
            * [new Negation(filter)](#new_ERMrest.Filters.Negation_new)
            * [.toUri()](#ERMrest.Filters.Negation+toUri) ⇒ <code>string</code>
        * [.Conjunction](#ERMrest.Filters.Conjunction)
            * [new Conjunction(filters)](#new_ERMrest.Filters.Conjunction_new)
            * [.toUri()](#ERMrest.Filters.Conjunction+toUri) ⇒ <code>string</code>
        * [.Disjunction](#ERMrest.Filters.Disjunction)
            * [new Disjunction(filters)](#new_ERMrest.Filters.Disjunction_new)
            * [.toUri()](#ERMrest.Filters.Disjunction+toUri) ⇒ <code>string</code>
        * [.UnaryPredicate](#ERMrest.Filters.UnaryPredicate)
            * [new UnaryPredicate(column, operator)](#new_ERMrest.Filters.UnaryPredicate_new)
            * [.toUri()](#ERMrest.Filters.UnaryPredicate+toUri) ⇒ <code>string</code>
        * [.BinaryPredicate](#ERMrest.Filters.BinaryPredicate)
            * [new BinaryPredicate(column, operator, rvalue)](#new_ERMrest.Filters.BinaryPredicate_new)
            * [.toUri()](#ERMrest.Filters.BinaryPredicate+toUri) ⇒ <code>string</code>
    * [.Errors](#ERMrest.Errors) : <code>object</code>
        * [.TimedOutError](#ERMrest.Errors.TimedOutError)
            * [new TimedOutError(status, message)](#new_ERMrest.Errors.TimedOutError_new)
        * [.BadRequestError](#ERMrest.Errors.BadRequestError)
            * [new BadRequestError(status, message)](#new_ERMrest.Errors.BadRequestError_new)
        * [.UnauthorizedError](#ERMrest.Errors.UnauthorizedError)
            * [new UnauthorizedError(status, message)](#new_ERMrest.Errors.UnauthorizedError_new)
        * [.ForbiddenError](#ERMrest.Errors.ForbiddenError)
            * [new ForbiddenError(status, message)](#new_ERMrest.Errors.ForbiddenError_new)
        * [.NotFoundError](#ERMrest.Errors.NotFoundError)
            * [new NotFoundError(status, message)](#new_ERMrest.Errors.NotFoundError_new)
        * [.ConflictError](#ERMrest.Errors.ConflictError)
            * [new ConflictError(status, message)](#new_ERMrest.Errors.ConflictError_new)
        * [.InternalServerError](#ERMrest.Errors.InternalServerError)
            * [new InternalServerError(status, message)](#new_ERMrest.Errors.InternalServerError_new)
        * [.ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError)
            * [new ServiceUnavailableError(status, message)](#new_ERMrest.Errors.ServiceUnavailableError_new)
        * [.InvalidFilterOperatorError](#ERMrest.Errors.InvalidFilterOperatorError)
            * [new InvalidFilterOperatorError(message)](#new_ERMrest.Errors.InvalidFilterOperatorError_new)
        * [.InvalidInputError](#ERMrest.Errors.InvalidInputError)
            * [new InvalidInputError(message)](#new_ERMrest.Errors.InvalidInputError_new)
    * [.Errors](#ERMrest.Errors) : <code>object</code>
        * [.TimedOutError](#ERMrest.Errors.TimedOutError)
            * [new TimedOutError(status, message)](#new_ERMrest.Errors.TimedOutError_new)
        * [.BadRequestError](#ERMrest.Errors.BadRequestError)
            * [new BadRequestError(status, message)](#new_ERMrest.Errors.BadRequestError_new)
        * [.UnauthorizedError](#ERMrest.Errors.UnauthorizedError)
            * [new UnauthorizedError(status, message)](#new_ERMrest.Errors.UnauthorizedError_new)
        * [.ForbiddenError](#ERMrest.Errors.ForbiddenError)
            * [new ForbiddenError(status, message)](#new_ERMrest.Errors.ForbiddenError_new)
        * [.NotFoundError](#ERMrest.Errors.NotFoundError)
            * [new NotFoundError(status, message)](#new_ERMrest.Errors.NotFoundError_new)
        * [.ConflictError](#ERMrest.Errors.ConflictError)
            * [new ConflictError(status, message)](#new_ERMrest.Errors.ConflictError_new)
        * [.InternalServerError](#ERMrest.Errors.InternalServerError)
            * [new InternalServerError(status, message)](#new_ERMrest.Errors.InternalServerError_new)
        * [.ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError)
            * [new ServiceUnavailableError(status, message)](#new_ERMrest.Errors.ServiceUnavailableError_new)
        * [.InvalidFilterOperatorError](#ERMrest.Errors.InvalidFilterOperatorError)
            * [new InvalidFilterOperatorError(message)](#new_ERMrest.Errors.InvalidFilterOperatorError_new)
        * [.InvalidInputError](#ERMrest.Errors.InvalidInputError)
            * [new InvalidInputError(message)](#new_ERMrest.Errors.InvalidInputError_new)
    * [.configure(http, q)](#ERMrest.configure)
    * [.getServer(uri)](#ERMrest.getServer) ⇒ <code>[Server](#ERMrest.Server)</code>

<a name="ERMrest.Server"></a>
### ERMrest.Server
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Server](#ERMrest.Server)
    * [new Server(uri)](#new_ERMrest.Server_new)
    * [.uri](#ERMrest.Server+uri) : <code>String</code>
    * [.catalogs](#ERMrest.Server+catalogs) : <code>[Catalogs](#ERMrest.Catalogs)</code>

<a name="new_ERMrest.Server_new"></a>
#### new Server(uri)

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | URI of the ERMrest service. |

<a name="ERMrest.Server+uri"></a>
#### server.uri : <code>String</code>
**Kind**: instance property of <code>[Server](#ERMrest.Server)</code>  
<a name="ERMrest.Server+catalogs"></a>
#### server.catalogs : <code>[Catalogs](#ERMrest.Catalogs)</code>
**Kind**: instance property of <code>[Server](#ERMrest.Server)</code>  
<a name="ERMrest.Catalogs"></a>
### ERMrest.Catalogs
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Catalogs](#ERMrest.Catalogs)
    * [new Catalogs(server)](#new_ERMrest.Catalogs_new)
    * [.length()](#ERMrest.Catalogs+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Catalogs+names) ⇒ <code>Array</code>
    * [.get(id)](#ERMrest.Catalogs+get) ⇒ <code>Promise</code>

<a name="new_ERMrest.Catalogs_new"></a>
#### new Catalogs(server)
Constructor for the Catalogs.


| Param | Type | Description |
| --- | --- | --- |
| server | <code>[Server](#ERMrest.Server)</code> | the server object. |

<a name="ERMrest.Catalogs+length"></a>
#### catalogs.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Catalogs](#ERMrest.Catalogs)</code>  
**Returns**: <code>Number</code> - Returns the length of the catalogs.  
<a name="ERMrest.Catalogs+names"></a>
#### catalogs.names() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Catalogs](#ERMrest.Catalogs)</code>  
**Returns**: <code>Array</code> - Returns an array of names of catalogs.  
<a name="ERMrest.Catalogs+get"></a>
#### catalogs.get(id) ⇒ <code>Promise</code>
Get a catalog by id. This call does catalog introspection.

**Kind**: instance method of <code>[Catalogs](#ERMrest.Catalogs)</code>  
**Returns**: <code>Promise</code> - a promise that returns the catalog  if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    [NotFoundError](#ERMrest.Errors.NotFoundError), [ForbiddenError](#ERMrest.Errors.ForbiddenError) or [UnauthorizedError](#ERMrest.Errors.UnauthorizedError) if rejected  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | Catalog ID. |

<a name="ERMrest.Catalog"></a>
### ERMrest.Catalog
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Catalog](#ERMrest.Catalog)
    * [new Catalog(server, id)](#new_ERMrest.Catalog_new)
    * [.server](#ERMrest.Catalog+server) : <code>[Server](#ERMrest.Server)</code>
    * [.id](#ERMrest.Catalog+id) : <code>String</code>
    * [.schemas](#ERMrest.Catalog+schemas) : <code>[Schemas](#ERMrest.Schemas)</code>

<a name="new_ERMrest.Catalog_new"></a>
#### new Catalog(server, id)
Constructor for the Catalog.


| Param | Type | Description |
| --- | --- | --- |
| server | <code>[Server](#ERMrest.Server)</code> | the server object. |
| id | <code>String</code> | the catalog id. |

<a name="ERMrest.Catalog+server"></a>
#### catalog.server : <code>[Server](#ERMrest.Server)</code>
**Kind**: instance property of <code>[Catalog](#ERMrest.Catalog)</code>  
<a name="ERMrest.Catalog+id"></a>
#### catalog.id : <code>String</code>
**Kind**: instance property of <code>[Catalog](#ERMrest.Catalog)</code>  
<a name="ERMrest.Catalog+schemas"></a>
#### catalog.schemas : <code>[Schemas](#ERMrest.Schemas)</code>
**Kind**: instance property of <code>[Catalog](#ERMrest.Catalog)</code>  
<a name="ERMrest.Schemas"></a>
### ERMrest.Schemas
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Schemas](#ERMrest.Schemas)
    * [new Schemas()](#new_ERMrest.Schemas_new)
    * [.length()](#ERMrest.Schemas+length) ⇒ <code>Number</code>
    * [.all()](#ERMrest.Schemas+all) ⇒ <code>Array</code>
    * [.names()](#ERMrest.Schemas+names) ⇒ <code>Array</code>
    * [.get(name)](#ERMrest.Schemas+get) ⇒ <code>[Schema](#ERMrest.Schema)</code>

<a name="new_ERMrest.Schemas_new"></a>
#### new Schemas()
Constructor for the Schemas.

<a name="ERMrest.Schemas+length"></a>
#### schemas.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Schemas](#ERMrest.Schemas)</code>  
**Returns**: <code>Number</code> - number of schemas  
<a name="ERMrest.Schemas+all"></a>
#### schemas.all() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Schemas](#ERMrest.Schemas)</code>  
**Returns**: <code>Array</code> - Array of all schemas in the catalog  
<a name="ERMrest.Schemas+names"></a>
#### schemas.names() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Schemas](#ERMrest.Schemas)</code>  
**Returns**: <code>Array</code> - Array of schema names  
<a name="ERMrest.Schemas+get"></a>
#### schemas.get(name) ⇒ <code>[Schema](#ERMrest.Schema)</code>
get schema by schema name

**Kind**: instance method of <code>[Schemas](#ERMrest.Schemas)</code>  
**Returns**: <code>[Schema](#ERMrest.Schema)</code> - schema object  
**Throws**:

- <code>[NotFoundError](#ERMrest.Errors.NotFoundError)</code> schema not found


| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | schema name |

<a name="ERMrest.Schema"></a>
### ERMrest.Schema
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Schema](#ERMrest.Schema)
    * [new Schema(catalog, jsonSchema)](#new_ERMrest.Schema_new)
    * [.catalog](#ERMrest.Schema+catalog) : <code>[Catalog](#ERMrest.Catalog)</code>
    * [.name](#ERMrest.Schema+name)
    * [.tables](#ERMrest.Schema+tables) : <code>[Tables](#ERMrest.Tables)</code>
    * [.ignore](#ERMrest.Schema+ignore) : <code>boolean</code>
    * [.annotations](#ERMrest.Schema+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
    * [.displayname](#ERMrest.Schema+displayname) : <code>String</code>

<a name="new_ERMrest.Schema_new"></a>
#### new Schema(catalog, jsonSchema)
Constructor for the Catalog.


| Param | Type | Description |
| --- | --- | --- |
| catalog | <code>[Catalog](#ERMrest.Catalog)</code> | the catalog object. |
| jsonSchema | <code>String</code> | json of the schema. |

<a name="ERMrest.Schema+catalog"></a>
#### schema.catalog : <code>[Catalog](#ERMrest.Catalog)</code>
**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+name"></a>
#### schema.name
**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+tables"></a>
#### schema.tables : <code>[Tables](#ERMrest.Tables)</code>
**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+ignore"></a>
#### schema.ignore : <code>boolean</code>
**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+annotations"></a>
#### schema.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+displayname"></a>
#### schema.displayname : <code>String</code>
Preferred display name for user presentation only.

**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Tables"></a>
### ERMrest.Tables
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Tables](#ERMrest.Tables)
    * [new Tables()](#new_ERMrest.Tables_new)
    * [.all()](#ERMrest.Tables+all) ⇒ <code>Array</code>
    * [.length()](#ERMrest.Tables+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Tables+names) ⇒ <code>Array</code>
    * [.get(name)](#ERMrest.Tables+get) ⇒ <code>[Table](#ERMrest.Table)</code>

<a name="new_ERMrest.Tables_new"></a>
#### new Tables()
Constructor for the Tables.

<a name="ERMrest.Tables+all"></a>
#### tables.all() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Tables](#ERMrest.Tables)</code>  
**Returns**: <code>Array</code> - array of tables  
<a name="ERMrest.Tables+length"></a>
#### tables.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Tables](#ERMrest.Tables)</code>  
**Returns**: <code>Number</code> - number of tables  
<a name="ERMrest.Tables+names"></a>
#### tables.names() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Tables](#ERMrest.Tables)</code>  
**Returns**: <code>Array</code> - Array of table names  
<a name="ERMrest.Tables+get"></a>
#### tables.get(name) ⇒ <code>[Table](#ERMrest.Table)</code>
get table by table name

**Kind**: instance method of <code>[Tables](#ERMrest.Tables)</code>  
**Returns**: <code>[Table](#ERMrest.Table)</code> - table  
**Throws**:

- <code>[NotFoundError](#ERMrest.Errors.NotFoundError)</code> table not found


| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | name of table |

<a name="ERMrest.Table"></a>
### ERMrest.Table
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Table](#ERMrest.Table)
    * [new Table(schema, jsonTable)](#new_ERMrest.Table_new)
    * _instance_
        * [.schema](#ERMrest.Table+schema) : <code>[Schema](#ERMrest.Schema)</code>
        * [.name](#ERMrest.Table+name)
        * [.entity](#ERMrest.Table+entity) : <code>[Entity](#ERMrest.Table.Entity)</code>
        * [.columns](#ERMrest.Table+columns) : <code>[Columns](#ERMrest.Columns)</code>
        * [.keys](#ERMrest.Table+keys) : <code>[Keys](#ERMrest.Keys)</code>
        * [.foreignKeys](#ERMrest.Table+foreignKeys) : <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>
        * [.ignore](#ERMrest.Table+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.Table+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
        * [.displayname](#ERMrest.Table+displayname) : <code>String</code>
    * _static_
        * [.Entity](#ERMrest.Table.Entity)
            * [new Entity(table)](#new_ERMrest.Table.Entity_new)
            * [.count([filter])](#ERMrest.Table.Entity+count) ⇒ <code>Promise</code>
            * [.get([filter], [limit], [columns], [sortby])](#ERMrest.Table.Entity+get) ⇒ <code>Promise</code>
            * [.getBefore(filter, limit, [columns], [sortby], row)](#ERMrest.Table.Entity+getBefore) ⇒ <code>Promise</code>
            * [.getAfter(filter, limit, [columns], [sortby], row)](#ERMrest.Table.Entity+getAfter) ⇒ <code>Promise</code>
            * [.delete(filter)](#ERMrest.Table.Entity+delete) ⇒ <code>Promise</code>
            * [.put(rows)](#ERMrest.Table.Entity+put) ⇒ <code>Promise</code>
            * [.post(rows, defaults)](#ERMrest.Table.Entity+post) ⇒ <code>Promise</code>

<a name="new_ERMrest.Table_new"></a>
#### new Table(schema, jsonTable)
Constructor for Table.


| Param | Type | Description |
| --- | --- | --- |
| schema | <code>[Schema](#ERMrest.Schema)</code> | the schema object. |
| jsonTable | <code>String</code> | the json of the table. |

<a name="ERMrest.Table+schema"></a>
#### table.schema : <code>[Schema](#ERMrest.Schema)</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+name"></a>
#### table.name
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+entity"></a>
#### table.entity : <code>[Entity](#ERMrest.Table.Entity)</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+columns"></a>
#### table.columns : <code>[Columns](#ERMrest.Columns)</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+keys"></a>
#### table.keys : <code>[Keys](#ERMrest.Keys)</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+foreignKeys"></a>
#### table.foreignKeys : <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+ignore"></a>
#### table.ignore : <code>boolean</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+annotations"></a>
#### table.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+displayname"></a>
#### table.displayname : <code>String</code>
Preferred display name for user presentation only.

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table.Entity"></a>
#### Table.Entity
**Kind**: static class of <code>[Table](#ERMrest.Table)</code>  

* [.Entity](#ERMrest.Table.Entity)
    * [new Entity(table)](#new_ERMrest.Table.Entity_new)
    * [.count([filter])](#ERMrest.Table.Entity+count) ⇒ <code>Promise</code>
    * [.get([filter], [limit], [columns], [sortby])](#ERMrest.Table.Entity+get) ⇒ <code>Promise</code>
    * [.getBefore(filter, limit, [columns], [sortby], row)](#ERMrest.Table.Entity+getBefore) ⇒ <code>Promise</code>
    * [.getAfter(filter, limit, [columns], [sortby], row)](#ERMrest.Table.Entity+getAfter) ⇒ <code>Promise</code>
    * [.delete(filter)](#ERMrest.Table.Entity+delete) ⇒ <code>Promise</code>
    * [.put(rows)](#ERMrest.Table.Entity+put) ⇒ <code>Promise</code>
    * [.post(rows, defaults)](#ERMrest.Table.Entity+post) ⇒ <code>Promise</code>

<a name="new_ERMrest.Table.Entity_new"></a>
##### new Entity(table)
Constructor for Entity. This is a container in Table


| Param | Type |
| --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | 

<a name="ERMrest.Table.Entity+count"></a>
##### entity.count([filter]) ⇒ <code>Promise</code>
get the number of rows

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - promise returning number of count if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    [ConflictError](#ERMrest.Errors.ConflictError), [ForbiddenError](#ERMrest.Errors.ForbiddenError) or [UnauthorizedError](#ERMrest.Errors.UnauthorizedError) if rejected  

| Param | Type |
| --- | --- |
| [filter] | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> | 

<a name="ERMrest.Table.Entity+get"></a>
##### entity.get([filter], [limit], [columns], [sortby]) ⇒ <code>Promise</code>
get table rows with option filter, row limit and selected columns (in this order).

In order to use before & after on a rowset, limit must be speficied,
output columns and sortby needs to have columns of a key

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - promise returning rowset if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    ERMrest.Errors.Conflict, ERMrest.Errors.ForbiddenError or ERMrest.Errors.Unauthorized if rejected  

| Param | Type | Description |
| --- | --- | --- |
| [filter] | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> |  |
| [limit] | <code>Number</code> | Number of rows |
| [columns] | <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> &#124; <code>Array.&lt;string&gt;</code> | Array of column names or Column objects output |
| [sortby] | <code>Array.&lt;Object&gt;</code> | An ordered array of {column, order} where column is column name or Column object, order is null (default), 'asc' or 'desc' |

<a name="ERMrest.Table.Entity+getBefore"></a>
##### entity.getBefore(filter, limit, [columns], [sortby], row) ⇒ <code>Promise</code>
get a page of rows before a specific row

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - promise returning rowset if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    ERMrest.Errors.Conflict, ERMrest.Errors.ForbiddenError or ERMrest.Errors.Unauthorized if rejected  

| Param | Type | Description |
| --- | --- | --- |
| filter | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> &#124; <code>null</code> | null if not being used |
| limit | <code>Number</code> | Required. Number of rows |
| [columns] | <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> &#124; <code>Array.&lt;String&gt;</code> | Array of column names or Column objects output |
| [sortby] | <code>Array.&lt;Object&gt;</code> | ordered array of {column, order} where column is column name or Column object, order is null (default), 'asc' or 'desc' |
| row | <code>Object</code> | json row data used to getBefore |

<a name="ERMrest.Table.Entity+getAfter"></a>
##### entity.getAfter(filter, limit, [columns], [sortby], row) ⇒ <code>Promise</code>
get a page of rows after a specific row

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - promise returning rowset if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    ERMrest.Errors.Conflict, ERMrest.Errors.ForbiddenError or ERMrest.Errors.Unauthorized if rejected  

| Param | Type | Description |
| --- | --- | --- |
| filter | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> &#124; <code>null</code> | null is not being used |
| limit | <code>Number</code> | Required. Number of rows |
| [columns] | <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> &#124; <code>Array.&lt;String&gt;</code> | Array of column names or Column objects output |
| [sortby] | <code>Array.&lt;Object&gt;</code> | ordered array of {column, order} where column is column name or Column object, order is null (default), 'asc' or 'desc' |
| row | <code>Object</code> | json row data used to getAfter |

<a name="ERMrest.Table.Entity+delete"></a>
##### entity.delete(filter) ⇒ <code>Promise</code>
Delete rows from table based on the filter

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - Promise that returns the json row data deleted if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    [ConflictError](#ERMrest.Errors.ConflictError), [ForbiddenError](#ERMrest.Errors.ForbiddenError) or [UnauthorizedError](#ERMrest.Errors.UnauthorizedError) if rejected  

| Param | Type |
| --- | --- |
| filter | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> | 

<a name="ERMrest.Table.Entity+put"></a>
##### entity.put(rows) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - Promise that returns the rows updated if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    [ConflictError](#ERMrest.Errors.ConflictError), [ForbiddenError](#ERMrest.Errors.ForbiddenError) or [UnauthorizedError](#ERMrest.Errors.UnauthorizedError) if rejected
Update rows in the table  

| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Object</code> | jSON representation of the updated rows |

<a name="ERMrest.Table.Entity+post"></a>
##### entity.post(rows, defaults) ⇒ <code>Promise</code>
Create new entities

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - Promise that returns the rows created if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    [BadRequestError](#ERMrest.Errors.BadRequestError), [ConflictError](#ERMrest.Errors.ConflictError), [ForbiddenError](#ERMrest.Errors.ForbiddenError) or [UnauthorizedError](#ERMrest.Errors.UnauthorizedError) if rejected  

| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Object</code> | Array of jSON representation of rows |
| defaults | <code>Array.&lt;String&gt;</code> | Array of string column names to be defaults |

<a name="ERMrest.RowSet"></a>
### ERMrest.RowSet
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.RowSet](#ERMrest.RowSet)
    * [new RowSet(table, jsonRows, filter, limit, columns, [sortby])](#new_ERMrest.RowSet_new)
    * [.data](#ERMrest.RowSet+data) : <code>Array</code>
    * [.length()](#ERMrest.RowSet+length) ⇒ <code>number</code>
    * [.after()](#ERMrest.RowSet+after) ⇒ <code>Promise</code>
    * [.before()](#ERMrest.RowSet+before) ⇒ <code>Promise</code>

<a name="new_ERMrest.RowSet_new"></a>
#### new RowSet(table, jsonRows, filter, limit, columns, [sortby])

| Param | Type | Description |
| --- | --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> |  |
| jsonRows | <code>Object</code> |  |
| filter | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> &#124; <code>null</code> | null if not being used |
| limit | <code>Number</code> | Number of rows |
| columns | <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> &#124; <code>Array.&lt;String&gt;</code> | Array of column names or Column objects output |
| [sortby] | <code>Array.&lt;Object&gt;</code> | An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc' |

<a name="ERMrest.RowSet+data"></a>
#### rowSet.data : <code>Array</code>
The set of rows returns from the server. It is an Array of
Objects that has keys and values based on the query that produced
the RowSet.

**Kind**: instance property of <code>[RowSet](#ERMrest.RowSet)</code>  
<a name="ERMrest.RowSet+length"></a>
#### rowSet.length() ⇒ <code>number</code>
**Kind**: instance method of <code>[RowSet](#ERMrest.RowSet)</code>  
<a name="ERMrest.RowSet+after"></a>
#### rowSet.after() ⇒ <code>Promise</code>
get the rowset of the next page

**Kind**: instance method of <code>[RowSet](#ERMrest.RowSet)</code>  
**Returns**: <code>Promise</code> - promise that returns a rowset if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    [ConflictError](#ERMrest.Errors.ConflictError), [ForbiddenError](#ERMrest.Errors.ForbiddenError) or [UnauthorizedError](#ERMrest.Errors.UnauthorizedError) if rejected  
<a name="ERMrest.RowSet+before"></a>
#### rowSet.before() ⇒ <code>Promise</code>
get the rowset of the previous page

**Kind**: instance method of <code>[RowSet](#ERMrest.RowSet)</code>  
**Returns**: <code>Promise</code> - promise that returns a rowset if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    [ConflictError](#ERMrest.Errors.ConflictError), [ForbiddenError](#ERMrest.Errors.ForbiddenError) or [UnauthorizedError](#ERMrest.Errors.UnauthorizedError) if rejected  
<a name="ERMrest.Columns"></a>
### ERMrest.Columns
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Columns](#ERMrest.Columns)
    * [new Columns()](#new_ERMrest.Columns_new)
    * [.all()](#ERMrest.Columns+all) ⇒ <code>Array</code>
    * [.length()](#ERMrest.Columns+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Columns+names) ⇒ <code>Array</code>
    * [.get(name)](#ERMrest.Columns+get) ⇒ <code>[Column](#ERMrest.Column)</code>

<a name="new_ERMrest.Columns_new"></a>
#### new Columns()
Constructor for Columns.

<a name="ERMrest.Columns+all"></a>
#### columns.all() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Columns)</code>  
**Returns**: <code>Array</code> - array of all columns  
<a name="ERMrest.Columns+length"></a>
#### columns.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Columns)</code>  
**Returns**: <code>Number</code> - number of columns  
<a name="ERMrest.Columns+names"></a>
#### columns.names() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Columns)</code>  
**Returns**: <code>Array</code> - names of columns  
<a name="ERMrest.Columns+get"></a>
#### columns.get(name) ⇒ <code>[Column](#ERMrest.Column)</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Columns)</code>  
**Returns**: <code>[Column](#ERMrest.Column)</code> - column  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | name of column |

<a name="ERMrest.Column"></a>
### ERMrest.Column
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Column](#ERMrest.Column)
    * [new Column(table, jsonColumn)](#new_ERMrest.Column_new)
    * [.table](#ERMrest.Column+table) : <code>[Table](#ERMrest.Table)</code>
    * [.name](#ERMrest.Column+name) : <code>String</code>
    * [.type](#ERMrest.Column+type) : <code>[Type](#ERMrest.Type)</code>
    * [.nullok](#ERMrest.Column+nullok) : <code>Boolean</code>
    * [.default](#ERMrest.Column+default) : <code>String</code>
    * [.comment](#ERMrest.Column+comment) : <code>String</code>
    * [.ignore](#ERMrest.Column+ignore) : <code>boolean</code>
    * [.annotations](#ERMrest.Column+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
    * [.displayname](#ERMrest.Column+displayname) : <code>String</code>
    * [.memberOfKeys](#ERMrest.Column+memberOfKeys) : <code>[Array.&lt;Key&gt;](#ERMrest.Key)</code>
    * [.memberOfForeignKeys](#ERMrest.Column+memberOfForeignKeys) : <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>

<a name="new_ERMrest.Column_new"></a>
#### new Column(table, jsonColumn)
Constructor for Column.


| Param | Type | Description |
| --- | --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | the table object. |
| jsonColumn | <code>String</code> | the json column. |

<a name="ERMrest.Column+table"></a>
#### column.table : <code>[Table](#ERMrest.Table)</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+name"></a>
#### column.name : <code>String</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+type"></a>
#### column.type : <code>[Type](#ERMrest.Type)</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+nullok"></a>
#### column.nullok : <code>Boolean</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+default"></a>
#### column.default : <code>String</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+comment"></a>
#### column.comment : <code>String</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+ignore"></a>
#### column.ignore : <code>boolean</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+annotations"></a>
#### column.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+displayname"></a>
#### column.displayname : <code>String</code>
Preferred display name for user presentation only.

**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+memberOfKeys"></a>
#### column.memberOfKeys : <code>[Array.&lt;Key&gt;](#ERMrest.Key)</code>
keys that this column is a member of

**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+memberOfForeignKeys"></a>
#### column.memberOfForeignKeys : <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>
foreign key that this column is a member of

**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Annotations"></a>
### ERMrest.Annotations
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Annotations](#ERMrest.Annotations)
    * [new Annotations()](#new_ERMrest.Annotations_new)
    * [.all()](#ERMrest.Annotations+all) ⇒ <code>[Array.&lt;Annotation&gt;](#ERMrest.Annotation)</code>
    * [.length()](#ERMrest.Annotations+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Annotations+names) ⇒ <code>Array</code>
    * [.get(uri)](#ERMrest.Annotations+get) ⇒ <code>[Annotation](#ERMrest.Annotation)</code>
    * [.contains(uri)](#ERMrest.Annotations+contains) ⇒ <code>boolean</code>

<a name="new_ERMrest.Annotations_new"></a>
#### new Annotations()
Constructor for Annotations.

<a name="ERMrest.Annotations+all"></a>
#### annotations.all() ⇒ <code>[Array.&lt;Annotation&gt;](#ERMrest.Annotation)</code>
**Kind**: instance method of <code>[Annotations](#ERMrest.Annotations)</code>  
**Returns**: <code>[Array.&lt;Annotation&gt;](#ERMrest.Annotation)</code> - list of all annotations  
<a name="ERMrest.Annotations+length"></a>
#### annotations.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Annotations](#ERMrest.Annotations)</code>  
**Returns**: <code>Number</code> - number of annotations  
<a name="ERMrest.Annotations+names"></a>
#### annotations.names() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Annotations](#ERMrest.Annotations)</code>  
**Returns**: <code>Array</code> - array of annotation names  
<a name="ERMrest.Annotations+get"></a>
#### annotations.get(uri) ⇒ <code>[Annotation](#ERMrest.Annotation)</code>
get annotation by URI

**Kind**: instance method of <code>[Annotations](#ERMrest.Annotations)</code>  
**Returns**: <code>[Annotation](#ERMrest.Annotation)</code> - annotation  
**Throws**:

- <code>[NotFoundError](#ERMrest.Errors.NotFoundError)</code> annotation not found


| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | uri of annotation |

<a name="ERMrest.Annotations+contains"></a>
#### annotations.contains(uri) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[Annotations](#ERMrest.Annotations)</code>  
**Returns**: <code>boolean</code> - whether or not annotation exists  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | uri of annotation |

<a name="ERMrest.Annotation"></a>
### ERMrest.Annotation
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Annotation](#ERMrest.Annotation)
    * [new Annotation(subject, uri, jsonAnnotation)](#new_ERMrest.Annotation_new)
    * [.subject](#ERMrest.Annotation+subject) : <code>String</code>
    * [.content](#ERMrest.Annotation+content) : <code>String</code>

<a name="new_ERMrest.Annotation_new"></a>
#### new Annotation(subject, uri, jsonAnnotation)
Constructor for Annotation.


| Param | Type | Description |
| --- | --- | --- |
| subject | <code>String</code> | subject of the annotation: schema,table,column,key,foreignkeyref. |
| uri | <code>String</code> | uri id of the annotation. |
| jsonAnnotation | <code>String</code> | json of annotation. |

<a name="ERMrest.Annotation+subject"></a>
#### annotation.subject : <code>String</code>
schema,table,column,key,foreignkeyref

**Kind**: instance property of <code>[Annotation](#ERMrest.Annotation)</code>  
<a name="ERMrest.Annotation+content"></a>
#### annotation.content : <code>String</code>
json content

**Kind**: instance property of <code>[Annotation](#ERMrest.Annotation)</code>  
<a name="ERMrest.Keys"></a>
### ERMrest.Keys
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Keys](#ERMrest.Keys)
    * [new Keys()](#new_ERMrest.Keys_new)
    * [.all()](#ERMrest.Keys+all) ⇒ <code>Array.&lt;Key&gt;</code>
    * [.length()](#ERMrest.Keys+length) ⇒ <code>Number</code>
    * [.colsets()](#ERMrest.Keys+colsets) ⇒ <code>[Array.&lt;ColSet&gt;](#ERMrest.ColSet)</code>
    * [.get(colset)](#ERMrest.Keys+get) ⇒ <code>[Key](#ERMrest.Key)</code>

<a name="new_ERMrest.Keys_new"></a>
#### new Keys()
Constructor for Keys.

<a name="ERMrest.Keys+all"></a>
#### keys.all() ⇒ <code>Array.&lt;Key&gt;</code>
**Kind**: instance method of <code>[Keys](#ERMrest.Keys)</code>  
**Returns**: <code>Array.&lt;Key&gt;</code> - a list of all Keys  
<a name="ERMrest.Keys+length"></a>
#### keys.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Keys](#ERMrest.Keys)</code>  
**Returns**: <code>Number</code> - number of keys  
<a name="ERMrest.Keys+colsets"></a>
#### keys.colsets() ⇒ <code>[Array.&lt;ColSet&gt;](#ERMrest.ColSet)</code>
**Kind**: instance method of <code>[Keys](#ERMrest.Keys)</code>  
**Returns**: <code>[Array.&lt;ColSet&gt;](#ERMrest.ColSet)</code> - array of colsets  
<a name="ERMrest.Keys+get"></a>
#### keys.get(colset) ⇒ <code>[Key](#ERMrest.Key)</code>
get the key by the column set

**Kind**: instance method of <code>[Keys](#ERMrest.Keys)</code>  
**Returns**: <code>[Key](#ERMrest.Key)</code> - key of the colset  
**Throws**:

- <code>[NotFoundError](#ERMrest.Errors.NotFoundError)</code> Key not found


| Param | Type |
| --- | --- |
| colset | <code>[ColSet](#ERMrest.ColSet)</code> | 

<a name="ERMrest.Key"></a>
### ERMrest.Key
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Key](#ERMrest.Key)
    * [new Key(table, jsonKey)](#new_ERMrest.Key_new)
    * [.table](#ERMrest.Key+table) : <code>Table</code>
    * [.colset](#ERMrest.Key+colset) : <code>[ColSet](#ERMrest.ColSet)</code>
    * [.annotations](#ERMrest.Key+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
    * [.simple](#ERMrest.Key+simple) : <code>Boolean</code>

<a name="new_ERMrest.Key_new"></a>
#### new Key(table, jsonKey)
Constructor for Key.


| Param | Type | Description |
| --- | --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | the table object. |
| jsonKey | <code>String</code> | json key. |

<a name="ERMrest.Key+table"></a>
#### key.table : <code>Table</code>
Reference to the table that this Key belongs to.

**Kind**: instance property of <code>[Key](#ERMrest.Key)</code>  
<a name="ERMrest.Key+colset"></a>
#### key.colset : <code>[ColSet](#ERMrest.ColSet)</code>
**Kind**: instance property of <code>[Key](#ERMrest.Key)</code>  
<a name="ERMrest.Key+annotations"></a>
#### key.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[Key](#ERMrest.Key)</code>  
<a name="ERMrest.Key+simple"></a>
#### key.simple : <code>Boolean</code>
Indicates if the key is simple (not composite)

**Kind**: instance property of <code>[Key](#ERMrest.Key)</code>  
<a name="ERMrest.ColSet"></a>
### ERMrest.ColSet
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.ColSet](#ERMrest.ColSet)
    * [new ColSet(columns)](#new_ERMrest.ColSet_new)
    * [.columns](#ERMrest.ColSet+columns) : <code>Array</code>
    * [.length()](#ERMrest.ColSet+length) ⇒ <code>Number</code>

<a name="new_ERMrest.ColSet_new"></a>
#### new ColSet(columns)
Constructor for ColSet, a set of Column objects.


| Param | Type | Description |
| --- | --- | --- |
| columns | <code>Array</code> | an array of Column objects. |

<a name="ERMrest.ColSet+columns"></a>
#### colSet.columns : <code>Array</code>
**Kind**: instance property of <code>[ColSet](#ERMrest.ColSet)</code>  
<a name="ERMrest.ColSet+length"></a>
#### colSet.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[ColSet](#ERMrest.ColSet)</code>  
**Returns**: <code>Number</code> - number of columns  
<a name="ERMrest.Mapping"></a>
### ERMrest.Mapping
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Mapping](#ERMrest.Mapping)
    * [new Mapping(from, to)](#new_ERMrest.Mapping_new)
    * [.length()](#ERMrest.Mapping+length) ⇒ <code>Number</code>
    * [.domain()](#ERMrest.Mapping+domain) ⇒ <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code>
    * [.get(fromCol)](#ERMrest.Mapping+get) ⇒ <code>[Column](#ERMrest.Column)</code>

<a name="new_ERMrest.Mapping_new"></a>
#### new Mapping(from, to)

| Param | Type | Description |
| --- | --- | --- |
| from | <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> | array of from Columns |
| to | <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> | array of to Columns |

<a name="ERMrest.Mapping+length"></a>
#### mapping.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Mapping](#ERMrest.Mapping)</code>  
**Returns**: <code>Number</code> - number of mapping columns  
<a name="ERMrest.Mapping+domain"></a>
#### mapping.domain() ⇒ <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code>
**Kind**: instance method of <code>[Mapping](#ERMrest.Mapping)</code>  
**Returns**: <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> - the from columns  
<a name="ERMrest.Mapping+get"></a>
#### mapping.get(fromCol) ⇒ <code>[Column](#ERMrest.Column)</code>
get the mapping column given the from column

**Kind**: instance method of <code>[Mapping](#ERMrest.Mapping)</code>  
**Returns**: <code>[Column](#ERMrest.Column)</code> - mapping column  
**Throws**:

- <code>[NotFoundError](#ERMrest.Errors.NotFoundError)</code> no mapping column found


| Param | Type |
| --- | --- |
| fromCol | <code>[Column](#ERMrest.Column)</code> | 

<a name="ERMrest.ForeignKeys"></a>
### ERMrest.ForeignKeys
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.ForeignKeys](#ERMrest.ForeignKeys)
    * [.all()](#ERMrest.ForeignKeys+all) ⇒ <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>
    * [.colsets()](#ERMrest.ForeignKeys+colsets) ⇒ <code>[Array.&lt;ColSet&gt;](#ERMrest.ColSet)</code>
    * [.length()](#ERMrest.ForeignKeys+length) ⇒ <code>Number</code>
    * [.mappings()](#ERMrest.ForeignKeys+mappings) ⇒ <code>[Array.&lt;Mapping&gt;](#ERMrest.Mapping)</code>
    * [.get(colset)](#ERMrest.ForeignKeys+get) ⇒ <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>

<a name="ERMrest.ForeignKeys+all"></a>
#### foreignKeys.all() ⇒ <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>
**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code> - an array of all foreign key references  
<a name="ERMrest.ForeignKeys+colsets"></a>
#### foreignKeys.colsets() ⇒ <code>[Array.&lt;ColSet&gt;](#ERMrest.ColSet)</code>
**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>[Array.&lt;ColSet&gt;](#ERMrest.ColSet)</code> - an array of the foreign keys' colsets  
<a name="ERMrest.ForeignKeys+length"></a>
#### foreignKeys.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>Number</code> - number of foreign keys  
<a name="ERMrest.ForeignKeys+mappings"></a>
#### foreignKeys.mappings() ⇒ <code>[Array.&lt;Mapping&gt;](#ERMrest.Mapping)</code>
**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>[Array.&lt;Mapping&gt;](#ERMrest.Mapping)</code> - mappings  
<a name="ERMrest.ForeignKeys+get"></a>
#### foreignKeys.get(colset) ⇒ <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>
get the foreign key of the given column set

**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code> - foreign key reference of the colset  
**Throws**:

- <code>[NotFoundError](#ERMrest.Errors.NotFoundError)</code> foreign key not found


| Param | Type |
| --- | --- |
| colset | <code>[ColSet](#ERMrest.ColSet)</code> | 

<a name="ERMrest.ForeignKeyRef"></a>
### ERMrest.ForeignKeyRef
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.ForeignKeyRef](#ERMrest.ForeignKeyRef)
    * [new ForeignKeyRef(table, jsonFKR)](#new_ERMrest.ForeignKeyRef_new)
    * [.colset](#ERMrest.ForeignKeyRef+colset) : <code>[ColSet](#ERMrest.ColSet)</code>
    * [.key](#ERMrest.ForeignKeyRef+key) : <code>[Key](#ERMrest.Key)</code>
    * [.mapping](#ERMrest.ForeignKeyRef+mapping) : <code>[Mapping](#ERMrest.Mapping)</code>
    * [.ignore](#ERMrest.ForeignKeyRef+ignore) : <code>boolean</code>
    * [.annotations](#ERMrest.ForeignKeyRef+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
    * [.simple](#ERMrest.ForeignKeyRef+simple) : <code>Boolean</code>
    * [.getDomainValues(limit)](#ERMrest.ForeignKeyRef+getDomainValues) ⇒ <code>Promise</code>

<a name="new_ERMrest.ForeignKeyRef_new"></a>
#### new ForeignKeyRef(table, jsonFKR)

| Param | Type |
| --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | 
| jsonFKR | <code>Object</code> | 

<a name="ERMrest.ForeignKeyRef+colset"></a>
#### foreignKeyRef.colset : <code>[ColSet](#ERMrest.ColSet)</code>
**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+key"></a>
#### foreignKeyRef.key : <code>[Key](#ERMrest.Key)</code>
find key from referencedCols
use index 0 since all refCols should be of the same schema:table

**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+mapping"></a>
#### foreignKeyRef.mapping : <code>[Mapping](#ERMrest.Mapping)</code>
**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+ignore"></a>
#### foreignKeyRef.ignore : <code>boolean</code>
**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+annotations"></a>
#### foreignKeyRef.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+simple"></a>
#### foreignKeyRef.simple : <code>Boolean</code>
Indicates if the foreign key is simple (not composite)

**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+getDomainValues"></a>
#### foreignKeyRef.getDomainValues(limit) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
**Returns**: <code>Promise</code> - promise that returns a rowset of the referenced key's table if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    [ConflictError](#ERMrest.Errors.ConflictError), [ForbiddenError](#ERMrest.Errors.ForbiddenError) or [UnauthorizedError](#ERMrest.Errors.UnauthorizedError) if rejected  

| Param | Type |
| --- | --- |
| limit | <code>Number</code> | 

<a name="ERMrest.Type"></a>
### ERMrest.Type
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Type](#ERMrest.Type)
    * [new Type(name)](#new_ERMrest.Type_new)
    * [.name](#ERMrest.Type+name)

<a name="new_ERMrest.Type_new"></a>
#### new Type(name)

| Param |
| --- |
| name | 

<a name="ERMrest.Type+name"></a>
#### type.name
**Kind**: instance property of <code>[Type](#ERMrest.Type)</code>  
<a name="ERMrest.Datapath"></a>
### ERMrest.Datapath : <code>object</code>
**Kind**: static namespace of <code>[ERMrest](#ERMrest)</code>  

* [.Datapath](#ERMrest.Datapath) : <code>object</code>
    * [.DataPath](#ERMrest.Datapath.DataPath)
        * [new DataPath(table)](#new_ERMrest.Datapath.DataPath_new)
        * [.catalog](#ERMrest.Datapath.DataPath+catalog) : <code>[Catalog](#ERMrest.Catalog)</code>
        * [.context](#ERMrest.Datapath.DataPath+context) : <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
        * [.entity](#ERMrest.Datapath.DataPath+entity)
            * [.get()](#ERMrest.Datapath.DataPath+entity.get) ⇒ <code>Promise</code>
            * [.delete(filter)](#ERMrest.Datapath.DataPath+entity.delete) ⇒ <code>Promise</code>
        * [.filter(filter)](#ERMrest.Datapath.DataPath+filter) ⇒ <code>[DataPath](#ERMrest.Datapath.DataPath)</code>
        * [.extend(table, context, link)](#ERMrest.Datapath.DataPath+extend) ⇒ <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
    * [.PathTable](#ERMrest.Datapath.PathTable)
        * [new PathTable(table, datapath, alias)](#new_ERMrest.Datapath.PathTable_new)
        * [.datapath](#ERMrest.Datapath.PathTable+datapath) : <code>[DataPath](#ERMrest.Datapath.DataPath)</code>
        * [.table](#ERMrest.Datapath.PathTable+table) : <code>[Table](#ERMrest.Table)</code>
        * [.alias](#ERMrest.Datapath.PathTable+alias) : <code>string</code>
        * [.columns](#ERMrest.Datapath.PathTable+columns) : <code>[Columns](#ERMrest.Datapath.Columns)</code>
        * [.toString()](#ERMrest.Datapath.PathTable+toString) ⇒ <code>string</code>
    * [.PathColumn](#ERMrest.Datapath.PathColumn)
        * [new PathColumn(column, pathtable)](#new_ERMrest.Datapath.PathColumn_new)
        * [.pathtable](#ERMrest.Datapath.PathColumn+pathtable) : <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
        * [.column](#ERMrest.Datapath.PathColumn+column) : <code>[Column](#ERMrest.Column)</code>
    * [.Columns(table, pathtable)](#ERMrest.Datapath.Columns)
        * [.length()](#ERMrest.Datapath.Columns+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Datapath.Columns+names) ⇒ <code>Array.&lt;String&gt;</code>
        * [.get(colName)](#ERMrest.Datapath.Columns+get) ⇒ <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code>
    * [.Operators()](#ERMrest.Datapath.Operators)

<a name="ERMrest.Datapath.DataPath"></a>
#### Datapath.DataPath
**Kind**: static class of <code>[Datapath](#ERMrest.Datapath)</code>  

* [.DataPath](#ERMrest.Datapath.DataPath)
    * [new DataPath(table)](#new_ERMrest.Datapath.DataPath_new)
    * [.catalog](#ERMrest.Datapath.DataPath+catalog) : <code>[Catalog](#ERMrest.Catalog)</code>
    * [.context](#ERMrest.Datapath.DataPath+context) : <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
    * [.entity](#ERMrest.Datapath.DataPath+entity)
        * [.get()](#ERMrest.Datapath.DataPath+entity.get) ⇒ <code>Promise</code>
        * [.delete(filter)](#ERMrest.Datapath.DataPath+entity.delete) ⇒ <code>Promise</code>
    * [.filter(filter)](#ERMrest.Datapath.DataPath+filter) ⇒ <code>[DataPath](#ERMrest.Datapath.DataPath)</code>
    * [.extend(table, context, link)](#ERMrest.Datapath.DataPath+extend) ⇒ <code>[PathTable](#ERMrest.Datapath.PathTable)</code>

<a name="new_ERMrest.Datapath.DataPath_new"></a>
##### new DataPath(table)

| Param | Type |
| --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | 

<a name="ERMrest.Datapath.DataPath+catalog"></a>
##### dataPath.catalog : <code>[Catalog](#ERMrest.Catalog)</code>
**Kind**: instance property of <code>[DataPath](#ERMrest.Datapath.DataPath)</code>  
<a name="ERMrest.Datapath.DataPath+context"></a>
##### dataPath.context : <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
**Kind**: instance property of <code>[DataPath](#ERMrest.Datapath.DataPath)</code>  
<a name="ERMrest.Datapath.DataPath+entity"></a>
##### dataPath.entity
entity container

**Kind**: instance property of <code>[DataPath](#ERMrest.Datapath.DataPath)</code>  

* [.entity](#ERMrest.Datapath.DataPath+entity)
    * [.get()](#ERMrest.Datapath.DataPath+entity.get) ⇒ <code>Promise</code>
    * [.delete(filter)](#ERMrest.Datapath.DataPath+entity.delete) ⇒ <code>Promise</code>

<a name="ERMrest.Datapath.DataPath+entity.get"></a>
###### entity.get() ⇒ <code>Promise</code>
**Kind**: static method of <code>[entity](#ERMrest.Datapath.DataPath+entity)</code>  
**Returns**: <code>Promise</code> - promise that returns a row data if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    [ConflictError](#ERMrest.Errors.ConflictError), [ForbiddenError](#ERMrest.Errors.ForbiddenError) or [UnauthorizedError](#ERMrest.Errors.UnauthorizedError) if rejected  
<a name="ERMrest.Datapath.DataPath+entity.delete"></a>
###### entity.delete(filter) ⇒ <code>Promise</code>
delete entities

**Kind**: static method of <code>[entity](#ERMrest.Datapath.DataPath+entity)</code>  
**Returns**: <code>Promise</code> - promise that returns deleted entities if resolved or
    [TimedOutError](#ERMrest.Errors.TimedOutError), [InternalServerError](#ERMrest.Errors.InternalServerError), [ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError),
    [ConflictError](#ERMrest.Errors.ConflictError), [ForbiddenError](#ERMrest.Errors.ForbiddenError) or [UnauthorizedError](#ERMrest.Errors.UnauthorizedError) if rejected  

| Param | Type |
| --- | --- |
| filter | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> | 

<a name="ERMrest.Datapath.DataPath+filter"></a>
##### dataPath.filter(filter) ⇒ <code>[DataPath](#ERMrest.Datapath.DataPath)</code>
this datapath is not modified

**Kind**: instance method of <code>[DataPath](#ERMrest.Datapath.DataPath)</code>  
**Returns**: <code>[DataPath](#ERMrest.Datapath.DataPath)</code> - a shallow copy of this datapath with filter  

| Param | Type |
| --- | --- |
| filter | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> | 

<a name="ERMrest.Datapath.DataPath+extend"></a>
##### dataPath.extend(table, context, link) ⇒ <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
extend the Datapath with table

**Kind**: instance method of <code>[DataPath](#ERMrest.Datapath.DataPath)</code>  

| Param | Type |
| --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | 
| context |  | 
| link |  | 

<a name="ERMrest.Datapath.PathTable"></a>
#### Datapath.PathTable
**Kind**: static class of <code>[Datapath](#ERMrest.Datapath)</code>  

* [.PathTable](#ERMrest.Datapath.PathTable)
    * [new PathTable(table, datapath, alias)](#new_ERMrest.Datapath.PathTable_new)
    * [.datapath](#ERMrest.Datapath.PathTable+datapath) : <code>[DataPath](#ERMrest.Datapath.DataPath)</code>
    * [.table](#ERMrest.Datapath.PathTable+table) : <code>[Table](#ERMrest.Table)</code>
    * [.alias](#ERMrest.Datapath.PathTable+alias) : <code>string</code>
    * [.columns](#ERMrest.Datapath.PathTable+columns) : <code>[Columns](#ERMrest.Datapath.Columns)</code>
    * [.toString()](#ERMrest.Datapath.PathTable+toString) ⇒ <code>string</code>

<a name="new_ERMrest.Datapath.PathTable_new"></a>
##### new PathTable(table, datapath, alias)

| Param | Type |
| --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | 
| datapath | <code>[DataPath](#ERMrest.Datapath.DataPath)</code> | 
| alias | <code>string</code> | 

<a name="ERMrest.Datapath.PathTable+datapath"></a>
##### pathTable.datapath : <code>[DataPath](#ERMrest.Datapath.DataPath)</code>
**Kind**: instance property of <code>[PathTable](#ERMrest.Datapath.PathTable)</code>  
<a name="ERMrest.Datapath.PathTable+table"></a>
##### pathTable.table : <code>[Table](#ERMrest.Table)</code>
**Kind**: instance property of <code>[PathTable](#ERMrest.Datapath.PathTable)</code>  
<a name="ERMrest.Datapath.PathTable+alias"></a>
##### pathTable.alias : <code>string</code>
**Kind**: instance property of <code>[PathTable](#ERMrest.Datapath.PathTable)</code>  
<a name="ERMrest.Datapath.PathTable+columns"></a>
##### pathTable.columns : <code>[Columns](#ERMrest.Datapath.Columns)</code>
**Kind**: instance property of <code>[PathTable](#ERMrest.Datapath.PathTable)</code>  
<a name="ERMrest.Datapath.PathTable+toString"></a>
##### pathTable.toString() ⇒ <code>string</code>
**Kind**: instance method of <code>[PathTable](#ERMrest.Datapath.PathTable)</code>  
**Returns**: <code>string</code> - uri of the PathTable  
<a name="ERMrest.Datapath.PathColumn"></a>
#### Datapath.PathColumn
**Kind**: static class of <code>[Datapath](#ERMrest.Datapath)</code>  

* [.PathColumn](#ERMrest.Datapath.PathColumn)
    * [new PathColumn(column, pathtable)](#new_ERMrest.Datapath.PathColumn_new)
    * [.pathtable](#ERMrest.Datapath.PathColumn+pathtable) : <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
    * [.column](#ERMrest.Datapath.PathColumn+column) : <code>[Column](#ERMrest.Column)</code>

<a name="new_ERMrest.Datapath.PathColumn_new"></a>
##### new PathColumn(column, pathtable)

| Param | Type |
| --- | --- |
| column | <code>[Column](#ERMrest.Column)</code> | 
| pathtable | <code>[PathTable](#ERMrest.Datapath.PathTable)</code> | 

<a name="ERMrest.Datapath.PathColumn+pathtable"></a>
##### pathColumn.pathtable : <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
**Kind**: instance property of <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code>  
<a name="ERMrest.Datapath.PathColumn+column"></a>
##### pathColumn.column : <code>[Column](#ERMrest.Column)</code>
**Kind**: instance property of <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code>  
<a name="ERMrest.Datapath.Columns"></a>
#### Datapath.Columns(table, pathtable)
**Kind**: static method of <code>[Datapath](#ERMrest.Datapath)</code>  

| Param | Type |
| --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | 
| pathtable | <code>[PathTable](#ERMrest.Datapath.PathTable)</code> | 


* [.Columns(table, pathtable)](#ERMrest.Datapath.Columns)
    * [.length()](#ERMrest.Datapath.Columns+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Datapath.Columns+names) ⇒ <code>Array.&lt;String&gt;</code>
    * [.get(colName)](#ERMrest.Datapath.Columns+get) ⇒ <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code>

<a name="ERMrest.Datapath.Columns+length"></a>
##### columns.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Datapath.Columns)</code>  
**Returns**: <code>Number</code> - number of path columns  
<a name="ERMrest.Datapath.Columns+names"></a>
##### columns.names() ⇒ <code>Array.&lt;String&gt;</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Datapath.Columns)</code>  
**Returns**: <code>Array.&lt;String&gt;</code> - a list of pathcolumn names  
<a name="ERMrest.Datapath.Columns+get"></a>
##### columns.get(colName) ⇒ <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code>
get PathColumn object by column name

**Kind**: instance method of <code>[Columns](#ERMrest.Datapath.Columns)</code>  
**Returns**: <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code> - returns the PathColumn  
**Throws**:

- <code>[NotFoundError](#ERMrest.Errors.NotFoundError)</code> column not found


| Param | Type | Description |
| --- | --- | --- |
| colName | <code>string</code> | column name |

<a name="ERMrest.Datapath.Operators"></a>
#### Datapath.Operators()
**Kind**: static method of <code>[Datapath](#ERMrest.Datapath)</code>  
<a name="ERMrest.Filters"></a>
### ERMrest.Filters : <code>object</code>
**Kind**: static namespace of <code>[ERMrest](#ERMrest)</code>  

* [.Filters](#ERMrest.Filters) : <code>object</code>
    * [.Negation](#ERMrest.Filters.Negation)
        * [new Negation(filter)](#new_ERMrest.Filters.Negation_new)
        * [.toUri()](#ERMrest.Filters.Negation+toUri) ⇒ <code>string</code>
    * [.Conjunction](#ERMrest.Filters.Conjunction)
        * [new Conjunction(filters)](#new_ERMrest.Filters.Conjunction_new)
        * [.toUri()](#ERMrest.Filters.Conjunction+toUri) ⇒ <code>string</code>
    * [.Disjunction](#ERMrest.Filters.Disjunction)
        * [new Disjunction(filters)](#new_ERMrest.Filters.Disjunction_new)
        * [.toUri()](#ERMrest.Filters.Disjunction+toUri) ⇒ <code>string</code>
    * [.UnaryPredicate](#ERMrest.Filters.UnaryPredicate)
        * [new UnaryPredicate(column, operator)](#new_ERMrest.Filters.UnaryPredicate_new)
        * [.toUri()](#ERMrest.Filters.UnaryPredicate+toUri) ⇒ <code>string</code>
    * [.BinaryPredicate](#ERMrest.Filters.BinaryPredicate)
        * [new BinaryPredicate(column, operator, rvalue)](#new_ERMrest.Filters.BinaryPredicate_new)
        * [.toUri()](#ERMrest.Filters.BinaryPredicate+toUri) ⇒ <code>string</code>

<a name="ERMrest.Filters.Negation"></a>
#### Filters.Negation
**Kind**: static class of <code>[Filters](#ERMrest.Filters)</code>  

* [.Negation](#ERMrest.Filters.Negation)
    * [new Negation(filter)](#new_ERMrest.Filters.Negation_new)
    * [.toUri()](#ERMrest.Filters.Negation+toUri) ⇒ <code>string</code>

<a name="new_ERMrest.Filters.Negation_new"></a>
##### new Negation(filter)

| Param |
| --- |
| filter | 

<a name="ERMrest.Filters.Negation+toUri"></a>
##### negation.toUri() ⇒ <code>string</code>
**Kind**: instance method of <code>[Negation](#ERMrest.Filters.Negation)</code>  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.Filters.Conjunction"></a>
#### Filters.Conjunction
**Kind**: static class of <code>[Filters](#ERMrest.Filters)</code>  

* [.Conjunction](#ERMrest.Filters.Conjunction)
    * [new Conjunction(filters)](#new_ERMrest.Filters.Conjunction_new)
    * [.toUri()](#ERMrest.Filters.Conjunction+toUri) ⇒ <code>string</code>

<a name="new_ERMrest.Filters.Conjunction_new"></a>
##### new Conjunction(filters)

| Param |
| --- |
| filters | 

<a name="ERMrest.Filters.Conjunction+toUri"></a>
##### conjunction.toUri() ⇒ <code>string</code>
**Kind**: instance method of <code>[Conjunction](#ERMrest.Filters.Conjunction)</code>  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.Filters.Disjunction"></a>
#### Filters.Disjunction
**Kind**: static class of <code>[Filters](#ERMrest.Filters)</code>  

* [.Disjunction](#ERMrest.Filters.Disjunction)
    * [new Disjunction(filters)](#new_ERMrest.Filters.Disjunction_new)
    * [.toUri()](#ERMrest.Filters.Disjunction+toUri) ⇒ <code>string</code>

<a name="new_ERMrest.Filters.Disjunction_new"></a>
##### new Disjunction(filters)

| Param |
| --- |
| filters | 

<a name="ERMrest.Filters.Disjunction+toUri"></a>
##### disjunction.toUri() ⇒ <code>string</code>
**Kind**: instance method of <code>[Disjunction](#ERMrest.Filters.Disjunction)</code>  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.Filters.UnaryPredicate"></a>
#### Filters.UnaryPredicate
**Kind**: static class of <code>[Filters](#ERMrest.Filters)</code>  

* [.UnaryPredicate](#ERMrest.Filters.UnaryPredicate)
    * [new UnaryPredicate(column, operator)](#new_ERMrest.Filters.UnaryPredicate_new)
    * [.toUri()](#ERMrest.Filters.UnaryPredicate+toUri) ⇒ <code>string</code>

<a name="new_ERMrest.Filters.UnaryPredicate_new"></a>
##### new UnaryPredicate(column, operator)
**Throws**:

- <code>[InvalidFilterOperatorError](#ERMrest.Errors.InvalidFilterOperatorError)</code> invalid filter operator


| Param | Type |
| --- | --- |
| column | <code>[Column](#ERMrest.Column)</code> | 
| operator | <code>ERMrest.Filters.OPERATOR</code> | 

<a name="ERMrest.Filters.UnaryPredicate+toUri"></a>
##### unaryPredicate.toUri() ⇒ <code>string</code>
**Kind**: instance method of <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code>  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.Filters.BinaryPredicate"></a>
#### Filters.BinaryPredicate
**Kind**: static class of <code>[Filters](#ERMrest.Filters)</code>  

* [.BinaryPredicate](#ERMrest.Filters.BinaryPredicate)
    * [new BinaryPredicate(column, operator, rvalue)](#new_ERMrest.Filters.BinaryPredicate_new)
    * [.toUri()](#ERMrest.Filters.BinaryPredicate+toUri) ⇒ <code>string</code>

<a name="new_ERMrest.Filters.BinaryPredicate_new"></a>
##### new BinaryPredicate(column, operator, rvalue)
**Throws**:

- <code>[InvalidFilterOperatorError](#ERMrest.Errors.InvalidFilterOperatorError)</code> invalid filter operator


| Param | Type |
| --- | --- |
| column | <code>[Column](#ERMrest.Column)</code> | 
| operator | <code>ERMrest.Filters.OPERATOR</code> | 
| rvalue | <code>String</code> &#124; <code>Number</code> | 

<a name="ERMrest.Filters.BinaryPredicate+toUri"></a>
##### binaryPredicate.toUri() ⇒ <code>string</code>
**Kind**: instance method of <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code>  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.Errors"></a>
### ERMrest.Errors : <code>object</code>
**Kind**: static namespace of <code>[ERMrest](#ERMrest)</code>  

* [.Errors](#ERMrest.Errors) : <code>object</code>
    * [.TimedOutError](#ERMrest.Errors.TimedOutError)
        * [new TimedOutError(status, message)](#new_ERMrest.Errors.TimedOutError_new)
    * [.BadRequestError](#ERMrest.Errors.BadRequestError)
        * [new BadRequestError(status, message)](#new_ERMrest.Errors.BadRequestError_new)
    * [.UnauthorizedError](#ERMrest.Errors.UnauthorizedError)
        * [new UnauthorizedError(status, message)](#new_ERMrest.Errors.UnauthorizedError_new)
    * [.ForbiddenError](#ERMrest.Errors.ForbiddenError)
        * [new ForbiddenError(status, message)](#new_ERMrest.Errors.ForbiddenError_new)
    * [.NotFoundError](#ERMrest.Errors.NotFoundError)
        * [new NotFoundError(status, message)](#new_ERMrest.Errors.NotFoundError_new)
    * [.ConflictError](#ERMrest.Errors.ConflictError)
        * [new ConflictError(status, message)](#new_ERMrest.Errors.ConflictError_new)
    * [.InternalServerError](#ERMrest.Errors.InternalServerError)
        * [new InternalServerError(status, message)](#new_ERMrest.Errors.InternalServerError_new)
    * [.ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError)
        * [new ServiceUnavailableError(status, message)](#new_ERMrest.Errors.ServiceUnavailableError_new)
    * [.InvalidFilterOperatorError](#ERMrest.Errors.InvalidFilterOperatorError)
        * [new InvalidFilterOperatorError(message)](#new_ERMrest.Errors.InvalidFilterOperatorError_new)
    * [.InvalidInputError](#ERMrest.Errors.InvalidInputError)
        * [new InvalidInputError(message)](#new_ERMrest.Errors.InvalidInputError_new)

<a name="ERMrest.Errors.TimedOutError"></a>
#### Errors.TimedOutError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.TimedOutError_new"></a>
##### new TimedOutError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.BadRequestError"></a>
#### Errors.BadRequestError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.BadRequestError_new"></a>
##### new BadRequestError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.UnauthorizedError"></a>
#### Errors.UnauthorizedError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.UnauthorizedError_new"></a>
##### new UnauthorizedError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.ForbiddenError"></a>
#### Errors.ForbiddenError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.ForbiddenError_new"></a>
##### new ForbiddenError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.NotFoundError"></a>
#### Errors.NotFoundError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.NotFoundError_new"></a>
##### new NotFoundError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.ConflictError"></a>
#### Errors.ConflictError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.ConflictError_new"></a>
##### new ConflictError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.InternalServerError"></a>
#### Errors.InternalServerError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.InternalServerError_new"></a>
##### new InternalServerError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.ServiceUnavailableError"></a>
#### Errors.ServiceUnavailableError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.ServiceUnavailableError_new"></a>
##### new ServiceUnavailableError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.InvalidFilterOperatorError"></a>
#### Errors.InvalidFilterOperatorError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.InvalidFilterOperatorError_new"></a>
##### new InvalidFilterOperatorError(message)
An invalid filter operator


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.InvalidInputError"></a>
#### Errors.InvalidInputError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.InvalidInputError_new"></a>
##### new InvalidInputError(message)
An invalid input


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors"></a>
### ERMrest.Errors : <code>object</code>
**Kind**: static namespace of <code>[ERMrest](#ERMrest)</code>  

* [.Errors](#ERMrest.Errors) : <code>object</code>
    * [.TimedOutError](#ERMrest.Errors.TimedOutError)
        * [new TimedOutError(status, message)](#new_ERMrest.Errors.TimedOutError_new)
    * [.BadRequestError](#ERMrest.Errors.BadRequestError)
        * [new BadRequestError(status, message)](#new_ERMrest.Errors.BadRequestError_new)
    * [.UnauthorizedError](#ERMrest.Errors.UnauthorizedError)
        * [new UnauthorizedError(status, message)](#new_ERMrest.Errors.UnauthorizedError_new)
    * [.ForbiddenError](#ERMrest.Errors.ForbiddenError)
        * [new ForbiddenError(status, message)](#new_ERMrest.Errors.ForbiddenError_new)
    * [.NotFoundError](#ERMrest.Errors.NotFoundError)
        * [new NotFoundError(status, message)](#new_ERMrest.Errors.NotFoundError_new)
    * [.ConflictError](#ERMrest.Errors.ConflictError)
        * [new ConflictError(status, message)](#new_ERMrest.Errors.ConflictError_new)
    * [.InternalServerError](#ERMrest.Errors.InternalServerError)
        * [new InternalServerError(status, message)](#new_ERMrest.Errors.InternalServerError_new)
    * [.ServiceUnavailableError](#ERMrest.Errors.ServiceUnavailableError)
        * [new ServiceUnavailableError(status, message)](#new_ERMrest.Errors.ServiceUnavailableError_new)
    * [.InvalidFilterOperatorError](#ERMrest.Errors.InvalidFilterOperatorError)
        * [new InvalidFilterOperatorError(message)](#new_ERMrest.Errors.InvalidFilterOperatorError_new)
    * [.InvalidInputError](#ERMrest.Errors.InvalidInputError)
        * [new InvalidInputError(message)](#new_ERMrest.Errors.InvalidInputError_new)

<a name="ERMrest.Errors.TimedOutError"></a>
#### Errors.TimedOutError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.TimedOutError_new"></a>
##### new TimedOutError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.BadRequestError"></a>
#### Errors.BadRequestError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.BadRequestError_new"></a>
##### new BadRequestError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.UnauthorizedError"></a>
#### Errors.UnauthorizedError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.UnauthorizedError_new"></a>
##### new UnauthorizedError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.ForbiddenError"></a>
#### Errors.ForbiddenError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.ForbiddenError_new"></a>
##### new ForbiddenError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.NotFoundError"></a>
#### Errors.NotFoundError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.NotFoundError_new"></a>
##### new NotFoundError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.ConflictError"></a>
#### Errors.ConflictError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.ConflictError_new"></a>
##### new ConflictError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.InternalServerError"></a>
#### Errors.InternalServerError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.InternalServerError_new"></a>
##### new InternalServerError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.ServiceUnavailableError"></a>
#### Errors.ServiceUnavailableError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.ServiceUnavailableError_new"></a>
##### new ServiceUnavailableError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.InvalidFilterOperatorError"></a>
#### Errors.InvalidFilterOperatorError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.InvalidFilterOperatorError_new"></a>
##### new InvalidFilterOperatorError(message)
An invalid filter operator


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.Errors.InvalidInputError"></a>
#### Errors.InvalidInputError
**Kind**: static class of <code>[Errors](#ERMrest.Errors)</code>  
<a name="new_ERMrest.Errors.InvalidInputError_new"></a>
##### new InvalidInputError(message)
An invalid input


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.configure"></a>
### ERMrest.configure(http, q)
This function is used to configure the module

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  

| Param | Type | Description |
| --- | --- | --- |
| http | <code>Object</code> | Angular $http service object |
| q | <code>Object</code> | Angular $q service object |

<a name="ERMrest.getServer"></a>
### ERMrest.getServer(uri) ⇒ <code>[Server](#ERMrest.Server)</code>
ERMrest server factory creates or reuses ERMrest.Server instances. The
URI should be to the ERMrest _service_. For example,
`https://www.example.org/ermrest`.

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  
**Returns**: <code>[Server](#ERMrest.Server)</code> - Returns a server instance.  
**Throws**:

- <code>[InvalidInputError](#ERMrest.Errors.InvalidInputError)</code> URI is missing


| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | URI of the ERMrest service. |

