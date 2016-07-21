// Unit Test that are related to annotations should be here

var includes = require('./../../utils/ermrest-init.js').init();

var server = includes.server;
var ermRest = includes.ermRest;
var ermrestUtils = includes.ermrestUtils;

describe('For determining display name, ', function () {
    var catalog_id, schemaName, schema, catalog;

    // This function should be present in all spec files. It will add sample database and configurations.
    beforeAll(function (done) {
        ermrestUtils.importData({
            setup: require('./displayname.conf.json'),
            url: includes.url,
            authCookie: includes.authCookie
        }).then(function (data) {
            catalog_id = data.catalogId;
            schemaName = data.schema.name;
            console.log("Data imported with catalogId " + data.catalogId);
            done();
        }, function (err) {
            console.log("Unable to import data");
            console.dir(err);
            done.fail();
        });
    });

    // Test Cases:

    it('schema should use name styles (`underline_space`, `title_case`) that are defined in its display annotations.', function (done) {
        server.catalogs.get(catalog_id).then(function (response) {
            schema = response.schemas.get(schemaName);
            expect(schema.displayname).toBe("schema with underlinespace without titlecase");
            done();
        }, function (err) {
            console.dir(err);
            done.fail();
        });
    });

    it('table should use its own name that is defined in display annotation.', function () {
        expect(schema.tables.get("table_with_name").displayname).toBe("Table Name");
    });

    it('table should use its own name styles (`underline_space`, `title_case`) that are defined in its display annotation.', function () {
        expect(schema.tables.get("table_with_titlecase").displayname).toBe("Table With Titlecase");
        expect(schema.tables.get("table_with_titlecase_without_underlinespace").displayname).toBe("Table_With_Titlecase_Without_Underlinespace");
    });

    it('table should use schema name styles when `name_style` and `name` are not defined in its display annotation.', function () {
        expect(schema.tables.get("table_without_display_annotation").displayname).toBe("table without display annotation");
    });

    it('column should use its own name that is defined in display annotation.', function () {
        expect(schema.tables.get("table_with_name").columns.get("column_with_name").displayname).toBe("Column Name");
        expect(schema.tables.get("table_with_titlecase").columns.get("column_with_name_2").displayname).toBe("Column Name 2");
        expect(schema.tables.get("table_without_display_annotation").columns.get("column_with_name_3").displayname).toBe("Column Name 3");
    });

    it('column should use its own name styles (`underline_space`, `title_case`) that are defined in its display annotation.', function () {
        var col = schema.tables.get("table_with_name").columns.get("column_with_titlecase");
        expect(col.displayname).toBe("Column With Titlecase");
        col = schema.tables.get("table_with_titlecase_without_underlinespace").columns.get("column_with_underlinespace_without_titlecase");
        expect(col.displayname).toBe("column with underlinespace without titlecase");
    });

    it('column should use table name styles when `name_style` and `name` are not defined in its display annotation.', function () {
        var col = schema.tables.get("table_with_titlecase_without_underlinespace").columns.get("column_without_display_annotation");
        expect(col.displayname).toBe("Column_Without_Display_Annotation");
        col = schema.tables.get("table_with_titlecase").columns.get("column_without_display_annotation_3");
        expect(col.displayname).toBe("Column Without Display Annotation 3");
    });

    it("column should use schema name styles when `name_style` and `name` are not defined in its display annotation nor table's display annotation.", function () {
        var col = schema.tables.get("table_without_display_annotation").columns.get("column_without_display_annotation_2");
        expect(col.displayname).toBe("column without display annotation 2");
    });


    // This function should be present in all spec files. It will remove the newly created catalog
    afterAll(function (done) {
        ermrestUtils.tear({
            setup: require('./displayname.conf.json'),
            catalogId: catalog_id,
            url: includes.url,
            authCookie: includes.authCookie
        }).then(function (data) {
            done();
        }, function (err) {
            console.log("Unable to import data");
            console.dir(err);
            done.fail();
        });
    })
});
