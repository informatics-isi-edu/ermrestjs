## Objects

<dl>
<dt><a href="#ERMrest">ERMrest</a> : <code>object</code></dt>
<dd><p>The ERMrest module is a JavaScript client library for the ERMrest
service. Most clients should begin with <a href="#ERMrest.resolve">resolve</a>.</p>
<p>IMPORTANT NOTE: This module is a work in progress.
It is likely to change several times before we have an interface we wish
to use for ERMrest JavaScript agents.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#httpUnauthorizedFn">httpUnauthorizedFn</a> : <code>function</code></dt>
<dd><p>set callback function which will be called when a HTTP 401 Error occurs</p>
</dd>
<dt><a href="#appLinkFn">appLinkFn</a> : <code>function</code></dt>
<dd><p>set callback function that converts app tag to app URL</p>
</dd>
<dt><a href="#onHTTPSuccess">onHTTPSuccess</a> : <code>function</code></dt>
<dd><p>set callback function that triggers when a request returns with success</p>
</dd>
<dt><a href="#onError">onError</a> ⇒ <code>Promise</code></dt>
<dd><p>Calculates  MD5 checksum for a file using spark-md5 library</p>
</dd>
</dl>

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
        * [.catalogs](#ERMrest.Server+catalogs) : [<code>Catalogs</code>](#ERMrest.Catalogs)
    * [.Catalogs](#ERMrest.Catalogs)
        * [new Catalogs(server)](#new_ERMrest.Catalogs_new)
        * [.length()](#ERMrest.Catalogs+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Catalogs+names) ⇒ <code>Array</code>
        * [.get(id)](#ERMrest.Catalogs+get) ⇒ <code>Promise</code>
    * [.Catalog](#ERMrest.Catalog)
        * [new Catalog(server, id)](#new_ERMrest.Catalog_new)
        * [.id](#ERMrest.Catalog+id) : <code>string</code>
        * [.schemas](#ERMrest.Catalog+schemas) : [<code>Schemas</code>](#ERMrest.Schemas)
        * [.constraintByNamePair(pair, subject)](#ERMrest.Catalog+constraintByNamePair) ⇒ <code>Object</code> \| <code>null</code>
        * [.getTable(tableName, schemaName)](#ERMrest.Catalog+getTable) ⇒ [<code>Table</code>](#ERMrest.Table)
    * [.Schemas](#ERMrest.Schemas)
        * [new Schemas()](#new_ERMrest.Schemas_new)
        * [.length()](#ERMrest.Schemas+length) ⇒ <code>Number</code>
        * [.all()](#ERMrest.Schemas+all) ⇒ <code>Array</code>
        * [.names()](#ERMrest.Schemas+names) ⇒ <code>Array</code>
        * [.get(name)](#ERMrest.Schemas+get) ⇒ [<code>Schema</code>](#ERMrest.Schema)
        * [.has(name)](#ERMrest.Schemas+has) ⇒ <code>boolean</code>
        * [.findTable(tableName, [schemaName])](#ERMrest.Schemas+findTable) ⇒ [<code>Table</code>](#ERMrest.Table)
    * [.Schema](#ERMrest.Schema)
        * [new Schema(catalog, jsonSchema)](#new_ERMrest.Schema_new)
        * [.catalog](#ERMrest.Schema+catalog) : [<code>Catalog</code>](#ERMrest.Catalog)
        * [.name](#ERMrest.Schema+name)
        * [.ignore](#ERMrest.Schema+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.Schema+annotations) : [<code>Annotations</code>](#ERMrest.Annotations)
        * [.rights](#ERMrest.Schema+rights) : <code>Object</code>
        * [.displayname](#ERMrest.Schema+displayname) : <code>object</code>
        * [.tables](#ERMrest.Schema+tables) : [<code>Tables</code>](#ERMrest.Tables)
        * [.comment](#ERMrest.Schema+comment) : <code>string</code>
    * [.Tables](#ERMrest.Tables)
        * [new Tables()](#new_ERMrest.Tables_new)
        * [.all()](#ERMrest.Tables+all) ⇒ <code>Array</code>
        * [.length()](#ERMrest.Tables+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Tables+names) ⇒ <code>Array</code>
        * [.get(name)](#ERMrest.Tables+get) ⇒ [<code>Table</code>](#ERMrest.Table)
    * [.Table](#ERMrest.Table)
        * [new Table(schema, jsonTable)](#new_ERMrest.Table_new)
        * _instance_
            * [.schema](#ERMrest.Table+schema) : [<code>Schema</code>](#ERMrest.Schema)
            * [.name](#ERMrest.Table+name)
            * [.entity](#ERMrest.Table+entity) : [<code>Entity</code>](#ERMrest.Table.Entity)
            * [.ignore](#ERMrest.Table+ignore) : <code>boolean</code>
            * [._baseTable](#ERMrest.Table+_baseTable) : [<code>Table</code>](#ERMrest.Table)
            * [.annotations](#ERMrest.Table+annotations) : [<code>Annotations</code>](#ERMrest.Annotations)
            * [.displayname](#ERMrest.Table+displayname) : <code>object</code>
            * [.columns](#ERMrest.Table+columns) : [<code>Columns</code>](#ERMrest.Columns)
            * [.keys](#ERMrest.Table+keys) : [<code>Keys</code>](#ERMrest.Keys)
            * [.rights](#ERMrest.Table+rights) : <code>Object</code>
            * [.foreignKeys](#ERMrest.Table+foreignKeys) : [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)
            * [.referredBy](#ERMrest.Table+referredBy) : [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)
            * [.comment](#ERMrest.Table+comment) : <code>string</code>
            * [.kind](#ERMrest.Table+kind) : <code>string</code>
            * [.shortestKey](#ERMrest.Table+shortestKey)
            * [.displayKey](#ERMrest.Table+displayKey) : [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column)
            * [.uri](#ERMrest.Table+uri) : <code>string</code>
            * [._getRowDisplayKey(context)](#ERMrest.Table+_getRowDisplayKey)
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
        * [.get(name)](#ERMrest.Columns+get) ⇒ [<code>Column</code>](#ERMrest.Column)
        * [.getByPosition(pos)](#ERMrest.Columns+getByPosition) ⇒ [<code>Column</code>](#ERMrest.Column)
    * [.Column](#ERMrest.Column)
        * [new Column(table, jsonColumn)](#new_ERMrest.Column_new)
        * [.position](#ERMrest.Column+position) : <code>number</code>
        * [.table](#ERMrest.Column+table) : [<code>Table</code>](#ERMrest.Table)
        * [.rights](#ERMrest.Column+rights) : <code>Object</code>
        * [.isHidden](#ERMrest.Column+isHidden) : <code>Boolean</code>
        * [.isGenerated](#ERMrest.Column+isGenerated) : <code>Boolean</code>
        * [.isSystemColumn](#ERMrest.Column+isSystemColumn) : <code>Boolean</code>
        * [.isImmutable](#ERMrest.Column+isImmutable) : <code>Boolean</code>
        * [.name](#ERMrest.Column+name) : <code>string</code>
        * [.type](#ERMrest.Column+type) : [<code>Type</code>](#ERMrest.Type)
        * [.nullok](#ERMrest.Column+nullok) : <code>Boolean</code>
        * [.comment](#ERMrest.Column+comment) : <code>string</code>
        * [.ignore](#ERMrest.Column+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.Column+annotations) : [<code>Annotations</code>](#ERMrest.Annotations)
        * [.displayname](#ERMrest.Column+displayname) : <code>object</code>
        * [.memberOfKeys](#ERMrest.Column+memberOfKeys) : [<code>Array.&lt;Key&gt;</code>](#ERMrest.Key)
        * [.memberOfForeignKeys](#ERMrest.Column+memberOfForeignKeys) : [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
        * [.default](#ERMrest.Column+default) ⇒ <code>string</code>
        * [.formatvalue(data, context)](#ERMrest.Column+formatvalue) ⇒ <code>string</code>
        * [.formatPresentation(data, context, options)](#ERMrest.Column+formatPresentation) ⇒ <code>Object</code>
        * [.toString()](#ERMrest.Column+toString) ⇒ <code>string</code>
        * [.getDisplay(context)](#ERMrest.Column+getDisplay)
    * [.Annotations](#ERMrest.Annotations)
        * [new Annotations()](#new_ERMrest.Annotations_new)
        * [.all()](#ERMrest.Annotations+all) ⇒ [<code>Array.&lt;Annotation&gt;</code>](#ERMrest.Annotation)
        * [.length()](#ERMrest.Annotations+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Annotations+names) ⇒ <code>Array</code>
        * [.get(uri)](#ERMrest.Annotations+get) ⇒ [<code>Annotation</code>](#ERMrest.Annotation)
        * [.contains(uri)](#ERMrest.Annotations+contains) ⇒ <code>boolean</code>
    * [.Annotation](#ERMrest.Annotation)
        * [new Annotation(subject, uri, jsonAnnotation)](#new_ERMrest.Annotation_new)
        * [.subject](#ERMrest.Annotation+subject) : <code>string</code>
        * [.content](#ERMrest.Annotation+content) : <code>string</code>
    * [.Keys](#ERMrest.Keys)
        * [new Keys()](#new_ERMrest.Keys_new)
        * [.all()](#ERMrest.Keys+all) ⇒ <code>Array.&lt;Key&gt;</code>
        * [.length()](#ERMrest.Keys+length) ⇒ <code>Number</code>
        * [.colsets()](#ERMrest.Keys+colsets) ⇒ [<code>Array.&lt;ColSet&gt;</code>](#ERMrest.ColSet)
        * [.get(colset)](#ERMrest.Keys+get) ⇒ [<code>Key</code>](#ERMrest.Key)
    * [.Key](#ERMrest.Key)
        * [new Key(table, jsonKey)](#new_ERMrest.Key_new)
        * [.table](#ERMrest.Key+table) : <code>Table</code>
        * [.colset](#ERMrest.Key+colset) : [<code>ColSet</code>](#ERMrest.ColSet)
        * [.annotations](#ERMrest.Key+annotations) : [<code>Annotations</code>](#ERMrest.Annotations)
        * [.comment](#ERMrest.Key+comment) : <code>string</code>
        * [.constraint_names](#ERMrest.Key+constraint_names) : <code>Array</code>
        * [.name](#ERMrest.Key+name) : <code>string</code>
        * [.simple](#ERMrest.Key+simple) : <code>boolean</code>
        * [.containsColumn(column)](#ERMrest.Key+containsColumn) ⇒ <code>boolean</code>
    * [.ColSet](#ERMrest.ColSet)
        * [new ColSet(columns)](#new_ERMrest.ColSet_new)
        * [.columns](#ERMrest.ColSet+columns) : <code>Array</code>
        * [.toString()](#ERMrest.ColSet+toString) ⇒ <code>string</code>
        * [.length()](#ERMrest.ColSet+length) ⇒ <code>Number</code>
    * [.Mapping](#ERMrest.Mapping)
        * [new Mapping(from, to)](#new_ERMrest.Mapping_new)
        * [.toString()](#ERMrest.Mapping+toString) ⇒ <code>string</code>
        * [.length()](#ERMrest.Mapping+length) ⇒ <code>Number</code>
        * [.domain()](#ERMrest.Mapping+domain) ⇒ [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column)
        * [.get(fromCol)](#ERMrest.Mapping+get) ⇒ [<code>Column</code>](#ERMrest.Column)
        * [.getFromColumn(toCol)](#ERMrest.Mapping+getFromColumn) ⇒ [<code>Column</code>](#ERMrest.Column)
    * [.InboundForeignKeys](#ERMrest.InboundForeignKeys)
        * [new InboundForeignKeys(table)](#new_ERMrest.InboundForeignKeys_new)
    * [.ForeignKeys](#ERMrest.ForeignKeys)
        * [.all()](#ERMrest.ForeignKeys+all) ⇒ [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
        * [.colsets()](#ERMrest.ForeignKeys+colsets) ⇒ [<code>Array.&lt;ColSet&gt;</code>](#ERMrest.ColSet)
        * [.length()](#ERMrest.ForeignKeys+length) ⇒ <code>Number</code>
        * [.mappings()](#ERMrest.ForeignKeys+mappings) ⇒ [<code>Array.&lt;Mapping&gt;</code>](#ERMrest.Mapping)
        * [.get(colset)](#ERMrest.ForeignKeys+get) ⇒ [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
    * [.ForeignKeyRef](#ERMrest.ForeignKeyRef)
        * [new ForeignKeyRef(table, jsonFKR)](#new_ERMrest.ForeignKeyRef_new)
        * [.colset](#ERMrest.ForeignKeyRef+colset) : [<code>ColSet</code>](#ERMrest.ColSet)
        * [.key](#ERMrest.ForeignKeyRef+key) : [<code>Key</code>](#ERMrest.Key)
        * [.rights](#ERMrest.ForeignKeyRef+rights) : <code>Object</code>
        * [.mapping](#ERMrest.ForeignKeyRef+mapping) : [<code>Mapping</code>](#ERMrest.Mapping)
        * [.constraint_names](#ERMrest.ForeignKeyRef+constraint_names) : <code>Array</code>
        * [.from_name](#ERMrest.ForeignKeyRef+from_name) : <code>string</code>
        * [.to_name](#ERMrest.ForeignKeyRef+to_name) : <code>string</code>
        * [.ignore](#ERMrest.ForeignKeyRef+ignore) : <code>boolean</code>
        * [.annotations](#ERMrest.ForeignKeyRef+annotations) : [<code>Annotations</code>](#ERMrest.Annotations)
        * [.comment](#ERMrest.ForeignKeyRef+comment) : <code>string</code>
        * [.name](#ERMrest.ForeignKeyRef+name) : <code>string</code>
        * [.simple](#ERMrest.ForeignKeyRef+simple) : <code>Boolean</code>
        * [.toString(reverse, isLeft)](#ERMrest.ForeignKeyRef+toString) ⇒ <code>string</code>
        * [.getDomainValues(limit)](#ERMrest.ForeignKeyRef+getDomainValues) ⇒ <code>Promise</code>
    * [.Type](#ERMrest.Type)
        * [new Type(name)](#new_ERMrest.Type_new)
        * [.name](#ERMrest.Type+name) : <code>string</code>
        * [._isArray](#ERMrest.Type+_isArray) : <code>boolean</code>
        * [._isDomain](#ERMrest.Type+_isDomain) : <code>boolean</code>
        * [.baseType](#ERMrest.Type+baseType) : [<code>Type</code>](#ERMrest.Type)
        * [.rootName](#ERMrest.Type+rootName) : <code>string</code>
    * [.ERMrestError](#ERMrest.ERMrestError)
        * [new ERMrestError(code, status, message, subMessage, redirectPath)](#new_ERMrest.ERMrestError_new)
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
        * [new ConflictError(status, message, subMessage)](#new_ERMrest.ConflictError_new)
    * [.IntegrityConflictError](#ERMrest.IntegrityConflictError)
        * [new IntegrityConflictError(status, message, subMessage)](#new_ERMrest.IntegrityConflictError_new)
    * [.DuplicateConflictError](#ERMrest.DuplicateConflictError)
        * [new DuplicateConflictError(status, message, subMessage)](#new_ERMrest.DuplicateConflictError_new)
    * [.PreconditionFailedError](#ERMrest.PreconditionFailedError)
        * [new PreconditionFailedError(status, message)](#new_ERMrest.PreconditionFailedError_new)
    * [.InternalServerError](#ERMrest.InternalServerError)
        * [new InternalServerError(status, message)](#new_ERMrest.InternalServerError_new)
    * [.ServiceUnavailableError](#ERMrest.ServiceUnavailableError)
        * [new ServiceUnavailableError(status, message)](#new_ERMrest.ServiceUnavailableError_new)
    * [.InvalidFacetOperatorError](#ERMrest.InvalidFacetOperatorError)
        * [new InvalidFacetOperatorError(message, path)](#new_ERMrest.InvalidFacetOperatorError_new)
    * [.InvalidFilterOperatorError](#ERMrest.InvalidFilterOperatorError)
        * [new InvalidFilterOperatorError(message, path, invalidFilter)](#new_ERMrest.InvalidFilterOperatorError_new)
    * [.InvalidInputError](#ERMrest.InvalidInputError)
        * [new InvalidInputError(message)](#new_ERMrest.InvalidInputError_new)
    * [.MalformedURIError](#ERMrest.MalformedURIError)
        * [new MalformedURIError(message)](#new_ERMrest.MalformedURIError_new)
    * [.NoDataChangedError](#ERMrest.NoDataChangedError)
        * [new NoDataChangedError(message)](#new_ERMrest.NoDataChangedError_new)
    * [.NoConnectionError](#ERMrest.NoConnectionError)
        * [new NoConnectionError(message)](#new_ERMrest.NoConnectionError_new)
    * [.InvalidSortCriteria](#ERMrest.InvalidSortCriteria)
        * [new InvalidSortCriteria(message, path)](#new_ERMrest.InvalidSortCriteria_new)
    * [.InvalidPageCriteria](#ERMrest.InvalidPageCriteria)
        * [new InvalidPageCriteria(message, path)](#new_ERMrest.InvalidPageCriteria_new)
    * [.ParsedFilter](#ERMrest.ParsedFilter)
        * [new ParsedFilter(type)](#new_ERMrest.ParsedFilter_new)
        * [.setFilters(filters)](#ERMrest.ParsedFilter+setFilters)
        * [.setBinaryPredicate(colname, operator, value)](#ERMrest.ParsedFilter+setBinaryPredicate)
    * [.Reference](#ERMrest.Reference)
        * [new Reference(location, catalog)](#new_ERMrest.Reference_new)
        * [.contextualize](#ERMrest.Reference+contextualize)
        * [.aggregate](#ERMrest.Reference+aggregate) : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
        * [.displayname](#ERMrest.Reference+displayname) : <code>object</code>
        * [.uri](#ERMrest.Reference+uri) : <code>string</code>
        * [.table](#ERMrest.Reference+table) : [<code>Table</code>](#ERMrest.Table)
        * [.projectionTable](#ERMrest.Reference+projectionTable) : [<code>Table</code>](#ERMrest.Table)
        * [.columns](#ERMrest.Reference+columns) : [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)
        * [.facetColumns](#ERMrest.Reference+facetColumns) ⇒ [<code>Array.&lt;FacetColumn&gt;</code>](#ERMrest.FacetColumn)
        * [.location](#ERMrest.Reference+location) ⇒ <code>ERMrest.Location</code>
        * [.isUnique](#ERMrest.Reference+isUnique) : <code>boolean</code>
        * [.canCreate](#ERMrest.Reference+canCreate) : <code>boolean</code> \| <code>undefined</code>
        * [.canRead](#ERMrest.Reference+canRead) : <code>boolean</code> \| <code>undefined</code>
        * [.canUpdate](#ERMrest.Reference+canUpdate) : <code>boolean</code> \| <code>undefined</code>
        * [.canDelete](#ERMrest.Reference+canDelete) : <code>boolean</code> \| <code>undefined</code>
        * [.display](#ERMrest.Reference+display) : <code>Object</code>
        * [.unfilteredReference](#ERMrest.Reference+unfilteredReference) : [<code>Reference</code>](#ERMrest.Reference)
        * [.appLink](#ERMrest.Reference+appLink) : <code>String</code>
        * [.csvDownloadLink](#ERMrest.Reference+csvDownloadLink) ⇒ <code>String</code>
        * [.defaultLogInfo](#ERMrest.Reference+defaultLogInfo) : <code>Object</code>
        * [.removeAllFacetFilters(sameFacet)](#ERMrest.Reference+removeAllFacetFilters) ⇒ <code>ERMrest.reference</code>
        * [.create(data, contextHeaderParams)](#ERMrest.Reference+create) ⇒ <code>Promise</code>
            * [~columnDiff()](#ERMrest.Reference+create..columnDiff)
        * [.read(limit, contextHeaderParams)](#ERMrest.Reference+read) ⇒ <code>Promise</code>
        * [.sort(sort)](#ERMrest.Reference+sort) ⇒ <code>Reference</code>
        * [.update(tuples, contextHeaderParams)](#ERMrest.Reference+update) ⇒ <code>Promise</code>
        * [.delete(contextHeaderParams)](#ERMrest.Reference+delete) ⇒ <code>Promise</code>
            * [~self](#ERMrest.Reference+delete..self)
        * [.related([tuple])](#ERMrest.Reference+related) ⇒ [<code>Array.&lt;Reference&gt;</code>](#ERMrest.Reference)
        * [.search(term)](#ERMrest.Reference+search) ⇒ <code>Reference</code>
        * [.getAggregates(aggregateList)](#ERMrest.Reference+getAggregates) ⇒ <code>Promise</code>
        * [.setSamePaging(page)](#ERMrest.Reference+setSamePaging) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.getColumnByName(name)](#ERMrest.Reference+getColumnByName) ⇒ [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)
        * [.generateColumnsList(tuple)](#ERMrest.Reference+generateColumnsList) ⇒ [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)
    * [.Page](#ERMrest.Page)
        * [new Page(reference, etag, data, hasPrevious, hasNext, extraData)](#new_ERMrest.Page_new)
        * [.reference](#ERMrest.Page+reference) : [<code>Reference</code>](#ERMrest.Reference)
        * [.tuples](#ERMrest.Page+tuples) : [<code>Array.&lt;Tuple&gt;</code>](#ERMrest.Tuple)
        * [.hasPrevious](#ERMrest.Page+hasPrevious) ⇒ <code>boolean</code>
        * [.previous](#ERMrest.Page+previous) : [<code>Reference</code>](#ERMrest.Reference) \| <code>undefined</code>
        * [.hasNext](#ERMrest.Page+hasNext) ⇒ <code>boolean</code>
        * [.next](#ERMrest.Page+next) : [<code>Reference</code>](#ERMrest.Reference) \| <code>undefined</code>
        * [.content](#ERMrest.Page+content) : <code>string</code> \| <code>null</code>
    * [.Tuple](#ERMrest.Tuple)
        * [new Tuple(reference, page, data)](#new_ERMrest.Tuple_new)
        * [.reference](#ERMrest.Tuple+reference) ⇒ [<code>Reference</code>](#ERMrest.Reference) \| <code>\*</code>
        * [.page](#ERMrest.Tuple+page) ⇒ [<code>Page</code>](#ERMrest.Page) \| <code>\*</code>
        * [.linkedData](#ERMrest.Tuple+linkedData) : <code>Object</code>
        * [.data](#ERMrest.Tuple+data) : <code>Object</code>
        * [.data](#ERMrest.Tuple+data)
        * [.canUpdate](#ERMrest.Tuple+canUpdate) : <code>boolean</code> \| <code>undefined</code>
        * [.canDelete](#ERMrest.Tuple+canDelete) : <code>boolean</code> \| <code>undefined</code>
        * [.values](#ERMrest.Tuple+values) : <code>Array.&lt;string&gt;</code>
        * [.isHTML](#ERMrest.Tuple+isHTML) : <code>Array.&lt;boolean&gt;</code>
        * [.displayname](#ERMrest.Tuple+displayname) : <code>string</code>
        * [.uniqueId](#ERMrest.Tuple+uniqueId) : <code>string</code>
        * [.update()](#ERMrest.Tuple+update) ⇒ <code>Promise</code>
        * [.delete()](#ERMrest.Tuple+delete) ⇒ <code>Promise</code>
        * [.getAssociationRef()](#ERMrest.Tuple+getAssociationRef) : [<code>Reference</code>](#ERMrest.Reference)
        * [.copy()](#ERMrest.Tuple+copy) ⇒ [<code>Tuple</code>](#ERMrest.Tuple)
    * [.ReferenceAggregateFn](#ERMrest.ReferenceAggregateFn)
        * [new ReferenceAggregateFn()](#new_ERMrest.ReferenceAggregateFn_new)
        * [.countAgg](#ERMrest.ReferenceAggregateFn+countAgg) : <code>Object</code>
    * [.ReferenceColumn](#ERMrest.ReferenceColumn)
        * [new ReferenceColumn(reference, baseCols)](#new_ERMrest.ReferenceColumn_new)
        * [.isPseudo](#ERMrest.ReferenceColumn+isPseudo) : <code>boolean</code>
        * [.table](#ERMrest.ReferenceColumn+table) : [<code>Table</code>](#ERMrest.Table)
        * [.name](#ERMrest.ReferenceColumn+name) : <code>string</code>
        * [.displayname](#ERMrest.ReferenceColumn+displayname) : <code>object</code>
        * [.type](#ERMrest.ReferenceColumn+type) : [<code>Type</code>](#ERMrest.Type)
        * [.nullok](#ERMrest.ReferenceColumn+nullok) : <code>Boolean</code>
        * [.default](#ERMrest.ReferenceColumn+default) : <code>string</code>
        * [.aggregate](#ERMrest.ReferenceColumn+aggregate) : [<code>ColumnAggregateFn</code>](#ERMrest.ColumnAggregateFn)
        * [.groupAggregate](#ERMrest.ReferenceColumn+groupAggregate) : [<code>ColumnGroupAggregateFn</code>](#ERMrest.ColumnGroupAggregateFn)
        * [.comment](#ERMrest.ReferenceColumn+comment) : <code>string</code>
        * [.inputDisabled](#ERMrest.ReferenceColumn+inputDisabled) : <code>boolean</code> \| <code>object</code>
        * [.sortable](#ERMrest.ReferenceColumn+sortable) : <code>boolean</code>
        * [.formatvalue(data, context)](#ERMrest.ReferenceColumn+formatvalue) ⇒ <code>string</code>
        * [.formatPresentation(data, context, options)](#ERMrest.ReferenceColumn+formatPresentation) ⇒ <code>Object</code>
        * [.getInputDisabled()](#ERMrest.ReferenceColumn+getInputDisabled) : <code>boolean</code> \| <code>object</code>
    * [.PseudoColumn](#ERMrest.PseudoColumn)
        * [new PseudoColumn(reference, column, facetObject, name, mainTuple)](#new_ERMrest.PseudoColumn_new)
        * [.isPseudo](#ERMrest.PseudoColumn+isPseudo) : <code>boolean</code>
        * [.displayname](#ERMrest.PseudoColumn+displayname) : <code>Object</code>
        * [.isUnique](#ERMrest.PseudoColumn+isUnique) : <code>boolean</code>
        * [.isEntityMode](#ERMrest.PseudoColumn+isEntityMode) : <code>boolean</code>
        * [.key](#ERMrest.PseudoColumn+key) : <code>boolean</code>
        * [.hasPath](#ERMrest.PseudoColumn+hasPath) : <code>boolean</code>
        * [.foreignKeys](#ERMrest.PseudoColumn+foreignKeys) : [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
        * [.hasAggregate](#ERMrest.PseudoColumn+hasAggregate) : <code>boolean</code>
        * [.reference](#ERMrest.PseudoColumn+reference) : [<code>Reference</code>](#ERMrest.Reference)
        * [.formatPresentation(data, context, options)](#ERMrest.PseudoColumn+formatPresentation) ⇒ <code>Object</code>
        * [.getAggregatedValue(page, contextHeaderParams)](#ERMrest.PseudoColumn+getAggregatedValue) ⇒ <code>Promise</code>
    * [.ForeignKeyPseudoColumn](#ERMrest.ForeignKeyPseudoColumn)
        * [new ForeignKeyPseudoColumn(reference, fk)](#new_ERMrest.ForeignKeyPseudoColumn_new)
        * [.isPseudo](#ERMrest.ForeignKeyPseudoColumn+isPseudo) : <code>boolean</code>
        * [.isForeignKey](#ERMrest.ForeignKeyPseudoColumn+isForeignKey) : <code>boolean</code>
        * [.reference](#ERMrest.ForeignKeyPseudoColumn+reference) : [<code>Reference</code>](#ERMrest.Reference)
        * [.foreignKey](#ERMrest.ForeignKeyPseudoColumn+foreignKey) : [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)
        * [.defaultValues](#ERMrest.ForeignKeyPseudoColumn+defaultValues) : <code>Object</code>
        * [.defaultReference](#ERMrest.ForeignKeyPseudoColumn+defaultReference) : <code>ERMrest.Refernece</code>
        * [.filteredRef(column, data)](#ERMrest.ForeignKeyPseudoColumn+filteredRef) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.KeyPseudoColumn](#ERMrest.KeyPseudoColumn)
        * [new KeyPseudoColumn(reference, key)](#new_ERMrest.KeyPseudoColumn_new)
        * [.isPseudo](#ERMrest.KeyPseudoColumn+isPseudo) : <code>boolean</code>
        * [.isKey](#ERMrest.KeyPseudoColumn+isKey) : <code>boolean</code>
        * [.key](#ERMrest.KeyPseudoColumn+key) : [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)
        * [.formatPresentation(data, context, options)](#ERMrest.KeyPseudoColumn+formatPresentation) ⇒ <code>Object</code>
    * [.AssetPseudoColumn](#ERMrest.AssetPseudoColumn)
        * [new AssetPseudoColumn(reference, column)](#new_ERMrest.AssetPseudoColumn_new)
        * [.isPseudo](#ERMrest.AssetPseudoColumn+isPseudo) : <code>boolean</code>
        * [.isAsset](#ERMrest.AssetPseudoColumn+isAsset) : <code>boolean</code>
        * [.urlPattern](#ERMrest.AssetPseudoColumn+urlPattern) : <code>ERMrest.Refernece</code>
        * [.filenameColumn](#ERMrest.AssetPseudoColumn+filenameColumn) : [<code>Column</code>](#ERMrest.Column)
        * [.filenameColumn](#ERMrest.AssetPseudoColumn+filenameColumn) : [<code>Column</code>](#ERMrest.Column)
        * [.md5](#ERMrest.AssetPseudoColumn+md5) : [<code>Column</code>](#ERMrest.Column)
        * [.sha256](#ERMrest.AssetPseudoColumn+sha256) : [<code>Column</code>](#ERMrest.Column)
        * [.filenameExtFilter](#ERMrest.AssetPseudoColumn+filenameExtFilter) : [<code>Column</code>](#ERMrest.Column)
        * [._determineInputDisabled(context)](#ERMrest.AssetPseudoColumn+_determineInputDisabled) ⇒ <code>boolean</code> \| <code>object</code>
    * [.InboundForeignKeyPseudoColumn](#ERMrest.InboundForeignKeyPseudoColumn)
        * [new InboundForeignKeyPseudoColumn(reference, fk)](#new_ERMrest.InboundForeignKeyPseudoColumn_new)
        * [.reference](#ERMrest.InboundForeignKeyPseudoColumn+reference) : [<code>Reference</code>](#ERMrest.Reference)
        * [.table](#ERMrest.InboundForeignKeyPseudoColumn+table) : [<code>Table</code>](#ERMrest.Table)
        * [.foreignKey](#ERMrest.InboundForeignKeyPseudoColumn+foreignKey) : [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)
        * [.isPseudo](#ERMrest.InboundForeignKeyPseudoColumn+isPseudo) : <code>boolean</code>
        * [.isInboundForeignKey](#ERMrest.InboundForeignKeyPseudoColumn+isInboundForeignKey) : <code>boolean</code>
    * [.FacetColumn](#ERMrest.FacetColumn)
        * [new FacetColumn(reference, index, column, facetObject, filters)](#new_ERMrest.FacetColumn_new)
        * [._column](#ERMrest.FacetColumn+_column) : [<code>Column</code>](#ERMrest.Column)
        * [.reference](#ERMrest.FacetColumn+reference) : [<code>Reference</code>](#ERMrest.Reference)
        * [.index](#ERMrest.FacetColumn+index) : <code>int</code>
        * [.dataSource](#ERMrest.FacetColumn+dataSource) : <code>obj</code> \| <code>string</code>
        * [.filters](#ERMrest.FacetColumn+filters)
        * [.isOpen](#ERMrest.FacetColumn+isOpen) : <code>Boolean</code>
        * [.preferredMode](#ERMrest.FacetColumn+preferredMode) : <code>string</code>
        * [.isEntityMode](#ERMrest.FacetColumn+isEntityMode) : <code>Boolean</code>
        * [.barPlot](#ERMrest.FacetColumn+barPlot) : <code>Boolean</code>
        * [.histogramBucketCount](#ERMrest.FacetColumn+histogramBucketCount) : <code>Integer</code>
        * [.column](#ERMrest.FacetColumn+column) : [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)
        * [.sourceReference](#ERMrest.FacetColumn+sourceReference) : [<code>Reference</code>](#ERMrest.Reference)
        * [.displayname](#ERMrest.FacetColumn+displayname) : <code>object</code>
        * [.comment](#ERMrest.FacetColumn+comment) : <code>string</code>
        * [.hasNotNullFilter](#ERMrest.FacetColumn+hasNotNullFilter) : <code>Boolean</code>
        * [.searchFilters](#ERMrest.FacetColumn+searchFilters) : <code>Array.&lt;ERMREst.SearchFacetFilter&gt;</code>
        * [.choiceFilters](#ERMrest.FacetColumn+choiceFilters) : <code>Array.&lt;ERMREst.ChoiceFacetFilter&gt;</code>
        * [.rangeFilters](#ERMrest.FacetColumn+rangeFilters) : <code>Array.&lt;ERMREst.RangeFacetFilter&gt;</code>
        * [.getChoiceDisplaynames()](#ERMrest.FacetColumn+getChoiceDisplaynames) ⇒ <code>Promise</code>
        * [.toJSON()](#ERMrest.FacetColumn+toJSON) ⇒ <code>Object</code>
        * [._setFilters(json)](#ERMrest.FacetColumn+_setFilters)
        * [.addSearchFilter(term)](#ERMrest.FacetColumn+addSearchFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.addChoiceFilters()](#ERMrest.FacetColumn+addChoiceFilters) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.replaceAllChoiceFilters()](#ERMrest.FacetColumn+replaceAllChoiceFilters) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.removeChoiceFilters(terms)](#ERMrest.FacetColumn+removeChoiceFilters) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.addRangeFilter(min, max)](#ERMrest.FacetColumn+addRangeFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.removeRangeFilter(min, max)](#ERMrest.FacetColumn+removeRangeFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.addNotNullFilter()](#ERMrest.FacetColumn+addNotNullFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.removeNotNullFilter()](#ERMrest.FacetColumn+removeNotNullFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.removeAllFilters()](#ERMrest.FacetColumn+removeAllFilters) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.removeFilter(index)](#ERMrest.FacetColumn+removeFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.FacetFilter](#ERMrest.FacetFilter)
        * [new FacetFilter(term)](#new_ERMrest.FacetFilter_new)
        * [.toString()](#ERMrest.FacetFilter+toString) ⇒ <code>string</code>
        * [.toJSON()](#ERMrest.FacetFilter+toJSON) ⇒ <code>string</code>
    * [.SearchFacetFilter](#ERMrest.SearchFacetFilter)
        * [new SearchFacetFilter(term)](#new_ERMrest.SearchFacetFilter_new)
    * [.ChoiceFacetFilter](#ERMrest.ChoiceFacetFilter)
        * [new ChoiceFacetFilter(term)](#new_ERMrest.ChoiceFacetFilter_new)
    * [.RangeFacetFilter](#ERMrest.RangeFacetFilter)
        * [new RangeFacetFilter(min, max)](#new_ERMrest.RangeFacetFilter_new)
        * [.toString()](#ERMrest.RangeFacetFilter+toString) ⇒ <code>string</code>
        * [.toJSON()](#ERMrest.RangeFacetFilter+toJSON) ⇒ <code>Object</code>
    * [.NotNullFacetFilter](#ERMrest.NotNullFacetFilter)
        * [new NotNullFacetFilter()](#new_ERMrest.NotNullFacetFilter_new)
    * [.ColumnAggregateFn](#ERMrest.ColumnAggregateFn)
        * [new ColumnAggregateFn(column)](#new_ERMrest.ColumnAggregateFn_new)
        * [.minAgg](#ERMrest.ColumnAggregateFn+minAgg) : <code>Object</code>
        * [.maxAgg](#ERMrest.ColumnAggregateFn+maxAgg) : <code>Object</code>
        * [.countNotNullAgg](#ERMrest.ColumnAggregateFn+countNotNullAgg) : <code>Object</code>
        * [.countDistinctAgg](#ERMrest.ColumnAggregateFn+countDistinctAgg) : <code>Object</code>
    * [.ColumnGroupAggregateFn](#ERMrest.ColumnGroupAggregateFn)
        * [new ColumnGroupAggregateFn(column)](#new_ERMrest.ColumnGroupAggregateFn_new)
        * [.entityValues](#ERMrest.ColumnGroupAggregateFn+entityValues) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
        * [.entityCounts](#ERMrest.ColumnGroupAggregateFn+entityCounts) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
        * [.histogram(bucketCount, min, max)](#ERMrest.ColumnGroupAggregateFn+histogram) ⇒ [<code>BucketAttributeGroupReference</code>](#ERMrest.BucketAttributeGroupReference)
    * [.AttributeGroupReference](#ERMrest.AttributeGroupReference)
        * [new AttributeGroupReference(keyColumns, aggregateColumns, location, catalog)](#new_ERMrest.AttributeGroupReference_new)
        * [._keyColumns](#ERMrest.AttributeGroupReference+_keyColumns) : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
        * [._aggregateColumns](#ERMrest.AttributeGroupReference+_aggregateColumns) : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
        * [.aggregate](#ERMrest.AttributeGroupReference+aggregate) : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
        * [.displayname](#ERMrest.AttributeGroupReference+displayname) : <code>object</code>
        * [.columns](#ERMrest.AttributeGroupReference+columns) : <code>Array.&lt;AttributeGroupColumn&gt;</code>
        * [.uri](#ERMrest.AttributeGroupReference+uri) : <code>string</code>
        * [.read([limit], contextHeaderParams)](#ERMrest.AttributeGroupReference+read) ⇒ <code>ERMRest.AttributeGroupPage</code>
    * [.AttributeGroupPage](#ERMrest.AttributeGroupPage)
        * [new AttributeGroupPage(reference, data, hasPrevious, hasNext)](#new_ERMrest.AttributeGroupPage_new)
        * [.reference](#ERMrest.AttributeGroupPage+reference) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
        * [.hasPrevious](#ERMrest.AttributeGroupPage+hasPrevious) ⇒ <code>boolean</code>
        * [.hasNext](#ERMrest.AttributeGroupPage+hasNext) ⇒ <code>boolean</code>
        * [.tuples](#ERMrest.AttributeGroupPage+tuples) : [<code>Array.&lt;AttributeGroupTuple&gt;</code>](#ERMrest.AttributeGroupTuple)
        * [.next](#ERMrest.AttributeGroupPage+next) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>
        * [.previous](#ERMrest.AttributeGroupPage+previous) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>
    * [.AttributeGroupTuple](#ERMrest.AttributeGroupTuple)
        * [new AttributeGroupTuple(page, data)](#new_ERMrest.AttributeGroupTuple_new)
        * [.isHTML](#ERMrest.AttributeGroupTuple+isHTML) : <code>Array.&lt;boolean&gt;</code>
        * [.uniqueId](#ERMrest.AttributeGroupTuple+uniqueId) : <code>string</code>
        * [.displayname](#ERMrest.AttributeGroupTuple+displayname) : <code>string</code>
    * [.AttributeGroupReferenceAggregateFn](#ERMrest.AttributeGroupReferenceAggregateFn)
        * [new AttributeGroupReferenceAggregateFn(reference)](#new_ERMrest.AttributeGroupReferenceAggregateFn_new)
        * [.countAgg](#ERMrest.AttributeGroupReferenceAggregateFn+countAgg) : <code>Object</code>
    * [.Checksum](#ERMrest.Checksum)
        * [new Checksum({file}, {options})](#new_ERMrest.Checksum_new)
    * [.upload](#ERMrest.upload)
        * [new upload(file, {otherInfo})](#new_ERMrest.upload_new)
        * [.validateURL(row)](#ERMrest.upload+validateURL) ⇒ <code>boolean</code>
        * [.calculateChecksum(row)](#ERMrest.upload+calculateChecksum) ⇒ <code>Promise</code>
        * [.createUploadJob()](#ERMrest.upload+createUploadJob) ⇒ <code>Promise</code>
        * [.fileExists()](#ERMrest.upload+fileExists) ⇒ <code>Promise</code>
        * [.start()](#ERMrest.upload+start) ⇒ <code>Promise</code>
        * [.completeUpload()](#ERMrest.upload+completeUpload) ⇒ <code>Promise</code>
        * [.pause()](#ERMrest.upload+pause)
        * [.resume()](#ERMrest.upload+resume)
        * [.cancel()](#ERMrest.upload+cancel) ⇒ <code>Promise</code>
        * [.deleteFile()](#ERMrest.upload+deleteFile) ⇒ <code>Promise</code>
    * [.Datapath](#ERMrest.Datapath) : <code>object</code>
        * [.DataPath](#ERMrest.Datapath.DataPath)
            * [new DataPath(table)](#new_ERMrest.Datapath.DataPath_new)
            * [.catalog](#ERMrest.Datapath.DataPath+catalog) : [<code>Catalog</code>](#ERMrest.Catalog)
            * [.context](#ERMrest.Datapath.DataPath+context) : [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
            * [.entity](#ERMrest.Datapath.DataPath+entity)
                * [.get()](#ERMrest.Datapath.DataPath+entity.get) ⇒ <code>Promise</code>
                * [.delete(filter)](#ERMrest.Datapath.DataPath+entity.delete) ⇒ <code>Promise</code>
            * [.filter(filter)](#ERMrest.Datapath.DataPath+filter) ⇒ [<code>DataPath</code>](#ERMrest.Datapath.DataPath)
            * [.extend(table, context, link)](#ERMrest.Datapath.DataPath+extend) ⇒ [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
        * [.PathTable](#ERMrest.Datapath.PathTable)
            * [new PathTable(table, datapath, alias)](#new_ERMrest.Datapath.PathTable_new)
            * [.datapath](#ERMrest.Datapath.PathTable+datapath) : [<code>DataPath</code>](#ERMrest.Datapath.DataPath)
            * [.table](#ERMrest.Datapath.PathTable+table) : [<code>Table</code>](#ERMrest.Table)
            * [.alias](#ERMrest.Datapath.PathTable+alias) : <code>string</code>
            * [.columns](#ERMrest.Datapath.PathTable+columns) : [<code>PathColumns</code>](#ERMrest.Datapath.PathColumns)
            * [.toString()](#ERMrest.Datapath.PathTable+toString) ⇒ <code>string</code>
        * [.PathColumn](#ERMrest.Datapath.PathColumn)
            * [new PathColumn(column, pathtable)](#new_ERMrest.Datapath.PathColumn_new)
            * [.pathtable](#ERMrest.Datapath.PathColumn+pathtable) : [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
            * [.column](#ERMrest.Datapath.PathColumn+column) : [<code>Column</code>](#ERMrest.Column)
        * [.PathColumns(table, pathtable)](#ERMrest.Datapath.PathColumns)
            * [.length()](#ERMrest.Datapath.PathColumns+length) ⇒ <code>Number</code>
            * [.names()](#ERMrest.Datapath.PathColumns+names) ⇒ <code>Array.&lt;String&gt;</code>
            * [.get(colName)](#ERMrest.Datapath.PathColumns+get) ⇒ [<code>PathColumn</code>](#ERMrest.Datapath.PathColumn)
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
    * [.Reference](#ERMrest.Reference) : <code>object</code>
        * [new Reference(location, catalog)](#new_ERMrest.Reference_new)
        * [.contextualize](#ERMrest.Reference+contextualize)
        * [.aggregate](#ERMrest.Reference+aggregate) : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
        * [.displayname](#ERMrest.Reference+displayname) : <code>object</code>
        * [.uri](#ERMrest.Reference+uri) : <code>string</code>
        * [.table](#ERMrest.Reference+table) : [<code>Table</code>](#ERMrest.Table)
        * [.projectionTable](#ERMrest.Reference+projectionTable) : [<code>Table</code>](#ERMrest.Table)
        * [.columns](#ERMrest.Reference+columns) : [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)
        * [.facetColumns](#ERMrest.Reference+facetColumns) ⇒ [<code>Array.&lt;FacetColumn&gt;</code>](#ERMrest.FacetColumn)
        * [.location](#ERMrest.Reference+location) ⇒ <code>ERMrest.Location</code>
        * [.isUnique](#ERMrest.Reference+isUnique) : <code>boolean</code>
        * [.canCreate](#ERMrest.Reference+canCreate) : <code>boolean</code> \| <code>undefined</code>
        * [.canRead](#ERMrest.Reference+canRead) : <code>boolean</code> \| <code>undefined</code>
        * [.canUpdate](#ERMrest.Reference+canUpdate) : <code>boolean</code> \| <code>undefined</code>
        * [.canDelete](#ERMrest.Reference+canDelete) : <code>boolean</code> \| <code>undefined</code>
        * [.display](#ERMrest.Reference+display) : <code>Object</code>
        * [.unfilteredReference](#ERMrest.Reference+unfilteredReference) : [<code>Reference</code>](#ERMrest.Reference)
        * [.appLink](#ERMrest.Reference+appLink) : <code>String</code>
        * [.csvDownloadLink](#ERMrest.Reference+csvDownloadLink) ⇒ <code>String</code>
        * [.defaultLogInfo](#ERMrest.Reference+defaultLogInfo) : <code>Object</code>
        * [.removeAllFacetFilters(sameFacet)](#ERMrest.Reference+removeAllFacetFilters) ⇒ <code>ERMrest.reference</code>
        * [.create(data, contextHeaderParams)](#ERMrest.Reference+create) ⇒ <code>Promise</code>
            * [~columnDiff()](#ERMrest.Reference+create..columnDiff)
        * [.read(limit, contextHeaderParams)](#ERMrest.Reference+read) ⇒ <code>Promise</code>
        * [.sort(sort)](#ERMrest.Reference+sort) ⇒ <code>Reference</code>
        * [.update(tuples, contextHeaderParams)](#ERMrest.Reference+update) ⇒ <code>Promise</code>
        * [.delete(contextHeaderParams)](#ERMrest.Reference+delete) ⇒ <code>Promise</code>
            * [~self](#ERMrest.Reference+delete..self)
        * [.related([tuple])](#ERMrest.Reference+related) ⇒ [<code>Array.&lt;Reference&gt;</code>](#ERMrest.Reference)
        * [.search(term)](#ERMrest.Reference+search) ⇒ <code>Reference</code>
        * [.getAggregates(aggregateList)](#ERMrest.Reference+getAggregates) ⇒ <code>Promise</code>
        * [.setSamePaging(page)](#ERMrest.Reference+setSamePaging) ⇒ [<code>Reference</code>](#ERMrest.Reference)
        * [.getColumnByName(name)](#ERMrest.Reference+getColumnByName) ⇒ [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)
        * [.generateColumnsList(tuple)](#ERMrest.Reference+generateColumnsList) ⇒ [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)
    * [.AttributeGroupReference](#ERMrest.AttributeGroupReference) : <code>object</code>
        * [new AttributeGroupReference(keyColumns, aggregateColumns, location, catalog)](#new_ERMrest.AttributeGroupReference_new)
        * [._keyColumns](#ERMrest.AttributeGroupReference+_keyColumns) : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
        * [._aggregateColumns](#ERMrest.AttributeGroupReference+_aggregateColumns) : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
        * [.aggregate](#ERMrest.AttributeGroupReference+aggregate) : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
        * [.displayname](#ERMrest.AttributeGroupReference+displayname) : <code>object</code>
        * [.columns](#ERMrest.AttributeGroupReference+columns) : <code>Array.&lt;AttributeGroupColumn&gt;</code>
        * [.uri](#ERMrest.AttributeGroupReference+uri) : <code>string</code>
        * [.read([limit], contextHeaderParams)](#ERMrest.AttributeGroupReference+read) ⇒ <code>ERMRest.AttributeGroupPage</code>
    * [.AttributeGroupPage](#ERMrest.AttributeGroupPage) : <code>object</code>
        * [new AttributeGroupPage(reference, data, hasPrevious, hasNext)](#new_ERMrest.AttributeGroupPage_new)
        * [.reference](#ERMrest.AttributeGroupPage+reference) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
        * [.hasPrevious](#ERMrest.AttributeGroupPage+hasPrevious) ⇒ <code>boolean</code>
        * [.hasNext](#ERMrest.AttributeGroupPage+hasNext) ⇒ <code>boolean</code>
        * [.tuples](#ERMrest.AttributeGroupPage+tuples) : [<code>Array.&lt;AttributeGroupTuple&gt;</code>](#ERMrest.AttributeGroupTuple)
        * [.next](#ERMrest.AttributeGroupPage+next) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>
        * [.previous](#ERMrest.AttributeGroupPage+previous) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>
    * [.AttributeGroupTuple](#ERMrest.AttributeGroupTuple) : <code>object</code>
        * [new AttributeGroupTuple(page, data)](#new_ERMrest.AttributeGroupTuple_new)
        * [.isHTML](#ERMrest.AttributeGroupTuple+isHTML) : <code>Array.&lt;boolean&gt;</code>
        * [.uniqueId](#ERMrest.AttributeGroupTuple+uniqueId) : <code>string</code>
        * [.displayname](#ERMrest.AttributeGroupTuple+displayname) : <code>string</code>
    * [.BucketAttributeGroupReference](#ERMrest.BucketAttributeGroupReference) : <code>object</code>
    * [.configure(http, q)](#ERMrest.configure)
    * [.getServer(uri, [contextHeaderParams])](#ERMrest.getServer) ⇒ [<code>Server</code>](#ERMrest.Server)
    * [.parse(uri)](#ERMrest.parse) ⇒ <code>ERMrest.Location</code>
    * [.resolve(uri, [contextHeaderParams])](#ERMrest.resolve) ⇒ <code>Promise</code>

<a name="ERMrest.Server"></a>

### ERMrest.Server
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Server](#ERMrest.Server)
    * [new Server(uri)](#new_ERMrest.Server_new)
    * [.uri](#ERMrest.Server+uri) : <code>string</code>
    * [.catalogs](#ERMrest.Server+catalogs) : [<code>Catalogs</code>](#ERMrest.Catalogs)

<a name="new_ERMrest.Server_new"></a>

#### new Server(uri)

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> | URI of the ERMrest service. |

<a name="ERMrest.Server+uri"></a>

#### server.uri : <code>string</code>
The URI of the ERMrest service

**Kind**: instance property of [<code>Server</code>](#ERMrest.Server)  
<a name="ERMrest.Server+catalogs"></a>

#### server.catalogs : [<code>Catalogs</code>](#ERMrest.Catalogs)
**Kind**: instance property of [<code>Server</code>](#ERMrest.Server)  
<a name="ERMrest.Catalogs"></a>

### ERMrest.Catalogs
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

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
| server | [<code>Server</code>](#ERMrest.Server) | the server object. |

<a name="ERMrest.Catalogs+length"></a>

#### catalogs.length() ⇒ <code>Number</code>
**Kind**: instance method of [<code>Catalogs</code>](#ERMrest.Catalogs)  
**Returns**: <code>Number</code> - Returns the length of the catalogs.  
<a name="ERMrest.Catalogs+names"></a>

#### catalogs.names() ⇒ <code>Array</code>
**Kind**: instance method of [<code>Catalogs</code>](#ERMrest.Catalogs)  
**Returns**: <code>Array</code> - Returns an array of names of catalogs.  
<a name="ERMrest.Catalogs+get"></a>

#### catalogs.get(id) ⇒ <code>Promise</code>
Get a catalog by id. This call does catalog introspection.

**Kind**: instance method of [<code>Catalogs</code>](#ERMrest.Catalogs)  
**Returns**: <code>Promise</code> - a promise that returns the catalog  if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [NotFoundError](#ERMrest.NotFoundError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Catalog ID. |

<a name="ERMrest.Catalog"></a>

### ERMrest.Catalog
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Catalog](#ERMrest.Catalog)
    * [new Catalog(server, id)](#new_ERMrest.Catalog_new)
    * [.id](#ERMrest.Catalog+id) : <code>string</code>
    * [.schemas](#ERMrest.Catalog+schemas) : [<code>Schemas</code>](#ERMrest.Schemas)
    * [.constraintByNamePair(pair, subject)](#ERMrest.Catalog+constraintByNamePair) ⇒ <code>Object</code> \| <code>null</code>
    * [.getTable(tableName, schemaName)](#ERMrest.Catalog+getTable) ⇒ [<code>Table</code>](#ERMrest.Table)

<a name="new_ERMrest.Catalog_new"></a>

#### new Catalog(server, id)
Constructor for the Catalog.


| Param | Type | Description |
| --- | --- | --- |
| server | [<code>Server</code>](#ERMrest.Server) | the server object. |
| id | <code>string</code> | the catalog id. |

<a name="ERMrest.Catalog+id"></a>

#### catalog.id : <code>string</code>
The catalog identifier.

**Kind**: instance property of [<code>Catalog</code>](#ERMrest.Catalog)  
<a name="ERMrest.Catalog+schemas"></a>

#### catalog.schemas : [<code>Schemas</code>](#ERMrest.Schemas)
**Kind**: instance property of [<code>Catalog</code>](#ERMrest.Catalog)  
<a name="ERMrest.Catalog+constraintByNamePair"></a>

#### catalog.constraintByNamePair(pair, subject) ⇒ <code>Object</code> \| <code>null</code>
returns the constraint object for the pair.

**Kind**: instance method of [<code>Catalog</code>](#ERMrest.Catalog)  
**Returns**: <code>Object</code> \| <code>null</code> - the constraint object. Null means the constraint name is not valid.  
**Throws**:

- [<code>NotFoundError</code>](#ERMrest.NotFoundError) constraint not found


| Param | Type | Description |
| --- | --- | --- |
| pair | <code>Array.&lt;string&gt;</code> | constraint name array. Its length must be two. |
| subject | <code>string</code> | the retuned must have the same object, otherwise return null. |

<a name="ERMrest.Catalog+getTable"></a>

#### catalog.getTable(tableName, schemaName) ⇒ [<code>Table</code>](#ERMrest.Table)
Given tableName, and schemaName find the table

**Kind**: instance method of [<code>Catalog</code>](#ERMrest.Catalog)  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | name of the table |
| schemaName | <code>string</code> | name of the schema. Can be undefined. |

<a name="ERMrest.Schemas"></a>

### ERMrest.Schemas
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Schemas](#ERMrest.Schemas)
    * [new Schemas()](#new_ERMrest.Schemas_new)
    * [.length()](#ERMrest.Schemas+length) ⇒ <code>Number</code>
    * [.all()](#ERMrest.Schemas+all) ⇒ <code>Array</code>
    * [.names()](#ERMrest.Schemas+names) ⇒ <code>Array</code>
    * [.get(name)](#ERMrest.Schemas+get) ⇒ [<code>Schema</code>](#ERMrest.Schema)
    * [.has(name)](#ERMrest.Schemas+has) ⇒ <code>boolean</code>
    * [.findTable(tableName, [schemaName])](#ERMrest.Schemas+findTable) ⇒ [<code>Table</code>](#ERMrest.Table)

<a name="new_ERMrest.Schemas_new"></a>

#### new Schemas()
Constructor for the Schemas.

<a name="ERMrest.Schemas+length"></a>

#### schemas.length() ⇒ <code>Number</code>
**Kind**: instance method of [<code>Schemas</code>](#ERMrest.Schemas)  
**Returns**: <code>Number</code> - number of schemas  
<a name="ERMrest.Schemas+all"></a>

#### schemas.all() ⇒ <code>Array</code>
**Kind**: instance method of [<code>Schemas</code>](#ERMrest.Schemas)  
**Returns**: <code>Array</code> - Array of all schemas in the catalog  
<a name="ERMrest.Schemas+names"></a>

#### schemas.names() ⇒ <code>Array</code>
**Kind**: instance method of [<code>Schemas</code>](#ERMrest.Schemas)  
**Returns**: <code>Array</code> - Array of schema names  
<a name="ERMrest.Schemas+get"></a>

#### schemas.get(name) ⇒ [<code>Schema</code>](#ERMrest.Schema)
get schema by schema name

**Kind**: instance method of [<code>Schemas</code>](#ERMrest.Schemas)  
**Returns**: [<code>Schema</code>](#ERMrest.Schema) - schema object  
**Throws**:

- [<code>NotFoundError</code>](#ERMrest.NotFoundError) schema not found


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | schema name |

<a name="ERMrest.Schemas+has"></a>

#### schemas.has(name) ⇒ <code>boolean</code>
check for schema name existence

**Kind**: instance method of [<code>Schemas</code>](#ERMrest.Schemas)  
**Returns**: <code>boolean</code> - if the schema exists or not  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | schmea name |

<a name="ERMrest.Schemas+findTable"></a>

#### schemas.findTable(tableName, [schemaName]) ⇒ [<code>Table</code>](#ERMrest.Table)
**Kind**: instance method of [<code>Schemas</code>](#ERMrest.Schemas)  
**Throws**:

- [<code>MalformedURIError</code>](#ERMrest.MalformedURIError) 
- [<code>NotFoundError</code>](#ERMrest.NotFoundError) Given table name and schema will find the table object.
If schema name is not given, it will still try to find the table.
If the table name exists in multiple schemas or it doesn't exist,
it will throw an error


| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | the name of table |
| [schemaName] | <code>string</code> | the name of schema (optional) |

<a name="ERMrest.Schema"></a>

### ERMrest.Schema
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Schema](#ERMrest.Schema)
    * [new Schema(catalog, jsonSchema)](#new_ERMrest.Schema_new)
    * [.catalog](#ERMrest.Schema+catalog) : [<code>Catalog</code>](#ERMrest.Catalog)
    * [.name](#ERMrest.Schema+name)
    * [.ignore](#ERMrest.Schema+ignore) : <code>boolean</code>
    * [.annotations](#ERMrest.Schema+annotations) : [<code>Annotations</code>](#ERMrest.Annotations)
    * [.rights](#ERMrest.Schema+rights) : <code>Object</code>
    * [.displayname](#ERMrest.Schema+displayname) : <code>object</code>
    * [.tables](#ERMrest.Schema+tables) : [<code>Tables</code>](#ERMrest.Tables)
    * [.comment](#ERMrest.Schema+comment) : <code>string</code>

<a name="new_ERMrest.Schema_new"></a>

#### new Schema(catalog, jsonSchema)
Constructor for the Catalog.


| Param | Type | Description |
| --- | --- | --- |
| catalog | [<code>Catalog</code>](#ERMrest.Catalog) | the catalog object. |
| jsonSchema | <code>string</code> | json of the schema. |

<a name="ERMrest.Schema+catalog"></a>

#### schema.catalog : [<code>Catalog</code>](#ERMrest.Catalog)
**Kind**: instance property of [<code>Schema</code>](#ERMrest.Schema)  
<a name="ERMrest.Schema+name"></a>

#### schema.name
**Kind**: instance property of [<code>Schema</code>](#ERMrest.Schema)  
<a name="ERMrest.Schema+ignore"></a>

#### schema.ignore : <code>boolean</code>
**Kind**: instance property of [<code>Schema</code>](#ERMrest.Schema)  
<a name="ERMrest.Schema+annotations"></a>

#### schema.annotations : [<code>Annotations</code>](#ERMrest.Annotations)
**Kind**: instance property of [<code>Schema</code>](#ERMrest.Schema)  
<a name="ERMrest.Schema+rights"></a>

#### schema.rights : <code>Object</code>
**Kind**: instance property of [<code>Schema</code>](#ERMrest.Schema)  
<a name="ERMrest.Schema+displayname"></a>

#### schema.displayname : <code>object</code>
Preferred display name for user presentation only.
this.displayname.isHTML will return true/false
this.displayname.value has the value

**Kind**: instance property of [<code>Schema</code>](#ERMrest.Schema)  
<a name="ERMrest.Schema+tables"></a>

#### schema.tables : [<code>Tables</code>](#ERMrest.Tables)
**Kind**: instance property of [<code>Schema</code>](#ERMrest.Schema)  
<a name="ERMrest.Schema+comment"></a>

#### schema.comment : <code>string</code>
Documentation for this schema

**Kind**: instance property of [<code>Schema</code>](#ERMrest.Schema)  
<a name="ERMrest.Tables"></a>

### ERMrest.Tables
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Tables](#ERMrest.Tables)
    * [new Tables()](#new_ERMrest.Tables_new)
    * [.all()](#ERMrest.Tables+all) ⇒ <code>Array</code>
    * [.length()](#ERMrest.Tables+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Tables+names) ⇒ <code>Array</code>
    * [.get(name)](#ERMrest.Tables+get) ⇒ [<code>Table</code>](#ERMrest.Table)

<a name="new_ERMrest.Tables_new"></a>

#### new Tables()
Constructor for the Tables.

<a name="ERMrest.Tables+all"></a>

#### tables.all() ⇒ <code>Array</code>
**Kind**: instance method of [<code>Tables</code>](#ERMrest.Tables)  
**Returns**: <code>Array</code> - array of tables  
<a name="ERMrest.Tables+length"></a>

#### tables.length() ⇒ <code>Number</code>
**Kind**: instance method of [<code>Tables</code>](#ERMrest.Tables)  
**Returns**: <code>Number</code> - number of tables  
<a name="ERMrest.Tables+names"></a>

#### tables.names() ⇒ <code>Array</code>
**Kind**: instance method of [<code>Tables</code>](#ERMrest.Tables)  
**Returns**: <code>Array</code> - Array of table names  
<a name="ERMrest.Tables+get"></a>

#### tables.get(name) ⇒ [<code>Table</code>](#ERMrest.Table)
get table by table name

**Kind**: instance method of [<code>Tables</code>](#ERMrest.Tables)  
**Returns**: [<code>Table</code>](#ERMrest.Table) - table  
**Throws**:

- [<code>NotFoundError</code>](#ERMrest.NotFoundError) table not found


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of table |

<a name="ERMrest.Table"></a>

### ERMrest.Table
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Table](#ERMrest.Table)
    * [new Table(schema, jsonTable)](#new_ERMrest.Table_new)
    * _instance_
        * [.schema](#ERMrest.Table+schema) : [<code>Schema</code>](#ERMrest.Schema)
        * [.name](#ERMrest.Table+name)
        * [.entity](#ERMrest.Table+entity) : [<code>Entity</code>](#ERMrest.Table.Entity)
        * [.ignore](#ERMrest.Table+ignore) : <code>boolean</code>
        * [._baseTable](#ERMrest.Table+_baseTable) : [<code>Table</code>](#ERMrest.Table)
        * [.annotations](#ERMrest.Table+annotations) : [<code>Annotations</code>](#ERMrest.Annotations)
        * [.displayname](#ERMrest.Table+displayname) : <code>object</code>
        * [.columns](#ERMrest.Table+columns) : [<code>Columns</code>](#ERMrest.Columns)
        * [.keys](#ERMrest.Table+keys) : [<code>Keys</code>](#ERMrest.Keys)
        * [.rights](#ERMrest.Table+rights) : <code>Object</code>
        * [.foreignKeys](#ERMrest.Table+foreignKeys) : [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)
        * [.referredBy](#ERMrest.Table+referredBy) : [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)
        * [.comment](#ERMrest.Table+comment) : <code>string</code>
        * [.kind](#ERMrest.Table+kind) : <code>string</code>
        * [.shortestKey](#ERMrest.Table+shortestKey)
        * [.displayKey](#ERMrest.Table+displayKey) : [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column)
        * [.uri](#ERMrest.Table+uri) : <code>string</code>
        * [._getRowDisplayKey(context)](#ERMrest.Table+_getRowDisplayKey)
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
| schema | [<code>Schema</code>](#ERMrest.Schema) | the schema object. |
| jsonTable | <code>string</code> | the json of the table. |

<a name="ERMrest.Table+schema"></a>

#### table.schema : [<code>Schema</code>](#ERMrest.Schema)
**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+name"></a>

#### table.name
**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+entity"></a>

#### table.entity : [<code>Entity</code>](#ERMrest.Table.Entity)
**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+ignore"></a>

#### table.ignore : <code>boolean</code>
**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+_baseTable"></a>

#### table._baseTable : [<code>Table</code>](#ERMrest.Table)
this defaults to itself on the first pass of introspection
then might be changed on the second pass if this is an alternative table

**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+annotations"></a>

#### table.annotations : [<code>Annotations</code>](#ERMrest.Annotations)
**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+displayname"></a>

#### table.displayname : <code>object</code>
Preferred display name for user presentation only.
this.displayname.isHTML will return true/false
this.displayname.value has the value

**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+columns"></a>

#### table.columns : [<code>Columns</code>](#ERMrest.Columns)
**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+keys"></a>

#### table.keys : [<code>Keys</code>](#ERMrest.Keys)
**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+rights"></a>

#### table.rights : <code>Object</code>
**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+foreignKeys"></a>

#### table.foreignKeys : [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)
**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+referredBy"></a>

#### table.referredBy : [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)
All the FKRs to this table.

**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+comment"></a>

#### table.comment : <code>string</code>
Documentation for this table

**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+kind"></a>

#### table.kind : <code>string</code>
The type of this table

**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+shortestKey"></a>

#### table.shortestKey
The columns that create the shortest key

**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
**Type{column[]}**:   
<a name="ERMrest.Table+displayKey"></a>

#### table.displayKey : [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column)
The columns that create the shortest key that can be used for display purposes.

**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+uri"></a>

#### table.uri : <code>string</code>
uri to the table in ermrest with entity api

**Kind**: instance property of [<code>Table</code>](#ERMrest.Table)  
<a name="ERMrest.Table+_getRowDisplayKey"></a>

#### table._getRowDisplayKey(context)
This key will be used for referring to a row of data. Therefore it shouldn't be foreignkey and markdown type.
It's the same as displaykey but with extra restrictions. It might return undefined.

**Kind**: instance method of [<code>Table</code>](#ERMrest.Table)  
**Returns{column[]|undefined}**: list of columns. If couldn't find a suitable columns will return undefined.  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>string</code> | used to figure out if the column has markdown_pattern annoation or not. |

<a name="ERMrest.Table.Entity"></a>

#### Table.Entity
**Kind**: static class of [<code>Table</code>](#ERMrest.Table)  

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
| server | [<code>Server</code>](#ERMrest.Server) | 
| table | [<code>Table</code>](#ERMrest.Table) | 

<a name="ERMrest.Table.Entity+count"></a>

##### entity.count([filter]) ⇒ <code>Promise</code>
get the number of rows

**Kind**: instance method of [<code>Entity</code>](#ERMrest.Table.Entity)  
**Returns**: <code>Promise</code> - promise returning number of count if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  

| Param | Type |
| --- | --- |
| [filter] | [<code>Negation</code>](#ERMrest.Filters.Negation) \| [<code>Conjunction</code>](#ERMrest.Filters.Conjunction) \| [<code>Disjunction</code>](#ERMrest.Filters.Disjunction) \| [<code>UnaryPredicate</code>](#ERMrest.Filters.UnaryPredicate) \| [<code>BinaryPredicate</code>](#ERMrest.Filters.BinaryPredicate) | 

<a name="ERMrest.Table.Entity+get"></a>

##### entity.get([filter], [limit], [columns], [sortby]) ⇒ <code>Promise</code>
get table rows with option filter, row limit and selected columns (in this order).
In order to use before & after on a Rows, limit must be speficied,
output columns and sortby needs to have columns of a key

**Kind**: instance method of [<code>Entity</code>](#ERMrest.Table.Entity)  
**Returns**: <code>Promise</code> - promise returning rowset if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    ERMrest.Conflict, ERMrest.ForbiddenError or ERMrest.Unauthorized if rejected  

| Param | Type | Description |
| --- | --- | --- |
| [filter] | [<code>Negation</code>](#ERMrest.Filters.Negation) \| [<code>Conjunction</code>](#ERMrest.Filters.Conjunction) \| [<code>Disjunction</code>](#ERMrest.Filters.Disjunction) \| [<code>UnaryPredicate</code>](#ERMrest.Filters.UnaryPredicate) \| [<code>BinaryPredicate</code>](#ERMrest.Filters.BinaryPredicate) |  |
| [limit] | <code>Number</code> | Number of rows |
| [columns] | [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column) \| <code>Array.&lt;string&gt;</code> | Array of column names or Column objects output |
| [sortby] | <code>Array.&lt;Object&gt;</code> | An ordered array of {column, order} where column is column name or Column object, order is null (default), 'asc' or 'desc' |

<a name="ERMrest.Table.Entity+getBefore"></a>

##### entity.getBefore(filter, limit, [columns], [sortby], row) ⇒ <code>Promise</code>
get a page of rows before a specific row
In order to use before & after on a Rows, limit must be speficied,
output columns and sortby needs to have columns of a key

**Kind**: instance method of [<code>Entity</code>](#ERMrest.Table.Entity)  
**Returns**: <code>Promise</code> - promise returning rowset if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    ERMrest.Conflict, ERMrest.ForbiddenError or ERMrest.Unauthorized if rejected  

| Param | Type | Description |
| --- | --- | --- |
| filter | [<code>Negation</code>](#ERMrest.Filters.Negation) \| [<code>Conjunction</code>](#ERMrest.Filters.Conjunction) \| [<code>Disjunction</code>](#ERMrest.Filters.Disjunction) \| [<code>UnaryPredicate</code>](#ERMrest.Filters.UnaryPredicate) \| [<code>BinaryPredicate</code>](#ERMrest.Filters.BinaryPredicate) \| <code>null</code> | null if not being used |
| limit | <code>Number</code> | Required. Number of rows |
| [columns] | [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column) \| <code>Array.&lt;String&gt;</code> | Array of column names or Column objects output |
| [sortby] | <code>Array.&lt;Object&gt;</code> | ordered array of {column, order} where column is column name or Column object, order is null (default), 'asc' or 'desc' |
| row | <code>Object</code> | json row data used to getBefore |

<a name="ERMrest.Table.Entity+getAfter"></a>

##### entity.getAfter(filter, limit, [columns], [sortby], row) ⇒ <code>Promise</code>
get a page of rows after a specific row

**Kind**: instance method of [<code>Entity</code>](#ERMrest.Table.Entity)  
**Returns**: <code>Promise</code> - promise returning rowset if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    ERMrest.Conflict, ERMrest.ForbiddenError or ERMrest.Unauthorized if rejected  

| Param | Type | Description |
| --- | --- | --- |
| filter | [<code>Negation</code>](#ERMrest.Filters.Negation) \| [<code>Conjunction</code>](#ERMrest.Filters.Conjunction) \| [<code>Disjunction</code>](#ERMrest.Filters.Disjunction) \| [<code>UnaryPredicate</code>](#ERMrest.Filters.UnaryPredicate) \| [<code>BinaryPredicate</code>](#ERMrest.Filters.BinaryPredicate) \| <code>null</code> | null is not being used |
| limit | <code>Number</code> | Required. Number of rows |
| [columns] | [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column) \| <code>Array.&lt;String&gt;</code> | Array of column names or Column objects output |
| [sortby] | <code>Array.&lt;Object&gt;</code> | ordered array of {column, order} where column is column name or Column object, order is null (default), 'asc' or 'desc' |
| row | <code>Object</code> | json row data used to getAfter |

<a name="ERMrest.Table.Entity+delete"></a>

##### entity.delete(filter) ⇒ <code>Promise</code>
Delete rows from table based on the filter

**Kind**: instance method of [<code>Entity</code>](#ERMrest.Table.Entity)  
**Returns**: <code>Promise</code> - Promise that returns the json row data deleted if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  

| Param | Type |
| --- | --- |
| filter | [<code>Negation</code>](#ERMrest.Filters.Negation) \| [<code>Conjunction</code>](#ERMrest.Filters.Conjunction) \| [<code>Disjunction</code>](#ERMrest.Filters.Disjunction) \| [<code>UnaryPredicate</code>](#ERMrest.Filters.UnaryPredicate) \| [<code>BinaryPredicate</code>](#ERMrest.Filters.BinaryPredicate) | 

<a name="ERMrest.Table.Entity+put"></a>

##### entity.put(rows) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Entity</code>](#ERMrest.Table.Entity)  
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

**Kind**: instance method of [<code>Entity</code>](#ERMrest.Table.Entity)  
**Returns**: <code>Promise</code> - Promise that returns the rows created if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [BadRequestError](#ERMrest.BadRequestError), [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  

| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Object</code> | Array of jSON representation of rows |
| defaults | <code>Array.&lt;String&gt;</code> | Array of string column names to be defaults |

<a name="ERMrest.Rows"></a>

### ERMrest.Rows
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

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
| table | [<code>Table</code>](#ERMrest.Table) |  |
| jsonRows | <code>Object</code> |  |
| filter | [<code>Negation</code>](#ERMrest.Filters.Negation) \| [<code>Conjunction</code>](#ERMrest.Filters.Conjunction) \| [<code>Disjunction</code>](#ERMrest.Filters.Disjunction) \| [<code>UnaryPredicate</code>](#ERMrest.Filters.UnaryPredicate) \| [<code>BinaryPredicate</code>](#ERMrest.Filters.BinaryPredicate) \| <code>null</code> | null if not being used |
| limit | <code>Number</code> | Number of rows |
| columns | [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column) \| <code>Array.&lt;String&gt;</code> | Array of column names or Column objects output |
| [sortby] | <code>Array.&lt;Object&gt;</code> | An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc' |

<a name="ERMrest.Rows+data"></a>

#### rows.data : <code>Array</code>
The set of rows returns from the server. It is an Array of
Objects that has keys and values based on the query that produced
the Rows.

**Kind**: instance property of [<code>Rows</code>](#ERMrest.Rows)  
<a name="ERMrest.Rows+length"></a>

#### rows.length() ⇒ <code>number</code>
**Kind**: instance method of [<code>Rows</code>](#ERMrest.Rows)  
<a name="ERMrest.Rows+get"></a>

#### rows.get() ⇒ <code>Row</code>
**Kind**: instance method of [<code>Rows</code>](#ERMrest.Rows)  
<a name="ERMrest.Rows+after"></a>

#### rows.after() ⇒ <code>Promise</code>
get the rows of the next page

**Kind**: instance method of [<code>Rows</code>](#ERMrest.Rows)  
**Returns**: <code>Promise</code> - promise that returns the rows if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  
<a name="ERMrest.Rows+before"></a>

#### rows.before() ⇒ <code>Promise</code>
get the rowset of the previous page

**Kind**: instance method of [<code>Rows</code>](#ERMrest.Rows)  
**Returns**: <code>Promise</code> - promise that returns a rowset if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  
<a name="ERMrest.Row"></a>

### ERMrest.Row
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

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

**Kind**: instance property of [<code>Row</code>](#ERMrest.Row)  
<a name="ERMrest.Row+names"></a>

#### row.names() ⇒ <code>Array</code>
**Kind**: instance method of [<code>Row</code>](#ERMrest.Row)  
**Returns**: <code>Array</code> - Array of column names  
<a name="ERMrest.Row+get"></a>

#### row.get(name) ⇒ <code>Object</code>
**Kind**: instance method of [<code>Row</code>](#ERMrest.Row)  
**Returns**: <code>Object</code> - column value  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of column |

<a name="ERMrest.Columns"></a>

### ERMrest.Columns
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Columns](#ERMrest.Columns)
    * [new Columns(table)](#new_ERMrest.Columns_new)
    * [.all()](#ERMrest.Columns+all) ⇒ <code>Array</code>
    * [.length()](#ERMrest.Columns+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Columns+names) ⇒ <code>Array</code>
    * [.has(name)](#ERMrest.Columns+has) ⇒ <code>boolean</code>
    * [.get(name)](#ERMrest.Columns+get) ⇒ [<code>Column</code>](#ERMrest.Column)
    * [.getByPosition(pos)](#ERMrest.Columns+getByPosition) ⇒ [<code>Column</code>](#ERMrest.Column)

<a name="new_ERMrest.Columns_new"></a>

#### new Columns(table)
Constructor for Columns.


| Param | Type | Description |
| --- | --- | --- |
| table | <code>Table</code> | Required |

<a name="ERMrest.Columns+all"></a>

#### columns.all() ⇒ <code>Array</code>
**Kind**: instance method of [<code>Columns</code>](#ERMrest.Columns)  
**Returns**: <code>Array</code> - array of all columns  
<a name="ERMrest.Columns+length"></a>

#### columns.length() ⇒ <code>Number</code>
**Kind**: instance method of [<code>Columns</code>](#ERMrest.Columns)  
**Returns**: <code>Number</code> - number of columns  
<a name="ERMrest.Columns+names"></a>

#### columns.names() ⇒ <code>Array</code>
**Kind**: instance method of [<code>Columns</code>](#ERMrest.Columns)  
**Returns**: <code>Array</code> - names of columns  
<a name="ERMrest.Columns+has"></a>

#### columns.has(name) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>Columns</code>](#ERMrest.Columns)  
**Returns**: <code>boolean</code> - whether Columns has this column or not  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the column |

<a name="ERMrest.Columns+get"></a>

#### columns.get(name) ⇒ [<code>Column</code>](#ERMrest.Column)
**Kind**: instance method of [<code>Columns</code>](#ERMrest.Columns)  
**Returns**: [<code>Column</code>](#ERMrest.Column) - column  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of column |

<a name="ERMrest.Columns+getByPosition"></a>

#### columns.getByPosition(pos) ⇒ [<code>Column</code>](#ERMrest.Column)
**Kind**: instance method of [<code>Columns</code>](#ERMrest.Columns)  

| Param | Type |
| --- | --- |
| pos | <code>int</code> | 

<a name="ERMrest.Column"></a>

### ERMrest.Column
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Column](#ERMrest.Column)
    * [new Column(table, jsonColumn)](#new_ERMrest.Column_new)
    * [.position](#ERMrest.Column+position) : <code>number</code>
    * [.table](#ERMrest.Column+table) : [<code>Table</code>](#ERMrest.Table)
    * [.rights](#ERMrest.Column+rights) : <code>Object</code>
    * [.isHidden](#ERMrest.Column+isHidden) : <code>Boolean</code>
    * [.isGenerated](#ERMrest.Column+isGenerated) : <code>Boolean</code>
    * [.isSystemColumn](#ERMrest.Column+isSystemColumn) : <code>Boolean</code>
    * [.isImmutable](#ERMrest.Column+isImmutable) : <code>Boolean</code>
    * [.name](#ERMrest.Column+name) : <code>string</code>
    * [.type](#ERMrest.Column+type) : [<code>Type</code>](#ERMrest.Type)
    * [.nullok](#ERMrest.Column+nullok) : <code>Boolean</code>
    * [.comment](#ERMrest.Column+comment) : <code>string</code>
    * [.ignore](#ERMrest.Column+ignore) : <code>boolean</code>
    * [.annotations](#ERMrest.Column+annotations) : [<code>Annotations</code>](#ERMrest.Annotations)
    * [.displayname](#ERMrest.Column+displayname) : <code>object</code>
    * [.memberOfKeys](#ERMrest.Column+memberOfKeys) : [<code>Array.&lt;Key&gt;</code>](#ERMrest.Key)
    * [.memberOfForeignKeys](#ERMrest.Column+memberOfForeignKeys) : [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
    * [.default](#ERMrest.Column+default) ⇒ <code>string</code>
    * [.formatvalue(data, context)](#ERMrest.Column+formatvalue) ⇒ <code>string</code>
    * [.formatPresentation(data, context, options)](#ERMrest.Column+formatPresentation) ⇒ <code>Object</code>
    * [.toString()](#ERMrest.Column+toString) ⇒ <code>string</code>
    * [.getDisplay(context)](#ERMrest.Column+getDisplay)

<a name="new_ERMrest.Column_new"></a>

#### new Column(table, jsonColumn)
Constructs a Column.

TODO: The Column will need to change. We need to be able to use the
column in the context the new [ERMrest.Reference+columns](ERMrest.Reference+columns) where
a Column _may not_ be a part of a Table.


| Param | Type | Description |
| --- | --- | --- |
| table | [<code>Table</code>](#ERMrest.Table) | the table object. |
| jsonColumn | <code>string</code> | the json column. |

<a name="ERMrest.Column+position"></a>

#### column.position : <code>number</code>
The ordinal number or position of this column relative to other
columns within the same scope.
TODO: to be implemented

**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+table"></a>

#### column.table : [<code>Table</code>](#ERMrest.Table)
**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+rights"></a>

#### column.rights : <code>Object</code>
**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+isHidden"></a>

#### column.isHidden : <code>Boolean</code>
Mentions whether we should hide the value for this column

**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+isGenerated"></a>

#### column.isGenerated : <code>Boolean</code>
Mentions whether this column is generated depending on insert rights
or if column is system generated then return true so that it is disabled.

**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+isSystemColumn"></a>

#### column.isSystemColumn : <code>Boolean</code>
If column is system generated then this should true so that it is disabled during create and update.

**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+isImmutable"></a>

#### column.isImmutable : <code>Boolean</code>
Mentions whether this column is immutable depending on update rights

**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+name"></a>

#### column.name : <code>string</code>
**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+type"></a>

#### column.type : [<code>Type</code>](#ERMrest.Type)
**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+nullok"></a>

#### column.nullok : <code>Boolean</code>
**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+comment"></a>

#### column.comment : <code>string</code>
Documentation for this column

**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+ignore"></a>

#### column.ignore : <code>boolean</code>
**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+annotations"></a>

#### column.annotations : [<code>Annotations</code>](#ERMrest.Annotations)
**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+displayname"></a>

#### column.displayname : <code>object</code>
Preferred display name for user presentation only.
this.displayname.isHTML will return true/false
this.displayname.value has the value

**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+memberOfKeys"></a>

#### column.memberOfKeys : [<code>Array.&lt;Key&gt;</code>](#ERMrest.Key)
keys that this column is a member of

**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+memberOfForeignKeys"></a>

#### column.memberOfForeignKeys : [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
foreign key that this column is a member of

**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+default"></a>

#### column.default ⇒ <code>string</code>
return the default value for a column after checking whether it's a primitive that can be displayed properly

**Kind**: instance property of [<code>Column</code>](#ERMrest.Column)  
<a name="ERMrest.Column+formatvalue"></a>

#### column.formatvalue(data, context) ⇒ <code>string</code>
Formats a value corresponding to this column definition.
If a column display annotation with preformat property is available then use prvided format string
else use the default formatValue function

**Kind**: instance method of [<code>Column</code>](#ERMrest.Column)  
**Returns**: <code>string</code> - The formatted value.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | The 'raw' data value. |
| context | <code>String</code> | the app context |

<a name="ERMrest.Column+formatPresentation"></a>

#### column.formatPresentation(data, context, options) ⇒ <code>Object</code>
Formats the presentation value corresponding to this column definition.

**Kind**: instance method of [<code>Column</code>](#ERMrest.Column)  
**Returns**: <code>Object</code> - A key value pair containing value and isHTML that detemrines the presentation.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>String</code> | The 'formatted' data value. |
| context | <code>String</code> | the app context |
| options | <code>Object</code> | The key value pair of possible options with all formatted values in '.formattedValues' key |

<a name="ERMrest.Column+toString"></a>

#### column.toString() ⇒ <code>string</code>
returns string representation of Column

**Kind**: instance method of [<code>Column</code>](#ERMrest.Column)  
**Returns**: <code>string</code> - string representation of Column  
<a name="ERMrest.Column+getDisplay"></a>

#### column.getDisplay(context)
display object for the column

**Kind**: instance method of [<code>Column</code>](#ERMrest.Column)  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>String</code> | the context that we want the display for. |

<a name="ERMrest.Annotations"></a>

### ERMrest.Annotations
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Annotations](#ERMrest.Annotations)
    * [new Annotations()](#new_ERMrest.Annotations_new)
    * [.all()](#ERMrest.Annotations+all) ⇒ [<code>Array.&lt;Annotation&gt;</code>](#ERMrest.Annotation)
    * [.length()](#ERMrest.Annotations+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Annotations+names) ⇒ <code>Array</code>
    * [.get(uri)](#ERMrest.Annotations+get) ⇒ [<code>Annotation</code>](#ERMrest.Annotation)
    * [.contains(uri)](#ERMrest.Annotations+contains) ⇒ <code>boolean</code>

<a name="new_ERMrest.Annotations_new"></a>

#### new Annotations()
Constructor for Annotations.

<a name="ERMrest.Annotations+all"></a>

#### annotations.all() ⇒ [<code>Array.&lt;Annotation&gt;</code>](#ERMrest.Annotation)
**Kind**: instance method of [<code>Annotations</code>](#ERMrest.Annotations)  
**Returns**: [<code>Array.&lt;Annotation&gt;</code>](#ERMrest.Annotation) - list of all annotations  
<a name="ERMrest.Annotations+length"></a>

#### annotations.length() ⇒ <code>Number</code>
**Kind**: instance method of [<code>Annotations</code>](#ERMrest.Annotations)  
**Returns**: <code>Number</code> - number of annotations  
<a name="ERMrest.Annotations+names"></a>

#### annotations.names() ⇒ <code>Array</code>
**Kind**: instance method of [<code>Annotations</code>](#ERMrest.Annotations)  
**Returns**: <code>Array</code> - array of annotation names  
<a name="ERMrest.Annotations+get"></a>

#### annotations.get(uri) ⇒ [<code>Annotation</code>](#ERMrest.Annotation)
get annotation by URI

**Kind**: instance method of [<code>Annotations</code>](#ERMrest.Annotations)  
**Returns**: [<code>Annotation</code>](#ERMrest.Annotation) - annotation  
**Throws**:

- [<code>NotFoundError</code>](#ERMrest.NotFoundError) annotation not found


| Param | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> | uri of annotation |

<a name="ERMrest.Annotations+contains"></a>

#### annotations.contains(uri) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>Annotations</code>](#ERMrest.Annotations)  
**Returns**: <code>boolean</code> - whether or not annotation exists  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> | uri of annotation |

<a name="ERMrest.Annotation"></a>

### ERMrest.Annotation
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

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

**Kind**: instance property of [<code>Annotation</code>](#ERMrest.Annotation)  
<a name="ERMrest.Annotation+content"></a>

#### annotation.content : <code>string</code>
json content

**Kind**: instance property of [<code>Annotation</code>](#ERMrest.Annotation)  
<a name="ERMrest.Keys"></a>

### ERMrest.Keys
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Keys](#ERMrest.Keys)
    * [new Keys()](#new_ERMrest.Keys_new)
    * [.all()](#ERMrest.Keys+all) ⇒ <code>Array.&lt;Key&gt;</code>
    * [.length()](#ERMrest.Keys+length) ⇒ <code>Number</code>
    * [.colsets()](#ERMrest.Keys+colsets) ⇒ [<code>Array.&lt;ColSet&gt;</code>](#ERMrest.ColSet)
    * [.get(colset)](#ERMrest.Keys+get) ⇒ [<code>Key</code>](#ERMrest.Key)

<a name="new_ERMrest.Keys_new"></a>

#### new Keys()
Constructor for Keys.

<a name="ERMrest.Keys+all"></a>

#### keys.all() ⇒ <code>Array.&lt;Key&gt;</code>
**Kind**: instance method of [<code>Keys</code>](#ERMrest.Keys)  
**Returns**: <code>Array.&lt;Key&gt;</code> - a list of all Keys  
<a name="ERMrest.Keys+length"></a>

#### keys.length() ⇒ <code>Number</code>
**Kind**: instance method of [<code>Keys</code>](#ERMrest.Keys)  
**Returns**: <code>Number</code> - number of keys  
<a name="ERMrest.Keys+colsets"></a>

#### keys.colsets() ⇒ [<code>Array.&lt;ColSet&gt;</code>](#ERMrest.ColSet)
**Kind**: instance method of [<code>Keys</code>](#ERMrest.Keys)  
**Returns**: [<code>Array.&lt;ColSet&gt;</code>](#ERMrest.ColSet) - array of colsets  
<a name="ERMrest.Keys+get"></a>

#### keys.get(colset) ⇒ [<code>Key</code>](#ERMrest.Key)
get the key by the column set

**Kind**: instance method of [<code>Keys</code>](#ERMrest.Keys)  
**Returns**: [<code>Key</code>](#ERMrest.Key) - key of the colset  
**Throws**:

- [<code>NotFoundError</code>](#ERMrest.NotFoundError) Key not found


| Param | Type |
| --- | --- |
| colset | [<code>ColSet</code>](#ERMrest.ColSet) | 

<a name="ERMrest.Key"></a>

### ERMrest.Key
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Key](#ERMrest.Key)
    * [new Key(table, jsonKey)](#new_ERMrest.Key_new)
    * [.table](#ERMrest.Key+table) : <code>Table</code>
    * [.colset](#ERMrest.Key+colset) : [<code>ColSet</code>](#ERMrest.ColSet)
    * [.annotations](#ERMrest.Key+annotations) : [<code>Annotations</code>](#ERMrest.Annotations)
    * [.comment](#ERMrest.Key+comment) : <code>string</code>
    * [.constraint_names](#ERMrest.Key+constraint_names) : <code>Array</code>
    * [.name](#ERMrest.Key+name) : <code>string</code>
    * [.simple](#ERMrest.Key+simple) : <code>boolean</code>
    * [.containsColumn(column)](#ERMrest.Key+containsColumn) ⇒ <code>boolean</code>

<a name="new_ERMrest.Key_new"></a>

#### new Key(table, jsonKey)
Constructor for Key.


| Param | Type | Description |
| --- | --- | --- |
| table | [<code>Table</code>](#ERMrest.Table) | the table object. |
| jsonKey | <code>string</code> | json key. |

<a name="ERMrest.Key+table"></a>

#### key.table : <code>Table</code>
Reference to the table that this Key belongs to.

**Kind**: instance property of [<code>Key</code>](#ERMrest.Key)  
<a name="ERMrest.Key+colset"></a>

#### key.colset : [<code>ColSet</code>](#ERMrest.ColSet)
**Kind**: instance property of [<code>Key</code>](#ERMrest.Key)  
<a name="ERMrest.Key+annotations"></a>

#### key.annotations : [<code>Annotations</code>](#ERMrest.Annotations)
**Kind**: instance property of [<code>Key</code>](#ERMrest.Key)  
<a name="ERMrest.Key+comment"></a>

#### key.comment : <code>string</code>
Documentation for this key

**Kind**: instance property of [<code>Key</code>](#ERMrest.Key)  
<a name="ERMrest.Key+constraint_names"></a>

#### key.constraint_names : <code>Array</code>
The exact `names` array in key definition

**Kind**: instance property of [<code>Key</code>](#ERMrest.Key)  
<a name="ERMrest.Key+name"></a>

#### key.name : <code>string</code>
Unique name that can be used for referring to this key.

**Kind**: instance property of [<code>Key</code>](#ERMrest.Key)  
<a name="ERMrest.Key+simple"></a>

#### key.simple : <code>boolean</code>
Indicates if the key is simple (not composite)

**Kind**: instance property of [<code>Key</code>](#ERMrest.Key)  
<a name="ERMrest.Key+containsColumn"></a>

#### key.containsColumn(column) ⇒ <code>boolean</code>
whether key has a column

**Kind**: instance method of [<code>Key</code>](#ERMrest.Key)  

| Param | Type |
| --- | --- |
| column | [<code>Column</code>](#ERMrest.Column) | 

<a name="ERMrest.ColSet"></a>

### ERMrest.ColSet
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.ColSet](#ERMrest.ColSet)
    * [new ColSet(columns)](#new_ERMrest.ColSet_new)
    * [.columns](#ERMrest.ColSet+columns) : <code>Array</code>
    * [.toString()](#ERMrest.ColSet+toString) ⇒ <code>string</code>
    * [.length()](#ERMrest.ColSet+length) ⇒ <code>Number</code>

<a name="new_ERMrest.ColSet_new"></a>

#### new ColSet(columns)
Constructor for ColSet, a set of Column objects.


| Param | Type | Description |
| --- | --- | --- |
| columns | <code>Array</code> | an array of Column objects. |

<a name="ERMrest.ColSet+columns"></a>

#### colSet.columns : <code>Array</code>
It won't preserve the order of given columns.
Returns set of columns sorted by their names.

**Kind**: instance property of [<code>ColSet</code>](#ERMrest.ColSet)  
<a name="ERMrest.ColSet+toString"></a>

#### colSet.toString() ⇒ <code>string</code>
returns string representation of colset object: (s:t:c1,s:t:c2)

**Kind**: instance method of [<code>ColSet</code>](#ERMrest.ColSet)  
**Returns**: <code>string</code> - string representation of colset object  
<a name="ERMrest.ColSet+length"></a>

#### colSet.length() ⇒ <code>Number</code>
**Kind**: instance method of [<code>ColSet</code>](#ERMrest.ColSet)  
**Returns**: <code>Number</code> - number of columns  
<a name="ERMrest.Mapping"></a>

### ERMrest.Mapping
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Mapping](#ERMrest.Mapping)
    * [new Mapping(from, to)](#new_ERMrest.Mapping_new)
    * [.toString()](#ERMrest.Mapping+toString) ⇒ <code>string</code>
    * [.length()](#ERMrest.Mapping+length) ⇒ <code>Number</code>
    * [.domain()](#ERMrest.Mapping+domain) ⇒ [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column)
    * [.get(fromCol)](#ERMrest.Mapping+get) ⇒ [<code>Column</code>](#ERMrest.Column)
    * [.getFromColumn(toCol)](#ERMrest.Mapping+getFromColumn) ⇒ [<code>Column</code>](#ERMrest.Column)

<a name="new_ERMrest.Mapping_new"></a>

#### new Mapping(from, to)

| Param | Type | Description |
| --- | --- | --- |
| from | [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column) | array of from Columns |
| to | [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column) | array of to Columns |

<a name="ERMrest.Mapping+toString"></a>

#### mapping.toString() ⇒ <code>string</code>
returns string representation of Mapping object

**Kind**: instance method of [<code>Mapping</code>](#ERMrest.Mapping)  
**Returns**: <code>string</code> - string representation of Mapping object  
<a name="ERMrest.Mapping+length"></a>

#### mapping.length() ⇒ <code>Number</code>
**Kind**: instance method of [<code>Mapping</code>](#ERMrest.Mapping)  
**Returns**: <code>Number</code> - number of mapping columns  
<a name="ERMrest.Mapping+domain"></a>

#### mapping.domain() ⇒ [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column)
**Kind**: instance method of [<code>Mapping</code>](#ERMrest.Mapping)  
**Returns**: [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column) - the from columns  
<a name="ERMrest.Mapping+get"></a>

#### mapping.get(fromCol) ⇒ [<code>Column</code>](#ERMrest.Column)
get the mapping column given the from column

**Kind**: instance method of [<code>Mapping</code>](#ERMrest.Mapping)  
**Returns**: [<code>Column</code>](#ERMrest.Column) - mapping column  
**Throws**:

- [<code>NotFoundError</code>](#ERMrest.NotFoundError) no mapping column found


| Param | Type |
| --- | --- |
| fromCol | [<code>Column</code>](#ERMrest.Column) | 

<a name="ERMrest.Mapping+getFromColumn"></a>

#### mapping.getFromColumn(toCol) ⇒ [<code>Column</code>](#ERMrest.Column)
get the mapping column given the to column

**Kind**: instance method of [<code>Mapping</code>](#ERMrest.Mapping)  
**Returns**: [<code>Column</code>](#ERMrest.Column) - mapping column  
**Throws**:

- [<code>NotFoundError</code>](#ERMrest.NotFoundError) no mapping column found


| Param | Type |
| --- | --- |
| toCol | [<code>Column</code>](#ERMrest.Column) | 

<a name="ERMrest.InboundForeignKeys"></a>

### ERMrest.InboundForeignKeys
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.InboundForeignKeys_new"></a>

#### new InboundForeignKeys(table)
holds inbound foreignkeys of a table.


| Param | Type | Description |
| --- | --- | --- |
| table | [<code>Table</code>](#ERMrest.Table) | the table that this object is for |

<a name="ERMrest.ForeignKeys"></a>

### ERMrest.ForeignKeys
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.ForeignKeys](#ERMrest.ForeignKeys)
    * [.all()](#ERMrest.ForeignKeys+all) ⇒ [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
    * [.colsets()](#ERMrest.ForeignKeys+colsets) ⇒ [<code>Array.&lt;ColSet&gt;</code>](#ERMrest.ColSet)
    * [.length()](#ERMrest.ForeignKeys+length) ⇒ <code>Number</code>
    * [.mappings()](#ERMrest.ForeignKeys+mappings) ⇒ [<code>Array.&lt;Mapping&gt;</code>](#ERMrest.Mapping)
    * [.get(colset)](#ERMrest.ForeignKeys+get) ⇒ [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)

<a name="ERMrest.ForeignKeys+all"></a>

#### foreignKeys.all() ⇒ [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
**Kind**: instance method of [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)  
**Returns**: [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef) - an array of all foreign key references  
<a name="ERMrest.ForeignKeys+colsets"></a>

#### foreignKeys.colsets() ⇒ [<code>Array.&lt;ColSet&gt;</code>](#ERMrest.ColSet)
**Kind**: instance method of [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)  
**Returns**: [<code>Array.&lt;ColSet&gt;</code>](#ERMrest.ColSet) - an array of the foreign keys' colsets  
<a name="ERMrest.ForeignKeys+length"></a>

#### foreignKeys.length() ⇒ <code>Number</code>
**Kind**: instance method of [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)  
**Returns**: <code>Number</code> - number of foreign keys  
<a name="ERMrest.ForeignKeys+mappings"></a>

#### foreignKeys.mappings() ⇒ [<code>Array.&lt;Mapping&gt;</code>](#ERMrest.Mapping)
**Kind**: instance method of [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)  
**Returns**: [<code>Array.&lt;Mapping&gt;</code>](#ERMrest.Mapping) - mappings  
<a name="ERMrest.ForeignKeys+get"></a>

#### foreignKeys.get(colset) ⇒ [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
get the foreign key of the given column set

**Kind**: instance method of [<code>ForeignKeys</code>](#ERMrest.ForeignKeys)  
**Returns**: [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef) - foreign key reference of the colset  
**Throws**:

- [<code>NotFoundError</code>](#ERMrest.NotFoundError) foreign key not found


| Param | Type |
| --- | --- |
| colset | [<code>ColSet</code>](#ERMrest.ColSet) | 

<a name="ERMrest.ForeignKeyRef"></a>

### ERMrest.ForeignKeyRef
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.ForeignKeyRef](#ERMrest.ForeignKeyRef)
    * [new ForeignKeyRef(table, jsonFKR)](#new_ERMrest.ForeignKeyRef_new)
    * [.colset](#ERMrest.ForeignKeyRef+colset) : [<code>ColSet</code>](#ERMrest.ColSet)
    * [.key](#ERMrest.ForeignKeyRef+key) : [<code>Key</code>](#ERMrest.Key)
    * [.rights](#ERMrest.ForeignKeyRef+rights) : <code>Object</code>
    * [.mapping](#ERMrest.ForeignKeyRef+mapping) : [<code>Mapping</code>](#ERMrest.Mapping)
    * [.constraint_names](#ERMrest.ForeignKeyRef+constraint_names) : <code>Array</code>
    * [.from_name](#ERMrest.ForeignKeyRef+from_name) : <code>string</code>
    * [.to_name](#ERMrest.ForeignKeyRef+to_name) : <code>string</code>
    * [.ignore](#ERMrest.ForeignKeyRef+ignore) : <code>boolean</code>
    * [.annotations](#ERMrest.ForeignKeyRef+annotations) : [<code>Annotations</code>](#ERMrest.Annotations)
    * [.comment](#ERMrest.ForeignKeyRef+comment) : <code>string</code>
    * [.name](#ERMrest.ForeignKeyRef+name) : <code>string</code>
    * [.simple](#ERMrest.ForeignKeyRef+simple) : <code>Boolean</code>
    * [.toString(reverse, isLeft)](#ERMrest.ForeignKeyRef+toString) ⇒ <code>string</code>
    * [.getDomainValues(limit)](#ERMrest.ForeignKeyRef+getDomainValues) ⇒ <code>Promise</code>

<a name="new_ERMrest.ForeignKeyRef_new"></a>

#### new ForeignKeyRef(table, jsonFKR)

| Param | Type |
| --- | --- |
| table | [<code>Table</code>](#ERMrest.Table) | 
| jsonFKR | <code>Object</code> | 

<a name="ERMrest.ForeignKeyRef+colset"></a>

#### foreignKeyRef.colset : [<code>ColSet</code>](#ERMrest.ColSet)
**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+key"></a>

#### foreignKeyRef.key : [<code>Key</code>](#ERMrest.Key)
find key from referencedCols
use index 0 since all refCols should be of the same schema:table

**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+rights"></a>

#### foreignKeyRef.rights : <code>Object</code>
**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+mapping"></a>

#### foreignKeyRef.mapping : [<code>Mapping</code>](#ERMrest.Mapping)
**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+constraint_names"></a>

#### foreignKeyRef.constraint_names : <code>Array</code>
The exact `names` array in foreign key definition
The constraint names for this foreign key

**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+from_name"></a>

#### foreignKeyRef.from_name : <code>string</code>
**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+to_name"></a>

#### foreignKeyRef.to_name : <code>string</code>
**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+ignore"></a>

#### foreignKeyRef.ignore : <code>boolean</code>
**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+annotations"></a>

#### foreignKeyRef.annotations : [<code>Annotations</code>](#ERMrest.Annotations)
**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+comment"></a>

#### foreignKeyRef.comment : <code>string</code>
Documentation for this foreign key reference

**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+name"></a>

#### foreignKeyRef.name : <code>string</code>
A unique nam that can be used for referring to this foreignkey.

**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+simple"></a>

#### foreignKeyRef.simple : <code>Boolean</code>
Indicates if the foreign key is simple (not composite)

**Kind**: instance property of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
<a name="ERMrest.ForeignKeyRef+toString"></a>

#### foreignKeyRef.toString(reverse, isLeft) ⇒ <code>string</code>
returns string representation of ForeignKeyRef object

**Kind**: instance method of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
**Returns**: <code>string</code> - string representation of ForeignKeyRef object  

| Param | Type | Description |
| --- | --- | --- |
| reverse | <code>boolean</code> | false: returns (keyCol1, keyCol2)=(s:t:FKCol1,FKCol2) true: returns (FKCol1, FKCol2)=(s:t:keyCol1,keyCol2) |
| isLeft | <code>boolean</code> | true: left join, other values: inner join |

<a name="ERMrest.ForeignKeyRef+getDomainValues"></a>

#### foreignKeyRef.getDomainValues(limit) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)  
**Returns**: <code>Promise</code> - promise that returns a rowset of the referenced key's table if resolved or
    [TimedOutError](#ERMrest.TimedOutError), [InternalServerError](#ERMrest.InternalServerError), [ServiceUnavailableError](#ERMrest.ServiceUnavailableError),
    [ConflictError](#ERMrest.ConflictError), [ForbiddenError](#ERMrest.ForbiddenError) or [UnauthorizedError](#ERMrest.UnauthorizedError) if rejected  

| Param | Type |
| --- | --- |
| limit | <code>Number</code> | 

<a name="ERMrest.Type"></a>

### ERMrest.Type
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Type](#ERMrest.Type)
    * [new Type(name)](#new_ERMrest.Type_new)
    * [.name](#ERMrest.Type+name) : <code>string</code>
    * [._isArray](#ERMrest.Type+_isArray) : <code>boolean</code>
    * [._isDomain](#ERMrest.Type+_isDomain) : <code>boolean</code>
    * [.baseType](#ERMrest.Type+baseType) : [<code>Type</code>](#ERMrest.Type)
    * [.rootName](#ERMrest.Type+rootName) : <code>string</code>

<a name="new_ERMrest.Type_new"></a>

#### new Type(name)

| Param |
| --- |
| name | 

<a name="ERMrest.Type+name"></a>

#### type.name : <code>string</code>
**Kind**: instance property of [<code>Type</code>](#ERMrest.Type)  
<a name="ERMrest.Type+_isArray"></a>

#### type._isArray : <code>boolean</code>
Currently used to signal whether there is a base type for this column

**Kind**: instance property of [<code>Type</code>](#ERMrest.Type)  
<a name="ERMrest.Type+_isDomain"></a>

#### type._isDomain : <code>boolean</code>
Currently used to signal whether there is a base type for this column

**Kind**: instance property of [<code>Type</code>](#ERMrest.Type)  
<a name="ERMrest.Type+baseType"></a>

#### type.baseType : [<code>Type</code>](#ERMrest.Type)
**Kind**: instance property of [<code>Type</code>](#ERMrest.Type)  
<a name="ERMrest.Type+rootName"></a>

#### type.rootName : <code>string</code>
The column name of the base. This goes to the first level which
will be a type understandable by database.

**Kind**: instance property of [<code>Type</code>](#ERMrest.Type)  
<a name="ERMrest.ERMrestError"></a>

### ERMrest.ERMrestError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.ERMrestError_new"></a>

#### new ERMrestError(code, status, message, subMessage, redirectPath)

| Param | Type | Description |
| --- | --- | --- |
| code | <code>int</code> | http error code |
| status | <code>string</code> | message status/title in the modal box |
| message | <code>string</code> | main user error message |
| subMessage | <code>string</code> | technical details about the error. Appear in collapsible span in the modal box |
| redirectPath | <code>string</code> | path that would be added to the host to create full redirect link in Chaise |

<a name="ERMrest.TimedOutError"></a>

### ERMrest.TimedOutError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.TimedOutError_new"></a>

#### new TimedOutError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.BadRequestError"></a>

### ERMrest.BadRequestError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.BadRequestError_new"></a>

#### new BadRequestError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.UnauthorizedError"></a>

### ERMrest.UnauthorizedError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.UnauthorizedError_new"></a>

#### new UnauthorizedError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.ForbiddenError"></a>

### ERMrest.ForbiddenError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.ForbiddenError_new"></a>

#### new ForbiddenError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.NotFoundError"></a>

### ERMrest.NotFoundError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.NotFoundError_new"></a>

#### new NotFoundError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.ConflictError"></a>

### ERMrest.ConflictError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.ConflictError_new"></a>

#### new ConflictError(status, message, subMessage)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |
| subMessage | <code>type</code> | technical message returned by http request |

<a name="ERMrest.IntegrityConflictError"></a>

### ERMrest.IntegrityConflictError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.IntegrityConflictError_new"></a>

#### new IntegrityConflictError(status, message, subMessage)
IntegrityConflictError - Return error pertaining to integrity violoation


| Param | Type | Description |
| --- | --- | --- |
| status | <code>type</code> | the network error code |
| message | <code>type</code> | error message |
| subMessage | <code>type</code> | technical message returned by http request |

<a name="ERMrest.DuplicateConflictError"></a>

### ERMrest.DuplicateConflictError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.DuplicateConflictError_new"></a>

#### new DuplicateConflictError(status, message, subMessage)
DuplicateConflictError - Return error pertaining to Duplicate entried


| Param | Type | Description |
| --- | --- | --- |
| status | <code>type</code> | the network error code |
| message | <code>type</code> | error message |
| subMessage | <code>type</code> | technical message returned by http request |

<a name="ERMrest.PreconditionFailedError"></a>

### ERMrest.PreconditionFailedError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.PreconditionFailedError_new"></a>

#### new PreconditionFailedError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.InternalServerError"></a>

### ERMrest.InternalServerError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.InternalServerError_new"></a>

#### new InternalServerError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.ServiceUnavailableError"></a>

### ERMrest.ServiceUnavailableError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.ServiceUnavailableError_new"></a>

#### new ServiceUnavailableError(status, message)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | the network error code |
| message | <code>string</code> | error message |

<a name="ERMrest.InvalidFacetOperatorError"></a>

### ERMrest.InvalidFacetOperatorError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.InvalidFacetOperatorError_new"></a>

#### new InvalidFacetOperatorError(message, path)
An invalid facet operator


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |
| path | <code>string</code> | path for redirectLink |

<a name="ERMrest.InvalidFilterOperatorError"></a>

### ERMrest.InvalidFilterOperatorError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.InvalidFilterOperatorError_new"></a>

#### new InvalidFilterOperatorError(message, path, invalidFilter)
An invalid filter operator


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |
| path | <code>string</code> | path for redirectLink |
| invalidFilter | <code>string</code> | filter that should be removed |

<a name="ERMrest.InvalidInputError"></a>

### ERMrest.InvalidInputError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.InvalidInputError_new"></a>

#### new InvalidInputError(message)
An invalid input


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.MalformedURIError"></a>

### ERMrest.MalformedURIError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.MalformedURIError_new"></a>

#### new MalformedURIError(message)
A malformed URI was passed to the API.


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.NoDataChangedError"></a>

### ERMrest.NoDataChangedError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.NoDataChangedError_new"></a>

#### new NoDataChangedError(message)
no data was changed for update


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.NoConnectionError"></a>

### ERMrest.NoConnectionError
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.NoConnectionError_new"></a>

#### new NoConnectionError(message)
A No Connection or No Internet Connection was passed to the API.


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |

<a name="ERMrest.InvalidSortCriteria"></a>

### ERMrest.InvalidSortCriteria
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.InvalidSortCriteria_new"></a>

#### new InvalidSortCriteria(message, path)
Invalid sorting conditions


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |
| path | <code>string</code> | path for redirectLink |

<a name="ERMrest.InvalidPageCriteria"></a>

### ERMrest.InvalidPageCriteria
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.InvalidPageCriteria_new"></a>

#### new InvalidPageCriteria(message, path)
Invalid page conditions


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | error message |
| path | <code>string</code> | path for redirectLink |

<a name="ERMrest.ParsedFilter"></a>

### ERMrest.ParsedFilter
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

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
**Kind**: instance method of [<code>ParsedFilter</code>](#ERMrest.ParsedFilter)  

| Param | Type | Description |
| --- | --- | --- |
| filters | <code>Array.&lt;ParsedFilter&gt;</code> | array of binary predicate |

<a name="ERMrest.ParsedFilter+setBinaryPredicate"></a>

#### parsedFilter.setBinaryPredicate(colname, operator, value)
**Kind**: instance method of [<code>ParsedFilter</code>](#ERMrest.ParsedFilter)  

| Param | Description |
| --- | --- |
| colname |  |
| operator | '=', '::gt::', '::lt::', etc. |
| value |  |

<a name="ERMrest.Reference"></a>

### ERMrest.Reference
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Reference](#ERMrest.Reference)
    * [new Reference(location, catalog)](#new_ERMrest.Reference_new)
    * [.contextualize](#ERMrest.Reference+contextualize)
    * [.aggregate](#ERMrest.Reference+aggregate) : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
    * [.displayname](#ERMrest.Reference+displayname) : <code>object</code>
    * [.uri](#ERMrest.Reference+uri) : <code>string</code>
    * [.table](#ERMrest.Reference+table) : [<code>Table</code>](#ERMrest.Table)
    * [.projectionTable](#ERMrest.Reference+projectionTable) : [<code>Table</code>](#ERMrest.Table)
    * [.columns](#ERMrest.Reference+columns) : [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)
    * [.facetColumns](#ERMrest.Reference+facetColumns) ⇒ [<code>Array.&lt;FacetColumn&gt;</code>](#ERMrest.FacetColumn)
    * [.location](#ERMrest.Reference+location) ⇒ <code>ERMrest.Location</code>
    * [.isUnique](#ERMrest.Reference+isUnique) : <code>boolean</code>
    * [.canCreate](#ERMrest.Reference+canCreate) : <code>boolean</code> \| <code>undefined</code>
    * [.canRead](#ERMrest.Reference+canRead) : <code>boolean</code> \| <code>undefined</code>
    * [.canUpdate](#ERMrest.Reference+canUpdate) : <code>boolean</code> \| <code>undefined</code>
    * [.canDelete](#ERMrest.Reference+canDelete) : <code>boolean</code> \| <code>undefined</code>
    * [.display](#ERMrest.Reference+display) : <code>Object</code>
    * [.unfilteredReference](#ERMrest.Reference+unfilteredReference) : [<code>Reference</code>](#ERMrest.Reference)
    * [.appLink](#ERMrest.Reference+appLink) : <code>String</code>
    * [.csvDownloadLink](#ERMrest.Reference+csvDownloadLink) ⇒ <code>String</code>
    * [.defaultLogInfo](#ERMrest.Reference+defaultLogInfo) : <code>Object</code>
    * [.removeAllFacetFilters(sameFacet)](#ERMrest.Reference+removeAllFacetFilters) ⇒ <code>ERMrest.reference</code>
    * [.create(data, contextHeaderParams)](#ERMrest.Reference+create) ⇒ <code>Promise</code>
        * [~columnDiff()](#ERMrest.Reference+create..columnDiff)
    * [.read(limit, contextHeaderParams)](#ERMrest.Reference+read) ⇒ <code>Promise</code>
    * [.sort(sort)](#ERMrest.Reference+sort) ⇒ <code>Reference</code>
    * [.update(tuples, contextHeaderParams)](#ERMrest.Reference+update) ⇒ <code>Promise</code>
    * [.delete(contextHeaderParams)](#ERMrest.Reference+delete) ⇒ <code>Promise</code>
        * [~self](#ERMrest.Reference+delete..self)
    * [.related([tuple])](#ERMrest.Reference+related) ⇒ [<code>Array.&lt;Reference&gt;</code>](#ERMrest.Reference)
    * [.search(term)](#ERMrest.Reference+search) ⇒ <code>Reference</code>
    * [.getAggregates(aggregateList)](#ERMrest.Reference+getAggregates) ⇒ <code>Promise</code>
    * [.setSamePaging(page)](#ERMrest.Reference+setSamePaging) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.getColumnByName(name)](#ERMrest.Reference+getColumnByName) ⇒ [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)
    * [.generateColumnsList(tuple)](#ERMrest.Reference+generateColumnsList) ⇒ [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)

<a name="new_ERMrest.Reference_new"></a>

#### new Reference(location, catalog)
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
| catalog | [<code>Catalog</code>](#ERMrest.Catalog) | The catalog object. Since location.catalog is just an id, we need the actual catalog object too. |

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

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+aggregate"></a>

#### reference.aggregate : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+displayname"></a>

#### reference.displayname : <code>object</code>
The display name for this reference.
displayname.isHTML will return true/false
displayname.value has the value

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+uri"></a>

#### reference.uri : <code>string</code>
The string form of the `URI` for this reference.
NOTE: It is not understanable by ermrest, and it also doesn't have the modifiers (sort, page).
Should not be used for sending requests to ermrest, use this.location.ermrestCompactUri instead.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+table"></a>

#### reference.table : [<code>Table</code>](#ERMrest.Table)
The table object for this reference

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+projectionTable"></a>

#### reference.projectionTable : [<code>Table</code>](#ERMrest.Table)
The projection table object,
if there's a join in path, this will return a different object from .table

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+columns"></a>

#### reference.columns : [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)
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

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+facetColumns"></a>

#### reference.facetColumns ⇒ [<code>Array.&lt;FacetColumn&gt;</code>](#ERMrest.FacetColumn)
Facets that should be represented to the user.
Heuristics:
 - All the visible columns in compact context.
 - All the related entities in detailed context.

Usage:
```
 var facets = reference.facetColumns;
 var newRef = reference.facetColumns[0].addChoiceFilters(['value']);
 var newRef2 = newRef.facetColumns[1].addSearchFilter('text 1');
 var newRef3 = newRef2.facetColumns[2].addRangeFilter(1, 2);
 var newRef4 = newRef3.facetColumns[3].removeAllFilters();
 for (var i=0, len=newRef4.facetColumns.length; i<len; i++) {
   var fc = reference.facetColumns[i];
   console.log("Column name:", fc.column.name, "has following facets:", fc.filters);
 }
```

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+location"></a>

#### reference.location ⇒ <code>ERMrest.Location</code>
Location object that has uri of current reference

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
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

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+canCreate"></a>

#### reference.canCreate : <code>boolean</code> \| <code>undefined</code>
Indicates whether the client has the permission to _create_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+canRead"></a>

#### reference.canRead : <code>boolean</code> \| <code>undefined</code>
Indicates whether the client has the permission to _read_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+canUpdate"></a>

#### reference.canUpdate : <code>boolean</code> \| <code>undefined</code>
Indicates whether the client has the permission to _update_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+canDelete"></a>

#### reference.canDelete : <code>boolean</code> \| <code>undefined</code>
Indicates whether the client has the permission to _delete_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+display"></a>

#### reference.display : <code>Object</code>
An object which contains row display properties for this reference.
It is determined based on the `table-display` annotation. It has the
following properties:

  - `rowOrder`: `[{ column: '`_column name_`', descending:` {`true` | `false` } `}`...`]` or `undefined`,
  - `type`: {`'table'` | `'markdown'` | `'module'`} (default: `'table'`)

If type is `'markdown'`, the object will also these additional
properties:

  - `markdownPattern`: markdown pattern,
  - `separator`: markdown pattern (default: newline character `'\n'`),
  - `suffix`: markdown pattern (detaul: empty string `''`),
  - `prefix`: markdown pattern (detaul: empty string `''`)

If type is `'module'`, the object will have these additional
properties:

  - `modulePath`: `'pathsuffix'` (TODO: what is this!?)

Usage :
```
var displayType = reference.display.type; // the displayType
if ( displayType === 'table') {
   // go for default rendering of rows using tuple.values
} else if (displayType === 'markdown') {
   // Use the separator, suffix and prefix values while rendering tuples
   // Tuple will have a "tuple.content" property that will have the actual markdown value
   // derived from row_markdown_pattern after templating and rendering markdown
} else if (displayType ===  'module') {
  // Use modulePath to render the rows
}
```

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+unfilteredReference"></a>

#### reference.unfilteredReference : [<code>Reference</code>](#ERMrest.Reference)
This will generate a new unfiltered reference each time.
Returns a reference that points to all entities of current table

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+appLink"></a>

#### reference.appLink : <code>String</code>
App-specific URL

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
**Throws**:

- <code>Error</code> if `_appLinkFn` is not defined.

<a name="ERMrest.Reference+csvDownloadLink"></a>

#### reference.csvDownloadLink ⇒ <code>String</code>
Returns a uri that will properly generate the download link for a csv document
NOTE It will not have the same sort and paging as the reference.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>String</code> - A string representing the url for direct csv download  
<a name="ERMrest.Reference+defaultLogInfo"></a>

#### reference.defaultLogInfo : <code>Object</code>
The default information that we want to be logged including catalog, schema_table, and facet (filter).

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+removeAllFacetFilters"></a>

#### reference.removeAllFacetFilters(sameFacet) ⇒ <code>ERMrest.reference</code>
Remove all the fitlers from facets

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>ERMrest.reference</code> - A reference without facet filters  

| Param | Type | Description |
| --- | --- | --- |
| sameFacet | <code>boolean</code> | By default we're removing facets, if this is true facets won't be changed. |

<a name="ERMrest.Reference+create"></a>

#### reference.create(data, contextHeaderParams) ⇒ <code>Promise</code>
Creates a set of tuples in the references relation. Note, this
operation sets the `defaults` list according to the table
specification, and not according to the contents of in the input
tuple.

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Promise</code> - A promise resolved with a object containing `successful` and `failure` attributes.
Both are [Page](#ERMrest.Page) of results.
or rejected with any of the following errors:
- [InvalidInputError](#ERMrest.InvalidInputError): If `data` is not valid, or reference is not in `entry/create` context.
- [InvalidInputError](#ERMrest.InvalidInputError): If `limit` is invalid.
- ERMrestjs corresponding http errors, if ERMrest returns http error.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array</code> | The array of data to be created as new tuples. |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.Reference+create..columnDiff"></a>

##### create~columnDiff()
This gets the difference between the two column sets. This is not the _symmetric_ difference.
If minuend is [1,2,3,4,5]
and subtrahend is [4,5,6]
the difference is [1,2,3]
The 6 is ignored because we only want to know what's in the minuend that is not in the subtrahend

**Kind**: inner method of [<code>create</code>](#ERMrest.Reference+create)  
<a name="ERMrest.Reference+read"></a>

#### reference.read(limit, contextHeaderParams) ⇒ <code>Promise</code>
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

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Promise</code> - A promise resolved with [Page](#ERMrest.Page) of results,
or rejected with any of these errors:
- [InvalidInputError](#ERMrest.InvalidInputError): If `limit` is invalid.
- [BadRequestError](#ERMrest.BadRequestError): If asks for sorting based on columns that are not sortable.
- [NotFoundError](#ERMrest.NotFoundError): If asks for sorting based on columns that are not valid.
- ERMrestjs corresponding http errors, if ERMrest returns http error.  

| Param | Type | Description |
| --- | --- | --- |
| limit | <code>number</code> | The limit of results to be returned by the read request. __required__ |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.Reference+sort"></a>

#### reference.sort(sort) ⇒ <code>Reference</code>
Return a new Reference with the new sorting
TODO this should validate the given sort objects,
but I'm not sure how much adding that validation will affect other apis and client

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Reference</code> - A new reference with the new sorting  
**Throws**:

- [InvalidInputError](#ERMrest.InvalidInputError) if `sort` is invalid.


| Param | Type | Description |
| --- | --- | --- |
| sort | <code>Array.&lt;Object&gt;</code> | an array of objects in the format {"column":columname, "descending":true|false} in order of priority. Undfined, null or Empty array to use default sorting. |

<a name="ERMrest.Reference+update"></a>

#### reference.update(tuples, contextHeaderParams) ⇒ <code>Promise</code>
Updates a set of resources.

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Promise</code> - A promise resolved with a object containing `successful` and `failure` attributes.
Both are [Page](#ERMrest.Page) of results.
or rejected with any of these errors:
- [InvalidInputError](#ERMrest.InvalidInputError): If `limit` is invalid or reference is not in `entry/edit` context.
- ERMrestjs corresponding http errors, if ERMrest returns http error.  

| Param | Type | Description |
| --- | --- | --- |
| tuples | <code>Array</code> | array of tuple objects so that the new data nd old data can be used to determine key changes. tuple.data has the new data tuple._oldData has the data before changes were made |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.Reference+delete"></a>

#### reference.delete(contextHeaderParams) ⇒ <code>Promise</code>
Deletes the referenced resources.
NOTE This will ignore the provided sort and paging on the reference, make
sure you are calling this on specific set or rows (filtered).

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Promise</code> - A promise resolved with empty object or rejected with any of these errors:
- ERMrestjs corresponding http errors, if ERMrest returns http error.  

| Param | Type | Description |
| --- | --- | --- |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.Reference+delete..self"></a>

##### delete~self
NOTE: previous implemenation of delete with 412 logic is here:
https://github.com/informatics-isi-edu/ermrestjs/commit/5fe854118337e0a63c6f91b4f3e139e7eadc42ac

We decided to drop the support for 412, because the etag that we get from the read function
is different than the one delete expects. The reason for that is because we are getting etag
in read with joins in the request, which affects the etag. etag is in response to any change
to the returned data and since join introduces extra data it is different than a request
without any joins.

github issue: #425

**Kind**: inner property of [<code>delete</code>](#ERMrest.Reference+delete)  
<a name="ERMrest.Reference+related"></a>

#### reference.related([tuple]) ⇒ [<code>Array.&lt;Reference&gt;</code>](#ERMrest.Reference)
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

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  

| Param | Type | Description |
| --- | --- | --- |
| [tuple] | [<code>Tuple</code>](#ERMrest.Tuple) | the current tuple |

<a name="ERMrest.Reference+search"></a>

#### reference.search(term) ⇒ <code>Reference</code>
create a new reference with the new search
by copying this reference and clears previous search filters
search term can be:
a) A string with no space: single term or regular expression
b) A single term with space using ""
c) use space for conjunction of terms

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Reference</code> - A new reference with the new search  
**Throws**:

- [InvalidInputError](#ERMrest.InvalidInputError) if `term` is invalid.


| Param | Type | Description |
| --- | --- | --- |
| term | <code>string</code> | search term, undefined to clear search |

<a name="ERMrest.Reference+getAggregates"></a>

#### reference.getAggregates(aggregateList) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Promise</code> - - Promise contains an array of the aggregate values in the same order as the supplied aggregate list  

| Param | Type | Description |
| --- | --- | --- |
| aggregateList | [<code>Array.&lt;ColumnAggregateFn&gt;</code>](#ERMrest.ColumnAggregateFn) | list of aggregate functions to apply to GET uri |

<a name="ERMrest.Reference+setSamePaging"></a>

#### reference.setSamePaging(page) ⇒ [<code>Reference</code>](#ERMrest.Reference)
Given a page, will change the reference paging options (before, and after)
to match the page.
NOTE: Limitations:
- Current reference's table and page's table must be the same.
- page's reference cannot have any facets (apart from search).

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - reference with new page settings.  

| Param | Type |
| --- | --- |
| page | [<code>Page</code>](#ERMrest.Page) | 

<a name="ERMrest.Reference+getColumnByName"></a>

#### reference.getColumnByName(name) ⇒ [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)
Find a column given its name. It will search in this order:
1. Visible columns
2. Table columns
3. search by constraint name in visible foreignkey and keys (backward compatibility)
Will throw an error if

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of column |

<a name="ERMrest.Reference+generateColumnsList"></a>

#### reference.generateColumnsList(tuple) ⇒ [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)
Generates the list of visible columns
The logic is as follows:

1. check if visible-column annotation is present for this context, go through the list,
     1.1 if it's an array,
         1.1.1 find the corresponding foreign key
         1.1.2 avoid duplicate foreign keys.
         1.1.3 make sure it is not hidden(+).
         1.1.4 if it's outbound foreign key, create a pseudo-column for that.
         1.1.5 if it's inbound foreign key, create the related reference and a pseudo-column based on that.
     1.2 otherwise find the corresponding column if exits and add it (avoid duplicate),
         apply *addColumn* heuristics explained below.

2.otherwise go through list of table columns
     2.0 create a pseudo-column for key if context is not detailed, entry, entry/create, or entry/edit and we have key that is notnull and notHTML
     2.1 check if column has not been processed before.
     2.2 hide the columns that are part of origFKR.
     2.3 if column is serial and part of a simple key hide it.
     2.4 if it's not part of any foreign keys
         apply *addColumn* heuristics explained below.
     2.5 go through all of the foreign keys that this column is part of.
         2.5.1 make sure it is not hidden(+).
         2.5.2 if it's simple fk, just create PseudoColumn
         2.5.3 otherwise add the column just once and append just one PseudoColumn (avoid duplicate)

*addColumn* heuristics:
 + If column doesn't have asset annotation or its type is not `text`, add a normal ReferenceColumn.
 + Otherwise:
     + If it has `url_pattern`: add AssetPseudoColumn.
     + Otherwise:
         - in entry context: remove it from the visible columns list.
         - in other contexts: ignore the asset annotation, treat it as normal column.

NOTE:
 + If asset annotation was used and context is entry,
     we should remove the columns that are used as filename, byte, sha256, or md5.
 + If this reference is actually an inbound related reference,
     we should hide the foreign key (and all of its columns) that created the link.

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn) - Array of [ReferenceColumn](#ERMrest.ReferenceColumn).  

| Param | Type | Description |
| --- | --- | --- |
| tuple | [<code>Tuple</code>](#ERMrest.Tuple) | the data for the current refe |

<a name="ERMrest.Page"></a>

### ERMrest.Page
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Page](#ERMrest.Page)
    * [new Page(reference, etag, data, hasPrevious, hasNext, extraData)](#new_ERMrest.Page_new)
    * [.reference](#ERMrest.Page+reference) : [<code>Reference</code>](#ERMrest.Reference)
    * [.tuples](#ERMrest.Page+tuples) : [<code>Array.&lt;Tuple&gt;</code>](#ERMrest.Tuple)
    * [.hasPrevious](#ERMrest.Page+hasPrevious) ⇒ <code>boolean</code>
    * [.previous](#ERMrest.Page+previous) : [<code>Reference</code>](#ERMrest.Reference) \| <code>undefined</code>
    * [.hasNext](#ERMrest.Page+hasNext) ⇒ <code>boolean</code>
    * [.next](#ERMrest.Page+next) : [<code>Reference</code>](#ERMrest.Reference) \| <code>undefined</code>
    * [.content](#ERMrest.Page+content) : <code>string</code> \| <code>null</code>

<a name="new_ERMrest.Page_new"></a>

#### new Page(reference, etag, data, hasPrevious, hasNext, extraData)
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
| reference | [<code>Reference</code>](#ERMrest.Reference) | The reference object from which this data was acquired. |
| etag | <code>String</code> | The etag from the reference object that produced this page |
| data | <code>Array.&lt;Object&gt;</code> | The data returned from ERMrest. |
| hasPrevious | <code>boolean</code> | Whether there is more data before this Page |
| hasNext | <code>boolean</code> | Whether there is more data after this Page |
| extraData | <code>Object</code> | if |

<a name="ERMrest.Page+reference"></a>

#### page.reference : [<code>Reference</code>](#ERMrest.Reference)
The page's associated reference.

**Kind**: instance property of [<code>Page</code>](#ERMrest.Page)  
<a name="ERMrest.Page+tuples"></a>

#### page.tuples : [<code>Array.&lt;Tuple&gt;</code>](#ERMrest.Tuple)
An array of processed tuples. The results will be processed
according to the contextualized scheme (model) of this reference.

Usage:
```
for (var i=0, len=page.tuples.length; i<len; i++) {
  var tuple = page.tuples[i];
  console.log("Tuple:", tuple.displayname.value, "has values:", tuple.values);
}
```

**Kind**: instance property of [<code>Page</code>](#ERMrest.Page)  
<a name="ERMrest.Page+hasPrevious"></a>

#### page.hasPrevious ⇒ <code>boolean</code>
Whether there is more entities before this page

**Kind**: instance property of [<code>Page</code>](#ERMrest.Page)  
<a name="ERMrest.Page+previous"></a>

#### page.previous : [<code>Reference</code>](#ERMrest.Reference) \| <code>undefined</code>
A reference to the previous set of results.
Will return null if the sortObject of reference is missing or is invalid

Usage:
```
if (reference.previous) {
  // more tuples in the 'previous' direction are available
  reference.previous.read(10).then(
    ...
  );
}
```

**Kind**: instance property of [<code>Page</code>](#ERMrest.Page)  
<a name="ERMrest.Page+hasNext"></a>

#### page.hasNext ⇒ <code>boolean</code>
Whether there is more entities after this page

**Kind**: instance property of [<code>Page</code>](#ERMrest.Page)  
<a name="ERMrest.Page+next"></a>

#### page.next : [<code>Reference</code>](#ERMrest.Reference) \| <code>undefined</code>
A reference to the next set of results.
Will return null if the sortObject of reference is missing or is invalid

Usage:
```
if (reference.next) {
  // more tuples in the 'next' direction are available
  reference.next.read(10).then(
    ...
  );
}
```

**Kind**: instance property of [<code>Page</code>](#ERMrest.Page)  
<a name="ERMrest.Page+content"></a>

#### page.content : <code>string</code> \| <code>null</code>
HTML representation of the whole page which uses table-display annotation.
If markdownPattern is defined then renderTemplate is called to get the correct display.
In case of no such markdownPattern is defined output is displayed in form of
unordered list with displayname as text content of the list.
For more info you can refer {ERM.reference.display}

Usage:
```
var content = page.content;
if (content) {
   console.log(content);
}
```

**Kind**: instance property of [<code>Page</code>](#ERMrest.Page)  
<a name="ERMrest.Tuple"></a>

### ERMrest.Tuple
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.Tuple](#ERMrest.Tuple)
    * [new Tuple(reference, page, data)](#new_ERMrest.Tuple_new)
    * [.reference](#ERMrest.Tuple+reference) ⇒ [<code>Reference</code>](#ERMrest.Reference) \| <code>\*</code>
    * [.page](#ERMrest.Tuple+page) ⇒ [<code>Page</code>](#ERMrest.Page) \| <code>\*</code>
    * [.linkedData](#ERMrest.Tuple+linkedData) : <code>Object</code>
    * [.data](#ERMrest.Tuple+data) : <code>Object</code>
    * [.data](#ERMrest.Tuple+data)
    * [.canUpdate](#ERMrest.Tuple+canUpdate) : <code>boolean</code> \| <code>undefined</code>
    * [.canDelete](#ERMrest.Tuple+canDelete) : <code>boolean</code> \| <code>undefined</code>
    * [.values](#ERMrest.Tuple+values) : <code>Array.&lt;string&gt;</code>
    * [.isHTML](#ERMrest.Tuple+isHTML) : <code>Array.&lt;boolean&gt;</code>
    * [.displayname](#ERMrest.Tuple+displayname) : <code>string</code>
    * [.uniqueId](#ERMrest.Tuple+uniqueId) : <code>string</code>
    * [.update()](#ERMrest.Tuple+update) ⇒ <code>Promise</code>
    * [.delete()](#ERMrest.Tuple+delete) ⇒ <code>Promise</code>
    * [.getAssociationRef()](#ERMrest.Tuple+getAssociationRef) : [<code>Reference</code>](#ERMrest.Reference)
    * [.copy()](#ERMrest.Tuple+copy) ⇒ [<code>Tuple</code>](#ERMrest.Tuple)

<a name="new_ERMrest.Tuple_new"></a>

#### new Tuple(reference, page, data)
Constructs a new Tuple. In database jargon, a tuple is a row in a
relation. This object represents a row returned by a query to ERMrest.

Usage:
 Clients _do not_ directly access this constructor.
 See [tuples](#ERMrest.Page+tuples).


| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>Reference</code>](#ERMrest.Reference) | The reference object from which this data was acquired. |
| page | [<code>Page</code>](#ERMrest.Page) | The Page object from which this data was acquired. |
| data | <code>Object</code> | The unprocessed tuple of data returned from ERMrest. |

<a name="ERMrest.Tuple+reference"></a>

#### tuple.reference ⇒ [<code>Reference</code>](#ERMrest.Reference) \| <code>\*</code>
This is the reference of the Tuple

**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) \| <code>\*</code> - reference of the Tuple  
<a name="ERMrest.Tuple+page"></a>

#### tuple.page ⇒ [<code>Page</code>](#ERMrest.Page) \| <code>\*</code>
This is the page of the Tuple

**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  
**Returns**: [<code>Page</code>](#ERMrest.Page) \| <code>\*</code> - page of the Tuple  
<a name="ERMrest.Tuple+linkedData"></a>

#### tuple.linkedData : <code>Object</code>
Foreign key data.
During the read we get extra information about the foreign keys,
client could use these extra information for different purposes.
One of these usecases is domain_filter_pattern which they can
include foreignkey data in the pattern language.

**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  
<a name="ERMrest.Tuple+data"></a>

#### tuple.data : <code>Object</code>
Used for getting the current set of data for the reference.
This stores the original data in the _oldData object to preserve
it before any changes are made and those values can be properly
used in update requests.

Notably, if a key value is changed, the old value needs to be kept
track of so that the column projections for the uri can be properly created
and both the old and new value for the modified key are submitted together
for proper updating.

**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  
<a name="ERMrest.Tuple+data"></a>

#### tuple.data
**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | the data to be updated |

<a name="ERMrest.Tuple+canUpdate"></a>

#### tuple.canUpdate : <code>boolean</code> \| <code>undefined</code>
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

**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  
<a name="ERMrest.Tuple+canDelete"></a>

#### tuple.canDelete : <code>boolean</code> \| <code>undefined</code>
Indicates whether the client can delete this tuple. Because
some policies may be undecidable until query execution, this
property may also be `undefined`.

See [canUpdate](#ERMrest.Tuple+canUpdate) for a usage example.

**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  
<a name="ERMrest.Tuple+values"></a>

#### tuple.values : <code>Array.&lt;string&gt;</code>
The array of formatted/raw values of this tuple on basis of context "edit".
The ordering of the values in the array matches the ordering of the columns
in the reference (see [columns](#ERMrest.Reference+columns)).

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

**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  
<a name="ERMrest.Tuple+isHTML"></a>

#### tuple.isHTML : <code>Array.&lt;boolean&gt;</code>
The array of boolean values of this tuple speicifying the value is HTML or not. The ordering of the
values in the array matches the ordering of the columns in the
reference (see [columns](#ERMrest.Reference+columns)).

Usage (iterating over all values in the tuple):
```
for (var i=0; len=reference.columns.length; i<len; i++) {
  console.log(tuple.displayname, tuple.isHTML[i] ? " has an HTML value" : " does not has an HTML value");
}
```

**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  
<a name="ERMrest.Tuple+displayname"></a>

#### tuple.displayname : <code>string</code>
The _display name_ of this tuple. For example, if this tuple is a
row from a table, then the display name is defined by the
row_markdown_pattern annotation for the _row name_ context
or by the heuristics (title, name, id(text), SHORTESTKEY Concatenation using ':')

Usage:
```
console.log("This tuple has a displayable name of ", tuple.displayname.value);
```

**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  
<a name="ERMrest.Tuple+uniqueId"></a>

#### tuple.uniqueId : <code>string</code>
The unique identifier for this tuple composed of the values for each
of the shortest key columns concatenated together by an '_'

**Kind**: instance property of [<code>Tuple</code>](#ERMrest.Tuple)  
<a name="ERMrest.Tuple+update"></a>

#### tuple.update() ⇒ <code>Promise</code>
Attempts to update this tuple. This is a server side transaction,
and therefore an asynchronous operation that returns a promise.

**Kind**: instance method of [<code>Tuple</code>](#ERMrest.Tuple)  
**Returns**: <code>Promise</code> - a promise (TBD the result object)  
<a name="ERMrest.Tuple+delete"></a>

#### tuple.delete() ⇒ <code>Promise</code>
Attempts to delete this tuple. This is a server side transaction,
and therefore an asynchronous operation that returns a promise.

**Kind**: instance method of [<code>Tuple</code>](#ERMrest.Tuple)  
**Returns**: <code>Promise</code> - a promise (TBD the result object)  
<a name="ERMrest.Tuple+getAssociationRef"></a>

#### tuple.getAssociationRef() : [<code>Reference</code>](#ERMrest.Reference)
If the Tuple is derived from an association related table,
this function will return a reference to the corresponding
entity of this tuple's association table.

For example, assume
Table1(K1,C1) <- AssocitaitonTable(FK1, FK2) -> Table2(K2,C2)
and current tuple is from Table2 with k2 = "2".
With origFKRData = {"k1": "1"} this function will return a reference
to AssocitaitonTable with FK1 = "1"" and FK2 = "2".

**Kind**: instance method of [<code>Tuple</code>](#ERMrest.Tuple)  
<a name="ERMrest.Tuple+copy"></a>

#### tuple.copy() ⇒ [<code>Tuple</code>](#ERMrest.Tuple)
This function takes the current Tuple (this) and creates a shallow copy of it while de-referencing
the _data attribute. This way _data can be modified in chaise without changing the originating Tuple

**Kind**: instance method of [<code>Tuple</code>](#ERMrest.Tuple)  
**Returns**: [<code>Tuple</code>](#ERMrest.Tuple) - a shallow copy of _this_ tuple with it's _data de-referenced  
<a name="ERMrest.ReferenceAggregateFn"></a>

### ERMrest.ReferenceAggregateFn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.ReferenceAggregateFn](#ERMrest.ReferenceAggregateFn)
    * [new ReferenceAggregateFn()](#new_ERMrest.ReferenceAggregateFn_new)
    * [.countAgg](#ERMrest.ReferenceAggregateFn+countAgg) : <code>Object</code>

<a name="new_ERMrest.ReferenceAggregateFn_new"></a>

#### new ReferenceAggregateFn()
Constructs an Aggregate Funciton object

Reference Aggregate Functions is a collection of available aggregates for the
particular Reference (count for the table). Each aggregate should return the string
representation for querying that information.

Usage:
 Clients _do not_ directly access this constructor. ERMrest.Reference will
 access this constructor for purposes of fetching aggregate data about the table.

<a name="ERMrest.ReferenceAggregateFn+countAgg"></a>

#### referenceAggregateFn.countAgg : <code>Object</code>
count aggregate representation

**Kind**: instance property of [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)  
<a name="ERMrest.ReferenceColumn"></a>

### ERMrest.ReferenceColumn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.ReferenceColumn](#ERMrest.ReferenceColumn)
    * [new ReferenceColumn(reference, baseCols)](#new_ERMrest.ReferenceColumn_new)
    * [.isPseudo](#ERMrest.ReferenceColumn+isPseudo) : <code>boolean</code>
    * [.table](#ERMrest.ReferenceColumn+table) : [<code>Table</code>](#ERMrest.Table)
    * [.name](#ERMrest.ReferenceColumn+name) : <code>string</code>
    * [.displayname](#ERMrest.ReferenceColumn+displayname) : <code>object</code>
    * [.type](#ERMrest.ReferenceColumn+type) : [<code>Type</code>](#ERMrest.Type)
    * [.nullok](#ERMrest.ReferenceColumn+nullok) : <code>Boolean</code>
    * [.default](#ERMrest.ReferenceColumn+default) : <code>string</code>
    * [.aggregate](#ERMrest.ReferenceColumn+aggregate) : [<code>ColumnAggregateFn</code>](#ERMrest.ColumnAggregateFn)
    * [.groupAggregate](#ERMrest.ReferenceColumn+groupAggregate) : [<code>ColumnGroupAggregateFn</code>](#ERMrest.ColumnGroupAggregateFn)
    * [.comment](#ERMrest.ReferenceColumn+comment) : <code>string</code>
    * [.inputDisabled](#ERMrest.ReferenceColumn+inputDisabled) : <code>boolean</code> \| <code>object</code>
    * [.sortable](#ERMrest.ReferenceColumn+sortable) : <code>boolean</code>
    * [.formatvalue(data, context)](#ERMrest.ReferenceColumn+formatvalue) ⇒ <code>string</code>
    * [.formatPresentation(data, context, options)](#ERMrest.ReferenceColumn+formatPresentation) ⇒ <code>Object</code>
    * [.getInputDisabled()](#ERMrest.ReferenceColumn+getInputDisabled) : <code>boolean</code> \| <code>object</code>

<a name="new_ERMrest.ReferenceColumn_new"></a>

#### new ReferenceColumn(reference, baseCols)
Constructor for ReferenceColumn. This class is a wrapper for [Column](#ERMrest.Column).


| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>Reference</code>](#ERMrest.Reference) | column's reference |
| baseCols | [<code>Array.&lt;Column&gt;</code>](#ERMrest.Column) | List of columns that this reference-column will be created based on. |

<a name="ERMrest.ReferenceColumn+isPseudo"></a>

#### referenceColumn.isPseudo : <code>boolean</code>
indicates that this object represents a Column.

**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+table"></a>

#### referenceColumn.table : [<code>Table</code>](#ERMrest.Table)
**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+name"></a>

#### referenceColumn.name : <code>string</code>
name of the column.

**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+displayname"></a>

#### referenceColumn.displayname : <code>object</code>
name of the column.

**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+type"></a>

#### referenceColumn.type : [<code>Type</code>](#ERMrest.Type)
**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+nullok"></a>

#### referenceColumn.nullok : <code>Boolean</code>
**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+default"></a>

#### referenceColumn.default : <code>string</code>
Returns the default value

**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+aggregate"></a>

#### referenceColumn.aggregate : [<code>ColumnAggregateFn</code>](#ERMrest.ColumnAggregateFn)
Returns the aggregate function object

**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+groupAggregate"></a>

#### referenceColumn.groupAggregate : [<code>ColumnGroupAggregateFn</code>](#ERMrest.ColumnGroupAggregateFn)
Returns the aggregate group object

**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+comment"></a>

#### referenceColumn.comment : <code>string</code>
Documentation for this reference-column

**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+inputDisabled"></a>

#### referenceColumn.inputDisabled : <code>boolean</code> \| <code>object</code>
Indicates if the input should be disabled
true: input must be disabled
false:  input can be enabled
object: input msut be disabled (show .message to user)

**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+sortable"></a>

#### referenceColumn.sortable : <code>boolean</code>
Heuristics are as follows:

(first applicable rule from top to bottom)
- multiple columns -> disable sort.
- single column:
 - column_order defined -> use it.
 - use column actual value.

**Kind**: instance property of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.ReferenceColumn+formatvalue"></a>

#### referenceColumn.formatvalue(data, context) ⇒ <code>string</code>
Formats a value corresponding to this reference-column definition.

**Kind**: instance method of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
**Returns**: <code>string</code> - The formatted value.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | The 'raw' data value. |
| context | <code>String</code> | the context of app |

<a name="ERMrest.ReferenceColumn+formatPresentation"></a>

#### referenceColumn.formatPresentation(data, context, options) ⇒ <code>Object</code>
Formats the presentation value corresponding to this reference-column definition.

**Kind**: instance method of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
**Returns**: <code>Object</code> - A key value pair containing value and isHTML that detemrines the presentation.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | In case of pseudocolumn it's the raw data, otherwise'formatted' data value. |
| context | <code>String</code> | the app context |
| options | <code>Object</code> | includes `context` and `formattedValues` |

<a name="ERMrest.ReferenceColumn+getInputDisabled"></a>

#### referenceColumn.getInputDisabled() : <code>boolean</code> \| <code>object</code>
Indicates if the input should be disabled, in different contexts
true: input must be disabled
false:  input can be enabled
object: input msut be disabled (show .message to user)
TODO should be removed in favor of inputDisabled

**Kind**: instance method of [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)  
<a name="ERMrest.PseudoColumn"></a>

### ERMrest.PseudoColumn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.PseudoColumn](#ERMrest.PseudoColumn)
    * [new PseudoColumn(reference, column, facetObject, name, mainTuple)](#new_ERMrest.PseudoColumn_new)
    * [.isPseudo](#ERMrest.PseudoColumn+isPseudo) : <code>boolean</code>
    * [.displayname](#ERMrest.PseudoColumn+displayname) : <code>Object</code>
    * [.isUnique](#ERMrest.PseudoColumn+isUnique) : <code>boolean</code>
    * [.isEntityMode](#ERMrest.PseudoColumn+isEntityMode) : <code>boolean</code>
    * [.key](#ERMrest.PseudoColumn+key) : <code>boolean</code>
    * [.hasPath](#ERMrest.PseudoColumn+hasPath) : <code>boolean</code>
    * [.foreignKeys](#ERMrest.PseudoColumn+foreignKeys) : [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
    * [.hasAggregate](#ERMrest.PseudoColumn+hasAggregate) : <code>boolean</code>
    * [.reference](#ERMrest.PseudoColumn+reference) : [<code>Reference</code>](#ERMrest.Reference)
    * [.formatPresentation(data, context, options)](#ERMrest.PseudoColumn+formatPresentation) ⇒ <code>Object</code>
    * [.getAggregatedValue(page, contextHeaderParams)](#ERMrest.PseudoColumn+getAggregatedValue) ⇒ <code>Promise</code>

<a name="new_ERMrest.PseudoColumn_new"></a>

#### new PseudoColumn(reference, column, facetObject, name, mainTuple)
If you want to create an object of this type, use the `module._createPseudoColumn` method.
This will only be used for general purpose pseudo-columns, using that method ensures That
we're creating the more specific object instead. Therefore only these cases should
be using this type of object:
1. When sourceObject has aggregate
2. When sourceObject has a path that is not just an outbound fk, or it doesn't define a related
entity (inbound or p&b association)


| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>Reference</code>](#ERMrest.Reference) | column's reference |
| column | [<code>Column</code>](#ERMrest.Column) | the column that this pseudo-column is representing |
| facetObject | <code>object</code> | the whole column object |
| name | <code>string</code> | to avoid processing the name again, this might be undefined. |
| mainTuple | [<code>Tuple</code>](#ERMrest.Tuple) | if the reference is referring to just one tuple, this is defined. |

<a name="ERMrest.PseudoColumn+isPseudo"></a>

#### pseudoColumn.isPseudo : <code>boolean</code>
indicates that this object represents a PseudoColumn.

**Kind**: instance property of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  
<a name="ERMrest.PseudoColumn+displayname"></a>

#### pseudoColumn.displayname : <code>Object</code>
The displayname that should be used for this column.
It will return the first applicable rule:
1. markdown_name that is defined on the sourceObject.
2. if aggregate use the {function} col_displayname.
3. In entity mode, return the table's displayname.
4. In scalar return the column's displayname.

**Kind**: instance property of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  
<a name="ERMrest.PseudoColumn+isUnique"></a>

#### pseudoColumn.isUnique : <code>boolean</code>
If the pseudoColumn is referring to a unique row (the path is one to one)

**Kind**: instance property of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  
<a name="ERMrest.PseudoColumn+isEntityMode"></a>

#### pseudoColumn.isEntityMode : <code>boolean</code>
If the pseudoColumn is in entity mode
This includes columns without path too.

**Kind**: instance property of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  
<a name="ERMrest.PseudoColumn+key"></a>

#### pseudoColumn.key : <code>boolean</code>
If the pseudoColumn is in entity mode will return the key that this column represents

**Kind**: instance property of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  
<a name="ERMrest.PseudoColumn+hasPath"></a>

#### pseudoColumn.hasPath : <code>boolean</code>
If the pseudo-column is connected via a path to the table or not.

**Kind**: instance property of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  
<a name="ERMrest.PseudoColumn+foreignKeys"></a>

#### pseudoColumn.foreignKeys : [<code>Array.&lt;ForeignKeyRef&gt;</code>](#ERMrest.ForeignKeyRef)
List of foreignkeys on the path

**Kind**: instance property of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  
<a name="ERMrest.PseudoColumn+hasAggregate"></a>

#### pseudoColumn.hasAggregate : <code>boolean</code>
If aggregate function is defined on the column.

**Kind**: instance property of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  
<a name="ERMrest.PseudoColumn+reference"></a>

#### pseudoColumn.reference : [<code>Reference</code>](#ERMrest.Reference)
Returns a reference to the current pseudo-column
TODO needs to be changed when we get to use it. Currently this is how it behaves:
1. If pseudo-column has no path, it will return the base reference.
2. If pseudo-column has path, and is inbound fk, or p&bA, apply the same logic as _generateRelatedReference
3. Otherwise if mainTuple is available, use that to generate list of facets.
4. Otherwise return the reference without any facet or filters (TODO needs to change eventually)

**Kind**: instance property of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  
<a name="ERMrest.PseudoColumn+formatPresentation"></a>

#### pseudoColumn.formatPresentation(data, context, options) ⇒ <code>Object</code>
Format the presentation value corresponding to this pseudo-column definition.
1. If source is not in entity mode: use the column's heuristic
2. Otherwise if it's not a path, apply the same logic as KeyPseudoColumn presentation based on the key.
2. Otherwise if path is one to one (all outbound), use the same logic as ForeignKeyPseudoColumn based on last fk.
3. Otherwise return null value.

**Kind**: instance method of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  
**Returns**: <code>Object</code> - A key value pair containing value and isHTML that detemrines the presentation.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | In case of pseudocolumn it's the raw data, otherwise'formatted' data value. |
| context | <code>String</code> | the app context |
| options | <code>Object</code> | include `formattedValues` |

<a name="ERMrest.PseudoColumn+getAggregatedValue"></a>

#### pseudoColumn.getAggregatedValue(page, contextHeaderParams) ⇒ <code>Promise</code>
Returns a promise that gets resolved with list of aggregated values in the same
order of tuples of the page that is passed.

**Kind**: instance method of [<code>PseudoColumn</code>](#ERMrest.PseudoColumn)  

| Param | Type | Description |
| --- | --- | --- |
| page | [<code>Page</code>](#ERMrest.Page) | the page object of main (current) refernece |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.ForeignKeyPseudoColumn"></a>

### ERMrest.ForeignKeyPseudoColumn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.ForeignKeyPseudoColumn](#ERMrest.ForeignKeyPseudoColumn)
    * [new ForeignKeyPseudoColumn(reference, fk)](#new_ERMrest.ForeignKeyPseudoColumn_new)
    * [.isPseudo](#ERMrest.ForeignKeyPseudoColumn+isPseudo) : <code>boolean</code>
    * [.isForeignKey](#ERMrest.ForeignKeyPseudoColumn+isForeignKey) : <code>boolean</code>
    * [.reference](#ERMrest.ForeignKeyPseudoColumn+reference) : [<code>Reference</code>](#ERMrest.Reference)
    * [.foreignKey](#ERMrest.ForeignKeyPseudoColumn+foreignKey) : [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)
    * [.defaultValues](#ERMrest.ForeignKeyPseudoColumn+defaultValues) : <code>Object</code>
    * [.defaultReference](#ERMrest.ForeignKeyPseudoColumn+defaultReference) : <code>ERMrest.Refernece</code>
    * [.filteredRef(column, data)](#ERMrest.ForeignKeyPseudoColumn+filteredRef) ⇒ [<code>Reference</code>](#ERMrest.Reference)

<a name="new_ERMrest.ForeignKeyPseudoColumn_new"></a>

#### new ForeignKeyPseudoColumn(reference, fk)
Constructor for ForeignKeyPseudoColumn. This class is a wrapper for [ForeignKeyRef](#ERMrest.ForeignKeyRef).
This class extends the [ReferenceColumn](#ERMrest.ReferenceColumn)


| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>Reference</code>](#ERMrest.Reference) | column's reference |
| fk | [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef) | the foreignkey |

<a name="ERMrest.ForeignKeyPseudoColumn+isPseudo"></a>

#### foreignKeyPseudoColumn.isPseudo : <code>boolean</code>
indicates that this object represents a PseudoColumn.

**Kind**: instance property of [<code>ForeignKeyPseudoColumn</code>](#ERMrest.ForeignKeyPseudoColumn)  
<a name="ERMrest.ForeignKeyPseudoColumn+isForeignKey"></a>

#### foreignKeyPseudoColumn.isForeignKey : <code>boolean</code>
Indicates that this ReferenceColumn is a Foreign key.

**Kind**: instance property of [<code>ForeignKeyPseudoColumn</code>](#ERMrest.ForeignKeyPseudoColumn)  
<a name="ERMrest.ForeignKeyPseudoColumn+reference"></a>

#### foreignKeyPseudoColumn.reference : [<code>Reference</code>](#ERMrest.Reference)
The reference object that represents the table of this PseudoColumn

**Kind**: instance property of [<code>ForeignKeyPseudoColumn</code>](#ERMrest.ForeignKeyPseudoColumn)  
<a name="ERMrest.ForeignKeyPseudoColumn+foreignKey"></a>

#### foreignKeyPseudoColumn.foreignKey : [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)
The Foreign key object that this PseudoColumn is created based on

**Kind**: instance property of [<code>ForeignKeyPseudoColumn</code>](#ERMrest.ForeignKeyPseudoColumn)  
<a name="ERMrest.ForeignKeyPseudoColumn+defaultValues"></a>

#### foreignKeyPseudoColumn.defaultValues : <code>Object</code>
returns the raw default values of the constituent columns.

**Kind**: instance property of [<code>ForeignKeyPseudoColumn</code>](#ERMrest.ForeignKeyPseudoColumn)  
<a name="ERMrest.ForeignKeyPseudoColumn+defaultReference"></a>

#### foreignKeyPseudoColumn.defaultReference : <code>ERMrest.Refernece</code>
returns a reference using raw default values of the constituent columns.

**Kind**: instance property of [<code>ForeignKeyPseudoColumn</code>](#ERMrest.ForeignKeyPseudoColumn)  
<a name="ERMrest.ForeignKeyPseudoColumn+filteredRef"></a>

#### foreignKeyPseudoColumn.filteredRef(column, data) ⇒ [<code>Reference</code>](#ERMrest.Reference)
This function takes in a tuple and generates a reference that is
constrained based on the domain_filter_pattern annotation. If thisx
annotation doesn't exist, it returns this (reference)
`this` is the same as column.reference

**Kind**: instance method of [<code>ForeignKeyPseudoColumn</code>](#ERMrest.ForeignKeyPseudoColumn)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - the constrained reference  

| Param | Type | Description |
| --- | --- | --- |
| column | [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn) | column that `this` is based on |
| data | <code>Object</code> | tuple data with potential constraints |

<a name="ERMrest.KeyPseudoColumn"></a>

### ERMrest.KeyPseudoColumn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.KeyPseudoColumn](#ERMrest.KeyPseudoColumn)
    * [new KeyPseudoColumn(reference, key)](#new_ERMrest.KeyPseudoColumn_new)
    * [.isPseudo](#ERMrest.KeyPseudoColumn+isPseudo) : <code>boolean</code>
    * [.isKey](#ERMrest.KeyPseudoColumn+isKey) : <code>boolean</code>
    * [.key](#ERMrest.KeyPseudoColumn+key) : [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)
    * [.formatPresentation(data, context, options)](#ERMrest.KeyPseudoColumn+formatPresentation) ⇒ <code>Object</code>

<a name="new_ERMrest.KeyPseudoColumn_new"></a>

#### new KeyPseudoColumn(reference, key)
Constructor for KeyPseudoColumn. This class is a wrapper for [Key](#ERMrest.Key).
This class extends the [ReferenceColumn](#ERMrest.ReferenceColumn)


| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>Reference</code>](#ERMrest.Reference) | column's reference |
| key | [<code>Key</code>](#ERMrest.Key) | the key |

<a name="ERMrest.KeyPseudoColumn+isPseudo"></a>

#### keyPseudoColumn.isPseudo : <code>boolean</code>
indicates that this object represents a PseudoColumn.

**Kind**: instance property of [<code>KeyPseudoColumn</code>](#ERMrest.KeyPseudoColumn)  
<a name="ERMrest.KeyPseudoColumn+isKey"></a>

#### keyPseudoColumn.isKey : <code>boolean</code>
Indicates that this ReferenceColumn is a key.

**Kind**: instance property of [<code>KeyPseudoColumn</code>](#ERMrest.KeyPseudoColumn)  
<a name="ERMrest.KeyPseudoColumn+key"></a>

#### keyPseudoColumn.key : [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)
The Foreign key object that this PseudoColumn is created based on

**Kind**: instance property of [<code>KeyPseudoColumn</code>](#ERMrest.KeyPseudoColumn)  
<a name="ERMrest.KeyPseudoColumn+formatPresentation"></a>

#### keyPseudoColumn.formatPresentation(data, context, options) ⇒ <code>Object</code>
Return the value that should be presented for this column.
It usually is a self-link to the given row of data.

The following is the logic:
1. if the key data is not present, return null.
2. Otherwise if key has markdown pattern, return it.
3. Otherwise try to generate the value in `col1:col2` format. if it resulted in empty string return null.
   - If any of the constituent columnhas markdown don't add self-link, otherwise add the self-link.

**Kind**: instance method of [<code>KeyPseudoColumn</code>](#ERMrest.KeyPseudoColumn)  
**Returns**: <code>Object</code> - A key value pair containing value and isHTML that detemrines the presentation.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | given raw data for the table columns |
| context | <code>String</code> | the app context |
| options | <code>Object</code> | might include `formattedValues` |

<a name="ERMrest.AssetPseudoColumn"></a>

### ERMrest.AssetPseudoColumn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| urlPattern | <code>string</code> | A desired upload location can be derived by Pattern Expansion on pattern. |
| filenameColumn | [<code>Column</code>](#ERMrest.Column) \| <code>null</code> | if it's string, then it is the name of column we want to store filename inside of it. |
| byteCountColumn | [<code>Column</code>](#ERMrest.Column) \| <code>null</code> | if it's string, then it is the name of column we want to store byte count inside of it. |
| md5 | [<code>Column</code>](#ERMrest.Column) \| <code>boolean</code> \| <code>null</code> | if it's string, then it is the name of column we want to store md5 inside of it. If it's true, that means we must use md5. |
| sha256 | [<code>Column</code>](#ERMrest.Column) \| <code>boolean</code> \| <code>null</code> | if it's string, then it is the name of column we want to store sha256 inside of it. If it's true, that means we must use sha256. |
| filenameExtFilter | <code>Array.&lt;string&gt;</code> \| <code>null</code> | set of filename extension filters for use by upload agents to indicate to the user the acceptable filename patterns. |


* [.AssetPseudoColumn](#ERMrest.AssetPseudoColumn)
    * [new AssetPseudoColumn(reference, column)](#new_ERMrest.AssetPseudoColumn_new)
    * [.isPseudo](#ERMrest.AssetPseudoColumn+isPseudo) : <code>boolean</code>
    * [.isAsset](#ERMrest.AssetPseudoColumn+isAsset) : <code>boolean</code>
    * [.urlPattern](#ERMrest.AssetPseudoColumn+urlPattern) : <code>ERMrest.Refernece</code>
    * [.filenameColumn](#ERMrest.AssetPseudoColumn+filenameColumn) : [<code>Column</code>](#ERMrest.Column)
    * [.filenameColumn](#ERMrest.AssetPseudoColumn+filenameColumn) : [<code>Column</code>](#ERMrest.Column)
    * [.md5](#ERMrest.AssetPseudoColumn+md5) : [<code>Column</code>](#ERMrest.Column)
    * [.sha256](#ERMrest.AssetPseudoColumn+sha256) : [<code>Column</code>](#ERMrest.Column)
    * [.filenameExtFilter](#ERMrest.AssetPseudoColumn+filenameExtFilter) : [<code>Column</code>](#ERMrest.Column)
    * [._determineInputDisabled(context)](#ERMrest.AssetPseudoColumn+_determineInputDisabled) ⇒ <code>boolean</code> \| <code>object</code>

<a name="new_ERMrest.AssetPseudoColumn_new"></a>

#### new AssetPseudoColumn(reference, column)
Constructor for AssetPseudoColumn.
This class is a wrapper for [Column](#ERMrest.Column) objects that have asset annotation.
This class extends the [ReferenceColumn](#ERMrest.ReferenceColumn)


| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>Reference</code>](#ERMrest.Reference) | column's reference |
| column | [<code>Column</code>](#ERMrest.Column) | the asset column |

<a name="ERMrest.AssetPseudoColumn+isPseudo"></a>

#### assetPseudoColumn.isPseudo : <code>boolean</code>
indicates that this object represents a PseudoColumn.

**Kind**: instance property of [<code>AssetPseudoColumn</code>](#ERMrest.AssetPseudoColumn)  
<a name="ERMrest.AssetPseudoColumn+isAsset"></a>

#### assetPseudoColumn.isAsset : <code>boolean</code>
Indicates that this ReferenceColumn is an asset.

**Kind**: instance property of [<code>AssetPseudoColumn</code>](#ERMrest.AssetPseudoColumn)  
<a name="ERMrest.AssetPseudoColumn+urlPattern"></a>

#### assetPseudoColumn.urlPattern : <code>ERMrest.Refernece</code>
Returns the url_pattern defined in the annotation (the raw value and not computed).

**Kind**: instance property of [<code>AssetPseudoColumn</code>](#ERMrest.AssetPseudoColumn)  
<a name="ERMrest.AssetPseudoColumn+filenameColumn"></a>

#### assetPseudoColumn.filenameColumn : [<code>Column</code>](#ERMrest.Column)
The column object that filename is stored in.

**Kind**: instance property of [<code>AssetPseudoColumn</code>](#ERMrest.AssetPseudoColumn)  
<a name="ERMrest.AssetPseudoColumn+filenameColumn"></a>

#### assetPseudoColumn.filenameColumn : [<code>Column</code>](#ERMrest.Column)
The column object that filename is stored in.

**Kind**: instance property of [<code>AssetPseudoColumn</code>](#ERMrest.AssetPseudoColumn)  
<a name="ERMrest.AssetPseudoColumn+md5"></a>

#### assetPseudoColumn.md5 : [<code>Column</code>](#ERMrest.Column)
The column object that md5 hash is stored in.

**Kind**: instance property of [<code>AssetPseudoColumn</code>](#ERMrest.AssetPseudoColumn)  
<a name="ERMrest.AssetPseudoColumn+sha256"></a>

#### assetPseudoColumn.sha256 : [<code>Column</code>](#ERMrest.Column)
The column object that sha256 hash is stored in.

**Kind**: instance property of [<code>AssetPseudoColumn</code>](#ERMrest.AssetPseudoColumn)  
<a name="ERMrest.AssetPseudoColumn+filenameExtFilter"></a>

#### assetPseudoColumn.filenameExtFilter : [<code>Column</code>](#ERMrest.Column)
The column object that file extension is stored in.

**Kind**: instance property of [<code>AssetPseudoColumn</code>](#ERMrest.AssetPseudoColumn)  
<a name="ERMrest.AssetPseudoColumn+_determineInputDisabled"></a>

#### assetPseudoColumn._determineInputDisabled(context) ⇒ <code>boolean</code> \| <code>object</code>
If url_pattern is invalid or browser_upload=false the input will be disabled.

**Kind**: instance method of [<code>AssetPseudoColumn</code>](#ERMrest.AssetPseudoColumn)  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>string</code> | the context |

<a name="ERMrest.InboundForeignKeyPseudoColumn"></a>

### ERMrest.InboundForeignKeyPseudoColumn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.InboundForeignKeyPseudoColumn](#ERMrest.InboundForeignKeyPseudoColumn)
    * [new InboundForeignKeyPseudoColumn(reference, fk)](#new_ERMrest.InboundForeignKeyPseudoColumn_new)
    * [.reference](#ERMrest.InboundForeignKeyPseudoColumn+reference) : [<code>Reference</code>](#ERMrest.Reference)
    * [.table](#ERMrest.InboundForeignKeyPseudoColumn+table) : [<code>Table</code>](#ERMrest.Table)
    * [.foreignKey](#ERMrest.InboundForeignKeyPseudoColumn+foreignKey) : [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)
    * [.isPseudo](#ERMrest.InboundForeignKeyPseudoColumn+isPseudo) : <code>boolean</code>
    * [.isInboundForeignKey](#ERMrest.InboundForeignKeyPseudoColumn+isInboundForeignKey) : <code>boolean</code>

<a name="new_ERMrest.InboundForeignKeyPseudoColumn_new"></a>

#### new InboundForeignKeyPseudoColumn(reference, fk)
Constructor for InboundForeignKeyPseudoColumn. This class is a wrapper for [ForeignKeyRef](#ERMrest.ForeignKeyRef).
This is a bit different than the [ForeignKeyPseudoColumn](#ERMrest.ForeignKeyPseudoColumn), as that was for foreign keys
of current table. This wrapper is for inbound foreignkeys. It is actually warpping the whole reference (table).

This class extends the [ReferenceColumn](#ERMrest.ReferenceColumn)


| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>Reference</code>](#ERMrest.Reference) | column's reference |
| fk | [<code>Reference</code>](#ERMrest.Reference) | the foreignkey |

<a name="ERMrest.InboundForeignKeyPseudoColumn+reference"></a>

#### inboundForeignKeyPseudoColumn.reference : [<code>Reference</code>](#ERMrest.Reference)
The reference that can be used to get the data for this pseudo-column

**Kind**: instance property of [<code>InboundForeignKeyPseudoColumn</code>](#ERMrest.InboundForeignKeyPseudoColumn)  
<a name="ERMrest.InboundForeignKeyPseudoColumn+table"></a>

#### inboundForeignKeyPseudoColumn.table : [<code>Table</code>](#ERMrest.Table)
The table that this pseudo-column represents

**Kind**: instance property of [<code>InboundForeignKeyPseudoColumn</code>](#ERMrest.InboundForeignKeyPseudoColumn)  
<a name="ERMrest.InboundForeignKeyPseudoColumn+foreignKey"></a>

#### inboundForeignKeyPseudoColumn.foreignKey : [<code>ForeignKeyRef</code>](#ERMrest.ForeignKeyRef)
The [ForeignKeyRef](#ERMrest.ForeignKeyRef) that this pseudo-column is based on.

**Kind**: instance property of [<code>InboundForeignKeyPseudoColumn</code>](#ERMrest.InboundForeignKeyPseudoColumn)  
<a name="ERMrest.InboundForeignKeyPseudoColumn+isPseudo"></a>

#### inboundForeignKeyPseudoColumn.isPseudo : <code>boolean</code>
indicates that this object represents a PseudoColumn.

**Kind**: instance property of [<code>InboundForeignKeyPseudoColumn</code>](#ERMrest.InboundForeignKeyPseudoColumn)  
<a name="ERMrest.InboundForeignKeyPseudoColumn+isInboundForeignKey"></a>

#### inboundForeignKeyPseudoColumn.isInboundForeignKey : <code>boolean</code>
Indicates that this ReferenceColumn is an inbound foreign key.

**Kind**: instance property of [<code>InboundForeignKeyPseudoColumn</code>](#ERMrest.InboundForeignKeyPseudoColumn)  
<a name="ERMrest.FacetColumn"></a>

### ERMrest.FacetColumn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.FacetColumn](#ERMrest.FacetColumn)
    * [new FacetColumn(reference, index, column, facetObject, filters)](#new_ERMrest.FacetColumn_new)
    * [._column](#ERMrest.FacetColumn+_column) : [<code>Column</code>](#ERMrest.Column)
    * [.reference](#ERMrest.FacetColumn+reference) : [<code>Reference</code>](#ERMrest.Reference)
    * [.index](#ERMrest.FacetColumn+index) : <code>int</code>
    * [.dataSource](#ERMrest.FacetColumn+dataSource) : <code>obj</code> \| <code>string</code>
    * [.filters](#ERMrest.FacetColumn+filters)
    * [.isOpen](#ERMrest.FacetColumn+isOpen) : <code>Boolean</code>
    * [.preferredMode](#ERMrest.FacetColumn+preferredMode) : <code>string</code>
    * [.isEntityMode](#ERMrest.FacetColumn+isEntityMode) : <code>Boolean</code>
    * [.barPlot](#ERMrest.FacetColumn+barPlot) : <code>Boolean</code>
    * [.histogramBucketCount](#ERMrest.FacetColumn+histogramBucketCount) : <code>Integer</code>
    * [.column](#ERMrest.FacetColumn+column) : [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)
    * [.sourceReference](#ERMrest.FacetColumn+sourceReference) : [<code>Reference</code>](#ERMrest.Reference)
    * [.displayname](#ERMrest.FacetColumn+displayname) : <code>object</code>
    * [.comment](#ERMrest.FacetColumn+comment) : <code>string</code>
    * [.hasNotNullFilter](#ERMrest.FacetColumn+hasNotNullFilter) : <code>Boolean</code>
    * [.searchFilters](#ERMrest.FacetColumn+searchFilters) : <code>Array.&lt;ERMREst.SearchFacetFilter&gt;</code>
    * [.choiceFilters](#ERMrest.FacetColumn+choiceFilters) : <code>Array.&lt;ERMREst.ChoiceFacetFilter&gt;</code>
    * [.rangeFilters](#ERMrest.FacetColumn+rangeFilters) : <code>Array.&lt;ERMREst.RangeFacetFilter&gt;</code>
    * [.getChoiceDisplaynames()](#ERMrest.FacetColumn+getChoiceDisplaynames) ⇒ <code>Promise</code>
    * [.toJSON()](#ERMrest.FacetColumn+toJSON) ⇒ <code>Object</code>
    * [._setFilters(json)](#ERMrest.FacetColumn+_setFilters)
    * [.addSearchFilter(term)](#ERMrest.FacetColumn+addSearchFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.addChoiceFilters()](#ERMrest.FacetColumn+addChoiceFilters) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.replaceAllChoiceFilters()](#ERMrest.FacetColumn+replaceAllChoiceFilters) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.removeChoiceFilters(terms)](#ERMrest.FacetColumn+removeChoiceFilters) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.addRangeFilter(min, max)](#ERMrest.FacetColumn+addRangeFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.removeRangeFilter(min, max)](#ERMrest.FacetColumn+removeRangeFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.addNotNullFilter()](#ERMrest.FacetColumn+addNotNullFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.removeNotNullFilter()](#ERMrest.FacetColumn+removeNotNullFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.removeAllFilters()](#ERMrest.FacetColumn+removeAllFilters) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.removeFilter(index)](#ERMrest.FacetColumn+removeFilter) ⇒ [<code>Reference</code>](#ERMrest.Reference)

<a name="new_ERMrest.FacetColumn_new"></a>

#### new FacetColumn(reference, index, column, facetObject, filters)
Represent facet columns that are available.
NOTE:
Based on facets JSON structure we can have joins that result in facets
on columns that are not part of reference column.

TODO This is just experimental, the arguments might change eventually.

If the ReferenceColumn is not provided, then the FacetColumn is for reference


| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>Reference</code>](#ERMrest.Reference) | the reference that this FacetColumn blongs to. |
| index | <code>int</code> | The index of this FacetColumn in the list of facetColumns |
| column | [<code>Column</code>](#ERMrest.Column) | the column that filters will be based on. |
| facetObject | <code>object</code> | The filter object that this FacetColumn will be created based on |
| filters | [<code>Array.&lt;FacetFilter&gt;</code>](#ERMrest.FacetFilter) | Array of filters |

<a name="ERMrest.FacetColumn+_column"></a>

#### facetColumn._column : [<code>Column</code>](#ERMrest.Column)
The column object that the filters are based on

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+reference"></a>

#### facetColumn.reference : [<code>Reference</code>](#ERMrest.Reference)
The reference that this facet blongs to

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+index"></a>

#### facetColumn.index : <code>int</code>
The index of facetColumn in the list of facetColumns
NOTE: Might not be needed

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+dataSource"></a>

#### facetColumn.dataSource : <code>obj</code> \| <code>string</code>
A valid data-source path
NOTE: we're not validating this data-source, we assume that this is valid.

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+filters"></a>

#### facetColumn.filters
Filters that are applied to this facet.

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
**Type{facetfilter[]}**:   
<a name="ERMrest.FacetColumn+isOpen"></a>

#### facetColumn.isOpen : <code>Boolean</code>
If has filters it will return true,
otherwise returns facetObject['open']

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+preferredMode"></a>

#### facetColumn.preferredMode : <code>string</code>
The Preferred ux mode.
Any of:
`choices`, `ranges`, or `search`
This should be used if we're not in entity mode.

1. use ux_mode if available
2. use choices if in entity mode
3. use range or chocies based on type.

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+isEntityMode"></a>

#### facetColumn.isEntityMode : <code>Boolean</code>
Returns true if the source is on a key column.
If facetObject['entity'] is defined as false, it will return false,
otherwise it will true if filter is based on key.

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+barPlot"></a>

#### facetColumn.barPlot : <code>Boolean</code>
Returns true if the plotly histogram graph should be shown in the UI
If _facetObject.barPlot is not defined, the value is true. By default
the histogram should be shown unless specified otherwise

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+histogramBucketCount"></a>

#### facetColumn.histogramBucketCount : <code>Integer</code>
Returns the value of `barPlot.nBins` if it was defined as part of the
`facetObject` in the annotation. If undefined, the default # of buckets is 30

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+column"></a>

#### facetColumn.column : [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)
ReferenceColumn that this facetColumn is based on

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+sourceReference"></a>

#### facetColumn.sourceReference : [<code>Reference</code>](#ERMrest.Reference)
uncontextualized [Reference](#ERMrest.Reference) that has all the joins specified
in the source with all the filters of other FacetColumns in the reference.

NOTE needs refactoring,
This should return a reference that referes to the current column's table
having filters from other facetcolumns.
We should not use the absolute path for the table and it must be a path
from main to this table. Because if we use the absolute path we're completely
ignoring the constraints that the main table will add to this reference.
(For example if maximum possible value for this column is 100 but there's
no data from the main that will leads to this maximum.)

Consider the following scenario:
Table T has two foreignkeys to R1 (fk1), R2 (fk2), and R3 (fk3).
R1 has a fitler for term=1, and R2 has a filter for term=2
Then the source reference for R3 will be the following:
T:=S:T/(fk1)/term=1/$T/(fk2)/term2/$T/M:=(fk3)
As you can see it has all the filters of the main table + join to current table.

NOTE: assumptions:
 - The main reference has no join.
 - The returned reference has problem with faceting (cannot show faceting).

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+displayname"></a>

#### facetColumn.displayname : <code>object</code>
Returns the displayname object that should be used for this facetColumn.
TODO the heuristics should be changed to be aligned with PseudoColumn
Heuristics are as follows (first applicable rule):
 0. If markdown_name is defined, use it.
 1. If column is part of the main table (there's no join), use the column's displayname.
 2. If last foreignkey is outbound and has to_name, use it.
 3. If last foreignkey is inbound and has from_name, use it.
 4. Otherwise use the table name.
   - If it's in `scalar` mode, append the column name. `table_name (column_name)`.

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+comment"></a>

#### facetColumn.comment : <code>string</code>
Could be used as tooltip to provide more information about the facetColumn

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+hasNotNullFilter"></a>

#### facetColumn.hasNotNullFilter : <code>Boolean</code>
Returns true if the not-null filter exists.

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+searchFilters"></a>

#### facetColumn.searchFilters : <code>Array.&lt;ERMREst.SearchFacetFilter&gt;</code>
search filters
NOTE ASSUMES that filters is immutable

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+choiceFilters"></a>

#### facetColumn.choiceFilters : <code>Array.&lt;ERMREst.ChoiceFacetFilter&gt;</code>
choce filters
NOTE ASSUMES that filters is immutable

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+rangeFilters"></a>

#### facetColumn.rangeFilters : <code>Array.&lt;ERMREst.RangeFacetFilter&gt;</code>
range filters
NOTE ASSUMES that filters is immutable

**Kind**: instance property of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+getChoiceDisplaynames"></a>

#### facetColumn.getChoiceDisplaynames() ⇒ <code>Promise</code>
When presenting the applied choice filters, the displayname might be differnt from the value.
This only happens in case of entity-picker. Othercases we can just return the list of fitleres as is.
In case of entity-picker, we should get the displayname of the choices.
Therefore heuristic is as follows:
 - If no fitler -> resolve with empty list.
 - If in scalar mode -> resolve with list of filters (don't change their displaynames.)
 - Otherwise (entity-mode) -> generate an ermrest request to get the displaynames.

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
**Returns**: <code>Promise</code> - A promise resolved with list of objects that have `uniqueId`, and `displayname`.  
<a name="ERMrest.FacetColumn+toJSON"></a>

#### facetColumn.toJSON() ⇒ <code>Object</code>
Return JSON presentation of the filters. This will be used in the location.
Anything that we want to leak to the url should be here.
It will be in the following format:

```
{
   "source": <data-source>,
   "choices": [v, ...],
   "ranges": [{"min": v1, "max": v2}, ...],
   "search": [v, ...],
   "not_null": true
}
```

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+_setFilters"></a>

#### facetColumn._setFilters(json)
Given an object will create list of filters.

NOTE: if we have not_null, other filters except =null are not relevant.
That means if we saw not_null:
1. If =null exist, then set the filters to empty array.
2. otherwise set the filter to just the not_null

Expected object format format:
```
{
   "source": <data-source>,
   "choices": [v, ...],
   "ranges": [{"min": v1, "max": v2}, ...],
   "search": [v, ...],
   "not_null": true
}
```

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  

| Param | Type | Description |
| --- | --- | --- |
| json | <code>Object</code> | JSON representation of filters |

<a name="ERMrest.FacetColumn+addSearchFilter"></a>

#### facetColumn.addSearchFilter(term) ⇒ [<code>Reference</code>](#ERMrest.Reference)
Create a new Reference with appending a new Search filter to current FacetColumn

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - the Reference with the new filter  

| Param | Type | Description |
| --- | --- | --- |
| term | <code>String</code> | the term for search |

<a name="ERMrest.FacetColumn+addChoiceFilters"></a>

#### facetColumn.addChoiceFilters() ⇒ [<code>Reference</code>](#ERMrest.Reference)
Create a new Reference with appending a list of choice filters to current FacetColumn

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - the reference with the new filter  
<a name="ERMrest.FacetColumn+replaceAllChoiceFilters"></a>

#### facetColumn.replaceAllChoiceFilters() ⇒ [<code>Reference</code>](#ERMrest.Reference)
Create a new Reference with replacing choice facet filters by the given input
This will also remove NotNullFacetFilter

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - the reference with the new filter  
<a name="ERMrest.FacetColumn+removeChoiceFilters"></a>

#### facetColumn.removeChoiceFilters(terms) ⇒ [<code>Reference</code>](#ERMrest.Reference)
Given a term, it will remove any choice filter with that term (if any).

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - the reference with the new filter  

| Param | Type | Description |
| --- | --- | --- |
| terms | <code>Array.&lt;String&gt;</code> \| <code>Array.&lt;int&gt;</code> | array of terms |

<a name="ERMrest.FacetColumn+addRangeFilter"></a>

#### facetColumn.addRangeFilter(min, max) ⇒ [<code>Reference</code>](#ERMrest.Reference)
Create a new Reference with appending a new range filter to current FacetColumn

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - the reference with the new filter  

| Param | Type | Description |
| --- | --- | --- |
| min | <code>String</code> \| <code>int</code> | minimum value. Can be null or undefined. |
| max | <code>String</code> \| <code>int</code> | maximum value. Can be null or undefined. |

<a name="ERMrest.FacetColumn+removeRangeFilter"></a>

#### facetColumn.removeRangeFilter(min, max) ⇒ [<code>Reference</code>](#ERMrest.Reference)
Create a new Reference with removing any range filter that has the given min and max combination.

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - the reference with the new filter  

| Param | Type | Description |
| --- | --- | --- |
| min | <code>String</code> \| <code>int</code> | minimum value. Can be null or undefined. |
| max | <code>String</code> \| <code>int</code> | maximum value. Can be null or undefined. |

<a name="ERMrest.FacetColumn+addNotNullFilter"></a>

#### facetColumn.addNotNullFilter() ⇒ [<code>Reference</code>](#ERMrest.Reference)
Create a new Reference with removing all the filters and adding a not-null filter.
NOTE based on current usecases this is currently removing all the previous filters.
We might need to change this behavior in the future. I could change the behavior of
this function to only add the filter, and then in the client first remove all and thenadd
addNotNullFilter, but since the code is not very optimized that would result on a heavy
operation.

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+removeNotNullFilter"></a>

#### facetColumn.removeNotNullFilter() ⇒ [<code>Reference</code>](#ERMrest.Reference)
Create a new Reference without any filters.

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
<a name="ERMrest.FacetColumn+removeAllFilters"></a>

#### facetColumn.removeAllFilters() ⇒ [<code>Reference</code>](#ERMrest.Reference)
Create a new Reference by removing all the filters from current facet.

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - the reference with the new filter  
<a name="ERMrest.FacetColumn+removeFilter"></a>

#### facetColumn.removeFilter(index) ⇒ [<code>Reference</code>](#ERMrest.Reference)
Create a new Reference by removing a filter from current facet.

**Kind**: instance method of [<code>FacetColumn</code>](#ERMrest.FacetColumn)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - the reference with the new filter  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>int</code> | index of element that we want to remove from list |

<a name="ERMrest.FacetFilter"></a>

### ERMrest.FacetFilter
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.FacetFilter](#ERMrest.FacetFilter)
    * [new FacetFilter(term)](#new_ERMrest.FacetFilter_new)
    * [.toString()](#ERMrest.FacetFilter+toString) ⇒ <code>string</code>
    * [.toJSON()](#ERMrest.FacetFilter+toJSON) ⇒ <code>string</code>

<a name="new_ERMrest.FacetFilter_new"></a>

#### new FacetFilter(term)
Represent filters that can be applied to facet


| Param | Type | Description |
| --- | --- | --- |
| term | <code>String</code> \| <code>int</code> | the valeu of filter |

<a name="ERMrest.FacetFilter+toString"></a>

#### facetFilter.toString() ⇒ <code>string</code>
String representation of filter

**Kind**: instance method of [<code>FacetFilter</code>](#ERMrest.FacetFilter)  
<a name="ERMrest.FacetFilter+toJSON"></a>

#### facetFilter.toJSON() ⇒ <code>string</code>
JSON representation of filter

**Kind**: instance method of [<code>FacetFilter</code>](#ERMrest.FacetFilter)  
<a name="ERMrest.SearchFacetFilter"></a>

### ERMrest.SearchFacetFilter
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.SearchFacetFilter_new"></a>

#### new SearchFacetFilter(term)
Represent search filters that can be applied to facet.
JSON representation of this filter:
"search": [v1, ...]

Extends [FacetFilter](#ERMrest.FacetFilter).


| Param | Type | Description |
| --- | --- | --- |
| term | <code>String</code> \| <code>int</code> | the valeu of filter |

<a name="ERMrest.ChoiceFacetFilter"></a>

### ERMrest.ChoiceFacetFilter
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.ChoiceFacetFilter_new"></a>

#### new ChoiceFacetFilter(term)
Represent choice filters that can be applied to facet.
JSON representation of this filter:
"choices": [v1, ...]

Extends [FacetFilter](#ERMrest.FacetFilter).


| Param | Type | Description |
| --- | --- | --- |
| term | <code>String</code> \| <code>int</code> | the valeu of filter |

<a name="ERMrest.RangeFacetFilter"></a>

### ERMrest.RangeFacetFilter
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.RangeFacetFilter](#ERMrest.RangeFacetFilter)
    * [new RangeFacetFilter(min, max)](#new_ERMrest.RangeFacetFilter_new)
    * [.toString()](#ERMrest.RangeFacetFilter+toString) ⇒ <code>string</code>
    * [.toJSON()](#ERMrest.RangeFacetFilter+toJSON) ⇒ <code>Object</code>

<a name="new_ERMrest.RangeFacetFilter_new"></a>

#### new RangeFacetFilter(min, max)
Represent range filters that can be applied to facet.
JSON representation of this filter:
"ranges": [{min: v1, max: v2}]

Extends [FacetFilter](#ERMrest.FacetFilter).


| Param | Type |
| --- | --- |
| min | <code>String</code> \| <code>int</code> | 
| max | <code>String</code> \| <code>int</code> | 

<a name="ERMrest.RangeFacetFilter+toString"></a>

#### rangeFacetFilter.toString() ⇒ <code>string</code>
String representation of range filter. With the format of:

- both min and max defined: `{{min}}-{{max}}`
- only min defined: `> {{min}}`
- only max defined: `< {{max}}`

**Kind**: instance method of [<code>RangeFacetFilter</code>](#ERMrest.RangeFacetFilter)  
<a name="ERMrest.RangeFacetFilter+toJSON"></a>

#### rangeFacetFilter.toJSON() ⇒ <code>Object</code>
JSON representation of range filter.

**Kind**: instance method of [<code>RangeFacetFilter</code>](#ERMrest.RangeFacetFilter)  
<a name="ERMrest.NotNullFacetFilter"></a>

### ERMrest.NotNullFacetFilter
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.NotNullFacetFilter_new"></a>

#### new NotNullFacetFilter()
Represents not_null filter.
It doesn't have the same toJSON and toString functions, since
the only thing that client would need is question of existence of this type of filter.

<a name="ERMrest.ColumnAggregateFn"></a>

### ERMrest.ColumnAggregateFn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.ColumnAggregateFn](#ERMrest.ColumnAggregateFn)
    * [new ColumnAggregateFn(column)](#new_ERMrest.ColumnAggregateFn_new)
    * [.minAgg](#ERMrest.ColumnAggregateFn+minAgg) : <code>Object</code>
    * [.maxAgg](#ERMrest.ColumnAggregateFn+maxAgg) : <code>Object</code>
    * [.countNotNullAgg](#ERMrest.ColumnAggregateFn+countNotNullAgg) : <code>Object</code>
    * [.countDistinctAgg](#ERMrest.ColumnAggregateFn+countDistinctAgg) : <code>Object</code>

<a name="new_ERMrest.ColumnAggregateFn_new"></a>

#### new ColumnAggregateFn(column)
Constructs an Aggregate Function object

Column Aggregate Functions is a collection of available aggregates for the
particular ReferenceColumn (min, max, count not null, and count distinct for it's column).
Each aggregate should return the string representation for querying for that information.

Usage:
 Clients _do not_ directly access this constructor. ERMrest.ReferenceColumn
 will access this constructor for purposes of fetching aggregate data
 for a specific column


| Param | Type | Description |
| --- | --- | --- |
| column | [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn) | the column that is used for creating column aggregates |

<a name="ERMrest.ColumnAggregateFn+minAgg"></a>

#### columnAggregateFn.minAgg : <code>Object</code>
minimum aggregate representation

**Kind**: instance property of [<code>ColumnAggregateFn</code>](#ERMrest.ColumnAggregateFn)  
<a name="ERMrest.ColumnAggregateFn+maxAgg"></a>

#### columnAggregateFn.maxAgg : <code>Object</code>
maximum aggregate representation

**Kind**: instance property of [<code>ColumnAggregateFn</code>](#ERMrest.ColumnAggregateFn)  
<a name="ERMrest.ColumnAggregateFn+countNotNullAgg"></a>

#### columnAggregateFn.countNotNullAgg : <code>Object</code>
not null count aggregate representation

**Kind**: instance property of [<code>ColumnAggregateFn</code>](#ERMrest.ColumnAggregateFn)  
<a name="ERMrest.ColumnAggregateFn+countDistinctAgg"></a>

#### columnAggregateFn.countDistinctAgg : <code>Object</code>
distinct count aggregate representation

**Kind**: instance property of [<code>ColumnAggregateFn</code>](#ERMrest.ColumnAggregateFn)  
<a name="ERMrest.ColumnGroupAggregateFn"></a>

### ERMrest.ColumnGroupAggregateFn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.ColumnGroupAggregateFn](#ERMrest.ColumnGroupAggregateFn)
    * [new ColumnGroupAggregateFn(column)](#new_ERMrest.ColumnGroupAggregateFn_new)
    * [.entityValues](#ERMrest.ColumnGroupAggregateFn+entityValues) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
    * [.entityCounts](#ERMrest.ColumnGroupAggregateFn+entityCounts) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
    * [.histogram(bucketCount, min, max)](#ERMrest.ColumnGroupAggregateFn+histogram) ⇒ [<code>BucketAttributeGroupReference</code>](#ERMrest.BucketAttributeGroupReference)

<a name="new_ERMrest.ColumnGroupAggregateFn_new"></a>

#### new ColumnGroupAggregateFn(column)
Can be used to access group aggregate functions.
Usage:
 Clients _do not_ directly access this constructor. ERMrest.ReferenceColumn
 will access this constructor for purposes of fetching grouped aggregate data
 for a specific column


| Param | Type | Description |
| --- | --- | --- |
| column | [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn) | The column that is used for creating grouped aggregate |

<a name="ERMrest.ColumnGroupAggregateFn+entityValues"></a>

#### columnGroupAggregateFn.entityValues : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
Will return an appropriate reference which can be used to show distinct values of an entity
NOTE: Will create a new reference by each call.

**Kind**: instance property of [<code>ColumnGroupAggregateFn</code>](#ERMrest.ColumnGroupAggregateFn)  
<a name="ERMrest.ColumnGroupAggregateFn+entityCounts"></a>

#### columnGroupAggregateFn.entityCounts : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
Will return an appropriate reference which can be used to show distinct values and their counts
The result is based on shortest key of the parent table. If we have join
in the path, we are counting the shortest key of the parent table (not the end table).
NOTE: Will create a new reference by each call.

**Kind**: instance property of [<code>ColumnGroupAggregateFn</code>](#ERMrest.ColumnGroupAggregateFn)  
<a name="ERMrest.ColumnGroupAggregateFn+histogram"></a>

#### columnGroupAggregateFn.histogram(bucketCount, min, max) ⇒ [<code>BucketAttributeGroupReference</code>](#ERMrest.BucketAttributeGroupReference)
Given number of buckets, min and max will return bin of results.
The result is based on shortest key of the parent table. If we have join
in the path, we are creating the histogram based on shortest key of the
parent table (not the end table).

**Kind**: instance method of [<code>ColumnGroupAggregateFn</code>](#ERMrest.ColumnGroupAggregateFn)  

| Param | Type | Description |
| --- | --- | --- |
| bucketCount | <code>int</code> | number of buckets |
| min | <code>int</code> | minimum value |
| max | <code>int</code> | maximum value |

<a name="ERMrest.AttributeGroupReference"></a>

### ERMrest.AttributeGroupReference
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.AttributeGroupReference](#ERMrest.AttributeGroupReference)
    * [new AttributeGroupReference(keyColumns, aggregateColumns, location, catalog)](#new_ERMrest.AttributeGroupReference_new)
    * [._keyColumns](#ERMrest.AttributeGroupReference+_keyColumns) : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
    * [._aggregateColumns](#ERMrest.AttributeGroupReference+_aggregateColumns) : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
    * [.aggregate](#ERMrest.AttributeGroupReference+aggregate) : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
    * [.displayname](#ERMrest.AttributeGroupReference+displayname) : <code>object</code>
    * [.columns](#ERMrest.AttributeGroupReference+columns) : <code>Array.&lt;AttributeGroupColumn&gt;</code>
    * [.uri](#ERMrest.AttributeGroupReference+uri) : <code>string</code>
    * [.read([limit], contextHeaderParams)](#ERMrest.AttributeGroupReference+read) ⇒ <code>ERMRest.AttributeGroupPage</code>

<a name="new_ERMrest.AttributeGroupReference_new"></a>

#### new AttributeGroupReference(keyColumns, aggregateColumns, location, catalog)
Constructs a Reference object.

This object will be the main object that client will interact with, when we want
to use ermrset `attributegroup` api. Referencse are immutable and therefore can be
safely passed around and used between multiple client components without risk that the
underlying reference to server-side resources could change.

Usage:
 - Clients can use this constructor to create attribute group references if needed.
 - This will currently be used by the aggregateGroup functions to return a
   AttributeGroupReference rather than a [Reference](#ERMrest.Reference)


| Param | Type | Description |
| --- | --- | --- |
| keyColumns | <code>Array.&lt;ERMRest.AttributeGroupColumn&gt;</code> | List of columns that will be used as keys for the attributegroup request. |
| aggregateColumns | <code>Array.&lt;ERMRest.AttributeGroupColumn&gt;</code> | List of columns that will create the aggreagte columns list in the request. |
| location | <code>ERMRest.AttributeGroupLocation</code> | The location object. |
| catalog | <code>ERMRest.Catalog</code> | The catalog object. |

<a name="ERMrest.AttributeGroupReference+_keyColumns"></a>

#### attributeGroupReference._keyColumns : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
Array of AttributeGroupColumn that will be used as the key columns

**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+_aggregateColumns"></a>

#### attributeGroupReference._aggregateColumns : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
Array of AttributeGroupColumn that will be used for the aggregate results

**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+aggregate"></a>

#### attributeGroupReference.aggregate : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+displayname"></a>

#### attributeGroupReference.displayname : <code>object</code>
the displayname of the reference
TODO not sure if this sis needed

**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+columns"></a>

#### attributeGroupReference.columns : <code>Array.&lt;AttributeGroupColumn&gt;</code>
Visible columns

**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+uri"></a>

#### attributeGroupReference.uri : <code>string</code>
The attributegroup uri.
<service>/catalog/<_catalogId>/attributegroup/<path>/<search>/<_keyColumns>;<_aggregateColumns><sort><page>

NOTE:
- Since this is the object that has knowledge of columns, this should be here.
  (we might want to relocate it to the AttributeGroupLocation object.)
- ermrest can processs this uri.

**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+read"></a>

#### attributeGroupReference.read([limit], contextHeaderParams) ⇒ <code>ERMRest.AttributeGroupPage</code>
**Kind**: instance method of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  

| Param | Type | Description |
| --- | --- | --- |
| [limit] | <code>int</code> |  |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.AttributeGroupPage"></a>

### ERMrest.AttributeGroupPage
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.AttributeGroupPage](#ERMrest.AttributeGroupPage)
    * [new AttributeGroupPage(reference, data, hasPrevious, hasNext)](#new_ERMrest.AttributeGroupPage_new)
    * [.reference](#ERMrest.AttributeGroupPage+reference) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
    * [.hasPrevious](#ERMrest.AttributeGroupPage+hasPrevious) ⇒ <code>boolean</code>
    * [.hasNext](#ERMrest.AttributeGroupPage+hasNext) ⇒ <code>boolean</code>
    * [.tuples](#ERMrest.AttributeGroupPage+tuples) : [<code>Array.&lt;AttributeGroupTuple&gt;</code>](#ERMrest.AttributeGroupTuple)
    * [.next](#ERMrest.AttributeGroupPage+next) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>
    * [.previous](#ERMrest.AttributeGroupPage+previous) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>

<a name="new_ERMrest.AttributeGroupPage_new"></a>

#### new AttributeGroupPage(reference, data, hasPrevious, hasNext)
Constructs a AttributeGroupPage object. A _page_ represents a set of results returned from
ERMrest. It may not represent the complete set of results. There is an
iterator pattern used here, where its [previous](#ERMrest.AttributeGroupPage+previous) and
[next](#ERMrest.AttributeGroupPage+next) properties will give the client a
[AttributeGroupReference](#ERMrest.AttributeGroupReference) to the previous and next set of results,
respectively.

Usage:
 - Clients _do not_ directly access this constructor.
 - This will currently be used by the AggregateGroupReference to return a
   AttributeGroupPage rather than a [Page](#ERMrest.Page)
 See [read](#ERMrest.AttributeGroupReference+read).


| Param | Type | Description |
| --- | --- | --- |
| reference | <code>ERMRest.AttributeGroupReference</code> | aggregate reference representing the data for this page |
| data | <code>Array.&lt;Object&gt;</code> | The data returned from ERMrest |
| hasPrevious | <code>Boolean</code> | Whether database has some data before current page |
| hasNext | <code>Boolean</code> | Whether database has some data after current page |

<a name="ERMrest.AttributeGroupPage+reference"></a>

#### attributeGroupPage.reference : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
The page's associated reference.

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupPage+hasPrevious"></a>

#### attributeGroupPage.hasPrevious ⇒ <code>boolean</code>
Whether there is more entities before this page

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupPage+hasNext"></a>

#### attributeGroupPage.hasNext ⇒ <code>boolean</code>
Whether there is more entities after this page

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupPage+tuples"></a>

#### attributeGroupPage.tuples : [<code>Array.&lt;AttributeGroupTuple&gt;</code>](#ERMrest.AttributeGroupTuple)
An array of processed tuples.

Usage:
```
for (var i=0, len=page.tuples.length; i<len; i++) {
  var tuple = page.tuples[i];
  console.log("Tuple:", tuple.displayname.value, "has values:", tuple.values);
}
```

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupPage+next"></a>

#### attributeGroupPage.next : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>
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

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupPage+previous"></a>

#### attributeGroupPage.previous : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>
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

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupTuple"></a>

### ERMrest.AttributeGroupTuple
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.AttributeGroupTuple](#ERMrest.AttributeGroupTuple)
    * [new AttributeGroupTuple(page, data)](#new_ERMrest.AttributeGroupTuple_new)
    * [.isHTML](#ERMrest.AttributeGroupTuple+isHTML) : <code>Array.&lt;boolean&gt;</code>
    * [.uniqueId](#ERMrest.AttributeGroupTuple+uniqueId) : <code>string</code>
    * [.displayname](#ERMrest.AttributeGroupTuple+displayname) : <code>string</code>

<a name="new_ERMrest.AttributeGroupTuple_new"></a>

#### new AttributeGroupTuple(page, data)
Constructs a new Tuple. In database jargon, a tuple is a row in a
relation. This object represents a row returned by a query to ERMrest.

Usage:
 Clients _do not_ directly access this constructor.
 See [tuples](#ERMrest.AttributeGroupPage+tuples).


| Param | Type | Description |
| --- | --- | --- |
| page | [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage) | The Page object from which this data was acquired. |
| data | <code>Object</code> | The unprocessed tuple of data returned from ERMrest. |

<a name="ERMrest.AttributeGroupTuple+isHTML"></a>

#### attributeGroupTuple.isHTML : <code>Array.&lt;boolean&gt;</code>
The array of boolean values of this tuple speicifying the value is HTML or not. The ordering of the
values in the array matches the ordering of the columns in the
reference (see [columns](#ERMrest.Reference+columns)).
TODO Eventually should be refactored (https://github.com/informatics-isi-edu/ermrestjs/issues/189).

**Kind**: instance property of [<code>AttributeGroupTuple</code>](#ERMrest.AttributeGroupTuple)  
<a name="ERMrest.AttributeGroupTuple+uniqueId"></a>

#### attributeGroupTuple.uniqueId : <code>string</code>
The unique identifier for this tuple composed of the values for each
of the shortest key columns concatenated together by an '_'

**Kind**: instance property of [<code>AttributeGroupTuple</code>](#ERMrest.AttributeGroupTuple)  
<a name="ERMrest.AttributeGroupTuple+displayname"></a>

#### attributeGroupTuple.displayname : <code>string</code>
The _display name_ of this tuple. currently it will be values of
key columns concatenated together by `_`.

Usage:
```
console.log("This tuple has a displayable name of ", tuple.displayname.value);
```

**Kind**: instance property of [<code>AttributeGroupTuple</code>](#ERMrest.AttributeGroupTuple)  
<a name="ERMrest.AttributeGroupReferenceAggregateFn"></a>

### ERMrest.AttributeGroupReferenceAggregateFn
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.AttributeGroupReferenceAggregateFn](#ERMrest.AttributeGroupReferenceAggregateFn)
    * [new AttributeGroupReferenceAggregateFn(reference)](#new_ERMrest.AttributeGroupReferenceAggregateFn_new)
    * [.countAgg](#ERMrest.AttributeGroupReferenceAggregateFn+countAgg) : <code>Object</code>

<a name="new_ERMrest.AttributeGroupReferenceAggregateFn_new"></a>

#### new AttributeGroupReferenceAggregateFn(reference)
Can be used to access group aggregate functions.
Usage:
 Clients _do not_ directly access this constructor. [AttributeGroupReference](#ERMrest.AttributeGroupReference)
 will access this constructor for purposes of fetching grouped aggregate data
 for a specific column


| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) | The reference that this aggregate function belongs to |

<a name="ERMrest.AttributeGroupReferenceAggregateFn+countAgg"></a>

#### attributeGroupReferenceAggregateFn.countAgg : <code>Object</code>
count aggregate representation
This does not count null values for the key since we're using `count distinct`.
Therefore the returned count might not be exactly the same as number of returned values.

**Kind**: instance property of [<code>AttributeGroupReferenceAggregateFn</code>](#ERMrest.AttributeGroupReferenceAggregateFn)  
<a name="ERMrest.Checksum"></a>

### ERMrest.Checksum
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  
<a name="new_ERMrest.Checksum_new"></a>

#### new Checksum({file}, {options})

| Param | Type | Description |
| --- | --- | --- |
| {file} | <code>Object</code> | A browser file object |
| {options} | <code>Object</code> | An optional parameters object. The (key, value) |

<a name="ERMrest.upload"></a>

### ERMrest.upload
**Kind**: static class of [<code>ERMrest</code>](#ERMrest)  

* [.upload](#ERMrest.upload)
    * [new upload(file, {otherInfo})](#new_ERMrest.upload_new)
    * [.validateURL(row)](#ERMrest.upload+validateURL) ⇒ <code>boolean</code>
    * [.calculateChecksum(row)](#ERMrest.upload+calculateChecksum) ⇒ <code>Promise</code>
    * [.createUploadJob()](#ERMrest.upload+createUploadJob) ⇒ <code>Promise</code>
    * [.fileExists()](#ERMrest.upload+fileExists) ⇒ <code>Promise</code>
    * [.start()](#ERMrest.upload+start) ⇒ <code>Promise</code>
    * [.completeUpload()](#ERMrest.upload+completeUpload) ⇒ <code>Promise</code>
    * [.pause()](#ERMrest.upload+pause)
    * [.resume()](#ERMrest.upload+resume)
    * [.cancel()](#ERMrest.upload+cancel) ⇒ <code>Promise</code>
    * [.deleteFile()](#ERMrest.upload+deleteFile) ⇒ <code>Promise</code>

<a name="new_ERMrest.upload_new"></a>

#### new upload(file, {otherInfo})
upload Object
Create a new instance with new upload(file, otherInfo)
To validate url generation for a file call validateUrl(row) with row of data
To calculate checksum call calculateChecksum(row) with row of data
To create an upload call createUploadJob()
To check for existing file call fileExists()
To start uploading, call start()
To complete upload job call completeUploadJob()
You can pause with pause()
Resume with resume()
Cancel with cancel()


| Param | Type | Description |
| --- | --- | --- |
| file | <code>Object</code> | A browser file object |
| {otherInfo} | <code>type</code> | A set of options 1. chunkSize - Default is 5MB 2. column - [Column](#ERMrest.Column) object is mandatory 3. reference - [Reference](#ERMrest.Reference) object  is mandatory |

<a name="ERMrest.upload+validateURL"></a>

#### upload.validateURL(row) ⇒ <code>boolean</code>
Call this function with the ermrestjs column object and the json object row To determine it is able to generate a url
If any properties in the template are found null without null handling then return false

**Kind**: instance method of [<code>upload</code>](#ERMrest.upload)  

| Param | Type | Description |
| --- | --- | --- |
| row | <code>object</code> | row object containing keyvalues of entity |

<a name="ERMrest.upload+calculateChecksum"></a>

#### upload.calculateChecksum(row) ⇒ <code>Promise</code>
Call this function to calculate checksum before uploading to server

**Kind**: instance method of [<code>upload</code>](#ERMrest.upload)  
**Returns**: <code>Promise</code> - A promise resolved with a url where we will upload the file
or rejected with error if unable to calculate checkum
and notified with a progress handler, sending number in bytes done  

| Param | Type | Description |
| --- | --- | --- |
| row | <code>object</code> | row object containing keyvalues of entity |

<a name="ERMrest.upload+createUploadJob"></a>

#### upload.createUploadJob() ⇒ <code>Promise</code>
Call this function to create an upload job for chunked uploading

**Kind**: instance method of [<code>upload</code>](#ERMrest.upload)  
**Returns**: <code>Promise</code> - A promise resolved with a url where we will upload the file
or rejected with error if unable to calculate checkum  
<a name="ERMrest.upload+fileExists"></a>

#### upload.fileExists() ⇒ <code>Promise</code>
Call this function to determine file exists on the server
If it doesn't then resolve the promise with url.
If it does then set isPaused, completed and jobDone to true

**Kind**: instance method of [<code>upload</code>](#ERMrest.upload)  
<a name="ERMrest.upload+start"></a>

#### upload.start() ⇒ <code>Promise</code>
Call this function to start chunked upload to server. It reads the file and divides in into chunks
If the completed flag is true, then this means that all chunks were already uploaded, thus it will resolve the promize with url
else it will start uploading the chunks. If the job was paused then resume by uploading just those chunks which were not completed.

**Kind**: instance method of [<code>upload</code>](#ERMrest.upload)  
**Returns**: <code>Promise</code> - A promise resolved with a url where we uploaded the file
or rejected with error if unable to upload any chunk
and notified with a progress handler, sending number in bytes uploaded uptil now  
<a name="ERMrest.upload+completeUpload"></a>

#### upload.completeUpload() ⇒ <code>Promise</code>
This function is used to complete the chunk upload by notifying hatrac about it returning a promise with final url

**Kind**: instance method of [<code>upload</code>](#ERMrest.upload)  
**Returns**: <code>Promise</code> - A promise resolved with a url where we uploaded the file
 or rejected with error if unable to complete the job  
<a name="ERMrest.upload+pause"></a>

#### upload.pause()
Pause the upload
Remember, the current progressing part will fail,
that part will start from beginning (< 5MB of upload is wasted)

**Kind**: instance method of [<code>upload</code>](#ERMrest.upload)  
<a name="ERMrest.upload+resume"></a>

#### upload.resume()
Resumes the upload

**Kind**: instance method of [<code>upload</code>](#ERMrest.upload)  
<a name="ERMrest.upload+cancel"></a>

#### upload.cancel() ⇒ <code>Promise</code>
Aborts/cancels the upload

**Kind**: instance method of [<code>upload</code>](#ERMrest.upload)  
<a name="ERMrest.upload+deleteFile"></a>

#### upload.deleteFile() ⇒ <code>Promise</code>
deletes the file metadata from the hatrac database and removes it from the namespace

**Kind**: instance method of [<code>upload</code>](#ERMrest.upload)  
<a name="ERMrest.Datapath"></a>

### ERMrest.Datapath : <code>object</code>
**Kind**: static namespace of [<code>ERMrest</code>](#ERMrest)  

* [.Datapath](#ERMrest.Datapath) : <code>object</code>
    * [.DataPath](#ERMrest.Datapath.DataPath)
        * [new DataPath(table)](#new_ERMrest.Datapath.DataPath_new)
        * [.catalog](#ERMrest.Datapath.DataPath+catalog) : [<code>Catalog</code>](#ERMrest.Catalog)
        * [.context](#ERMrest.Datapath.DataPath+context) : [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
        * [.entity](#ERMrest.Datapath.DataPath+entity)
            * [.get()](#ERMrest.Datapath.DataPath+entity.get) ⇒ <code>Promise</code>
            * [.delete(filter)](#ERMrest.Datapath.DataPath+entity.delete) ⇒ <code>Promise</code>
        * [.filter(filter)](#ERMrest.Datapath.DataPath+filter) ⇒ [<code>DataPath</code>](#ERMrest.Datapath.DataPath)
        * [.extend(table, context, link)](#ERMrest.Datapath.DataPath+extend) ⇒ [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
    * [.PathTable](#ERMrest.Datapath.PathTable)
        * [new PathTable(table, datapath, alias)](#new_ERMrest.Datapath.PathTable_new)
        * [.datapath](#ERMrest.Datapath.PathTable+datapath) : [<code>DataPath</code>](#ERMrest.Datapath.DataPath)
        * [.table](#ERMrest.Datapath.PathTable+table) : [<code>Table</code>](#ERMrest.Table)
        * [.alias](#ERMrest.Datapath.PathTable+alias) : <code>string</code>
        * [.columns](#ERMrest.Datapath.PathTable+columns) : [<code>PathColumns</code>](#ERMrest.Datapath.PathColumns)
        * [.toString()](#ERMrest.Datapath.PathTable+toString) ⇒ <code>string</code>
    * [.PathColumn](#ERMrest.Datapath.PathColumn)
        * [new PathColumn(column, pathtable)](#new_ERMrest.Datapath.PathColumn_new)
        * [.pathtable](#ERMrest.Datapath.PathColumn+pathtable) : [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
        * [.column](#ERMrest.Datapath.PathColumn+column) : [<code>Column</code>](#ERMrest.Column)
    * [.PathColumns(table, pathtable)](#ERMrest.Datapath.PathColumns)
        * [.length()](#ERMrest.Datapath.PathColumns+length) ⇒ <code>Number</code>
        * [.names()](#ERMrest.Datapath.PathColumns+names) ⇒ <code>Array.&lt;String&gt;</code>
        * [.get(colName)](#ERMrest.Datapath.PathColumns+get) ⇒ [<code>PathColumn</code>](#ERMrest.Datapath.PathColumn)
    * [.Operators()](#ERMrest.Datapath.Operators)

<a name="ERMrest.Datapath.DataPath"></a>

#### Datapath.DataPath
**Kind**: static class of [<code>Datapath</code>](#ERMrest.Datapath)  

* [.DataPath](#ERMrest.Datapath.DataPath)
    * [new DataPath(table)](#new_ERMrest.Datapath.DataPath_new)
    * [.catalog](#ERMrest.Datapath.DataPath+catalog) : [<code>Catalog</code>](#ERMrest.Catalog)
    * [.context](#ERMrest.Datapath.DataPath+context) : [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
    * [.entity](#ERMrest.Datapath.DataPath+entity)
        * [.get()](#ERMrest.Datapath.DataPath+entity.get) ⇒ <code>Promise</code>
        * [.delete(filter)](#ERMrest.Datapath.DataPath+entity.delete) ⇒ <code>Promise</code>
    * [.filter(filter)](#ERMrest.Datapath.DataPath+filter) ⇒ [<code>DataPath</code>](#ERMrest.Datapath.DataPath)
    * [.extend(table, context, link)](#ERMrest.Datapath.DataPath+extend) ⇒ [<code>PathTable</code>](#ERMrest.Datapath.PathTable)

<a name="new_ERMrest.Datapath.DataPath_new"></a>

##### new DataPath(table)

| Param | Type |
| --- | --- |
| table | [<code>Table</code>](#ERMrest.Table) | 

<a name="ERMrest.Datapath.DataPath+catalog"></a>

##### dataPath.catalog : [<code>Catalog</code>](#ERMrest.Catalog)
**Kind**: instance property of [<code>DataPath</code>](#ERMrest.Datapath.DataPath)  
<a name="ERMrest.Datapath.DataPath+context"></a>

##### dataPath.context : [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
**Kind**: instance property of [<code>DataPath</code>](#ERMrest.Datapath.DataPath)  
<a name="ERMrest.Datapath.DataPath+entity"></a>

##### dataPath.entity
entity container

**Kind**: instance property of [<code>DataPath</code>](#ERMrest.Datapath.DataPath)  

* [.entity](#ERMrest.Datapath.DataPath+entity)
    * [.get()](#ERMrest.Datapath.DataPath+entity.get) ⇒ <code>Promise</code>
    * [.delete(filter)](#ERMrest.Datapath.DataPath+entity.delete) ⇒ <code>Promise</code>

<a name="ERMrest.Datapath.DataPath+entity.get"></a>

###### entity.get() ⇒ <code>Promise</code>
**Kind**: static method of [<code>entity</code>](#ERMrest.Datapath.DataPath+entity)  
**Returns**: <code>Promise</code> - promise that returns a row data if resolved or
    [ERMrest.Errors.TimedOutError](ERMrest.Errors.TimedOutError), [ERMrest.Errors.InternalServerError](ERMrest.Errors.InternalServerError), [ERMrest.Errors.ServiceUnavailableError](ERMrest.Errors.ServiceUnavailableError),
    [ERMrest.Errors.ConflictError](ERMrest.Errors.ConflictError), [ERMrest.Errors.ForbiddenError](ERMrest.Errors.ForbiddenError) or [ERMrest.Errors.UnauthorizedError](ERMrest.Errors.UnauthorizedError) if rejected  
<a name="ERMrest.Datapath.DataPath+entity.delete"></a>

###### entity.delete(filter) ⇒ <code>Promise</code>
delete entities

**Kind**: static method of [<code>entity</code>](#ERMrest.Datapath.DataPath+entity)  
**Returns**: <code>Promise</code> - promise that returns deleted entities if resolved or
    [ERMrest.Errors.TimedOutError](ERMrest.Errors.TimedOutError), [ERMrest.Errors.InternalServerError](ERMrest.Errors.InternalServerError), [ERMrest.Errors.ServiceUnavailableError](ERMrest.Errors.ServiceUnavailableError),
    [ERMrest.Errors.ConflictError](ERMrest.Errors.ConflictError), [ERMrest.Errors.ForbiddenError](ERMrest.Errors.ForbiddenError) or [ERMrest.Errors.UnauthorizedError](ERMrest.Errors.UnauthorizedError) if rejected  

| Param | Type |
| --- | --- |
| filter | [<code>Negation</code>](#ERMrest.Filters.Negation) \| [<code>Conjunction</code>](#ERMrest.Filters.Conjunction) \| [<code>Disjunction</code>](#ERMrest.Filters.Disjunction) \| [<code>UnaryPredicate</code>](#ERMrest.Filters.UnaryPredicate) \| [<code>BinaryPredicate</code>](#ERMrest.Filters.BinaryPredicate) | 

<a name="ERMrest.Datapath.DataPath+filter"></a>

##### dataPath.filter(filter) ⇒ [<code>DataPath</code>](#ERMrest.Datapath.DataPath)
this datapath is not modified

**Kind**: instance method of [<code>DataPath</code>](#ERMrest.Datapath.DataPath)  
**Returns**: [<code>DataPath</code>](#ERMrest.Datapath.DataPath) - a shallow copy of this datapath with filter  

| Param | Type |
| --- | --- |
| filter | [<code>Negation</code>](#ERMrest.Filters.Negation) \| [<code>Conjunction</code>](#ERMrest.Filters.Conjunction) \| [<code>Disjunction</code>](#ERMrest.Filters.Disjunction) \| [<code>UnaryPredicate</code>](#ERMrest.Filters.UnaryPredicate) \| [<code>BinaryPredicate</code>](#ERMrest.Filters.BinaryPredicate) | 

<a name="ERMrest.Datapath.DataPath+extend"></a>

##### dataPath.extend(table, context, link) ⇒ [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
extend the Datapath with table

**Kind**: instance method of [<code>DataPath</code>](#ERMrest.Datapath.DataPath)  

| Param | Type |
| --- | --- |
| table | [<code>Table</code>](#ERMrest.Table) | 
| context |  | 
| link |  | 

<a name="ERMrest.Datapath.PathTable"></a>

#### Datapath.PathTable
**Kind**: static class of [<code>Datapath</code>](#ERMrest.Datapath)  

* [.PathTable](#ERMrest.Datapath.PathTable)
    * [new PathTable(table, datapath, alias)](#new_ERMrest.Datapath.PathTable_new)
    * [.datapath](#ERMrest.Datapath.PathTable+datapath) : [<code>DataPath</code>](#ERMrest.Datapath.DataPath)
    * [.table](#ERMrest.Datapath.PathTable+table) : [<code>Table</code>](#ERMrest.Table)
    * [.alias](#ERMrest.Datapath.PathTable+alias) : <code>string</code>
    * [.columns](#ERMrest.Datapath.PathTable+columns) : [<code>PathColumns</code>](#ERMrest.Datapath.PathColumns)
    * [.toString()](#ERMrest.Datapath.PathTable+toString) ⇒ <code>string</code>

<a name="new_ERMrest.Datapath.PathTable_new"></a>

##### new PathTable(table, datapath, alias)

| Param | Type |
| --- | --- |
| table | [<code>Table</code>](#ERMrest.Table) | 
| datapath | [<code>DataPath</code>](#ERMrest.Datapath.DataPath) | 
| alias | <code>string</code> | 

<a name="ERMrest.Datapath.PathTable+datapath"></a>

##### pathTable.datapath : [<code>DataPath</code>](#ERMrest.Datapath.DataPath)
**Kind**: instance property of [<code>PathTable</code>](#ERMrest.Datapath.PathTable)  
<a name="ERMrest.Datapath.PathTable+table"></a>

##### pathTable.table : [<code>Table</code>](#ERMrest.Table)
**Kind**: instance property of [<code>PathTable</code>](#ERMrest.Datapath.PathTable)  
<a name="ERMrest.Datapath.PathTable+alias"></a>

##### pathTable.alias : <code>string</code>
**Kind**: instance property of [<code>PathTable</code>](#ERMrest.Datapath.PathTable)  
<a name="ERMrest.Datapath.PathTable+columns"></a>

##### pathTable.columns : [<code>PathColumns</code>](#ERMrest.Datapath.PathColumns)
**Kind**: instance property of [<code>PathTable</code>](#ERMrest.Datapath.PathTable)  
<a name="ERMrest.Datapath.PathTable+toString"></a>

##### pathTable.toString() ⇒ <code>string</code>
**Kind**: instance method of [<code>PathTable</code>](#ERMrest.Datapath.PathTable)  
**Returns**: <code>string</code> - uri of the PathTable  
<a name="ERMrest.Datapath.PathColumn"></a>

#### Datapath.PathColumn
**Kind**: static class of [<code>Datapath</code>](#ERMrest.Datapath)  

* [.PathColumn](#ERMrest.Datapath.PathColumn)
    * [new PathColumn(column, pathtable)](#new_ERMrest.Datapath.PathColumn_new)
    * [.pathtable](#ERMrest.Datapath.PathColumn+pathtable) : [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
    * [.column](#ERMrest.Datapath.PathColumn+column) : [<code>Column</code>](#ERMrest.Column)

<a name="new_ERMrest.Datapath.PathColumn_new"></a>

##### new PathColumn(column, pathtable)

| Param | Type |
| --- | --- |
| column | [<code>Column</code>](#ERMrest.Column) | 
| pathtable | [<code>PathTable</code>](#ERMrest.Datapath.PathTable) | 

<a name="ERMrest.Datapath.PathColumn+pathtable"></a>

##### pathColumn.pathtable : [<code>PathTable</code>](#ERMrest.Datapath.PathTable)
**Kind**: instance property of [<code>PathColumn</code>](#ERMrest.Datapath.PathColumn)  
<a name="ERMrest.Datapath.PathColumn+column"></a>

##### pathColumn.column : [<code>Column</code>](#ERMrest.Column)
**Kind**: instance property of [<code>PathColumn</code>](#ERMrest.Datapath.PathColumn)  
<a name="ERMrest.Datapath.PathColumns"></a>

#### Datapath.PathColumns(table, pathtable)
**Kind**: static method of [<code>Datapath</code>](#ERMrest.Datapath)  

| Param | Type |
| --- | --- |
| table | [<code>Table</code>](#ERMrest.Table) | 
| pathtable | [<code>PathTable</code>](#ERMrest.Datapath.PathTable) | 


* [.PathColumns(table, pathtable)](#ERMrest.Datapath.PathColumns)
    * [.length()](#ERMrest.Datapath.PathColumns+length) ⇒ <code>Number</code>
    * [.names()](#ERMrest.Datapath.PathColumns+names) ⇒ <code>Array.&lt;String&gt;</code>
    * [.get(colName)](#ERMrest.Datapath.PathColumns+get) ⇒ [<code>PathColumn</code>](#ERMrest.Datapath.PathColumn)

<a name="ERMrest.Datapath.PathColumns+length"></a>

##### pathColumns.length() ⇒ <code>Number</code>
**Kind**: instance method of [<code>PathColumns</code>](#ERMrest.Datapath.PathColumns)  
**Returns**: <code>Number</code> - number of path columns  
<a name="ERMrest.Datapath.PathColumns+names"></a>

##### pathColumns.names() ⇒ <code>Array.&lt;String&gt;</code>
**Kind**: instance method of [<code>PathColumns</code>](#ERMrest.Datapath.PathColumns)  
**Returns**: <code>Array.&lt;String&gt;</code> - a list of pathcolumn names  
<a name="ERMrest.Datapath.PathColumns+get"></a>

##### pathColumns.get(colName) ⇒ [<code>PathColumn</code>](#ERMrest.Datapath.PathColumn)
get PathColumn object by column name

**Kind**: instance method of [<code>PathColumns</code>](#ERMrest.Datapath.PathColumns)  
**Returns**: [<code>PathColumn</code>](#ERMrest.Datapath.PathColumn) - returns the PathColumn  
**Throws**:

- <code>ERMrest.Errors.NotFoundError</code> column not found


| Param | Type | Description |
| --- | --- | --- |
| colName | <code>string</code> | column name |

<a name="ERMrest.Datapath.Operators"></a>

#### Datapath.Operators()
**Kind**: static method of [<code>Datapath</code>](#ERMrest.Datapath)  
<a name="ERMrest.Filters"></a>

### ERMrest.Filters : <code>object</code>
**Kind**: static namespace of [<code>ERMrest</code>](#ERMrest)  

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
**Kind**: static class of [<code>Filters</code>](#ERMrest.Filters)  

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
**Kind**: instance method of [<code>Negation</code>](#ERMrest.Filters.Negation)  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.Filters.Conjunction"></a>

#### Filters.Conjunction
**Kind**: static class of [<code>Filters</code>](#ERMrest.Filters)  

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
**Kind**: instance method of [<code>Conjunction</code>](#ERMrest.Filters.Conjunction)  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.Filters.Disjunction"></a>

#### Filters.Disjunction
**Kind**: static class of [<code>Filters</code>](#ERMrest.Filters)  

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
**Kind**: instance method of [<code>Disjunction</code>](#ERMrest.Filters.Disjunction)  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.Filters.UnaryPredicate"></a>

#### Filters.UnaryPredicate
**Kind**: static class of [<code>Filters</code>](#ERMrest.Filters)  

* [.UnaryPredicate](#ERMrest.Filters.UnaryPredicate)
    * [new UnaryPredicate(column, operator)](#new_ERMrest.Filters.UnaryPredicate_new)
    * [.toUri()](#ERMrest.Filters.UnaryPredicate+toUri) ⇒ <code>string</code>

<a name="new_ERMrest.Filters.UnaryPredicate_new"></a>

##### new UnaryPredicate(column, operator)
**Throws**:

- <code>ERMrest.Errors.InvalidFilterOperatorError</code> invalid filter operator


| Param | Type |
| --- | --- |
| column | [<code>Column</code>](#ERMrest.Column) | 
| operator | <code>ERMrest.Filters.OPERATOR</code> | 

<a name="ERMrest.Filters.UnaryPredicate+toUri"></a>

##### unaryPredicate.toUri() ⇒ <code>string</code>
**Kind**: instance method of [<code>UnaryPredicate</code>](#ERMrest.Filters.UnaryPredicate)  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.Filters.BinaryPredicate"></a>

#### Filters.BinaryPredicate
**Kind**: static class of [<code>Filters</code>](#ERMrest.Filters)  

* [.BinaryPredicate](#ERMrest.Filters.BinaryPredicate)
    * [new BinaryPredicate(column, operator, rvalue)](#new_ERMrest.Filters.BinaryPredicate_new)
    * [.toUri()](#ERMrest.Filters.BinaryPredicate+toUri) ⇒ <code>string</code>

<a name="new_ERMrest.Filters.BinaryPredicate_new"></a>

##### new BinaryPredicate(column, operator, rvalue)
**Throws**:

- <code>ERMrest.Errors.InvalidFilterOperatorError</code> invalid filter operator


| Param | Type |
| --- | --- |
| column | [<code>Column</code>](#ERMrest.Column) | 
| operator | <code>ERMrest.Filters.OPERATOR</code> | 
| rvalue | <code>String</code> \| <code>Number</code> | 

<a name="ERMrest.Filters.BinaryPredicate+toUri"></a>

##### binaryPredicate.toUri() ⇒ <code>string</code>
**Kind**: instance method of [<code>BinaryPredicate</code>](#ERMrest.Filters.BinaryPredicate)  
**Returns**: <code>string</code> - URI of the filter  
<a name="ERMrest.Reference"></a>

### ERMrest.Reference : <code>object</code>
**Kind**: static namespace of [<code>ERMrest</code>](#ERMrest)  

* [.Reference](#ERMrest.Reference) : <code>object</code>
    * [new Reference(location, catalog)](#new_ERMrest.Reference_new)
    * [.contextualize](#ERMrest.Reference+contextualize)
    * [.aggregate](#ERMrest.Reference+aggregate) : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
    * [.displayname](#ERMrest.Reference+displayname) : <code>object</code>
    * [.uri](#ERMrest.Reference+uri) : <code>string</code>
    * [.table](#ERMrest.Reference+table) : [<code>Table</code>](#ERMrest.Table)
    * [.projectionTable](#ERMrest.Reference+projectionTable) : [<code>Table</code>](#ERMrest.Table)
    * [.columns](#ERMrest.Reference+columns) : [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)
    * [.facetColumns](#ERMrest.Reference+facetColumns) ⇒ [<code>Array.&lt;FacetColumn&gt;</code>](#ERMrest.FacetColumn)
    * [.location](#ERMrest.Reference+location) ⇒ <code>ERMrest.Location</code>
    * [.isUnique](#ERMrest.Reference+isUnique) : <code>boolean</code>
    * [.canCreate](#ERMrest.Reference+canCreate) : <code>boolean</code> \| <code>undefined</code>
    * [.canRead](#ERMrest.Reference+canRead) : <code>boolean</code> \| <code>undefined</code>
    * [.canUpdate](#ERMrest.Reference+canUpdate) : <code>boolean</code> \| <code>undefined</code>
    * [.canDelete](#ERMrest.Reference+canDelete) : <code>boolean</code> \| <code>undefined</code>
    * [.display](#ERMrest.Reference+display) : <code>Object</code>
    * [.unfilteredReference](#ERMrest.Reference+unfilteredReference) : [<code>Reference</code>](#ERMrest.Reference)
    * [.appLink](#ERMrest.Reference+appLink) : <code>String</code>
    * [.csvDownloadLink](#ERMrest.Reference+csvDownloadLink) ⇒ <code>String</code>
    * [.defaultLogInfo](#ERMrest.Reference+defaultLogInfo) : <code>Object</code>
    * [.removeAllFacetFilters(sameFacet)](#ERMrest.Reference+removeAllFacetFilters) ⇒ <code>ERMrest.reference</code>
    * [.create(data, contextHeaderParams)](#ERMrest.Reference+create) ⇒ <code>Promise</code>
        * [~columnDiff()](#ERMrest.Reference+create..columnDiff)
    * [.read(limit, contextHeaderParams)](#ERMrest.Reference+read) ⇒ <code>Promise</code>
    * [.sort(sort)](#ERMrest.Reference+sort) ⇒ <code>Reference</code>
    * [.update(tuples, contextHeaderParams)](#ERMrest.Reference+update) ⇒ <code>Promise</code>
    * [.delete(contextHeaderParams)](#ERMrest.Reference+delete) ⇒ <code>Promise</code>
        * [~self](#ERMrest.Reference+delete..self)
    * [.related([tuple])](#ERMrest.Reference+related) ⇒ [<code>Array.&lt;Reference&gt;</code>](#ERMrest.Reference)
    * [.search(term)](#ERMrest.Reference+search) ⇒ <code>Reference</code>
    * [.getAggregates(aggregateList)](#ERMrest.Reference+getAggregates) ⇒ <code>Promise</code>
    * [.setSamePaging(page)](#ERMrest.Reference+setSamePaging) ⇒ [<code>Reference</code>](#ERMrest.Reference)
    * [.getColumnByName(name)](#ERMrest.Reference+getColumnByName) ⇒ [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)
    * [.generateColumnsList(tuple)](#ERMrest.Reference+generateColumnsList) ⇒ [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)

<a name="new_ERMrest.Reference_new"></a>

#### new Reference(location, catalog)
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
| catalog | [<code>Catalog</code>](#ERMrest.Catalog) | The catalog object. Since location.catalog is just an id, we need the actual catalog object too. |

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

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+aggregate"></a>

#### reference.aggregate : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+displayname"></a>

#### reference.displayname : <code>object</code>
The display name for this reference.
displayname.isHTML will return true/false
displayname.value has the value

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+uri"></a>

#### reference.uri : <code>string</code>
The string form of the `URI` for this reference.
NOTE: It is not understanable by ermrest, and it also doesn't have the modifiers (sort, page).
Should not be used for sending requests to ermrest, use this.location.ermrestCompactUri instead.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+table"></a>

#### reference.table : [<code>Table</code>](#ERMrest.Table)
The table object for this reference

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+projectionTable"></a>

#### reference.projectionTable : [<code>Table</code>](#ERMrest.Table)
The projection table object,
if there's a join in path, this will return a different object from .table

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+columns"></a>

#### reference.columns : [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)
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

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+facetColumns"></a>

#### reference.facetColumns ⇒ [<code>Array.&lt;FacetColumn&gt;</code>](#ERMrest.FacetColumn)
Facets that should be represented to the user.
Heuristics:
 - All the visible columns in compact context.
 - All the related entities in detailed context.

Usage:
```
 var facets = reference.facetColumns;
 var newRef = reference.facetColumns[0].addChoiceFilters(['value']);
 var newRef2 = newRef.facetColumns[1].addSearchFilter('text 1');
 var newRef3 = newRef2.facetColumns[2].addRangeFilter(1, 2);
 var newRef4 = newRef3.facetColumns[3].removeAllFilters();
 for (var i=0, len=newRef4.facetColumns.length; i<len; i++) {
   var fc = reference.facetColumns[i];
   console.log("Column name:", fc.column.name, "has following facets:", fc.filters);
 }
```

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+location"></a>

#### reference.location ⇒ <code>ERMrest.Location</code>
Location object that has uri of current reference

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
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

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+canCreate"></a>

#### reference.canCreate : <code>boolean</code> \| <code>undefined</code>
Indicates whether the client has the permission to _create_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+canRead"></a>

#### reference.canRead : <code>boolean</code> \| <code>undefined</code>
Indicates whether the client has the permission to _read_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+canUpdate"></a>

#### reference.canUpdate : <code>boolean</code> \| <code>undefined</code>
Indicates whether the client has the permission to _update_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+canDelete"></a>

#### reference.canDelete : <code>boolean</code> \| <code>undefined</code>
Indicates whether the client has the permission to _delete_
the referenced resource(s). In some cases, this permission cannot
be determined and the value will be `undefined`.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+display"></a>

#### reference.display : <code>Object</code>
An object which contains row display properties for this reference.
It is determined based on the `table-display` annotation. It has the
following properties:

  - `rowOrder`: `[{ column: '`_column name_`', descending:` {`true` | `false` } `}`...`]` or `undefined`,
  - `type`: {`'table'` | `'markdown'` | `'module'`} (default: `'table'`)

If type is `'markdown'`, the object will also these additional
properties:

  - `markdownPattern`: markdown pattern,
  - `separator`: markdown pattern (default: newline character `'\n'`),
  - `suffix`: markdown pattern (detaul: empty string `''`),
  - `prefix`: markdown pattern (detaul: empty string `''`)

If type is `'module'`, the object will have these additional
properties:

  - `modulePath`: `'pathsuffix'` (TODO: what is this!?)

Usage :
```
var displayType = reference.display.type; // the displayType
if ( displayType === 'table') {
   // go for default rendering of rows using tuple.values
} else if (displayType === 'markdown') {
   // Use the separator, suffix and prefix values while rendering tuples
   // Tuple will have a "tuple.content" property that will have the actual markdown value
   // derived from row_markdown_pattern after templating and rendering markdown
} else if (displayType ===  'module') {
  // Use modulePath to render the rows
}
```

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+unfilteredReference"></a>

#### reference.unfilteredReference : [<code>Reference</code>](#ERMrest.Reference)
This will generate a new unfiltered reference each time.
Returns a reference that points to all entities of current table

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+appLink"></a>

#### reference.appLink : <code>String</code>
App-specific URL

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
**Throws**:

- <code>Error</code> if `_appLinkFn` is not defined.

<a name="ERMrest.Reference+csvDownloadLink"></a>

#### reference.csvDownloadLink ⇒ <code>String</code>
Returns a uri that will properly generate the download link for a csv document
NOTE It will not have the same sort and paging as the reference.

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>String</code> - A string representing the url for direct csv download  
<a name="ERMrest.Reference+defaultLogInfo"></a>

#### reference.defaultLogInfo : <code>Object</code>
The default information that we want to be logged including catalog, schema_table, and facet (filter).

**Kind**: instance property of [<code>Reference</code>](#ERMrest.Reference)  
<a name="ERMrest.Reference+removeAllFacetFilters"></a>

#### reference.removeAllFacetFilters(sameFacet) ⇒ <code>ERMrest.reference</code>
Remove all the fitlers from facets

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>ERMrest.reference</code> - A reference without facet filters  

| Param | Type | Description |
| --- | --- | --- |
| sameFacet | <code>boolean</code> | By default we're removing facets, if this is true facets won't be changed. |

<a name="ERMrest.Reference+create"></a>

#### reference.create(data, contextHeaderParams) ⇒ <code>Promise</code>
Creates a set of tuples in the references relation. Note, this
operation sets the `defaults` list according to the table
specification, and not according to the contents of in the input
tuple.

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Promise</code> - A promise resolved with a object containing `successful` and `failure` attributes.
Both are [Page](#ERMrest.Page) of results.
or rejected with any of the following errors:
- [InvalidInputError](#ERMrest.InvalidInputError): If `data` is not valid, or reference is not in `entry/create` context.
- [InvalidInputError](#ERMrest.InvalidInputError): If `limit` is invalid.
- ERMrestjs corresponding http errors, if ERMrest returns http error.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array</code> | The array of data to be created as new tuples. |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.Reference+create..columnDiff"></a>

##### create~columnDiff()
This gets the difference between the two column sets. This is not the _symmetric_ difference.
If minuend is [1,2,3,4,5]
and subtrahend is [4,5,6]
the difference is [1,2,3]
The 6 is ignored because we only want to know what's in the minuend that is not in the subtrahend

**Kind**: inner method of [<code>create</code>](#ERMrest.Reference+create)  
<a name="ERMrest.Reference+read"></a>

#### reference.read(limit, contextHeaderParams) ⇒ <code>Promise</code>
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

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Promise</code> - A promise resolved with [Page](#ERMrest.Page) of results,
or rejected with any of these errors:
- [InvalidInputError](#ERMrest.InvalidInputError): If `limit` is invalid.
- [BadRequestError](#ERMrest.BadRequestError): If asks for sorting based on columns that are not sortable.
- [NotFoundError](#ERMrest.NotFoundError): If asks for sorting based on columns that are not valid.
- ERMrestjs corresponding http errors, if ERMrest returns http error.  

| Param | Type | Description |
| --- | --- | --- |
| limit | <code>number</code> | The limit of results to be returned by the read request. __required__ |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.Reference+sort"></a>

#### reference.sort(sort) ⇒ <code>Reference</code>
Return a new Reference with the new sorting
TODO this should validate the given sort objects,
but I'm not sure how much adding that validation will affect other apis and client

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Reference</code> - A new reference with the new sorting  
**Throws**:

- [InvalidInputError](#ERMrest.InvalidInputError) if `sort` is invalid.


| Param | Type | Description |
| --- | --- | --- |
| sort | <code>Array.&lt;Object&gt;</code> | an array of objects in the format {"column":columname, "descending":true|false} in order of priority. Undfined, null or Empty array to use default sorting. |

<a name="ERMrest.Reference+update"></a>

#### reference.update(tuples, contextHeaderParams) ⇒ <code>Promise</code>
Updates a set of resources.

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Promise</code> - A promise resolved with a object containing `successful` and `failure` attributes.
Both are [Page](#ERMrest.Page) of results.
or rejected with any of these errors:
- [InvalidInputError](#ERMrest.InvalidInputError): If `limit` is invalid or reference is not in `entry/edit` context.
- ERMrestjs corresponding http errors, if ERMrest returns http error.  

| Param | Type | Description |
| --- | --- | --- |
| tuples | <code>Array</code> | array of tuple objects so that the new data nd old data can be used to determine key changes. tuple.data has the new data tuple._oldData has the data before changes were made |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.Reference+delete"></a>

#### reference.delete(contextHeaderParams) ⇒ <code>Promise</code>
Deletes the referenced resources.
NOTE This will ignore the provided sort and paging on the reference, make
sure you are calling this on specific set or rows (filtered).

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Promise</code> - A promise resolved with empty object or rejected with any of these errors:
- ERMrestjs corresponding http errors, if ERMrest returns http error.  

| Param | Type | Description |
| --- | --- | --- |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.Reference+delete..self"></a>

##### delete~self
NOTE: previous implemenation of delete with 412 logic is here:
https://github.com/informatics-isi-edu/ermrestjs/commit/5fe854118337e0a63c6f91b4f3e139e7eadc42ac

We decided to drop the support for 412, because the etag that we get from the read function
is different than the one delete expects. The reason for that is because we are getting etag
in read with joins in the request, which affects the etag. etag is in response to any change
to the returned data and since join introduces extra data it is different than a request
without any joins.

github issue: #425

**Kind**: inner property of [<code>delete</code>](#ERMrest.Reference+delete)  
<a name="ERMrest.Reference+related"></a>

#### reference.related([tuple]) ⇒ [<code>Array.&lt;Reference&gt;</code>](#ERMrest.Reference)
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

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  

| Param | Type | Description |
| --- | --- | --- |
| [tuple] | [<code>Tuple</code>](#ERMrest.Tuple) | the current tuple |

<a name="ERMrest.Reference+search"></a>

#### reference.search(term) ⇒ <code>Reference</code>
create a new reference with the new search
by copying this reference and clears previous search filters
search term can be:
a) A string with no space: single term or regular expression
b) A single term with space using ""
c) use space for conjunction of terms

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Reference</code> - A new reference with the new search  
**Throws**:

- [InvalidInputError](#ERMrest.InvalidInputError) if `term` is invalid.


| Param | Type | Description |
| --- | --- | --- |
| term | <code>string</code> | search term, undefined to clear search |

<a name="ERMrest.Reference+getAggregates"></a>

#### reference.getAggregates(aggregateList) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: <code>Promise</code> - - Promise contains an array of the aggregate values in the same order as the supplied aggregate list  

| Param | Type | Description |
| --- | --- | --- |
| aggregateList | [<code>Array.&lt;ColumnAggregateFn&gt;</code>](#ERMrest.ColumnAggregateFn) | list of aggregate functions to apply to GET uri |

<a name="ERMrest.Reference+setSamePaging"></a>

#### reference.setSamePaging(page) ⇒ [<code>Reference</code>](#ERMrest.Reference)
Given a page, will change the reference paging options (before, and after)
to match the page.
NOTE: Limitations:
- Current reference's table and page's table must be the same.
- page's reference cannot have any facets (apart from search).

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: [<code>Reference</code>](#ERMrest.Reference) - reference with new page settings.  

| Param | Type |
| --- | --- |
| page | [<code>Page</code>](#ERMrest.Page) | 

<a name="ERMrest.Reference+getColumnByName"></a>

#### reference.getColumnByName(name) ⇒ [<code>ReferenceColumn</code>](#ERMrest.ReferenceColumn)
Find a column given its name. It will search in this order:
1. Visible columns
2. Table columns
3. search by constraint name in visible foreignkey and keys (backward compatibility)
Will throw an error if

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of column |

<a name="ERMrest.Reference+generateColumnsList"></a>

#### reference.generateColumnsList(tuple) ⇒ [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn)
Generates the list of visible columns
The logic is as follows:

1. check if visible-column annotation is present for this context, go through the list,
     1.1 if it's an array,
         1.1.1 find the corresponding foreign key
         1.1.2 avoid duplicate foreign keys.
         1.1.3 make sure it is not hidden(+).
         1.1.4 if it's outbound foreign key, create a pseudo-column for that.
         1.1.5 if it's inbound foreign key, create the related reference and a pseudo-column based on that.
     1.2 otherwise find the corresponding column if exits and add it (avoid duplicate),
         apply *addColumn* heuristics explained below.

2.otherwise go through list of table columns
     2.0 create a pseudo-column for key if context is not detailed, entry, entry/create, or entry/edit and we have key that is notnull and notHTML
     2.1 check if column has not been processed before.
     2.2 hide the columns that are part of origFKR.
     2.3 if column is serial and part of a simple key hide it.
     2.4 if it's not part of any foreign keys
         apply *addColumn* heuristics explained below.
     2.5 go through all of the foreign keys that this column is part of.
         2.5.1 make sure it is not hidden(+).
         2.5.2 if it's simple fk, just create PseudoColumn
         2.5.3 otherwise add the column just once and append just one PseudoColumn (avoid duplicate)

*addColumn* heuristics:
 + If column doesn't have asset annotation or its type is not `text`, add a normal ReferenceColumn.
 + Otherwise:
     + If it has `url_pattern`: add AssetPseudoColumn.
     + Otherwise:
         - in entry context: remove it from the visible columns list.
         - in other contexts: ignore the asset annotation, treat it as normal column.

NOTE:
 + If asset annotation was used and context is entry,
     we should remove the columns that are used as filename, byte, sha256, or md5.
 + If this reference is actually an inbound related reference,
     we should hide the foreign key (and all of its columns) that created the link.

**Kind**: instance method of [<code>Reference</code>](#ERMrest.Reference)  
**Returns**: [<code>Array.&lt;ReferenceColumn&gt;</code>](#ERMrest.ReferenceColumn) - Array of [ReferenceColumn](#ERMrest.ReferenceColumn).  

| Param | Type | Description |
| --- | --- | --- |
| tuple | [<code>Tuple</code>](#ERMrest.Tuple) | the data for the current refe |

<a name="ERMrest.AttributeGroupReference"></a>

### ERMrest.AttributeGroupReference : <code>object</code>
**Kind**: static namespace of [<code>ERMrest</code>](#ERMrest)  

* [.AttributeGroupReference](#ERMrest.AttributeGroupReference) : <code>object</code>
    * [new AttributeGroupReference(keyColumns, aggregateColumns, location, catalog)](#new_ERMrest.AttributeGroupReference_new)
    * [._keyColumns](#ERMrest.AttributeGroupReference+_keyColumns) : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
    * [._aggregateColumns](#ERMrest.AttributeGroupReference+_aggregateColumns) : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
    * [.aggregate](#ERMrest.AttributeGroupReference+aggregate) : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
    * [.displayname](#ERMrest.AttributeGroupReference+displayname) : <code>object</code>
    * [.columns](#ERMrest.AttributeGroupReference+columns) : <code>Array.&lt;AttributeGroupColumn&gt;</code>
    * [.uri](#ERMrest.AttributeGroupReference+uri) : <code>string</code>
    * [.read([limit], contextHeaderParams)](#ERMrest.AttributeGroupReference+read) ⇒ <code>ERMRest.AttributeGroupPage</code>

<a name="new_ERMrest.AttributeGroupReference_new"></a>

#### new AttributeGroupReference(keyColumns, aggregateColumns, location, catalog)
Constructs a Reference object.

This object will be the main object that client will interact with, when we want
to use ermrset `attributegroup` api. Referencse are immutable and therefore can be
safely passed around and used between multiple client components without risk that the
underlying reference to server-side resources could change.

Usage:
 - Clients can use this constructor to create attribute group references if needed.
 - This will currently be used by the aggregateGroup functions to return a
   AttributeGroupReference rather than a [Reference](#ERMrest.Reference)


| Param | Type | Description |
| --- | --- | --- |
| keyColumns | <code>Array.&lt;ERMRest.AttributeGroupColumn&gt;</code> | List of columns that will be used as keys for the attributegroup request. |
| aggregateColumns | <code>Array.&lt;ERMRest.AttributeGroupColumn&gt;</code> | List of columns that will create the aggreagte columns list in the request. |
| location | <code>ERMRest.AttributeGroupLocation</code> | The location object. |
| catalog | <code>ERMRest.Catalog</code> | The catalog object. |

<a name="ERMrest.AttributeGroupReference+_keyColumns"></a>

#### attributeGroupReference._keyColumns : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
Array of AttributeGroupColumn that will be used as the key columns

**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+_aggregateColumns"></a>

#### attributeGroupReference._aggregateColumns : <code>Array.&lt;ERMrest.AttributeGroupColumn&gt;</code>
Array of AttributeGroupColumn that will be used for the aggregate results

**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+aggregate"></a>

#### attributeGroupReference.aggregate : [<code>ReferenceAggregateFn</code>](#ERMrest.ReferenceAggregateFn)
**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+displayname"></a>

#### attributeGroupReference.displayname : <code>object</code>
the displayname of the reference
TODO not sure if this sis needed

**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+columns"></a>

#### attributeGroupReference.columns : <code>Array.&lt;AttributeGroupColumn&gt;</code>
Visible columns

**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+uri"></a>

#### attributeGroupReference.uri : <code>string</code>
The attributegroup uri.
<service>/catalog/<_catalogId>/attributegroup/<path>/<search>/<_keyColumns>;<_aggregateColumns><sort><page>

NOTE:
- Since this is the object that has knowledge of columns, this should be here.
  (we might want to relocate it to the AttributeGroupLocation object.)
- ermrest can processs this uri.

**Kind**: instance property of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  
<a name="ERMrest.AttributeGroupReference+read"></a>

#### attributeGroupReference.read([limit], contextHeaderParams) ⇒ <code>ERMRest.AttributeGroupPage</code>
**Kind**: instance method of [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)  

| Param | Type | Description |
| --- | --- | --- |
| [limit] | <code>int</code> |  |
| contextHeaderParams | <code>Object</code> | the object that we want to log. |

<a name="ERMrest.AttributeGroupPage"></a>

### ERMrest.AttributeGroupPage : <code>object</code>
**Kind**: static namespace of [<code>ERMrest</code>](#ERMrest)  

* [.AttributeGroupPage](#ERMrest.AttributeGroupPage) : <code>object</code>
    * [new AttributeGroupPage(reference, data, hasPrevious, hasNext)](#new_ERMrest.AttributeGroupPage_new)
    * [.reference](#ERMrest.AttributeGroupPage+reference) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
    * [.hasPrevious](#ERMrest.AttributeGroupPage+hasPrevious) ⇒ <code>boolean</code>
    * [.hasNext](#ERMrest.AttributeGroupPage+hasNext) ⇒ <code>boolean</code>
    * [.tuples](#ERMrest.AttributeGroupPage+tuples) : [<code>Array.&lt;AttributeGroupTuple&gt;</code>](#ERMrest.AttributeGroupTuple)
    * [.next](#ERMrest.AttributeGroupPage+next) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>
    * [.previous](#ERMrest.AttributeGroupPage+previous) : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>

<a name="new_ERMrest.AttributeGroupPage_new"></a>

#### new AttributeGroupPage(reference, data, hasPrevious, hasNext)
Constructs a AttributeGroupPage object. A _page_ represents a set of results returned from
ERMrest. It may not represent the complete set of results. There is an
iterator pattern used here, where its [previous](#ERMrest.AttributeGroupPage+previous) and
[next](#ERMrest.AttributeGroupPage+next) properties will give the client a
[AttributeGroupReference](#ERMrest.AttributeGroupReference) to the previous and next set of results,
respectively.

Usage:
 - Clients _do not_ directly access this constructor.
 - This will currently be used by the AggregateGroupReference to return a
   AttributeGroupPage rather than a [Page](#ERMrest.Page)
 See [read](#ERMrest.AttributeGroupReference+read).


| Param | Type | Description |
| --- | --- | --- |
| reference | <code>ERMRest.AttributeGroupReference</code> | aggregate reference representing the data for this page |
| data | <code>Array.&lt;Object&gt;</code> | The data returned from ERMrest |
| hasPrevious | <code>Boolean</code> | Whether database has some data before current page |
| hasNext | <code>Boolean</code> | Whether database has some data after current page |

<a name="ERMrest.AttributeGroupPage+reference"></a>

#### attributeGroupPage.reference : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference)
The page's associated reference.

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupPage+hasPrevious"></a>

#### attributeGroupPage.hasPrevious ⇒ <code>boolean</code>
Whether there is more entities before this page

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupPage+hasNext"></a>

#### attributeGroupPage.hasNext ⇒ <code>boolean</code>
Whether there is more entities after this page

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupPage+tuples"></a>

#### attributeGroupPage.tuples : [<code>Array.&lt;AttributeGroupTuple&gt;</code>](#ERMrest.AttributeGroupTuple)
An array of processed tuples.

Usage:
```
for (var i=0, len=page.tuples.length; i<len; i++) {
  var tuple = page.tuples[i];
  console.log("Tuple:", tuple.displayname.value, "has values:", tuple.values);
}
```

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupPage+next"></a>

#### attributeGroupPage.next : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>
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

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupPage+previous"></a>

#### attributeGroupPage.previous : [<code>AttributeGroupReference</code>](#ERMrest.AttributeGroupReference) \| <code>null</code>
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

**Kind**: instance property of [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage)  
<a name="ERMrest.AttributeGroupTuple"></a>

### ERMrest.AttributeGroupTuple : <code>object</code>
**Kind**: static namespace of [<code>ERMrest</code>](#ERMrest)  

* [.AttributeGroupTuple](#ERMrest.AttributeGroupTuple) : <code>object</code>
    * [new AttributeGroupTuple(page, data)](#new_ERMrest.AttributeGroupTuple_new)
    * [.isHTML](#ERMrest.AttributeGroupTuple+isHTML) : <code>Array.&lt;boolean&gt;</code>
    * [.uniqueId](#ERMrest.AttributeGroupTuple+uniqueId) : <code>string</code>
    * [.displayname](#ERMrest.AttributeGroupTuple+displayname) : <code>string</code>

<a name="new_ERMrest.AttributeGroupTuple_new"></a>

#### new AttributeGroupTuple(page, data)
Constructs a new Tuple. In database jargon, a tuple is a row in a
relation. This object represents a row returned by a query to ERMrest.

Usage:
 Clients _do not_ directly access this constructor.
 See [tuples](#ERMrest.AttributeGroupPage+tuples).


| Param | Type | Description |
| --- | --- | --- |
| page | [<code>AttributeGroupPage</code>](#ERMrest.AttributeGroupPage) | The Page object from which this data was acquired. |
| data | <code>Object</code> | The unprocessed tuple of data returned from ERMrest. |

<a name="ERMrest.AttributeGroupTuple+isHTML"></a>

#### attributeGroupTuple.isHTML : <code>Array.&lt;boolean&gt;</code>
The array of boolean values of this tuple speicifying the value is HTML or not. The ordering of the
values in the array matches the ordering of the columns in the
reference (see [columns](#ERMrest.Reference+columns)).
TODO Eventually should be refactored (https://github.com/informatics-isi-edu/ermrestjs/issues/189).

**Kind**: instance property of [<code>AttributeGroupTuple</code>](#ERMrest.AttributeGroupTuple)  
<a name="ERMrest.AttributeGroupTuple+uniqueId"></a>

#### attributeGroupTuple.uniqueId : <code>string</code>
The unique identifier for this tuple composed of the values for each
of the shortest key columns concatenated together by an '_'

**Kind**: instance property of [<code>AttributeGroupTuple</code>](#ERMrest.AttributeGroupTuple)  
<a name="ERMrest.AttributeGroupTuple+displayname"></a>

#### attributeGroupTuple.displayname : <code>string</code>
The _display name_ of this tuple. currently it will be values of
key columns concatenated together by `_`.

Usage:
```
console.log("This tuple has a displayable name of ", tuple.displayname.value);
```

**Kind**: instance property of [<code>AttributeGroupTuple</code>](#ERMrest.AttributeGroupTuple)  
<a name="ERMrest.BucketAttributeGroupReference"></a>

### ERMrest.BucketAttributeGroupReference : <code>object</code>
**Kind**: static namespace of [<code>ERMrest</code>](#ERMrest)  
<a name="ERMrest.configure"></a>

### ERMrest.configure(http, q)
This function is used to configure the module

**Kind**: static method of [<code>ERMrest</code>](#ERMrest)  

| Param | Type | Description |
| --- | --- | --- |
| http | <code>Object</code> | Angular $http service object |
| q | <code>Object</code> | Angular $q service object |

<a name="ERMrest.getServer"></a>

### ERMrest.getServer(uri, [contextHeaderParams]) ⇒ [<code>Server</code>](#ERMrest.Server)
ERMrest server factory creates or reuses ERMrest.Server instances. The
URI should be to the ERMrest _service_. For example,
`https://www.example.org/ermrest`.

**Kind**: static method of [<code>ERMrest</code>](#ERMrest)  
**Returns**: [<code>Server</code>](#ERMrest.Server) - Returns a server instance.  
**Throws**:

- [<code>InvalidInputError</code>](#ERMrest.InvalidInputError) URI is missing


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| uri | <code>string</code> |  | URI of the ERMrest service. |
| [contextHeaderParams] | <code>Object</code> | <code>{cid:&#x27;null&#x27;}</code> | An optional server header parameters for context logging appended to the end of any request to the server. |

<a name="ERMrest.parse"></a>

### ERMrest.parse(uri) ⇒ <code>ERMrest.Location</code>
This function parses a URI and constructs a representation of the URI.

**Kind**: static method of [<code>ERMrest</code>](#ERMrest)  
**Returns**: <code>ERMrest.Location</code> - Location object created from the URI.  
**Throws**:

- [<code>InvalidInputError</code>](#ERMrest.InvalidInputError) If the URI does not contain the
service name.


| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | An ERMrest resource URI to be parsed. |

<a name="ERMrest.resolve"></a>

### ERMrest.resolve(uri, [contextHeaderParams]) ⇒ <code>Promise</code>
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

**Kind**: static method of [<code>ERMrest</code>](#ERMrest)  
**Returns**: <code>Promise</code> - Promise when resolved passes the
[Reference](#ERMrest.Reference) object. If rejected, passes one of:
[MalformedURIError](#ERMrest.MalformedURIError)
[TimedOutError](#ERMrest.TimedOutError),
[InternalServerError](#ERMrest.InternalServerError),
[ConflictError](#ERMrest.ConflictError),
[ForbiddenError](#ERMrest.ForbiddenError),
[UnauthorizedError](#ERMrest.UnauthorizedError),
[NotFoundError](#ERMrest.NotFoundError),
[InvalidSortCriteria](#ERMrest.InvalidSortCriteria),  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>string</code> | An ERMrest resource URI, such as `https://example.org/ermrest/catalog/1/entity/s:t/k=123`. |
| [contextHeaderParams] | <code>Object</code> | An optional context header parameters object. The (key, value) pairs from the object are converted to URL `key=value` query parameters and appended to every request to the ERMrest service. |

<a name="httpUnauthorizedFn"></a>

## httpUnauthorizedFn : <code>function</code>
set callback function which will be called when a HTTP 401 Error occurs

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| fn | [<code>httpUnauthorizedFn</code>](#httpUnauthorizedFn) | callback function |

<a name="appLinkFn"></a>

## appLinkFn : <code>function</code>
set callback function that converts app tag to app URL

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| fn | [<code>appLinkFn</code>](#appLinkFn) | callback function |

<a name="onHTTPSuccess"></a>

## onHTTPSuccess : <code>function</code>
set callback function that triggers when a request returns with success

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| fn | [<code>onHTTPSuccess</code>](#onHTTPSuccess) | callback function |

<a name="onError"></a>

## onError ⇒ <code>Promise</code>
Calculates  MD5 checksum for a file using spark-md5 library

**Kind**: global typedef  
**Returns**: <code>Promise</code> - if the schema exists or not  

| Param | Type | Description |
| --- | --- | --- |
| chunkSize | <code>number</code> | size of the chunks, in which the file is supposed to be broken |
| fn | <code>onProgress</code> | callback function to be called for progress |
| fn | <code>onSuccess</code> | callback function to be called for success |
| fn | [<code>onError</code>](#onError) | callback function to be called for error |

