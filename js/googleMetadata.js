
var contextForSchemaOrg = "schema.org";
var contextKeyword = "@context";
var typeKeyword = "@type";
var datasetType = "Dataset";


module.performJsonLdValidation = function (jsonLdOrig) {
    var jsonLd = Object.assign({}, jsonLdOrig);
    try {
        if(module.jsonldSchemaPropObj) {
            if (isJsonLdBaseValid(jsonLd)) {
                validateSchemaOrgProps(jsonLd);
                return {isValid: areRequiredPropsDefined(jsonLd), modifiedJsonLd: jsonLd};
            }
        }
        else {
            module._log.error("Validation property data json not defined!! \n");
        }
    }
    catch (err) {
        module._log.error(err);
    }
    return {isValid: false, modifiedJsonLd: jsonLd};
}

function validateSchemaOrgProps(obj) {
    var schemaTypeObj = module.jsonldSchemaPropObj[obj[typeKeyword]];
    if (schemaTypeObj) {
        Object.keys(obj).forEach(function (key) {
            if (!key.startsWith("@")) {
                var propDetails = schemaTypeObj.properties[key];

                if (!propDetails) {
                    propDetails = getPropDetailsFromParent(
                        key,
                        schemaTypeObj.parent,
                        module.jsonldSchemaPropObj
                    );
                } // incorrect property name

                if (!propDetails) {
                    return removeProp(obj, key);
                }

                // datatype not followed
                if (Array.isArray(obj[key])) {
                    obj[key].forEach(function (element, index) {
                        if (!isValidType(propDetails, element, key)) {
                            module._log.warn("Deleting invalid element inside array for " + key + "\n");
                            obj[key].splice(index, 1);
                        }
                    });
                } else {
                    if (!isValidType(propDetails, obj[key], key)) {
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

function isValidType(propDetails, element, key) {
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
            if (module.jsonldSchemaPropObj[element[typeKeyword]]) {
                return validateSchemaOrgProps(element, module.jsonldSchemaPropObj);
            }
        }
    } else {
        module._log.warn("Incorrect validation definition for attribute in ermrestjs" - key);
    }

    return result;
}

function isJsonLdBaseValid(obj) {
    var definitionObj = module.jsonldSchemaPropObj;
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

function areRequiredPropsDefined(jsonLd) {
    var _jsonldSchemaPropObj$jsonLd;

    var result = true;
    var requiredPropArr =
        (_jsonldSchemaPropObj$jsonLd = module.jsonldSchemaPropObj[jsonLd[typeKeyword]]) === null ||
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
            if (!areRequiredPropsDefined(jsonLd[key])) {
                removeProp(jsonLd, key);
            }
        }
    });
    return result;
}

function getPropDetailsFromParent(key, currentType) {
    if (key in module.jsonldSchemaPropObj[currentType].properties) {
        return module.jsonldSchemaPropObj[currentType].properties[key];
    }

    // checked all ancestors and no match found
    if (!module.jsonldSchemaPropObj[currentType].parent) {
        return undefined;
    }

    return getPropDetailsFromParent(
        key,
        module.jsonldSchemaPropObj[currentType].parent,
        module.jsonldSchemaPropObj
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