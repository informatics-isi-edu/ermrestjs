_Draft: this is a work in progress_

# Model-based heuristics

The ermrestjs library introspects the relational model from ERMrest and applies a set of heuristics to process the model into the form presented to the client.

## Foreign Key References

A foreign key reference (FKR) is a type of _integrity constraint_ in a relational database. It defines a _referential_ integrity constraint between a set of columns in one table and a set of columns that make up a _key_ in the same table or in another table.

__Important Note__: A key may be composed of _one or more than one_ columns and therefore foreign key references may be composed of _one or more than one_ columns. Also a column may be involved in _zero, one, or more than one_ foreign key references. These are critical points that lead to some complexity in how one must interpret columns with respect to their participation in foreign key references.

From the perspective of a given table in a data model we may think of foreign key references in the follow three scenarios.
 - "outbound" where the given table has a FKR _to_ a key in a different table;
 - "inbound" where the given table has a key that is referenced _from_ a foreign key in a different table;
 - "associative" where the given table has a key that is referenced from a foreign key in a different table, where the other table is _associative_ meaning that its is essentially comprised of only foreign keys between tables.

In the rest of this section we will describe the heuristics that ermrestjs makes in these scenarios.

### Inbound references

In the case of _inbound_ FKRs, ermrestjs represents these relationships in the `Reference.related` [LINK] interface, which is a list of contextualized `Reference`s.
 - If the referenced table is _annotated_ with [2016 Visible Foreign Keys](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md#2016-visible-foreign-keys), The `related` set will include only those references that are identified in the annotation.
 - If the FKR is annotated with [2016 Foreign Key](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md#2016-foreign-key), the `Reference`'s `displayName` will be based on the FKR's `from_name` property, otherwise it will be based on the referring `Table`'s `displayName`.
 - TBD. Is the reference _contextualized_?

### Associative references

In the case of binary _associative_ references, the reference is exposed as if it were an [inbound reference](#inbound-reference).
 - If the referenced table is _annotated_ with [2016 Visible Foreign Keys](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md#2016-visible-foreign-keys), The `related` set will include only those references that are identified in the annotation.
 - If the FKR is annotated with [2016 Foreign Key](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md#2016-foreign-key), the `Reference`'s `displayName` will be based on the `to_name` property of the _outbound_ FKR from the association table _to the other table_, otherwise it will be based on the _association_ `Table`'s `displayName`.
 - TBD. Is the reference _contextualized_?

At present, ermrestjs applies these heuristics only for _binary_ associative references, which are formed by an association table comprised of two FKRs.

### Outbound references

In the case of _outbound_ references, the following caveats (noted earlier) are important to keep in mind:

1. Column is involved in _one_ FKR
  - FKR is composed of _one_ column
  - FKR is a _composite_ of multiple columns
2. Column is involved in _more than one_ FKR
  - FKR is composed of _one_ column
  - FKR is a _composite_ of multiple columns

First, ermrestjs will represent these relationships as `Reference`s. A given `Reference` will have a `link` property that is a set of the outbound `Reference`s.

#### Basic heuristics
 - __TBD__ do we need an annotation to hide/show outbound FKRs like we do for inbound FKRs with the `Visible Foreign Keys` annotation?
 - If the FKR is annotated with [2016 Foreign Key](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md#2016-foreign-key), the `Reference`'s `displayName` will be based on the FKR's `to_name` property, otherwise it will be based on the referring `Table`'s `displayName`.

#### Pseudo-column heuristics
In addition to the basic heuristics, under some circumstances ermrestjs will apply additional heuristics. These only apply in cases where the `Reference` has been _contextualized for a read-only mode_ (i.e., _detail_, _compact_, etc.).

_These are all To Be Determined_

1. If a column is a member of _only one FKR_ **and** that FKR is a _single-column FKR_, then ermrestjs will apply the following heuristics:
  - The original `Column` definition will be replaced with a pseudo-column definition, in the same position as the original column definition was in the list of columns of the model.
  - The pseudo-column `displayName` will be:
    - the FKR's `to_name` if it was annotated with `2016 Foreign Key`, else
    - the `Column`'s `displayName`
  - An associated `Tuple`'s `value` for this pseudo-column will be a `URL` where its:
    - `caption` (i.e., its link text) is defined by the `name` context of the [2016 Table Display](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md#2016-table-display) annotation for the referenced table,
    - `href` is a generated link to the tuple in the referenced table. The href will be generated based on:
      - a function (_to be defined_ in the api) that takes the `Reference.location` and produces an application-specific URL, or
      - if no such function is provided to the api, the `Reference.location.uri` by default.
2. If a column is a member of _more than one single-column FKRs_, then we apply the following heuristics:
  - The original `Column` definition will be replaced with a set of pseudo-column definitions, inserted in the same position as the original column definition was in the list of columns of the model.
  - The pseudo-column `displayName` will be:
    - the FKR's `to_name` if it was annotated with `2016 Foreign Key`, else
    - the `Column`'s `displayName` disambiguated with the _referenced_ `Table`'s `displayName`
  - An associated `Tuple`'s `value` for this pseudo-column will be a `URL` as defined in heuristic \#1 above.
3. In the case of a composite foreign key reference, ermrestjs does not apply any additional heuristics by default. As per the basic processing and heuristics defined previously, the client has access to the set of `link`s of a given `Reference` and could display those as links based on the `Reference.displayName` and `Reference.location` properties.
