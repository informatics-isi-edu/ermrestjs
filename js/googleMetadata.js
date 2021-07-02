
var contextForSchemaOrg = "schema.org";
var contextKeyword = "@context";
var typeKeyword = "@type";
var datasetType = "Dataset";
/**
     * Constructs the Google Dataset metadata for the given tuple.
     * The given metadata must be valid and have the appropriate variables.
     */
function GoogleDatasetMetadata(reference, gdsMetadataAnnotation) {
    this._reference = reference;
    this._table = reference.table;
    this._gdsMetadataAnnotation = gdsMetadataAnnotation;
}

GoogleDatasetMetadata.prototype = {
    /**
     * Given the templateVariables variables, will generate the metadata.
     * @param {ERMrest.Tuple} tuple - the tuple object that this metadata is based on
     * @param {Object=} templateVariables - if it's not an object, we will use the tuple templateVariables
     * @return {Json-ld|null} if the returned template for required attributes are empty or invalid, it will return null.
     */
    compute: function (tuple, templateVariables) {
        var table = this._table,
            metadataAnnotation = this._gdsMetadataAnnotation;

        if (!templateVariables) {
            templateVariables = tuple.templateVariables.values;
        }

        var metadata = {};
        setMetadataFromTemplate(metadata, metadataAnnotation.dataset, metadataAnnotation.template_engine, templateVariables, table);

        // remove null attributes so they don't get included in the json
        metadata = removeEmptyOrNull(metadata);

        if (!isValidMetadata(metadata)) {
            module._log.error("JSON-LD not appended to <head> as validation errors found.");
            return null;
        }

        return metadata;
    },
};

function setMetadataFromTemplate(metadata, metadataAnnotation, templateEngine, templateVariables, table) {
    Object.keys(metadataAnnotation).forEach(function (key) {
        if (typeof metadataAnnotation[key] == "object" && metadataAnnotation[key] != null && !Array.isArray(metadataAnnotation[key])) {
            metadata[key] = {};
            setMetadataFromTemplate(metadata[key], metadataAnnotation[key], templateEngine, templateVariables, table);
        }
        else if (Array.isArray(metadataAnnotation[key])) {
            metadata[key] = [];
            metadataAnnotation[key].forEach(function(element) {
                metadata[key].push(module._renderTemplate(
                    element,
                    templateVariables,
                    table.schema.catalog,
                    { templateEngine: templateEngine }
                ));
            });
        }
        else {
            metadata[key] = module._renderTemplate(
                metadataAnnotation[key],
                templateVariables,
                table.schema.catalog,
                { templateEngine: templateEngine }
            );
        }
    });
}


function isValidMetadata(jsonLd) {
    jsonldSchemaPropObj = jsonldSchemaPropObj[contextForSchemaOrg];
    if (isJsonLdBaseValid(jsonLd, jsonldSchemaPropObj)) {
        validateSchemaOrgProps(jsonLd, jsonldSchemaPropObj);

        // always return true here as we will simply ignore all attributes that fail validation and are not required attributes
        return areRequiredPropsDefined(jsonLd, jsonldSchemaPropObj);
    }
    return false;
}

function validateSchemaOrgProps(obj, jsonldSchemaPropObj) {
    var schemaTypeObj = jsonldSchemaPropObj[obj[typeKeyword]];
    if (schemaTypeObj) {
        Object.keys(obj).forEach(function (key) {
            if (!key.startsWith("@")) {
                var propDetails = schemaTypeObj.properties[key];

                if (!propDetails) {
                    propDetails = getPropDetailsFromParent(
                        key,
                        schemaTypeObj.parent,
                        jsonldSchemaPropObj
                    );
                } // incorrect property name

                if (!propDetails) {
                    return removeProp(obj, key);
                }

                // datatype not followed
                // TODO: Check if support for arrays in templating was achieved
                if (Array.isArray(obj[key])) {
                    obj[key].forEach(function (element, index) {
                        if (!isValidType(jsonldSchemaPropObj, propDetails, element, key)) {
                            console.warn("Deleting invalid element inside array for " + key + "\n");
                            obj[key].splice(index, 1);
                        }
                    });
                } else {
                    if (!isValidType(jsonldSchemaPropObj, propDetails, obj[key], key)) {
                        removeProp(obj, key);
                    }
                }
            }
        });
        return true;
    }
}

function removeProp(obj, key) {
    module._log.info("Invalid attribute ignored " + key + " inside type " + obj[typeKeyword] + " in JSON-LD\n");
    delete obj[key];
}

function isValidType(jsonldSchemaPropObj, propDetails, element, key) {
    var result = false; 

    if (propDetails !== null && propDetails !== void 0 && propDetails.types) {
        propDetails.types.every(function (dataType) {
            switch (dataType) {
                case "Text":
                    if (typeof element == "string") {
                        result = true; 
                        // returning false so we can exit out of every() loop
                        return false;
                    }
                    break;

                case "URL":
                    if (isValidUrl(element)) {
                        result = true; // returning false so we can exit out of every() loop

                        return false;
                    }
                    break;

                case "Date":
                case "DateTime":
                    if (Date.parse(element)) {
                        result = true;
                        return false;
                    }
                    break;

                case "Number":
                case "Integer":
                    if (typeof element == "number") {
                        result = true;
                        return false;
                    }

                    break;

                case "Boolean":
                    if (typeof element == "boolean" || (typeof element == "string" && (element.toLowerCase() == "true" || element.toLowerCase() == "false"))) {
                    result = true;
                    return false;
                    }
                    break;
            }

            return true;
        });

        if (element[typeKeyword]) {
            if (jsonldSchemaPropObj[element[typeKeyword]]) {
                return validateSchemaOrgProps(element, jsonldSchemaPropObj);
            }
        }
    } else {
        module._log.warn("Incorrect validation definition for attribute in ermrestjs" - key);
    }

    return result;
}

function isJsonLdBaseValid(obj, definitionObj) {
    var result = true;
    Object.keys(obj).forEach(function (key) {
        if (key.startsWith("@")) {
            switch (key) {
                case contextKeyword:
                    var contextURL = new URL(obj[key]);

                    if (
                        contextURL.host != contextForSchemaOrg &&
                        contextURL.pathname == "/"
                    ) {
                        module._log.error("Incorrect context defined in JSON-LD\n");
                        result = false;
                    }

                    break;

                case typeKeyword:
                    if (!definitionObj[obj[typeKeyword]]) {
                        module._log.error("Incorrect type defined in JSON-LD\n");
                        result = false;
                    }

                    break;

                default:
                    module._log.info("JSON-LD property ignored in ermrestjs - " + key);
                    removeProp(obj, key);
            }
        }
    });

    if (!obj[contextKeyword]) {
        obj[contextKeyword] = "https://" + contextForSchemaOrg;
    }

    if (!obj[typeKeyword]) {
        obj[typeKeyword] = datasetType;
    }

    return result;
}

function areRequiredPropsDefined(jsonLd, jsonldSchemaPropObj) {
    var _jsonldSchemaPropObj$jsonLd;

    var result = true;
    var requiredPropArr =
        (_jsonldSchemaPropObj$jsonLd = jsonldSchemaPropObj[jsonLd[typeKeyword]]) === null ||
            _jsonldSchemaPropObj$jsonLd === void 0
            ? void 0
            : _jsonldSchemaPropObj$jsonLd.requiredProperties;
    requiredPropArr === null || requiredPropArr === void 0
        ? void 0
        : requiredPropArr.forEach(function (key) {
            if (!(key in jsonLd)) {
                module._log.error("Missing value for required attribute - " + key + " inside type " + jsonLd[typeKeyword] + " in JSON-LD\n");
                result = false;
            }
        });
    Object.keys(jsonLd).forEach(function (key) {
        if (jsonLd[key].hasOwnProperty(typeKeyword)) {
            // if required props are missing then ignore that nested object altogether
            if (!areRequiredPropsDefined(jsonLd[key], jsonldSchemaPropObj)) {
                removeProp(jsonLd, key);
            }
        }
    });
    return result;
}

function getPropDetailsFromParent(key, currentType, jsonldSchemaPropObj) {
    if (key in jsonldSchemaPropObj[currentType].properties) {
        return jsonldSchemaPropObj[currentType].properties[key];
    }

    // checked all ancestors and no match found
    if (!jsonldSchemaPropObj[currentType].parent) {
        return undefined;
    }

    return getPropDetailsFromParent(
        key,
        jsonldSchemaPropObj[currentType].parent,
        jsonldSchemaPropObj
    );
}

function isValidUrl(str) {
    var pattern = new RegExp(
        "^(https?:\\/\\/)?" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
        "i"
    ); // fragment locator

    return !!pattern.test(str);
}

function removeEmptyOrNull(obj) {
    Object.keys(obj).forEach(function (k) {
        if (obj[k] && typeof obj[k] === 'object') {
            removeEmptyOrNull(obj[k])
        }
        else if (obj[k] == null || obj[k] == "") {
            delete obj[k];
        }
    });
    return obj;
}