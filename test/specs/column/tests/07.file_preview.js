const utils = require("../../../utils/utilities.js");

exports.execute = function (options) {

  describe('file_preview property', () => {

    const schemaName = 'file_preview_schema';
    const tableName = 'main';
    const uri = options.url + '/catalog/' + process.env.DEFAULT_CATALOG + '/entity/' + schemaName + ':' + tableName;

    // named column references for better maintainability
    let col_asset_no_display, col_asset_disabled_preview, col_asset_w_display_1,
      col_asset_per_type_config, col_asset_custom_ext_mapping, col_asset_custom_content_type,
      col_asset_disabled_types, col_asset_zero_max_file_size;

    const PREFETCH_BYTES = 0.5 * 1024 * 1024; // default
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // default

    beforeAll((done) => {
      options.ermRest.resolve(uri, { cid: 'test' }).then((response) => {
        const columns = response.contextualize.compact.columns;

        // assign named column references
        col_asset_no_display = columns.find(c => c.name === 'asset_no_display');
        col_asset_disabled_preview = columns.find(c => c.name === 'asset_disabled_preview');
        col_asset_w_display_1 = columns.find(c => c.name === 'asset_w_display_1');
        col_asset_per_type_config = columns.find(c => c.name === 'asset_per_type_config');
        col_asset_custom_ext_mapping = columns.find(c => c.name === 'asset_custom_ext_mapping');
        col_asset_custom_content_type = columns.find(c => c.name === 'asset_custom_content_type');
        col_asset_disabled_types = columns.find(c => c.name === 'asset_disabled_types');
        col_asset_zero_max_file_size = columns.find(c => c.name === 'asset_zero_max_file_size');

        done();
      }).catch((error) => done.fail(error));
    });

    /**
     * Helper function to test file preview info
     * @param {string} url - the file url
     * @param {object} column - the asset column (optional)
     * @param {string} storedFilename - stored filename (optional)
     * @param {string} contentDisposition - content-disposition header (optional)
     * @param {string} contentType - content-type header (optional)
     * @param {object} expected - expected result
     */
    const testFilePreview = (url, column, storedFilename, contentDisposition, contentType, expected) => {
      const filePreviewInfo = options.ermRest.FilePreviewService.getFilePreviewInfo(url, column, storedFilename, contentDisposition, contentType);
      expect(filePreviewInfo).toEqual(expected);
    };

    /**
     * Helper function to run parameterized tests
     * @param {Array} testCases - array of test case objects
     * @param {string} descriptionPrefix - prefix for test descriptions
     */
    const runParameterizedTests = (testCases, descriptionPrefix = '') => {
      testCases.forEach((testCase) => {
        it(testCase.description || `${descriptionPrefix} ${testCase.contentType || testCase.extension || ''}`, () => {
          testFilePreview(
            testCase.url,
            testCase.column || null,
            testCase.storedFilename || null,
            testCase.contentDisposition || null,
            testCase.contentType || null,
            testCase.expected
          );
        });
      });
    };

    describe('AssetPseudoColumn.filePreview property', () => {
      // only testing showCsvHeader and defaultHeight here since other properties are tested as part of FilePreviewService tests

      it('should return null when file_preview is disabled', () => {
        expect(col_asset_disabled_preview.filePreview).toBe(null);
      });

      it('should return default values when not configured', () => {
        const columnsWithDefaults = [col_asset_no_display, col_asset_per_type_config];
        
        columnsWithDefaults.forEach((column) => {
          expect(column.filePreview).not.toBe(null);
          expect(column.filePreview.showCsvHeader).toBe(false);
          expect(column.filePreview.defaultHeight).toBe(null);
        });
      });

      it('should honor the defined values', () => {
        expect(col_asset_w_display_1.filePreview).not.toBe(null);
        expect(col_asset_w_display_1.filePreview.showCsvHeader).toBe(true);
        expect(col_asset_w_display_1.filePreview.defaultHeight).toBe(400);
      });

    });

    describe('FilePreviewService.getFilePreviewInfo', () => {

      describe('when the column is provided', () => {

        it('should return null preview type when file_preview is set to false', () => {
          testFilePreview(
            'http://example.com/file.png',
            col_asset_disabled_preview,
            null,
            null,
            'image/png',
            { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
          );
        });

        it('should use defaults when column has no file_preview annotation', () => {
          testFilePreview(
            'http://example.com/file.png',
            col_asset_no_display,
            null,
            null,
            'image/png',
            { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
          );
        });

        describe('when file_preview is an object', () => {

          it('should use custom prefetchBytes and prefetchMaxFileSize from the annotation', () => {
            testFilePreview(
              'http://example.com/file.png',
              col_asset_w_display_1,
              null,
              null,
              'image/png',
              { previewType: 'image', prefetchBytes: 10000, prefetchMaxFileSize: 5000000 }
            );
          });

          describe('per-type configuration', () => {

            it('should use per-type prefetchBytes when defined (csv)', () => {
              testFilePreview(
                'http://example.com/file.csv',
                col_asset_per_type_config,
                null,
                null,
                'text/csv',
                { previewType: 'csv', prefetchBytes: 30000, prefetchMaxFileSize: MAX_FILE_SIZE }
              );
            });

            it('should use per-type prefetchBytes when defined (json)', () => {
              testFilePreview(
                'http://example.com/file.json',
                col_asset_per_type_config,
                null,
                null,
                'application/json',
                { previewType: 'json', prefetchBytes: 40000, prefetchMaxFileSize: MAX_FILE_SIZE }
              );
            });

            it('should use wildcard (*) prefetchBytes for types without specific config', () => {
              testFilePreview(
                'http://example.com/file.png',
                col_asset_per_type_config,
                null,
                null,
                'image/png',
                { previewType: 'image', prefetchBytes: 20000, prefetchMaxFileSize: MAX_FILE_SIZE }
              );
            });

            it('should use per-type prefetchMaxFileSize when defined (text)', () => {
              testFilePreview(
                'http://example.com/file.txt',
                col_asset_per_type_config,
                null,
                null,
                'text/plain',
                { previewType: 'text', prefetchBytes: 20000, prefetchMaxFileSize: 100000 }
              );
            });

            it('should use per-type prefetchMaxFileSize when defined (markdown)', () => {
              testFilePreview(
                'http://example.com/file.md',
                col_asset_per_type_config,
                null,
                null,
                'text/markdown',
                { previewType: 'markdown', prefetchBytes: 20000, prefetchMaxFileSize: 200000 }
              );
            });

            it('should use per-type prefetchMaxFileSize when defined (tsv)', () => {
              testFilePreview(
                'http://example.com/file.tsv',
                col_asset_per_type_config,
                null,
                null,
                null,
                { previewType: 'tsv', prefetchBytes: 20000, prefetchMaxFileSize: 300000 }
              );
            });

            it('should use default MAX_FILE_SIZE for types without specific prefetchMaxFileSize config', () => {
              testFilePreview(
                'http://example.com/file.csv',
                col_asset_per_type_config,
                null,
                null,
                'text/csv',
                { previewType: 'csv', prefetchBytes: 30000, prefetchMaxFileSize: MAX_FILE_SIZE }
              );
            });

          });

          describe('custom filename_ext_mapping', () => {

            const customExtTests = [
              {
                description: 'should map .mycsv to csv type',
                url: 'http://example.com/file.mycsv',
                contentType: 'text/plain',
                expected: { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              },
              {
                description: 'should map .mvsj to json type',
                url: 'http://example.com/file.mvsj',
                contentType: 'application/octet-stream',
                expected: { previewType: 'json', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              },
              {
                description: 'should map .custommd to markdown type',
                url: 'http://example.com/file.custommd',
                contentType: 'text/plain',
                expected: { previewType: 'markdown', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              },
              {
                description: 'should block .blocked extension (return null)',
                url: 'http://example.com/file.blocked',
                contentType: 'text/plain',
                expected: { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
              },
              {
                description: 'should still use default mappings for non-custom extensions',
                url: 'http://example.com/file.png',
                contentType: 'text/plain',
                expected: { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              }
            ];

            customExtTests.forEach((testCase) => {
              it(testCase.description, () => {
                testFilePreview(
                  testCase.url,
                  col_asset_custom_ext_mapping,
                  null,
                  null,
                  testCase.contentType,
                  testCase.expected
                );
              });
            });

          });

          describe('custom content_type_mapping', () => {

            const customContentTypeTests = [
              {
                description: 'should map custom content-type to json (exact match)',
                url: 'http://example.com/file',
                contentType: 'application/my-json',
                expected: { previewType: 'json', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              },
              {
                description: 'should map custom content-type to csv (exact match)',
                url: 'http://example.com/file',
                contentType: 'application/custom-csv',
                expected: { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              },
              {
                description: 'should map custom content-type to markdown',
                url: 'http://example.com/file',
                contentType: 'text/my-markdown',
                expected: { previewType: 'markdown', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              },
              {
                description: 'should map vendor content-type to text',
                url: 'http://example.com/file',
                contentType: 'vendor/x-special',
                expected: { previewType: 'text', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              },
              {
                description: 'should block all application/ types with prefix match (except explicit matches)',
                url: 'http://example.com/file',
                contentType: 'application/unknown',
                expected: { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
              },
              {
                description: 'should use extension mapping when content-type maps to use_ext_mapping (via * default)',
                url: 'http://example.com/file.csv',
                contentType: 'text/unknown',
                expected: { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              },
              {
                description: 'should still allow explicitly defined application/ types',
                url: 'http://example.com/file',
                contentType: 'application/my-json',
                expected: { previewType: 'json', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              }
            ];

            customContentTypeTests.forEach((testCase) => {
              it(testCase.description, () => {
                testFilePreview(
                  testCase.url,
                  col_asset_custom_content_type,
                  null,
                  null,
                  testCase.contentType,
                  testCase.expected
                );
              });
            });

          });

          describe('disabled property', () => {

            const disabledTypeTests = [
              {
                description: 'should disable image preview even with valid image content-type',
                url: 'http://example.com/file.png',
                contentType: 'image/png',
                expected: { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
              },
              {
                description: 'should disable csv preview even with valid csv content-type',
                url: 'http://example.com/file.csv',
                contentType: 'text/csv',
                expected: { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
              },
              {
                description: 'should still allow non-disabled types (json)',
                url: 'http://example.com/file.json',
                contentType: 'application/json',
                expected: { previewType: 'json', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              },
              {
                description: 'should still allow non-disabled types (markdown)',
                url: 'http://example.com/file.md',
                contentType: 'text/markdown',
                expected: { previewType: 'markdown', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
              }
            ];

            disabledTypeTests.forEach((testCase) => {
              it(testCase.description, () => {
                testFilePreview(
                  testCase.url,
                  col_asset_disabled_types,
                  null,
                  null,
                  testCase.contentType,
                  testCase.expected
                );
              });
            });

          });

          it('should return null preview when prefetchMaxFileSize is 0 for a specific type', () => {
            testFilePreview(
              'http://example.com/file.png',
              col_asset_zero_max_file_size,
              null,
              null,
              'image/png',
              { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
            );
          });

          it('should still allow other types when one type has prefetchMaxFileSize = 0', () => {
            testFilePreview(
              'http://example.com/file.csv',
              col_asset_zero_max_file_size,
              null,
              null,
              'text/csv',
              { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            );
          });

        });


        // 11.column_defaults.js tests different scenarios and the following is just to confirm
        it('should honor the column-defaults values.', (done) => {
          let col_asset_no_display_w_catalog_defaults, col_asset_per_type_config_w_catalog_defaults;

          utils.setCatalogAnnotations(options, {
            "tag:isrd.isi.edu,2023:column-defaults": {
              "asset": {
                "url": {
                  "tag:isrd.isi.edu,2017:asset": {
                    "display": {
                      "*": {
                        "file_preview": {
                          "content_type_mapping": {
                            "image/": false,
                            "image/jpeg": "image"
                          },
                          "filename_ext_mapping": {
                            ".mycsv": "csv"
                          },
                          "disabled": ["markdown"],
                        }
                      }
                    }
                  }
                }
              }
            }
          }).then(() => {
            return options.ermRest.resolve(uri, { cid: 'test' });
          }).then((response) => {
            const reference = response.contextualize.compact;
            const columns = reference.columns;
            col_asset_no_display_w_catalog_defaults = columns.find(c => c.name === 'asset_no_display');
            col_asset_per_type_config_w_catalog_defaults = columns.find(c => c.name === 'asset_per_type_config');

            testFilePreview(
              'http://example.com/file.png',
              col_asset_no_display_w_catalog_defaults,
              null,
              null,
              'image/png',
              { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
            );

            testFilePreview(
              'http://example.com/file.json',
              col_asset_no_display_w_catalog_defaults,
              null,
              null,
              'text/json',
              { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
            );

            testFilePreview(
              'http://example.com/file.jpg',
              col_asset_no_display_w_catalog_defaults,
              null,
              null,
              'image/jpeg',
              { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            );

            testFilePreview(
              'http://example.com/file.mycsv',
              col_asset_no_display_w_catalog_defaults,
              null,
              null,
              'text/plain',
              { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            );


            testFilePreview(
              'http://example.com/file.png',
              col_asset_per_type_config_w_catalog_defaults,
              null,
              null,
              'image/png',
              { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
            );

            testFilePreview(
              'http://example.com/file.jpg',
              col_asset_per_type_config_w_catalog_defaults,
              null,
              null,
              'image/jpeg',
              { previewType: 'image', prefetchBytes: 20000, prefetchMaxFileSize: MAX_FILE_SIZE }
            );

            // remove the annotation
            return utils.setCatalogAnnotations(options, {});
          }).then(() => {
            done();
          }).catch((error) => done.fail(error));
        });
      });

      describe('when the column is not provided', () => {

        describe('content-type based detection', () => {

          const imageContentTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/avif', 'image/apng'];
          const contentTypeTests = [
            ...imageContentTypes.map(ct => ({
              contentType: ct,
              expected: { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            })),
            {
              contentType: 'text/markdown',
              expected: { previewType: 'markdown', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              contentType: 'text/csv',
              expected: { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              contentType: 'text/tab-separated-values',
              expected: { previewType: 'tsv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              contentType: 'application/json',
              expected: { previewType: 'json', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              contentType: 'chemical/x-mmcif',
              expected: { previewType: 'text', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              contentType: 'chemical/x-cif',
              expected: { previewType: 'text', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            }
          ];

          runParameterizedTests(
            contentTypeTests.map(tc => ({
              url: 'http://example.com/file',
              contentType: tc.contentType,
              expected: tc.expected,
              description: `should detect ${tc.expected.previewType} type for ${tc.contentType}`
            })),
            'content-type detection:'
          );

          it('should handle content-type with charset and extra info', () => {
            testFilePreview(
              'http://example.com/file',
              null,
              null,
              null,
              'text/csv; charset=utf-8',
              { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            );
          });

          it('should handle content-type with multiple parameters', () => {
            testFilePreview(
              'http://example.com/file',
              null,
              null,
              null,
              'application/json; charset=utf-8; boundary=something',
              { previewType: 'json', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            );
          });

          it('should return null for unknown content-types', () => {
            testFilePreview(
              'http://example.com/file',
              null,
              null,
              null,
              'application/unknown',
              { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
            );
          });

        });

        describe('extension based detection (when content-type is text/plain or application/octet-stream)', () => {

          const extensionTests = [
            // Images
            ...['.png', '.jpeg', '.jpg', '.gif', '.bmp', '.webp', '.svg', '.ico', '.avif', '.apng'].map(ext => ({
              extension: ext,
              previewType: 'image'
            })),
            // Markdown
            { extension: '.md', previewType: 'markdown' },
            { extension: '.markdown', previewType: 'markdown' },
            // CSV/TSV
            { extension: '.csv', previewType: 'csv' },
            { extension: '.tsv', previewType: 'tsv' },
            // JSON
            { extension: '.json', previewType: 'json' },
            { extension: '.mvsj', previewType: 'json' },
            // Text
            { extension: '.txt', previewType: 'text' },
            { extension: '.log', previewType: 'text' },
            { extension: '.cif', previewType: 'text' },
            { extension: '.pdb', previewType: 'text' }
          ];

          const contentTypesToTest = ['text/plain', 'application/octet-stream'];

          contentTypesToTest.forEach(contentType => {
            describe(`with content-type ${contentType}`, () => {
              runParameterizedTests(
                extensionTests.map(tc => ({
                  url: `http://example.com/file${tc.extension}`,
                  contentType: contentType,
                  expected: { previewType: tc.previewType, prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE },
                  description: `should detect ${tc.previewType} for ${tc.extension}`
                }))
              );
            });
          });

          it('should return null for unknown extensions with text/plain', () => {
            testFilePreview(
              'http://example.com/file.unknown',
              null,
              null,
              null,
              'text/plain',
              { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
            );
          });

        });

        describe('extension extraction', () => {

          const extractionTests = [
            {
              description: 'should extract extension from URL when no storedFilename is provided',
              url: 'http://example.com/folder/test-file.png',
              contentType: 'text/plain',
              expected: { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              description: 'should extract extension from storedFilename when provided',
              url: 'http://example.com/file',
              storedFilename: 'my-stored-file.csv',
              contentType: 'text/plain',
              expected: { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              description: 'should extract extension from contentDisposition when provided',
              url: 'http://example.com/file',
              contentDisposition: "filename*=UTF-8''example.png",
              expected: { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              description: 'should prioritize storedFilename over URL for extension extraction',
              url: 'http://example.com/file.txt',
              storedFilename: 'overridden.png',
              contentType: 'text/plain',
              expected: { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              description: 'should prioritize storedFilename over contentDisposition',
              url: 'http://example.com/file',
              storedFilename: 'stored.csv',
              contentDisposition: 'attachment; filename="disposition.json"',
              contentType: 'text/plain',
              expected: { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            }
          ];

          runParameterizedTests(extractionTests);

        });

        describe('when no content-type is provided', () => {

          const noContentTypeTests = [
            {
              description: 'should use extension from URL',
              url: 'http://example.com/file.png',
              expected: { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              description: 'should use extension from hatrac url',
              url: '/hatrac/js/test/b9901b86a536f14ee79cf8679f1ac968/test.tsv:2ETE72GKFFNIITMNBMCTDUYSTE',
              expected: { previewType: 'tsv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              description: 'should use extension from storedFilename',
              url: 'http://example.com/file',
              storedFilename: 'stored.csv',
              expected: { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              description: 'should return null when no extension can be determined',
              url: 'http://example.com/file',
              expected: { previewType: null, prefetchBytes: null, prefetchMaxFileSize: null }
            }
          ];

          runParameterizedTests(noContentTypeTests);

        });

        describe('edge cases', () => {

          const edgeCaseTests = [
            {
              description: 'should handle URLs with query parameters',
              url: 'http://example.com/file.png?v=1&query=test',
              expected: { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              description: 'should handle URLs with fragments',
              url: 'http://example.com/file.json#section',
              expected: { previewType: 'json', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              description: 'should handle case-insensitive content-type',
              url: 'http://example.com/file',
              contentType: 'IMAGE/PNG',
              expected: { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            },
            {
              description: 'should handle empty string content-type',
              url: 'http://example.com/file.csv',
              contentType: '',
              expected: { previewType: 'csv', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            }
          ];

          runParameterizedTests(edgeCaseTests);

          it('should handle content-type with leading/trailing whitespace', () => {
            testFilePreview(
              'http://example.com/file',
              null,
              null,
              null,
              '  image/png  ',
              { previewType: 'image', prefetchBytes: PREFETCH_BYTES, prefetchMaxFileSize: MAX_FILE_SIZE }
            );
          });

          it('should handle mixed case file extensions', () => {
            testFilePreview(
              'http://example.com/file.PNG',
              null,
              null,
              null,
              'text/plain',
              { previewType: 'image', prefetchBytes: 524288, prefetchMaxFileSize: 1048576 }
            );
          });

        });

      });

    });

  });
}