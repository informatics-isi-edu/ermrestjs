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
          urlPattern: '/apps/test/index.html?id={{{id}}}}',
          columnNames: ['col_5', 'col_6'],
          fieldMapping: {
            "iframe_3_field_1": "col_5",
            "iframe_3_field_2": "col_6"
          },
          optionalFieldNames: []
        }
      },
      {
        name: 'col_w_valid_input_iframe_3',
        isInputIframe: true,
        inputIframeProps: {
          urlPattern: '/apps/test/index.html?id={{{id}}}}',
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
          columnNames: ['col_5', 'col_6'],
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

        if (!expectedColumns[i].inputIframeProps) {
          expect(col.inputIframeProps).toBeFalsy(`missmatch for name=${col.name}`);

          return;
        }

        expect(col.inputIframeProps).toBeTruthy(`missmatch for i=${i}, name=${col.name}`);

        // .urlPattern
        expect(col.inputIframeProps.urlPattern).toEqual(expectedColumns[i].inputIframeProps.urlPattern, `urlPattern missmatch for name=${col.name}`);


        // .columns
        const mappedCols = col.inputIframeProps.columns;
        const expectedMappedColNames = expectedColumns[i].inputIframeProps.columnNames;
        expect(mappedCols.length).toBe(expectedMappedColNames.length);
        mappedCols.forEach((mappedCol, j) => {
          if (j >= expectedMappedColNames.length) return;
          expect(mappedCol.name).toBe(expectedMappedColNames[j], `missmatch columnname name=${col.name}, mapped col=${mappedCol.name}`);
        });

        // .fieldMapping
        const fieldMapping = col.inputIframeProps.fieldMapping;
        const fieldNames = Object.keys(fieldMapping);

        const expectedFieldMapping = expectedColumns[i].inputIframeProps.fieldMapping;
        const expectedFieldNames = Object.keys(expectedFieldMapping);

        expect(fieldNames.length).toBe(expectedFieldNames.length);
        fieldNames.forEach((fieldName, j) => {
          if (j >= expectedFieldNames.length) return;
          expect(fieldName).toBe(expectedFieldNames[j], `missmatch fieldname for name=${col.name}, mapped col=${fieldName.name}`);

          expect(fieldMapping[fieldName].name).toBe(expectedFieldMapping[expectedFieldNames[i]], `missmatch mapped fieldname for name=${col.name}, mapped fieldname=${fieldName.name}`);
        });

        // .optionalFieldNames
        expect(col.inputIframeProps.optionalFieldNames).toEqual(expectedColumns[i].inputIframeProps.optionalFieldNames, `optionalFieldNames missmatch for i=${i}, name=${col.name}`);

      });
    });


    // TODO
    describe('renderInputIframeUrl', () => {
      it('should handle urls without any pattern.', () => {
        // const val = columns[1].renderInputIframeUrl()
      });

      it('should be able to use predefined variables in the pattern.', () => {

      });

      it('should return empty string for invalid templates or when data is missing.', () => {

      });
    })

  });
}
