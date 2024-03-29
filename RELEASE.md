# Release Notes

This document is a summary of code changes in ERMRestJS. This is the vocabulary used to introduce the changes:
  - `[Added]`: newly added features.
  - `[Improved]`: additions made to an existence feature.
  - `[Changed]`: modifications to existing features.
  - `[Deprecated]`: removal (modification) of an existing feature that are not supported anymore.
  - `[Refactored]`: modifications to existing code to make it more maintainable.
  - `[Fixed]`: bug fixes.
  - `[Annotation]`: when the describe modification is related to annotation.
  - `[No changes]`: means that ERMRestJS hasn't been changed in the described duration.


# 1/31/24

- [Improved] added the `flags` optional parameter to regular expression handlebar functions ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/d6690571e767a3b2dfe1caa5a5cee02c337ed8a0))
- [Added] support for markdown values in comment ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/1000))
- [Changed] how `.comment` API works to be similar to `.displayname` API (link above)
- [Added] support for contextualized `comment` (link above)
- [Fixed] the inheritance of `comment_display` from the parent catalog, schema, or table (link above)
- [Changed] `comment`, `comment_display`, and `comment_render_markdown` can come from different levels and don't affect each other. Before, we used to only get the `comment_display` from where the `comment` was defined. But now `comment_display` can come from the column directive while the comment is derived from the table, or vice versa (link above)

# 11/30/23

- [Fixed] spacing issue in the full-screen-btn of iframes ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/994))
- [Improved] visible-columns and rowname heuristics ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/995))
- [Changed] how data can be accessed through `page_markdown_pattern` for consistency (link above) 

# 9/30/23

- [Added][Annotation] `input_iframe` property to column-directives ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/988))
- [Added][Annotation] `selector_ux_mode` property to visible-columns, foreign-ke, table-display, and display annotations ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/986))
- [Improved] default presentation of asset columns and its metadata ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/985))
- [Added][Annotation] asset related propreties to the column-defaults (link above)
- [Added][Annotation] `data-chaise-tooltip` attribute to our markdown rendering that can be used for showing tooltips (link above)
- [Improved][Annotation] add a new argument to the `huamnizeBytes` handlebars function to show the raw value in the tooltip (link above)
- [Fixed] issues in parser related to search ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/3268586e0ca8cead6337c5701a808e329cff72c0))
- [Fixed] issues related to uncontextualized reference ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/af9e210d6df7e79b52299767abcba67b516ba382))
- [Fixed] avoid adding non-sortable shortest key columns to the default sort ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/e0f6e9d27500b10fd2c01bcf0d72f0942e2c7ab1))
- [Improved] allow other ways of using encodeFacet and jsonStringify handlebar helpers ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/e490a86533bcf7af38327d91805bdbedba83feec))
- [Added] `root-intall` make target ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/e0f6c38043e0b2ad19aa9b0a5df12ee888891195))
- [Improved] allow `entity`, `aggregate`, and `self_link` to be defined at the same type as `sourcekey` ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/992))
- [Improved] default visible columns heuristics regarding the display key (link above)

# 7/31/23

- [Added][Annotation] `humanizeBytes` handlebars function ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/978))
- [Added][Annotation] `skip_root_path` to allow export template to skip adding the root path ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/980))
- [Improved][Annotation] how export annotation handles `limit` query parameter (link above)

# 5/31/23

- [Improved] properly handle URL length limitation while validating facet filters ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/975))
- [Improved] how ermrest-data-utils is used for testing ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/974))

# 3/31/23

- [Added] support for immutable, generated, and non-deletable annotations on catalog ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/ab249623a19afa5e2e260a6c473c0901c80f7ca3))
- [Added][Annotation] support for column-defaults annotation ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/972))
- [Added][Annotation] support for `image_preview` to `asset` annotation ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/973))

# 1/31/23

- [Improved] make sure fast_filter_source is honored for urls with join ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/a2a234534ca120a1308027a443c96d158fd5a130)).
- [Improved] treat axios network errors as no connection error ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/5c3a058be6da0246b352601055cd6a1bdfd8dbc4)).
- [Added] support for simple quantified value lists in parser ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/ee18b10cfc1c6f61dfe8d6963a635c423ac4e367)).
- [Added] `hasDomainFilter` to `ForeignKeyPseudoColumn` to be used by Chaise ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/880b12a87ac738c43ad95d2e8d25f09d180bdeb3)).

# 11/31/22

- [Improved] use the new quantified value lists syntax of ERMrest for parsing `search-box` ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/965)).
- [Added] new APIs for supporting the filter in source in add pure and binary feature of Chaise ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/965)).
- [Changed] the default asset persentation ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/2ea0ffbc38d88a5d2b1898557debbe37972d1fb3)).
- [Added][Annotation] support for `fast_filter_source` property in column directives ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/966)).
- [Fixed][Annotation] Ensure `name_style` display annotation is supported on catalogs ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/b23d5baebfd79c9dba9bff4e930417f51f3f2215)).
- [Improved] how we're testing catalog level annotations ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/eeafe396e0425ee4c8150cf59e631ccc5599e980)).
- [Changed] `Reference.delete` to allow passing of `tuples` for bulk delete feature of Chaise [(link)(https://github.com/informatics-isi-edu/ermrestjs/pull/969)].
- [Improved] how key-value pair URLs are generated by using quantified value lists throughout ERMrestJS (link above).

# 9/30/22

- [Improved] generated URLs for facets by using the new quantified value lists syntax of ERMrest ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/963)).
- [Changed] the class name used for fullscreen button of iframes ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/962)).
- [Changed] the included version of moment to 2.29.4.
- [Fixed] an issue related to processing the `url_pattern` value to show better errors when it's invalid ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/48bdba16110e8009542bcfd76e3febcbabd6ad20)).
- [Fixed] a bug related to `Reference.generateFacetColumns` that caused duplicate facet lists if called multiple times ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/d7e44445bdbbf4bd69a7745fdbd85f1c901f6b87)).

# 7/31/22

- [Added] Phsids map and lookup handlebars helper function ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/954)).
- [Added][Annotation] Allow access to filename, mimetype, and file extension in url_pattern ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/956)).
- [Added] examples of using ERMrestJS outside of Chaise environment ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/957)).
- [Fixed] the sort logic by checking for not-null key columns ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/8de08964adcfaebdd6f38107c245b98646e793f9)).

# 5/31/22

- [Fixed] issues related to sorting all-outbounds paths and shared path prefix logic ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/942))
- [Changed] the `$session` object exposed in templating environments to have all the properties of webauthn response ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/948)).
- [Added] [Annotation] sub contexts for `compact/select` to distinguish between different instances in Chaise ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/943)).
- [Improved] how we're handling the npm packages by inlcuding the `package-lock.json` ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/949)).
- [Fixed] the validation logic for `color_rgb_hex` default value.
- [Added] [annotation] `Table.supportHistory` based on the `history-capture` annotation so Chaise can hide history controls for tables that don't support this feature.
 - [Changed] makefile targets related to installation ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/952))


# 3/31/22

- [Changed] the documentations to use the new terminilogy and have more information ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/934)).
- [Added] new APIs related to the batch unlink association feature ([link1](https://github.com/informatics-isi-edu/ermrestjs/pull/929), [link2](https://github.com/informatics-isi-edu/ermrestjs/pull/936)).
- [Deprecated] `Reference.getBatchAssociationRef` API since it's not needed anymore (link above).
- [Fixed] the correctness issue related to shared path prefix for facets ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/924)).
- [Added][Annotation] support for ore complicated search columns ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/937)).
- [Added] a new `ERMrest.createSearchPath` API that can be used for generating chaise-supported search paths ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/0f256c869c3eefa359834880cc3e24de74d1e985)).
- [Changed] make targets to honor `NODE_ENV` while installing npm dependencies ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/a23940b83d8bbc8a4032838722fd0e99cd1160ff)).


# 1/31/22

- [Changed] and upgraded the dependencies used in ERMrestJS ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/933)).
- [Improved] the `attributegroup` request in `Reference.read` to use scalar projection for all-outbound paths if possible ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/931))
- [Fixed] a bug in `wait_for` processing that would cause issues related to _path with prefix_ ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/8b0f0c59f0386a638037ba637a584c623d76b5fe))
- [Changed] default csv download link to always use the `detailed` context instead of contextualizing it ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/8d28fc7ce7afe12f50c981507d56446e4c67345c))
- [Added][Annotation] support for usage of filter in source path in `visible-foreign-keys` and `visible-columns`([link 1](https://github.com/informatics-isi-edu/ermrestjs/issues/685), [link](https://github.com/informatics-isi-edu/ermrestjs/pull/928))


# 11/31/21

- [Improved][Annotation] support for _path with prefix_ to allow just changing the end column.
- [Improved][Annotation] the _path with prefix_ implementation ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/912)),
  - _path with prefix_ can be used to just change the projected column (doesn't require any foreign key paths).
  - Avoid adding unused aliases.
  - Properly sharing path when a `sourcekey` is used in facet ([more details](https://github.com/informatics-isi-edu/ermrestjs/pull/912)).
- [Changed] the facet parsing logic to not optimize the last foreign key hop.
- [Improved][Annotaion] support for more complicated search columns ([link](https://github.com/informatics-isi-edu/ermrestjs/issues/906)).
- [Changed] heuristics for `hide_null_choice` and `hide_not_null_choice` in Facets to not check for ACL and versioned catalog ([link](https://github.com/informatics-isi-edu/ermrestjs/issues/888))
- [Changed][Annotation] source-definition` annnotation by moving `search-box`  to be a top-level key ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/eb7a1397e60bae6abeef9cd9d9df8ecb83c1aef0)).
- [Added] `$session` and `$location` to templating environment ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/911)).
- [Added][Annotation] a new `export-fragment-definitions` annotation ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/918)).
- [Fixed] aggregate requests to use inner join ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/923)).


# 9/30/21
 - [Added] [Annotation] support for _path with prefix_ syntax where using `sourcekey`
   as the first attribute will create a shared table instance that can be used mulitple times ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/838)).
 - [Added] [Annotation] `hide_row_count` and `show_saved_query` properties to `display` annotation ([link 1](https://github.com/informatics-isi-edu/ermrestjs/pull/891), [link 2](https://github.com/informatics-isi-edu/ermrestjs/pull/893)).
 - [Added] [Annotation] support for `table-config` annotation.
 - [Added] `jsonStringify` and `toTileCase` handlebars helper functions, as well as `not` logical helper ([link 1](https://github.com/informatics-isi-edu/ermrestjs/pull/895), [link 2](https://github.com/informatics-isi-edu/ermrestjs/commit/558779f48aabd3e9b9960acf56c117c9bf461e27)).
 - [Improved] `csvDownloadLink` logic to honor the `visible-columns` annotation. Also added new contexts (`export/detailed` and `export/compact`) to this annotation specifically for this purpose ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/897)).
 - [Changed] faceting behavior to validate the facets in URL while generating the facet list ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/899)).
 - [Changed] behavior of `immutable`, `generated`, and `non-deletable` annotations to treat `false` value differently ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/902)).
 - [Fixed] how we're hiding the fullscreen button for iframes so it doesn't take extra space ([link](https://github.com/informatics-isi-edu/ermrestjs/commit/25c3f500113453dfebb12c58b7a508657a8c2f35)).
 - [Improved] null and empty handling in array properties of `google-dataset` annotation ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/882)).
 - [Improved] `google-dataset` annotation by parsing the string as a JSON object if we can ([link](https://github.com/informatics-isi-edu/ermrestjs/pull/905)).
 - [Refactored] pseudo-column support so one centeralized place is handling them.

# 7/31/21
 - [Added] [Annotation] support for `google-dataset` annotation.
 - [Added] a mechanism to fetch a relevant supset of schema.org dictionary.
 - [Added] a customized JSON-LD validator.
 - [Added] a logging utility to enable logging as per logging levels of "trace","debug","info","warn","error".
 - [Added] `$self` support to `row_markdown_pattern` and `citation` annotations.
 - [Improved] the check for using `trs`/`tcrs` to avoid using it on tables that don't need the information.
 - [Changed] `Reference.read` so client has to specifically ask for `trs`/`tcrs`.


# 5/31/21
 - [Improved] some cases related to error handling:
  - Based on user reports, we found an odd case where the server is not returning an array in response. This change will make sure we're properly catching this error so we can track it.
  - Modify `logError` so Chaise can pass `cid`, `wid` and `pid` that will be logged with the error.
  - Preserver the `response.data` when the given response is HTML. Chaise will display this in the "show details" section for the error.
 - [Added] dynamic ACL support to ERMrestJS.
   - Added `features` API to `Catalog` to make sure it supports `trs` and `tcrs`.
   - Improved `canUpdate` and `canDelete` of `Tuple`.
   - Added a new `Tuple.canUpdateValues` that goes with `Tuple.values` to figure out the column-level ACLs.
   - Added a new `Tuple.canUnlink` that can be used for tuples that are based on a related reference that has an association table.

# 3/31/21
 - [Added] [Annotation] `show_key_link` support to `display` and `key-display` annotations, as well as source definition in `visible-columns` annotation.
 - [Added] [Annotation] `hide_column_header` to `column-display`, as well as source definition in `visible-columns` annotation.
 - [Changed] default sort of asset columns to be based on the filename column.
 - [Added] `regexFindFirst` and `regexFindAll` handlebars helper functions.
 - [Added] fullscreen button to iframes and ability to change the link behavior to new tab.
 - [Deprecated] `link` property in `iframe` and renamed it to `caption-link`.
 - [Changed] default behavior of caption link and fullscreen links to open in the same tab (and added new properties to change this default.)
 - [Refactored] CI setup to use GitHub Actions instead of Travis CI.
 - [Improved] iframes to make them responsive.

# 1/31/21
 - [Added] support for `color_rgb_hex` column type.
 - [Added] `Tuple.rowName` API. `Tuple.displayname` uses the `row_name/title` context, while `Tuple.rowName` uses the `row_name/<context>`.
 - [Changed] `_processMarkdownPattern` to `processMarkdownPattern` so it's public

# 11/30/20
 - [Changed] default export BAG displayname to "BDBag".
 - [Fixed] a bug in `Reference.activelist` that was reporting inline as column. Because of this bug chaise couldn't display any aggregates in inline tables.
 - [Added] [Annotation] `compact/entry` context. This context is used for the result table of multi edit or create page. The resultset is displayed based on the ERMrest's response and doesn't include all the pseudo-column or foreign-key values. So this context can be used to for remove columns that rely on them.

# 9/30/20
 - [Fixed] the bug where alias names for path with joins were not working.
 - [Changed] [Annotation] `domain_filter_pattern` to `domain_filter` that has `ermrest_path_pattern` and `display_markdown_pattern` attributes.
 - [Fixed] `getChoiceDisplaynames` (the logic to turn raw values in the facet blob into proper rowname) by returning raw value if ERMrest response is empty.
 - [Added] [Annotaiton] `comment` and `comment_display` to `display` annotation.
 - [Added] [Annotation] `comment_display` to `visible-columns` and `visible-foreign-keys` source definition.
 - [Added] [Annotation] `from_comment`, `from_comment_display`, `to_comment`, and `to_comment_display` to `foreign-key` annotation.
 - [Improved] `iframe` and `video` custom markdown tags to properly handle print mode.

# 7/31/20
 - [Improved] `cnt`/`cnt_d` aggregate functions by returning `0` when the ERMrest response is empty.
 - [Fixed] [Annotation] by disallowing inline tables in non-detailed contexts.
 - [Fixed] `Reference.update` to clear asset metadata column values if asset is null.
 - [Fixed] the logic that merges facets in url with the displayed facet columns regarding `sourcekey`.
 - [Improved] `page.content` (the custom display in related entities) by making sure we're not attaching links to rownames that already have link.

# 5/31/20
 - [Changed] `Catalogs.get` to allow skipping the schema introspection.
 - [Improved] dynamic asset fetching by ignoring the already injected dependencies.
 - [Improved] build process to minify ERMrestJS source and vendor files.
 - [Changed] the enviornment variabels used for building ERMrestJS.
 - [Deprecated] `npm-shrinkwrap.js` file. It was only used to fix the mime package version which can be done by adding it to package.json as well. I removed it because it was causing issues with different versions of nodejs. If we want to have such a file we have to keep updating it with all the packages that are installed but that's not the intention at all.
 - [Improved] `package.json` by fixing the version of used dependencies.

# 3/31/20
 - [Added] [Annotation] `wait_for` support to `visible-foreign-keys` and `citation`.
 - [Added] [Annotation] support for virtual columns (source definitions without any source) to `visible-columns` annotation.
 - [Improved] the `Reference.activeList` to support the new logic of ordering the requests. Instead of returning different lists for aggregates and entitysets, this function will return a `requests` array that has all the secondary requests that page needs. This includes aggregates, entity sets, inline entities, and related entities. [This comment](https://github.com/informatics-isi-edu/ermrestjs/issues/617#issuecomment-591602232) explains the new order of sending requests.
 - [Fixed] a referential bug in `display` API of columns that would cause one column to return the attribute of another column.
 - [Improved] build process by adding version number to dynamically fetched assets.
 - [Added] `filterLogInfo` to `Reference` that will return the filter information of the reference that can be used in logs.
 - [Changed] the `dataSource` info `compressedDataSource` since it was only used by logs and in logs, we want the compressed version.
 - [Changed] the `_certifyContextHeader` function (dcctx header truncation logic) to support the new log syntax.
 - [Changed] the `Reference.defautlLogInfo` to only return `catalog` and `schema_table`.
 - [Added] `-chaise-post-load` special class to markdown helpers (`image`, `iframe`, `video`) to indicate their size will change upon loading.

# 1/31/20

 - [Added] test cases for range facet with path.
 - [Added] `getBatchAssociationRef` API to `Reference` to create an association reference for multiple entities given a set of tuples.
 - [Changed] default export heuristics:
   - Use `export` context for getting the list of related entities (Instead of using `detailed` all the times).
   - Remove the check for the extra asset columns. The export service can now handle `fetch` by just passing the URL, so it's safe to do so in the heuristics.

# 11/25/19
 - [Added] [Annotation] `sourcekey` support to facet blobs.
 - [Added] [Annotation] `search-box` support to customize the search filter.
 - [Refactored] function used for parsing the facet object.
 - [Changed] how we encode search filter in the url to use the new `search-box` sourcekey.
 - [Added] [Annotation] `comment` support to display annotation.
 - [Changed] [Annotation] `comment` behavior in annotations so that `false` is treated the same as empty string.
 - [Added] `elapsed_ms` attribute to `Deriva-Client-Context` header object for all the http requests.
 - [Added] [Annotation] `show_foreign_key_link` support.
 - [Changed] [Annotation] `show_nulls` to `show_null` in display annotation.



# 10/18/19
  - [Changed] the default `.download` class in heuristics to `.download-alt`.
  - [Added] `setCatalogConfig` callback so chaise can pass chaise-config properties to ERMrestJS.
  - [Changed] markdown-it url renderer to add `external-link-icon` by default, and `external-link` based on chaise-config.
  - [Added] [Annotation] support for `show_foreign_key_link`.
  - [Added] `logHeaders` API to allow chaise to log events.
  - [Refactored] usage of `_printMarkdown` to use the more appropriate `renderMarkdown` function.

# 09/31/19

  - [Added] RID markdown tag to generate resolvable link for a record given the RID value: [[RID]]
  - [Added] systemColumnsDisplayCompact and systemColumnsDisplayDetailed chaise-config properties support.
  - [Changed] asset presentation heuristics:
    - Added external origin information
    - Added support for external-link behavior
  - [Improved] default export template:
    - Removed duplicate columns from default export
    - Used visible-columns to order export columns for the default template.
    - Added inline tables to the default template.
  - [Added] [Annotation] pseudo-columns in templating environments for compact contexts (source-definition annotation)
  - [Changed] pure and binary heuristics to ignore system columns (even if they are part of foreign key)
  - [Fixed] Make sure the function used in add pure and binary that sets the paging works with facets.

# 06/01/19

  - N/A (This is the starting point of writing this summary.)
