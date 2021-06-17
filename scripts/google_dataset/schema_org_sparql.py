import rdflib
import json


def transform(rowElement, attr):
    individualElements = rowElement[attr].toPython().split(" ")
    if len(individualElements) == 1:
        return rowElement[attr].toPython().split("/")[-1]
    else:
        for i in range(len(individualElements)):
            individualElements[i] = individualElements[i].split("/")[-1]
        return individualElements

# load schema.org turtle download into a graph

g = rdflib.Graph()
g.parse("schemaorg-current-https.ttl", format="n3")  # query the graph

# TODO: the DISTINCT doesn't seem to work properly. Need a better way to aggregate.
result1 = g.query("""
SELECT 
  ?prop
  (GROUP_CONCAT(DISTINCT ?label) AS ?labels)
  (GROUP_CONCAT(DISTINCT ?dtype) AS ?dtypes)
  (GROUP_CONCAT(DISTINCT ?rtype) AS ?rtypes)
WHERE {
  { schema:Dataset rdfs:subClassOf* ?dtype .}
  UNION
  { schema:Person rdfs:subClassOf* ?dtype . }
  UNION
  { schema:Organization rdfs:subClassOf* ?dtype . }
  ?prop a rdf:Property .
  ?prop schema:domainIncludes ?dtype .
  ?prop rdfs:label ?label .
  ?prop schema:rangeIncludes ?rtype .
  FILTER (
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
  )
}
GROUP BY ?prop
ORDER BY ?prop
""")

typeArray = ['Dataset', 'Person', 'Organization']
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

subclassMap = {}
for row in result2:
    subclassMap[transform(row, 'prop')] = transform(row, 'subclass')

count = 0
attrMap = {}
for row in result1:
    dictValues = {'domain': transform(row, 'dtypes'), 'range': transform(row, 'rtypes')}
    attrMap[transform(row, 'labels')] = dictValues
    #print("prop=%s\nlabels=%s\ndomain_types=%s\nrange_types=%s\n\n" % row)
    count += 1


json_object = json.dumps({"subclasses": subclassMap, "props": attrMap}, indent=4)
f = open("validation.json", "w")
f.write(json_object)
f.close()

#print("count=%d" % (count,))
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
