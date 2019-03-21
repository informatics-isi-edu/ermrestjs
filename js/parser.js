
    module.ParsedFilter = ParsedFilter;

    /**
     * The ERMrest service name. Internal use only.
     * @type {string}
     * @private
     */
    var _service_name = 'ermrest';

    /**
     * This function parses a URI and constructs a representation of the URI.
     * @memberof ERMrest
     * @function parse
     * @param {String} uri An ERMrest resource URI to be parsed.
     * @returns {ERMrest.Location} Location object created from the URI.
     * @throws {ERMrest.InvalidInputError} If the URI does not contain the
     * service name.
     */
    module.parse = function (uri) {
        var svc_idx = uri.indexOf(_service_name);
        if (svc_idx < 0) {
            throw new module.InvalidInputError('uri not contain the expected service name: ' + _service_name);
        }

        return new Location(uri);

    };

    /**
     * Given tableName, schemaName, and facets will generate a path in the following format:
     * #<catalogId>/<tableName>:<schemaName>/*::facets::<FACETSBLOB>/*::cfacets:<CUSTOMFACETBLOB>/
     * @param  {string} schemaName Name of schema, can be null
     * @param  {string} tableName  Name of table
     * @param  {object} facets     an object
     * @param  {object} cfacets    an object
     * @return {string}            a path that ERMrestJS understands and can parse, can be undefined
     */
    module.createPath = function (catalogId, schemaName, tableName, facets, cfacets) {
        verify(typeof catalogId === "string" && catalogId.length > 0, "catalogId must be an string.");
        verify(typeof tableName === "string" && tableName.length > 0, "tableName must be an string.");

        var compactPath = "#" + catalogId + "/";
        if (schemaName) {
            compactPath += module._fixedEncodeURIComponent(schemaName) + ":";
        }
        compactPath += module._fixedEncodeURIComponent(tableName);

        if (facets && typeof facets === "object" && Object.keys(facets).length !== 0) {
            compactPath += "/*::facets::" + module.encodeFacet(facets);
        }

        if (cfacets && typeof cfacets === "object" && Object.keys(cfacets).length !== 0) {
            compactPath += "/*::cfacets::" + module.encodeFacet(cfacets);
        }

        return compactPath;
    };


    /**
     * Given tableName, schemaName, and facets will return a location object
     * @param  {string} service    the service url
     * @param  {string} schemaName Name of schema, can be null
     * @param  {string} tableName  Name of table
     * @param  {object} facets     an object
     * @param  {object} cfacets    an object
     * @return {string}            a path that ERMrestJS understands and can parse, can be undefined
     */
    module.createLocation = function (service, catalogId, schemaName, tableName, facets, cfacets) {
        verify(typeof service === "string" && service.length > 0, "service must be an string.");
        verify(typeof catalogId === "string" && catalogId.length > 0, "catalogId must be an string.");
        verify(typeof tableName === "string" && tableName.length > 0, "tableName must be an string.");

        var compactPath = "";
        if (schemaName) {
            compactPath += module._fixedEncodeURIComponent(schemaName) + ":";
        }
        compactPath += module._fixedEncodeURIComponent(tableName);

        if (facets && typeof facets === "object" && Object.keys(facets).length !== 0) {
            compactPath += "/*::facets::" + module.encodeFacet(facets);
        }

        if (cfacets && typeof cfacets === "object" && Object.keys(cfacets).length !== 0) {
            compactPath += "/*::cfacets::" + module.encodeFacet(cfacets);
        }

        if (service.endsWith("/")) service = service.slice(0, -1);
        return module.parse(service + "/catalog/" + catalogId + "/entity/" + compactPath);
    };

    var MAIN_TABLE_ALIAS = "M";
    var JOIN_TABLE_ALIAS_PREFIX = "T";

    /**
     * The parse handles URI in this format
     *  <service>/catalog/<catalog_id>/<api>/<schema>:<table>/[path parts][modifiers][query params]
     *
     * where
     *  - path part: [facet][cfacet][filter]
     *  - modifiers: [@sort(col...)][@before(...)/@after(...)]
     *
     *
     * uri = <service>/catalog/<catalog>/<api>/<path><sort><paging>?<limit>
     * service: the ERMrest service endpoint such as https://www.example.com/ermrest.
     * catalog: the catalog identifier for one dataset.
     * api: the API or data resource space identifier such as entity, attribute, attributegroup, or aggregate.
     * path: the data path which identifies one filtered entity set with optional joined context.
     * sort: optional @sort
     * paging: optional @before/@after
     * query params: optional ?
     *
     * @param {String} uri full path
     * @constructor
     */
    function Location(uri) {

        // full uri
        this._uri = uri;

        // extract the query params
        if (uri.indexOf("?") !== -1) {
            parts = uri.split("?");
            uri = parts[0];
            this._queryParamsString = parts[1];
            this._queryParams = _getQueryParams(parts[1]);
        } else {
            this._queryParams = {};
        }

        // compactUri is the full uri without modifiers
        if (uri.indexOf("@sort(") !== -1) {
            this._compactUri = uri.split("@sort(")[0];
        } else if (uri.indexOf("@before(") !== -1) {
            this._compactUri = uri.split("@before(")[0];
        } else if (uri.indexOf("@after(") !== -1) {
            this._compactUri = uri.split("@after(")[0];
        } else {
            this._compactUri = uri;
        }
        // there might be an extra slash at the end of the url
        this._compactUri = module._stripTrailingSlash(this._compactUri);

        // service
        parts = uri.match(/(.*)\/catalog\/([^\/]*)\/(entity|attribute|aggregate|attributegroup)\/(.*)/);
        this._service = parts[1];

        // catalog id
        this._catalogSnapshot = parts[2];

        var catalogParts = this._catalogSnapshot.split('@');
        this._catalog = catalogParts[0];
        this._version = catalogParts[1] || null;

        // api
        this._api = parts[3];

        // path is everything after catalog id
        this._path = parts[4];

        var modifiers = uri.split(this._compactUri)[1]; // emtpy string if no modifiers

        // compactPath is path without modifiers
        this._compactPath = (modifiers === "" ? this._path : this._path.split(modifiers)[0]);

        // there might be an extra slash at the end of the url
        this._compactPath = module._stripTrailingSlash(this._compactPath);

        // <sort>/<page>
        // sort and paging
        if (modifiers) {
            if (modifiers.indexOf("@sort(") !== -1) {
                this._sort = modifiers.match(/(@sort\([^\)]*\))/)[1];
            }
            // sort must specified to use @before and @after
            if (modifiers.indexOf("@before(") !== -1) {
                if (this._sort) {
                    this._before = modifiers.match(/(@before\([^\)]*\))/)[1];
                } else {
                    throw new module.InvalidPageCriteria("Sort modifier is required with paging.", this._path);
                }
            }

            if (modifiers.indexOf("@after(") !== -1) {
                if (this._sort) {
                    this._after = modifiers.match(/(@after\([^\)]*\))/)[1];
                } else {
                    throw new module.InvalidPageCriteria("Sort modifier is required with paging.", this._path);
                }
            }
        }

        // Split compact path on '/'
        var parts = this._compactPath.split('/');

        if (parts.length === 0) throw new ERMrest.MalformedURIError("Given url must start with `schema:table.");

        //<schema:table>
        // first schema name and first table name
        var params = parts[0].split(':');
        if (params.length > 1) {
            this._rootSchemaName = decodeURIComponent(params[0]);
            this._rootTableName = decodeURIComponent(params[1]);
        } else {
            this._rootSchemaName = null;
            this._rootTableName = decodeURIComponent(params[0]);
        }

        // pathParts: <joins/facet/cfacet/filter/>
        var joinRegExp = /(?:left|right|full|^)\((.*)\)=\((.*:.*:.*)\)/,
            facetsRegExp = /\*::facets::(.+)/,
            customFacetsRegExp = /\*::cfacets::(.+)/;

        var schemaTable = parts[0], table = this._rootTableName, schema = this._rootSchemaName;
        var self = this, pathParts = [], alias, match, prevJoin = false;
        var facets, cfacets, filter, filtersString, searchTerm, join, joins = [];

        // go through each of the parts
        parts.forEach(function (part, index) {
            // this is the schema:table
            if (index === 0) return;

            // slash at the end of the url
            if (index === parts.length - 1 && part === "") return;

            // join
            match = part.match(joinRegExp);
            if (match) {
                // there wasn't any join before, so this is the start of new path,
                // so we should create an object for the previous one.
                if (!prevJoin && index !== 1) {
                    // we're creating this for the previous section, so we should use the previous index
                    // Alias will be T, T1, T2, ... (notice we don't have T0)
                    alias = JOIN_TABLE_ALIAS_PREFIX + (pathParts.length > 1 ? pathParts.length-1 : "");
                    pathParts.push(new PathPart(alias, joins, schema, table, facets, cfacets, filter, filtersString));
                    filter = undefined; filtersString = undefined; cfacets = undefined; facets = undefined; join = undefined; joins = [];
                }

                join = new ParsedJoin(match, table, schema);
                joins.push(join);
                prevJoin = true;

                // will be used for the next join
                table = joins[joins.length-1].toTable;
                schema = joins[joins.length-1].toSchema;
                return;
            }

            prevJoin = false;

            // facet
            match = part.match(facetsRegExp);
            if (match) {
                if (facets) {
                    throw new module.InvalidFacetOperatorError(self._path, module._facetingErrors.duplicateFacets);
                }
                facets = new ParsedFacets(match[1], self._path);
                return;
            }

            // custom facet
            match = part.match(customFacetsRegExp);
            if (match) {
                if (cfacets) {
                    throw new module.InvalidCustomFacetOperatorError(self._path, module._facetingErrors.duplicateFacets);
                }
                cfacets = new CustomFacets(match[1], self._path);
                return;
            }

            // filter
            filtersString = part;
            filter = _processFilterPathPart(part, self._path);
        });

        // this is for the last part of url that might not end with join.
        if (filter || cfacets || facets || joins.length > 0) {
            pathParts.push(new PathPart(MAIN_TABLE_ALIAS, joins, schema, table, facets, cfacets, filter, filtersString));
        }

        this._pathParts = pathParts;
    }

    Location.prototype = {

        /**
         * Override the toString function
         * @returns {String} the string representation of the Location, which is the full URI.
         */
        toString: function(){
            return this.uri;
        },


        /**
         * The complete uri that is understandable by ermrestjs
         * NOTE: some of the components might not be understanable by ermrest, because of pseudo operator (e.g., ::facets::).
         *
         * @returns {String} The full URI of the location
         */
        get uri() {
            if (this._uri === undefined) {
                this._uri = this.compactUri + this._modifiers +  (this.queryParamsString ? "?" + this.queryParamsString : "");
            }
            return this._uri;
        },

        /**
         * <service>/catalog/<catalogId>/<api>/<rootSchema:rootTable>/<filters>/<joins>/<search>
         *
         * NOTE: some of the components might not be understanable by ermrest, because of pseudo operator (e.g., ::search::).
         * @returns {String} The URI without modifiers or queries
         */
        get compactUri() {
            if (this._compactUri === undefined) {
                var path = [this.service, "catalog", this.catalog, this.api].join("/");
                this._compactUri = path + "/" + this.compactPath;
            }
            return this._compactUri;
        },

        /**
         * A path that is understanable by ermrestjs. It includes the modifiers.
         *  NOTE: some of the components might not be understanable by ermrest, because of pseudo operator (e.g., ::search::).
         *
         * @returns {String} Path portion of the URI
         * This is everything after the catalog id
         */
        get path() {
            if (this._path === undefined) {
                this._path = this.compactPath + this._modifiers;
            }
            return this._path;
        },

        /**
         * A path that is understanable by ermrestjs. It doesn't inlcude the modifiers
         * NOTE: some of the components might not be understanable by ermrest, because of pseudo operator (e.g., ::facets::).
         *
         * @returns {String} Path without modifiers or queries
         */
        get compactPath() {
            if (this._compactPath === undefined) {
                var self = this;
                var uri = "";
                if (this.rootSchemaName) {
                    uri += module._fixedEncodeURIComponent(this.rootSchemaName) + ":";
                }
                uri += module._fixedEncodeURIComponent(this.rootTableName);

                uri += this.pathParts.reduce(function (prev, part, i) {
                    var res = prev;
                    if (part.joins) {
                        res += part.joins.reduce(function (prev, join, i) {
                            return prev + "/" + join.str;
                        }, "");
                    }
                    if (part.facets) {
                        res += "/*::facets::" + part.facets.encoded;
                    }
                    if (part.customFacets) {
                        res += "/*::cfacets::" + part.customFacets.encoded;
                    }
                    if (part.filtersString) {
                        res += "/" + part.filtersString;
                    }
                    return res;
                }, "");

                this._compactPath = uri;
            }
            return this._compactPath;
        },

        /**
         * Returns a uri that ermrest understands.
         * should only be used for internal usage and sending request to ermrest
         *
         * @returns {String} The URI without modifiers or queries for ermrest
         */
        get ermrestCompactUri() {
            if (this._ermrestCompactUri === undefined) {
                var path = [this.service, "catalog", this.catalog, this.api].join("/");
                this._ermrestCompactUri = path + "/" + this.ermrestCompactPath;
            }
            return this._ermrestCompactUri;
        },

        /**
         * Returns a path that ermrest understands.
         * should only be used for internal usage and sending request to ermrest.
         *
         * @returns {String} Path portion of the URI
         * This is everything after the catalog id for ermrest
         */
        get ermrestPath() {
            if (this._ermrestPath === undefined) {
                this._ermrestPath = this.ermrestCompactPath + this._modifiers;
            }
            return this._ermrestPath;
        },

        /**
         * Returns a path that ermrest understands. It doesn't include the modifiers.
         * This attribute will add extra aliases to the url, so the facets can refer to those
         * aliases. So assuming that the follwoing is the path (F means the combination of filter, facet, and cfacet):
         *
         * S:R /F0 /J1 /F1 /J2 /F2 /…/Ji-1 /Fi-1 /Ji /Fi /Ji+1 /Fi+1 /… /Jn /Fn
         *
         * This will be the ermrest path:
         *
         * T:=S:R /F0 /T1:=J1 /F1 /… /Ti-1:=Ji-1 /Fi-1 /Ti:=Ji /Fi /Ti+1:=Ji+1 /Fi+1 /…./M:=Jn /Fn
         *
         * And if Fi has null filter, and therefore is using a right join,
         * the following will be the ermest path:
         *
         * Ti:=Fi /Ti-1:=RevJi /Fi-1 /Ti-2:=RevJi-1 /… /T1:=RevJ2 /F1 /T:=RevJ1 /F0 /$Ti /Ti+1:=Ji+1 /Fi+1 /… /M:=Jn/Fn
         *
         * Which will be in this format:
         * (<parsed facets starting from the faect with null>/<rev join of the parsed facets>)+/$T(facet with null)/(<parsed facet and join of parts after the null index>)*
         *
         *
         * @returns {String} Path without modifiers or queries for ermrest
         */
        get ermrestCompactPath() {
            if (this._ermrestCompactPath === undefined) {
                var self = this;
                var rightJoinIndex = -1, i;
                var uri = "", alias;

                // returns the proper string presentation of a series of joins
                // parameters:
                //  - joins: array of ParsedJoin objects.
                //  - alias: the alias that will be attached to the end of the path
                //  - reverse: whether we want to return the reversed join string
                var joinsStr = function (joins, alias, reverse) {
                    var fn = reverse ? "reduceRight" : "reduce";
                    var joinStr = reverse ? "strReverse" : "str";
                    var last = reverse ? 0 : joins.length - 1;
                    var first = reverse ? joins.length -1 : 0;

                    return joins[fn](function (res, join, i) {
                        return res + (i !== first ? "/" : "") + ((i === last) ? (alias + ":=") : "") + join[joinStr];
                    }, "");
                };

                // get the parsed one, and count the number of right joins
                var parsedPartsWithoutJoin = self.pathParts.map(function (part, index) {
                    var res = [], facetRes;

                    // facet
                    if (part.facets) {
                        facetRes = _JSONToErmrestFilter(part.facets.decoded, part.alias, part.table, self.catalog, module._constraintNames);
                        if (!facetRes.successful) {
                            throw new module.InvalidFacetOperatorError(self.path, facetRes.message);
                        }
                        if (facetRes.rightJoin) {
                            // we only allow one right join (null fitler)
                            if (rightJoinIndex !== -1) {
                                throw new module.MalformedURIError("Only one facet in url can have `null` filter.");
                            }
                            rightJoinIndex = index;
                        }
                        res.push(facetRes.parsed);
                    }

                    // cfacet
                    if (part.customFacets) {
                        if (part.customFacets.facets) {
                            facetRes = _JSONToErmrestFilter(part.customFacets.facets.decoded, part.alias, part.table, self.catalog, module._constraintNames);
                            if (!facetRes.successful) {
                                throw new module.InvalidCustomFacetOperatorError(self.path, facetRes.message);
                            }
                            if (facetRes.rightJoin) {
                                throw new module.InvalidCustomFacetOperatorError(self.path, "`null` choice facet is not allowed in custom facets");
                            }
                            res.push(facetRes.parsed);
                        }

                        if (typeof part.customFacets.ermrestPath === "string") {
                            res.push(part.customFacets.ermrestPath);
                        }
                    }

                    //filter
                    if (part.filtersString) {
                        res.push(part.filtersString);
                    }

                    return res.join("/");
                });

                // no rightJoin: s:t/<parths>
                if (rightJoinIndex === -1) {
                    uri = self.rootTableAlias + ":=";
                    if (this.rootSchemaName) {
                        uri += module._fixedEncodeURIComponent(self.rootSchemaName) + ":";
                    }
                    uri += module._fixedEncodeURIComponent(this.rootTableName);
                }
                // we have right index, then every path before null must be reversed
                else {
                    // url format:
                    // (<parsed facets starting from the faect with null>/<rev join of the parsed facets>)+/$T(facet with null)/(<parsed facet and join of parts after the null index>)*
                    for (i = rightJoinIndex; i >= 0; i--) {
                        if (parsedPartsWithoutJoin[i]) {
                            uri += (uri.length > 0 ? "/" : "") + parsedPartsWithoutJoin[i];
                        }

                        if (self.pathParts[i].joins.length > 0) {
                            alias = i > 0 ? self.pathPart[i-1].alias : self.rootTableAlias;
                            uri += "/" + joinStr(self.pathParts[i].joins, alias, true);
                        }
                    }

                    // if there was pathParts before facet with null, change back to the facet with null
                    if (self.pathParts[rightJoinIndex].joins.length > 0) {
                        uri += "/$" + self.pathParts[i].alias;
                    }
                }

                // from the facet with null to end, we have to add path parts in the same order.
                for (i = rightJoinIndex + 1; i < self.pathParts.length; i++) {
                    var part = self.pathParts[i];
                    if (part.joins.length > 0) {
                        uri += "/" + joinsStr(part.joins, part.alias, false);
                    }
                    if (parsedPartsWithoutJoin[i]) {
                        uri += "/" + parsedPartsWithoutJoin[i];
                    }
                }

                this._ermrestCompactPath = uri;
            }
            return this._ermrestCompactPath;
        },

        /**
         * Array of path parts
         * @type {PathPart[]}
         */
        get pathParts() {
            return this._pathParts;
        },

        /**
         *
         * @returns {String} The URI of ermrest service
         */
        get service() {
            return this._service;
        },

        /**
         *
         * @returns {String} catalog id
         */
        get catalog() {
            return this._catalogSnapshot;
        },

        /**
         *
         * @returns {String} just the catalog id
         */
        get catalogId() {
            return this._catalog;
        },

        /**
         *
         * @returns {String} just the catalog version
         */
        get version() {
            return this._version;
        },

        /**
        * version is a 64-bit integer representing microseconds since the Unix "epoch"
        * The 64-bit integer is encoded using a custom base32 encoding scheme
        * @param {String} version - optional, include this param if no version in uri
        * @returns {String} the version decoded to it's time since epoch in milliseconds
        */
        get versionAsMillis() {
            if (this._versionAsMillis === undefined) {
                this._versionAsMillis = module.versionDecodeBase32(this._version);
            }
            return this._versionAsMillis;
        },

        /**
         *
         * @returns {String} API of the ermrest service.
         * API includes entity, attribute, aggregate, attributegroup
         */
        get api() {
            return this._api;
        },

        /**
         *
         * @returns {string} The first schema name in the projection table, null if schema is not specified
         */
        get rootSchemaName() {
            return this._rootSchemaName;
        },

        /**
         * Subject to change soon
         * @returns {string} The first table name in the projection table
         */
        get rootTableName() {
            return this._rootTableName;
        },

        /**
         *
         * @returns {string} the schema name which the uri referres to, null if schema is not specified
         */
        get schemaName() {
            if (this._schemaName === undefined) {
                this._schemaName = this.lastJoin ? this.lastJoin.toSchema : this._rootSchemaName;
            }
            return this._schemaName;
        },

        /**
         *
         * @type {string} tablename - the table name which the uri referres to
         */
        get tableName() {
            if (this._tableName === undefined) {
                this._tableName = this.lastJoin ? this.lastJoin.toTable : this._rootTableName;
            }
            return this._tableName;
        },

        /**
         * Name of the schema name for the base table of faceting
         * @type {String}
         */
        get facetBaseSchemaName() {
            if (this._baseSchemaName === undefined) {
                var secondTolast = this.facetBasePathPart;
                this._baseSchemaName = secondTolast ? secondTolast.schema : this.rootSchemaName;
            }
            return this._baseSchemaName;
        },

        /**
         * Name of the base table for faceting
         * @type{String}
         */
        get facetBaseTableName() {
            if (this._baseTableName === undefined) {
                var secondTolast = this.facetBasePathPart;
                this._baseTableName = secondTolast ? secondTolast.table : this.rootTableName;
            }
            return this._baseTableName;
        },

        /**
         * The alias that will be used for the base table that should be used for faceting
         * @type {String}
         */
        get facetBaseTableAlias() {
            if (this._facetBaseTableAlias === undefined) {
                var secondTolast = this.facetBasePathPart;
                this._facetBaseTableAlias = secondTolast ? secondTolast.alias : this.rootTableAlias;
            }
            return this._facetBaseTableAlias;
        },

        /**
         * The alias that will be used for the root table
         * @type {String}
         */
        get rootTableAlias () {
            if (this._rootTableAlias === undefined) {
                this._rootTableAlias = this.hasJoin ? "T" : this.mainTableAlias;
            }
            return this._rootTableAlias;
        },

        /**
         * The alias that will be used for the main table (the projection table)
         * @type {String}
         */
        get mainTableAlias() {
            return MAIN_TABLE_ALIAS;
        },


        /**
         * filter is converted to the last join table (if uri has join)
         * @returns {ParsedFilter} undefined if there is no filter
         */
        get filter() {
            return this.lastPathPart ? this.lastPathPart.filter : undefined;
        },

        get filtersString() {
            return this.lastPathPart ? this.lastPathPart.filtersString : undefined;
        },

        /**
         * A dictionary of available query parameters
         * @returns {Object}
         */
        get queryParams() {
            return this._queryParams;
        },

        /**
         * The query parameters string (key1=val1&key2=val2).
         * @returns {String}
         */
        get queryParamsString() {
            return this._queryParamsString;
        },

        /**
        * If there's a join(linking) at the end or not.
        * @return {boolean}
        */
        get hasJoin() {
            if (this._hasJoin === undefined) {
                var len = this.pathParts.length;
                this._hasJoin =  (len > 1) || (len == 1 && this.pathParts[0].joins.length > 0);
            }
            return this._hasJoin;
        },

        /**
         * The last join in the uri. Take a look at `joins` for structure of join object.
         * @return {object}
         */
        get lastJoin() {
            if (this.hasJoin) {
                var joins = this.pathParts[this.pathParts.length-1].joins;
                return joins[joins.length-1];
            }
            return null;
        },

        /**
         * The last part of path. could be null
         * @type {PathPart}
         */
        get lastPathPart() {
            return this.pathParts.length > 0 ? this.pathParts[this.pathParts.length-1] : undefined;
        },

        /**
         * The second to last part of path. This part is important because the
         * facets are based on this.
         * @type {PathPart}
         */
        get facetBasePathPart() {
            var len = this.pathParts.length;
            return len >= 2 ? this.pathParts[len-2] : undefined;
        },

        /**
         * set the facet of the last path part
         * @param  {object} json the json object of facets
         */
        set facets(json) {
            var newFacet;
            if (typeof json === 'object' && json !== null) {
                newFacet = new ParsedFacets(json, '');
            }
            if (!this.lastPathPart) {
                this._pathParts.push(new PathPart(this.mainTableAlias, [], this.rootSchemaName, this.rootTableName));
            }
            delete this.lastPathPart.facets;
            this.lastPathPart.facets = newFacet;
            this._setDirty();
        },

        /**
         * facets object of the last path part
         * @return {ParsedFacets} facets object
         */
        get facets() {
            return this.lastPathPart ? this.lastPathPart.facets : undefined;
        },

        /**
         * Chnge the custom facet of the last path part
         * @param  {Object} json
         */
        set customFacets(json) {
            var newFacet;
            if (typeof json === 'object' && json !== null) {
                newFacet = new CustomFacets(json, '');
            }
            if (!this.lastPathPart) {
                this._pathParts.push(new PathPart(this.mainTableAlias, [], this.rootSchemaName, this.rootTableName));
            }
            delete this.lastPathPart.customFacets;
            this.lastPathPart.customFacets = newFacet;
            this._setDirty();
        },

        /**
         * the custom facet of the last path part
         * @type {CustomFacets}
         */
        get customFacets() {
            return this.lastPathPart ? this.lastPathPart.customFacets : undefined;
        },

        /**
         * modifiers that are available in the uri.
         * @return {string}
         */
        get _modifiers() {
            return (this.sort ? this.sort : "") + (this.paging ? this.paging : "");
        },

        /**
         * last searchTerm of the last path part
         * @returns {string} the search term
         */
        get searchTerm() {
            if (this.lastPathPart) {
                return this.lastPathPart.searchTerm;
            }
            return null;
        },

        /**
         * Subject to change soon
         * @returns {String} The sort modifier in the string format of @sort(...)
         */
        get sort() {
            return this._sort;
        },

        /**
         * get the sorting object, null if no sorting
         * @returns {Object[]} in this format [{"column":colname, "descending":true},...]
         */
        get sortObject() {
            if (this._sortObject === undefined) {
                if (this._sort !== undefined) {
                    var sorts = this._sort.match(/@sort\(([^\)]*)\)/)[1].split(",");

                    this._sortObject = [];
                    for (var s = 0; s < sorts.length; s++) {
                        var sort = sorts[s];
                        var column = (sort.endsWith("::desc::") ?
                            decodeURIComponent(sort.match(/(.*)::desc::/)[1]) : decodeURIComponent(sort));
                        this._sortObject.push({"column": column, "descending": sort.endsWith("::desc::")});
                    }
                } else {
                    this._sortObject = null;
                }
            }
            return this._sortObject;
        },

        /**
         * change sort with new sort Object
         * @param {Object[]} so in this format [{"column":colname, "descending":true},...]
         */
        set sortObject(so) {
            if ((!so && !this._sort) || (so === this._sort))
                return;

            // null or undefined = remove sort
            var oldSortString = (this._sort? this._sort : "");
            if (!so || so.length === 0) {
                delete this._sort;
                this._sortObject = null;
            } else {
                this._sortObject = so;
                this._sort = _getSortModifier(so);
            }

            // enforce updating uri
            this._setDirty();
        },

        /**
         * String representation of before: @before(..)
         * @type {string}
         */
        get before () {
          return this._before;
        },

        /**
         * String representation of before: @after(..)
         * @type {string}
         */
        get after () {
          return this._after;
        },

        /**
         *
         * @returns {String} The string format of the paging modifier in the form of @before(..)@after(...)
         */
        get paging() {
            if (this.after || this.before) {
                return (this.after ? this.after : "") + (this.before ? this.before : "");
            }
        },

        /**
         * array of values that is used for before
         * @return {Object[]}
         */
        get beforeObject () {
            if (this._beforeObject === undefined) {
                var row, i, value;
                if (this._before) {
                    this._beforeObject = [];
                    row = this._before.match(/@before\(([^\)]*)\)/)[1].split(",");

                    // NOTE the number of values might be different from the sort
                    // because columns can be sorted based on value of multiple columns
                    for (i = 0; i < row.length; i++) {
                        // ::null:: to null, empty string to "", otherwise decode value
                        value = (row[i] === "::null::" ? null : decodeURIComponent(row[i]));
                        this._beforeObject.push(value);
                    }
                } else {
                    this._beforeObject = null;
                }
            }
            return this._beforeObject;
        },

        /**
         * change the beforeObject with new values
         * @param {Object[]} Array of values that you want to page with.
         */
        set beforeObject(values) {
            // invalid argument, or empty string -> remove before
            if (!Array.isArray(values) || values.length === 0) {
                this._beforeObject = null;
                delete this._before;
            } else {
                if (this._sort) {
                    this._beforeObject = values;
                    this._before = _getPagingModifier(values, true);
                } else {
                    throw new module.InvalidPageCriteria("Error setting before: Paging not allowed without sort", this.path);
                }
            }

            // enforce updating uri
            this._setDirty();
        },

        /**
         * array of values that is used for after
         * @return {Object[]}
         */
        get afterObject () {
            if (this._afterObject === undefined) {
                var row, i, value;
                if (this._after) {
                    this._afterObject = [];
                    row = this._after.match(/@after\(([^\)]*)\)/)[1].split(",");

                    // NOTE the number of values might be different from the sort
                    // because columns can be sorted based on value of multiple columns
                    for (i = 0; i < row.length; i++) {
                        // ::null:: to null, empty string to "", otherwise decode value
                        value = (row[i] === "::null::" ? null : decodeURIComponent(row[i]));
                        this._afterObject.push(value);
                    }
                } else {
                    this._afterObject = null;
                }
            }
            return this._afterObject;
        },

        /**
         * change the paging with new afterObject
         * @param {Object[]} Array of values that you want to page with.
         */
        set afterObject(values) {
            // invalid argument, or empty string -> remove after
            if (!Array.isArray(values) || values.length === 0) {
                this._afterObject = null;
                delete this._after;
            } else {
                if (this._sort) {
                    this._afterObject = values;
                    this._after = _getPagingModifier(values, false);
                } else {
                    throw new module.InvalidPageCriteria("Error setting after: Paging not allowed without sort", this.path);
                }
            }

            // enforce updating uri
            this._setDirty();
        },

        /**
         * Apply, replace, clear filter term on the location
         * @param {string} term - optional, set or clear search
         */
        search: function(t) {
            var term = (t == null || t === "") ? null : t;

            if (term === this.searchTerm) {
                return;
            }

            var newSearchFacet = {"source": "*", "search": [term]};
            var hasSearch = this.searchTerm != null;
            var hasFacets = this.facets != null;
            var andOperator = module._FacetsLogicalOperators.AND;

            var facetObject, andFilters;
            if (term === null) {
                // hasSearch must be true, if not there's something wrong with logic.
                // if term === null, that means the searchTerm is not null, therefore has search
                facetObject = [];
                this.facets.decoded[andOperator].forEach(function (f) {
                    if (f.source !== "*") {
                        facetObject.push(f);
                    }
                });

                if (facetObject.length !== 0) {
                    facetObject = {"and": facetObject};
                }
            } else {
                if (hasFacets) {
                    facetObject = JSON.parse(JSON.stringify(this.facets.decoded));
                    if (!hasSearch) {
                        facetObject[andOperator].unshift(newSearchFacet);
                    } else {
                        andFilters  = facetObject[andOperator];
                        for (var i = 0; i < andFilters.length; i++) {
                            if (andFilters[i].source === "*") {
                                if (Array.isArray(andFilters[i].search)) {
                                    andFilters[i].search = [term];
                                }
                                break;
                            }
                        }
                    }
                } else {
                    facetObject = {"and": [newSearchFacet]};
                }
            }

            this.facets = (facetObject && facetObject.and) ? facetObject : null;

            // enforce updating uri
            this._setDirty();
        },

        /**
         * Remove the filters from the location
         */
        removeFilters: function () {
          if (this.lastPathPart) {
              delete this.lastPathPart.filter;
              delete this.lastPathPart.filtersString;
              this._setDirty();
          }
        },

        /**
         * Create a new location object with the same uri
         * @returns {ERMrest.Location} new location object
         * @private
         */
        _clone: function() {
            return module.parse(this.uri);
        },

        _setDirty: function() {
            delete this._uri;
            delete this._path;
            delete this._compactUri;
            delete this._compactPath;
            delete this._ermrestUri;
            delete this._ermrestPath;
            delete this._ermrestCompactUri;
            delete this._ermrestCompactPath;
        }
    };

    /**
     * Container for the path part, It will have the following attributes:
     * - joins: an array of ParsedJoin objects.
     * - alias: The alias that the facets should refer to
     * - schema: The schema that the join ends up with
     * - table: the table that the joins end up with
     * - facets: the facets object
     * - searchTerm: the search term that is in the facets
     * - customFacets: the custom facets objects.
     * - fitler: the filter object
     * - filtersString: the string representation of the filter
     * @param       {String} alias              The alias that the facets should refer to
     * @param       {ParsedJoin[]} joins        an array of ParsedJoin objects.
     * @param       {String} schema             The schema that the join ends up with
     * @param       {String} table              The table that the join ends up with
     * @param       {ParsedFacets} facets       the facets object
     * @param       {CustomFacets} cfacets      the custom facets object
     * @param       {ParsedFilter} filter       the filter object
     * @param       {String} filtersString      the string representation of the filter
     * @constructor
     */
    function PathPart(alias, joins, schema, table, facets, cfacets, filter, filtersString) {
        this.alias = alias;
        this.joins = Array.isArray(joins) ? joins : [];
        this.schema = schema;
        this.table = table;
        this._facets = facets;
        this.searchTerm = (facets && facets.decoded) ? _getSearchTerm(facets.decoded) : null;
        this.customFacets = cfacets;
        this.filter = filter;
        this.filtersString = filtersString;
    }

    PathPart.prototype = {
        /**
         * Set the facets, this will take crea of the searchTerm attribute.
         */
        set facets(facets) {
            delete this._facets;
            this._facets = facets;
            this.searchTerm = (facets && facets.decoded) ? _getSearchTerm(facets.decoded) : null;
        },

        get facets() {
            return this._facets;
        }
    };

    /**
     * given the string of parameters, create an object of them.
     *
     * @param {String} params the string representation of the query params
     * @returns {Object} the query params object
     * @private
     */
    _getQueryParams = function (params) {
        var queryParams = {},
            parts = params.split("&"),
            part, i;
        for (i  = 0; i < parts.length; i++) {
            part = parts[i].split("=");
            queryParams[decodeURIComponent(part[0])] = decodeURIComponent(part[1]);
        }
        return queryParams;
    };

    /**
     * for testingiven sort object, get the string modifier
     * @param {Object[]} sort [{"column":colname, "descending":boolean}, ...]
     * @return {string} string modifier @sort(...)
     * @private
     */
    _getSortModifier = function(sort) {

        // if no sorting
        if (!sort || !Array.isArray(sort) || sort.length === 0) {
            return "";
        }

        var modifier = "@sort(";
        for (var i = 0; i < sort.length; i++) {
            if (i !== 0) modifier = modifier + ",";
            if (!sort[i].column) throw new module.InvalidInputError("Invalid sort object.");
            modifier = modifier + module._fixedEncodeURIComponent(sort[i].column) + (sort[i].descending ? "::desc::" : "");
        }
        modifier = modifier + ")";
        return modifier;
    };

    /**
     * given paging object, get the paging modifier
     * @param {Object} values the values
     * @param {boolean} indicates whether its before or after
     * @return {string} string modifier @after/before(...)
     * @private
     */
    _getPagingModifier = function(values, isBefore) {

        // no paging
        if (!Array.isArray(values) || values.length === 0) {
            return "";
        }

        var modifier = (isBefore ? "@before(" : "@after(");
        for (var i = 0; i < values.length; i++) {
            if (i !== 0) modifier = modifier + ",";
            modifier = modifier + ((values[i] === null || values[i] === undefined ) ? "::null::" : module._fixedEncodeURIComponent(values[i]));
        }
        modifier = modifier + ")";
        return modifier;
    };

    /**
     * Given a term will return the filter string that ermrest understands
     * @param  {string} term Search term
     * @param {string=} column the column that search is based on (if undefined, search on table).
     * @return {string} corresponding ermrest filter
     * @private
     */
    _convertSearchTermToFilter = function (term, column) {
        var filterString = "";
        column = (typeof column !== 'string' || column === "*") ? "*": module._fixedEncodeURIComponent(column);

        if (term && term !== "") {
            // add a quote to the end if string has an odd amount
            if ( (term.split('"').length-1)%2 === 1 ) {
                term = term + '"';
            }

            // 1) parse terms in quotation
            // 2) split the rest by space
            var terms = term.match(/"[^"]*"/g); // everything that's inside quotation
            if (!terms) terms = [];
            for (var i = 0; i < terms.length; i++) {
                term = term.replace(terms[i], ""); // remove from term
                terms[i] = terms[i].replace(/"/g, ""); //remove quotes
            }

            if (term.trim().length > 0 ) terms = terms.concat(term.trim().split(/[\s]+/)); // split by white spaces

            terms.forEach(function(t, index, array) {
                var exp;
                // matches an integer, aka just a number
                if (t.match(/^[0-9]+$/)) {
                    exp = "^(.*[^0-9.])?0*" + module._encodeRegexp(t) + "([^0-9].*|$)";
                // matches a float, aka a number one decimal
                } else if (t.match(/^([0-9]+[.][0-9]*|[0-9]*[.][0-9]+)$/)) {
                    exp = "^(.*[^0-9.])?0*" + module._encodeRegexp(t);
                // matches everything else (words and anything with multiple decimals)
                } else {
                    exp = module._encodeRegexp(t);
                }

                filterString += (index === 0? "" : "&") + column + module.OPERATOR.CASE_INS_REG_EXP + module._fixedEncodeURIComponent(exp);
            });
        }

        return filterString;
    };

    /**
     * Given the facetObject, find the `*` facet and extract the search term.
     * Should be called whenever we're changing the facet object
     * Will only consider the first `source`: `*`.
     * @param  {object} facetObject the facet object
     * @return {string}             search term
     */
    _getSearchTerm = function (facetObject) {
        var andFilters = facetObject[module._FacetsLogicalOperators.AND],
            searchTerm = "";

        for (var i = 0; i < andFilters.length; i++) {
            if (andFilters[i].source === "*") {
                if (Array.isArray(andFilters[i].search)) {
                    searchTerm = andFilters[i].search.join("|");
                }
                break;
            }
        }
        return searchTerm.length === 0 ? null : searchTerm;
    };

    function ParsedJoin (linking, table, schema) {
        var fromSchemaTable = schema ? [table,schema].join(":") : table;
        var fromCols = linking[1].split(",");
        var toParts = linking[2].match(/([^:]*):([^:]*):([^\)]*)/);
        var toCols = toParts[3].split(",");
        var strReverse = "(" + toParts[3] + ")=(" + fromSchemaTable + ":" + linking[1] + ")";

        this.fromCols = fromCols.map(function(colName) {return decodeURIComponent(colName);});
        this.fromColsStr = linking[1];
        this.toCols = toCols.map(function(colName) {return decodeURIComponent(colName);});
        this.toColsStr = linking[2];
        this.toSchema = decodeURIComponent(toParts[1]);
        this.toTable = decodeURIComponent(toParts[2]);
        this.str = linking[0];
        this.strReverse = strReverse;
    }

    /**
     *
     * A structure to store parsed filter
     *
     * { type: BinaryPredicate,
     *   column: col_name,
     *   operator: '=' or '::opr::'
     *   value: value
     * }
     *
     * or
     *
     * { type: Conjunction or Disjunction
     *   filters: [array of ParsedFilter]
     * }
     *
     *
     * @memberof ERMrest
     * @constructor
     * @param {String} type - type of filter
     * @desc
     * Constructor for a ParsedFilter.
     */
     function ParsedFilter (type) {
         this.type = type;
     }

     ParsedFilter.prototype = {
         constructor: ParsedFilter,

         /**
          *
          * @param {ParsedFilter[]} filters array of binary predicate
          */
         setFilters: function(filters) {
             this.filters = filters;
         },

         /**
          *
          * @param colname
          * @param operator '=', '::gt::', '::lt::', etc.
          * @param value
          */
         setBinaryPredicate: function(colname, operator, value) {
             this.column = colname;
             this.operator = operator;
             this.value = value;
         },

         get facet() {
             if (this._facet === undefined) {
                 this._toFacet();
             }
             return this._facet;
         },

         get depth() {
             if (this._depth === undefined) {
                 this._toFacet();
             }
             return this._depth;
         },

         _toFacet: function () {
             var f = _filterToFacet(this);
             this._facet = f ? f.facet : null;
             this._depth = f ? f.depth : null;
         }
     };

     function _processFilterPathPart(part, path) {
         // split by ';' and '&'
         var regExp = new RegExp('(;|&|[^;&]+)', 'g');
         var items = part.match(regExp);

         if (!items) {
             throw new module.InvalidFilterOperatorError("Couldn't parse '" + part + "' in the url.", path, part);
         }

         // if a single filter
         if (items.length === 1) {
             return _processSingleFilterString(items[0], path);
         }

         var filters = [];
         var type = null;
         for (var i = 0; i < items.length; i++) {
             // process anything that's inside () first
             if (items[i].startsWith("(")) {
                 items[i] = items[i].replace("(", "");
                 // collect all filters until reaches ")"
                 var subfilters = [];
                 while (true) {
                     if (items[i].endsWith(")")) {
                         items[i] = items[i].replace(")", "");
                         subfilters.push(items[i]);
                         // get out of while loop
                         break;
                     } else {
                         subfilters.push(items[i]);
                         i++;
                     }
                 }

                 filters.push(_processMultiFilterString(subfilters, path));

             } else if (type === null && items[i] === "&") {
                 // first level filter type
                 type = module.filterTypes.CONJUNCTION;
             } else if (type === null && items[i] === ";") {
                 // first level filter type
                 type = module.filterTypes.DISJUNCTION;
             } else if (type === module.filterTypes.CONJUNCTION && items[i] === ";") {
                 // using combination of ! and & without ()
                 throw new module.InvalidFilterOperatorError("Parser doesn't support combination of conjunction and disjunction filters.", path,  part);
             } else if (type === module.filterTypes.DISJUNCTION && items[i] === "&") {
                 // using combination of ! and & without ()
                 throw new module.InvalidFilterOperatorError("Parser doesn't support combination of conjunction and disjunction filters.", path, part);
             } else if (items[i] !== "&" && items[i] !== ";") {
                 // single filter on the first level
                 var binaryFilter = _processSingleFilterString(items[i], path);
                 filters.push(binaryFilter);
             }
         }

         var filter = new ParsedFilter(type);
         filter.setFilters(filters);
         return filter;
     }

    /**
     *
     * @param {stirng} filterString
     * @param {string} path used for redirect link generation
     * @returns {ParsedFilter} returns the parsed representation of the filter
     * @desc converts a filter string to ParsedFilter
     */
    function _processSingleFilterString(filterString, path) {
        //check for '=' or '::' to decide what split to use
        var f, filter;
        if (filterString.indexOf("=") !== -1) {
            f = filterString.split('=');
            // NOTE: filter value (f[1]) can be empty
            if (f[0] && f.length === 2) {
                filter = new ParsedFilter(module.filterTypes.BINARYPREDICATE);
                filter.setBinaryPredicate(decodeURIComponent(f[0]), "=", decodeURIComponent(f[1]));
                return filter;
            }
        } else {
            f = filterString.split("::");
            if (f.length === 3) {
                filter = new ParsedFilter(module.filterTypes.BINARYPREDICATE);
                filter.setBinaryPredicate(decodeURIComponent(f[0]), "::"+f[1]+"::", decodeURIComponent(f[2]));
                return filter;
            }
        }
        throw new module.InvalidFilterOperatorError("Couldn't parse '" + filterString + "' filter.", path, filterString);
    }

    /**
     *
     * @param {String} filterStrings array representation of conjunction and disjunction of filters
     *     without parenthesis. i.e., ['id=123', ';', 'id::gt::234', ';', 'id::le::345']
     * @param {string} path used for redirect link generation
     * @return {ParsedFilter}
     *
     */
    function _processMultiFilterString(filterStrings, path) {
        var filters = [];
        var type = null;
        for (var i = 0; i < filterStrings.length; i++) {
            if (type === null && filterStrings[i] === "&") {
                // first level filter type
                type = module.filterTypes.CONJUNCTION;
            } else if (type === null && filterStrings[i] === ";") {
                // first level filter type
                type = module.filterTypes.DISJUNCTION;
            } else if (type === module.filterTypes.CONJUNCTION && filterStrings[i] === ";") {
                // throw invalid filter error (using combination of ! and &)
                throw new module.InvalidFilterOperatorError("Couldn't parse '" + filterString + "' filter.", path, filterString);
            } else if (type === module.filterTypes.DISJUNCTION && filterStrings[i] === "&") {
                // throw invalid filter error (using combination of ! and &)
                throw new module.InvalidFilterOperatorError("Couldn't parse '" + filterString + "' filter.", path, filterString);
            } else if (filterStrings[i] !== "&" && filterStrings[i] !== ";") {
                // single filter on the first level
                var binaryFilter = _processSingleFilterString(filterStrings[i]);
                filters.push(binaryFilter);
            }
        }

        var filter = new ParsedFilter(type);
        filter.setFilters(filters);
        return filter;
    }

    /**
     * Given a parsedFilter object will return the corresponding facet.
     * If we cannot represent it with facet, it will return `null`.
     * Otherwise will return an object with
     *  - depth: showing the depth of filter.
     *  - facet: facet equivalent of the given filter
     *
     * @private
     * @param       {Object} parsedFilter the filter
     * @return      {Object}
     */
    function _filterToFacet(parsedFilter) {
        var res = _filterToFacetRec(parsedFilter, 0);

        // could not be parsed
        if (!res) return null;

        var depth = res.depth, facet = res.facet;

        // if facet didn't have any operator, then we create one with and
        if (!("or" in facet) && !("and" in facet)) {
          facet = {and: [module._simpleDeepCopy(facet)]};
          depth = 1;
        }

        return {facet: facet, depth: depth};
    }

    // does the process of changing filter to facet recursively
    function _filterToFacetRec(parsedFilter, depth) {
        var facet = {}, orSources = {}, parsed, op, i, f, nextRes, parentDepth;

        // base for binary predicate filters
        if (parsedFilter instanceof ParsedFilter && parsedFilter.type === module.filterTypes.BINARYPREDICATE){
            facet.source = parsedFilter.column;
            switch (parsedFilter.operator) {
                case module.OPERATOR.GREATER_THAN_OR_EQUAL_TO:
                    facet[module._facetFilterTypes.RANGE] = [{min: parsedFilter.value}];
                    break;
                case module.OPERATOR.LESS_THAN_OR_EQUAL_TO:
                    facet[module._facetFilterTypes.RANGE] = [{max: parsedFilter.value}];
                    break;
                case module.OPERATOR.GREATER_THAN:
                    facet[module._facetFilterTypes.RANGE] = [{min: parsedFilter.value, min_exclusive: true}];
                    break;
                case module.OPERATOR.LESS_THAN:
                    facet[module._facetFilterTypes.RANGE] = [{max: parsedFilter.value, max_exclusive: true}];
                    break;
                case module.OPERATOR.NULL:
                    facet[module._facetFilterTypes.CHOICE] = [null];
                    break;
                case module.OPERATOR.CASE_INS_REG_EXP:
                    facet[module._facetFilterTypes.SEARCH] = [parsedFilter.value];
                    break;
                case module.OPERATOR.EQUAL:
                    facet[[module._facetFilterTypes.CHOICE]] = [parsedFilter.value];
                    break;
                default:
                    // operator is not supported by facet
                    return null;
            }

            return {facet: facet, depth: depth};
        }

        if (Array.isArray(parsedFilter.filters)) {

            // we're going one level deeper (since it's an array it will be turned into object of sources)
            depth++;

            // set the filter type
            if (parsedFilter.type === module.filterTypes.DISJUNCTION) {
                op = "or";
            } else if (parsedFilter.type === module.filterTypes.CONJUNCTION) {
                op = "and";
            } else {
                return null;
            }

            // will add the facets in the parsed to facet object
            var mergeFacets = function (c) {
                if (!parsed[c]) return;
                if (!facet[op][index][c]) facet[op][index][c] = [];
                facet[op][index][c].push(parsed[c][0]);
            };

            parentDepth = depth;
            facet[op] = [];
            for (i = 0; i < parsedFilter.filters.length; i++) {
                f = parsedFilter.filters[i];

                // get the facet for this child filter
                nextRes = _filterToFacetRec(f, parentDepth);

                // couldn't parse it.
                if (!nextRes) return null;

                parsed = nextRes.facet;

                // depth of the parent will be the maximum depth of its children
                depth = Math.max(depth, nextRes.depth);


                // if operator is or and the filter is binary we can merge them
                // for example id=1;id=2 can turned into {source: "id", choices: ["1", "2"]}
                // or id=1;id::geq::2 can be {source: "id", "choices": ["1"], "ranges": [{min: 2}]}
                if (op === "or" && f.type === module.filterTypes.BINARYPREDICATE) {
                    if (orSources[parsed.source] > -1) {
                        // the source existed before, so it can be merged
                        var index = orSources[parsed.source];
                        module._facetFilterTypeNames.forEach(mergeFacets);
                        continue;
                    } else {
                        orSources[parsed.source] = facet[op].length;
                    }
                }

                // add the facet into the list
                facet[op].push(parsed);
            }

            // if it's just one value, then we can just flatten the array and return that value.
            // the wrapper function will take care of adding the op, if it didn't exist
            if (facet[op].length === 1) {
              facet = facet[op][0];
              depth--;
            }

            return {facet: facet, depth: depth};
        }

       // invalid filter
       return null;
    }

    module.filterTypes = Object.freeze({
        BINARYPREDICATE: "BinaryPredicate",
        CONJUNCTION: "Conjunction",
        DISJUNCTION: "Disjunction",
        UNARYPREDICATE: "UnaryPredicate",
        NEGATION: "Negation"
    });

    /**
     * The complete structure of ermrest JSON filter is as follows:
     *
     * ```
     * <FILTERS>:  { <logical-operator>: <TERMSET> }
     * <TERMSET>: '[' <TERM> [, <TERM>]* ']'
     *
     * <TERM>:     { <logical-operator>: <TERMSET> }
     *             or
     *             { "source": <data-source>, <constraint(s)> }
     * ```
     *
     * But currently it only supports the following:
     *
     * {
     *  "and": [
     *      {
     *          "source": <data-source>,
     *          "choices": [v, ...],
     *          "ranges": [{"min": v1, "max": v2}, ...],
     *          "search": [v, ...],
     *          "not_null": true
     *      },
     *      ...
     *  ]
     * }
     *
     * <data-source> can be any of :
     * * -> the filter is in table level (not column)
     * string -> the filter is referring to a column (this is its name)
     * array -> the filter is referring to a column through a set of joins.
     *  - each element shoud have
     *      - An "inbound" or "outbound" key. Its value must be the constraint name array.
     *  - last element must be a string, which is the column name.
     *  for example:
     *  [{"inbound": ["s1", "fk1"]}, {"outbound": ["s2", "fk2"]}, "col"]
     *
     * For detailed explanation take a look at the following link:
     * https://github.com/informatics-isi-edu/ermrestjs/issues/447
     *
     * @param       {String|Object} str Can be blob or json (object).
     * @param       {String} path to generate rediretUrl in error module.
     * @constructor
     */
    function ParsedFacets (str, path) {

        if (typeof str === 'object') {
            /**
             * encode JSON object that represents facets
             * @type {object}
             */
            this.decoded = str;

            /**
             * JSON object that represents facets
             * @type {string}
             */
            this.encoded = module.encodeFacet(str);
        } else {
            this.encoded = str;
            this.decoded = module.decodeFacet(str, path);
        }

        var andOperator = module._FacetsLogicalOperators.AND, obj = this.decoded;
        if (!obj.hasOwnProperty(andOperator) || !Array.isArray(obj[andOperator])) {
            // we cannot actually parse the facet now, because we haven't
            // introspected the whole catalog yet, and don't have access to the constraint objects.
            throw new module.InvalidFacetOperatorError(path, module._facetingErrors.invalidBooleanOperator);
        }

        this.andFilters = obj[andOperator];
    }
    /**
     * An object that will have the follwoing attributes:
     *  - displayname: "a markdown displayname",
     *  - facets: "the facet object"
     *
     *
     * @param       {String|Object} str Can be blob or json (object).
     * @param       {String} path to generate rediretUrl in error module.
     * @constructor
     */
    function CustomFacets (str, path) {

        // the eror that we should throw if it's invalid
        var error = new module.InvalidCustomFacetOperatorError('', path);

        if (typeof str === 'object') {
            /**
             * encode JSON object that represents facets
             * @type {object}
             */
            this.decoded = str;

            /**
             * JSON object that represents facets
             * @type {string}
             */
            this.encoded = module.encodeFacet(str);
        } else {
            this.encoded = str;

            try {
                this.decoded = module.decodeFacet(str, path);
            } catch(exp) {
                // the exp will be InvalidFacetOperatorError, so we should change it to custom-facet
                throw error;
            }
        }

        var obj = this.decoded;
        if (!obj.hasOwnProperty("displayname") || (!obj.hasOwnProperty("facets") && !obj.hasOwnProperty("ermrest_path"))) {
            throw error;
        }

        if (obj.facets) {
            /**
            * the facet that this custom facet is representing
            * @type {ParsedFacets}
            */
            this.facets = new ParsedFacets(obj.facets);
        }

        if (typeof obj.ermrest_path === "string") {
            /**
             * The ermrset string path that will be appended to the url
             * @type {String}
             */
            this.ermrestPath = module.trimSlashes(obj.ermrest_path);
        }

        /**
         * The name that should be used to represent the facet value
         * @type {string}
         */
        this.displayname = obj.displayname;
    }

    /**
     * For the structure of JSON, take a look at ParsedFacets documentation.
     *
     * NOTE:
     * - If any part of the facet is not as expected, it will throw an object
     *   with ``"successful": false` and an appropriate `message`.
     *   Any part of the code that is using this function should guard against the result
     *   being empty, and throw error in that case.
     *
     * - We are not handling multiple `null` in the facet and it will restult in an error.
     *
     * - If we encounter a `null` filter, we are going to change the structure of url.
     *   Assume that this facet is for table `A` and table `B` has null filter. Therefore
     *   the url will be:
     *      S:B/<filters of B>/<path from B to A where the last join is right join>/<parsed filter of all the other facets>/$alias
     *   Compare this with the following which will be the result if none of the facets have `null`:
     *      <parsed fitler of all the facets>/$alias
     *   In this case, we are returning a `"rightJoin": true`. In this case, we
     *   have to make sure that the returned value must be the start of url and
     *   cannot be simply appended to the rest of url.
     *
     * @param       {object} json  JSON representation of filters
     * @param       {string} alias the table alias
     * @constructor
     * @return      {object} An object that will have the following attributes:
     * - successful: Boolean (true means successful, false means cannot be parsed).
     * - parsed: String  (if the given string was parsable).
     * - message: String (if the given string was not parsable)
     */
    _JSONToErmrestFilter = function(json, alias, tableName, catalogId, consNames) {
        var facetErrors = module._facetingErrors;

        var findConsName = function (catalogId, schemaName, constraintName) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        };

        var encode = module._fixedEncodeURIComponent;

        var isDefinedAndNotNull = function (v) {
            return v !== undefined && v !== null;
        };

        var valueToString = function (v) {
            return (typeof v === "string") ? v :JSON.stringify(v);
        };

        // whether the facet has null or not
        var hasNull = function (term) {
            var choice = module._facetFilterTypes.CHOICE;
            return Array.isArray(term[choice]) && term[choice].some(function (v) {
                return !isDefinedAndNotNull(v);
            });
        };

        // parse choices constraint
        var parseChoices = function (choices, column) {
            return choices.reduce(function (prev, curr, i) {
                var res = prev += (i !== 0 ? ";": "");
                if (isDefinedAndNotNull(curr)) {
                    res += module._fixedEncodeURIComponent(column) + "=" + module._fixedEncodeURIComponent(valueToString(curr));
                } else {
                    res += module._fixedEncodeURIComponent(column) + "::null::";
                }
                return res;
            }, "");
        };

        // parse ranges constraint
        var parseRanges = function (ranges, column) {
            var res = "", hasFilter = false, operator;
            ranges.forEach(function (range, index) {
                if (hasFilter) {
                    res += ";";
                    hasFilter = false;
                }

                if (isDefinedAndNotNull(range.min)) {
                    operator = module.OPERATOR.GREATER_THAN_OR_EQUAL_TO;
                    if (range.min_exclusive === true) {
                        operator = module.OPERATOR.GREATER_THAN;
                    }

                    res += module._fixedEncodeURIComponent(column) + operator + module._fixedEncodeURIComponent(valueToString(range.min));
                    hasFilter = true;
                }

                if (isDefinedAndNotNull(range.max)) {
                    operator = module.OPERATOR.LESS_THAN_OR_EQUAL_TO;
                    if (range.max_exclusive === true) {
                        operator = module.OPERATOR.LESS_THAN;
                    }

                    if (hasFilter) {
                        res += "&";
                    }
                    res += module._fixedEncodeURIComponent(column) + operator + module._fixedEncodeURIComponent(valueToString(range.max));
                    hasFilter = true;
                }
            });
            return res;
        };

        // parse search constraint
        var parseSearch = function (search, column) {
            var res, invalid = false;
            res = search.reduce(function (prev, curr, i) {
                if (curr == null) {
                    invalid = true;
                    return "";
                } else {
                    return prev + (i !== 0 ? ";": "") + _convertSearchTermToFilter(valueToString(curr), column);
                }
            }, "");

            return invalid ? "" : res;
        };

        // returns null if the path is invalid
        // reverse: this will reverse the datasource and adds the root alias to the end
        var parseDataSource = function (source, alias, tableName, catalogId, reverse) {
            var fks = [], fk, fkObj, i, col, table, isInbound, constraint, schemaName, ignoreFk;

            var start = 0, end = source.length - 1;
            for (i = start; i < end; i++) {

                if ("inbound" in source[i]) {
                    constraint = source[i].inbound;
                    isInbound = true;
                } else if ("outbound" in source[i]) {
                    constraint = source[i].outbound;
                    isInbound = false;
                } else {
                    // given object was invalid
                    return null;
                }

                fkObj = findConsName(catalogId, constraint[0], constraint[1]);

                // constraint name was not valid
                if (fkObj == null || fkObj.subject !== module._constraintTypes.FOREIGN_KEY) {
                    console.log("Invalid data source. fk with the following constraint is not available on catalog: " + constraint.toString());
                    return null;
                }

                fk = fkObj.object;

                // inbound
                if (isInbound && fk.key.table.name === tableName) {
                    table = fk._table;
                }
                // outbound
                else if (!isInbound && fk._table.name === tableName) {
                    table = fk.key.table;
                }
                else {
                    // the given object was not valid
                    return null;
                }

                tableName = table.name;
                schemaName = table.schema.name;
                // fk.toString((reverse && !isInbound) || (!reverse && isInbound), false)
                fks.push({obj: fk, isInbound: isInbound});
            }

            // if the given facetSource doesn't have any path
            if (fks.length === 0) {
                return null;
            }

            // make sure column exists
            try {
                col = table.columns.get(source[source.length-1]);
            } catch (exp) {
                return null;
            }

            // if the last fk is using the same column that is used in facet,
            // and the column is not-null, we can just ignore that join.
            var fkCol = isInbound ? fk.colset.columns[0] : fk.key.colset.columns[0];
            if (!col.nullok && fk.simple && fkCol === col) {
                // change the column
                col = fk.isInbound ? fk.key.colset.columns[0] : fk.colset.columns[0];

                // change the table and schema names
                tableName = col.table.name;
                schemaName = col.table.schema.name;

                // remove the last foreginkey
                fks.pop();
            }

            // if we eliminated all the foreignkeys, then we don't need to reverse anything
            reverse = reverse && fks.length > 0;

            var path = fks.reduce(function (prev, fk, i) {
                var rev = ( (reverse && fk.isInbound) || (!reverse && !fk.isInbound) );
                var fkStr = fk.obj.toString(rev, false);
                if (reverse) {
                    // if we have reversed the path, we need to add the alias to the last bit
                    return ((i > 0) ? (fkStr + "/") : (alias + ":=right" + fkStr) ) + prev;
                } else {
                    return prev + (i > 0 ? "/" : "") + fkStr;
                }
            }, "");

            return {
                path: path,
                columnName: col.name, // we might optimize the path, so the column could be different
                tableName: tableName,
                schemaName: schemaName,
                reversed: reverse
            };
        };

        var getErrorOutput = function (message, index) {
            return {successful: false, message: message + "(index=" + index +")"};
        };

        // parse TERM (it will not do it recursively)
        // returns null if it's not valid
        var parseAnd = function (and) {
            var rightJoins = [],
                innerJoins = [],
                res, i, term, col, path, ds, constraints, parsed, useRightJoin;

            // go through list of facets
            for (i = 0; i < and.length; i++) {
                term = and[i];

                if (typeof term !== "object") {
                    return getErrorOutput(facetErrors.invalidFacet, i);
                }

                // get the column name
                col = _getSourceColumnStr(term.source);
                if (typeof col !== "string") {
                    return getErrorOutput(facetErrors.invalidSource, i);
                }

                // ---------------- parse the path ---------------- //
                path = ""; // the source path if there are some joins
                useRightJoin = false;
                if (_sourceHasPath(term.source)) {

                    // if there's a null filter and source has path, we have to use right join
                    // parse the datasource
                    ds = parseDataSource(term.source, alias, tableName, catalogId, hasNull(term));

                    // if the data-path was invalid, ignore this facet
                    if (ds === null) {
                        return getErrorOutput(facetErrors.invalidSource, i);
                    }

                    // the parsed path
                    path = ds.path;

                    // whether we are using right join or not.
                    useRightJoin = ds.reversed;

                    // if we already have used a right join, we should throw error.
                    if (rightJoins.length > 0 && useRightJoin) {
                        return getErrorOutput(facetErrors.onlyOneNullFilter, i);
                    }

                    col = ds.columnName;
                }

                // ---------------- parse the constraints ---------------- //
                constraints = []; // the current constraints for this source

                if (Array.isArray(term[module._facetFilterTypes.CHOICE])) {
                    parsed = parseChoices(term[module._facetFilterTypes.CHOICE], col);
                    if (!parsed) {
                        return getErrorOutput(facetErrors.invalidChoice, i);
                    }
                    constraints.push(parsed);
                }
                if (Array.isArray(term[module._facetFilterTypes.RANGE])) {
                    parsed = parseRanges(term[module._facetFilterTypes.RANGE], col);
                    if (!parsed) {
                        return getErrorOutput(facetErrors.invalidRange, i);
                    }
                    constraints.push(parsed);
                }
                if (Array.isArray(term[module._facetFilterTypes.SEARCH])) {
                    parsed = parseSearch(term[[module._facetFilterTypes.SEARCH]], col);
                    if (!parsed) {
                        return getErrorOutput(facetErrors.invalidSearch, i);
                    }
                    constraints.push(parsed);
                }
                if (term.not_null === true) {
                    constraints.push("!(" + module._fixedEncodeURIComponent(col) + "::null::)");
                }

                if (constraints.length == 0) {
                    return getErrorOutput(facetErrors.missingConstraints, i);
                }

                // ---------------- create the url with path and constraints ---------------- //
                if (useRightJoin) {
                    rightJoins.push([
                        encode(ds.schemaName) + ":" + encode(ds.tableName),
                        constraints.join(";"),
                        ds.path
                    ].join("/"));
                } else {
                    innerJoins.push((path.length !== 0 ? path + "/" : "") + constraints.join(";") + "/$" + alias);
                }
            }

            return {successful: true, parsed: rightJoins.concat(innerJoins).join("/"), rightJoin: rightJoins.length > 0};
        };

        var andOperator = module._FacetsLogicalOperators.AND;

        // NOTE we only support and at the moment.
        if (!json.hasOwnProperty(andOperator) || !Array.isArray(json[andOperator])) {
            return {successful: false, message: "Only conjunction of facets are supported."};
        }

        return parseAnd(json[andOperator]);
    };

    _sourceHasPath = function (source) {
        return Array.isArray(source) && !(source.length === 1 && typeof source[0] === "string");
    };

    _getFacetSourcePathLength = function (source) {
        if (!_sourceHasPath(source)) {
            return 0;
        }
        return source.length - 1;
    };

    /**
     * Returns the last foreignkey in the source path.
     *
     * NOTE since constraint names is an object attached to ERMrest module,
     * in test environments sometimes it would return null, that's why we are
     * passing consNames to this function.
     * @param  {Object} source    the source object (path)
     * @param  {String} catalogId catalog id
     * @param  {Object} consNames constraint names defined (take a look at the note)
     * @return {Object} has `obj` (the actual fk object), and `isInbound`
     * @private
     */
    _getFacetSourceLastForeignKey = function (source, catalogId, consNames) {
        if (!_sourceHasPath(source)) {
            return null;
        }

        var lastJoin = source[source.length-2];
        var isInbound = false, constraint;

        if ("inbound" in lastJoin) {
            isInbound = true;
            constraint = lastJoin.inbound;
        } else {
            constraint = lastJoin.outbound;
        }

        return {
            "obj": consNames[catalogId][constraint[0]][constraint[1]].object,
            "isInbound": isInbound
        };
    };

    /**
     * Returns an array of foreignkeys that are in the given source path.
     *
     * NOTE since constraint names is an object attached to ERMrest module,
     * in test environments sometimes it would return null, that's why we are
     * passing consNames to this function.
     *
     * @param  {Object} source    the source object (path)
     * @param  {String} catalogId catalog id
     * @param  {Object} consNames constraint names defined (take a look at the note)
     * @return {Object[]} each object has `obj` (the actual fk object), and `isInbound`
     * @private
     */
    _getFacetSourceForeignKeys = function (source, catalogId, consNames) {
        var res = [];
        if (_sourceHasPath(source)) {
            var isInbound = false, constraint;
            for (var i = 0; i < source.length - 1; i++) {
                if ("inbound" in source[i]) {
                    isInbound = true;
                    constraint = source[i].inbound;
                } else {
                    isInbound = false;
                    constraint = source[i].outbound;
                }

                res.push({
                    "obj": consNames[catalogId][constraint[0]][constraint[1]].object,
                    "isInbound": isInbound
                });
            }
        }
        return res;
    };

    /**
     * get facet's source column string
     * @param  {Object} source source object
     * @return {string|Object}
     * @private
     */
    _getSourceColumnStr = function (source) {
        return Array.isArray(source) ? source[source.length-1] : source;
    };

    /**
     * Given the source object, validates the path and returns the corresponding column object.
     * It will return `false` if the source is invalid.
     *
     * NOTE since constraint names is an object attached to ERMrest module,
     * in test environments sometimes it would return null, that's why we are
     * passing consNames to this function.
     *
     * @private
     *
     * @param  {Object} source    source object
     * @param  {ERMrest.Table} table the starting table of the path
     * @param  {object} consNames The constraint names (will be used for constraint lookup)
     * @return {ERMrest.Column|false}
     */
    _getSourceColumn = function (source, table, consNames) {
        var colName, colTable = table;

        var findConsName = function (catalogId, schemaName, constraintName) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        };

        // from 0 to source.length-1 we have paths
        if (_sourceHasPath(source)) {
            var fk, i, isInbound, constraint, fkObj;
            for (i = 0; i < source.length - 1; i++) {

                if ("inbound" in source[i]) {
                    constraint = source[i].inbound;
                    isInbound = true;
                } else if ("outbound" in source[i]) {
                    constraint = source[i].outbound;
                    isInbound = false;
                } else {
                    // given object was invalid
                    return false;
                }

                fkObj = findConsName(colTable.schema.catalog.id, constraint[0], constraint[1]);

                // constraint name was not valid
                if (fkObj === null || fkObj.subject !== module._constraintTypes.FOREIGN_KEY) {
                    return false;
                }

                fk = fkObj.object;

                // inbound
                if (isInbound && fk.key.table === colTable) {
                    colTable = fk._table;
                }
                // outbound
                else if (!isInbound && fk._table === colTable) {
                    colTable = fk.key.table;
                }
                else {
                    // the given object was not valid
                    return false;
                }
            }
            colName = source[source.length-1];
        } else {
            colName = _getSourceColumnStr(source);
        }

        try {
            return colTable.columns.get(colName);
        } catch (exp) {
            return false;
        }

    };

    /**
     * If the column that the sourceObject is representing is in entity mode
     * It will return true if:
     *  - entity is not set to false.
     *  - source is part of a not-null unique key, and has a path.
     *  - source is part of a not-null unique key, doesn't have path, and has self_link = true.
     *
     * @param  {Object} sourceObject the facet object
     * @param  {ERMrest.Column} column      the column objKey
     * @return {boolean} true if entity mode otherwise false.
     */
    _isSourceObjectEntityMode = function (sourceObject, column) {
        if (sourceObject.entity === false) {
            return false;
        }

        // column is part of simple key
        var hasKey = !column.nullok && column.memberOfKeys.filter(function (key) {
            return key.simple;
        }).length > 0;

        if (!_sourceHasPath(sourceObject.source)){
            return hasKey && sourceObject.self_link === true;
        }
        return hasKey ;
    };

    _sourceHasInbound = function (source) {
        if (!_sourceHasPath(source)) return false;
        return source.some(function (n, index) {
            return (index != source.length-1) && ("inbound" in n);
        });
    };

    _sourceIsInboundForeignKey = function (sourceObject, column, consNames) {
        var findConsName = function (catalogId, schemaName, constraintName) {
            var result;
            if ((catalogId in consNames) && (schemaName in consNames[catalogId])){
                result = consNames[catalogId][schemaName][constraintName];
            }
            return (result === undefined) ? null : result;
        };

        var invalid = !_sourceHasPath(sourceObject.source) || !_isSourceObjectEntityMode(sourceObject, column) ||
                      sourceObject.aggregate || sourceObject.source.length > 3;

        if (invalid) {
            return false;
        }

        var source = sourceObject.source;
        var fks = _getFacetSourceForeignKeys(source, column.table.schema.catalog.id, consNames);
        if (fks.length === 2) {
            if (!fks[0].isInbound || fks[1].isInbound) {
                return false;
            }

            return fks[0].obj._table._isPureBinaryAssociation();
        }
        return fks[0].isInbound;
    };

    /**
     * List of logical operators that parser accepts in JSON facets.
     * @type {Object}
     */
    module._FacetsLogicalOperators = Object.freeze({
        AND: "and"
    });
