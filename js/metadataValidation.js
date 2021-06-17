function validateDataset() {
    const subclassMap = require("./props.json")["subclasses"];
    const schemaPropMap = require("./props.json")["props"];
    const mandatoryPropsArr = require("./props.json")["mandatoryProps"];
    const jsonLd = require("./test2.json");
    const definitionObj = {
      "@context": "https://schema.org",
      "@type": "Dataset",
    };
  
    if (isSchemaTypeDefined(jsonLd, definitionObj)) {
      validateObject(jsonLd, subclassMap, schemaPropMap);
  
      if (areMandatoryPropsDefined(jsonLd, mandatoryPropsArr)) {
        // always return true here as we will simply ignore all attributes that fail validation and are not mandatory
        return true;
      }
    }
  
    return false;
  }
  
  function validateObject(obj, subclassMap, schemaPropMap) {
    Object.keys(obj).forEach((key) => {
      if (!key.startsWith("@")) {
        propDetails = schemaPropMap[key];
        // incorrect property name or domain
        if (
          !(key in schemaPropMap) ||
          (propDetails?.domain &&
            !isValidDomain(obj["@type"], propDetails.domain, subclassMap))
        ) {
          return removeProp(obj, key);
        }
  
        // type/range not followed
        let isValid = Array.isArray(obj[key]) ? obj[key].every((element) => isValidType(propDetails, element)) : isValidType(propDetails, obj[key]);
        if(!isValid) {
          removeProp(obj, key);
        }
      }
    });
  }
  
  function removeProp(obj, key) {
    console.warn("Invalid attribute ignored - " + key);
    delete obj[key];
  }
  
  function isValidType(propDetails, element) {
    let isTypeValidated = false;
    // type/range not followed
    if (propDetails?.range) {
      propDetails.range.every((propDetail) => {
        switch (propDetail) {
          case "Text":
          case "URL":
            if (typeof element == "string") {
              isTypeValidated = true;
              return false;
            }
          break;
  
          case "Date":
          case "DateTime":
            if (element instanceof Date) {
              isTypeValidated = true;
              return false;
            }
        }
      });
    } else {
      console.warn(
        "Incorrect validation definition for attribute in ermrestjs" - key
      );
    }
    return isTypeValidated;
  }
  
  function isSchemaTypeDefined(jsonLd, definitionObj) {
    let result = true;
    Object.keys(definitionObj).forEach((key) => {
      if (!(key in jsonLd) || jsonLd[key] != definitionObj[key]) {
        console.warn("Missing or incorrect value for - " + key);
        result = false;
      }
    });
    return result;
  }
  
  function areMandatoryPropsDefined(jsonLd, mandatoryPropsArr) {
    let result = true;
    mandatoryPropsArr.forEach((key) => {
      if (!(key in jsonLd)) {
        console.warn("Missing value for mandatory attribute - " + key);
        result = false;
      }
    });
    return result;
  }
  
  function isValidDomain(objClass, expectedDomainOfKey, subclassMap) {
    if (objClass == expectedDomainOfKey) {
      return true;
    }
    // checked all ancestors and no match found
    if (!(objClass in subclassMap)) {
      return false;
    }
    return isValidDomain(subclassMap[objClass], expectedDomainOfKey, subclassMap);
  }
  
  console.log("Validation returned : " + validateDataset());
  