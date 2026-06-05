const utils = require('../../../utils/utilities.js');

exports.execute = function (options) {

  describe('For determining the visible_cell_height display annotation, ', function () {
    var catalogId;

    /**
     * returns display.visibleCellHeight of the given column on the table's reference
     * in the given context.
     */
    var fetchVisibleCellHeight = function (schemaName, tableName, columnName, context, done, cb) {
      var uri = options.url + '/catalog/' + catalogId + '/entity/' + schemaName + ':' + tableName;
      options.ermRest.resolve(uri, { cid: 'test' }).then(function (reference) {
        var cols = reference.contextualize[context].columns.filter(function (col) {
          return col.name === columnName;
        });
        expect(cols.length).toBe(1, 'could not find column `' + columnName + '`');
        cb(cols[0].display.visibleCellHeight);
        done();
      }).catch(function (err) {
        done.fail(err);
      });
    };

    beforeAll(function () {
      catalogId = process.env.DEFAULT_CATALOG;
    });

    describe('regarding the default behavior, ', function () {
      it('should return a falsy value when the annotation is not defined on any level.', function (done) {
        fetchVisibleCellHeight('common_schema_1', 'table_1_schema_1', 'table_1_key', 'detailed', done, function (val) {
          expect(val).toBeFalsy();
        });
      });
    });

    describe('regarding the annotation hierarchy, ', function () {
      beforeAll(function (done) {
        // catalog-level annotation. removed in afterAll
        utils.setCatalogAnnotations(options, {
          'tag:misd.isi.edu,2015:display': {
            'visible_cell_height': { 'detailed': 1000 }
          }
        }).then(function () {
          done();
        }).catch(function (err) {
          done.fail(err);
        });
      });

      it('should honor the annotation defined on the catalog level.', function (done) {
        fetchVisibleCellHeight('common_schema_1', 'table_1_schema_1', 'table_1_key', 'detailed', done, function (val) {
          expect(val).toBe(1000);
        });
      });

      it('should honor the annotation defined on the schema level and ignore the catalog.', function (done) {
        fetchVisibleCellHeight('common_schema_2', 'table_w_defaults', 'key', 'detailed', done, function (val) {
          expect(val).toBe(800);
        });
      });

      it('should honor the annotation defined on the table level and ignore the schema.', function (done) {
        fetchVisibleCellHeight('common_schema_2', 'table_1_schema_2', 'table_1_date', 'detailed', done, function (val) {
          expect(val).toBe(2000);
        });
      });

      it('should honor the context defined in the annotation.', function (done) {
        fetchVisibleCellHeight('common_schema_2', 'table_1_schema_2', 'table_1_date', 'compact', done, function (val) {
          expect(val).toBe(500);
        });
      });

      it('should honor the annotation defined on the column level and ignore the table.', function (done) {
        fetchVisibleCellHeight('common_schema_2', 'table_1_schema_2', 'table_1_text', 'detailed', done, function (val) {
          expect(val).toBe(300);
        });
      });

      it('should return `false` when the column-level annotation disables the feature.', function (done) {
        fetchVisibleCellHeight('common_schema_2', 'table_1_schema_2', 'table_1_longtext', 'detailed', done, function (val) {
          expect(val).toBe(false);
        });
      });

      it('should ignore invalid values even when a parent level defines a valid one.', function (done) {
        fetchVisibleCellHeight('common_schema_2', 'table_1_schema_2', 'table_1_markdown', 'detailed', done, function (val) {
          expect(val).toBeFalsy();
        });
      });

      afterAll(function (done) {
        // remove the catalog annotation
        utils.setCatalogAnnotations(options, {}).then(function () {
          done();
        }).catch(function (err) {
          done.fail(err);
        });
      });
    });
  });
};
