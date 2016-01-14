<a name="ERMrest"></a>
## ERMrest : <code>object</code>
The ERMrest module is a JavaScript client library for the ERMrest
service.

IMPORTANT NOTE: This module is a work in progress.
It is likely to change several times before we have an interface we wish
to use for ERMrest JavaScript agents.

**Kind**: global namespace  

* [ERMrest](#ERMrest) : <code>object</code>
  * [.Client](#ERMrest.Client)
    * [new Client(uri)](#new_ERMrest.Client_new)
    * [.uri](#ERMrest.Client+uri)
    * [.getCatalog(id)](#ERMrest.Client+getCatalog) ⇒ <code>Catalog</code>
  * [.Catalog](#ERMrest.Catalog)
    * [new Catalog(client, id)](#new_ERMrest.Catalog_new)
    * [.id](#ERMrest.Catalog+id)
    * [.introspect()](#ERMrest.Catalog+introspect) ⇒ <code>Promise</code>
    * [.getSchemas()](#ERMrest.Catalog+getSchemas) ⇒ <code>Object</code>
  * [.Schema](#ERMrest.Schema)
    * [new Schema(catalog, jsonSchema)](#new_ERMrest.Schema_new)
    * [.name](#ERMrest.Schema+name)
    * [.getTable(name)](#ERMrest.Schema+getTable) ⇒ <code>Table</code>
  * [.Table](#ERMrest.Table)
    * [new Table(schema, jsonTable)](#new_ERMrest.Table_new)
    * [.name](#ERMrest.Table+name)
    * [.schema](#ERMrest.Table+schema)
    * [.displayName](#ERMrest.Table+displayName)
    * [.hidden](#ERMrest.Table+hidden)
    * [.columns](#ERMrest.Table+columns)
    * [.keys](#ERMrest.Table+keys)
    * [.annotations](#ERMrest.Table+annotations)
    * [.getFilteredTable(fitlers)](#ERMrest.Table+getFilteredTable) ⇒ <code>Table</code>
    * [.getEntities()](#ERMrest.Table+getEntities) ⇒ <code>Promise</code>
    * [.createEntity(data, defaults)](#ERMrest.Table+createEntity) ⇒ <code>Promise</code>
    * [.deleteEntity(keys)](#ERMrest.Table+deleteEntity) ⇒ <code>Promise</code>
    * [.updateEntities()](#ERMrest.Table+updateEntities) ⇒ <code>Promise</code>
  * [.Column](#ERMrest.Column)
    * [new Column(name, column&#x27;s, whether)](#new_ERMrest.Column_new)
    * [.name](#ERMrest.Column+name)
    * [.displayName](#ERMrest.Column+displayName)
    * [.hidden](#ERMrest.Column+hidden)
  * [.Entity](#ERMrest.Entity)
    * [new Entity(parent, json)](#new_ERMrest.Entity_new)
    * [.table](#ERMrest.Entity+table)
    * [.uri](#ERMrest.Entity+uri)
    * [.data](#ERMrest.Entity+data)
    * [.getRelatedTable(schemaName, tableName)](#ERMrest.Entity+getRelatedTable) ⇒ <code>Table</code>
    * [.delete()](#ERMrest.Entity+delete) ⇒ <code>Promise</code>
    * [.update()](#ERMrest.Entity+update) ⇒ <code>Promise</code>
  * [.RelatedTable](#ERMrest.RelatedTable)
    * [new RelatedTable(entity, schemaName, tableName)](#new_ERMrest.RelatedTable_new)
  * [.FilteredTable](#ERMrest.FilteredTable)
    * [new FilteredTable(table, filters)](#new_ERMrest.FilteredTable_new)
    * [.filters](#ERMrest.FilteredTable+filters)
  * [.configure(http, q)](#ERMrest.configure)
  * [.getClient(uri)](#ERMrest.getClient) ⇒ <code>Client</code>

<a name="ERMrest.Client"></a>
### ERMrest.Client
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Client](#ERMrest.Client)
  * [new Client(uri)](#new_ERMrest.Client_new)
  * [.uri](#ERMrest.Client+uri)
  * [.getCatalog(id)](#ERMrest.Client+getCatalog) ⇒ <code>Catalog</code>

<a name="new_ERMrest.Client_new"></a>
#### new Client(uri)
The client for the ERMrest service endpoint.


| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | URI of the ERMrest service. |

<a name="ERMrest.Client+uri"></a>
#### client.uri
The URI of the ERMrest service.

**Kind**: instance property of <code>[Client](#ERMrest.Client)</code>  
<a name="ERMrest.Client+getCatalog"></a>
#### client.getCatalog(id) ⇒ <code>Catalog</code>
Returns an interface to a Catalog object representing the catalog
resource on the service.

**Kind**: instance method of <code>[Client](#ERMrest.Client)</code>  
**Returns**: <code>Catalog</code> - an instance of a catalog object.  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | Identifier of a catalog within the ERMrest service. |

<a name="ERMrest.Catalog"></a>
### ERMrest.Catalog
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Catalog](#ERMrest.Catalog)
  * [new Catalog(client, id)](#new_ERMrest.Catalog_new)
  * [.id](#ERMrest.Catalog+id)
  * [.introspect()](#ERMrest.Catalog+introspect) ⇒ <code>Promise</code>
  * [.getSchemas()](#ERMrest.Catalog+getSchemas) ⇒ <code>Object</code>

<a name="new_ERMrest.Catalog_new"></a>
#### new Catalog(client, id)
Constructor for the Catalog.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>Client</code> | the client object. |
| id | <code>String</code> | Identifier of a catalog within the ERMrest service. |

<a name="ERMrest.Catalog+id"></a>
#### catalog.id
Identifier of the Catalog.

**Kind**: instance property of <code>[Catalog](#ERMrest.Catalog)</code>  
<a name="ERMrest.Catalog+introspect"></a>
#### catalog.introspect() ⇒ <code>Promise</code>
An asynchronous method that returns a promise. If fulfilled, it gets the
schemas of the catalog. This method should be called at least on the
catalog object before using the rest of its methods.

**Kind**: instance method of <code>[Catalog](#ERMrest.Catalog)</code>  
**Returns**: <code>Promise</code> - Returns a promise.  
<a name="ERMrest.Catalog+getSchemas"></a>
#### catalog.getSchemas() ⇒ <code>Object</code>
This is a synchronous method that returns a schema object from an
already introspected catalog.

**Kind**: instance method of <code>[Catalog](#ERMrest.Catalog)</code>  
**Returns**: <code>Object</code> - returns a dictionary of schemas. The keys of the
dictionary are taken from the schema names and the values are the
corresponding schema objects.  
<a name="ERMrest.Schema"></a>
### ERMrest.Schema
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Schema](#ERMrest.Schema)
  * [new Schema(catalog, jsonSchema)](#new_ERMrest.Schema_new)
  * [.name](#ERMrest.Schema+name)
  * [.getTable(name)](#ERMrest.Schema+getTable) ⇒ <code>Table</code>

<a name="new_ERMrest.Schema_new"></a>
#### new Schema(catalog, jsonSchema)
Constructor for the Schema.


| Param | Type | Description |
| --- | --- | --- |
| catalog | <code>Catalog</code> | The catalog the schema belongs to. |
| jsonSchema | <code>Object</code> | The raw json Schema returned by the ERMrest service. |

<a name="ERMrest.Schema+name"></a>
#### schema.name
The name of the schema.

**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+getTable"></a>
#### schema.getTable(name) ⇒ <code>Table</code>
This is a synchronous method that returns a table object from an
already introspected catalog.

**Kind**: instance method of <code>[Schema](#ERMrest.Schema)</code>  
**Returns**: <code>Table</code> - a table object.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | the name of the table. |

<a name="ERMrest.Table"></a>
### ERMrest.Table
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Table](#ERMrest.Table)
  * [new Table(schema, jsonTable)](#new_ERMrest.Table_new)
  * [.name](#ERMrest.Table+name)
  * [.schema](#ERMrest.Table+schema)
  * [.displayName](#ERMrest.Table+displayName)
  * [.hidden](#ERMrest.Table+hidden)
  * [.columns](#ERMrest.Table+columns)
  * [.keys](#ERMrest.Table+keys)
  * [.annotations](#ERMrest.Table+annotations)
  * [.getFilteredTable(fitlers)](#ERMrest.Table+getFilteredTable) ⇒ <code>Table</code>
  * [.getEntities()](#ERMrest.Table+getEntities) ⇒ <code>Promise</code>
  * [.createEntity(data, defaults)](#ERMrest.Table+createEntity) ⇒ <code>Promise</code>
  * [.deleteEntity(keys)](#ERMrest.Table+deleteEntity) ⇒ <code>Promise</code>
  * [.updateEntities()](#ERMrest.Table+updateEntities) ⇒ <code>Promise</code>

<a name="new_ERMrest.Table_new"></a>
#### new Table(schema, jsonTable)
Constructor of the Table.


| Param | Type | Description |
| --- | --- | --- |
| schema | <code>Schema</code> | The schema for the table. |
| jsonTable | <code>Object</code> | The raw json of the table returned by the ERMrest service. |

<a name="ERMrest.Table+name"></a>
#### table.name
The name of the table.

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+schema"></a>
#### table.schema
The schema that the table belongs to.

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+displayName"></a>
#### table.displayName
The display name of the table.

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+hidden"></a>
#### table.hidden
The name of the table.

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+columns"></a>
#### table.columns
list of column definitions.

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+keys"></a>
#### table.keys
list of keys of the table.

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+annotations"></a>
#### table.annotations
a list or dictionary of annotation objects.

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+getFilteredTable"></a>
#### table.getFilteredTable(fitlers) ⇒ <code>Table</code>
Returns a filtered table based on this table.

**Kind**: instance method of <code>[Table](#ERMrest.Table)</code>  
**Returns**: <code>Table</code> - a filtered table instance.  

| Param | Type | Description |
| --- | --- | --- |
| fitlers | <code>Array</code> | array of filters, which are strings. |

<a name="ERMrest.Table+getEntities"></a>
#### table.getEntities() ⇒ <code>Promise</code>
An asynchronous method that returns a promise. If fulfilled, it gets the
entities for this table.

**Kind**: instance method of <code>[Table](#ERMrest.Table)</code>  
**Returns**: <code>Promise</code> - Returns a promise.  
<a name="ERMrest.Table+createEntity"></a>
#### table.createEntity(data, defaults) ⇒ <code>Promise</code>
Creating a new entity. If the promise is fullfilled a new entity has
been created in the catalog, otherwise the promise is rejected.

**Kind**: instance method of <code>[Table](#ERMrest.Table)</code>  
**Returns**: <code>Promise</code> - Returns a promise.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | The entity data. This is typically a dictionary of attribute name-value pairs essentially. |
| defaults | <code>Object</code> | An array of default columns. |

<a name="ERMrest.Table+deleteEntity"></a>
#### table.deleteEntity(keys) ⇒ <code>Promise</code>
Deletes entities, if promise is fulfilled.

**Kind**: instance method of <code>[Table](#ERMrest.Table)</code>  
**Returns**: <code>Promise</code> - Returns a promise.  

| Param | Type | Description |
| --- | --- | --- |
| keys | <code>Object</code> | The keys and values identifying the entity |

<a name="ERMrest.Table+updateEntities"></a>
#### table.updateEntities() ⇒ <code>Promise</code>
Update entities with data that has been modified.

**Kind**: instance method of <code>[Table](#ERMrest.Table)</code>  
**Returns**: <code>Promise</code> - Returns a promise.  
<a name="ERMrest.Column"></a>
### ERMrest.Column
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Column](#ERMrest.Column)
  * [new Column(name, column&#x27;s, whether)](#new_ERMrest.Column_new)
  * [.name](#ERMrest.Column+name)
  * [.displayName](#ERMrest.Column+displayName)
  * [.hidden](#ERMrest.Column+hidden)

<a name="new_ERMrest.Column_new"></a>
#### new Column(name, column&#x27;s, whether)
Constructor of the Column.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>name</code> | of the column |
| column's | <code>displayName</code> | display name |
| whether | <code>hidden</code> | this column is hidden or not |

<a name="ERMrest.Column+name"></a>
#### column.name
name of the column

**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+displayName"></a>
#### column.displayName
display name of the column

**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Column+hidden"></a>
#### column.hidden
whether column is hidden or not

**Kind**: instance property of <code>[Column](#ERMrest.Column)</code>  
<a name="ERMrest.Entity"></a>
### ERMrest.Entity
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Entity](#ERMrest.Entity)
  * [new Entity(parent, json)](#new_ERMrest.Entity_new)
  * [.table](#ERMrest.Entity+table)
  * [.uri](#ERMrest.Entity+uri)
  * [.data](#ERMrest.Entity+data)
  * [.getRelatedTable(schemaName, tableName)](#ERMrest.Entity+getRelatedTable) ⇒ <code>Table</code>
  * [.delete()](#ERMrest.Entity+delete) ⇒ <code>Promise</code>
  * [.update()](#ERMrest.Entity+update) ⇒ <code>Promise</code>

<a name="new_ERMrest.Entity_new"></a>
#### new Entity(parent, json)
Creates an entity, which is an instance of a table object.


| Param | Type | Description |
| --- | --- | --- |
| parent | <code>Table</code> | table |
| json | <code>Object</code> | entity data |

<a name="ERMrest.Entity+table"></a>
#### entity.table
table

**Kind**: instance property of <code>[Entity](#ERMrest.Entity)</code>  
<a name="ERMrest.Entity+uri"></a>
#### entity.uri
entity uri

**Kind**: instance property of <code>[Entity](#ERMrest.Entity)</code>  
<a name="ERMrest.Entity+data"></a>
#### entity.data
entity data

**Kind**: instance property of <code>[Entity](#ERMrest.Entity)</code>  
<a name="ERMrest.Entity+getRelatedTable"></a>
#### entity.getRelatedTable(schemaName, tableName) ⇒ <code>Table</code>
Returns a related table based on this entity.

**Kind**: instance method of <code>[Entity](#ERMrest.Entity)</code>  
**Returns**: <code>Table</code> - related table instance.  

| Param | Type | Description |
| --- | --- | --- |
| schemaName | <code>String</code> | Schema name. |
| tableName | <code>String</code> | Table name. |

<a name="ERMrest.Entity+delete"></a>
#### entity.delete() ⇒ <code>Promise</code>
Delete this entity from its table

**Kind**: instance method of <code>[Entity](#ERMrest.Entity)</code>  
**Returns**: <code>Promise</code> - Returns a promise.  
<a name="ERMrest.Entity+update"></a>
#### entity.update() ⇒ <code>Promise</code>
Update entity with data that has been modified

**Kind**: instance method of <code>[Entity](#ERMrest.Entity)</code>  
**Returns**: <code>Promise</code> - Returns a promise.  
<a name="ERMrest.RelatedTable"></a>
### ERMrest.RelatedTable
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.RelatedTable_new"></a>
#### new RelatedTable(entity, schemaName, tableName)
Creates an instance of the Table object.


| Param | Type | Description |
| --- | --- | --- |
| entity | <code>Entity</code> | the entity object. |
| schemaName | <code>String</code> | related schema name. |
| tableName | <code>String</code> | related table name. |

<a name="ERMrest.FilteredTable"></a>
### ERMrest.FilteredTable
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.FilteredTable](#ERMrest.FilteredTable)
  * [new FilteredTable(table, filters)](#new_ERMrest.FilteredTable_new)
  * [.filters](#ERMrest.FilteredTable+filters)

<a name="new_ERMrest.FilteredTable_new"></a>
#### new FilteredTable(table, filters)
Creates an instance of the Table object.

Currently, the filters are strings that follow the ERMrest specification
for filters.


| Param | Type | Description |
| --- | --- | --- |
| table | <code>Table</code> | The base table to be filtered. |
| filters | <code>Array</code> | The array of filters. |

<a name="ERMrest.FilteredTable+filters"></a>
#### filteredTable.filters
Filters of the filtered table

**Kind**: instance property of <code>[FilteredTable](#ERMrest.FilteredTable)</code>  
<a name="ERMrest.configure"></a>
### ERMrest.configure(http, q)
This function is used to configure the module.

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  

| Param | Type | Description |
| --- | --- | --- |
| http | <code>Object</code> | Angular $http service object |
| q | <code>Object</code> | Angular $q service object |

<a name="ERMrest.getClient"></a>
### ERMrest.getClient(uri) ⇒ <code>Client</code>
ERMrest client factory creates or reuses ERMrest.Client instances. The
URI should be to the ERMrest _service_. For example,
`https://www.example.org/ermrest`.

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  
**Returns**: <code>Client</code> - Returns a client.  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | URI of the ERMrest service. |

