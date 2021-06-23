import rdflib
import json

requiredProps = 'requiredProperties'
standardRequiredProps = ['name']
datasetRequiredProps = ['name', 'description']
dataDownloadRequiredProps = ['contentUrl', 'encodingFormat']

def transform(rowElement, attr):
    return rowElement[attr].toPython().split("/")[-1]


def transformToArray(rowElement, attr):
    individualElements = rowElement[attr].toPython().split(" ")
    sortedElements = sorted(individualElements)
    for i in range(len(sortedElements)):
        sortedElements[i] = sortedElements[i].split("/")[-1]
    return sortedElements


# load schema.org turtle download into a graph

g = rdflib.Graph()
g.parse("schemaorg-current-https.ttl", format="n3")  # query the graph

# TODO: the DISTINCT doesn't seem to work properly. Need a better way to aggregate.
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

result2 = g.query("""
SELECT 
  ?prop ?subclass
WHERE {
  ?prop a rdfs:Class .
  ?prop rdfs:subClassOf ?subclass
}
GROUP BY ?prop
ORDER BY ?prop
""")

allSchemaOrgTypesDict = {}
count = 0
attrMap = {}
for row in result1:
    domainArr = transformToArray(row, 'dtypes')
    label = transform(row, 'label')
    dataType = transformToArray(row, 'rtypes')
    for domain in domainArr:
        if domain not in allSchemaOrgTypesDict:
            allSchemaOrgTypesDict[domain] = {"properties": {}, "requiredProperties": [], "parent": None}

        schemaClassFromDict = allSchemaOrgTypesDict[domain]
        schemaClassFromDict["properties"][label] = {"types": dataType}
        # print("prop=%s\nlabels=%s\ndomain_types=%s\nrange_types=%s\n\n" % row)
        count += 1

subclassMap = {}
for row in result2:
    currentType = transform(row, 'prop')
    if currentType in allSchemaOrgTypesDict:
        allSchemaOrgTypesDict[currentType]["parent"] = transform(row, 'subclass')

# Hard coded mandatory props -
allSchemaOrgTypesDict["Dataset"][requiredProps] = datasetRequiredProps
allSchemaOrgTypesDict["DataDownload"][requiredProps] = dataDownloadRequiredProps
allSchemaOrgTypesDict["Person"][requiredProps] = standardRequiredProps
allSchemaOrgTypesDict["Organization"][requiredProps] = standardRequiredProps
allSchemaOrgTypesDict["DataCatalog"][requiredProps] = standardRequiredProps


json_object = json.dumps({"schema.org": allSchemaOrgTypesDict}, indent=4)
f = open("validation.json", "w")
f.write(json_object)
f.close()

# print("count=%d" % (count,))
result = g.query("""
SELECT 
  DISTINCT ?rtype
WHERE {
  schema:Dataset rdfs:subClassOf* ?dtype .
  ?prop a rdf:Property .
  ?prop schema:domainIncludes ?dtype .
  ?prop rdfs:label ?label .
  ?prop schema:rangeIncludes ?rtype .
}
""")

# for row in result:
#    print(row)
