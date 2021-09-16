# This script is responsible for generating a jsonldSchema.json file that contains all attributes
# and its types for the schema.org classes used as input
# schemaorg-current-https.ttl is used as input for the data definition
# Output can be compared against schema.org/CLASS_NAME
import rdflib
import json

requiredProps = 'requiredProperties'
standardRequiredProps = ['name']
datasetRequiredProps = ['name', 'description']
dataDownloadRequiredProps = ['contentUrl', 'encodingFormat']

def transform(rowElement, attr):
    return rowElement[attr].toPython().split("/")[-1]

# convert the rowElement to an array 
def transformToArray(rowElement, attr):
    individualElements = rowElement[attr].toPython().split(" ")
    sortedElements = sorted(individualElements)
    for i in range(len(sortedElements)):
        sortedElements[i] = sortedElements[i].split("/")[-1]
    return sortedElements


# load schema.org turtle download into a graph

g = rdflib.Graph()
g.parse("schemaorg-current-https.ttl", format="n3")  # query the graph

# Fetches all the rows and then filters based on the range type and domain type
# We also filter the attributes that have been superseded by newer attributes in schema.org
result1 = g.query("""
SELECT 
  ?prop
  (GROUP_CONCAT(DISTINCT ?label) AS ?label)
  (GROUP_CONCAT(DISTINCT ?dtype) AS ?dtypes)
  (GROUP_CONCAT(DISTINCT ?rtype) AS ?rtypes)
WHERE {
  ?prop a rdf:Property .
  ?prop schema:domainIncludes ?dtype .
  ?prop rdfs:label ?label .
  ?prop schema:rangeIncludes ?rtype .
  FILTER ((
    ?rtype = <https://schema.org/Text>
    || ?rtype = <https://schema.org/URL>
    || ?rtype = <https://schema.org/Boolean>
    || ?rtype = <https://schema.org/Integer>
    || ?rtype = <https://schema.org/Number>
    || ?rtype = <https://schema.org/Date>
    || ?rtype = <https://schema.org/DateTime>
    || ?rtype = <https://schema.org/Comment>
    || ?rtype = <https://schema.org/Language>
    || ?rtype = <https://schema.org/Intangible>
    || ?rtype = <https://schema.org/Person>
    || ?rtype = <https://schema.org/Organization>
    || ?rtype = <https://schema.org/DataCatalog>
    || ?rtype = <https://schema.org/CreativeWork>
    || ?rtype = <https://schema.org/Thing>
    || ?rtype = <https://schema.org/Dataset>
    || ?rtype = <https://schema.org/DataDownload>
    )  
    && (
    ?dtype = <https://schema.org/Comment>
    || ?dtype = <https://schema.org/Language>
    || ?dtype = <https://schema.org/Intangible>
    || ?dtype = <https://schema.org/Person>
    || ?dtype = <https://schema.org/Organization>
    || ?dtype = <https://schema.org/DataCatalog>
    || ?dtype = <https://schema.org/CreativeWork>
    || ?dtype = <https://schema.org/Thing>
    || ?dtype = <https://schema.org/Dataset>
    || ?dtype = <https://schema.org/DataDownload>
    || ?dtype = <https://schema.org/MediaObject>
    )
    && NOT EXISTS { ?prop schema:supersededBy ?supersede . }
    )
}
GROUP BY ?prop
ORDER BY ?prop
""")

# We get the parent class of all the classes with this query
result2 = g.query("""
SELECT 
  ?prop ?subclass
WHERE {
  ?prop a rdfs:Class .
  ?prop rdfs:subClassOf ?subclass .
  FILTER (
    ?prop = <https://schema.org/Comment>
    || ?prop = <https://schema.org/Language>
    || ?prop = <https://schema.org/Intangible>
    || ?prop = <https://schema.org/Person>
    || ?prop = <https://schema.org/Organization>
    || ?prop = <https://schema.org/DataCatalog>
    || ?prop = <https://schema.org/CreativeWork>
    || ?prop = <https://schema.org/Thing>
    || ?prop = <https://schema.org/Dataset>
    || ?prop = <https://schema.org/DataDownload>
    || ?prop = <https://schema.org/MediaObject>
    )
}
GROUP BY ?prop
ORDER BY ?prop
""")

allSchemaOrgTypesDict = {}
attrMap = {}
for row in result1:
    domainArr = transformToArray(row, 'dtypes')
    label = transform(row, 'label')
    dataType = transformToArray(row, 'rtypes')
    for domain in domainArr:
       # If schema.org class has not been seen before then setup the structure else just append
        if domain not in allSchemaOrgTypesDict:
            allSchemaOrgTypesDict[domain] = {"properties": {}, "requiredProperties": [], "parent": None}

        schemaClassFromDict = allSchemaOrgTypesDict[domain]
        schemaClassFromDict["properties"][label] = {"types": dataType}

subclassMap = {}
for row in result2:
    currentType = transform(row, 'prop')
    # some classes might not have any property on their own
    if currentType not in allSchemaOrgTypesDict:
        allSchemaOrgTypesDict[currentType] = {"properties": {}, "requiredProperties": [], "parent": None}
    allSchemaOrgTypesDict[currentType]["parent"] = transform(row, 'subclass')

# schema.org does not have any concept of required props, but Google does so we hard code it here
allSchemaOrgTypesDict["Dataset"][requiredProps] = datasetRequiredProps
allSchemaOrgTypesDict["DataDownload"][requiredProps] = dataDownloadRequiredProps
allSchemaOrgTypesDict["Person"][requiredProps] = standardRequiredProps
allSchemaOrgTypesDict["Organization"][requiredProps] = standardRequiredProps
allSchemaOrgTypesDict["DataCatalog"][requiredProps] = standardRequiredProps


json_object = json.dumps({"schema.org": allSchemaOrgTypesDict}, indent=4)
f = open("jsonldSchema.json", "w")
f.write(json_object)
f.close()


