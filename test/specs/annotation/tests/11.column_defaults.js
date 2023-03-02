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
 *  from the catalog and the display from the column itself.
 * - by_name has always priority over by_type even if it's defined on a more general
 *   level (catalog vs schema for example)
 *
 * catalog:
 *  by_name: RCT (display), RID (display), boolean_array_col_1 (both column-dsplay and display)
 *  by_type: boolean[] (column-display), timestamptz (column-display, display)
 *    - column_defaults_schema:
 *      by_type: timestamptz(column-display)
 *      by_name: RID  (display)
 *        - table_1
 *          by_type: boolean[] (display)
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
            "defined_on": "timestamptz_col_1"
          },
          "tag:isrd.isi.edu,2015:display": {
            "defined_on": "catalog_by_type"
          }
        },
        'timestamptz_col_2': {
          "tag:isrd.isi.edu,2016:column-display": {
            "defined_on": "schema_by_type"
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