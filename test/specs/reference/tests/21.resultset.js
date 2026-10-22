const utils = require('../../../utils/utilities.js');

/**
 * The result of create and update (the resultset shown in recordedit):
 * - table_w_resultset defines a resultset list
 * - table_wo_resultset doesn't, and has different entry/create and entry/edit lists
 * - table_w_redirect_cycle has visible-columns contexts that redirect to each other
 */
exports.execute = (options) => {
  describe('the result of create and update,', () => {
    const catalogId = process.env.DEFAULT_CATALOG;
    const schemaName = 'resultset_schema';
    const refFK = 'table_w_resultset_ref_fk';
    const compFK = 'table_w_resultset_comp_fk';
    const woRefFK = 'table_wo_resultset_ref_fk';

    let refOne, refTwo, compOneTwo, compTwoOne;

    const resolve = (tableName, filter) => {
      const uri = `${options.url}/catalog/${catalogId}/entity/${schemaName}:${tableName}${filter ? `/${filter}` : ''}`;
      return options.ermRest.resolve(uri, { cid: 'test' });
    };

    const constraintName = (fkName) => `${schemaName}_${fkName}`;

    // the visible columns (foreign keys are represented by their constraint name)
    const columnNames = (ref) => ref.columns.map((c) => (c.isForeignKey ? c._constraintName : c.name));

    const findFKColumn = (ref, fkName) => ref.columns.find((c) => c.isForeignKey && c._constraintName === constraintName(fkName));

    const getValue = (page, tuple, name) => {
      const index = page.reference.columns.findIndex((c) => (c.isForeignKey ? c._constraintName === constraintName(name) : c.name === name));
      return tuple.values[index];
    };

    const findTuple = (page, id) => page.tuples.find((t) => t.data.id === id);

    beforeAll(() => {
      options.ermRest.appLinkFn(utils.appLinkFn);
      // make sure the heuristics are not affected by the system columns config of other specs
      options.ermRest.systemColumnsHeuristicsMode(() => {});

      refOne = utils.findEntity(options, schemaName, 'ref_table', 'id', 1);
      refTwo = utils.findEntity(options, schemaName, 'ref_table', 'id', 2);
      compOneTwo = options.entities[schemaName].ref_composite.find((r) => r.id_1 === 1 && r.id_2 === 2);
      compTwoOne = options.entities[schemaName].ref_composite.find((r) => r.id_1 === 2 && r.id_2 === 1);
    });

    describe('with a resultset list,', () => {
      let page, refCol;

      beforeAll(async () => {
        const ref = (await resolve('table_w_resultset')).contextualize.entryCreate;
        refCol = findFKColumn(ref, refFK);
        const compCol = findFKColumn(ref, compFK);

        // only ref one is known, so the second row's ref (2) has no matching known row
        const res = await ref.create(
          [
            { id: 10, name: 'ten', ref_id: 1, comp_b: 1, comp_a: 2 },
            { id: 11, name: 'eleven', ref_id: 2, comp_b: 2, comp_a: 1 },
          ],
          undefined,
          false,
          [
            { [refCol.name]: refOne, [compCol.name]: compOneTwo },
            { [refCol.name]: refOne, [compCol.name]: compTwoOne },
          ],
        );
        page = res.successful;
      });

      it('uses the resultset context and list.', () => {
        expect(page.reference.context).toBe('resultset');
        expect(columnNames(page.reference)).toEqual(['name', constraintName(refFK), constraintName(compFK)]);
      });

      it('formats the values in compact/resultset.', () => {
        expect(page.valueContext).toBe('compact/resultset');
        expect(page.skipWaitFor).toBe(true);
        expect(getValue(page, findTuple(page, 10), 'name')).toContain('<strong>ten</strong>');
      });

      it('shows the row name of a matching known row.', () => {
        const tuple = findTuple(page, 10);
        expect(tuple.linkedData[refCol.name]).toBe(refOne);

        const value = getValue(page, tuple, refFK);
        expect(value).toContain(`/${schemaName}:ref_table/RID=${refOne.RID}"`);
        expect(value).toContain('>ref one</a>');
      });

      it('matches composite foreign keys by the key column order.', () => {
        expect(getValue(page, findTuple(page, 10), compFK)).toContain('>one-two</a>');
        expect(getValue(page, findTuple(page, 11), compFK)).toContain('>two-one</a>');
      });

      it('keeps the key when the known row does not match.', () => {
        const tuple = findTuple(page, 11);
        expect(tuple.linkedData[refCol.name]).toEqual({ id: 2 });

        const value = getValue(page, tuple, refFK);
        expect(value).toContain(`/${schemaName}:ref_table/id=2"`);
        expect(value).toContain('>2</a>');
        expect(value).not.toContain('ref one');
      });

      it('shows the keys when there are no known rows.', async () => {
        const ref = (await resolve('table_w_resultset')).contextualize.entryCreate;
        const res = await ref.create([{ id: 12, name: 'twelve', ref_id: 2, comp_b: 1, comp_a: 2 }]);
        const resPage = res.successful;
        const tuple = resPage.tuples[0];

        const refValue = getValue(resPage, tuple, refFK);
        expect(refValue).toContain(`/${schemaName}:ref_table/id=2"`);
        expect(refValue).toContain('>2</a>');

        const compValue = getValue(resPage, tuple, compFK);
        expect(compValue).toContain(`/${schemaName}:ref_composite/id_1=1&id_2=2"`);
        expect(compValue).toContain('>1:2</a>');
      });
    });

    describe('without a resultset list,', () => {
      describe('create', () => {
        let page, formFKCol;

        beforeAll(async () => {
          const ref = (await resolve('table_wo_resultset')).contextualize.entryCreate;
          formFKCol = findFKColumn(ref, woRefFK);
          const res = await ref.create([{ id: 10, name: 'ten', ref_id: 1 }], undefined, false, [{ [formFKCol.name]: refOne }]);
          page = res.successful;
        });

        it('uses the entry/create context and list.', () => {
          expect(page.reference.context).toBe('entry/create');
          expect(columnNames(page.reference)).toEqual(['id', 'name', constraintName(woRefFK)]);
          expect(page.valueContext).toBe('compact/resultset');
        });

        it('shows the row name for a foreign key column with its own name.', () => {
          // the source ends in `id` (not RID), so the column name is not the foreign key name
          expect(formFKCol.name).not.toBe(formFKCol.foreignKey.name);

          const tuple = page.tuples[0];
          expect(tuple.linkedData[findFKColumn(page.reference, woRefFK).name]).toBe(refOne);
          expect(getValue(page, tuple, woRefFK)).toContain('>ref one</a>');
        });
      });

      describe('update', () => {
        let page;

        beforeAll(async () => {
          const ref = (await resolve('table_wo_resultset', 'id=1;id=2@sort(id)')).contextualize.entryEdit;
          const readPage = await ref.read(2);
          readPage.tuples.forEach((t) => {
            t.data.ref_id = 2;
          });

          const formFKCol = findFKColumn(ref, woRefFK);
          const linkedData = readPage.tuples.map(() => ({ [formFKCol.name]: refTwo }));
          const res = await ref.update(readPage.tuples, undefined, linkedData);
          page = res.successful;
        });

        it('uses the entry/edit context and list.', () => {
          expect(page.reference.context).toBe('entry/edit');
          expect(columnNames(page.reference)).toEqual(['id', 'name', 'extra', constraintName(woRefFK)]);
        });

        it('shows the row name of the new foreign key value.', () => {
          expect(page.tuples.map((t) => t.data.id)).toEqual([1, 2]);
          page.tuples.forEach((t) => {
            expect(getValue(page, t, woRefFK)).toContain('>ref two</a>');
          });
        });
      });
    });

    /**
     * NOTE this relies on ermrest silently skipping the rows that don't exist anymore. its check for the
     * missing rows (`_enforce_input_exists`) never fires because of how SQL compares NULLs. if ermrest fixes
     * that, the update below fails with a 409 instead, and this test should change accordingly.
     */
    describe('when some of the rows are not updated,', () => {
      let res;

      beforeAll(async () => {
        const ref = (await resolve('table_w_resultset', 'id=2;id=3@sort(id)')).contextualize.entryEdit;
        const readPage = await ref.read(2);

        // delete the second row after it was read
        await (await resolve('table_w_resultset', 'id=3')).delete();

        readPage.tuples.forEach((t) => {
          t.data.name = `${t.data.name} updated`;
        });
        res = await ref.update(readPage.tuples);
      });

      it('returns the updated rows as successful.', () => {
        expect(res.successful.reference.context).toBe('resultset');
        expect(res.successful.tuples.map((t) => t.data.id)).toEqual([2]);
        expect(res.successful.tuples[0].data.name).toBe('two updated');
      });

      it('returns the other rows as failed.', () => {
        expect(res.failed).not.toBeNull();
        expect(res.failed.tuples.map((t) => t.data.id)).toEqual([3]);
        expect(res.failed.tuples[0].data.name).toBe('three updated');
      });
    });

    describe('with visible-columns contexts that redirect to each other,', () => {
      const heuristicColumns = ['id', 'name', 'RID', 'RCT', 'RMT', 'RCB', 'RMB'];

      it('falls back to the heuristics instead of looping.', async () => {
        const ref = await resolve('table_w_redirect_cycle');
        expect(columnNames(ref.contextualize.resultset)).toEqual(heuristicColumns);
        expect(columnNames(ref.contextualize.entryCreate)).toEqual(heuristicColumns);
      });

      it('uses the form context, since the resultset list is not valid.', async () => {
        const ref = (await resolve('table_w_redirect_cycle')).contextualize.entryCreate;
        const res = await ref.create([{ id: 10, name: 'ten' }]);
        expect(res.successful.reference.context).toBe('entry/create');
      });
    });
  });
};
