<a name="ERMrest"></a>

## ERMrest : <code>object</code>
The ERMrest module is a JavaScript client library for the ERMrest
service. Most clients should begin with [resolve](#ERMrest.resolve).

IMPORTANT NOTE: This module is a work in progress.
It is likely to change several times before we have an interface we wish
to use for ERMrest JavaScript agents.

**Kind**: global namespace  

* [ERMrest](#ERMrest) : <code>object</code>
    * [.Server](#ERMrest.Server)
        * [new Server(uri)](#new_ERMrest.Server_new)
        * [.uri](#ERMrest.Server+uri) : <code>string</code>
        * [.catalogs](#ERMrest.Server+catalogs) : <code>[Catalogs](#ERMrest.Catalogs)</code>
    * [.Catalogs](#ERMrest.Catalogs)
        * [new Catalogs(server)](#new_ERMrest.Catalogs_new)
        * [.length()](#ERMrest.Catalogs+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Catalogs+names) ⇒ <code>Array</code>
        * [.get(id)](#ERMrest.Catalogs+get) ⇒ <code>Promise</code>
    * [.Catalog](#ERMrest.Catalog)
        * [new Catalog(server, id)](#new_ERMrest.Catalog_new)
        * [.id](#ERMrest.Catalog+id) : <code>string</code>
        * [.schemas](#ERMrest.Catalog+schemas) : <code>[Schemas](#ERMrest.Schemas)</code>
        * [.constraintByNamePair(pair)](#ERMrest.Catalog+constraintByNamePair) ⇒ <code>Object</code>
    * [.Schemas](#ERMrest.Schemas)
        * [new Schemas()](#new_ERMrest.Schemas_new)
        * [.length()](#ERMrest.Schemas+length) ⇒ <code>Number</code>
        * [.all()](#ERMrest.Schemas+all) ⇒ <code>Array</code>
        * [.names()](#ERMrest.Schemas+names) ⇒ <code>Array</code>
        * [.get(name)](#ERMrest.Schemas+get) ⇒ <code>[Schema](#ERMrest.Schema)</code>
        * [.has(name)](#ERMrest.Schemas+has) ⇒ <code>boolean</code>
    * [.Schema](#ERMrest.Schema)
        * [new Schema(catalog, jsonSchema)](#new_ERMrest.Schema_new)
        * [.catalog](#ERMrest.Schema+catalog) : <code>[Catalog](#ERMrest.Catalog)</code>
        * [.name](#ERMrest.Schema+name)
        * [.ignore](#ERMrest.Schema+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.Schema+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
        * [.displayname](#ERMrest.Schema+displayname) : <code>string</code>
        * [.tables](#ERMrest.Schema+tables) : <code>[Tables](#ERMrest.Tables)</code>
        * [.comment](#ERMrest.Schema+comment) : <code>string</code>
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
            * [.ignore](#ERMrest.Table+ignore) : <code>boolean</code>
            * [.annotations](#ERMrest.Table+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
            * [.displayname](#ERMrest.Table+displayname) : <code>string</code>
            * [.columns](#ERMrest.Table+columns) : <code>[Columns](#ERMrest.Columns)</code>
            * [.keys](#ERMrest.Table+keys) : <code>[Keys](#ERMrest.Keys)</code>
            * [.foreignKeys](#ERMrest.Table+foreignKeys) : <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>
            * [.referredBy](#ERMrest.Table+referredBy) : <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>
            * [.comment](#ERMrest.Table+comment) : <code>string</code>
        * _static_
            * [.Entity](#ERMrest.Table.Entity)
                * [new Entity(server, table)](#new_ERMrest.Table.Entity_new)
                * [.count([filter])](#ERMrest.Table.Entity+count) ⇒ <code>Promise</code>
                * [.get([filter], [limit], [columns], [sortby])](#ERMrest.Table.Entity+get) ⇒ <code>Promise</code>
                * [.getBefore(filter, limit, [columns], [sortby], row)](#ERMrest.Table.Entity+getBefore) ⇒ <code>Promise</code>
                * [.getAfter(filter, limit, [columns], [sortby], row)](#ERMrest.Table.Entity+getAfter) ⇒ <code>Promise</code>
                * [.delete(filter)](#ERMrest.Table.Entity+delete) ⇒ <code>Promise</code>
                * [.put(rows)](#ERMrest.Table.Entity+put) ⇒ <code>Promise</code>
                * [.post(rows, defaults)](#ERMrest.Table.Entity+post) ⇒ <code>Promise</code>
    * [.Rows](#ERMrest.Rows)
        * [new Rows(table, jsonRows, filter, limit, columns, [sortby])](#new_ERMrest.Rows_new)
        * [.data](#ERMrest.Rows+data) : <code>Array</code>
        * [.length()](#ERMrest.Rows+length) ⇒ <code>number</code>
        * [.get()](#ERMrest.Rows+get) ⇒ <code>Row</code>
        * [.after()](#ERMrest.Rows+after) ⇒ <code>Promise</code>
        * [.before()](#ERMrest.Rows+before) ⇒ <code>Promise</code>
    * [.Row](#ERMrest.Row)
        * [new Row(jsonRow)](#new_ERMrest.Row_new)
        * [.data](#ERMrest.Row+data) : <code>Object</code>
        * [.names()](#ERMrest.Row+names) ⇒ <code>Array</code>
        * [.get(name)](#ERMrest.Row+get) ⇒ <code>Object</code>
    * [.Columns](#ERMrest.Columns)
        * [new Columns(table)](#new_ERMrest.Columns_new)
        * [.all()](#ERMrest.Columns+all) ⇒ <code>Array</code>
        * [.length()](#ERMrest.Columns+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Columns+names) ⇒ <code>Array</code>
        * [.has(name)](#ERMrest.Columns+has) ⇒ <code>boolean</code>
        * [.get(name)](#ERMrest.Columns+get) ⇒ <code>[Column](#ERMrest.Column)</code>
        * [.getByPosition(pos)](#ERMrest.Columns+getByPosition) ⇒ <code>[Column](#ERMrest.Column)</code>
    * [.Column](#ERMrest.Column)
        * [new Column(table, jsonColumn)](#new_ERMrest.Column_new)
        * [.position](#ERMrest.Column+position) : <code>number</code>
        * [.table](#ERMrest.Column+table) : <code>[Table](#ERMrest.Table)</code>
        * [.name](#ERMrest.Column+name) : <code>string</code>
        * [.type](#ERMrest.Column+type) : <code>[Type](#ERMrest.Type)</code>
        * [.nullok](#ERMrest.Column+nullok) : <code>Boolean</code>
        * [.default](#ERMrest.Column+default) : <code>string</code>
        * [.comment](#ERMrest.Column+comment) : <code>string</code>
        * [.ignore](#ERMrest.Column+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.Column+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
        * [.displayname](#ERMrest.Column+displayname) : <code>string</code>
        * [.memberOfKeys](#ERMrest.Column+memberOfKeys) : <code>[Array.&lt;Key&gt;](#ERMrest.Key)</code>
        * [.memberOfForeignKeys](#ERMrest.Column+memberOfForeignKeys) : <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>
        * [.formatvalue(data)](#ERMrest.Column+formatvalue) ⇒ <code>string</code>
        * [.formatPresentation(data, options)](#ERMrest.Column+formatPresentation) ⇒ <code>Object</code>
        * [.toString()](#ERMrest.Column+toString)
    * [.Annotations](#ERMrest.Annotations)
        * [new Annotations()](#new_ERMrest.Annotations_new)
        * [.all()](#ERMrest.Annotations+all) ⇒ <code>[Array.&lt;Annotation&gt;](#ERMrest.Annotation)</code>
        * [.length()](#ERMrest.Annotations+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Annotations+names) ⇒ <code>Array</code>
        * [.get(uri)](#ERMrest.Annotations+get) ⇒ <code>[Annotation](#ERMrest.Annotation)</code>
        * [.contains(uri)](#ERMrest.Annotations+contains) ⇒ <code>boolean</code>
    * [.Annotation](#ERMrest.Annotation)
        * [new Annotation(subject, uri, jsonAnnotation)](#new_ERMrest.Annotation_new)
        * [.subject](#ERMrest.Annotation+subject) : <code>string</code>
        * [.content](#ERMrest.Annotation+content) : <code>string</code>
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
        * [.comment](#ERMrest.Key+comment) : <code>string</code>
        * [.simple](#ERMrest.Key+simple) : <code>boolean</code>
    * [.ColSet](#ERMrest.ColSet)
        * [new ColSet(columns)](#new_ERMrest.ColSet_new)
        * [.columns](#ERMrest.ColSet+columns) : <code>Array</code>
        * [.toString()](#ERMrest.ColSet+toString)
        * [.length()](#ERMrest.ColSet+length) ⇒ <code>Number</code>
    * [.Mapping](#ERMrest.Mapping)
        * [new Mapping(from, to)](#new_ERMrest.Mapping_new)
        * [.toString()](#ERMrest.Mapping+toString)
        * [.length()](#ERMrest.Mapping+length) ⇒ <code>Number</code>
        * [.domain()](#ERMrest.Mapping+domain) ⇒ <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code>
        * [.get(fromCol)](#ERMrest.Mapping+get) ⇒ <code>[Column](#ERMrest.Column)</code>
    * [.ForeignKeys](#ERMrest.ForeignKeys)
        * [.all()](#ERMrest.ForeignKeys+all) ⇒ <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>
        * [.colsets()](#ERMrest.ForeignKeys+colsets) ⇒ <code>[Array.&lt;ColSet&gt;](#ERMrest.ColSet)</code>
        * [.length()](#ERMrest.ForeignKeys+length) ⇒ <code>Number</code>
        * [.mappings()](#ERMrest.ForeignKeys+mappings) ⇒ <code>[Array.&lt;Mapping&gt;](#ERMrest.Mapping)</code>
        * [.get(colset)](#ERMrest.ForeignKeys+get) ⇒ <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>
    * [.ForeignKeyRef](#ERMrest.ForeignKeyRef)
        * [new ForeignKeyRef(table, jsonFKR)](#new_ERMrest.ForeignKeyRef_new)
        * [.colset](#ERMrest.ForeignKeyRef+colset) : <code>[ColSet](#ERMrest.ColSet)</code>
        * [.key](#ERMrest.ForeignKeyRef+key) : <code>[Key](#ERMrest.Key)</code>
        * [.mapping](#ERMrest.ForeignKeyRef+mapping) : <code>[Mapping](#ERMrest.Mapping)</code>
        * [.constraint_names](#ERMrest.ForeignKeyRef+constraint_names) : <code>Array</code>
        * [.from_name](#ERMrest.ForeignKeyRef+from_name) : <code>string</code>
        * [.to_name](#ERMrest.ForeignKeyRef+to_name) : <code>string</code>
        * [.ignore](#ERMrest.ForeignKeyRef+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.ForeignKeyRef+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
        * [.comment](#ERMrest.ForeignKeyRef+comment) : <code>string</code>
        * [.simple](#ERMrest.ForeignKeyRef+simple) : <code>Boolean</code>
        * [.toString([reverse])](#ERMrest.ForeignKeyRef+toString)
        * [.getDomainValues(limit)](#ERMrest.ForeignKeyRef+getDomainValues) ⇒ <code>Promise</code>
    * [.Type](#ERMrest.Type)
        * [new Type(name)](#new_ERMrest.Type_new)
        * [.name](#ERMrest.Type+name)
    * [.TimedOutError](#ERMrest.TimedOutError)
        * [new TimedOutError(status, message)](#new_ERMrest.TimedOutError_new)
    * [.BadRequestError](#ERMrest.BadRequestError)
        * [new BadRequestError(status, message)](#new_ERMrest.BadRequestError_new)
    * [.UnauthorizedError](#ERMrest.UnauthorizedError)
        * [new UnauthorizedError(status, message)](#new_ERMrest.UnauthorizedError_new)
    * [.ForbiddenError](#ERMrest.ForbiddenError)
        * [new ForbiddenError(status, message)](#new_ERMrest.ForbiddenError_new)
    * [.NotFoundError](#ERMrest.NotFoundError)
        * [new NotFoundError(status, message)](#new_ERMrest.NotFoundError_new)
    * [.ConflictError](#ERMrest.ConflictError)
        * [new ConflictError(status, message)](#new_ERMrest.ConflictError_new)
    * [.InternalServerError](#ERMrest.InternalServerError)
        * [new InternalServerError(status, message)](#new_ERMrest.InternalServerError_new)
    * [.ServiceUnavailableError](#ERMrest.ServiceUnavailableError)
        * [new ServiceUnavailableError(status, message)](#new_ERMrest.ServiceUnavailableError_new)
    * [.InvalidFilterOperatorError](#ERMrest.InvalidFilterOperatorError)
        * [new InvalidFilterOperatorError(message)](#new_ERMrest.InvalidFilterOperatorError_new)
    * [.InvalidInputError](#ERMrest.InvalidInputError)
        * [new InvalidInputError(message)](#new_ERMrest.InvalidInputError_new)
    * [.MalformedURIError](#ERMrest.MalformedURIError)
        * [new MalformedURIError(message)](#new_ERMrest.MalformedURIError_new)
    * [.ParsedFilter](#ERMrest.ParsedFilter)
        * [new ParsedFilter(type)](#new_ERMrest.ParsedFilter_new)
        * [.setFilters(filters)](#ERMrest.ParsedFilter+setFilters)
        * [.setBinaryPredicate(colname, operator, value)](#ERMrest.ParsedFilter+setBinaryPredicate)
    * [.Reference](#ERMrest.Reference)
        * [new Reference(location)](#new_ERMrest.Reference_new)
        * [.displayname](#ERMrest.Reference+displayname) : <code>string</code>
        * [.uri](#ERMrest.Reference+uri) : <code>string</code>
        * [.session](#ERMrest.Reference+session)
        * [.columns](#ERMrest.Reference+columns) : <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code>
        * [.isUnique](#ERMrest.Reference+isUnique) : <code>boolean</code>
        * [.contextualize](#ERMrest.Reference+contextualize)
            * [.detailed](#ERMrest.Reference+contextualize.detailed) : <code>[Reference](#ERMrest.Reference)</code>
            * [.entry](#ERMrest.Reference+contextualize.entry) : <code>[Reference](#ERMrest.Reference)</code>
        * [.canCreate](#ERMrest.Reference+canCreate) : <code>boolean</code> &#124; <code>undefined</code>
        * [.canRead](#ERMrest.Reference+canRead) : <code>boolean</code> &#124; <code>undefined</code>
        * [.canUpdate](#ERMrest.Reference+canUpdate) : <code>boolean</code> &#124; <code>undefined</code>
        * [.canDelete](#ERMrest.Reference+canDelete) : <code>boolean</code> &#124; <code>undefined</code>
        * [.related](#ERMrest.Reference+related) : <code>[Array.&lt;Reference&gt;](#ERMrest.Reference)</code>
        * [.create(tbd)](#ERMrest.Reference+create) ⇒ <code>Promise</code>
        * [.read(limit)](#ERMrest.Reference+read) ⇒ <code>Promise</code>
        * [.sort(sort)](#ERMrest.Reference+sort)
        * [.update(tbd)](#ERMrest.Reference+update) ⇒ <code>Promise</code>
        * [.delete()](#ERMrest.Reference+delete) ⇒ <code>Promise</code>
    * [.Page](#ERMrest.Page)
        * [new Page(reference, data, hasNext, hasPrevious)](#new_ERMrest.Page_new)
        * [.tuples](#ERMrest.Page+tuples) : <code>[Array.&lt;Tuple&gt;](#ERMrest.Tuple)</code>
        * [.hasPrevious](#ERMrest.Page+hasPrevious) ⇒ <code>boolean</code>
        * [.previous](#ERMrest.Page+previous) : <code>[Reference](#ERMrest.Reference)</code> &#124; <code>undefined</code>
        * [.hasNext](#ERMrest.Page+hasNext) ⇒ <code>boolean</code>
        * [.next](#ERMrest.Page+next) : <code>[Reference](#ERMrest.Reference)</code> &#124; <code>undefined</code>
    * [.Tuple](#ERMrest.Tuple)
        * [new Tuple(reference, data)](#new_ERMrest.Tuple_new)
        * [.reference](#ERMrest.Tuple+reference) ⇒ <code>[Reference](#ERMrest.Reference)</code> &#124; <code>\*</code>
        * [.canUpdate](#ERMrest.Tuple+canUpdate) : <code>boolean</code> &#124; <code>undefined</code>
        * [.canDelete](#ERMrest.Tuple+canDelete) : <code>boolean</code> &#124; <code>undefined</code>
        * [.values](#ERMrest.Tuple+values) : <code>Array.&lt;string&gt;</code>
        * [.isHTML](#ERMrest.Tuple+isHTML) : <code>Array.&lt;string&gt;</code>
        * [.displayname](#ERMrest.Tuple+displayname) : <code>string</code>
        * [.update()](#ERMrest.Tuple+update) ⇒ <code>Promise</code>
        * [.delete()](#ERMrest.Tuple+delete) ⇒ <code>Promise</code>
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
    * [.configure(http, q)](#ERMrest.configure)
    * [.getServer(uri, [params])](#ERMrest.getServer) ⇒ <code>[Server](#ERMrest.Server)</code>
    * [.resolve(uri, [params])](#ERMrest.resolve) ⇒ <code>Promise</code>

<a name="ERMrest.Server"></a>

### ERMrest.Server
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Server](#ERMrest.Server)
    * [new Server(uri)](#new_ERMrest.Server_new)
    * [.uri](#ERMrest.Server+uri) : <code>string</code>
    * [.catalogs](#ERMrest.Server+catalogs) : <code>[Catalogs](#ERMrest.Catalogs)</code>

<a name="new_ERMrest.Server_new"></a>

#### new Server(uri)

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> | URI of the ERMrest service. |

<a name="ERMrest.Server+uri"></a>

#### server.uri : <code>string</code>
The URI of the ERMrest service

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
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [NotFoundError](#ERMrest.NotFoundError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Catalog ID. |

<a name="ERMrest.Catalog"></a>

### ERMrest.Catalog
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Catalog](#ERMrest.Catalog)
    * [new Catalog(server, id)](#new_ERMrest.Catalog_new)
    * [.id](#ERMrest.Catalog+id) : <code>string</code>
    * [.schemas](#ERMrest.Catalog+schemas) : <code>[Schemas](#ERMrest.Schemas)</code>
    * [.constraintByNamePair(pair)](#ERMrest.Catalog+constraintByNamePair) ⇒ <code>Object</code>

<a name="new_ERMrest.Catalog_new"></a>

#### new Catalog(server, id)
Constructor for the Catalog.


| Param | Type | Description |
| --- | --- | --- |
| server | <code>[Server](#ERMrest.Server)</code> | the server object. |
| id | <code>string</code> | the catalog id. |

<a name="ERMrest.Catalog+id"></a>

#### catalog.id : <code>string</code>
The catalog identifier.

**Kind**: instance property of <code>[Catalog](#ERMrest.Catalog)</code>  
<a name="ERMrest.Catalog+schemas"></a>

#### catalog.schemas : <code>[Schemas](#ERMrest.Schemas)</code>
**Kind**: instance property of <code>[Catalog](#ERMrest.Catalog)</code>  
<a name="ERMrest.Catalog+constraintByNamePair"></a>

#### catalog.constraintByNamePair(pair) ⇒ <code>Object</code>
returns the constraint object for the pair.

**Kind**: instance method of <code>[Catalog](#ERMrest.Catalog)</code>  
**Returns**: <code>Object</code> - the constrant object  
**Throws**:

- <code>[NotFoundError](#ERMrest.NotFoundError)</code> constraint not found


| Param | Type | Description |
| --- | --- | --- |
| pair | <code>Array.&lt;string&gt;</code> | constraint name array. Its length must be two. |

<a name="ERMrest.Schemas"></a>

### ERMrest.Schemas
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Schemas](#ERMrest.Schemas)
    * [new Schemas()](#new_ERMrest.Schemas_new)
    * [.length()](#ERMrest.Schemas+length) ⇒ <code>Number</code>
    * [.all()](#ERMrest.Schemas+all) ⇒ <code>Array</code>
    * [.names()](#ERMrest.Schemas+names) ⇒ <code>Array</code>
    * [.get(name)](#ERMrest.Schemas+get) ⇒ <code>[Schema](#ERMrest.Schema)</code>
    * [.has(name)](#ERMrest.Schemas+has) ⇒ <code>boolean</code>

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

- <code>[NotFoundError](#ERMrest.NotFoundError)</code> schema not found


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | schema name |

<a name="ERMrest.Schemas+has"></a>

#### schemas.has(name) ⇒ <code>boolean</code>
check for schema name existence

**Kind**: instance method of <code>[Schemas](#ERMrest.Schemas)</code>  
**Returns**: <code>boolean</code> - if the schema exists or not  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | schmea name |

<a name="ERMrest.Schema"></a>

### ERMrest.Schema
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Schema](#ERMrest.Schema)
    * [new Schema(catalog, jsonSchema)](#new_ERMrest.Schema_new)
    * [.catalog](#ERMrest.Schema+catalog) : <code>[Catalog](#ERMrest.Catalog)</code>
    * [.name](#ERMrest.Schema+name)
    * [.ignore](#ERMrest.Schema+ignore) : <code>boolean</code>
    * [.annotations](#ERMrest.Schema+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
    * [.displayname](#ERMrest.Schema+displayname) : <code>string</code>
    * [.tables](#ERMrest.Schema+tables) : <code>[Tables](#ERMrest.Tables)</code>
    * [.comment](#ERMrest.Schema+comment) : <code>string</code>

<a name="new_ERMrest.Schema_new"></a>

#### new Schema(catalog, jsonSchema)
Constructor for the Catalog.


| Param | Type | Description |
| --- | --- | --- |
| catalog | <code>[Catalog](#ERMrest.Catalog)</code> | the catalog object. |
| jsonSchema | <code>string</code> | json of the schema. |

<a name="ERMrest.Schema+catalog"></a>

#### schema.catalog : <code>[Catalog](#ERMrest.Catalog)</code>
**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+name"></a>

#### schema.name
**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+ignore"></a>

#### schema.ignore : <code>boolean</code>
**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+annotations"></a>

#### schema.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+displayname"></a>

#### schema.displayname : <code>string</code>
Preferred display name for user presentation only.

**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+tables"></a>

#### schema.tables : <code>[Tables](#ERMrest.Tables)</code>
**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+comment"></a>

#### schema.comment : <code>string</code>
Documentation for this schema

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

- <code>[NotFoundError](#ERMrest.NotFoundError)</code> table not found


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of table |

<a name="ERMrest.Table"></a>

### ERMrest.Table
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Table](#ERMrest.Table)
    * [new Table(schema, jsonTable)](#new_ERMrest.Table_new)
    * _instance_
        * [.schema](#ERMrest.Table+schema) : <code>[Schema](#ERMrest.Schema)</code>
        * [.name](#ERMrest.Table+name)
        * [.entity](#ERMrest.Table+entity) : <code>[Entity](#ERMrest.Table.Entity)</code>
        * [.ignore](#ERMrest.Table+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.Table+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
        * [.displayname](#ERMrest.Table+displayname) : <code>string</code>
        * [.columns](#ERMrest.Table+columns) : <code>[Columns](#ERMrest.Columns)</code>
        * [.keys](#ERMrest.Table+keys) : <code>[Keys](#ERMrest.Keys)</code>
        * [.foreignKeys](#ERMrest.Table+foreignKeys) : <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>
        * [.referredBy](#ERMrest.Table+referredBy) : <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>
        * [.comment](#ERMrest.Table+comment) : <code>string</code>
    * _static_
        * [.Entity](#ERMrest.Table.Entity)
            * [new Entity(server, table)](#new_ERMrest.Table.Entity_new)
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
| jsonTable | <code>string</code> | the json of the table. |

<a name="ERMrest.Table+schema"></a>

#### table.schema : <code>[Schema](#ERMrest.Schema)</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+name"></a>

#### table.name
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+entity"></a>

#### table.entity : <code>[Entity](#ERMrest.Table.Entity)</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+ignore"></a>

#### table.ignore : <code>boolean</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+annotations"></a>

#### table.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+displayname"></a>

#### table.displayname : <code>string</code>
Preferred display name for user presentation only.

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
<a name="ERMrest.Table+referredBy"></a>

#### table.referredBy : <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>
All the FKRs to this table.

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+comment"></a>

#### table.comment : <code>string</code>
Documentation for this table

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table.Entity"></a>

#### Table.Entity
**Kind**: static class of <code>[Table](#ERMrest.Table)</code>  

* [.Entity](#ERMrest.Table.Entity)
    * [new Entity(server, table)](#new_ERMrest.Table.Entity_new)
    * [.count([filter])](#ERMrest.Table.Entity+count) ⇒ <code>Promise</code>
    * [.get([filter], [limit], [columns], [sortby])](#ERMrest.Table.Entity+get) ⇒ <code>Promise</code>
    * [.getBefore(filter, limit, [columns], [sortby], row)](#ERMrest.Table.Entity+getBefore) ⇒ <code>Promise</code>
    * [.getAfter(filter, limit, [columns], [sortby], row)](#ERMrest.Table.Entity+getAfter) ⇒ <code>Promise</code>
    * [.delete(filter)](#ERMrest.Table.Entity+delete) ⇒ <code>Promise</code>
    * [.put(rows)](#ERMrest.Table.Entity+put) ⇒ <code>Promise</code>
    * [.post(rows, defaults)](#ERMrest.Table.Entity+post) ⇒ <code>Promise</code>

<a name="new_ERMrest.Table.Entity_new"></a>

##### new Entity(server, table)
Constructor for Entity. This is a container in Table


| Param | Type |
| --- | --- |
| server | <code>[Server](#ERMrest.Server)</code> | 
| table | <code>[Table](#ERMrest.Table)</code> | 

<a name="ERMrest.Table.Entity+count"></a>

##### entity.count([filter]) ⇒ <code>Promise</code>
get the number of rows

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - promise returning number of count if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  

| Param | Type |
| --- | --- |
| [filter] | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> | 

<a name="ERMrest.Table.Entity+get"></a>

##### entity.get([filter], [limit], [columns], [sortby]) ⇒ <code>Promise</code>
get table rows with option filter, row limit and selected columns (in this order).
In order to use before & after on a Rows, limit must be speficied,
output columns and sortby needs to have columns of a key

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - promise returning rowset if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    ERMrest.Conflict, ERMrest.ForbiddenError or ERMrest.Unauthorized if rejected  

| Param | Type | Description |
| --- | --- | --- |
| [filter] | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> |  |
| [limit] | <code>Number</code> | Number of rows |
| [columns] | <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> &#124; <code>Array.&lt;string&gt;</code> | Array of column names or Column objects output |
| [sortby] | <code>Array.&lt;Object&gt;</code> | An ordered array of {column, order} where column is column name or Column object, order is null (default), 'asc' or 'desc' |

<a name="ERMrest.Table.Entity+getBefore"></a>

##### entity.getBefore(filter, limit, [columns], [sortby], row) ⇒ <code>Promise</code>
get a page of rows before a specific row
In order to use before & after on a Rows, limit must be speficied,
output columns and sortby needs to have columns of a key

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - promise returning rowset if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    ERMrest.Conflict, ERMrest.ForbiddenError or ERMrest.Unauthorized if rejected  

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
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    ERMrest.Conflict, ERMrest.ForbiddenError or ERMrest.Unauthorized if rejected  

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
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  

| Param | Type |
| --- | --- |
| filter | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> | 

<a name="ERMrest.Table.Entity+put"></a>

##### entity.put(rows) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - Promise that returns the rows updated if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected
Update rows in the table  

| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Object</code> | jSON representation of the updated rows |

<a name="ERMrest.Table.Entity+post"></a>

##### entity.post(rows, defaults) ⇒ <code>Promise</code>
Create new entities

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - Promise that returns the rows created if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [BadRequestError](#ERMrest.BadRequestError), [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  

| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Object</code> | Array of jSON representation of rows |
| defaults | <code>Array.&lt;String&gt;</code> | Array of string column names to be defaults |

<a name="ERMrest.Rows"></a>

### ERMrest.Rows
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Rows](#ERMrest.Rows)
    * [new Rows(table, jsonRows, filter, limit, columns, [sortby])](#new_ERMrest.Rows_new)
    * [.data](#ERMrest.Rows+data) : <code>Array</code>
    * [.length()](#ERMrest.Rows+length) ⇒ <code>number</code>
    * [.get()](#ERMrest.Rows+get) ⇒ <code>Row</code>
    * [.after()](#ERMrest.Rows+after) ⇒ <code>Promise</code>
    * [.before()](#ERMrest.Rows+before) ⇒ <code>Promise</code>

<a name="new_ERMrest.Rows_new"></a>

#### new Rows(table, jsonRows, filter, limit, columns, [sortby])

| Param | Type | Description |
| --- | --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> |  |
| jsonRows | <code>Object</code> |  |
| filter | <code>[Negation](#ERMrest.Filters.Negation)</code> &#124; <code>[Conjunction](#ERMrest.Filters.Conjunction)</code> &#124; <code>[Disjunction](#ERMrest.Filters.Disjunction)</code> &#124; <code>[UnaryPredicate](#ERMrest.Filters.UnaryPredicate)</code> &#124; <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code> &#124; <code>null</code> | null if not being used |
| limit | <code>Number</code> | Number of rows |
| columns | <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> &#124; <code>Array.&lt;String&gt;</code> | Array of column names or Column objects output |
| [sortby] | <code>Array.&lt;Object&gt;</code> | An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc' |

<a name="ERMrest.Rows+data"></a>

#### rows.data : <code>Array</code>
The set of rows returns from the server. It is an Array of
Objects that has keys and values based on the query that produced
the Rows.

**Kind**: instance property of <code>[Rows](#ERMrest.Rows)</code>  
<a name="ERMrest.Rows+length"></a>

#### rows.length() ⇒ <code>number</code>
**Kind**: instance method of <code>[Rows](#ERMrest.Rows)</code>  
<a name="ERMrest.Rows+get"></a>

#### rows.get() ⇒ <code>Row</code>
**Kind**: instance method of <code>[Rows](#ERMrest.Rows)</code>  
<a name="ERMrest.Rows+after"></a>

#### rows.after() ⇒ <code>Promise</code>
get the rows of the next page

**Kind**: instance method of <code>[Rows](#ERMrest.Rows)</code>  
**Returns**: <code>Promise</code> - promise that returns the rows if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  
<a name="ERMrest.Rows+before"></a>

#### rows.before() ⇒ <code>Promise</code>
get the rowset of the previous page

**Kind**: instance method of <code>[Rows](#ERMrest.Rows)</code>  
**Returns**: <code>Promise</code> - promise that returns a rowset if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  
<a name="ERMrest.Row"></a>

### ERMrest.Row
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Row](#ERMrest.Row)
    * [new Row(jsonRow)](#new_ERMrest.Row_new)
    * [.data](#ERMrest.Row+data) : <code>Object</code>
    * [.names()](#ERMrest.Row+names) ⇒ <code>Array</code>
    * [.get(name)](#ERMrest.Row+get) ⇒ <code>Object</code>

<a name="new_ERMrest.Row_new"></a>

#### new Row(jsonRow)

| Param | Type | Description |
| --- | --- | --- |
| jsonRow | <code>Object</code> | Required. |

<a name="ERMrest.Row+data"></a>

#### row.data : <code>Object</code>
The row returned from the ith result in the Rows.data.

**Kind**: instance property of <code>[Row](#ERMrest.Row)</code>  
<a name="ERMrest.Row+names"></a>

#### row.names() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Row](#ERMrest.Row)</code>  
**Returns**: <code>Array</code> - Array of column names  
<a name="ERMrest.Row+get"></a>

#### row.get(name) ⇒ <code>Object</code>
**Kind**: instance method of <code>[Row](#ERMrest.Row)</code>  
**Returns**: <code>Object</code> - column value  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of column |

<a name="ERMrest.Columns"></a>

### ERMrest.Columns
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Columns](#ERMrest.Columns)
    * [new Columns(table)](#new_ERMrest.Columns_new)
    * [.all()](#ERMrest.Columns+all) ⇒ <code>Array</code>
    * [.length()](#ERMrest.Columns+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Columns+names) ⇒ <code>Array</code>
    * [.has(name)](#ERMrest.Columns+has) ⇒ <code>boolean</code>
    * [.get(name)](#ERMrest.Columns+get) ⇒ <code>[Column](#ERMrest.Column)</code>
    * [.getByPosition(pos)](#ERMrest.Columns+getByPosition) ⇒ <code>[Column](#ERMrest.Column)</code>

<a name="new_ERMrest.Columns_new"></a>

#### new Columns(table)
Constructor for Columns.


| Param | Type | Description |
| --- | --- | --- |
| table | <code>Table</code> | Required |

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
<a name="ERMrest.Columns+has"></a>

#### columns.has(name) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Columns)</code>  
**Returns**: <code>boolean</code> - whether Columns has this column or not  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the column |

<a name="ERMrest.Columns+get"></a>

#### columns.get(name) ⇒ <code>[Column](#ERMrest.Column)</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Columns)</code>  
**Returns**: <code>[Column](#ERMrest.Column)</code> - column  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of column |

<a name="ERMrest.Columns+getByPosition"></a>

#### columns.getByPosition(pos) ⇒ <code>[Column](#ERMrest.Column)</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Columns)</code>  

| Param | Type |
| --- | --- |
| pos | <code>int</code> | 

<a name="ERMrest.Column"></a>

### ERMrest.Column
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Column](#ERMrest.Column)
    * [new Column(table, jsonColumn)](#new_ERMrest.Column_new)
    * [.position](#ERMrest.Column+position) : <code>number</code>
    * [.table](#ERMrest.Column+table) : <code>[Table](#ERMrest.Table)</code>
    * [.name](#ERMrest.Column+name) : <code>string</code>
    * [.type](#ERMrest.Column+type) : <code>[Type](#ERMrest.Type)</code>
    * [.nullok](#ERMrest.Column+nullok) : <code>Boolean</code>
    * [.default](#ERMrest.Column+default) : <code>string</code>
    * [.comment](#ERMrest.Column+comment) : <code>string</code>
    * [.ignore](#ERMrest.Column+ignore) : <code>boolean</code>
    * [.annotations](#ERMrest.Column+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
    * [.displayname](#ERMrest.Column+displayname) : <code>string</code>
    * [.memberOfKeys](#ERMrest.Column+memberOfKeys) : <code>[Array.&lt;Key&gt;](#ERMrest.Key)</code>
    * [.memberOfForeignKeys](#ERMrest.Column+memberOfForeignKeys) : <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>
    * [.formatvalue(data)](#ERMrest.Column+formatvalue) ⇒ <code>string</code>
    * [.formatPresentation(data, options)](#ERMrest.Column+formatPresentation) ⇒ <code>Object</code>
    * [.toString()](#ERMrest.Column+toString)

<a name="new_ERMrest.Column_new"></a>

#### new Column(table, jsonColumn)
Constructs a Column.

TODO: The Column will need to change. We need to be able to use the
column in the context the new [ERMrest.Reference+columns](ERMrest.Reference+columns) where
a Column _may not_ be a part of a Table.


| Param | Type | Description |
| --- | --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | the table object. |
| jsonColumn | <code>string</code> | the json column. |

<a name="ERMrest.Column+position"></a>

#### column.position : <code>number</code>
The ordinal number or position of this column relative to other
columns within the same scope.
TODO: to be implemented

**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+table"></a>

#### column.table : <code>[Table](#ERMrest.Table)</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+name"></a>

#### column.name : <code>string</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+type"></a>

#### column.type : <code>[Type](#ERMrest.Type)</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+nullok"></a>

#### column.nullok : <code>Boolean</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+default"></a>

#### column.default : <code>string</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+comment"></a>

#### column.comment : <code>string</code>
Documentation for this column

**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+ignore"></a>

#### column.ignore : <code>boolean</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+annotations"></a>

#### column.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+displayname"></a>

#### column.displayname : <code>string</code>
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
<a name="ERMrest.Column+formatvalue"></a>

#### column.formatvalue(data) ⇒ <code>string</code>
Formats a value corresponding to this column definition.

**Kind**: instance method of <code>[Column](#ERMrest.Column)</code>  
**Returns**: <code>string</code> - The formatted value.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | The 'raw' data value. |

<a name="ERMrest.Column+formatPresentation"></a>

#### column.formatPresentation(data, options) ⇒ <code>Object</code>
Formats the presentation value corresponding to this column definition.

**Kind**: instance method of <code>[Column](#ERMrest.Column)</code>  
**Returns**: <code>Object</code> - A key value pair containing value and isHTML that detemrines the presenation.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>String</code> | The 'formatted' data value. |
| options | <code>Object</code> | The key value pair of possible options with all formatted values in '.values' key |

<a name="ERMrest.Column+toString"></a>

#### column.toString()
returns string representation of Column

**Kind**: instance method of <code>[Column](#ERMrest.Column)</code>  
**Retuns**: <code>string</code> string representation of Column  
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

- <code>[NotFoundError](#ERMrest.NotFoundError)</code> annotation not found


| Param | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> | uri of annotation |

<a name="ERMrest.Annotations+contains"></a>

#### annotations.contains(uri) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[Annotations](#ERMrest.Annotations)</code>  
**Returns**: <code>boolean</code> - whether or not annotation exists  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> | uri of annotation |

<a name="ERMrest.Annotation"></a>

### ERMrest.Annotation
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Annotation](#ERMrest.Annotation)
    * [new Annotation(subject, uri, jsonAnnotation)](#new_ERMrest.Annotation_new)
    * [.subject](#ERMrest.Annotation+subject) : <code>string</code>
    * [.content](#ERMrest.Annotation+content) : <code>string</code>

<a name="new_ERMrest.Annotation_new"></a>

#### new Annotation(subject, uri, jsonAnnotation)
Constructor for Annotation.


| Param | Type | Description |
| --- | --- | --- |
| subject | <code>string</code> | subject of the annotation: schema,table,column,key,foreignkeyref. |
| uri | <code>string</code> | uri id of the annotation. |
| jsonAnnotation | <code>string</code> | json of annotation. |

<a name="ERMrest.Annotation+subject"></a>

#### annotation.subject : <code>string</code>
One of schema,table,column,key,foreignkeyref

**Kind**: instance property of <code>[Annotation](#ERMrest.Annotation)</code>  
<a name="ERMrest.Annotation+content"></a>

#### annotation.content : <code>string</code>
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

- <code>[NotFoundError](#ERMrest.NotFoundError)</code> Key not found


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
    * [.comment](#ERMrest.Key+comment) : <code>string</code>
    * [.simple](#ERMrest.Key+simple) : <code>boolean</code>

<a name="new_ERMrest.Key_new"></a>

#### new Key(table, jsonKey)
Constructor for Key.


| Param | Type | Description |
| --- | --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | the table object. |
| jsonKey | <code>string</code> | json key. |

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
<a name="ERMrest.Key+comment"></a>

#### key.comment : <code>string</code>
Documentation for this key

**Kind**: instance property of <code>[Key](#ERMrest.Key)</code>  
<a name="ERMrest.Key+simple"></a>

#### key.simple : <code>boolean</code>
Indicates if the key is simple (not composite)

**Kind**: instance property of <code>[Key](#ERMrest.Key)</code>  
<a name="ERMrest.ColSet"></a>

### ERMrest.ColSet
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.ColSet](#ERMrest.ColSet)
    * [new ColSet(columns)](#new_ERMrest.ColSet_new)
    * [.columns](#ERMrest.ColSet+columns) : <code>Array</code>
    * [.toString()](#ERMrest.ColSet+toString)
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
<a name="ERMrest.ColSet+toString"></a>

#### colSet.toString()
returns string representation of colset object: (s:t:c1,s:t:c2)

**Kind**: instance method of <code>[ColSet](#ERMrest.ColSet)</code>  
**Retuns**: <code>string</code> string representation of colset object  
<a name="ERMrest.ColSet+length"></a>

#### colSet.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[ColSet](#ERMrest.ColSet)</code>  
**Returns**: <code>Number</code> - number of columns  
<a name="ERMrest.Mapping"></a>

### ERMrest.Mapping
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Mapping](#ERMrest.Mapping)
    * [new Mapping(from, to)](#new_ERMrest.Mapping_new)
    * [.toString()](#ERMrest.Mapping+toString)
    * [.length()](#ERMrest.Mapping+length) ⇒ <code>Number</code>
    * [.domain()](#ERMrest.Mapping+domain) ⇒ <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code>
    * [.get(fromCol)](#ERMrest.Mapping+get) ⇒ <code>[Column](#ERMrest.Column)</code>

<a name="new_ERMrest.Mapping_new"></a>

#### new Mapping(from, to)

| Param | Type | Description |
| --- | --- | --- |
| from | <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> | array of from Columns |
| to | <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code> | array of to Columns |

<a name="ERMrest.Mapping+toString"></a>

#### mapping.toString()
returns string representation of Mapping object

**Kind**: instance method of <code>[Mapping](#ERMrest.Mapping)</code>  
**Retuns**: <code>string</code> string representation of Mapping object  
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

- <code>[NotFoundError](#ERMrest.NotFoundError)</code> no mapping column found


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
    * [.get(colset)](#ERMrest.ForeignKeys+get) ⇒ <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>

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

#### foreignKeys.get(colset) ⇒ <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code>
get the foreign key of the given column set

**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>[Array.&lt;ForeignKeyRef&gt;](#ERMrest.ForeignKeyRef)</code> - foreign key reference of the colset  
**Throws**:

- <code>[NotFoundError](#ERMrest.NotFoundError)</code> foreign key not found


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
    * [.constraint_names](#ERMrest.ForeignKeyRef+constraint_names) : <code>Array</code>
    * [.from_name](#ERMrest.ForeignKeyRef+from_name) : <code>string</code>
    * [.to_name](#ERMrest.ForeignKeyRef+to_name) : <code>string</code>
    * [.ignore](#ERMrest.ForeignKeyRef+ignore) : <code>boolean</code>
    * [.annotations](#ERMrest.ForeignKeyRef+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
    * [.comment](#ERMrest.ForeignKeyRef+comment) : <code>string</code>
    * [.simple](#ERMrest.ForeignKeyRef+simple) : <code>Boolean</code>
    * [.toString([reverse])](#ERMrest.ForeignKeyRef+toString)
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
<a name="ERMrest.ForeignKeyRef+constraint_names"></a>

#### foreignKeyRef.constraint_names : <code>Array</code>
The exact `names` array in foreign key definition
TODO: it may need to change based on its usage

**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+from_name"></a>

#### foreignKeyRef.from_name : <code>string</code>
**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+to_name"></a>

#### foreignKeyRef.to_name : <code>string</code>
**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+ignore"></a>

#### foreignKeyRef.ignore : <code>boolean</code>
**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+annotations"></a>

#### foreignKeyRef.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+comment"></a>

#### foreignKeyRef.comment : <code>string</code>
Documentation for this foreign key reference

**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+simple"></a>

#### foreignKeyRef.simple : <code>Boolean</code>
Indicates if the foreign key is simple (not composite)

**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+toString"></a>

#### foreignKeyRef.toString([reverse])
returns string representation of ForeignKeyRef object

**Kind**: instance method of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
**Retuns**: <code>string</code> string representation of ForeignKeyRef object  

| Param | Type | Description |
| --- | --- | --- |
| [reverse] | <code>boolean</code> | false: returns (keyCol1, keyCol2)=(s:t:FKCol1,FKCol2) true: returns (FKCol1, FKCol2)=(s:t:keyCol1,keyCol2) |

<a name="ERMrest.ForeignKeyRef+getDomainValues"></a>

#### foreignKeyRef.getDomainValues(limit) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
**Returns**: <code>Promise</code> - promise that returns a rowset of the referenced key's table if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  

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
<a name="ERMrest.TimedOutError"></a>

### ERMrest.TimedOutError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.TimedOutError_new"></a>

#### new TimedOutError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.BadRequestError"></a>

### ERMrest.BadRequestError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.BadRequestError_new"></a>

#### new BadRequestError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.UnauthorizedError"></a>

### ERMrest.UnauthorizedError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.UnauthorizedError_new"></a>

#### new UnauthorizedError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.ForbiddenError"></a>

### ERMrest.ForbiddenError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.ForbiddenError_new"></a>

#### new ForbiddenError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.NotFoundError"></a>

### ERMrest.NotFoundError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.NotFoundError_new"></a>

#### new NotFoundError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.ConflictError"></a>

### ERMrest.ConflictError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.ConflictError_new"></a>

#### new ConflictError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.InternalServerError"></a>

### ERMrest.InternalServerError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.InternalServerError_new"></a>

#### new InternalServerError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.ServiceUnavailableError"></a>

### ERMrest.ServiceUnavailableError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.ServiceUnavailableError_new"></a>

#### new ServiceUnavailableError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.InvalidFilterOperatorError"></a>

### ERMrest.InvalidFilterOperatorError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.InvalidFilterOperatorError_new"></a>

#### new InvalidFilterOperatorError(message)
An invalid filter operator


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.InvalidInputError"></a>

### ERMrest.InvalidInputError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.InvalidInputError_new"></a>

#### new InvalidInputError(message)
An invalid input


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.MalformedURIError"></a>

### ERMrest.MalformedURIError
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.MalformedURIError_new"></a>

#### new MalformedURIError(message)
A malformed URI was passed to the API.


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.ParsedFilter"></a>

### ERMrest.ParsedFilter
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.ParsedFilter](#ERMrest.ParsedFilter)
    * [new ParsedFilter(type)](#new_ERMrest.ParsedFilter_new)
    * [.setFilters(filters)](#ERMrest.ParsedFilter+setFilters)
    * [.setBinaryPredicate(colname, operator, value)](#ERMrest.ParsedFilter+setBinaryPredicate)

<a name="new_ERMrest.ParsedFilter_new"></a>

#### new ParsedFilter(type)
Constructor for a ParsedFilter.


| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | type of filter |

<a name="ERMrest.ParsedFilter+setFilters"></a>

#### parsedFilter.setFilters(filters)
**Kind**: instance method of <code>[ParsedFilter](#ERMrest.ParsedFilter)</code>  

| Param | Description |
| --- | --- |
| filters | array of binary predicate |

<a name="ERMrest.ParsedFilter+setBinaryPredicate"></a>

#### parsedFilter.setBinaryPredicate(colname, operator, value)
**Kind**: instance method of <code>[ParsedFilter](#ERMrest.ParsedFilter)</code>  

| Param | Description |
| --- | --- |
| colname |  |
| operator | '=', '::gt::', '::lt::', etc. |
| value |  |

<a name="ERMrest.Reference"></a>

### ERMrest.Reference
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Reference](#ERMrest.Reference)
    * [new Reference(location)](#new_ERMrest.Reference_new)
    * [.displayname](#ERMrest.Reference+displayname) : <code>string</code>
    * [.uri](#ERMrest.Reference+uri) : <code>string</code>
    * [.session](#ERMrest.Reference+session)
    * [.columns](#ERMrest.Reference+columns) : <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code>
    * [.isUnique](#ERMrest.Reference+isUnique) : <code>boolean</code>
    * [.contextualize](#ERMrest.Reference+contextualize)
        * [.detailed](#ERMrest.Reference+contextualize.detailed) : <code>[Reference](#ERMrest.Reference)</code>
        * [.entry](#ERMrest.Reference+contextualize.entry) : <code>[Reference](#ERMrest.Reference)</code>
    * [.canCreate](#ERMrest.Reference+canCreate) : <code>boolean</code> &#124; <code>undefined</code>
    * [.canRead](#ERMrest.Reference+canRead) : <code>boolean</code> &#124; <code>undefined</code>
    * [.canUpdate](#ERMrest.Reference+canUpdate) : <code>boolean</code> &#124; <code>undefined</code>
    * [.canDelete](#ERMrest.Reference+canDelete) : <code>boolean</code> &#124; <code>undefined</code>
    * [.related](#ERMrest.Reference+related) : <code>[Array.&lt;Reference&gt;](#ERMrest.Reference)</code>
    * [.create(tbd)](#ERMrest.Reference+create) ⇒ <code>Promise</code>
    * [.read(limit)](#ERMrest.Reference+read) ⇒ <code>Promise</code>
    * [.sort(sort)](#ERMrest.Reference+sort)
    * [.update(tbd)](#ERMrest.Reference+update) ⇒ <code>Promise</code>
    * [.delete()](#ERMrest.Reference+delete) ⇒ <code>Promise</code>

<a name="new_ERMrest.Reference_new"></a>

#### new Reference(location)
Constructs a Reference object.

For most uses, maybe all, of the `ermrestjs` library, the Reference
will be the main object that the client will interact with. References
are immutable objects and therefore can be safely passed around and
used between multiple client components without risk that the underlying
reference to server-side resources could change.

Usage:
 Clients _do not_ directly access this constructor.
 See [resolve](#ERMrest.resolve).


| Param | Type | Description |
| --- | --- | --- |
| location | <code>ERMrest.Location</code> | The location object generated from parsing the URI |

<a name="ERMrest.Reference+displayname"></a>

#### reference.displayname : <code>string</code>
The display name for this reference.

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  
<a name="ERMrest.Reference+uri"></a>

#### reference.uri : <code>string</code>
The string form of the `URI` for this reference.

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  
<a name="ERMrest.Reference+session"></a>

#### reference.session
The session object from the server

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  

| Param | Type | Description |
| --- | --- | --- |
| session | <code>Object</code> | the session object |

<a name="ERMrest.Reference+columns"></a>

#### reference.columns : <code>[Array.&lt;Column&gt;](#ERMrest.Column)</code>
The array of column definitions which represent the model of
the resources accessible via this reference.

_Note_: in database jargon, technically everything returned from
ERMrest is a 'tuple' or a 'relation'. A tuple consists of attributes
and the definitions of those attributes are represented here as the
array of [Column](#ERMrest.Column)s. The column definitions may be
contextualized (see [contextualize](#ERMrest.Reference+contextualize)).

Usage:
```
for (var i=0, len=reference.columns.length; i<len; i++) {
  var col = reference.columns[i];
  console.log("Column name:", col.name, "has display name:", col.displayname);
}
```

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  
<a name="ERMrest.Reference+isUnique"></a>

#### reference.isUnique : <code>boolean</code>
A Boolean value that indicates whether this Reference is _inherently_
unique. Meaning, that it can only refere to a single data element,
like a single row. This is determined based on whether the reference
filters on a unique key.

As a simple example, the following would make a unique reference:

```
https://example.org/ermrest/catalog/42/entity/s:t/key=123
```

Assuming that table `s:t` has a `UNIQUE NOT NULL` constraint on
column `key`. A unique reference may be used to access at most one
tuple.

_Note_: we intend to support other semantic checks on references like
`isUnconstrained`, `isFiltered`, etc.

Usage:
```
console.log("This reference is unique?", (reference.isUnique ? 'yes' : 'no'));
```

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  
<a name="ERMrest.Reference+contextualize"></a>

#### reference.contextualize
The members of this object are _contextualized references_.

These references will behave and reflect state according to the mode.
For instance, in a `record` mode on a table some columns may be
hidden.

Usage:
```
// assumes we have an uncontextualized `Reference` object
var recordref = reference.contextualize.detailed;
```
The `reference` is unchanged, while `recordref` now represents a
reconfigured reference. For instance, `recordref.columns` may be
different compared to `reference.columns`.

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  

* [.contextualize](#ERMrest.Reference+contextualize)
    * [.detailed](#ERMrest.Reference+contextualize.detailed) : <code>[Reference](#ERMrest.Reference)</code>
    * [.entry](#ERMrest.Reference+contextualize.entry) : <code>[Reference](#ERMrest.Reference)</code>

<a name="ERMrest.Reference+contextualize.detailed"></a>

##### contextualize.detailed : <code>[Reference](#ERMrest.Reference)</code>
The _record_ context of this reference.

**Kind**: static property of <code>[contextualize](#ERMrest.Reference+contextualize)</code>  
<a name="ERMrest.Reference+contextualize.entry"></a>

##### contextualize.entry : <code>[Reference](#ERMrest.Reference)</code>
The _entry_ context of this reference.

**Kind**: static property of <code>[contextualize](#ERMrest.Reference+contextualize)</code>  
<a name="ERMrest.Reference+canCreate"></a>

#### reference.canCreate : <code>boolean</code> &#124; <code>undefined</code>
Indicates whether the client has the permission to _create_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  
<a name="ERMrest.Reference+canRead"></a>

#### reference.canRead : <code>boolean</code> &#124; <code>undefined</code>
Indicates whether the client has the permission to _read_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  
<a name="ERMrest.Reference+canUpdate"></a>

#### reference.canUpdate : <code>boolean</code> &#124; <code>undefined</code>
Indicates whether the client has the permission to _update_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  
<a name="ERMrest.Reference+canDelete"></a>

#### reference.canDelete : <code>boolean</code> &#124; <code>undefined</code>
Indicates whether the client has the permission to _delete_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  
<a name="ERMrest.Reference+related"></a>

#### reference.related : <code>[Array.&lt;Reference&gt;](#ERMrest.Reference)</code>
The "related" references. Relationships are defined by foreign key
references between [Table](#ERMrest.Table)s. Those references can be
considered "outbound" where the table has FKRs to other entities or
"inbound" where other entities have FKRs to this entity. Finally,
entities can be "associated" by means of associative entities. Those
are entities in another table that establish _many-to-many_
relationships between entities. If this help `A <- B -> C` where
entities in `B` establish relationships between entities in `A` and
`C`. Thus entities in `A` and `C` may be associated and we may
ignore `B` and think of this relationship as `A <-> C`, unless `B`
has other moderating attributes, for instance that indicate the
`type` of relationship, but this is a model-depenent detail.

**Kind**: instance property of <code>[Reference](#ERMrest.Reference)</code>  
<a name="ERMrest.Reference+create"></a>

#### reference.create(tbd) ⇒ <code>Promise</code>
Creates a set of resources.

**Kind**: instance method of <code>[Reference](#ERMrest.Reference)</code>  
**Returns**: <code>Promise</code> - A promise for a TBD result.  

| Param | Type | Description |
| --- | --- | --- |
| tbd | <code>Array</code> | TBD parameters. Probably an array of tuples [ {tuple},... ] for all entities to be created. |

<a name="ERMrest.Reference+read"></a>

#### reference.read(limit) ⇒ <code>Promise</code>
Reads the referenced resources and returns a promise for a page of
tuples. The `limit` parameter is required and must be a positive
integer. The page of tuples returned will be described by the
[columns](#ERMrest.Reference+columns) array of column definitions.

Usage:
```
// assumes the client holds a reference
reference.read(10).then(
  function(page) {
    // we now have a page of tuples
    ...
  },
  function(error) {
    // an error occurred
    ...
  });
```

**Kind**: instance method of <code>[Reference](#ERMrest.Reference)</code>  
**Returns**: <code>Promise</code> - A promise for a [Page](#ERMrest.Page) of results,
or [InvalidInputError](#ERMrest.InvalidInputError) if `limit` is invalid, or
other errors TBD (TODO document other errors here).  

| Param | Type | Description |
| --- | --- | --- |
| limit | <code>number</code> | The limit of results to be returned by the read request. __required__ |

<a name="ERMrest.Reference+sort"></a>

#### reference.sort(sort)
Return a new Reference with the new sorting

**Kind**: instance method of <code>[Reference](#ERMrest.Reference)</code>  

| Param | Type | Description |
| --- | --- | --- |
| sort | <code>Array.&lt;Object&gt;</code> | an array of objects in the format {"column":columname, "descending":true|false} in order of priority. Undfined, null or Empty array to use default sorting. |

<a name="ERMrest.Reference+update"></a>

#### reference.update(tbd) ⇒ <code>Promise</code>
Updates a set of resources.

**Kind**: instance method of <code>[Reference](#ERMrest.Reference)</code>  
**Returns**: <code>Promise</code> - A promise for a TBD result or errors.  

| Param | Type | Description |
| --- | --- | --- |
| tbd | <code>Array</code> | TBD parameters. Probably an array of pairs of [ (keys+values, allvalues)]+ ] for all entities to be updated. |

<a name="ERMrest.Reference+delete"></a>

#### reference.delete() ⇒ <code>Promise</code>
Deletes the referenced resources.

**Kind**: instance method of <code>[Reference](#ERMrest.Reference)</code>  
**Returns**: <code>Promise</code> - A promise for a TBD result or errors.  
<a name="ERMrest.Page"></a>

### ERMrest.Page
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Page](#ERMrest.Page)
    * [new Page(reference, data, hasNext, hasPrevious)](#new_ERMrest.Page_new)
    * [.tuples](#ERMrest.Page+tuples) : <code>[Array.&lt;Tuple&gt;](#ERMrest.Tuple)</code>
    * [.hasPrevious](#ERMrest.Page+hasPrevious) ⇒ <code>boolean</code>
    * [.previous](#ERMrest.Page+previous) : <code>[Reference](#ERMrest.Reference)</code> &#124; <code>undefined</code>
    * [.hasNext](#ERMrest.Page+hasNext) ⇒ <code>boolean</code>
    * [.next](#ERMrest.Page+next) : <code>[Reference](#ERMrest.Reference)</code> &#124; <code>undefined</code>

<a name="new_ERMrest.Page_new"></a>

#### new Page(reference, data, hasNext, hasPrevious)
Constructs a new Page. A _page_ represents a set of results returned from
ERMrest. It may not represent the complete set of results. There is an
iterator pattern used here, where its [previous](#ERMrest.Page+previous) and
[next](#ERMrest.Page+next) properties will give the client a
[Reference](#ERMrest.Reference) to the previous and next set of results,
respectively.

Usage:
 Clients _do not_ directly access this constructor.
 See [read](#ERMrest.Reference+read).


| Param | Type | Description |
| --- | --- | --- |
| reference | <code>[Reference](#ERMrest.Reference)</code> | The reference object from which this data was acquired. |
| data | <code>Array.&lt;Object&gt;</code> | The data returned from ERMrest. |
| hasNext | <code>boolean</code> | Whether there is more data before this Page |
| hasPrevious | <code>boolean</code> | Whether there is more data after this Page |

<a name="ERMrest.Page+tuples"></a>

#### page.tuples : <code>[Array.&lt;Tuple&gt;](#ERMrest.Tuple)</code>
An array of processed tuples. The results will be processed
according to the contextualized scheme (model) of this reference.

Usage:
```
for (var i=0, len=page.tuples.length; i<len; i++) {
  var tuple = page.tuples[i];
  console.log("Tuple:", tuple.displayname, "has values:", tuple.values);
}
```

**Kind**: instance property of <code>[Page](#ERMrest.Page)</code>  
<a name="ERMrest.Page+hasPrevious"></a>

#### page.hasPrevious ⇒ <code>boolean</code>
Whether there is more entities before this page

**Kind**: instance property of <code>[Page](#ERMrest.Page)</code>  
<a name="ERMrest.Page+previous"></a>

#### page.previous : <code>[Reference](#ERMrest.Reference)</code> &#124; <code>undefined</code>
A reference to the previous set of results.

Usage:
```
if (reference.previous) {
  // more tuples in the 'previous' direction are available
  reference.previous.read(10).then(
    ...
  );
}
```

**Kind**: instance property of <code>[Page](#ERMrest.Page)</code>  
<a name="ERMrest.Page+hasNext"></a>

#### page.hasNext ⇒ <code>boolean</code>
Whether there is more entities after this page

**Kind**: instance property of <code>[Page](#ERMrest.Page)</code>  
<a name="ERMrest.Page+next"></a>

#### page.next : <code>[Reference](#ERMrest.Reference)</code> &#124; <code>undefined</code>
A reference to the next set of results.

Usage:
```
if (reference.next) {
  // more tuples in the 'next' direction are available
  reference.next.read(10).then(
    ...
  );
}
```

**Kind**: instance property of <code>[Page](#ERMrest.Page)</code>  
<a name="ERMrest.Tuple"></a>

### ERMrest.Tuple
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Tuple](#ERMrest.Tuple)
    * [new Tuple(reference, data)](#new_ERMrest.Tuple_new)
    * [.reference](#ERMrest.Tuple+reference) ⇒ <code>[Reference](#ERMrest.Reference)</code> &#124; <code>\*</code>
    * [.canUpdate](#ERMrest.Tuple+canUpdate) : <code>boolean</code> &#124; <code>undefined</code>
    * [.canDelete](#ERMrest.Tuple+canDelete) : <code>boolean</code> &#124; <code>undefined</code>
    * [.values](#ERMrest.Tuple+values) : <code>Array.&lt;string&gt;</code>
    * [.isHTML](#ERMrest.Tuple+isHTML) : <code>Array.&lt;string&gt;</code>
    * [.displayname](#ERMrest.Tuple+displayname) : <code>string</code>
    * [.update()](#ERMrest.Tuple+update) ⇒ <code>Promise</code>
    * [.delete()](#ERMrest.Tuple+delete) ⇒ <code>Promise</code>

<a name="new_ERMrest.Tuple_new"></a>

#### new Tuple(reference, data)
Constructs a new Tuple. In database jargon, a tuple is a row in a
relation. This object represents a row returned by a query to ERMrest.

Usage:
 Clients _do not_ directly access this constructor.
 See [tuples](#ERMrest.Page+tuples).


| Param | Type | Description |
| --- | --- | --- |
| reference | <code>[Reference](#ERMrest.Reference)</code> | The reference object from which this data was acquired. |
| data | <code>Object</code> | The unprocessed tuple of data returned from ERMrest. |

<a name="ERMrest.Tuple+reference"></a>

#### tuple.reference ⇒ <code>[Reference](#ERMrest.Reference)</code> &#124; <code>\*</code>
This is the reference of the Tuple

**Kind**: instance property of <code>[Tuple](#ERMrest.Tuple)</code>  
**Returns**: <code>[Reference](#ERMrest.Reference)</code> &#124; <code>\*</code> - reference of the Tuple  
<a name="ERMrest.Tuple+canUpdate"></a>

#### tuple.canUpdate : <code>boolean</code> &#124; <code>undefined</code>
Indicates whether the client can update this tuple. Because
some policies may be undecidable until query execution, this
property may also be `undefined`.

Usage:
```
if (tuple.canUpdate == true) {
  console.log(tuple.displayname, "can be updated by this client");
}
else if (tuple.canUpdate == false) {
  console.log(tuple.displayname, "cannot be updated by this client");
}
else {
  console.log(tuple.displayname, "update permission cannot be determied");
}
```

**Kind**: instance property of <code>[Tuple](#ERMrest.Tuple)</code>  
<a name="ERMrest.Tuple+canDelete"></a>

#### tuple.canDelete : <code>boolean</code> &#124; <code>undefined</code>
Indicates whether the client can delete this tuple. Because
some policies may be undecidable until query execution, this
property may also be `undefined`.

See [canUpdate](#ERMrest.Tuple+canUpdate) for a usage example.

**Kind**: instance property of <code>[Tuple](#ERMrest.Tuple)</code>  
<a name="ERMrest.Tuple+values"></a>

#### tuple.values : <code>Array.&lt;string&gt;</code>
The array of formatted values of this tuple. The ordering of the
values in the array matches the ordering of the columns in the
reference (see [columns](#ERMrest.Reference+columns)).

Usage (iterating over all values in the tuple):
```
for (var i=0; len=reference.columns.length; i<len; i++) {
  console.log(tuple.displayname, "has a", ref.columns[i].displayname,
      "with value", tuple.values[i]);
}
```

Usage (getting a specific value by column position):
```
var column = reference.columns[8]; // the 8th column in this refernece
console.log(tuple.displayname, "has a", column.displayname,
    "with value", tuple.values[column.position]);
```

**Kind**: instance property of <code>[Tuple](#ERMrest.Tuple)</code>  
<a name="ERMrest.Tuple+isHTML"></a>

#### tuple.isHTML : <code>Array.&lt;string&gt;</code>
The array of boolean values of this tuple speicifying the value is HTML or not. The ordering of the
values in the array matches the ordering of the columns in the
reference (see [columns](#ERMrest.Reference+columns)).

Usage (iterating over all values in the tuple):
```
for (var i=0; len=reference.columns.length; i<len; i++) {
  console.log(tuple.displayname, tuple.isHTML[i] ? " has an HTML value" : " does not has an HTML value");
}
```

**Kind**: instance property of <code>[Tuple](#ERMrest.Tuple)</code>  
<a name="ERMrest.Tuple+displayname"></a>

#### tuple.displayname : <code>string</code>
The _disaply name_ of this tuple. For example, if this tuple is a
row from a table, then the display name is defined by the heuristic
or the annotation for the _row name_.

TODO: add a @link to the ermrest row name annotation

Usage:
```
console.log("This tuple has a displayable name of", tuple.displayname);
```

**Kind**: instance property of <code>[Tuple](#ERMrest.Tuple)</code>  
<a name="ERMrest.Tuple+update"></a>

#### tuple.update() ⇒ <code>Promise</code>
Attempts to update this tuple. This is a server side transaction,
and therefore an asynchronous operation that returns a promise.

**Kind**: instance method of <code>[Tuple](#ERMrest.Tuple)</code>  
**Returns**: <code>Promise</code> - a promise (TBD the result object)  
<a name="ERMrest.Tuple+delete"></a>

#### tuple.delete() ⇒ <code>Promise</code>
Attempts to delete this tuple. This is a server side transaction,
and therefore an asynchronous operation that returns a promise.

**Kind**: instance method of <code>[Tuple](#ERMrest.Tuple)</code>  
**Returns**: <code>Promise</code> - a promise (TBD the result object)  
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
    [ERMrest.Errors.TimedOutError](ERMrest.Errors.TimedOutError), [ERMrest.Errors.InternalServerError](ERMrest.Errors.InternalServerError), [ERMrest.Errors.ServiceUnavailableError](ERMrest.Errors.ServiceUnavailableError),
    [ERMrest.Errors.ConflictError](ERMrest.Errors.ConflictError), [ERMrest.Errors.ForbiddenError](ERMrest.Errors.ForbiddenError) or [ERMrest.Errors.UnauthorizedError](ERMrest.Errors.UnauthorizedError) if rejected  
<a name="ERMrest.Datapath.DataPath+entity.delete"></a>

###### entity.delete(filter) ⇒ <code>Promise</code>
delete entities

**Kind**: static method of <code>[entity](#ERMrest.Datapath.DataPath+entity)</code>  
**Returns**: <code>Promise</code> - promise that returns deleted entities if resolved or
    [ERMrest.Errors.TimedOutError](ERMrest.Errors.TimedOutError), [ERMrest.Errors.InternalServerError](ERMrest.Errors.InternalServerError), [ERMrest.Errors.ServiceUnavailableError](ERMrest.Errors.ServiceUnavailableError),
    [ERMrest.Errors.ConflictError](ERMrest.Errors.ConflictError), [ERMrest.Errors.ForbiddenError](ERMrest.Errors.ForbiddenError) or [ERMrest.Errors.UnauthorizedError](ERMrest.Errors.UnauthorizedError) if rejected  

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

- <code>ERMrest.Errors.NotFoundError</code> column not found


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

- <code>ERMrest.Errors.InvalidFilterOperatorError</code> invalid filter operator


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

- <code>ERMrest.Errors.InvalidFilterOperatorError</code> invalid filter operator


| Param | Type |
| --- | --- |
| column | <code>[Column](#ERMrest.Column)</code> | 
| operator | <code>ERMrest.Filters.OPERATOR</code> | 
| rvalue | <code>String</code> &#124; <code>Number</code> | 

<a name="ERMrest.Filters.BinaryPredicate+toUri"></a>

##### binaryPredicate.toUri() ⇒ <code>string</code>
**Kind**: instance method of <code>[BinaryPredicate](#ERMrest.Filters.BinaryPredicate)</code>  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.configure"></a>

### ERMrest.configure(http, q)
This function is used to configure the module

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  

| Param | Type | Description |
| --- | --- | --- |
| http | <code>Object</code> | Angular $http service object |
| q | <code>Object</code> | Angular $q service object |

<a name="ERMrest.getServer"></a>

### ERMrest.getServer(uri, [params]) ⇒ <code>[Server](#ERMrest.Server)</code>
ERMrest server factory creates or reuses ERMrest.Server instances. The
URI should be to the ERMrest _service_. For example,
`https://www.example.org/ermrest`.

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  
**Returns**: <code>[Server](#ERMrest.Server)</code> - Returns a server instance.  
**Throws**:

- <code>[InvalidInputError](#ERMrest.InvalidInputError)</code> URI is missing


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| uri | <code>string</code> |  | URI of the ERMrest service. |
| [params] | <code>Object</code> | <code>{cid:&#x27;null&#x27;}</code> | An optional server query parameter appended to the end of any request to the server. |

<a name="ERMrest.resolve"></a>

### ERMrest.resolve(uri, [params]) ⇒ <code>Promise</code>
This function resolves a URI reference to a [Reference](#ERMrest.Reference)
object. It validates the syntax of the URI and validates that the
references to model elements in it are correct. This function makes a
call to the ERMrest server in order to get the `schema` which it uses to
validate the URI path.

Usage:
```
// This example assume that the client has access to the `ERMrest` module
ERMrest.resolve('https://example.org/catalog/42/entity/s:t/k=123').then(
  function(reference) {
    // the uri was successfully resolve to a `Reference` object
    console.log("The reference has URI", reference.uri);
    console.log("It has", reference.columns.length, "columns");
    console.log("Is it unique?", (reference.isUnique ? 'yes' : 'no'));
    ...
  },
  function(error) {
    // there was an error returned here
    ...
  });
```

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  
**Returns**: <code>Promise</code> - Promise when resolved passes the
[Reference](#ERMrest.Reference) object. If rejected, passes one of:
[MalformedURIError](#ERMrest.MalformedURIError)
[TimedOutError](#ERMrest.TimedOutError),
[InternalServerError](#ERMrest.InternalServerError),
[ConflictError](#ERMrest.ConflictError),
[ForbiddenError](#ERMrest.ForbiddenError),
[UnauthorizedError](#ERMrest.UnauthorizedError),
[NotFoundError](#ERMrest.NotFoundError),  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> | An ERMrest resource URI, such as `https://example.org/ermrest/catalog/1/entity/s:t/k=123`. |
| [params] | <code>Object</code> | An optional parameters object. The (key, value) pairs from the object are converted to URL `key=value` query parameters and appended to every request to the ERMrest service. |

