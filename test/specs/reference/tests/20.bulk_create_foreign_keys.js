const utils = require("../../../utils/utilities.js");

exports.execute = (options) =>{

  describe("bulk foreign key APIs for recordedit with prefill", () => {

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
          keys: {main_fkey_col: '1'}
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
          keys: {main_fkey_col: '1'}
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
          keys: {main_fkey_col: '1'}
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
          keys: {main_fkey_col: '1'}
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
};
