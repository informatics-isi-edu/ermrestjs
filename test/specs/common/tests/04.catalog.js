exports.execute = (options) => {
    describe('Catalog class', () => {

        describe('snapshot related APIs, ', () => {
            let currSnaptime;

            it ('should be empty for catalogs without snaptime', (done) => {
                options.server.catalogs.get(process.env.DEFAULT_CATALOG).then((catalog) => {
                    expect(catalog.id).toBe(process.env.DEFAULT_CATALOG);
                    expect(catalog.version).not.toBeDefined();
                    expect(catalog.snaptime).toBeDefined();
                    currSnaptime = catalog.snaptime;

                    done();
                }).catch((err) => {
                    done.fail(err);
                });
            });

            it ('should return the given snaptime', (done) => {
                const usedID = process.env.DEFAULT_CATALOG + '@' + currSnaptime;
                options.server.catalogs.get(usedID).then((catalog) => {
                    expect(catalog.id).toBe(usedID);
                    expect(catalog.version).toBe(currSnaptime);
                    expect(catalog.snaptime).toBe(currSnaptime);
                    done();
                }).catch((err) => {
                    done.fail(err);
                });
            });

            it ('should be corrected if it is inaccurate.', (done) => {
                const snaptime = options.ermRest.HistoryService.datetimeISOToSnapshot(new Date().toISOString());
                const usedID = process.env.DEFAULT_CATALOG + '@' + snaptime;
                options.server.catalogs.get(usedID).then((catalog) => {
                    expect(catalog.id).toBe(process.env.DEFAULT_CATALOG + '@' + currSnaptime);
                    expect(catalog.version).toBe(currSnaptime);
                    expect(catalog.snaptime).toBe(currSnaptime);
                    done();
                }).catch((err) => {
                    done.fail(err);
                });
            });
        });
    });
};