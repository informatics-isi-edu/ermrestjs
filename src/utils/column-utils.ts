// models
import {
  AssetPseudoColumn,
  ForeignKeyPseudoColumn,
  InboundForeignKeyPseudoColumn,
  KeyPseudoColumn,
  PseudoColumn,
  ReferenceColumn,
  VirtualColumn,
} from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import type SourceObjectWrapper from '@isrd-isi-edu/ermrestjs/src/models/source-object-wrapper';
import { generateRelatedReference, type Reference, type Tuple, type VisibleColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference';

// utils
import { _contexts } from '@isrd-isi-edu/ermrestjs/src/utils/constants';
import { renderMarkdown } from '@isrd-isi-edu/ermrestjs/src/utils/markdown-utils';
import { isDefinedAndNotNull } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

// legacy
import {
  _formatUtils,
  _generateRowPresentation,
  _getRowTemplateVariables,
  _processColumnOrderList,
  _renderTemplate,
} from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

/**
 * Convert the raw value of an aggregate column to a formatted value.
 * @param rawValue the raw value that the database returns (might be a row or just an scalar value)
 * @param pseudoColumn the pseudo column that this value belongs to
 */
export function processAggregateValue(rawValue: any, pseudoColumn: any, aggFn: string, isRow: boolean) {
  const column = pseudoColumn.baseColumns[0];
  const sourceMarkdownPattern = pseudoColumn.display.sourceMarkdownPattern;
  const sourceTemplateEngine = pseudoColumn.display.sourceTemplateEngine;

  // use `compact` context for entity array aggregates
  const context = isRow ? _contexts.COMPACT : pseudoColumn._context;

  // array_options
  let columnOrder: any, maxLength: number;
  if (aggFn.indexOf('array') !== -1 && typeof pseudoColumn.sourceObject.array_options === 'object') {
    // order
    if (pseudoColumn.sourceObject.array_options.order) {
      columnOrder = _processColumnOrderList(pseudoColumn.sourceObject.array_options.order, column.table);
    }

    // max_length
    if (Number.isInteger(pseudoColumn.sourceObject.array_options.max_length)) {
      maxLength = pseudoColumn.sourceObject.array_options.max_length;
    }
  }

  // will format a single value
  const getFormattedValue = function (val: any) {
    if (isRow) {
      const pres = _generateRowPresentation(pseudoColumn.key, val, context, pseudoColumn._getShowForeignKeyLink(context));
      return pres ? pres.unformatted : null;
    }
    if (!isDefinedAndNotNull(val) || val === '') {
      return val;
    }
    return column.formatvalue(val, context);
  };

  // it will sort the array values and then format them.
  const getArrayValue = function (val: any[]) {
    // try to sort the values
    try {
      val.sort(function (a, b) {
        // order is not defined, just sort based on the column value
        if (!columnOrder || columnOrder.length === 0) {
          // if isRow, a and b will be objects
          if (isRow) {
            return column.compare(a[column.name], b[column.name]);
          }
          return column.compare(a, b);
        }

        // sort the values based on the defined `order`
        for (let j = 0; j < columnOrder.length; j++) {
          const col = columnOrder[j].column;
          let comp;

          // if it's not row, it will be just array of results
          if (!isRow) {
            // ignore invalid order options
            if (col.name !== column.name) continue;
            comp = col.compare(a, b);
          } else {
            comp = col.compare(a[col.name], b[col.name]);
          }

          // if they are equal go to the next column in `order`
          if (comp !== 0) {
            return (columnOrder[j].descending ? -1 : 1) * comp;
          }
        }

        // they are equal
        return 0;
      });
    } catch {
      // if sort threw any erros, we just leave it as is
    }

    // limit the values
    if (maxLength) {
      val = val.slice(0, maxLength);
    }

    // formatted array result
    const arrayRes = _formatUtils.printArray(val.map(getFormattedValue), {
      isMarkdown: column.type.name === 'markdown' || isRow,
      returnArray: true,
    }) as string[];

    let res = '';
    // find array display
    let array_display = pseudoColumn.sourceObject.array_display;
    if (pseudoColumn.sourceObject.display && typeof pseudoColumn.sourceObject.display.array_ux_mode === 'string') {
      array_display = pseudoColumn.sourceObject.display.array_ux_mode;
    }

    // print the array in a comma seperated value (list) or bullets
    switch (array_display) {
      case 'ulist':
        arrayRes.forEach(function (arrayVal) {
          res += '* ' + arrayVal + ' \n';
        });
        break;
      case 'olist':
        arrayRes.forEach(function (arrayVal, i) {
          res += i + 1 + '. ' + arrayVal + ' \n';
        });
        break;
      case 'raw':
        res = arrayRes.join(' ');
        break;
      default: //csv
        res = arrayRes.join(', ');
    }

    // populate templateVariables
    let templateVariables = {};
    if (!isRow) {
      templateVariables = { $self: res, $_self: val };
    } else {
      templateVariables = {
        $self: val.map(function (v) {
          return _getRowTemplateVariables(column.table, context, v);
        }),
      };
    }

    if (sourceMarkdownPattern) {
      res = _renderTemplate(sourceMarkdownPattern, templateVariables, column.table.schema.catalog, { templateEngine: sourceTemplateEngine });

      if (res === null || res.trim() === '') {
        res = column.table._getNullValue(context);
      }
    }
    return { value: renderMarkdown(res, false), templateVariables: templateVariables };
  };

  // if given page is not valid (the key doesn't exist), or it returned empty result
  if (!rawValue) {
    if (['cnt', 'cnt_d'].indexOf(aggFn) !== -1) {
      return { isHTML: false, value: '0', templateVariables: { $self: '0', $_self: 0 } };
    } else {
      return { isHTML: false, value: '', templateVariables: {} };
    }
  }

  // array formatting is different
  if (aggFn.indexOf('array') === 0 && Array.isArray(rawValue)) {
    const arrValue = getArrayValue(rawValue);
    return { value: arrValue.value, isHTML: true, templateVariables: arrValue.templateVariables };
  }

  let formatted, isHTML;

  // cnt and cnt_d are special since they will generate integer always
  if (['cnt', 'cnt_d'].indexOf(aggFn) !== -1) {
    isHTML = false;
    formatted = _formatUtils.printInteger(rawValue);
  } else {
    isHTML = column.type.name === 'markdown';
    formatted = getFormattedValue(rawValue);
  }

  let res = formatted;
  const templateVariables = { $self: formatted, $_self: rawValue };
  if (sourceMarkdownPattern) {
    isHTML = true;
    res = _renderTemplate(sourceMarkdownPattern, templateVariables, column.table.schema.catalog, { templateEngine: sourceTemplateEngine });

    if (res === null || res.trim() === '') {
      res = column.table._getNullValue(context);
      isHTML = false;
    }
  }

  if (isHTML) {
    res = renderMarkdown(res, false);
  }

  return { isHTML: isHTML, value: res, templateVariables: templateVariables };
}

/**
 * Will create the appropriate ReferenceColumn object based on the given sourceObject.
 * It will return the following objects:
 * - If aggregate: PseudoColumn
 * - If self_link: KeyPseudoColumn
 * - If no path, scalar, asset annot: AssetPseudoColumn
 * - If no path, scalar (or entity in entry context): ReferenceColumn
 * - If path, entity, outbound length 1: ForeignKeyPseudoColumn
 * - If path, entity, inbound length 1: InboundForeignKeyPseudoColumn
 * - If path, entity, p&b association: InboundForeignKeyPseudoColumn
 * - Otherwise: PseudoColumn
 */
export function createPseudoColumn(
  reference: Reference,
  sourceObjectWrapper: SourceObjectWrapper,
  mainTuple?: Tuple,
): ReferenceColumn | ForeignKeyPseudoColumn | InboundForeignKeyPseudoColumn | AssetPseudoColumn | PseudoColumn {
  const sourceObject = sourceObjectWrapper.sourceObject;
  const column = sourceObjectWrapper.column;
  const name = sourceObjectWrapper.name;
  let relatedRef: any, fk: any;

  const generalPseudo = (): any => {
    if (!column) {
      return new VirtualColumn(reference, sourceObjectWrapper, name, mainTuple);
    }
    return new PseudoColumn(reference, column, sourceObjectWrapper, name, mainTuple);
  };

  if (!column) return generalPseudo();

  // has aggregate
  if (sourceObjectWrapper.hasAggregate) {
    return generalPseudo();
  }

  if (!sourceObjectWrapper.hasPath) {
    // make sure the column is unique not-null
    if (sourceObject.self_link === true && column && column.isUniqueNotNull) {
      return new KeyPseudoColumn(reference, column.uniqueNotNullKey, sourceObjectWrapper, name);
    }

    // no path, scalar, asset
    if (column && column.type.name === 'text' && column.isAssetURL) {
      return new AssetPseudoColumn(reference, column, sourceObjectWrapper);
    }

    // no path, scalar
    return new ReferenceColumn(reference, [column], sourceObjectWrapper, name, mainTuple);
  }

  // path, entity, outbound length 1, (cannot have any filters)
  if (
    sourceObjectWrapper.isEntityMode &&
    !sourceObjectWrapper.isFiltered &&
    sourceObjectWrapper.foreignKeyPathLength === 1 &&
    !sourceObjectWrapper.firstForeignKeyNode!.isInbound
  ) {
    fk = sourceObjectWrapper.firstForeignKeyNode!.nodeObject;
    return new ForeignKeyPseudoColumn(reference, fk, sourceObjectWrapper, name);
  }

  // path, entity, inbound length 1 (it can have filter)
  if (sourceObjectWrapper.isEntityMode && sourceObjectWrapper.foreignKeyPathLength === 1 && sourceObjectWrapper.firstForeignKeyNode!.isInbound) {
    fk = sourceObjectWrapper.firstForeignKeyNode!.nodeObject;
    relatedRef = generateRelatedReference(reference, fk, mainTuple, false, sourceObjectWrapper);
    return new InboundForeignKeyPseudoColumn(reference, relatedRef, sourceObjectWrapper, name);
  }

  // path, entity, inbound outbound p&b (it can have filter)
  if (
    sourceObjectWrapper.isEntityMode &&
    sourceObjectWrapper.foreignKeyPathLength === 2 &&
    sourceObjectWrapper.firstForeignKeyNode!.isInbound &&
    !sourceObjectWrapper.lastForeignKeyNode!.isInbound
  ) {
    fk = sourceObjectWrapper.firstForeignKeyNode!.nodeObject;
    if (fk._table.isPureBinaryAssociation) {
      relatedRef = generateRelatedReference(reference, fk, mainTuple, true, sourceObjectWrapper);
      return new InboundForeignKeyPseudoColumn(reference, relatedRef, sourceObjectWrapper, name);
    }
  }

  return generalPseudo();
}

export function isRelatedColumn(col: VisibleColumn): boolean {
  if ((col as InboundForeignKeyPseudoColumn).isInboundForeignKey) return true;
  const pseudoCol = col as PseudoColumn;
  return pseudoCol.isPathColumn && pseudoCol.hasPath && !pseudoCol.isUnique && !pseudoCol.hasAggregate;
}

export function isAllOutboundColumn(col: VisibleColumn): boolean {
  if ((col as ForeignKeyPseudoColumn).isForeignKey) return true;
  const pseudoCol = col as PseudoColumn;
  return pseudoCol.isPathColumn && pseudoCol.hasPath && pseudoCol.isUnique && !pseudoCol.hasAggregate;
}
