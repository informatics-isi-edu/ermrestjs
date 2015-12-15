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
    * [.lookupCatalog(id)](#ERMrest.Client+lookupCatalog)
  * [.Catalog](#ERMrest.Catalog)
    * [new Catalog(client, id)](#new_ERMrest.Catalog_new)
    * [.id](#ERMrest.Catalog+id)
    * [.getSchemas()](#ERMrest.Catalog+getSchemas) ⇒ <code>Promise</code>
  * [.Schema](#ERMrest.Schema)
    * [new Schema(catalog, name)](#new_ERMrest.Schema_new)
    * [.name](#ERMrest.Schema+name)
    * [.lookupTable(name)](#ERMrest.Schema+lookupTable)
  * [.Table](#ERMrest.Table)
    * [new Table(schema, name)](#new_ERMrest.Table_new)
    * [.name](#ERMrest.Table+name)
    * [.cols](#ERMrest.Table+cols)
    * [.keys](#ERMrest.Table+keys)
    * [.annotations](#ERMrest.Table+annotations)
  * [.configure(http)](#ERMrest.configure)
  * [.createClient(uri, credentials)](#ERMrest.createClient) ⇒ <code>Client</code>

<a name="ERMrest.Client"></a>
### ERMrest.Client
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Client](#ERMrest.Client)
  * [new Client(uri, credentials)](#new_ERMrest.Client_new)
  * [.uri](#ERMrest.Client+uri)
  * [.lookupCatalog(id)](#ERMrest.Client+lookupCatalog)

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
<a name="ERMrest.Client+lookupCatalog"></a>
#### client.lookupCatalog(id)
Returns an interface to a Catalog object representing the catalog
resource on the service.

TBD: should this return immediately, without validating that the
catalog exists on the server?

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
  * [.getSchemas()](#ERMrest.Catalog+getSchemas) ⇒ <code>Promise</code>

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
<a name="ERMrest.Catalog+getSchemas"></a>
#### catalog.getSchemas() ⇒ <code>Promise</code>
An asynchronous method that returns a promise. If fulfilled, 
it gets the schemas of the catalog.

**Kind**: instance method of <code>[Catalog](#ERMrest.Catalog)</code>  
**Returns**: <code>Promise</code> - Returns a Promise.  
<a name="ERMrest.Schema"></a>
### ERMrest.Schema
**Kind**: static class of <code>[ERMrest](#ERMrest)</code>  

* [.Schema](#ERMrest.Schema)
  * [new Schema(catalog, name)](#new_ERMrest.Schema_new)
  * [.name](#ERMrest.Schema+name)
  * [.lookupTable(name)](#ERMrest.Schema+lookupTable)

<a name="new_ERMrest.Schema_new"></a>
#### new Schema(catalog, name)
Constructor for the Schema.


| Param | Type | Description |
| --- | --- | --- |
| catalog | <code>Catalog</code> | The catalog the schema belongs to. |
| name | <code>String</code> | The name of the schema. |

<a name="ERMrest.Schema+name"></a>
#### schema.name
The name of the schema.

**Kind**: instance property of <code>[Schema](#ERMrest.Schema)</code>  
<a name="ERMrest.Schema+lookupTable"></a>
#### schema.lookupTable(name)
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
  * [.keys](#ERMrest.Table+keys)
  * [.annotations](#ERMrest.Table+annotations)

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
<a name="ERMrest.configure"></a>
### ERMrest.configure(http)
This function is used to configure the module.
The module expects the http service to implement the
interface defined by the AngularJS 1.x $http service.

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  

| Param | Type | Description |
| --- | --- | --- |
| http | <code>Object</code> | Angular $http service object |

<a name="ERMrest.createClient"></a>
### ERMrest.createClient(uri, credentials) ⇒ <code>Client</code>
ERMrest client factory creates ERMrest.Client instances.

**Kind**: static method of <code>[ERMrest](#ERMrest)</code>  
**Returns**: <code>Client</code> - Returns a new ERMrest.Client instance.  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | URI of the ERMrest service. |
| credentials | <code>Object</code> | Credentials object (TBD) |

