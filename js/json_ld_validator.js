
var contextForSchemaOrg = "schema.org";
var contextKeyword = "@context";
var typeKeyword = "@type";
var datasetType = "Dataset";

/**
 * 
 * @param  jsonLdOrig - the generated jsonLd by templating that needs to be validated
 * @returns isValid - boolean flag that indicates whether the jsonLd is valid and should be appended to the DOM by Chaise
 *  modifiedJsonLd - the input object is modified wherever necessary to ensure that the correct properties of the metadata still go through
 */
module.validateJSONLD = function (jsonLdOrig) {
    var jsonLd = Object.assign({}, jsonLdOrig);
    // remove null attributes so they don't get included in the json
    jsonLd = removeEmptyOrNull(jsonLd);
    try {
        if(module.jsonldSchemaPropObj) {
            // Verify if JSON-LD keywords 
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
};

/**
 * It takes in an object and checks 2 things - 
 * 1) Attribute name is valid and it belongs to the schema.org class definition
 * 2) It's data type is valid
 * It removes any non-required attribute that is found to be invalid
 * @param {*} obj 
 * @returns boolean to indicate if object is valid
 */
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

/**
 * 
 * @param {*} obj The object from which the key/attribute should be removed
 * @param {*} key The attribute name
 */
function removeProp(obj, key) {
    module._log.warn("Invalid attribute ignored " + key + " inside type " + obj[typeKeyword] + " in JSON-LD\n");
    delete obj[key];
}

/**
 * 
 * @param {*} propDetails The acceptable data types for the element extracted from jsonLdSchema.js
 * @param {*} element The attribute of the JSON-LD that we are currently validating for data type
 * @param {*} key The attribute name
 * @returns boolean that indicates if element follows its assigned type
 */
function isValidType(propDetails, element, key) {
    var result = false;

    if (propDetails !== null && propDetails !== undefined && propDetails.types) {
        propDetails.types.every(function (dataType) {
            switch (dataType) {
                case "Text":
                case "URL":
                    if (typeof element == "string") {
                        result = true;
                        // returning false so we can exit out of every() loop
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
                    if (typeof element == "number" || (typeof element == "string" && !isNaN(element))) {
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

        // If element is not a primitive but a different class of schema.org then we need to validate it by first getting data type information of its attributes
        // It is not a primitive if it has a '@type' attribute
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

/**
 * Here we check if the @ attributes that are jsonLd keywords are valid or not
 * @param {*} obj - input object
 * @returns boolean that indicates if it is valid
 */
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
                    module._log.warn("JSON-LD property ignored in ermrestjs - " + key);
                    removeProp(obj, key);
            }
        }
    });

    // If annotation did not have it at all then add it here as `@context` and `@type` are required
    if (!obj[contextKeyword]) {
        obj[contextKeyword] = "https://" + contextForSchemaOrg;
        module._log.warn(contextKeyword + " set as " + obj[contextKeyword]);
    }

    if (!obj[typeKeyword]) {
        obj[typeKeyword] = datasetType;
        module._log.warn(typeKeyword + " set as " + obj[typeKeyword]);
    }

    return result;
}

/**
 * If the top level required props (name, description) are not defined correctly then we return false else if an inner object
 * (example : creator) does not have the required props then we simply ignore the inner object altogether by removing it from
 * JSON-LD
 * @param {*} jsonLd 
 * @returns boolean that indicates whether the required props are present as needed
 */
function areRequiredPropsDefined(jsonLd) {
    var _jsonldSchemaPropObj$jsonLd;

    var result = true;
    var requiredPropArr =
        (_jsonldSchemaPropObj$jsonLd = module.jsonldSchemaPropObj[jsonLd[typeKeyword]]) === null ||
            _jsonldSchemaPropObj$jsonLd === void 0 ? void 0 : _jsonldSchemaPropObj$jsonLd.requiredProperties;
    var innerResult = 
    requiredPropArr === null || requiredPropArr === void 0 ? void 0 : requiredPropArr.forEach(function (key) {
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

/**
 * If the original class (in this case - Dataset) does not have the attribute then recursively look for it in the ancestor's list of attributes
 * @param {*} key attribute
 * @param {*} currentType schema.org class
 */
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

function removeEmptyOrNull(obj) {
    Object.keys(obj).forEach(function (key) {
        // array
        if (obj[key] && Array.isArray(obj[key])) {
            var resultArray = [];
            obj[key].forEach(function (element) {
                if (element) {
                    resultArray.push(element);
                }
            });
            obj[key] = resultArray;

            if(obj[key].length == 0) {
                module._log.warn("Invalid attribute ignored " + key + " inside type " + obj[typeKeyword] + " in JSON-LD\n");
                delete obj[key];
            }
        }
        // object
        else if (obj[key] && typeof obj[key] === 'object') {
            removeEmptyOrNull(obj[key]);
        }
        // primitive
        else if (obj[key] == null || obj[key] == "") {
            module._log.warn("Invalid attribute ignored " + key + " inside type " + obj[typeKeyword] + " in JSON-LD\n");
            delete obj[key];
        }
    });
    return obj;
}