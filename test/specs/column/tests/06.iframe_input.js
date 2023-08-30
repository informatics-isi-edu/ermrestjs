exports.execute = function (options) {

  describe('input_iframe property', () => {
    const expectedColumns = [
      {
        name: 'id',
        isInputIframe: undefined,
      },
      {
        name: 'col_w_valid_input_iframe_1',
        isInputIframe: true,
        inputIframeProps: {
          urlPattern: '/apps/test/index.html',
          columnNames: ['col_1', 'col_2', 'col_3'],
          fieldMapping: {
            "iframe_1_field_1": "col_1",
            "iframe_1_field_2": "col_2",
            "iframe_1_field_3": "col_3"
          },
          optionalFieldNames: ["col_2", "col_3"]
        }
      },
      {
        name: 'col_w_valid_input_iframe_2',
        isInputIframe: true,
        inputIframeProps: {
          urlPattern: '/apps/test/index.html?catalog={{{$catalog.id}}}',
          columnNames: ['col_4'],
          fieldMapping: {
            "iframe_2_field_1": "col_4"
          },
          optionalFieldNames: []
        }
      },
      {
        name: 'col_w_valid_input_iframe_3',
        isInputIframe: true,
        inputIframeProps: {
          urlPattern: '/apps/test/index.html?id={{id}}',
          columnNames: ['col_5', 'col_6'],
          fieldMapping: {
            "iframe_3_field_1": "col_5",
            "iframe_3_field_2": "col_6"
          },
          optionalFieldNames: []
        }
      },
      {
        name: 'col_w_invalid_optional_fields',
        isInputIframe: true,
        inputIframeProps: {
          urlPattern: '/apps/test/index.html{{#if true}}?q=test{{/if}}',
          columnNames: ['col_wo_url'],
          fieldMapping: {
            "field_1": "col_wo_url"
          },
          optionalFieldNames: ["unused_field"]
        }
      }
    ]

    var columns;

    beforeAll((done) => {
      const url = `${options.url}/catalog/${process.env.DEFAULT_CATALOG}/entity/columns_schema:iframe_input_test`;
      options.ermRest.resolve(url, { cid: "test" }).then(function (response) {
        columns = response.contextualize.entryEdit.columns;
        done();
      }).catch((err) => {
        done.fail(err)
      });
    });

    it('Reference.columns should ignore columns with invalid input_iframe related properies that are required.', () => {
      expect(columns.length).toBe(expectedColumns.length);

      columns.forEach((col, i) => {
        if (i >= expectedColumns.length) return;
        expect(col.name).toBe(expectedColumns[i].name, `missmatch for name=${col.name}`);
      });
    });

    it('isInputIframe should return the proper values.', () => {
      columns.forEach((col, i) => {
        if (i >= expectedColumns.length) return;
        expect(col.isInputIframe).toBe(expectedColumns[i].isInputIframe, `missmatch for name=${col.name}`);
      });
    });

    it('inputIframeProps should return the proper values.', () => {
      columns.forEach((col, i) => {
        if (i >= expectedColumns.length) return;
        const expectedCol = expectedColumns[i];

        if (!expectedCol.inputIframeProps) {
          expect(col.inputIframeProps).toBeFalsy(`missmatch inputIframeProps for name=${col.name}`);

          return;
        }

        expect(col.inputIframeProps).toBeTruthy(`missmatch inputIframeProps name=${col.name}`);

        // .urlPattern
        expect(col.inputIframeProps.urlPattern).toEqual(expectedCol.inputIframeProps.urlPattern, `urlPattern missmatch for name=${col.name}`);


        // .columns
        const mappedCols = col.inputIframeProps.columns;
        const expectedMappedColNames = expectedCol.inputIframeProps.columnNames;
        expect(mappedCols.length).toBe(expectedMappedColNames.length, `missmatch columns length for name=${col.name}`);
        mappedCols.forEach((mappedCol, j) => {
          if (j >= expectedMappedColNames.length) return;
          expect(mappedCol.name).toBe(expectedMappedColNames[j], `missmatch columnnames name=${col.name}, mapped col=${mappedCol.name}`);
        });

        // .fieldMapping
        const fieldMapping = col.inputIframeProps.fieldMapping;
        const fieldNames = Object.keys(fieldMapping);

        const expectedFieldMapping = expectedCol.inputIframeProps.fieldMapping;
        const expectedFieldNames = Object.keys(expectedFieldMapping);

        expect(fieldNames.length).toBe(expectedFieldNames.length, `missmatch fieldMapping length for name=${col.name}`);
        fieldNames.forEach((fieldName, j) => {
          if (j >= expectedFieldNames.length) return;
          expect(fieldName).toBe(expectedFieldNames[j], `missmatch fieldMapping for name=${col.name}, fieldname=${fieldName.name}`);

          expect(fieldMapping[fieldName].name).toBe(expectedFieldMapping[expectedFieldNames[j]], `missmatch fieldMapping for name=${col.name}, mapped fieldname=${fieldName.name}`);
        });

        // .optionalFieldNames
        expect(col.inputIframeProps.optionalFieldNames).toEqual(expectedCol.inputIframeProps.optionalFieldNames, `optionalFieldNames missmatch for i=${i}, name=${col.name}`);

      });
    });

    describe('renderInputIframeUrl', () => {
      it('should handle urls without any pattern.', () => {
        expect(columns[1].renderInputIframeUrl({}, {})).toBe('/apps/test/index.html');
      });

      it('should be able to use predefined variables in the pattern.', () => {
        expect(columns[2].renderInputIframeUrl({}, {})).toBe(`/apps/test/index.html?catalog=${process.env.DEFAULT_CATALOG}`);
      });

      it('should handle patterns using column and fkey values.', () => {
        expect(columns[3].renderInputIframeUrl({}, {})).toBe('');

        expect(columns[3].renderInputIframeUrl({'id': 1}, {})).toBe('/apps/test/index.html?id=1');
      });

      it ('should honor template_engine.', () => {
        expect(columns[4].renderInputIframeUrl({}, {})).toBe('/apps/test/index.html?q=test');
      })
    })

  });
}
