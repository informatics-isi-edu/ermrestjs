exports.execute = (options) => {
  describe('the fast filter source feature,', () => {

    var chaiseURL = "https://dev.isrd.isi.edu/chaise",
      recordURL = chaiseURL + "/record",
      record2URL = chaiseURL + "/record-two",
      viewerURL = chaiseURL + "/viewer",
      searchURL = chaiseURL + "/search",
      recordsetURL = chaiseURL + "/recordset";
    var appLinkFn = (tag, location) => {
      var url;
      switch (tag) {
        case "tag:isrd.isi.edu,2016:chaise:record":
          url = recordURL;
          break;
        case "tag:isrd.isi.edu,2016:chaise:record-two":
          url = record2URL;
          break;
        case "tag:isrd.isi.edu,2016:chaise:viewer":
          url = viewerURL;
          break;
        case "tag:isrd.isi.edu,2016:chaise:search":
          url = searchURL;
          break;
        case "tag:isrd.isi.edu,2016:chaise:recordset":
          url = recordsetURL;
          break;
        default:
          url = recordURL;
          break;
      }

      url = url + "/" + location.path;

      return url;
    };

    const catalog_id = process.env.DEFAULT_CATALOG,
      schemaName = 'fast_filter_schema', mainTableName = 'main';

    const resolveURL = (tableName, facets) => {
      let uri = options.url + "/catalog/" + catalog_id + "/entity/" + schemaName + ":" + tableName;
      if (facets) {
        uri += "/*::facets::" + options.ermRest.encodeFacet(facets);
      }
      return options.ermRest.resolve(uri, { cid: 'test' });
    };

    const testFastFilterObject = (obj, expectedProps) => {
      for (const k in expectedProps) {
        expect(obj[k]).toEqual(expectedProps[k], `missmatch for ${k}`);
      }
    }

    let schemaObj;
    beforeAll(() => {
      options.ermRest.appLinkFn(appLinkFn);
      schemaObj = options.catalog.schemas.get(schemaName);
    });

    describe('Table.aggressiveFacetLookup, ', () => {
      it('should return `false` for tables without it.', () => {
        expect(schemaObj.tables.get('table_wo_aggressive_facet_lookup').aggressiveFacetLookup).toBe(false);

        expect(schemaObj.tables.get('table_wo_aggressive_facet_lookup_2').aggressiveFacetLookup).toBe(false);
      });

      it('should return `true` for tables with it.', () => {
        expect(schemaObj.tables.get(mainTableName).aggressiveFacetLookup).toBe(true);
      });
    });

    describe('FacetColumn.fastFilterSourceObjectWrapper, ', () => {
      let facetRef;
      beforeAll((done) => {
        resolveURL(mainTableName).then((ref) => {
          facetRef = ref.contextualize.compact;
          done();
        }).catch((err) => done.fail(err));
      });

      it('should return `null` for facets without the fast filter.', () => {
        expect(facetRef.facetColumns[0].fastFilterSourceObjectWrapper).toBeFalsy();
      });

      it('should return `null` for facets with invalid fast filter.', () => {
        expect(facetRef.facetColumns[1].fastFilterSourceObjectWrapper).toBeFalsy();
      });

      describe('should return the defined fast filter.', () => {
        it('local column', () => {
          const obj = facetRef.facetColumns[2].fastFilterSourceObjectWrapper;
          expect(obj).not.toBe(null);
          testFastFilterObject(obj, { name: 'main_o1_fast_col' });
        });

        it('with path', () => {
          const obj = facetRef.facetColumns[3].fastFilterSourceObjectWrapper;
          expect(obj).not.toBe(null);
          testFastFilterObject(obj, { name: 'hIQDFjXIxGOUukupEpe8CQ', hasPath: true, foreignKeyPathLength: 2, hasInbound: false, isFiltered: false });
        });

        it('using path prefix', () => {
          const obj = facetRef.facetColumns[4].fastFilterSourceObjectWrapper;
          expect(obj).not.toBe(null);
          testFastFilterObject(obj, { name: 'rGaQ3D01_8VAOtWtb2_vrQ', hasPath: true, foreignKeyPathLength: 2, hasInbound: true, isFiltered: false });
        });

        it('using filter in source', () => {
          const obj = facetRef.facetColumns[5].fastFilterSourceObjectWrapper;
          expect(obj).not.toBe(null);
          testFastFilterObject(obj, { name: 'zxrkW0Tu0pkaTmzJ0RPuIg', hasPath: true, foreignKeyPathLength: 2, hasInbound: true, isFiltered: true });
        });
      });
    });

    describe('Reference related APIs, ', () => {
      it('should ignore the fast filter for tables that disable it.', (done) => {
        const facetObj = {
          "and": [{
            "source": [
              { "outbound": ["fast_filter_schema", "table_wo_aggressive_facet_lookup_fk1"] },
              "RID"
            ],
            "choices": ["1"]
          }]
        };
        resolveURL('table_wo_aggressive_facet_lookup', facetObj).then((res) => {
          const ref = res.contextualize.compact;
          expect(ref.readPath).toEqual([
            'M:=fast_filter_schema:table_wo_aggressive_facet_lookup',
            '(fk_to_main)=(fast_filter_schema:main:id)/RID=1/$M',
            'F1:=left(fk_to_main)=(fast_filter_schema:main:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)'
          ].join('/'));
          done();
        }).catch((err) => done.fail(err));
      });

      it('should ignore the invalid fast filters.', (done) => {
        const facetObj = {
          'and': [{
            "source": [
              { "outbound": ["fast_filter_schema", "main_fk1"] },
              "RID"
            ],
            "choices": ["2"]
          }]
        };
        resolveURL('main', facetObj).then((res) => {
          const ref = res.contextualize.compact;
          expect(ref.readPath).toEqual([
            'M:=fast_filter_schema:main',
            '(fk_to_main_o1)=(fast_filter_schema:main_o1:id)/RID=2/$M',
            'F1:=left(fk_to_main_o1)=(fast_filter_schema:main_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)'
          ].join('/'));
          done();
        }).catch((err) => done.fail(err));
      });

      describe('should honor the given fast filter, ', () => {
        const facetObjWFastFilters = {
          'and': [
            {
              "source": "id",
              "choices": ["1", "2", "3", "4", "5"]
            },
            {
              "source": [{ "outbound": ["fast_filter_schema", "main_fk1"] }, "RID"],
              "choices": ["1", "2", "3", "4", "5"]
            },
            {
              "source": [{ "outbound": ["fast_filter_schema", "main_fk1"] }, "col"],
              "choices": ["1", "2", "3", "4"]
            },
            {
              "source": [
                { "outbound": ["fast_filter_schema", "main_fk1"] },
                { "outbound": ["fast_filter_schema", "main_o1_fk1"] },
                { "outbound": ["fast_filter_schema", "main_o1_o1_fk1"] },
                "RID"
              ],
              "choices": ["1", "2", "3"]
            },
            {
              "sourcekey": "facet_with_fast_filter_shared_prefix",
              "choices": ["1", "2", "3"]
            },
            {
              "source": [
                { "sourcekey": "path_to_main_o1_RID" },
                { "inbound": ["fast_filter_schema", "main_o1_i2_fk1"] },
                "RID"
              ],
              "choices": ["1"]
            }
          ]
        };

        const expectedCompactPath = [
          'M:=fast_filter_schema:main/id=any(1,2,3,4,5)/$M',
          '(fk_to_main_o1)=(fast_filter_schema:main_o1:id)/RID=any(1,2,3,4,5)/$M',
          'main_o1_fast_col=any(1,2,3,4)/$M',
          '(fk_to_main_o1)=(fast_filter_schema:main_o1:id)/(fk_to_main_o1_o1)=(fast_filter_schema:main_o1_o1:id)/other_col=any(1,2,3)/$M',
          'M_P1:=(fk_to_main_o1)=(fast_filter_schema:main_o1:id)/(id)=(fast_filter_schema:main_o1_i2:fk_to_main_o1)/id=any(1,2,3)/$M',
          '$M_P1/id::gt::2/(id)=(fast_filter_schema:main_o1_i2:fk_to_main_o1)/id=1/$M'
        ].join('/');

        const testReadAndReadPath = (context) => {
          let ref;
          beforeAll((done) => {
            resolveURL(mainTableName, facetObjWFastFilters).then((response) => {
              ref = response.contextualize[context];
              done();
            }).catch((err) => done.fail(err));
          });

          it('ermrestCompactPath should properly use the fast_filter', () => {
            expect(ref.location.ermrestCompactPath).toEqual(expectedCompactPath);
          });

          it('readPath should properly use the fast_filter', () => {
            expect(ref.readPath).toEqual(`${expectedCompactPath}/RID;M:=array_d(M:*),F1:=array_d(M_P1:*)@sort(RID)`);
          });

          // NOTE this is just making sure we're not throwing any errors
          it('read should work properly', () => {
            ref.read(25).then(function (page) {
              expect(page.length).toBe(0, "page length missmatch");
              done();
            }).catch(function (err) {
              done.fail(err);
            });
          });

          describe('facet sourceReference', () => {
            let sourceRef;
            beforeAll(() => sourceRef = ref.facetColumns[4].sourceReference);

            it('should return the proper readPath.', () => {
              // we should use fast_filter_source for parsing the facets on main table
              // but the path from the main to the current facetColumn should not use the fast_filter.
              expect(sourceRef.readPath).toEqual([
                'T:=fast_filter_schema:main',
                'id=any(1,2,3,4,5)/$T',
                '(fk_to_main_o1)=(fast_filter_schema:main_o1:id)/RID=any(1,2,3,4,5)/$T',
                'main_o1_fast_col=any(1,2,3,4)/$T',
                '(fk_to_main_o1)=(fast_filter_schema:main_o1:id)',
                '(fk_to_main_o1_o1)=(fast_filter_schema:main_o1_o1:id)/other_col=any(1,2,3)/$T',
                'T_P1:=(fk_to_main_o1)=(fast_filter_schema:main_o1:id)/id::gt::2',
                '(id)=(fast_filter_schema:main_o1_i2:fk_to_main_o1)/id=1/$T',
                '$T_P1/M:=(id)=(fast_filter_schema:main_o1_i1:fk_to_main_o1)',
                'F1:=left(fk_to_main_o1)=(fast_filter_schema:main_o1:id)/$M/RID;M:=array_d(M:*),F1:=array_d(F1:*)@sort(RID)'
              ].join('/'));
            });

            it('read should work properly.', () => {
              // NOTE this is just making sure we're not throwing any errors
              sourceRef.read(25).then(function (page) {
                expect(page.length).toBe(0, "page length missmatch");

                done();
              }).catch(function (err) {
                done.fail(err);
              });
            })
          })

        };

        describe('in compact context', () => {
          testReadAndReadPath('compact');
        });

        describe('in detailed context', () => {
          testReadAndReadPath('detailed');
        });

        describe('in entry contexts', () => {
          testReadAndReadPath('entryEdit');
        });
      });
    });


  });
}