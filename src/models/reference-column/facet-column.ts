// models
import SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import SourceObjectNode from '@isrd-isi-edu/ermrestjs/src/models/source-object-node';
import { ReferenceColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import { CommentType } from '@isrd-isi-edu/ermrestjs/src/models/comment';
import { DisplayName } from '@isrd-isi-edu/ermrestjs/src/models/display-name';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';
import ErrorService from '@isrd-isi-edu/ermrestjs/src/services/error';

// utils
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { isDefinedAndNotNull, verify } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';
import { fixedEncodeURIComponent, simpleDeepCopy } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import {
  _contexts,
  _facetFilterTypes,
  _facetUXModes,
  _facetUXModeNames,
  _histogramSupportedTypes,
  _HTMLColumnType,
  _specialSourceDefinitions,
  _parserAliases,
} from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// legacy
import { parse } from '@isrd-isi-edu/ermrestjs/js/parser';
import { Column } from '@isrd-isi-edu/ermrestjs/js/core';
import { Reference, Tuple, _referenceCopy } from '@isrd-isi-edu/ermrestjs/js/reference';
import { type AttributeGroupReference } from '@isrd-isi-edu/ermrestjs/js/ag_reference';
import { _processColumnOrderList, _processSourceObjectComment } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';
import { _compressSource } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

interface FacetChoiceDisplayName {
  uniqueId: any;
  displayname: DisplayName;
  tuple: Tuple | null;
}

interface FacetFilterResult {
  reference: Reference;
  filter?: FacetFilter;
}

abstract class FacetFilter {
  public _column: Column;
  public term: unknown;
  public uniqueId: unknown;
  public facetFilterKey?: string;

  constructor(term: unknown, column: Column) {
    this._column = column;
    this.term = term;
    this.uniqueId = term;
  }

  /**
   * String representation of filter
   */
  toString(): string | null {
    if (this.term === null || this.term === undefined) {
      return null;
    }
    return this._column.formatvalue(this.term, _contexts.COMPACT_SELECT) as string;
  }

  /**
   * JSON representation of filter
   */
  toJSON(): any {
    return this.term;
  }
}

class SearchFacetFilter extends FacetFilter {
  public facetFilterKey: string;

  constructor(term: unknown, column: Column) {
    super(term, column);
    this.facetFilterKey = _facetFilterTypes.SEARCH;
  }
}

class ChoiceFacetFilter extends FacetFilter {
  public facetFilterKey: string;

  constructor(value: unknown, column: Column) {
    super(value, column);
    this.facetFilterKey = _facetFilterTypes.CHOICE;
  }
}

class RangeFacetFilter extends FacetFilter {
  public min: unknown;
  public minExclusive: boolean;
  public max: unknown;
  public maxExclusive: boolean;
  public facetFilterKey: string;

  constructor(min: unknown, minExclusive: boolean, max: unknown, maxExclusive: boolean, column: Column) {
    super(null, column);
    this.min = !isDefinedAndNotNull(min) ? null : min;
    this.minExclusive = minExclusive === true ? true : false;
    this.max = !isDefinedAndNotNull(max) ? null : max;
    this.maxExclusive = maxExclusive === true ? true : false;
    this.facetFilterKey = _facetFilterTypes.RANGE;
    this.uniqueId = this.toString();
  }

  /**
   * String representation of range filter. With the format of:
   *
   * - both min and max defined: `{{min}}-{{max}}`
   * - only min defined: `> {{min}}`
   * - only max defined: `< {{max}}`
   */
  toString(): string {
    const getValue = (isMin: boolean): string => {
      return this._column.formatvalue(isMin ? (this.min as string) : (this.max as string), _contexts.COMPACT_SELECT) as string;
    };

    // assumption: at least one of them is defined
    if (!isDefinedAndNotNull(this.max)) {
      return (this.minExclusive ? '> ' : '≥ ') + getValue(true);
    }
    if (!isDefinedAndNotNull(this.min)) {
      return (this.maxExclusive ? '< ' : '≤ ') + getValue(false);
    }
    return getValue(true) + ' to ' + getValue(false);
  }

  /**
   * JSON representation of range filter.
   */
  toJSON(): any {
    const res: any = {};
    if (isDefinedAndNotNull(this.max)) {
      res.max = this.max;
    }
    if (this.maxExclusive === true) {
      res.max_exclusive = true;
    }

    if (isDefinedAndNotNull(this.min)) {
      res.min = this.min;
    }
    if (this.minExclusive === true) {
      res.min_exclusive = true;
    }

    return res;
  }
}

class NotNullFacetFilter {
  public facetFilterKey: string;

  constructor() {
    this.facetFilterKey = 'not_null';
  }
}

/**
 * @param {Reference} reference the reference that this FacetColumn blongs to.
 * @param {int} index The index of this FacetColumn in the list of facetColumns
 * @param {SourceObjectWrapper} facetObjectWrapper The filter object that this FacetColumn will be created based on
 * @param {?FacetFilter[]} filters Array of filters
 */
export class FacetColumn {
  /**
   * The column object that the filters are based on
   */
  public _column: Column;

  /**
   * The reference that this facet blongs to
   */
  public reference: Reference;

  /**
   * The index of facetColumn in the list of facetColumns
   * NOTE: Might not be needed
   */
  public index: number;

  /**
   * A valid data-source path
   * NOTE: we're not validating this data-source, we assume that this is valid.
   */
  public dataSource: any;

  /**
   * the compressed version of data source data-source path
   */
  public compressedDataSource: any;

  /**
   * Filters that are applied to this facet.
   */
  public filters: Array<FacetFilter | NotNullFacetFilter>;

  // the whole filter object
  // NOTE: This might not include the filters
  public _facetObject: any;

  public sourceObjectWrapper: SourceObjectWrapper;

  public sourceObjectNodes: SourceObjectNode[];

  public lastForeignKeyNode?: SourceObjectNode;

  public foreignKeyPathLength: number;

  /**
   * Whether the source has path or not
   */
  public hasPath: boolean;

  /**
   * Returns true if the source is on a key column.
   * If facetObject['entity'] is defined as false, it will return false,
   * otherwise it will true if filter is based on key.
   */
  public isEntityMode: boolean;

  // Cached properties
  private _isOpen?: boolean;
  private _preferredMode?: string;
  private _barPlot?: boolean;
  private _numBuckets?: number;
  private _referenceColumn?: ReferenceColumn;
  private _sourceReference?: Reference;
  private _displayname?: DisplayName;
  private _comment?: CommentType;
  private _hideNullChoice?: boolean;
  private _hideNotNullChoice?: boolean;
  private _hideNumOccurrences?: boolean;
  private _sortColumns?: any[];
  private _scalarValuesRef?: AttributeGroupReference;
  private _fastFilterSource?: SourceObjectWrapper | null;
  private _hasNotNullFilter?: boolean;
  private _hasNullFilter?: boolean;
  private _searchFilters?: SearchFacetFilter[];
  private _choiceFilters?: ChoiceFacetFilter[];
  private _rangeFilters?: RangeFacetFilter[];

  constructor(reference: Reference, index: number, facetObjectWrapper: SourceObjectWrapper, filters?: FacetFilter[]) {
    this._column = facetObjectWrapper.column!;
    this.reference = reference;
    this.index = index;
    this.dataSource = facetObjectWrapper.sourceObject.source;
    this.compressedDataSource = _compressSource(this.dataSource);

    this.filters = [];
    if (Array.isArray(filters)) {
      this.filters = filters;
    } else {
      this._setFilters(facetObjectWrapper.sourceObject);
    }

    this._facetObject = facetObjectWrapper.sourceObject;
    this.sourceObjectWrapper = facetObjectWrapper;
    this.sourceObjectNodes = facetObjectWrapper.sourceObjectNodes;
    this.lastForeignKeyNode = facetObjectWrapper.lastForeignKeyNode;
    this.foreignKeyPathLength = facetObjectWrapper.foreignKeyPathLength;
    this.hasPath = facetObjectWrapper.hasPath;
    this.isEntityMode = facetObjectWrapper.isEntityMode;
  }

  /**
   * If has filters it will return true,
   * otherwise returns facetObject['open']
   */
  get isOpen(): boolean {
    if (this._isOpen === undefined) {
      const open = this._facetObject.open;
      this._isOpen = this.filters.length > 0 ? true : open === true;
    }
    return this._isOpen;
  }

  /**
   * The Preferred ux mode.
   * Any of:
   * `choices`, `ranges`, or `check_presence`
   * This should be used if we're not in entity mode. In entity mode it will
   * always return `choices`.
   *
   * The logic is as follows,
   * 1. if facet has only choice or range filter, return that.
   * 2. use ux_mode if available
   * 3. use choices if in entity mode
   * 4. return choices if int or serial, part of key, and not null.
   * 5. return ranges or choices based on the type.
   *
   *  Note:
   *   - null and not-null are applicaple in all types, so we're ignoring those while figuring out the preferred mode.
   */
  get preferredMode(): string {
    if (this._preferredMode === undefined) {
      const modes = _facetUXModes;

      // a facet is in range mode if it's column's type is integer, float, date, timestamp, or serial
      const isRangeMode = (column: Column): boolean => {
        const typename = column.type.rootName;

        //default facet for unique not null integer/serial should be choice (not range)
        if (typename.startsWith('serial') || typename.startsWith('int')) {
          return !column.isUniqueNotNull;
        }

        return typename.startsWith('float') || typename.startsWith('date') || typename.startsWith('timestamp') || typename.startsWith('numeric');
      };

      const getPreferredMode = (self: FacetColumn): string => {
        // see if only one type of facet is preselected
        let onlyChoice = false,
          onlyRange = false;

        // not-null and null can be applied to both choices and ranges
        let filterLen = self.filters.length,
          choiceFilterLen = self.choiceFilters.length;
        if (self.hasNotNullFilter) {
          filterLen--;
        }
        if (self.hasNullFilter) {
          filterLen--;
          choiceFilterLen--;
        }

        if (filterLen > 0) {
          onlyChoice = choiceFilterLen === filterLen;
          onlyRange = self.rangeFilters.length === filterLen;
        }
        // if only choices or ranges preselected, honor it
        if (onlyChoice || onlyRange) {
          return onlyChoice ? modes.CHOICE : modes.RANGE;
        }

        // use the defined ux_mode
        if (_facetUXModeNames.indexOf(self._facetObject.ux_mode) !== -1) {
          return self._facetObject.ux_mode;
        }

        // use the column type to determien its ux_mode
        return !self.isEntityMode && isRangeMode(self._column) ? modes.RANGE : modes.CHOICE;
      };

      this._preferredMode = getPreferredMode(this);
    }
    return this._preferredMode;
  }

  /**
   * Returns true if the plotly histogram graph should be shown in the UI
   * If _facetObject.barPlot is not defined, the value is true. By default
   * the histogram should be shown unless specified otherwise
   */
  get barPlot(): boolean {
    if (this._barPlot === undefined) {
      this._barPlot = this._facetObject.bar_plot === false ? false : true;

      // if it's not in the list of spported types we won't show it even if the user defined it in the annotation
      if (_histogramSupportedTypes.indexOf(this.column.type.rootName) === -1) {
        this._barPlot = false;
      }
    }
    return this._barPlot;
  }

  /**
   * Returns the value of `barPlot.nBins` if it was defined as part of the
   * `facetObject` in the annotation. If undefined, the default # of buckets is 30
   */
  get histogramBucketCount(): number {
    if (this._numBuckets === undefined) {
      this._numBuckets = 30;
      const barPlot = this._facetObject.bar_plot;
      if (barPlot && barPlot.n_bins) {
        this._numBuckets = barPlot.n_bins;
      }
    }
    return this._numBuckets!;
  }

  /**
   * ReferenceColumn that this facetColumn is based on
   */
  get column(): ReferenceColumn {
    if (this._referenceColumn === undefined) {
      this._referenceColumn = new ReferenceColumn(this.sourceReference, [this._column]);
    }
    return this._referenceColumn;
  }

  /**
   * uncontextualized {@link ERMrest.Reference} that has all the joins specified
   * in the source with all the filters of other FacetColumns in the reference.
   *
   * The returned reference will be in the following format:
   * <main-table>/<facets of main table except current facet>/<path to current facet>
   *
   *
   * Consider the following scenario:
   * Table T has two foreignkeys to R1 (fk1), R2 (fk2), and R3 (fk3).
   * R1 has a fitler for term=1, and R2 has a filter for term=2
   * Then the source reference for R3 will be the following:
   * T:=S:T/(fk1)/term=1/$T/(fk2)/term2/$T/M:=(fk3)
   * As you can see it has all the filters of the main table + join to current table.
   *
   * Notes:
   * - This function used to reverse the path from the current facet to each of the
   *   other facets in the main reference. Since this was very inefficient, we decided
   *   to rewrite it to start from the main table instead.
   * - The path from the main table to facet is based on the given column directive and
   *   therefore might have filters or reused table instances (shared path). That's why
   *   we're ensuring to pass the whole facetObjectWrapper to parser, so it can properly
   *   parse it.
   */
  get sourceReference(): Reference {
    if (this._sourceReference === undefined) {
      const jsonFilters: any[] = [];
      const table = this._column.table;
      const loc = this.reference.location;

      // TODO might be able to improve this
      if (typeof loc.searchTerm === 'string') {
        jsonFilters.push({ sourcekey: _specialSourceDefinitions.SEARCH_BOX, search: [loc.searchTerm] });
      }

      let newLoc = parse(loc.compactUri, loc.catalogObject);

      //get all the filters from other facetColumns
      if (loc.facets) {
        // create new facet filters
        // TODO might be able to imporve this. Instead of recreating the whole json file.
        this.reference.facetColumns.forEach((fc: FacetColumn, index: number) => {
          if (index !== this.index && fc.filters.length !== 0) {
            jsonFilters.push(fc.toJSON());
          }
        });

        // apply the hidden filters
        loc.facets.andFilters.forEach((f: any) => {
          if (f.hidden) {
            jsonFilters.push(f);
          }
        });
      }

      if (jsonFilters.length > 0) {
        newLoc.facets = { and: jsonFilters };
      } else {
        newLoc.facets = null;
      }

      // add custom facets as the facets of the parent
      const alias = _parserAliases.JOIN_TABLE_PREFIX + (newLoc.hasJoin ? newLoc.pathParts.length : '');
      if (loc.customFacets) {
        //NOTE this is just a hack, and since the whole feature is just a hack it's fine.
        // In the ermrest_path we're allowing them to use the M alias. In here, we are making
        // sure to change the M alias to T. Because we're going to use T to refer to the main
        // reference when the facet has a path. In other words if the following is main reference
        // M:=S:main_table/cutom-facet-that-might-have-$M-alias/facets-on-the-main-table
        //
        // Then the source reference for any of the facets will be
        //
        // T:=S:main_table/custom-facet-that-should-change-$M-to-$T/facets-on-the-main-table/join-path-to-current-facet/$M:=S:facet_table
        //
        // You can see why we are changing $M to $T.
        //
        // As I mentioned this is hacky, so we should eventually find a way around this.
        const cfacet = simpleDeepCopy(loc.customFacets.decoded);
        if (cfacet.ermrest_path && this.sourceObjectNodes.length > 0) {
          // switch the alias names, the cfacet is originally written with the assumption of
          // the main table having "M" alias. So we just have to swap the aliases.
          const mainAlias = _parserAliases.MAIN_TABLE;
          cfacet.ermrest_path = cfacet.ermrest_path.replaceAll('$' + mainAlias, '$' + alias);
        }
        newLoc.customFacets = cfacet;
      }

      /**
       * if it has path, we have to pass the whole facetObjectWrapper
       * as a join. this is so we can properly share path
       */
      if (this.hasPath) {
        newLoc = newLoc.addJoin(this.sourceObjectWrapper, table.schema.name, table.name);
      }
      // if it only has filter (and no path, then we can just add the filter to path)
      else if (this.sourceObjectWrapper.isFiltered) {
        // TODO can this be improved?
        const filterPath = this.sourceObjectWrapper.toString(false, false);
        if (filterPath.length > 0) {
          newLoc = parse(newLoc.compactUri + '/' + filterPath);
        }
      }

      this._sourceReference = new Reference(newLoc, table.schema.catalog);
    }
    return this._sourceReference;
  }

  /**
   * Returns the displayname object that should be used for this facetColumn.
   * TODO the heuristics should be changed to be aligned with PseudoColumn
   * Heuristics are as follows (first applicable rule):
   *  0. If markdown_name is defined, use it.
   *  1. If column is part of the main table (there's no join), use the column's displayname.
   *  2. If last foreignkey is outbound and has to_name, use it.
   *  3. If last foreignkey is inbound and has from_name, use it.
   *  4. Otherwise use the table name.
   *    - If it's in `scalar` mode, append the column name. `table_name (column_name)`.
   *
   * Returned object has `value`, `unformatted`, and `isHTML` properties.
   */
  get displayname(): DisplayName {
    if (this._displayname === undefined) {
      const getDisplayname = (self: FacetColumn): DisplayName => {
        if (self._facetObject.markdown_name) {
          return {
            value: renderMarkdown(self._facetObject.markdown_name, true),
            unformatted: self._facetObject.markdown_name,
            isHTML: true,
          };
        }

        const lastFK = self.lastForeignKeyNode ? self.lastForeignKeyNode.nodeObject : null;

        // if is part of the main table, just return the column's displayname
        if (lastFK === null) {
          return self.column.displayname;
        }

        // Otherwise
        let value: string,
          unformatted: string,
          isHTML = false;
        const lastFKIsInbound = self.lastForeignKeyNode!.isInbound;
        const lastFKDisplay = lastFK.getDisplay(_contexts.COMPACT_SELECT);

        // use from_name of the last fk if it's inbound
        if (lastFKIsInbound && lastFKDisplay.fromName) {
          value = unformatted = lastFKDisplay.fromName;
        }
        // use to_name of the last fk if it's outbound
        else if (!lastFKIsInbound && lastFKDisplay.toName) {
          value = unformatted = lastFKDisplay.toName;
        }
        // use the table name if it was not defined
        else {
          value = self.column.table.displayname.value;
          unformatted = self.column.table.displayname.unformatted;
          isHTML = self.column.table.displayname.isHTML;

          if (!self.isEntityMode) {
            value += ' (' + self.column.displayname.value + ')';
            unformatted += ' (' + self.column.displayname.unformatted + ')';
            if (!isHTML) {
              isHTML = self.column.displayname.isHTML;
            }
          }
        }

        return { value: value, isHTML: isHTML, unformatted: unformatted };
      };

      this._displayname = getDisplayname(this);
    }
    return this._displayname;
  }

  /**
   * Could be used as tooltip to provide more information about the facetColumn
   */
  get comment(): CommentType {
    if (this._comment === undefined) {
      let commentDisplayMode: any, disp: any;
      if (!this.isEntityMode) {
        disp = this._column.getDisplay(_contexts.COMPACT_SELECT);
        commentDisplayMode = disp.commentDisplayMode;
      } else {
        disp = this._column.table.getDisplay(_contexts.COMPACT_SELECT);
        commentDisplayMode = disp.tableCommentDisplayMode;
      }
      this._comment = _processSourceObjectComment(
        this._facetObject,
        disp.comment ? disp.comment.unformatted : null,
        disp.commentRenderMarkdown,
        commentDisplayMode,
      );
    }
    return this._comment!;
  }

  /**
   * Whether client should hide the null choice.
   *
   * Before going through the logic, it's good to know the following:
   * -`null` filter could mean any of the following:
   *   - Scalar value being `null`. In terms of ermrest, a simple col::null:: query
   *   - No value exists in the given path (checking presence of a value in the path). In terms of ermrest,
   *     we have to construct an outer join. For performance we're going to use right outer join.
   *     Because of ermrest limitation, we cannot have more than two right outer joins and therefore
   *     two such null checks cannot co-exist.
   * - Since we're not going to show two different options for these two meanings,
   *   we have to make sure to offer `null` option when only one of these two meanings would make sense.
   * - There are some cases when the `null` is not even possible based on the model. So we shouldn't offer this option.
   * - Due to ermrest and our parse limitations, facets with filter cannot support null.
   *
   * Therefore, the following is the logic for this function:
   *   1. If the facet already has `null` filter, return `false`.
   *   2. If facet has `"hide_null_choice": true`, return `true`.
   *   3. If facet has filer, return `true` as our parse can't handle it.
   *   4. If it's a local column,
   *     4.1. if it's not-null, return `true`.
   *     4.2. if it's nullable, return `false`.
   *   5. If it's an all-outbound path where all the columns in the path are not-null,
   *     5.1. If the end column is nullable, return `false` as null value only means scalar value being null.
   *     5.2. If the end column is not-null, return `true` as null value is not possible.
   *   6. For any other paths, if the end column is nullable, `null` filter could mean both scalar and path. so return `true`.
   *   7. Facets with only one hop where the column used in foreignkey is the same column for faceting.
   *      In this case, we can completely ignore the foreignkey path and just do a value check on main table. so return `false`.
   *   8. any other cases (facet with arbiarty path),
   *    8.1. if other facets have `null` filter, return `true` as we cannot support multiple right outer joins.
   *    8.2. otherwise, return `false`.
   *
   * NOTE this function used to check for select access as well as versioned catalog,
   * but we decided to remove them since it's not the desired behavior:
   * https://github.com/informatics-isi-edu/ermrestjs/issues/888
   */
  get hideNullChoice(): boolean {
    if (this._hideNullChoice === undefined) {
      const getHideNull = (self: FacetColumn): boolean => {
        // if null filter exists, we have to show it
        if (self.hasNullFilter) {
          return false;
        }

        // if facet definition tells us to hide it
        if (self._facetObject.hide_null_choice === true) {
          return true;
        }

        // parse cannot support this
        if (self.sourceObjectWrapper.isFiltered) {
          return true;
        }

        // local column
        if (self.foreignKeyPathLength === 0) {
          return !self._column.nullok;
        }

        // path cannot be null
        if (self.sourceObjectWrapper.isAllOutboundNotNullPerModel) {
          /**
           * if the last column is not-null, then "null" can never happen so there's no point in showing the option.
           * but if it's nullable, then this check could only mean scalar value being null and so we can show null facet
           */
          return !self._column.nullok;
        }

        // has arbitary path
        if (self._column.nullok) {
          return true;
        }

        // G3.1
        if (!self.hasPath) {
          return false;
        }

        // G3
        const othersHaveNull =
          self.reference.location.isUsingRightJoin ||
          self.reference.facetColumns.some((fc: FacetColumn, index: number) => {
            return index !== self.index && fc.hasNullFilter && fc.hasPath;
          });

        return othersHaveNull;
      };
      this._hideNullChoice = getHideNull(this);
    }
    return this._hideNullChoice;
  }

  /**
   * Whether client should hide the not-null choice. The logic is as follows:
   * - `false` if facet has not-null filter.
   * - `true` if facet has hide_not_null_choice in it's definition
   * - `true` if facet is from the same table and it's not-nullable.
   * - `true` if facet is all outbound not null.
   * - otherwise `false`
   */
  get hideNotNullChoice(): boolean {
    if (this._hideNotNullChoice === undefined) {
      const getHideNotNull = (self: FacetColumn): boolean => {
        // if not-null filter exists
        if (self.hasNotNullFilter) return false;

        // if hide_not_null_choice is available in facet definition
        if (self._facetObject.hide_not_null_choice === true) return true;

        //if from the same table, don't show if it's not-null
        if (self.sourceObjectWrapper.foreignKeyPathLength === 0) {
          return !self._column.nullok;
        }

        //if all outbound not-null don't show it.
        return self.sourceObjectWrapper.isAllOutboundNotNullPerModel && !self._column.nullok;
      };

      this._hideNotNullChoice = getHideNotNull(this);
    }
    return this._hideNotNullChoice;
  }

  /**
   * Whether we should hide the number of Occurrences column
   */
  get hideNumOccurrences(): boolean {
    if (this._hideNumOccurrences === undefined) {
      this._hideNumOccurrences = this._facetObject.hide_num_occurrences === true;
    }
    return this._hideNumOccurrences;
  }

  /**
   * Returns the sortColumns when we're sorting this facet in scalar mode
   * - uses row_order if defined.
   * - otherwise it will be descending of num_occurrences and column order of base column.
   */
  get sortColumns(): any[] {
    verify(!this.isEntityMode, 'sortColumns cannot be used in entity mode.');

    if (this._sortColumns === undefined) {
      this._determineSortable();
    }
    return this._sortColumns!;
  }

  private _determineSortable(): void {
    const rowOrder = _processColumnOrderList(this._facetObject.order, this._column.table, { allowNumOccurrences: true });

    // default sorting:
    // - descending frequency + ascending the column sort columns
    if (!Array.isArray(rowOrder) || rowOrder.length === 0) {
      this._sortColumns = [
        { num_occurrences: true, descending: true },
        { column: this._column, descending: false },
      ];
      return;
    }

    this._sortColumns = rowOrder;
  }

  /**
   * An {@link ERMrest.AttributeGroupReference} object that can be used to get
   * the available scalar values of this facet. This will use the sortColumns, and hideNumOccurrences APIs.
   * It will throw an error if it's used in entity-mode.
   */
  get scalarValuesReference(): AttributeGroupReference {
    verify(!this.isEntityMode, 'this API cannot be used in entity-mode');

    if (this._scalarValuesRef === undefined) {
      this._scalarValuesRef = this.column.groupAggregate!.entityCounts(this.displayname, this.sortColumns, this.hideNumOccurrences, true);
    }
    return this._scalarValuesRef;
  }

  get fastFilterSourceObjectWrapper(): SourceObjectWrapper | null {
    if (this._fastFilterSource === undefined) {
      let res: SourceObjectWrapper | null = null;
      const fastFilter = this._facetObject.fast_filter_source;
      if (fastFilter !== undefined || fastFilter !== null) {
        try {
          res = new SourceObjectWrapper({ source: fastFilter }, this.reference.table, true);
        } catch {
          $log.warn('given fast_filter_source for facet index=`' + this.index + '` is not valid.');
          res = null;
        }
      }
      this._fastFilterSource = res;
    }
    return this._fastFilterSource;
  }

  /**
   * When presenting the applied choice filters, the displayname might be differnt from the value.
   * This only happens in case of entity-picker. Othercases we can just return the list of fitleres as is.
   * In case of entity-picker, we should get the displayname of the choices.
   * Therefore heuristic is as follows:
   *  - If no fitler -> resolve with empty list.
   *  - If in scalar mode -> resolve with list of filters (don't change their displaynames.)
   *  - Otherwise (entity-mode) -> generate an ermrest request to get the displaynames.
   *
   * NOTE This function will not return the null filter.
   * NOTE the request might not return any result for a given filter (because of user access or missing data),
   *      in this case, we will return the raw value instead.
   *
   * @param contextHeaderParams object that we want to be logged with the request
   * @return A promise resolved with list of objects that have `uniqueId`, and `displayname`.
   */
  async getChoiceDisplaynames(contextHeaderParams: any): Promise<FacetChoiceDisplayName[]> {
    const filters: FacetChoiceDisplayName[] = [];
    const table = this._column.table;
    const column = this._column;
    const columnName = this._column.name;
    // whether the output must be displayed as markdown or not
    const isHTML = _HTMLColumnType.indexOf(this._column.type.name) !== -1;

    const createRef = (filterStrs: string[]): Reference => {
      const uri = [
        table.schema.catalog.server.uri,
        'catalog',
        table.schema.catalog.id,
        'entity',
        fixedEncodeURIComponent(table.schema.name) + ':' + fixedEncodeURIComponent(table.name),
        filterStrs.join(';'),
      ].join('/');

      let ref = new Reference(parse(uri), table.schema.catalog).contextualize.compactSelect;
      ref = ref.sort([{ column: columnName, descending: false }]);
      return ref;
    };

    const convertChoiceFilter = (f: ChoiceFacetFilter): FacetChoiceDisplayName => {
      let displayedValue = f.toString();
      if (column.type.name === 'json' || column.type.name === 'jsonb') {
        /**
         * If the value is already a valid string representation of a JSON object,
         * return it as is. otherwise use the toString which will turn the object into a string.
         */
        try {
          void JSON.parse(f.term as any);
          displayedValue = f.term as string;
        } catch {
          /* empty */
        }
      }
      return {
        uniqueId: f.term,
        displayname: {
          value: isHTML ? renderMarkdown(displayedValue!, true) : displayedValue!,
          isHTML: isHTML,
        },
        tuple: null,
      };
    };

    // if no filter, just return empty list.
    if (this.choiceFilters.length === 0) {
      return filters;
    }
    // in scalar mode, use the their toString as displayname.
    else if (!this.isEntityMode) {
      this.choiceFilters.forEach((f: ChoiceFacetFilter) => {
        // don't return the null filter
        if (f.term === null || f.term === undefined) return;

        filters.push(convertChoiceFilter(f));
      });
      return filters;
    }
    // otherwise generate an ermrest request to get the displaynames.
    else {
      // if we already fetched the page, then just use it
      if (this.sourceObjectWrapper.entityChoiceFilterTuples) {
        this.sourceObjectWrapper.entityChoiceFilterTuples.forEach((t: Tuple) => {
          filters.push({ uniqueId: t.data[columnName], displayname: t.displayname, tuple: t });
        });
        return filters;
      }

      const filterStr: string[] = []; // used for generating the request
      const filterTerms: Record<string, number> = {}; // used for figuring out if there are any filter that didn't return result
      // key is the term, value is the index in self.choiceFilters

      // list of filters that we want their displaynames.
      this.choiceFilters.forEach((f: ChoiceFacetFilter, index: number) => {
        // don't return the null filter
        if (f.term == null) {
          return;
        }

        filterStr.push(fixedEncodeURIComponent(columnName) + '=' + fixedEncodeURIComponent(f.term as string));
        filterTerms[f.term as string] = index;
      });

      // the case that we have only the null value.
      if (filterStr.length === 0) {
        return filters;
      }

      try {
        // create a url
        const page = await createRef(filterStr).read(this.choiceFilters.length, contextHeaderParams, true);

        // add the pages that we got
        page.tuples.forEach((t: Tuple) => {
          filters.push({ uniqueId: t.data[columnName], displayname: t.displayname, tuple: t });

          // remove it from the term list
          delete filterTerms[t.data[columnName]];
        });

        // if there are any filter terms that didn't match any rows, just return the raw value:
        // NOTE we could merge these two (page and filter) together to make the code easier to follow,
        //      but we want to keep the selected values ordered based on roworder and
        //      not based on the order of filters in the url

        // sort the keys for deterministic output (based on the original order of filters in the url)
        const filterTermKeys = Object.keys(filterTerms).sort((a: string, b: string) => {
          return filterTerms[a] - filterTerms[b];
        });

        // add the terms to filter list
        filterTermKeys.forEach((k: string) => {
          filters.push(convertChoiceFilter(this.choiceFilters[filterTerms[k]]));
        });

        return filters;
      } catch (err: unknown) {
        throw ErrorService.responseToError(err);
      }
    }
  }

  /**
   * Return JSON presentation of the filters. This will be used in the location.
   * Anything that we want to leak to the url should be here.
   * It will be in the following format:
   *
   * ```
   * {
   *    "source": <data-source>,
   *    "choices": [v, ...],
   *    "ranges": [{"min": v1, "max": v2}, ...],
   *    "search": [v, ...],
   *    "not_null": true
   * }
   * ```
   */
  toJSON(): any {
    const res: any = { source: Array.isArray(this.dataSource) ? this.dataSource.slice() : this.dataSource };

    // to avoid adding more than one null for json.
    const hasJSONNull: Record<string, boolean> = {};
    for (let i = 0, f; i < this.filters.length; i++) {
      f = this.filters[i];

      if (f.facetFilterKey === 'not_null' || f instanceof NotNullFacetFilter) {
        res.not_null = true;
        continue;
      }

      if (!(f.facetFilterKey! in res)) {
        res[f.facetFilterKey!] = [];
      }

      if ((this._column.type.name === 'json' || this._column.type.name === 'jsonb') && f.facetFilterKey === 'choices') {
        /*
         * We cannot distinguish between json `null` in sql and actual `null`,
         * therefore in other parts of code we're treating them the same.
         * But to generate the filters, we have to add these two cases,
         * that's why we're adding two values for null.
         */
        if (f.term === null || f.term === 'null') {
          if (!hasJSONNull[f.facetFilterKey!]) {
            res[f.facetFilterKey!].push(null, 'null');
          }
          hasJSONNull[f.facetFilterKey!] = true;
        } else {
          let value = f.term;
          /**
           * If the value is already a valid string representation of a JSON object,
           * return it as is. otherwise turn it into a string.
           */
          try {
            void JSON.parse(f.term as any);
          } catch {
            value = JSON.stringify(f.term);
          }

          res[f.facetFilterKey!].push(value);
        }
      } else {
        res[f.facetFilterKey!].push(f.toJSON());
      }
    }

    return res;
  }

  /**
   * Given an object will create list of filters.
   *
   * NOTE: if we have not_null, other filters except =null are not relevant.
   * That means if we saw not_null:
   * 1. If =null exist, then set the filters to empty array.
   * 2. otherwise set the filter to just the not_null
   *
   * Expected object format format:
   * ```
   * {
   *    "source": <data-source>,
   *    "choices": [v, ...],
   *    "ranges": [{"min": v1, "max": v2}, ...],
   *    "search": [v, ...],
   *    "not_null": true
   * }
   * ```
   *
   * @param json JSON representation of filters
   */
  private _setFilters(json: any): void {
    let current: FacetFilter | undefined;
    let hasNotNull = false;
    this.filters = [];

    if (!isDefinedAndNotNull(json)) {
      return;
    }

    // if there's a not_null other filters are not applicable.
    if (json.not_null === true) {
      this.filters.push(new NotNullFacetFilter());
      hasNotNull = true;
    }

    // create choice filters
    if (Array.isArray(json[_facetFilterTypes.CHOICE])) {
      json[_facetFilterTypes.CHOICE].forEach((ch: any) => {
        /*
         * We cannot distinguish between json `null` in sql and actual `null`,
         * therefore we should treat them the same.
         */
        if (this._column.type.name === 'json' || this._column.type.name === 'jsonb') {
          if (ch === null || ch === 'null') {
            ch = null;
          }
        }

        if (hasNotNull) {
          // if not-null filter exists, the only relevant filter is =null.
          // Other filters will be ignored.
          // If =null exist, we are removing all the filters.
          if (ch === null) {
            this.filters = [];
          }
          return;
        }

        current = this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
          return f instanceof ChoiceFacetFilter && f.term === ch;
        })[0] as ChoiceFacetFilter | undefined;

        if (current !== undefined) {
          return; // don't add duplicate
        }

        this.filters.push(new ChoiceFacetFilter(ch, this._column));
      });
    }

    // create range filters
    if (!hasNotNull && Array.isArray(json[_facetFilterTypes.RANGE])) {
      json[_facetFilterTypes.RANGE].forEach((ch: any) => {
        current = this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
          return f instanceof RangeFacetFilter && f.min === ch.min && f.max === ch.max;
        })[0] as RangeFacetFilter | undefined;

        if (current !== undefined) {
          return; // don't add duplicate
        }

        this.filters.push(new RangeFacetFilter(ch.min, ch.min_exclusive, ch.max, ch.max_exclusive, this._column));
      });
    }

    // create search filters
    if (!hasNotNull && Array.isArray(json[_facetFilterTypes.SEARCH])) {
      json[_facetFilterTypes.SEARCH].forEach((ch: unknown) => {
        current = this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
          return f instanceof SearchFacetFilter && f.term === ch;
        })[0] as SearchFacetFilter | undefined;

        if (current !== undefined) {
          return; // don't add duplicate
        }

        this.filters.push(new SearchFacetFilter(ch, this._column));
      });
    }
  }

  /**
   * Returns true if the not-null filter exists.
   */
  get hasNotNullFilter(): boolean {
    if (this._hasNotNullFilter === undefined) {
      this._hasNotNullFilter =
        this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
          return f instanceof NotNullFacetFilter;
        })[0] !== undefined;
    }
    return this._hasNotNullFilter;
  }

  /**
   * Returns true if choice null filter exists.
   */
  get hasNullFilter(): boolean {
    if (this._hasNullFilter === undefined) {
      this._hasNullFilter =
        this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
          return f instanceof ChoiceFacetFilter && (f.term === null || f.term === undefined);
        })[0] !== undefined;
    }
    return this._hasNullFilter;
  }

  /**
   * search filters
   * NOTE ASSUMES that filters is immutable
   */
  get searchFilters(): SearchFacetFilter[] {
    if (this._searchFilters === undefined) {
      this._searchFilters = this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
        return f instanceof SearchFacetFilter;
      }) as SearchFacetFilter[];
    }
    return this._searchFilters;
  }

  /**
   * choice filters
   * NOTE ASSUMES that filters is immutable
   */
  get choiceFilters(): ChoiceFacetFilter[] {
    if (this._choiceFilters === undefined) {
      this._choiceFilters = this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
        return f instanceof ChoiceFacetFilter;
      }) as ChoiceFacetFilter[];
    }
    return this._choiceFilters;
  }

  /**
   * range filters
   * NOTE ASSUMES that filters is immutable
   */
  get rangeFilters(): RangeFacetFilter[] {
    if (this._rangeFilters === undefined) {
      this._rangeFilters = this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
        return f instanceof RangeFacetFilter;
      }) as RangeFacetFilter[];
    }
    return this._rangeFilters;
  }

  /**
   * Create a new Reference with appending a new Search filter to current FacetColumn
   * @param term the term for search
   * @return the Reference with the new filter
   */
  addSearchFilter(term: string): Reference {
    verify(isDefinedAndNotNull(term), '`term` is required.');

    const filters = this.filters.slice();
    filters.push(new SearchFacetFilter(term, this._column));

    return this._applyFilters(filters);
  }

  /**
   * Create a new Reference with appending a list of choice filters to current FacetColumn
   * @return the reference with the new filter
   */
  addChoiceFilters(values: unknown[]): Reference {
    verify(Array.isArray(values), 'given argument must be an array');

    const filters = this.filters.slice();
    values.forEach((v: any) => {
      filters.push(new ChoiceFacetFilter(v, this._column));
    });

    return this._applyFilters(filters);
  }

  /**
   * Create a new Reference with replacing choice facet filters by the given input
   * This will also remove NotNullFacetFilter
   * @return the reference with the new filter
   */
  replaceAllChoiceFilters(values: unknown[]): Reference {
    verify(Array.isArray(values), 'given argument must be an array');
    const filters = this.filters.slice().filter((f: FacetFilter | NotNullFacetFilter) => {
      return !(f instanceof ChoiceFacetFilter) && !(f instanceof NotNullFacetFilter);
    });
    values.forEach((v: any) => {
      filters.push(new ChoiceFacetFilter(v, this._column));
    });

    return this._applyFilters(filters);
  }

  /**
   * Given a term, it will remove any choice filter with that term (if any).
   * @param terms array of terms
   * @return the reference with the new filter
   */
  removeChoiceFilters(terms: unknown[]): Reference {
    verify(Array.isArray(terms), 'given argument must be an array');
    const filters = this.filters.slice().filter((f: FacetFilter | NotNullFacetFilter) => {
      return !(f instanceof ChoiceFacetFilter) || terms.indexOf(f.term) === -1;
    });
    return this._applyFilters(filters);
  }

  /**
   * Create a new Reference with appending a new range filter to current FacetColumn
   * @param min minimum value. Can be null or undefined.
   * @param minExclusive whether the minimum boundary is exclusive or not.
   * @param max maximum value. Can be null or undefined.
   * @param maxExclusive whether the maximum boundary is exclusive or not.
   * @return the reference with the new filter
   */
  addRangeFilter(min?: unknown, minExclusive?: boolean, max?: unknown, maxExclusive?: boolean): FacetFilterResult | false {
    verify(isDefinedAndNotNull(min) || isDefinedAndNotNull(max), 'One of min and max must be defined.');

    const current = this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
      // eslint-disable-next-line eqeqeq
      return f instanceof RangeFacetFilter && f.min === min && f.max === max && f.minExclusive == minExclusive && f.maxExclusive == maxExclusive;
    })[0];

    if (current !== undefined) {
      return false;
    }

    const filters = this.filters.slice();
    const newFilter = new RangeFacetFilter(min, minExclusive || false, max, maxExclusive || false, this._column);
    filters.push(newFilter);

    return {
      reference: this._applyFilters(filters),
      filter: newFilter,
    };
  }

  /**
   * Create a new Reference with removing any range filter that has the given min and max combination.
   * @param min minimum value. Can be null or undefined.
   * @param minExclusive whether the minimum boundary is exclusive or not.
   * @param max maximum value. Can be null or undefined.
   * @param maxExclusive whether the maximum boundary is exclusive or not.
   * @return the reference with the new filter
   */
  removeRangeFilter(min?: unknown, minExclusive?: boolean, max?: unknown, maxExclusive?: boolean): FacetFilterResult {
    //TODO needs refactoring
    verify(isDefinedAndNotNull(min) || isDefinedAndNotNull(max), 'One of min and max must be defined.');
    const filters = this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
      return (
        // eslint-disable-next-line eqeqeq
        !(f instanceof RangeFacetFilter) || !(f.min === min && f.max === max && f.minExclusive == minExclusive && f.maxExclusive == maxExclusive)
      );
    });
    return {
      reference: this._applyFilters(filters),
    };
  }

  /**
   * Create a new Reference with removing all the filters and adding a not-null filter.
   * NOTE based on current usecases this is currently removing all the previous filters.
   * We might need to change this behavior in the future. I could change the behavior of
   * this function to only add the filter, and then in the client first remove all and thenadd
   * addNotNullFilter, but since the code is not very optimized that would result on a heavy
   * operation.
   */
  addNotNullFilter(): Reference {
    return this._applyFilters([new NotNullFacetFilter()]);
  }

  /**
   * Create a new Reference without any filters.
   */
  removeNotNullFilter(): Reference {
    const filters = this.filters.filter((f: FacetFilter | NotNullFacetFilter) => {
      return !(f instanceof NotNullFacetFilter);
    });
    return this._applyFilters(filters);
  }

  /**
   * Create a new Reference by removing all the filters from current facet.
   * @return the reference with the new filter
   */
  removeAllFilters(): Reference {
    return this._applyFilters([]);
  }

  /**
   * Create a new Reference by removing a filter from current facet.
   * @param index index of element that we want to remove from list
   * @return the reference with the new filter
   */
  removeFilter(index: number): Reference {
    const filters = this.filters.slice();
    filters.splice(index, 1);

    return this._applyFilters(filters);
  }

  /**
   * Given an array of {@link ERMrest.FacetFilter}, will return a new
   * {@link ERMrest.Reference} with the applied filters to the current FacetColumn
   * @private
   * @param filters array of filters
   * @return the reference with the new filter
   */
  private _applyFilters(filters: (FacetFilter | NotNullFacetFilter)[]): Reference {
    const loc = this.reference.location;
    const newReference = _referenceCopy(this.reference);
    newReference._facetColumns = [];

    // create a new FacetColumn so it doesn't reference to the current FacetColum
    // TODO can be refactored
    const jsonFilters: any[] = [];

    // TODO might be able to imporve this. Instead of recreating the whole json file.
    // gather all the filters from the facetColumns
    // NOTE: this part can be improved so we just change one JSON element.
    let newFc: FacetColumn;
    this.reference.facetColumns.forEach((fc: FacetColumn) => {
      if (fc.index !== this.index) {
        newFc = new FacetColumn(newReference, fc.index, fc.sourceObjectWrapper, fc.filters.slice() as FacetFilter[]);
      } else {
        newFc = new FacetColumn(newReference, this.index, this.sourceObjectWrapper, filters as FacetFilter[]);
      }

      newReference._facetColumns.push(newFc);

      if (newFc.filters.length !== 0) {
        jsonFilters.push(newFc.toJSON());
      }
    });

    newReference._location = this.reference._location._clone(newReference);
    newReference._location.beforeObject = null;
    newReference._location.afterObject = null;

    // TODO might be able to improve this
    if (typeof loc.searchTerm === 'string') {
      jsonFilters.push({ sourcekey: _specialSourceDefinitions.SEARCH_BOX, search: [this.reference.location.searchTerm] });
    }

    // apply the hidden facets
    if (loc.facets) {
      loc.facets.andFilters.forEach((f: any) => {
        if (f.hidden) {
          jsonFilters.push(f);
        }
      });
    }

    // change the facets in location object
    if (jsonFilters.length > 0) {
      newReference._location.facets = { and: jsonFilters };
    } else {
      newReference._location.facets = null;
    }

    return newReference;
  }
}
