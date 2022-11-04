const utils = require("../../../utils/utilities.js");

exports.execute = function (options) {

    describe('For determining display name, ', function () {
        var schemaName = "schema_with_underlinespace_without_titlecase",
            schema;

        beforeAll((done) => {
            utils.setCatalogAnnotations(options, {
                "tag:misd.isi.edu,2015:display": {
                    "name_style": {
                        "underline_space": true, // will be used throughout the catalog
                        "title_case": true // will be replaced by the schema
                    }
                }
            }).then(() => {
                schema = options.catalog.schemas.get(schemaName);
                done();
            }).catch((err) => done.fail(err));
        });

        // Test Cases:

        it('schema should use name styles (`underline_space`, `title_case`) that are defined in its display annotations or on catalog.', function () {
            // underline_space comes from the catalog
            expect(schema.displayname.value).toBe("schema with underlinespace without titlecase");
            expect(schema.displayname.unformatted).toBe("schema with underlinespace without titlecase")
            expect(schema.displayname.isHTML).toBe(false);
        });

        it('table should use its own markdown_name that is defind in display annotation.', function () {
            checkTable("table_with_markdownname", "<strong>Table Name</strong>", "Not used Table name", true);
        });

        it('table should use its own name that is defined in display annotation.', function () {
            checkTable("table_with_name", "Table Name", "Table Name", false);
        });

        it('table should use its own name styles (`underline_space`, `title_case`, `markdown`) that are defined in its display annotation.', function () {
            checkTable("table_with_titlecase", "Table With Titlecase", "Table With Titlecase", false);
            checkTable("table_with_titlecase_without_underlinespace", "Table_With_Titlecase_Without_Underlinespace", "Table_With_Titlecase_Without_Underlinespace", false);
            checkTable("**table with markdown**", "<strong>table with markdown</strong>", "**table with markdown**", true);
        });

        it('table should use schema name styles when `name_style`, `name`, and `markdown_name` are not defined in its display annotation.', function () {
            checkTable("table_without_display_annotation", "table without display annotation", "table without display annotation", false);
        });

        it('column should use its own markdown_name that is defined in display annotation.', function () {
            checkColumn("table_with_markdownname", "column_with_markdownname", "<em>Column name</em>", "_Column name_", true);
            checkColumn("**table with markdown**", "column_with_markdownname", "<em>Column name</em>", "_Column name_", true);
            checkColumn("table_with_name", "column_with_markdownname", "<em>Column name</em>", "_Column name_", true);
            checkColumn("table_with_titlecase", "column_with_markdownname", "<em>Column name</em>", "_Column name_", true);
            checkColumn("table_without_display_annotation", "column_with_markdownname", "<em>Column name</em>", "_Column name_", true);
        });

        it('column should use its own name that is defined in display annotation.', function () {
            checkColumn("table_with_name", "column_with_name", "Column Name", "Column Name", false);
            checkColumn("table_with_titlecase", "column_with_name_2", "Column Name 2", "Column Name 2", false);
            checkColumn("table_without_display_annotation", "column_with_name_3", "Column Name 3", "Column Name 3", false);
            checkColumn("**table with markdown**", "column_with_name", "Column Name", "Column Name", false);
        });

        it('column should use its own name styles (`underline_space`, `title_case`, `markdown`) that are defined in its display annotation.', function () {
            checkColumn("table_with_name", "column_with_titlecase", "Column With Titlecase", "Column With Titlecase", false);
            checkColumn("table_with_titlecase_without_underlinespace", "column_with_underlinespace_without_titlecase", "column with underlinespace without titlecase", "column with underlinespace without titlecase", false);
            checkColumn("table_with_markdownname", "**column with markdown**", "<strong>column with markdown</strong>", "**column with markdown**", true);
            checkColumn("**table with markdown**", "**column without markdown**", "**Column Without Markdown**", "**Column Without Markdown**", false);
        });

        it('column should use table name styles when `name_style`, `name`, and `markdown_name` are not defined in its display annotation.', function () {
            checkColumn("table_with_titlecase_without_underlinespace", "column_without_display_annotation", "Column_Without_Display_Annotation", "Column_Without_Display_Annotation", false);
            checkColumn("table_with_titlecase", "column_without_display_annotation_3", "Column Without Display Annotation 3", "Column Without Display Annotation 3", false);
            checkColumn("**table with markdown**", "**Column Without Display Annotation**", "<strong>Column Without Display Annotation</strong>", "**Column Without Display Annotation**", true);
        });

        it("column should use schema name styles when `name_style` , `name`, and `markdown_name` are not defined in its display annotation nor table's display annotation.", function () {
            checkColumn("table_without_display_annotation", "column_without_display_annotation_2", "column without display annotation 2", "column without display annotation 2", false);
        });

        describe("regarding system columns,", function () {
          it ("if display annotation is defined on the column, should be honored.", function () {
              checkColumn("table_with_titlecase", "RID", "<em>RID</em>", "_RID_", true);
              checkColumn("table_with_titlecase", "RCT", "Created Time", "Created Time", false);
              checkColumn("table_with_titlecase", "RMT", "Rmt", "Rmt", false);
          });

          it ("otherwise should not honor parent display settings and return the database name.", function () {
              checkColumn("table_with_titlecase_without_underlinespace", "RID", "RID", "RID", false);
              checkColumn("table_with_titlecase_without_underlinespace", "RCT", "RCT", "RCT", false);
              checkColumn("table_with_titlecase_without_underlinespace", "RMT", "RMT", "RMT", false);
              checkColumn("table_with_titlecase_without_underlinespace", "RCB", "RCB", "RCB", false);
              checkColumn("table_with_titlecase_without_underlinespace", "RMB", "RMB", "RMB", false);
          });
        });

        afterAll((done) => {
            // removed the catalog annotation
            utils.setCatalogAnnotations(options, {}).then(() => {
                done();
            }).catch((err) => done.fail(err));
        });

        // Helpers:

        function checkTable(tableName, expectedValue, expectedUnformatted, expectedHTML) {
            expect(schema.tables.get(tableName).displayname.value).toBe(expectedValue);
            expect(schema.tables.get(tableName).displayname.unformatted).toBe(expectedUnformatted);
            expect(schema.tables.get(tableName).displayname.isHTML).toBe(expectedHTML);
        }

        function checkColumn(tableName, columnName, expectedValue, expectedUnformatted, expectedHTML) {
            expect(schema.tables.get(tableName).columns.get(columnName).displayname.value).toBe(expectedValue);
            expect(schema.tables.get(tableName).columns.get(columnName).displayname.unformatted).toBe(expectedUnformatted);
            expect(schema.tables.get(tableName).columns.get(columnName).displayname.isHTML).toBe(expectedHTML);
        }
    });
};
