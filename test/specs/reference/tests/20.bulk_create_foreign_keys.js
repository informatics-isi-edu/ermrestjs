const utils = require("../../../utils/utilities.js");

exports.execute = (options) =>{

  describe("bulk create foreign key APIs for recordedit with prefill using heuristics", () => {

    const catalog_id = process.env.DEFAULT_CATALOG, schema_name = "bulk_create_foreign_keys";

    // main_table <- association_table_w_static_column -> leaf_table_for_static_columns
    describe("for association table with static columns", () => {

      var table_name = "association_table_w_static_column";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(5);
      });

      it("should throw an error trying to access bulkCreateForeignKeyObject before computing it'", () => {
        try {
          // try to access bulk create object
          var prefillAPIs = reference.bulkCreateForeignKeyObject;
        } catch (e) {
          expect(e.message).toBe("Call \"computeBulkCreateForeignKeyObject\" with the prefill object first");
        }
      });

      it("should return null when there is no prefill object when calling 'computeBulkCreateForeignKeyObject'", () => {
        reference.computeBulkCreateForeignKeyObject(null);
        expect(reference.bulkCreateForeignKeyObject).toBeNull();
      });

      it("should have proper values for bulk create object when prefill object is defined", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['iLtVyK4V4RngvckI34y2yQ'],
          keys: {main_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).not.toBeNull();
        expect(reference.bulkCreateForeignKeyObject.leafColumn.name).toBe('nxJv7zX-Kq4S2B-Avpr4tA');
        expect(reference.bulkCreateForeignKeyObject.isUnique).toBeTruthy();

        var andFilters = [{
          source: 'RID',
          hidden: true,
          not_null: true
        }];
        expect(reference.bulkCreateForeignKeyObject.andFiltersForLeaf()).toEqual(andFilters)

        var disabledFilter = [{
          source: [
              { 'inbound':  ['bulk_create_foreign_keys', 'static_to_leaf_fkey' ]},
              { 'outbound': ['bulk_create_foreign_keys', 'static_to_main_fkey' ]},
              'id'
          ],
          choices: ['1']
        }]
        expect(reference.bulkCreateForeignKeyObject.disabledRowsFilter()).toEqual(disabledFilter);
      });
    });

    // main_table <- association_table_non_unique_fk -> leaf_table_for_non_unique
    describe("for association table with non unique fk columns", () => {

      var table_name = "association_table_non_unique_fk";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(2);
      });

      it("should have proper values for bulk create object when prefill object is defined", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['UKzE0bKxIrwe4bfW_9v1TA'],
          keys: {main_fk_col: '1'}
        }

        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).not.toBeNull();
        expect(reference.bulkCreateForeignKeyObject.leafColumn.name).toBe('2CMHw2Q8LcUEWID9Lo2pbw');
        expect(reference.bulkCreateForeignKeyObject.isUnique).toBeFalsy();

        var andFilters = [{
          source: 'RID',
          hidden: true,
          not_null: true
        }];
        expect(reference.bulkCreateForeignKeyObject.andFiltersForLeaf()).toEqual(andFilters)

        var disabledFilter = [{
          source: [
              { 'inbound':  ['bulk_create_foreign_keys', 'non_unique_to_leaf_fkey' ]},
              { 'outbound': ['bulk_create_foreign_keys', 'non_unique_to_main_fkey' ]},
              'id'
          ],
          choices: ['1']
        }]
        expect(reference.bulkCreateForeignKeyObject.disabledRowsFilter()).toEqual(disabledFilter);
      });
    });

    // main_table <- association_table_w_third_fk -> leaf_table_for_three_fk
    describe("for association table with three fk columns", () => {

      var table_name = "association_table_w_third_fk";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(3);
      });

      it("should return null even if prefill object is defined since there are more than 3 foreign keys", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['Ph5gK9Kje1ukxLFYC9sJ3A'],
          keys: {main_fk_col: '1'}
        }

        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).toBeNull();
      });
    });

    // main_table <- association_table_w_composite_fk -> leaf_table_for_composite_fk
    describe("for association table with a composite foreign key", () => {

      var table_name = "association_table_w_composite_fk";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(2);
      });

      it("should return null even if prefill object is defined since there is a composite foreign key", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['o1jpzMQ3kaAxJpcXXUWbsA'],
          keys: { main_fk_col1: '1', main_fk_col2: '1' }
        }

        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).toBeNull();
      });
    });

    /**
     * NOTE: pure and binary association tables would use this mode when there is a prefill object defined
     *   but that should never be the case since p&b tables use a different UI workflow for adding records
     */
    // main_table <- pure_and_binary_association_table -> pb_leaf_table
    describe("for pure and binary association table", () => {

      var table_name = "pure_and_binary_association_table";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(2);
      });

      it("should have proper values for bulk create object when prefill object is defined", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['bInlkY4Cbz2Ez4usvGekSA'],
          keys: {main_fk_col: '1'}
        }

        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).not.toBeNull();
        expect(reference.bulkCreateForeignKeyObject.leafColumn.name).toBe('yrf6sBjcm5XOF_VlzP89TQ');
        expect(reference.bulkCreateForeignKeyObject.isUnique).toBeTruthy();

        var andFilters = [{
          source: 'RID',
          hidden: true,
          not_null: true
        }];
        expect(reference.bulkCreateForeignKeyObject.andFiltersForLeaf()).toEqual(andFilters)

        var disabledFilter = [{
          source: [
              { 'inbound':  ['bulk_create_foreign_keys', 'pb_to_leaf_fkey' ]},
              { 'outbound': ['bulk_create_foreign_keys', 'pb_to_main_fkey' ]},
              'id'
          ],
          choices: ['1']
        }]
        expect(reference.bulkCreateForeignKeyObject.disabledRowsFilter()).toEqual(disabledFilter);
      });
    });
  });

  describe("bulk create foreign key APIs for recordedit with prefill using annotations", () => {

    const catalog_id = process.env.DEFAULT_CATALOG, schema_name = "bulk_create_foreign_keys";

    // main_table_for_annotations <- association_table_w_viz_columns -> third_table_for_viz_columns
    describe("for association table with visible-columns annotation with display property", () => {
      // table has 2 static columns and 3 foreign keys. This test makes sure the bulk_create_foreign_key property from the display property
      // of the visible-columns annotation is the one used. This table also has an annotation on the main<-association foreign-key to turn
      // off this feature that is overridden by the visible-columns display property
      var table_name = "association_table_w_viz_columns";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(5);
      });

      it("should have proper values for bulk create object when prefill object is defined", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['kdFfvIkXOK-ieNlQRVN4aQ'],
          keys: {main_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).not.toBeNull();
        // ["bulk_create_foreign_keys", "viz_columns_to_third_fkey"] is the constraint name of the foreign key used
        expect(reference.bulkCreateForeignKeyObject.leafColumn.name).toBe('m8O28-CBVSpW9vXna6DDDg');
        // third_fk_col is not part of a key
        expect(reference.bulkCreateForeignKeyObject.isUnique).toBeFalsy();

        var andFilters = [{
          source: 'RID',
          hidden: true,
          not_null: true
        }];
        expect(reference.bulkCreateForeignKeyObject.andFiltersForLeaf()).toEqual(andFilters)

        var disabledFilter = [{
          source: [
              { 'inbound':  ['bulk_create_foreign_keys', 'viz_columns_to_third_fkey' ]},
              { 'outbound': ['bulk_create_foreign_keys', 'viz_columns_to_main_fkey' ]},
              'id'
          ],
          choices: ['1']
        }]
        expect(reference.bulkCreateForeignKeyObject.disabledRowsFilter()).toEqual(disabledFilter);
      });
    });

    // main_table_for_annotations <- association_table_w_fk_annotation -> third_table_for_fk_annotation
    describe("for association table with foreign key annotation", () => {
      // table has 2 static columns and 3 foreign keys. This test makes sure the bulk_create_foreign_key property from the display property
      // of the fk annotation is the one used. This table also has a display annotation to turn off this feature that is overridden by
      // the fk annotation display property
      var table_name = "association_table_w_fk_annotation";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(5);
      });

      it("should have proper values for bulk create object when prefill object is defined", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['zqKso67u2OREaKmzf8n0sA'],
          keys: {main_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).not.toBeNull();
        // ["bulk_create_foreign_keys", "fk_annotation_to_third_fkey"] is the constraint name of the foreign key used
        expect(reference.bulkCreateForeignKeyObject.leafColumn.name).toBe('kHj0wXVc4Z8ftN3wBZz7EQ');
        // third_fk_col is not part of a key
        expect(reference.bulkCreateForeignKeyObject.isUnique).toBeFalsy();

        var andFilters = [{
          source: 'RID',
          hidden: true,
          not_null: true
        }];
        expect(reference.bulkCreateForeignKeyObject.andFiltersForLeaf()).toEqual(andFilters)

        var disabledFilter = [{
          source: [
              { 'inbound':  ['bulk_create_foreign_keys', 'fk_annotation_to_third_fkey' ]},
              { 'outbound': ['bulk_create_foreign_keys', 'fk_annotation_to_main_fkey' ]},
              'id'
          ],
          choices: ['1']
        }]
        expect(reference.bulkCreateForeignKeyObject.disabledRowsFilter()).toEqual(disabledFilter);
      });
    });

    // main_table_for_annotations <- association_table_w_table_display_annotation -> third_table_for_table_display_annotation
    describe("for association table with table-display annotation bulk_create_foreign_key_candidates", () => {
      // table has 2 static columns and 3 foreign keys. This test makes sure the bulk_create_foreign_key_candidates property from the table-display property
      // is used. In the `bulk_create_foreign_key_candidates` the leaf fk us listed first before the third fk. The visible columns does not include the leaf fk so
      // the third fk should be used instead. This table also has a display annotation to turn off this feature that is overridden by the table-display annotation.
      var table_name = "association_table_w_table_display_annotation";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(4);
      });

      it("should have proper values for bulk create object when prefill object is defined", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['X9DkFiAOIbC9M3TgWcdGmg'],
          keys: {main_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).not.toBeNull();
        // bulk_create_foreign_key_candidates has 2 values with `table_display_annotation_to_leaf_fkey` as the first entry
        // ["bulk_create_foreign_keys", "table_display_annotation_to_third_fkey"] is the constraint name of the foreign key used
        // since ["bulk_create_foreign_keys", "table_display_annotation_to_leaf_fkey"] is not in the visible columns list
        expect(reference.bulkCreateForeignKeyObject.leafColumn.name).toBe('t4nggjf3H6dHLkiMOJNYlw');
        // third_fk_col is not part of a key
        expect(reference.bulkCreateForeignKeyObject.isUnique).toBeFalsy();

        var andFilters = [{
          source: 'RID',
          hidden: true,
          not_null: true
        }];
        expect(reference.bulkCreateForeignKeyObject.andFiltersForLeaf()).toEqual(andFilters)

        var disabledFilter = [{
          source: [
              { 'inbound':  ['bulk_create_foreign_keys', 'table_display_annotation_to_third_fkey' ]},
              { 'outbound': ['bulk_create_foreign_keys', 'table_display_annotation_to_main_fkey' ]},
              'id'
          ],
          choices: ['1']
        }]
        expect(reference.bulkCreateForeignKeyObject.disabledRowsFilter()).toEqual(disabledFilter);
      });
    });

    // main_table_for_annotations <- association_table_w_display_annotation -> leaf_table_for_display_annotation
    describe("for association table with false set in display annotation on the table", () => {
      // table has 2 static columns and 2 foreign keys. This test makes sure the feature is turned off from the display annotation on the table.
      // This table without this annotation should use the default heuristics
      var table_name = "association_table_w_display_annotation";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(4);
      });

      it("should have no bulk create object when prefill object is defined from main", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['8rhsNkxWotMU08CY3AzsRQ'],
          keys: {main_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        // Display annotation on table is set to false to turn off this feature
        expect(reference.bulkCreateForeignKeyObject).toBeNull();
      });

      it("should have no bulk create object when prefill object is defined from leaf", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['z8xn_pFh2acJdYe6U5CRrQ'],
          keys: {leaf_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        // Display annotation on table is set to false to turn off this feature
        expect(reference.bulkCreateForeignKeyObject).toBeNull();
      });
    });

    // main_table_for_annotations <- association_table_w_false_fk_annotation -> leaf_table_for_false_fk_annotation
    describe("for association table with false set in foreign key annotation", () => {
      // table has 2 static columns and 2 foreign keys. This test makes sure the feature is turned off from the fk annotation display property on the
      // foreign key from main to the association table. The heuristics should be used when the leaf is the prefill since the annotation is only on the main/association
      // foreign key relationship. This table without this annotation should use the default heuristics
      var table_name = "association_table_w_false_fk_annotation";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(4);
      });

      it("should have no bulk create object when prefill object is defined from main", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['NvKXuH8GeUwW2m-3CM_H8w'],
          keys: {main_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        // Display annotation on table is set to false to turn off this feature
        expect(reference.bulkCreateForeignKeyObject).toBeNull();
      });

      it("should have proper values for bulk create object when prefill object is defined from leaf", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['2GOdAoWJvLB7VTnFREZqtQ'],
          keys: {leaf_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).not.toBeNull();
        // when the leaf table is prefilled, the main table is used as the bulk create foreign key
        expect(reference.bulkCreateForeignKeyObject.leafColumn.name).toBe('NvKXuH8GeUwW2m-3CM_H8w');
        expect(reference.bulkCreateForeignKeyObject.isUnique).toBeTruthy();

        var andFilters = [{
          source: 'id', // since 'id' is the key for main
          hidden: true,
          not_null: true
        }];
        expect(reference.bulkCreateForeignKeyObject.andFiltersForLeaf()).toEqual(andFilters)

        var disabledFilter = [{
          source: [
              { 'inbound': ['bulk_create_foreign_keys', 'false_fk_annotation_to_main_fkey' ]},
              { 'outbound':  ['bulk_create_foreign_keys', 'false_fk_annotation_to_leaf_fkey' ]},
              'RID' // since 'RID' is the key for leaf
          ],
          choices: ['1']
        }]
        expect(reference.bulkCreateForeignKeyObject.disabledRowsFilter()).toEqual(disabledFilter);
      });
    });

    // main_table_for_annotations <- association_table_w_false_viz_columns -> leaf_table_for_false_viz_columns
    describe("for association table with false set in display property of visible-columns annotation", () => {
      // table has 2 static columns and 2 foreign keys. This test makes sure the feature is turned off from the visible columns display property on the
      // foreign key from main to the association table. The heuristics should be used when the leaf is the prefill since the annotation is only on the main/association
      // foreign key visible columns entry. This table without this annotation should use the default heuristics
      var table_name = "association_table_w_false_viz_columns";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(4);
      });

      it("should have no bulk create object when prefill object is defined from main", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['7M6yX7JVVFgDOSD4YFaQFQ'],
          keys: {main_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        // Display annotation on table is set to false to turn off this feature
        expect(reference.bulkCreateForeignKeyObject).toBeNull();
      });

      it("should have proper values for bulk create object when prefill object is defined from leaf", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['H_nF4WYUuNcgzxXZbzdksg'],
          keys: {leaf_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).not.toBeNull();
        // when the leaf table is prefilled, the main table is used as the bulk create foreign key
        expect(reference.bulkCreateForeignKeyObject.leafColumn.name).toBe('7M6yX7JVVFgDOSD4YFaQFQ');
        expect(reference.bulkCreateForeignKeyObject.isUnique).toBeTruthy();

        var andFilters = [{
          source: 'id', // since 'id' is the key for main
          hidden: true,
          not_null: true
        }];
        expect(reference.bulkCreateForeignKeyObject.andFiltersForLeaf()).toEqual(andFilters)

        var disabledFilter = [{
          source: [
              { 'inbound': ['bulk_create_foreign_keys', 'false_viz_columns_to_main_fkey' ]},
              { 'outbound':  ['bulk_create_foreign_keys', 'false_viz_columns_to_leaf_fkey' ]},
              'RID' // since 'RID' is the key for leaf
          ],
          choices: ['1']
        }]
        expect(reference.bulkCreateForeignKeyObject.disabledRowsFilter()).toEqual(disabledFilter);
      });
    });

    // main_table_for_annotations <- association_table_w_false_fk_annotation_null_viz_columns -> leaf_table_for_false_fk_annotation_null_viz_columns
    describe("for association table with false set in foreign key annotation", () => {

      var table_name = "association_table_w_false_fk_annotation_null_viz_columns";

      var uri = `${options.url}/catalog/${catalog_id}/entity/${schema_name}:${table_name}`;

      var reference;

      beforeAll((done) => {
        options.ermRest.resolve(uri, { cid: "test" }).then((response) => {
          reference = response.contextualize.entryCreate;

          done();
        }, (err) => {
          console.dir(err);
          done.fail();
        }).catch((err) => {
          console.dir(err);
          done.fail();
        });
      });

      it("should have the expected columns for entry create context", () => {
        expect(reference.columns.length).toBe(4);
      });

      it("should have proper values for bulk create object when prefill object is defined from leaf", () => {
        // there are other keys for this object but only these 2 keys are used by ermrestJS
        var prefillObject = {
          fkColumnNames: ['qh2Dx9p6jXLs6f3tZUvnaA'],
          keys: {main_fk_col: '1'}
        }

        reference._bulkCreateForeignKeyObject = undefined;
        reference.computeBulkCreateForeignKeyObject(prefillObject);

        expect(reference.bulkCreateForeignKeyObject).not.toBeNull();
        // main is prefilled with `null` value in viz columns so should use the heuristics and set leaf_col_fk as the leaf column
        expect(reference.bulkCreateForeignKeyObject.leafColumn.name).toBe('lhr4nudk8SUCGEnefzkkug');
        expect(reference.bulkCreateForeignKeyObject.isUnique).toBeTruthy();

        var andFilters = [{
          source: 'RID', // since 'id' is the key for main
          hidden: true,
          not_null: true
        }];
        expect(reference.bulkCreateForeignKeyObject.andFiltersForLeaf()).toEqual(andFilters)

        var disabledFilter = [{
          source: [
              { 'inbound': ['bulk_create_foreign_keys', 'false_fk_annotation_null_viz_columns_to_leaf_fkey' ]},
              { 'outbound':  ['bulk_create_foreign_keys', 'false_fk_annotation_null_viz_columns_to_main_fkey' ]},
              'id' // since 'id' is the key for main
          ],
          choices: ['1']
        }]
        expect(reference.bulkCreateForeignKeyObject.disabledRowsFilter()).toEqual(disabledFilter);
      });
    });
  });
};
