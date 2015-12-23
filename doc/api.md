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
    * [new Client(uri, credentials)](#new_ERMrest.Client_new)
    * [.uri](#ERMrest.Client+uri)
    * [.getCatalog(id)](#ERMrest.Client+getCatalog)
  * [.Catalog](#ERMrest.Catalog)
    * [new Catalog(client, id)](#new_ERMrest.Catalog_new)
    * [.id](#ERMrest.Catalog+id)
    * [.introspect()](#ERMrest.Catalog+introspect) ⇒ <code>Promise</code>
    * [.getSchemas()](#ERMrest.Catalog+getSchemas) ⇒ <code>Object</code>
  * [.Schema](#ERMrest.Schema)
    * [new Schema(catalog, jsonSchemas)](#new_ERMrest.Schema_new)
    * [.name](#ERMrest.Schema+name)
    * [.getTable(name)](#ERMrest.Schema+getTable)
  * [.Table](#ERMrest.Table)
    * [new Table(schema, jsonTable)](#new_ERMrest.Table_new)
    * [.name](#ERMrest.Table+name)
    * [.displayName](#ERMrest.Table+displayName)
    * [.hidden](#ERMrest.Table+hidden)
    * [.columns](#ERMrest.Table+columns)
    * [.keys](#ERMrest.Table+keys)
    * [.annotations](#ERMrest.Table+annotations)
    * [.getFilteredTable(table, fitlers)](#ERMrest.Table+getFilteredTable) ⇒ <code>Object</code>
    * [.getRows()](#ERMrest.Table+getRows) ⇒ <code>Promise</code>
  * [.Column](#ERMrest.Column)
    * [new Column(name, column&#x27;s, whether)](#new_ERMrest.Column_new)
    * [.name](#ERMrest.Column+name)
    * [.displayName](#ERMrest.Column+displayName)
    * [.hidden](#ERMrest.Column+hidden)
  * [.Row](#ERMrest.Row)
    * [new Row(parent, json)](#new_ERMrest.Row_new)
    * [.uri](#ERMrest.Row+uri)
    * [.getRelatedTable(schemaName, tableName)](#ERMrest.Row+getRelatedTable) ⇒ <code>Object</code>
  * [.RelatedTable](#ERMrest.RelatedTable)
    * [new RelatedTable(row, schemaName, tableName)](#new_ERMrest.RelatedTable_new)
  * [.FilteredTable](#ERMrest.FilteredTable)
    * [new FilteredTable(schema, jsonTable)](#new_ERMrest.FilteredTable_new)
    * [.filters](#ERMrest.FilteredTable+filters)
  * [.configure(http, q)](#ERMrest.configure)
  * [.getClient(uri, credentials)](#ERMrest.getClient) ⇒ <code>Client</code>

<a name="ERMrest.Client"></a>
### ERMrest.Client
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Client](#ERMrest.Client)
  * [new Client(uri, credentials)](#new_ERMrest.Client_new)
  * [.uri](#ERMrest.Client+uri)
  * [.getCatalog(id)](#ERMrest.Client+getCatalog)

<a name="new_ERMrest.Client_new"></a>
#### new Client(uri, credentials)
Represents the ERMrest client endpoint. This is completely TBD. There
will be bootstrapping the connection, figuring out what credentials are
even needed, then how to establish those credentials etc. This may not
even be the right place to do this. There may be some other class needed
represent all of that etc.


| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | URI of the client. |
| credentials | <code>Object</code> | TBD credentials object |

<a name="ERMrest.Client+uri"></a>
#### client.uri
The URI of the ERMrest service.

**Kind**: instance property of <code>[Client](#ERMrest.Client)</code>  
<a name="ERMrest.Client+getCatalog"></a>
#### client.getCatalog(id)
Returns an interface to a Catalog object representing the catalog
resource on the service.

**Kind**: instance method of <code>[Client](#ERMrest.Client)</code>  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | Identifier of a catalog within the context of a client connection to an ERMrest service. |

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
| client | <code>Client</code> | The ERMrest.Client connection. |
| id | <code>String</code> | Identifier of a catalog within the context of a service. |

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
**Returns**: <code>Promise</code> - Returns a Promise.  
<a name="ERMrest.Catalog+getSchemas"></a>
#### catalog.getSchemas() ⇒ <code>Object</code>
A synchronous method that returns immediately.

**Kind**: instance method of <code>[Catalog](#ERMrest.Catalog)</code>  
**Returns**: <code>Object</code> - Returns a dictionary of schemas.  
<a name="ERMrest.Schema"></a>
### ERMrest.Schema
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Schema](#ERMrest.Schema)
  * [new Schema(catalog, jsonSchemas)](#new_ERMrest.Schema_new)
  * [.name](#ERMrest.Schema+name)
  * [.getTable(name)](#ERMrest.Schema+getTable)

<a name="new_ERMrest.Schema_new"></a>
#### new Schema(catalog, jsonSchemas)
Constructor for the Schema.


| Param | Type | Description |
| --- | --- | --- |
| catalog | <code>Catalog</code> | The catalog the schema belongs to. |
| jsonSchemas | <code>Object</code> | The raw json Schema returned by ERMrest. |

<a name="ERMrest.Schema+name"></a>
#### schema.name
The name of the schema.

**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+getTable"></a>
#### schema.getTable(name)
Returns a table from the schema.

**Kind**: instance method of <code>[Schema](#ERMrest.Schema)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | The name of the table. |

<a name="ERMrest.Table"></a>
### ERMrest.Table
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Table](#ERMrest.Table)
  * [new Table(schema, jsonTable)](#new_ERMrest.Table_new)
  * [.name](#ERMrest.Table+name)
  * [.displayName](#ERMrest.Table+displayName)
  * [.hidden](#ERMrest.Table+hidden)
  * [.columns](#ERMrest.Table+columns)
  * [.keys](#ERMrest.Table+keys)
  * [.annotations](#ERMrest.Table+annotations)
  * [.getFilteredTable(table, fitlers)](#ERMrest.Table+getFilteredTable) ⇒ <code>Object</code>
  * [.getRows()](#ERMrest.Table+getRows) ⇒ <code>Promise</code>

<a name="new_ERMrest.Table_new"></a>
#### new Table(schema, jsonTable)
Creates an instance of the Table object.


| Param | Type | Description |
| --- | --- | --- |
| schema | <code>Schema</code> | The schema that the table belongs to. |
| jsonTable | <code>Object</code> | The raw json of the table returned by ERMrest. |

<a name="ERMrest.Table+name"></a>
#### table.name
The name of the table.

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
#### table.getFilteredTable(table, fitlers) ⇒ <code>Object</code>
Returns a filtered table based on this table.

**Kind**: instance method of <code>[Table](#ERMrest.Table)</code>  
**Returns**: <code>Object</code> - a filtered table instance.  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>Object</code> | The base table. |
| fitlers | <code>Object</code> | The filters. |

<a name="ERMrest.Table+getRows"></a>
#### table.getRows() ⇒ <code>Promise</code>
An asynchronous method that returns a promise. If fulfilled, it gets the
rows for this table.

**Kind**: instance method of <code>[Table](#ERMrest.Table)</code>  
**Returns**: <code>Promise</code> - Returns a Promise.  
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
Creates an instance of the Table object.


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
<a name="ERMrest.Row"></a>
### ERMrest.Row
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Row](#ERMrest.Row)
  * [new Row(parent, json)](#new_ERMrest.Row_new)
  * [.uri](#ERMrest.Row+uri)
  * [.getRelatedTable(schemaName, tableName)](#ERMrest.Row+getRelatedTable) ⇒ <code>Object</code>

<a name="new_ERMrest.Row_new"></a>
#### new Row(parent, json)
Creates an instance of the Table object.


| Param | Type | Description |
| --- | --- | --- |
| parent | <code>table</code> | table |
| json | <code>rowData</code> | row data |

<a name="ERMrest.Row+uri"></a>
#### row.uri
row uri

**Kind**: instance property of <code>[Row](#ERMrest.Row)</code>  
<a name="ERMrest.Row+getRelatedTable"></a>
#### row.getRelatedTable(schemaName, tableName) ⇒ <code>Object</code>
Returns a related table based on this row.

**Kind**: instance method of <code>[Row](#ERMrest.Row)</code>  
**Returns**: <code>Object</code> - related table instance.  

| Param | Type | Description |
| --- | --- | --- |
| schemaName | <code>String</code> | Schema name. |
| tableName | <code>String</code> | Table name. |

<a name="ERMrest.RelatedTable"></a>
### ERMrest.RelatedTable
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  
<a name="new_ERMrest.RelatedTable_new"></a>
#### new RelatedTable(row, schemaName, tableName)
Creates an instance of the Table object.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>Object</code> | row object. |
| schemaName | <code>String</code> | related schema name. |
| tableName | <code>String</code> | related table name. |

<a name="ERMrest.FilteredTable"></a>
### ERMrest.FilteredTable
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.FilteredTable](#ERMrest.FilteredTable)
  * [new FilteredTable(schema, jsonTable)](#new_ERMrest.FilteredTable_new)
  * [.filters](#ERMrest.FilteredTable+filters)

<a name="new_ERMrest.FilteredTable_new"></a>
#### new FilteredTable(schema, jsonTable)
Creates an instance of the Table object.


| Param | Type | Description |
| --- | --- | --- |
| schema | <code>Schema</code> | The schema that the table belongs to. |
| jsonTable | <code>Object</code> | The raw json of the table returned by ERMrest. |

<a name="ERMrest.FilteredTable+filters"></a>
#### filteredTable.filters
Filters of the filtered table

**Kind**: instance property of <code>[FilteredTable](#ERMrest.FilteredTable)</code>  
<a name="ERMrest.configure"></a>
### ERMrest.configure(http, q)
This function is used to configure the module.
The module expects the http service to implement the
interface defined by the AngularJS 1.x $http service.

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  

| Param | Type | Description |
| --- | --- | --- |
| http | <code>Object</code> | Angular $http service object |
| q | <code>Object</code> | Angular $q service object |

<a name="ERMrest.getClient"></a>
### ERMrest.getClient(uri, credentials) ⇒ <code>Client</code>
ERMrest client factory creates or reuses ERMrest.Client instances. The
URI should be to the ERMrest _service_. For example,
`https://www.example.org/ermrest`.

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  
**Returns**: <code>Client</code> - Returns a new ERMrest.Client instance.  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | URI of the ERMrest service. |
| credentials | <code>Object</code> | Credentials object (TBD) |

