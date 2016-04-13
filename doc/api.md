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
        * [.session](#ERMrest.Server+session) : <code>[Session](#ERMrest.Session)</code>
        * [.catalogs](#ERMrest.Server+catalogs) : <code>[Catalogs](#ERMrest.Catalogs)</code>
    * [.Session](#ERMrest.Session)
        * [.get()](#ERMrest.Session+get) ⇒ <code>Promise</code>
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
        * [.annotations](#ERMrest.Schema+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
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
            * [.annotations](#ERMrest.Table+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
        * _static_
            * [.Entity](#ERMrest.Table.Entity)
                * [new Entity(table)](#new_ERMrest.Table.Entity_new)
                * [.get(filter, limit, columns, sortby)](#ERMrest.Table.Entity+get) ⇒ <code>Promise</code>
                * [.delete(filter)](#ERMrest.Table.Entity+delete) ⇒ <code>Promise</code>
                * [.put(rowset)](#ERMrest.Table.Entity+put) ⇒ <code>Promise</code>
                * [.post(rowset, defaults)](#ERMrest.Table.Entity+post) ⇒ <code>Promise</code>
    * [.Columns](#ERMrest.Columns)
        * [new Columns()](#new_ERMrest.Columns_new)
        * [.all()](#ERMrest.Columns+all) ⇒ <code>Array</code>
        * [.length()](#ERMrest.Columns+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Columns+names) ⇒ <code>Array</code>
        * [.get(name)](#ERMrest.Columns+get) ⇒ <code>[Column](#ERMrest.Column)</code>
    * [.Column](#ERMrest.Column)
        * [new Column(table, jsonColumn)](#new_ERMrest.Column_new)
        * [.table](#ERMrest.Column+table) : <code>[Table](#ERMrest.Table)</code>
        * [.name](#ERMrest.Column+name)
        * [.type](#ERMrest.Column+type) : <code>[Type](#ERMrest.Type)</code>
        * [.annotations](#ERMrest.Column+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
    * [.Annotations](#ERMrest.Annotations)
        * [new Annotations()](#new_ERMrest.Annotations_new)
        * [.all()](#ERMrest.Annotations+all) ⇒ <code>Array</code>
        * [.length()](#ERMrest.Annotations+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Annotations+names) ⇒ <code>Array</code>
        * [.get(uri)](#ERMrest.Annotations+get) ⇒ <code>[Annotation](#ERMrest.Annotation)</code>
    * [.Annotation](#ERMrest.Annotation)
        * [new Annotation(subject, uri, jsonAnnotation)](#new_ERMrest.Annotation_new)
        * [.subject](#ERMrest.Annotation+subject) : <code>String</code>
        * [.content](#ERMrest.Annotation+content) : <code>String</code>
    * [.Keys](#ERMrest.Keys)
        * [new Keys()](#new_ERMrest.Keys_new)
        * [.all()](#ERMrest.Keys+all) ⇒ <code>Array</code>
        * [.length()](#ERMrest.Keys+length) ⇒ <code>Number</code>
        * [.colsets()](#ERMrest.Keys+colsets) ⇒ <code>Array</code>
        * [.get(colset)](#ERMrest.Keys+get) ⇒ <code>[Key](#ERMrest.Key)</code>
    * [.Key](#ERMrest.Key)
        * [new Key(table, jsonKey)](#new_ERMrest.Key_new)
        * [.colset](#ERMrest.Key+colset) : <code>[ColSet](#ERMrest.ColSet)</code>
        * [.annotations](#ERMrest.Key+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
    * [.ColSet](#ERMrest.ColSet)
        * [new ColSet(columns)](#new_ERMrest.ColSet_new)
        * [.columns](#ERMrest.ColSet+columns) : <code>Array</code>
        * [.length()](#ERMrest.ColSet+length) ⇒ <code>Number</code>
    * [.Mapping](#ERMrest.Mapping)
        * [new Mapping(from, to)](#new_ERMrest.Mapping_new)
        * [.length()](#ERMrest.Mapping+length) ⇒ <code>Number</code>
        * [.domain()](#ERMrest.Mapping+domain) ⇒ <code>Array</code>
        * [.get(fromCol)](#ERMrest.Mapping+get) ⇒ <code>[Column](#ERMrest.Column)</code>
    * [.ForeignKeys](#ERMrest.ForeignKeys)
        * [.all()](#ERMrest.ForeignKeys+all) ⇒ <code>Array</code>
        * [.colsets()](#ERMrest.ForeignKeys+colsets) ⇒ <code>Array</code>
        * [.length()](#ERMrest.ForeignKeys+length) ⇒ <code>Number</code>
        * [.mappings()](#ERMrest.ForeignKeys+mappings) ⇒ <code>Array</code>
        * [.get(colset)](#ERMrest.ForeignKeys+get) ⇒ <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>
    * [.ForeignKeyRef](#ERMrest.ForeignKeyRef)
        * [new ForeignKeyRef(table, jsonFKR)](#new_ERMrest.ForeignKeyRef_new)
        * [.colset](#ERMrest.ForeignKeyRef+colset) : <code>[ColSet](#ERMrest.ColSet)</code>
        * [.key](#ERMrest.ForeignKeyRef+key) : <code>[Key](#ERMrest.Key)</code>
        * [.mapping](#ERMrest.ForeignKeyRef+mapping) : <code>[Mapping](#ERMrest.Mapping)</code>
        * [.annotations](#ERMrest.ForeignKeyRef+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
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
            * [.names()](#ERMrest.Datapath.Columns+names) ⇒ <code>Array</code>
            * [.get(colName)](#ERMrest.Datapath.Columns+get) ⇒ <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code>
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
    * [.getServer(uri)](#ERMrest.getServer) ⇒ <code>[Server](#ERMrest.Server)</code>

<a name="ERMrest.Server"></a>
### ERMrest.Server
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Server](#ERMrest.Server)
    * [new Server(uri)](#new_ERMrest.Server_new)
    * [.uri](#ERMrest.Server+uri) : <code>String</code>
    * [.session](#ERMrest.Server+session) : <code>[Session](#ERMrest.Session)</code>
    * [.catalogs](#ERMrest.Server+catalogs) : <code>[Catalogs](#ERMrest.Catalogs)</code>

<a name="new_ERMrest.Server_new"></a>
#### new Server(uri)

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | URI of the ERMrest service. |

<a name="ERMrest.Server+uri"></a>
#### server.uri : <code>String</code>
**Kind**: instance property of <code>[Server](#ERMrest.Server)</code>  
<a name="ERMrest.Server+session"></a>
#### server.session : <code>[Session](#ERMrest.Session)</code>
**Kind**: instance property of <code>[Server](#ERMrest.Server)</code>  
<a name="ERMrest.Server+catalogs"></a>
#### server.catalogs : <code>[Catalogs](#ERMrest.Catalogs)</code>
**Kind**: instance property of <code>[Server](#ERMrest.Server)</code>  
<a name="ERMrest.Session"></a>
### ERMrest.Session
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="ERMrest.Session+get"></a>
#### session.get() ⇒ <code>Promise</code>
An asynchronous method that returns a promise. If fulfilled (and a user
is logged in), it gets the current session information.

**Kind**: instance method of <code>[Session](#ERMrest.Session)</code>  
**Returns**: <code>Promise</code> - Returns a promise.  
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
**Kind**: instance method of <code>[Catalogs](#ERMrest.Catalogs)</code>  
**Returns**: <code>Promise</code> - Promise with the catalog object  

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
**Returns**: <code>Array</code> - Array of all schemas  
<a name="ERMrest.Schemas+names"></a>
#### schemas.names() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Schemas](#ERMrest.Schemas)</code>  
**Returns**: <code>Array</code> - Array of schema names  
<a name="ERMrest.Schemas+get"></a>
#### schemas.get(name) ⇒ <code>[Schema](#ERMrest.Schema)</code>
**Kind**: instance method of <code>[Schemas](#ERMrest.Schemas)</code>  
**Returns**: <code>[Schema](#ERMrest.Schema)</code> - schema object  

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
    * [.annotations](#ERMrest.Schema+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>

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
<a name="ERMrest.Schema+annotations"></a>
#### schema.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
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
**Kind**: instance method of <code>[Tables](#ERMrest.Tables)</code>  
**Returns**: <code>[Table](#ERMrest.Table)</code> - table  

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
        * [.annotations](#ERMrest.Table+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
    * _static_
        * [.Entity](#ERMrest.Table.Entity)
            * [new Entity(table)](#new_ERMrest.Table.Entity_new)
            * [.get(filter, limit, columns, sortby)](#ERMrest.Table.Entity+get) ⇒ <code>Promise</code>
            * [.delete(filter)](#ERMrest.Table.Entity+delete) ⇒ <code>Promise</code>
            * [.put(rowset)](#ERMrest.Table.Entity+put) ⇒ <code>Promise</code>
            * [.post(rowset, defaults)](#ERMrest.Table.Entity+post) ⇒ <code>Promise</code>

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
<a name="ERMrest.Table+annotations"></a>
#### table.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table.Entity"></a>
#### Table.Entity
**Kind**: static class of <code>[Table](#ERMrest.Table)</code>  

* [.Entity](#ERMrest.Table.Entity)
    * [new Entity(table)](#new_ERMrest.Table.Entity_new)
    * [.get(filter, limit, columns, sortby)](#ERMrest.Table.Entity+get) ⇒ <code>Promise</code>
    * [.delete(filter)](#ERMrest.Table.Entity+delete) ⇒ <code>Promise</code>
    * [.put(rowset)](#ERMrest.Table.Entity+put) ⇒ <code>Promise</code>
    * [.post(rowset, defaults)](#ERMrest.Table.Entity+post) ⇒ <code>Promise</code>

<a name="new_ERMrest.Table.Entity_new"></a>
##### new Entity(table)
Constructor for Entity.


| Param | Type |
| --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | 

<a name="ERMrest.Table.Entity+get"></a>
##### entity.get(filter, limit, columns, sortby) ⇒ <code>Promise</code>
get table rows with option filter, row limit and selected columns (in this order).

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  

| Param | Type | Description |
| --- | --- | --- |
| filter | <code>Object</code> | Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null |
| limit | <code>Number</code> | Optional. Number of rows or null |
| columns | <code>Array</code> | Optional. Array of column names or Column objects, limit returned rows with selected columns only. |
| sortby | <code>Array</code> | Option. An ordered array of column names or Column objects for sorting |

<a name="ERMrest.Table.Entity+delete"></a>
##### entity.delete(filter) ⇒ <code>Promise</code>
Delete rows from table based on the filter

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - Promise  

| Param | Type | Description |
| --- | --- | --- |
| filter | <code>Object</code> | Negation, Conjunction, Disjunction, UnaryPredicate, or BinaryPredicate |

<a name="ERMrest.Table.Entity+put"></a>
##### entity.put(rowset) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - Promise
Update rows in the table  

| Param | Type | Description |
| --- | --- | --- |
| rowset | <code>Object</code> | jSON representation of the updated rows |

<a name="ERMrest.Table.Entity+post"></a>
##### entity.post(rowset, defaults) ⇒ <code>Promise</code>
Create new entities

**Kind**: instance method of <code>[Entity](#ERMrest.Table.Entity)</code>  
**Returns**: <code>Promise</code> - Promise  

| Param | Type | Description |
| --- | --- | --- |
| rowset | <code>Object</code> | Array of jSON representation of rows |
| defaults | <code>Array</code> | Array of string column names to be defaults |

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
    * [.name](#ERMrest.Column+name)
    * [.type](#ERMrest.Column+type) : <code>[Type](#ERMrest.Type)</code>
    * [.annotations](#ERMrest.Column+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>

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
#### column.name
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+type"></a>
#### column.type : <code>[Type](#ERMrest.Type)</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+annotations"></a>
#### column.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Annotations"></a>
### ERMrest.Annotations
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Annotations](#ERMrest.Annotations)
    * [new Annotations()](#new_ERMrest.Annotations_new)
    * [.all()](#ERMrest.Annotations+all) ⇒ <code>Array</code>
    * [.length()](#ERMrest.Annotations+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Annotations+names) ⇒ <code>Array</code>
    * [.get(uri)](#ERMrest.Annotations+get) ⇒ <code>[Annotation](#ERMrest.Annotation)</code>

<a name="new_ERMrest.Annotations_new"></a>
#### new Annotations()
Constructor for Annotations.

<a name="ERMrest.Annotations+all"></a>
#### annotations.all() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Annotations](#ERMrest.Annotations)</code>  
**Returns**: <code>Array</code> - list of all annotations  
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
**Kind**: instance method of <code>[Annotations](#ERMrest.Annotations)</code>  
**Returns**: <code>[Annotation](#ERMrest.Annotation)</code> - annotation  

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
    * [.all()](#ERMrest.Keys+all) ⇒ <code>Array</code>
    * [.length()](#ERMrest.Keys+length) ⇒ <code>Number</code>
    * [.colsets()](#ERMrest.Keys+colsets) ⇒ <code>Array</code>
    * [.get(colset)](#ERMrest.Keys+get) ⇒ <code>[Key](#ERMrest.Key)</code>

<a name="new_ERMrest.Keys_new"></a>
#### new Keys()
Constructor for Keys.

<a name="ERMrest.Keys+all"></a>
#### keys.all() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Keys](#ERMrest.Keys)</code>  
**Returns**: <code>Array</code> - a list of all Keys  
<a name="ERMrest.Keys+length"></a>
#### keys.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Keys](#ERMrest.Keys)</code>  
**Returns**: <code>Number</code> - number of keys  
<a name="ERMrest.Keys+colsets"></a>
#### keys.colsets() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Keys](#ERMrest.Keys)</code>  
**Returns**: <code>Array</code> - array of colsets  
<a name="ERMrest.Keys+get"></a>
#### keys.get(colset) ⇒ <code>[Key](#ERMrest.Key)</code>
**Kind**: instance method of <code>[Keys](#ERMrest.Keys)</code>  
**Returns**: <code>[Key](#ERMrest.Key)</code> - key of the colset  

| Param | Type |
| --- | --- |
| colset | <code>[ColSet](#ERMrest.ColSet)</code> | 

<a name="ERMrest.Key"></a>
### ERMrest.Key
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Key](#ERMrest.Key)
    * [new Key(table, jsonKey)](#new_ERMrest.Key_new)
    * [.colset](#ERMrest.Key+colset) : <code>[ColSet](#ERMrest.ColSet)</code>
    * [.annotations](#ERMrest.Key+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>

<a name="new_ERMrest.Key_new"></a>
#### new Key(table, jsonKey)
Constructor for Key.


| Param | Type | Description |
| --- | --- | --- |
| table | <code>[Table](#ERMrest.Table)</code> | the table object. |
| jsonKey | <code>String</code> | json key. |

<a name="ERMrest.Key+colset"></a>
#### key.colset : <code>[ColSet](#ERMrest.ColSet)</code>
**Kind**: instance property of <code>[Key](#ERMrest.Key)</code>  
<a name="ERMrest.Key+annotations"></a>
#### key.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
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
    * [.domain()](#ERMrest.Mapping+domain) ⇒ <code>Array</code>
    * [.get(fromCol)](#ERMrest.Mapping+get) ⇒ <code>[Column](#ERMrest.Column)</code>

<a name="new_ERMrest.Mapping_new"></a>
#### new Mapping(from, to)

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Array</code> | array of from Columns |
| to | <code>Array</code> | array of to Columns |

<a name="ERMrest.Mapping+length"></a>
#### mapping.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Mapping](#ERMrest.Mapping)</code>  
**Returns**: <code>Number</code> - number of mapping columns  
<a name="ERMrest.Mapping+domain"></a>
#### mapping.domain() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Mapping](#ERMrest.Mapping)</code>  
**Returns**: <code>Array</code> - the from columns  
<a name="ERMrest.Mapping+get"></a>
#### mapping.get(fromCol) ⇒ <code>[Column](#ERMrest.Column)</code>
**Kind**: instance method of <code>[Mapping](#ERMrest.Mapping)</code>  
**Returns**: <code>[Column](#ERMrest.Column)</code> - mapping column  

| Param | Type |
| --- | --- |
| fromCol | <code>[Column](#ERMrest.Column)</code> | 

<a name="ERMrest.ForeignKeys"></a>
### ERMrest.ForeignKeys
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.ForeignKeys](#ERMrest.ForeignKeys)
    * [.all()](#ERMrest.ForeignKeys+all) ⇒ <code>Array</code>
    * [.colsets()](#ERMrest.ForeignKeys+colsets) ⇒ <code>Array</code>
    * [.length()](#ERMrest.ForeignKeys+length) ⇒ <code>Number</code>
    * [.mappings()](#ERMrest.ForeignKeys+mappings) ⇒ <code>Array</code>
    * [.get(colset)](#ERMrest.ForeignKeys+get) ⇒ <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>

<a name="ERMrest.ForeignKeys+all"></a>
#### foreignKeys.all() ⇒ <code>Array</code>
**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>Array</code> - an array of all foreign key references  
<a name="ERMrest.ForeignKeys+colsets"></a>
#### foreignKeys.colsets() ⇒ <code>Array</code>
**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>Array</code> - an array of the foreign keys' colsets  
<a name="ERMrest.ForeignKeys+length"></a>
#### foreignKeys.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>Number</code> - number of foreign keys  
<a name="ERMrest.ForeignKeys+mappings"></a>
#### foreignKeys.mappings() ⇒ <code>Array</code>
**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>Array</code> - mappings  
<a name="ERMrest.ForeignKeys+get"></a>
#### foreignKeys.get(colset) ⇒ <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>
**Kind**: instance method of <code>[ForeignKeys](#ERMrest.ForeignKeys)</code>  
**Returns**: <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code> - foreign key reference of the colset  

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
    * [.annotations](#ERMrest.ForeignKeyRef+annotations) : <code>[Annotations](#ERMrest.Annotations)</code>
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
<a name="ERMrest.ForeignKeyRef+annotations"></a>
#### foreignKeyRef.annotations : <code>[Annotations](#ERMrest.Annotations)</code>
**Kind**: instance property of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
<a name="ERMrest.ForeignKeyRef+getDomainValues"></a>
#### foreignKeyRef.getDomainValues(limit) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[ForeignKeyRef](#ERMrest.ForeignKeyRef)</code>  
**Returns**: <code>Promise</code> - promise with rowset of the referenced key's table  

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
        * [.names()](#ERMrest.Datapath.Columns+names) ⇒ <code>Array</code>
        * [.get(colName)](#ERMrest.Datapath.Columns+get) ⇒ <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code>

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
**Returns**: <code>Promise</code> - promise with rowset data  
<a name="ERMrest.Datapath.DataPath+entity.delete"></a>
###### entity.delete(filter) ⇒ <code>Promise</code>
delete entities

**Kind**: static method of <code>[entity](#ERMrest.Datapath.DataPath+entity)</code>  

| Param | Type |
| --- | --- |
| filter | <code>Object</code> | 

<a name="ERMrest.Datapath.DataPath+filter"></a>
##### dataPath.filter(filter) ⇒ <code>[DataPath](#ERMrest.Datapath.DataPath)</code>
this datapath is not modified

**Kind**: instance method of <code>[DataPath](#ERMrest.Datapath.DataPath)</code>  
**Returns**: <code>[DataPath](#ERMrest.Datapath.DataPath)</code> - a shallow copy of this datapath with filter  

| Param | Type |
| --- | --- |
| filter | <code>Object</code> | 

<a name="ERMrest.Datapath.DataPath+extend"></a>
##### dataPath.extend(table, context, link) ⇒ <code>[PathTable](#ERMrest.Datapath.PathTable)</code>
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
    * [.names()](#ERMrest.Datapath.Columns+names) ⇒ <code>Array</code>
    * [.get(colName)](#ERMrest.Datapath.Columns+get) ⇒ <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code>

<a name="ERMrest.Datapath.Columns+length"></a>
##### columns.length() ⇒ <code>Number</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Datapath.Columns)</code>  
**Returns**: <code>Number</code> - number of path columns  
<a name="ERMrest.Datapath.Columns+names"></a>
##### columns.names() ⇒ <code>Array</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Datapath.Columns)</code>  
**Returns**: <code>Array</code> - a list of pathcolumn names  
<a name="ERMrest.Datapath.Columns+get"></a>
##### columns.get(colName) ⇒ <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code>
**Kind**: instance method of <code>[Columns](#ERMrest.Datapath.Columns)</code>  
**Returns**: <code>[PathColumn](#ERMrest.Datapath.PathColumn)</code> - returns the PathColumn  

| Param | Type | Description |
| --- | --- | --- |
| colName | <code>string</code> | column name |

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
### ERMrest.getServer(uri) ⇒ <code>[Server](#ERMrest.Server)</code>
ERMrest server factory creates or reuses ERMrest.Server instances. The
URI should be to the ERMrest _service_. For example,
`https://www.example.org/ermrest`.

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  
**Returns**: <code>[Server](#ERMrest.Server)</code> - Returns a server instance.  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | URI of the ERMrest service. |

