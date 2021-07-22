 This folder helps us generate the assets for performing validation on generated JSON-LD for Google Dataset
 
 schema_org_sparql.py helps us generate jsonldSchema.json, which is a file used to validate the generated JSON-LD using the annotation [tag:isrd.isi.edu,2021:google-dataset](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/annotation.md#tag-2021-google-dataset) 
 
 The script uses the turtle file schemaorg-current-https.ttl as input which has the exhaustive list of all properties and types provided by schema.org. The turtle file is a machine readable file obtained from [here](https://schema.org/version/latest/schemaorg-current-https.ttl). All the formats of this file are available [here](https://schema.org/docs/developers.html)


Steps:
1. Edit the filter clause of the sparql query to use the appropriate classes needed to generate the jsonLdSchema for.
2. Hard code any required properties that are marked as required by Google but not by schema.org
3. Verify the generated properties and types by doing a sanity check against schema.org

