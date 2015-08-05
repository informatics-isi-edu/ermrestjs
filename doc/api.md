<a name="ERMrest"></a>
## ERMrest : <code>object</code>
The ERMrest module is a JavaScript client library for the ERMrest 
service.

IMPORTANT NOTE: This module is a work in progress.
It is likely to change several times before we have an interface we wish
to use for ERMrest JavaScript agents.

**Kind**: global namespace  

* [ERMrest](#ERMrest) : <code>object</code>
  * [.Service](#ERMrest.Service)
    * [new Service(url, credentials)](#new_ERMrest.Service_new)
    * [.url](#ERMrest.Service+url)
    * [.catalog(id)](#ERMrest.Service+catalog)
  * [.Catalog](#ERMrest.Catalog)
    * [new Catalog(service, id)](#new_ERMrest.Catalog_new)
    * [.id](#ERMrest.Catalog+id)
    * [.props](#ERMrest.Catalog+props)
    * [.model](#ERMrest.Catalog+model)
    * [.get()](#ERMrest.Catalog+get) ⇒ <code>Promise</code>
    * [.remove()](#ERMrest.Catalog+remove) ⇒ <code>Promise</code>
    * [.create()](#ERMrest.Catalog+create) ⇒ <code>Promise</code>
    * [.schema(name)](#ERMrest.Catalog+schema)
  * [.Schema](#ERMrest.Schema)
    * [new Schema(catalog, name)](#new_ERMrest.Schema_new)
    * [.name](#ERMrest.Schema+name)
    * [.tables](#ERMrest.Schema+tables)
    * [.create()](#ERMrest.Schema+create) ⇒ <code>Promise</code>
    * [.remove()](#ERMrest.Schema+remove) ⇒ <code>Promise</code>
    * [.table(name)](#ERMrest.Schema+table)
  * [.Table](#ERMrest.Table)
    * [new Table(schema, name)](#new_ERMrest.Table_new)
    * [.name](#ERMrest.Table+name)
    * [.cols](#ERMrest.Table+cols)
    * [.key](#ERMrest.Table+key)
    * [.annotations](#ERMrest.Table+annotations)
    * [.create()](#ERMrest.Table+create) ⇒ <code>Promise</code>
    * [.remove()](#ERMrest.Table+remove) ⇒ <code>Promise</code>
  * [.service(url, credentials)](#ERMrest.service) ⇒ <code>Service</code>

<a name="ERMrest.Service"></a>
### ERMrest.Service
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Service](#ERMrest.Service)
  * [new Service(url, credentials)](#new_ERMrest.Service_new)
  * [.url](#ERMrest.Service+url)
  * [.catalog(id)](#ERMrest.Service+catalog)

<a name="new_ERMrest.Service_new"></a>
#### new Service(url, credentials)
Represents the ERMrest service endpoint. This is completely TBD. There
will be bootstrapping the connection, figuring out what credentials are
even needed, then how to establish those credentials etc. This may not
even be the right place to do this. There may be some other class needed
represent all of that etc.


| Param | Type | Description |
| --- | --- | --- |
| url | <code>String</code> | URL of the service. |
| credentials | <code>Object</code> | TBD credentials object |

<a name="ERMrest.Service+url"></a>
#### service.url
The URL of the Service.

**Kind**: instance property of <code>[Service](#ERMrest.Service)</code>  
<a name="ERMrest.Service+catalog"></a>
#### service.catalog(id)
Returns an interface to a catalog resource located on this service.
This function returns immediately, and it does not validate that the
catalog exists.

**Kind**: instance method of <code>[Service](#ERMrest.Service)</code>  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | Identifier of a catalog within the context of a service. |

<a name="ERMrest.Catalog"></a>
### ERMrest.Catalog
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Catalog](#ERMrest.Catalog)
  * [new Catalog(service, id)](#new_ERMrest.Catalog_new)
  * [.id](#ERMrest.Catalog+id)
  * [.props](#ERMrest.Catalog+props)
  * [.model](#ERMrest.Catalog+model)
  * [.get()](#ERMrest.Catalog+get) ⇒ <code>Promise</code>
  * [.remove()](#ERMrest.Catalog+remove) ⇒ <code>Promise</code>
  * [.create()](#ERMrest.Catalog+create) ⇒ <code>Promise</code>
  * [.schema(name)](#ERMrest.Catalog+schema)

<a name="new_ERMrest.Catalog_new"></a>
#### new Catalog(service, id)
The hidden constructor for the Catalog. In the object model, it 
represents an ERMrest Catalog.


| Param | Type | Description |
| --- | --- | --- |
| service | <code>Service</code> | The ERMrest.Service this Catalog belongs to. |
| id | <code>String</code> | Identifier of a catalog within the context of a service. |

<a name="ERMrest.Catalog+id"></a>
#### catalog.id
Identifier of the Catalog.

**Kind**: instance property of <code>[Catalog](#ERMrest.Catalog)</code>  
<a name="ERMrest.Catalog+props"></a>
#### catalog.props
Properties of the catalog.

In ERMrest, we currently provide access to these under the "meta" API.
But we've talked of changing that to a different term like "properties"
or "props".

**Kind**: instance property of <code>[Catalog](#ERMrest.Catalog)</code>  
<a name="ERMrest.Catalog+model"></a>
#### catalog.model
The introspected data model of the Catalog or null. TBD This
may be something that looks like a dictionary of Schema objects.

```javascript
  { schema_name: schema_object ...}
```

**Kind**: instance property of <code>[Catalog](#ERMrest.Catalog)</code>  
<a name="ERMrest.Catalog+get"></a>
#### catalog.get() ⇒ <code>Promise</code>
An asynchronous method that returns a promise. If fulfilled, the
Catalog's details will be defined (i.e., it's model and props).

**Kind**: instance method of <code>[Catalog](#ERMrest.Catalog)</code>  
**Returns**: <code>Promise</code> - Returns a Promise.  
<a name="ERMrest.Catalog+remove"></a>
#### catalog.remove() ⇒ <code>Promise</code>
An asynchronous method that returns a promise. If fulfilled, the 
Catalog will be removed **from the Server** and **all data will be
permanently removed**.

**Kind**: instance method of <code>[Catalog](#ERMrest.Catalog)</code>  
**Returns**: <code>Promise</code> - Returns a Promise.  
<a name="ERMrest.Catalog+create"></a>
#### catalog.create() ⇒ <code>Promise</code>
An asynchronous method that returns a promise. If fulfilled, the 
Catalog will be created. TBD: should its state (model, props,...) also
be defined?

**Kind**: instance method of <code>[Catalog](#ERMrest.Catalog)</code>  
**Returns**: <code>Promise</code> - Returns a Promise.  
<a name="ERMrest.Catalog+schema"></a>
#### catalog.schema(name)
Returns a new instance of a Schema object. The Schema may not be
bound to a real resource. The most likely (TBD only?) reason to
use this method is to create an unbound Schema object that can
be used to create a new schema. Clients should get Schema objects
from the Catalog.model.

**Kind**: instance method of <code>[Catalog](#ERMrest.Catalog)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | The name of the schema. |

<a name="ERMrest.Schema"></a>
### ERMrest.Schema
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Schema](#ERMrest.Schema)
  * [new Schema(catalog, name)](#new_ERMrest.Schema_new)
  * [.name](#ERMrest.Schema+name)
  * [.tables](#ERMrest.Schema+tables)
  * [.create()](#ERMrest.Schema+create) ⇒ <code>Promise</code>
  * [.remove()](#ERMrest.Schema+remove) ⇒ <code>Promise</code>
  * [.table(name)](#ERMrest.Schema+table)

<a name="new_ERMrest.Schema_new"></a>
#### new Schema(catalog, name)
Creates an instance of the Schema object.


| Param | Type | Description |
| --- | --- | --- |
| catalog | <code>Catalog</code> | The catalog the schema belongs to. |
| name | <code>String</code> | The name of the schema. |

<a name="ERMrest.Schema+name"></a>
#### schema.name
The name of the schema.

**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+tables"></a>
#### schema.tables
TBD, likely something that looks like a dictionary.

```javascript
  { table_name: table_object ...}
```

**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+create"></a>
#### schema.create() ⇒ <code>Promise</code>
Asynchronous function that attempts to create a new Schema.

**Kind**: instance method of <code>[Schema](#ERMrest.Schema)</code>  
**Returns**: <code>Promise</code> - Returns a Promise.  
<a name="ERMrest.Schema+remove"></a>
#### schema.remove() ⇒ <code>Promise</code>
Asynchronous function that attempts to remove a Schema from the Catalog.
IMPORTANT: If successful, the Schema and **all** data in it will be 
removed from the Catalog.

**Kind**: instance method of <code>[Schema](#ERMrest.Schema)</code>  
**Returns**: <code>Promise</code> - Returns a Promise.  
<a name="ERMrest.Schema+table"></a>
#### schema.table(name)
Returns a new instance of a Table object. The Table may not be
bound to a real resource. The most likely (TBD only?) reason to
use this method is to create an unbound Table object that can
be used to create a new table. Clients should get Table objects
from the Catalog.model.

**Kind**: instance method of <code>[Schema](#ERMrest.Schema)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | The name of the table. |

<a name="ERMrest.Table"></a>
### ERMrest.Table
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Table](#ERMrest.Table)
  * [new Table(schema, name)](#new_ERMrest.Table_new)
  * [.name](#ERMrest.Table+name)
  * [.cols](#ERMrest.Table+cols)
  * [.key](#ERMrest.Table+key)
  * [.annotations](#ERMrest.Table+annotations)
  * [.create()](#ERMrest.Table+create) ⇒ <code>Promise</code>
  * [.remove()](#ERMrest.Table+remove) ⇒ <code>Promise</code>

<a name="new_ERMrest.Table_new"></a>
#### new Table(schema, name)
Creates an instance of the Table object.


| Param | Type | Description |
| --- | --- | --- |
| schema | <code>Schema</code> | The schema that the table belongs to. |
| name | <code>String</code> | The name of the table. |

<a name="ERMrest.Table+name"></a>
#### table.name
The name of the table.

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+cols"></a>
#### table.cols
TBD, likely something that looks like a dictionary.

```javascript
  { column_name: column_object ...}
```

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+key"></a>
#### table.key
an ordered list of columns (or column names?) that make up the key.

```javascript
  [ column+ ]
```

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+annotations"></a>
#### table.annotations
a list or dictionary of annotation objects

**Kind**: instance property of <code>[Table](#ERMrest.Table)</code>  
<a name="ERMrest.Table+create"></a>
#### table.create() ⇒ <code>Promise</code>
Asynchronous function that attempts to create a new Table.

**Kind**: instance method of <code>[Table](#ERMrest.Table)</code>  
**Returns**: <code>Promise</code> - Returns a Promise.  
<a name="ERMrest.Table+remove"></a>
#### table.remove() ⇒ <code>Promise</code>
Asynchronous function that attempts to remove a Table from the Catalog.
IMPORTANT: If successful, the Table and **all** data in it will be 
removed from the Catalog.

**Kind**: instance method of <code>[Table](#ERMrest.Table)</code>  
**Returns**: <code>Promise</code> - Returns a Promise.  
<a name="ERMrest.service"></a>
### ERMrest.service(url, credentials) ⇒ <code>Service</code>
See Catalog.Service.

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  
**Returns**: <code>Service</code> - Returns a new Catalog.Service instance.  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>Service</code> | URL of the service. |
| credentials | <code>Object</code> | TBD credentials object |

