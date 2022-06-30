exports.execute = function (options) {

    describe("For determining references are contextualized properly, ", function () {
        var catalogId = process.env.DEFAULT_CATALOG,
            schemaName = "reference_schema",
            tableName = "reference_table",
            reference;

        var baseUri = options.url + "/catalog/" + catalogId + "/entity/"
            + schemaName + ":" + tableName;

        beforeAll(function(done) {
            options.ermRest.resolve(baseUri, {cid: "test"}).then(function (response) {
                reference = response;
                done();
            }, function (err) {
                console.dir(err);
                done.fail();
            });
        });

        function extraExpectations(ref) {
            // Make sure prototype is available
            expect(ref.uri).toBeDefined();
            expect(ref.columns).toBeDefined();
            expect(ref.read).toBeDefined();

            // The new reference should be different from the original (a deep copy)
            expect(ref).not.toBe(reference);

            // Some values should be the same as the original
            expect(ref.uri).toBe(reference.uri);
            expect(ref._location.service).toBe(reference._location.service);
            expect(ref._table).toBe(reference._table);
        }

        // Test Cases:

        it("contextualize should return a new 'compact' reference object.", function() {
            var compactRef = reference.contextualize.compact;
            expect(compactRef._context).toBe("compact");

            extraExpectations(compactRef);
        });

        it("contextualize should return a new 'compact/brief' reference object.", function() {
            var compactBriefRef = reference.contextualize.compactBrief;
            expect(compactBriefRef._context).toBe("compact/brief");

            extraExpectations(compactBriefRef);
        });

        it("contextualize should return a new 'detailed' reference object.", function() {
            var detailedRef = reference.contextualize.detailed;
            expect(detailedRef._context).toBe("detailed");

            extraExpectations(detailedRef);
        });

        it("contextualize should return a new 'entry' reference object.", function() {
            var entryRef = reference.contextualize.entry;
            expect(entryRef._context).toBe("entry");

            extraExpectations(entryRef);
        });

        it("contextualize should return a new 'entry/create' reference object.", function() {
            var entryCreateRef = reference.contextualize.entryCreate;
            expect(entryCreateRef._context).toBe("entry/create");

            extraExpectations(entryCreateRef);
        });

        it("contextualize should return a new 'entry/edit' reference object.", function() {
            var entryEditRef = reference.contextualize.entryEdit;
            expect(entryEditRef._context).toBe("entry/edit");

            extraExpectations(entryEditRef);
        });

        it("contextualize should return a new 'compact/select' reference object.", function() {
            var compactSelect = reference.contextualize.compactSelect;
            expect(compactSelect._context).toBe("compact/select");

            extraExpectations(compactSelect);
        });

        it("contextualize should return a new 'compact/select/association' reference object.", function() {
            var compactSelectAssociation = reference.contextualize.compactSelectAssociation;
            expect(compactSelectAssociation._context).toBe("compact/select/association");

            extraExpectations(compactSelectAssociation);
        });

        it("contextualize should return a new 'compact/select/association/link' reference object.", function() {
            var compactSelectAssociationLink = reference.contextualize.compactSelectAssociationLink;
            expect(compactSelectAssociationLink._context).toBe("compact/select/association/link");

            extraExpectations(compactSelectAssociationLink);
        });

        it("contextualize should return a new 'compact/select/association/unlink' reference object.", function() {
            var compactSelectAssociationUnlink = reference.contextualize.compactSelectAssociationUnlink;
            expect(compactSelectAssociationUnlink._context).toBe("compact/select/association/unlink");

            extraExpectations(compactSelectAssociationUnlink);
        });

        it("contextualize should return a new 'compact/select/foreign_key' reference object.", function() {
            var compactSelectFK = reference.contextualize.compactSelectForeignKey;
            expect(compactSelectFK._context).toBe("compact/select/foreign_key");

            extraExpectations(compactSelectFK);
        });

        it("contextualize should return a new 'compact/select/saved_queries' reference object.", function() {
            var compactSelectSQ = reference.contextualize.compactSelectSavedQueries;
            expect(compactSelectSQ._context).toBe("compact/select/saved_queries");

            extraExpectations(compactSelectSQ);
        });

        it("contextualize should return a new 'compact/select/show_more' reference object.", function() {
            var compactSelectSM = reference.contextualize.compactSelectShowMore;
            expect(compactSelectSM._context).toBe("compact/select/show_more");

            extraExpectations(compactSelectSM);
        });

        it("contextualize should return a new 'filter' reference object.", function() {
            expect(reference.contextualize.filter).toBeUndefined();
        });

        it("contextualize should return a new 'row_name' reference object.", function() {
            expect(reference.contextualize.rowName).toBeUndefined();
        });

        it("contextualize should return a new '*' reference object.", function() {
            expect(reference.contextualize.default).toBeUndefined();
        });
    });
};
