const { appLinkFn, resolveURL } = require('./../../../utils/utilities');

/**
 * structure:
 *
 * 0: id [0]
 * 1: Group 1 (path_to_outbound1) [1]
 * 2: col1 [2]
 * 3: Group 2 (path_to_assoc_related_1, path_to_assoc_related1_outbound1, col4) [3,4,5]
 * 4: Group3 (col5, col6) [6,7]
 * 5: col2 [8]
 * 6: col3 [9]
 *
 */

exports.execute = (options) => {
  const SCHEMA_NAME = 'facet_group_schema';

  let mainRef, mainRefWPreFacets, mainStructure, mainRefWAddedFacets;

  const testMainRefFacetStructure = (ref) => {
    expect(ref.facetColumnsStructure.length).toBe(7);
    expect(
      ref.facetColumnsStructure.map((item) => {
        return typeof item === 'number' ? item : 'group';
      }),
    ).toEqual([0, 'group', 2, 'group', 'group', 8, 9]);

    expect(ref.facetColumns.length).toBe(10);
    expect(
      ref.facetColumns.map(function (fc) {
        return fc._column.name;
      }),
    ).toEqual(['id', 'outbound1_id', 'col1', 'assoc_related1_id', 'assoc_related1_outbound1_id', 'col4', 'col5', 'col6', 'col2', 'col3']);
  };

  beforeAll((done) => {
    options.ermRest.appLinkFn(appLinkFn);

    resolveURL(options, SCHEMA_NAME, 'main')
      .then((reference) => {
        mainRef = reference;
        done();
      })
      .catch((err) => done.fail(err));
  });

  describe('Facet Grouping', () => {
    describe('reference.facetColumnsStructure', () => {
      it("should not have any groups, if there aren't any in annotation", (done) => {
        let reference;
        resolveURL(options, SCHEMA_NAME, 'main_no_group')
          .then((ref) => {
            reference = ref;
            return reference.generateFacetColumns();
          })
          .then(() => {
            expect(reference.facetColumnsStructure).toEqual([0, 1, 2]);
            expect(reference.facetColumns.length).toBe(3);
            done();
          })
          .catch((err) => {
            done.fail(err);
          });
      });

      it('should skip invalid groups in annotation', (done) => {
        let reference;
        resolveURL(options, SCHEMA_NAME, 'main_invalid_groups')
          .then((ref) => {
            reference = ref;
            return reference.generateFacetColumns();
          })
          .then(() => {
            expect(reference.facetColumnsStructure).toEqual([0]);
            expect(reference.facetColumns.length).toBe(1);
            done();
          })
          .catch((err) => done.fail(err));
      });

      it('should create facet groups based on annotation (and skip duplicate groups)', (done) => {
        // using generateFacetColumns because that's what chaise is using.
        mainRef
          .generateFacetColumns()
          .then(() => {
            mainStructure = mainRef.facetColumnsStructure;
            testMainRefFacetStructure(mainRef);
            done();
          })
          .catch((err) => done.fail(err));
      });

      it('should handle filters in the url', (done) => {
        const facetObject = {
          and: [
            { source: 'col1', choices: ['10'] },
            { sourcekey: 'path_to_outbound1', choices: ['5'] },
            { source: 'col6', choices: ['9'] },
            { sourcekey: 'path_to_assoc_related_1', choices: ['3'] },
          ],
        };
        let ref;
        resolveURL(options, SCHEMA_NAME, 'main', facetObject)
          .then((r) => {
            ref = r;
            return ref.generateFacetColumns();
          })
          .then((res) => {
            expect(res.issues).toBeNull();
            expect(res.facetColumnsStructure.length).toBe(7);
            testMainRefFacetStructure(ref);

            expect(ref.location.facets).toBeDefined('facets is undefined.');
            expect(ref.location.ermrestCompactPath).toBe(
              [
                'M:=facet_group_schema:main/(id)=(facet_group_schema:outbound1:outbound1_id)/outbound1_id=5/$M',
                'col1=10/$M',
                '(id)=(facet_group_schema:assoc_1:fk_to_main)/(fk_to_assoc_related1)=(facet_group_schema:assoc_related1:assoc_related1_id)/assoc_related1_id=3/$M',
                'col6=9/$M',
              ].join('/'),
            );

            expect(ref.facetColumns[1].choiceFilters.map((cf) => cf.term)).toEqual(['5']);
            expect(ref.facetColumns[2].choiceFilters.map((cf) => cf.term)).toEqual(['10']);
            expect(ref.facetColumns[3].choiceFilters.map((cf) => cf.term)).toEqual(['3']);
            expect(ref.facetColumns[7].choiceFilters.map((cf) => cf.term)).toEqual(['9']);

            mainRefWAddedFacets = ref;

            done();
          })
          .catch((err) => done.fail(err));
      });

      describe('preselected facets inside groups', () => {
        it('should work properly', (done) => {
          resolveURL(options, SCHEMA_NAME, 'main_preselected_facets')
            .then((ref) => {
              mainRefWPreFacets = ref;
              return mainRefWPreFacets.generateFacetColumns();
            })
            .then((res) => {
              expect(res.issues).toBeNull();
              expect(res.facetColumns.length).toBe(2);
              expect(res.facetColumnsStructure.length).toBe(1);

              expect(mainRefWPreFacets.facetColumns.map((fc) => fc._column.name)).toEqual(['outbound1_id', 'id']);
              expect(mainRefWPreFacets.facetColumns[0].choiceFilters.map((cf) => cf.term)).toEqual(['1', '3']);

              expect(mainRefWPreFacets.facetColumnsStructure.length).toBe(1);
              const group = mainRefWPreFacets.facetColumnsStructure[0];
              expect(group.children).toEqual([0, 1]);

              expect(mainRefWPreFacets.location.facets).toBeDefined('facets is undefined.');
              expect(mainRefWPreFacets.location.ermrestCompactPath).toBe(
                'M:=facet_group_schema:main_preselected_facets/(fk_to_outbound1)=(facet_group_schema:outbound1:outbound1_id)/outbound1_id=any(1,3)/$M',
                'path missmatch.',
              );

              done();
            })
            .catch((err) => done.fail(err));
        });

        it('should handle filters in the url', (done) => {
          const facetObj = {
            and: [
              { source: 'col1', choices: ['10'] },
              { sourcekey: 'path_to_outbound1', choices: ['5'] },
            ],
          };
          let reference;
          resolveURL(options, SCHEMA_NAME, 'main_preselected_facets', facetObj)
            .then((ref) => {
              reference = ref;
              return reference.generateFacetColumns();
            })
            .then((res) => {
              expect(res.issues).toBeNull();
              expect(res.facetColumns.length).toBe(3);
              expect(res.facetColumnsStructure.length).toBe(2);

              expect(reference.facetColumns.map((fc) => fc._column.name)).toEqual(['outbound1_id', 'id', 'col1']);
              expect(reference.facetColumns[0].choiceFilters.map((cf) => cf.term)).toEqual(['5']);
              expect(reference.facetColumns[2].choiceFilters.map((cf) => cf.term)).toEqual(['10']);

              expect(reference.facetColumnsStructure.length).toBe(2);
              const structure = reference.facetColumnsStructure;
              expect(structure[0].children).toEqual([0, 1]);
              expect(structure[1]).toBe(2);

              expect(reference.location.facets).toBeDefined('facets is undefined.');
              expect(reference.location.ermrestCompactPath).toBe(
                'M:=facet_group_schema:main_preselected_facets/(fk_to_outbound1)=(facet_group_schema:outbound1:outbound1_id)/outbound1_id=5/$M/col1=10/$M',
                'path missmatch.',
              );

              done();
            })
            .catch((err) => done.fail(err));
        });
      });
    });

    describe('FacetGroup APIs', () => {
      describe('.isOpen', () => {
        it('should return whats defined in the annotation', () => {
          expect(mainStructure[3].isOpen).toBe(false);
        });

        it('if there are preselected facets inside the group, it should return true', () => {
          expect(mainRefWPreFacets.facetColumnsStructure[0].isOpen).toBe(true);
        });

        it('should return true by default', () => {
          expect(mainStructure[1].isOpen).toBe(true);
          expect(mainStructure[4].isOpen).toBe(true);
        });
      });

      it('.children should return an array of numbers', () => {
        expect(mainStructure[1].children).toEqual([1]);
        expect(mainStructure[3].children).toEqual([3, 4, 5]);
        expect(mainStructure[4].children).toEqual([6, 7]);
      });

      it('.structureIndex should return the index of the group in reference.facetColumnsStructure', () => {
        expect(mainStructure[1].structureIndex).toBe(1);
        expect(mainStructure[3].structureIndex).toBe(3);
        expect(mainStructure[4].structureIndex).toBe(4);
      });

      it('.displayname should return the displayname object for the group', () => {
        expect(mainStructure[1].displayname).toEqual({
          isHTML: true,
          value: 'Group 1',
          unformatted: 'Group 1',
        });

        expect(mainStructure[3].displayname).toEqual({
          isHTML: true,
          value: '<strong>Group 2</strong>',
          unformatted: '**Group 2**',
        });

        expect(mainStructure[4].displayname).toEqual({
          isHTML: true,
          value: 'Group 3',
          unformatted: 'Group 3',
        });
      });

      it('.comment should return the comment for the group', () => {
        expect(mainStructure[1].comment).toEqual(null);
        expect(mainStructure[3].comment.value).toEqual('<p>comment for <strong>group 2</strong>!</p>\n');
        expect(mainStructure[4].comment.value).toEqual('');
      });
    });

    describe('FacetColumn APIs', () => {
      it('isOpen should follow facet logic and ignore group state.', () => {
        // only one facet is marked as open and it has the group closed. but we're still expecting the facet to be open.
        expect(mainRef.facetColumns.map((fc) => fc.isOpen)).toEqual([false, false, false, true, false, false, false, false, false, false]);
      });

      it('FacetColumn.addChoiceFilters should work proplerly.', () => {
        // make sure facetColumnsStructure is preserved after adding filters
        const ref = mainRefWAddedFacets.facetColumns[5].addChoiceFilters(['20']);
        testMainRefFacetStructure(ref);
      });
    });

    describe('integration with other APIs', () => {
      it('Reference.removeAllFacetFilters should work proplerly.', () => {
        // make sure facetColumnsStructure is preserved after removing all filters
        const ref = mainRefWAddedFacets.removeAllFacetFilters();
        testMainRefFacetStructure(ref);
      });

      it('Reference.sort should work proplerly.', () => {
        // make sure facetColumnsStructure is preserved after sorting
        const ref = mainRefWAddedFacets.sort([{ column: 'col3', descending: true }]);
        testMainRefFacetStructure(ref);
      });
    });
  });
};
