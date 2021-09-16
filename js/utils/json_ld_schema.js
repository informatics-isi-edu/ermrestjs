/**
 * This JSON was generated with the help of scripts/google_dataset/schema_org_sparql.py
 * Format :
 * {
 *   SchemaOrgClass: {
 *      "properties": {
 *         Prop1:{"types":[Type1, Type2, ...]},
 *         Prop2: {"types":[Type1, Type2, ...]},
 *         ...}
 *     },
 *     "requiredProperties": [Prop2,...],
 *     "parent": SchemaOrgParentClass
 *   }
 * }
 * Here `parent` is a class who properties are inherited by the child class SchemaOrgClass and can be used in the JSON-LD for SchemaOrgClass
 * This JSON consists of a subset of the original list of properties and types provided by schema.org
 * The original list and description of each property can be found by going to schema.org/SchemaOrgClass , for example schema.org/Dataset
 * The details of any property can be found by going to schema.org/Prop , for example schema.org/citation
 */
module.jsonldSchemaPropObj = Object.freeze({
    "CreativeWork": {
        "properties": {
            "about": {
                "types": [
                    "Thing"
                ]
            },
            "abstract": {
                "types": [
                    "Text"
                ]
            },
            "accessMode": {
                "types": [
                    "Text"
                ]
            },
            "accessibilityAPI": {
                "types": [
                    "Text"
                ]
            },
            "accessibilityControl": {
                "types": [
                    "Text"
                ]
            },
            "accessibilityFeature": {
                "types": [
                    "Text"
                ]
            },
            "accessibilityHazard": {
                "types": [
                    "Text"
                ]
            },
            "accessibilitySummary": {
                "types": [
                    "Text"
                ]
            },
            "accountablePerson": {
                "types": [
                    "Person"
                ]
            },
            "acquireLicensePage": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "alternativeHeadline": {
                "types": [
                    "Text"
                ]
            },
            "assesses": {
                "types": [
                    "Text"
                ]
            },
            "author": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "award": {
                "types": [
                    "Text"
                ]
            },
            "character": {
                "types": [
                    "Person"
                ]
            },
            "citation": {
                "types": [
                    "CreativeWork",
                    "Text"
                ]
            },
            "comment": {
                "types": [
                    "Comment"
                ]
            },
            "commentCount": {
                "types": [
                    "Integer"
                ]
            },
            "conditionsOfAccess": {
                "types": [
                    "Text"
                ]
            },
            "contentRating": {
                "types": [
                    "Text"
                ]
            },
            "contentReferenceTime": {
                "types": [
                    "DateTime"
                ]
            },
            "contributor": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "copyrightHolder": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "copyrightNotice": {
                "types": [
                    "Text"
                ]
            },
            "copyrightYear": {
                "types": [
                    "Number"
                ]
            },
            "correction": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "creativeWorkStatus": {
                "types": [
                    "Text"
                ]
            },
            "creator": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "creditText": {
                "types": [
                    "Text"
                ]
            },
            "dateCreated": {
                "types": [
                    "Date",
                    "DateTime"
                ]
            },
            "dateModified": {
                "types": [
                    "Date",
                    "DateTime"
                ]
            },
            "datePublished": {
                "types": [
                    "Date",
                    "DateTime"
                ]
            },
            "discussionUrl": {
                "types": [
                    "URL"
                ]
            },
            "editEIDR": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "editor": {
                "types": [
                    "Person"
                ]
            },
            "educationalLevel": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "educationalUse": {
                "types": [
                    "Text"
                ]
            },
            "encodingFormat": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "exampleOfWork": {
                "types": [
                    "CreativeWork"
                ]
            },
            "expires": {
                "types": [
                    "Date"
                ]
            },
            "funder": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "genre": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "hasPart": {
                "types": [
                    "CreativeWork"
                ]
            },
            "headline": {
                "types": [
                    "Text"
                ]
            },
            "inLanguage": {
                "types": [
                    "Language",
                    "Text"
                ]
            },
            "interactivityType": {
                "types": [
                    "Text"
                ]
            },
            "isAccessibleForFree": {
                "types": [
                    "Boolean"
                ]
            },
            "isBasedOn": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "isFamilyFriendly": {
                "types": [
                    "Boolean"
                ]
            },
            "isPartOf": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "keywords": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "learningResourceType": {
                "types": [
                    "Text"
                ]
            },
            "license": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "mainEntity": {
                "types": [
                    "Thing"
                ]
            },
            "maintainer": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "material": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "materialExtent": {
                "types": [
                    "Text"
                ]
            },
            "mentions": {
                "types": [
                    "Thing"
                ]
            },
            "pattern": {
                "types": [
                    "Text"
                ]
            },
            "position": {
                "types": [
                    "Integer",
                    "Text"
                ]
            },
            "producer": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "provider": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "publisher": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "publisherImprint": {
                "types": [
                    "Organization"
                ]
            },
            "publishingPrinciples": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "schemaVersion": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "sdDatePublished": {
                "types": [
                    "Date"
                ]
            },
            "sdLicense": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "sdPublisher": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "size": {
                "types": [
                    "Text"
                ]
            },
            "sourceOrganization": {
                "types": [
                    "Organization"
                ]
            },
            "sponsor": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "teaches": {
                "types": [
                    "Text"
                ]
            },
            "temporal": {
                "types": [
                    "DateTime",
                    "Text"
                ]
            },
            "temporalCoverage": {
                "types": [
                    "DateTime",
                    "Text",
                    "URL"
                ]
            },
            "text": {
                "types": [
                    "Text"
                ]
            },
            "thumbnailUrl": {
                "types": [
                    "URL"
                ]
            },
            "translationOfWork": {
                "types": [
                    "CreativeWork"
                ]
            },
            "translator": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "typicalAgeRange": {
                "types": [
                    "Text"
                ]
            },
            "usageInfo": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "version": {
                "types": [
                    "Number",
                    "Text"
                ]
            },
            "workExample": {
                "types": [
                    "CreativeWork"
                ]
            },
            "workTranslation": {
                "types": [
                    "CreativeWork"
                ]
            }
        },
        "requiredProperties": [],
        "parent": "Thing"
    },
    "Organization": {
        "properties": {
            "actionableFeedbackPolicy": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "address": {
                "types": [
                    "Text"
                ]
            },
            "alumni": {
                "types": [
                    "Person"
                ]
            },
            "areaServed": {
                "types": [
                    "Text"
                ]
            },
            "award": {
                "types": [
                    "Text"
                ]
            },
            "brand": {
                "types": [
                    "Organization"
                ]
            },
            "correctionsPolicy": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "department": {
                "types": [
                    "Organization"
                ]
            },
            "dissolutionDate": {
                "types": [
                    "Date"
                ]
            },
            "diversityPolicy": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "diversityStaffingReport": {
                "types": [
                    "URL"
                ]
            },
            "duns": {
                "types": [
                    "Text"
                ]
            },
            "email": {
                "types": [
                    "Text"
                ]
            },
            "employee": {
                "types": [
                    "Person"
                ]
            },
            "ethicsPolicy": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "faxNumber": {
                "types": [
                    "Text"
                ]
            },
            "founder": {
                "types": [
                    "Person"
                ]
            },
            "foundingDate": {
                "types": [
                    "Date"
                ]
            },
            "funder": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "globalLocationNumber": {
                "types": [
                    "Text"
                ]
            },
            "isicV4": {
                "types": [
                    "Text"
                ]
            },
            "knowsAbout": {
                "types": [
                    "Text",
                    "Thing",
                    "URL"
                ]
            },
            "knowsLanguage": {
                "types": [
                    "Language",
                    "Text"
                ]
            },
            "legalName": {
                "types": [
                    "Text"
                ]
            },
            "leiCode": {
                "types": [
                    "Text"
                ]
            },
            "location": {
                "types": [
                    "Text"
                ]
            },
            "logo": {
                "types": [
                    "URL"
                ]
            },
            "member": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "memberOf": {
                "types": [
                    "Organization"
                ]
            },
            "naics": {
                "types": [
                    "Text"
                ]
            },
            "ownershipFundingInfo": {
                "types": [
                    "CreativeWork",
                    "Text",
                    "URL"
                ]
            },
            "parentOrganization": {
                "types": [
                    "Organization"
                ]
            },
            "publishingPrinciples": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "slogan": {
                "types": [
                    "Text"
                ]
            },
            "sponsor": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "subOrganization": {
                "types": [
                    "Organization"
                ]
            },
            "taxID": {
                "types": [
                    "Text"
                ]
            },
            "telephone": {
                "types": [
                    "Text"
                ]
            },
            "unnamedSourcesPolicy": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "vatID": {
                "types": [
                    "Text"
                ]
            }
        },
        "requiredProperties": [
            "name"
        ],
        "parent": "Thing"
    },
    "Person": {
        "properties": {
            "additionalName": {
                "types": [
                    "Text"
                ]
            },
            "address": {
                "types": [
                    "Text"
                ]
            },
            "affiliation": {
                "types": [
                    "Organization"
                ]
            },
            "alumniOf": {
                "types": [
                    "Organization"
                ]
            },
            "award": {
                "types": [
                    "Text"
                ]
            },
            "birthDate": {
                "types": [
                    "Date"
                ]
            },
            "brand": {
                "types": [
                    "Organization"
                ]
            },
            "callSign": {
                "types": [
                    "Text"
                ]
            },
            "children": {
                "types": [
                    "Person"
                ]
            },
            "colleague": {
                "types": [
                    "Person",
                    "URL"
                ]
            },
            "deathDate": {
                "types": [
                    "Date"
                ]
            },
            "duns": {
                "types": [
                    "Text"
                ]
            },
            "email": {
                "types": [
                    "Text"
                ]
            },
            "familyName": {
                "types": [
                    "Text"
                ]
            },
            "faxNumber": {
                "types": [
                    "Text"
                ]
            },
            "follows": {
                "types": [
                    "Person"
                ]
            },
            "funder": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "gender": {
                "types": [
                    "Text"
                ]
            },
            "givenName": {
                "types": [
                    "Text"
                ]
            },
            "globalLocationNumber": {
                "types": [
                    "Text"
                ]
            },
            "honorificPrefix": {
                "types": [
                    "Text"
                ]
            },
            "honorificSuffix": {
                "types": [
                    "Text"
                ]
            },
            "isicV4": {
                "types": [
                    "Text"
                ]
            },
            "jobTitle": {
                "types": [
                    "Text"
                ]
            },
            "knows": {
                "types": [
                    "Person"
                ]
            },
            "knowsAbout": {
                "types": [
                    "Text",
                    "Thing",
                    "URL"
                ]
            },
            "knowsLanguage": {
                "types": [
                    "Language",
                    "Text"
                ]
            },
            "memberOf": {
                "types": [
                    "Organization"
                ]
            },
            "naics": {
                "types": [
                    "Text"
                ]
            },
            "parent": {
                "types": [
                    "Person"
                ]
            },
            "publishingPrinciples": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "relatedTo": {
                "types": [
                    "Person"
                ]
            },
            "sibling": {
                "types": [
                    "Person"
                ]
            },
            "sponsor": {
                "types": [
                    "Organization",
                    "Person"
                ]
            },
            "spouse": {
                "types": [
                    "Person"
                ]
            },
            "taxID": {
                "types": [
                    "Text"
                ]
            },
            "telephone": {
                "types": [
                    "Text"
                ]
            },
            "vatID": {
                "types": [
                    "Text"
                ]
            },
            "worksFor": {
                "types": [
                    "Organization"
                ]
            }
        },
        "requiredProperties": [
            "name"
        ],
        "parent": "Thing"
    },
    "Thing": {
        "properties": {
            "additionalType": {
                "types": [
                    "URL"
                ]
            },
            "alternateName": {
                "types": [
                    "Text"
                ]
            },
            "description": {
                "types": [
                    "Text"
                ]
            },
            "disambiguatingDescription": {
                "types": [
                    "Text"
                ]
            },
            "identifier": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "image": {
                "types": [
                    "URL"
                ]
            },
            "mainEntityOfPage": {
                "types": [
                    "CreativeWork",
                    "URL"
                ]
            },
            "name": {
                "types": [
                    "Text"
                ]
            },
            "sameAs": {
                "types": [
                    "URL"
                ]
            },
            "subjectOf": {
                "types": [
                    "CreativeWork"
                ]
            },
            "url": {
                "types": [
                    "URL"
                ]
            }
        },
        "requiredProperties": [],
        "parent": null
    },
    "MediaObject": {
        "properties": {
            "bitrate": {
                "types": [
                    "Text"
                ]
            },
            "contentSize": {
                "types": [
                    "Text"
                ]
            },
            "contentUrl": {
                "types": [
                    "URL"
                ]
            },
            "embedUrl": {
                "types": [
                    "URL"
                ]
            },
            "encodesCreativeWork": {
                "types": [
                    "CreativeWork"
                ]
            },
            "encodingFormat": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "endTime": {
                "types": [
                    "DateTime"
                ]
            },
            "ineligibleRegion": {
                "types": [
                    "Text"
                ]
            },
            "playerType": {
                "types": [
                    "Text"
                ]
            },
            "productionCompany": {
                "types": [
                    "Organization"
                ]
            },
            "requiresSubscription": {
                "types": [
                    "Boolean"
                ]
            },
            "startTime": {
                "types": [
                    "DateTime"
                ]
            },
            "uploadDate": {
                "types": [
                    "Date"
                ]
            }
        },
        "requiredProperties": [],
        "parent": "CreativeWork"
    },
    "DataCatalog": {
        "properties": {
            "dataset": {
                "types": [
                    "Dataset"
                ]
            },
            "measurementTechnique": {
                "types": [
                    "Text",
                    "URL"
                ]
            }
        },
        "requiredProperties": [
            "name"
        ],
        "parent": "CreativeWork"
    },
    "Dataset": {
        "properties": {
            "distribution": {
                "types": [
                    "DataDownload"
                ]
            },
            "includedInDataCatalog": {
                "types": [
                    "DataCatalog"
                ]
            },
            "issn": {
                "types": [
                    "Text"
                ]
            },
            "measurementTechnique": {
                "types": [
                    "Text",
                    "URL"
                ]
            },
            "variableMeasured": {
                "types": [
                    "Text"
                ]
            }
        },
        "requiredProperties": [
            "name",
            "description"
        ],
        "parent": "CreativeWork"
    },
    "Comment": {
        "properties": {
            "downvoteCount": {
                "types": [
                    "Integer"
                ]
            },
            "parentItem": {
                "types": [
                    "Comment"
                ]
            },
            "upvoteCount": {
                "types": [
                    "Integer"
                ]
            }
        },
        "requiredProperties": [],
        "parent": "CreativeWork"
    },
    "DataDownload": {
        "properties": {
            "measurementTechnique": {
                "types": [
                    "Text",
                    "URL"
                ]
            }
        },
        "requiredProperties": [
            "contentUrl",
            "encodingFormat"
        ],
        "parent": "MediaObject"
    },
    "Intangible": {
        "properties": {},
        "requiredProperties": [],
        "parent": "Thing"
    },
    "Language": {
        "properties": {},
        "requiredProperties": [],
        "parent": "Intangible"
    }
});