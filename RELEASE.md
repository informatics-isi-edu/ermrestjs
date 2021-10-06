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

<!-- # 11/30/21 -->
<!-- #912 PR -->
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
