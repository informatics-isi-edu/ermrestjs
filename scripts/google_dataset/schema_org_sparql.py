import rdflib

# load schema.org turtle download into a graph
g = rdflib.Graph()
g.parse("/tmp/schemaorg-current-https.ttl", format="n3")# query the graph

# TODO: the DISTINCT doesn't seem to work properly. Need a better way to aggregate. 
result1 = g.query("""
SELECT 
  ?prop
  (GROUP_CONCAT(DISTINCT ?label) AS ?labels)
  (GROUP_CONCAT(DISTINCT ?dtype) AS ?dtypes)
  (GROUP_CONCAT(DISTINCT ?rtype) AS ?rtypes)
WHERE {
  schema:Dataset rdfs:subClassOf* ?dtype .
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
  )
}
GROUP BY ?prop
ORDER BY ?prop
""")
count = 0
for row in result1:
    print("prop=%s\nlabels=%s\ndomain_types=%s\nrange_types=%s\n\n" % row)
    count += 1
print("count=%d" % (count,))


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
#for row in result:
#    print(row)

