const utils = require("../../../utils/utilities.js");

/**
 * The following is how the annotations are defined and the expected result.
 *
 * Given that the annotation can come from multiple levels, it was easier to test
 * it this way instead of listing each individual case that I tested.
 * Given that we're only testing the logic of populating column.annotations, and
 * not how each individual annotations works, I chose easier to debug names instead
 * of actual annotation values.
 * The following are the scenarios that it's testing:
 * - column-level annotations have priority over everything else.
 * - we should mix and match annotation. so for example column-display might come
 *   from the catalog and the display from the column itself. Also the values are properly merged.
 *   The primitive values (and arrays) are replaced, while objects are merged.
 * - by_name has always priority over by_type even if it's defined on a more general
 *   level (catalog vs schema for example)
 *
 * catalog:
 *  by_name: RCT (display), RID (display), boolean_array_col_1 (both column-dsplay and display)
 *  by_type: boolean[] (column-display), timestamptz (column-display, display), int8 (column-display,display)
 *  asset: byte_count (column-display, display), url (column-display, asset), md5 (column-display)
 *    - column_defaults_schema:
 *      by_type: timestamptz(column-display)
 *      by_name: RID  (display), asset_col_1_md5 (column-display)
 *      asset: md5 (column-display)
 *      asset: url (asset)
 *        - table_1
 *          by_type: boolean[] (display)
 *          asset: byte_count (column-display)
 *            - RID
 *              result: display from schema
 *            - RCT
 *              result: display from catalog
 *            - boolean_array_col_1 (boolean[])
 *                result: column-display and display defined on catalog
 *            - boolean_array_col_2 (boolean[])
 *                result: column-display on catalog, display on table_1
 *            - timestamptz_col_1 (timestamptz)
 *              with column-display
 *                result: column-display on itself, display on catalog
 *            - timestamptz_col_2 (timestamptz)
 *                result: column-display on schema, display on catalog
 *            - asset_col_1
 *                result: column-display on catalog (asset.url)
 *                        mix of asset on itself, catalog, and schema
 *            - asset_col_1_byte_count (int8)
 *                result: column-display on table (asset.byte_count), display on catalog (asset.byte_count).
 *            - asset_col_1_md5 (int8)
 *                result: column-display on schema (asset.md5), display on catalog (int8)
 *        - table_2
 *            - RID
 *              result: display from schema
 *            - RCT
 *              result: display from catalog
 *            - boolean_array_col_1 (boolean[])
 *              with display
 *                result: column-display on catalog, display on itself
 *            - boolean_array_col_2 (boolean[])
 *              with column-display
 *                result: column-display on itself
 *            - asset_col_1
 *              with column-display
 *                result: column-display on itself
 *                        mix of asset on itself, catalog, and schema
 *            - asset_col_1_byte_count (int8)
 *              with column-display
 *                 result: column-display on itself, display on catalog (int8).
 *            - asset_col_1_md5 (int8)
 *              with display
 *                result: column-display on schema, display on itself
 */
exports.execute = function (options) {
  describe('column-defaults annotations,', function () {

    const schemaName = 'column_defaults_schema';

    const catalogAnnotations = {
      "tag:isrd.isi.edu,2023:column-defaults": {
        "by_name": {
          "RID": {
            "tag:misd.isi.edu,2015:display": {
              "defined_on": "catalog_by_name"
            }
          },
          "RCT": {
            "tag:misd.isi.edu,2015:display": {
              "defined_on": "catalog_by_name"
            }
          },
          "boolean_array_col_1": {
            "tag:isrd.isi.edu,2015:display": {
              "defined_on": "catalog_by_name"
            },
            "tag:isrd.isi.edu,2016:column-display": {
              "defined_on": "catalog_by_name"
            }
          }
        },
        "by_type": {
          "boolean[]": {
            "tag:isrd.isi.edu,2016:column-display": {
              "defined_on": "catalog_by_type"
            }
          },
          "timestamptz": {
            "tag:isrd.isi.edu,2015:display": {
              "defined_on": "catalog_by_type"
            },
            "tag:isrd.isi.edu,2016:column-display": {
              "defined_on": "catalog_by_type"
            }
          },
          "int8": {
            "tag:isrd.isi.edu,2015:display": {
              "defined_on": "catalog_by_type"
            },
            "tag:isrd.isi.edu,2016:column-display": {
              "defined_on": "catalog_by_type"
            }
          }
        },
        "asset": {
          "url": {
            "tag:isrd.isi.edu,2016:column-display": {
              "defined_on": "catalog_asset_url"
            },
            "tag:isrd.isi.edu,2017:asset": {
              "display": {
                "*": {
                  "file_preview": {
                    "content_type_mapping": {
                      "image/": false
                    },
                    "file_extension_mapping": {
                      ".customext": "text"
                    },
                    "disabled": ["csv", "markdown"]
                  }
                }
              },
            },
          },
          "byte_count": {
            "tag:isrd.isi.edu,2015:display": {
              "defined_on": "catalog_asset_byte_count"
            },
            "tag:isrd.isi.edu,2016:column-display": {
              "defined_on": "catalog_asset_byte_count"
            }
          },
          "md5": {
            "tag:isrd.isi.edu,2016:column-display": {
              "defined_on": "catalog_asset_md5"
            }
          }
        }
      }
    }

    const expectedAnnotations = {
      'table_1': {
        'RID': {
          "tag:misd.isi.edu,2015:display": {
            "defined_on": "schema_by_name"
          }
        },
        'RCT': {
          "tag:misd.isi.edu,2015:display": {
            "defined_on": "catalog_by_name"
          }
        },
        'boolean_array_col_1': {
          "tag:isrd.isi.edu,2015:display": {
            "defined_on": "catalog_by_name"
          },
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "catalog_by_name"
          }
        },
        'boolean_array_col_2': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "catalog_by_type"
          },
          "tag:isrd.isi.edu,2015:display": {
            "defined_on": "table_by_type"
          }
        },
        'timestamptz_col_1': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "timestamptz_col_1",
            "defined_on_2": "schema_by_type"
          },
          "tag:isrd.isi.edu,2015:display": {
            "defined_on": "catalog_by_type"
          }
        },
        'timestamptz_col_2': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "schema_by_type",
            "defined_on_2": "schema_by_type"
          },
          "tag:isrd.isi.edu,2015:display": {
            "defined_on": "catalog_by_type"
          }
        },
        'asset_col_1': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "catalog_asset_url"
          },
          "tag:isrd.isi.edu,2017:asset": {
            "url_pattern": "/hatrac/{{asset_col_1}}",
            "filename_column": "asset_col_1_filename",
            "byte_count_column": "asset_col_1_byte_count",
            "md5": "asset_col_1_md5",
            "sha256": "asset_col_1_sha256",
            "display": {
              "*": {
                "file_preview": {
                  "content_type_mapping": {
                    "image/": false,
                    "image/png": "image",
                    "application/my-example": false,
                  },
                  "file_extension_mapping": {
                    ".customext": "text"
                  },
                  "disabled": ["json"]
                }
              }
            }
          }
        },
        'asset_col_1_byte_count': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "table_asset_byte_count"
          },
          "tag:isrd.isi.edu,2015:display": {
            "defined_on": "catalog_asset_byte_count"
          }
        },
        'asset_col_1_md5': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "schema_asset_md5"
          },
          "tag:isrd.isi.edu,2015:display": {
            "defined_on": "catalog_by_type"
          }
        }
      },
      'table_2': {
        'boolean_array_col_1': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "catalog_by_name"
          },
          "tag:isrd.isi.edu,2015:display": {
            "defined_on": "boolean_array_col_1"
          }
        },
        'boolean_array_col_2': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "boolean_array_col_2"
          }
        },
        'asset_col_1': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "asset_col_1"
          },
          "tag:isrd.isi.edu,2017:asset": {
            "url_pattern": "/hatrac/{{asset_col_1}}",
            "filename_column": "asset_col_1_filename",
            "byte_count_column": "asset_col_1_byte_count",
            "md5": "asset_col_1_md5",
            "sha256": "asset_col_1_sha256",
            "display": {
              "*": {
                "file_preview": {
                  "content_type_mapping": {
                    "image/": false,
                    "image/png": false,
                    "application/my-example": false,
                  },
                  "file_extension_mapping": {
                    ".customext": "text"
                  },
                  "disabled": ["json"]
                }
              }
            }
          }
        },
        'asset_col_1_byte_count': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "asset_col_1_byte_count"
          },
          "tag:isrd.isi.edu,2015:display": {
            "defined_on": "catalog_asset_byte_count"
          }
        },
        'asset_col_1_md5': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "schema_asset_md5"
          },
          "tag:isrd.isi.edu,2015:display": {
            "defined_on": "asset_col_1_md5"
          }
        }
      }
    }

    let schema;
    beforeAll((done) => {
      utils.setCatalogAnnotations(options, catalogAnnotations).then(() => {
        schema = options.catalog.schemas.get(schemaName);
        done();
      }).catch((err) => done.fail(err));
    });

    Object.keys(expectedAnnotations).forEach((tableName) => {
      describe(`for table ${tableName}, `, () => {
        Object.keys(expectedAnnotations[tableName]).forEach((columnName) => {
          it(`column ${columnName} should have the proper annotations.`, () => {
            const annots = schema.tables.get(tableName).columns.get(columnName).annotations;
            const columnAnnots = expectedAnnotations[tableName][columnName];
            const message = `table=${tableName}, col=${columnName}`;

            expect(annots.length()).toEqual(Object.keys(columnAnnots).length, `length missmatch. ${message}`);
            annots.names().forEach((k) => {
              expect(k in columnAnnots).toEqual(true, `annotation missing. ${message}, key='${k}'`);
              expect(annots.get(k).content).toEqual(columnAnnots[k], `annotation value missmatch. ${message}, key='${k}'`);
            });
          });
        });
      });
    })

    afterAll((done) => {
      // removed the catalog annotation
      utils.setCatalogAnnotations(options, {}).then(() => {
        done();
      }).catch((err) => done.fail(err));
    });

  });

}
