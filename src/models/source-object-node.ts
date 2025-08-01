// utils
import { _getFormattedKeyValues } from '@isrd-isi-edu/ermrestjs/js/utils/helpers';

// legacy
import { Table } from '@isrd-isi-edu/ermrestjs/js/core';
import { Tuple } from '@isrd-isi-edu/ermrestjs/js/reference';
import { _sourceColumnHelpers } from '@isrd-isi-edu/ermrestjs/js/utils/pseudocolumn_helpers';

/**
 * This is the source object node that is used to represent a source object.
 * It can be a filter, foreign key, inbound, outbound, or path prefix.
 */
class SourceObjectNode {
  /**
   * the object that represents this node
   * - if this is a filter, it will be the parsed filter node (Object)
   * - if this is a foreign key, it will be the foreign key object (ForeignKeyRef)
   * - if this is a path prefix, it will be the path prefix object (SourceObjectWrapper)
   */
  public nodeObject: any;

  /**
   * the table that this node belongs to (the table that the previous node points to)
   */
  public table: Table;

  /**
   * whether this node is a filter
   */
  public isFilter: boolean;
  /**
   * whether the filter has been processed
   * - if true, the `parsedFilterNode` will be set to the parsed filter
   * - if false, the `parsedFilterNode` will be undefined
   */
  public isFilterProcessed: boolean = false;
  /**
   * whether this node is a foreign key
   */
  public isForeignKey: boolean;
  /**
   * whether the foreign key is inbound or outbound
   */
  public isInbound: boolean;
  /**
   * whether this node is a path prefix
   */
  public isPathPrefix: boolean;
  /**
   * the source key for the path prefix
   */
  public pathPrefixSourcekey?: string;
  /**
   * whether this node is an alternative join
   */
  public isAlternativeJoin: boolean;
  /**
   * the alias for this node
   */
  public alias?: string;

  /**
   * the parsed filter node
   */
  private parsedFilterNode?: string;

  constructor(
    nodeObject: any,
    /**
     * the table that this node belongs to (the table that the previous node points to)
     */
    table: Table,
    isFilter: boolean,
    isForeignKey: boolean,
    isInbound: boolean,
    isPathPrefix: boolean,
    pathPrefixSourcekey: string | undefined,
    alias: string | undefined,
    /**
     * whether this node is an alternative join
     */
    isAlternativeJoin: boolean,
    /**
     * if set to true, the filter will not be processed
     * this is used by Table.sourceDefinitions to skip processing filters since we still don't have the main tuple
     */
    skipProcessingFilters?: boolean,
    /**
     * the main tuple that this node is associated with
     * this is used to process the filter if this is a filter node
     */
    mainTuple?: Tuple,
  ) {
    this.nodeObject = nodeObject;
    this.table = table;
    this.isFilter = isFilter;

    if (isFilter) {
      if (!skipProcessingFilters) {
        this.isFilterProcessed = true;
        this.processFilter(mainTuple);
      } else {
        this.isFilterProcessed = false;
      }
    }

    this.isForeignKey = isForeignKey;
    this.isInbound = isInbound;
    this.isPathPrefix = isPathPrefix;
    this.pathPrefixSourcekey = pathPrefixSourcekey;
    this.isAlternativeJoin = isAlternativeJoin;
    this.alias = alias;
  }

  /**
   * Return the string representation of this node
   * @param reverse - whether we should reverse the order (applicable to fk)
   * @param isLeft  - whether we want to use left outer join (applicable to fk)
   * @param outAlias - output alias
   * @param isReverseRightJoin - whether this is a reverse right join
   * @returns string representation
   */
  toString(reverse?: boolean, isLeft?: boolean, outAlias?: string, isReverseRightJoin?: boolean): string {
    if (this.isForeignKey) {
      const rev = (reverse && this.isInbound) || (!reverse && !this.isInbound);
      return this.nodeObject.toString(rev, isLeft);
    }

    if (this.isPathPrefix) {
      return this.nodeObject.toString(reverse, isLeft, outAlias, isReverseRightJoin);
    }

    return this.parsedFilterNode || '';
  }

  /**
   * Process the filter for this node
   * @param mainTuple - the main tuple to extract key values from
   */
  processFilter(mainTuple?: Tuple): void {
    if (!this.isFilter) return;

    let keyValues: Record<string, unknown> = {};
    if (mainTuple && this.table) {
      // get the key values from the main tuple
      // this will be used to process the operand_pattern
      const ref = mainTuple.reference;
      keyValues = _getFormattedKeyValues(ref.table, ref.context, mainTuple.data, mainTuple.linkedData) as Record<string, unknown>;
    }

    // this will parse the filter and throw errors if it's invalid
    this.parsedFilterNode = _sourceColumnHelpers.parseSourceObjectNodeFilter(this.nodeObject, keyValues, this.table);
  }
}

export default SourceObjectNode;
