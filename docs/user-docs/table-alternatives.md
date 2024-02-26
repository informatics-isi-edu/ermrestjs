# Table Alternatives

## Definition and assumptions

By using [`table-alternatives` annotation](annotation.md#tag-2016-table-alternatives), data modelers can define alternative tables (or views) for different contexts. By definition, the table that you are adding this annotation to will be the base table and all the listed tables are alternative tables for this base table ([Link to the initial issue](https://github.com/informatics-isi-edu/ermrestjs/issues/170)).

The following are constraints for alternative tables:

1. Alternative tables cannot have any inbound foreignkeys.
2. A base table cannot be an alternative table for other base tables (i.e. flat 2-level forest).
3. Alternative table has exactly one base table.
4. Alternative table must have exactly one not-null unique key that is a foreign key to the base table.
5. All alternative tables associated with the base table have not-null unique keys that are foreign keys to the SAME primary keys of the base table.

## Related Entities

- Alternative tables should not be considered as related entities of the base table.
- Since alternative table cannot have any inbound foreignkeys, the related entities for an alternative table always returns an empty list (In the future we can change this behavior to return the related entities of the base table).

## Understanding Recordset

To understand the impact of different annotations and heuristics, it is helpful to imagine that the `recordset` application proceeds with a sequence of decisions:

1. The application is started on a given tablename encoded in the URL.
2. If the tablename in the URL has an alternative table declared for the `compact` context, the application presents results from this alternative table instead of the base table named in the URL.
3. The visible columns annotation for the `filter` context of the results table is consulted to populate the filtering sidebar, and heuristics are applied to the results table if no matching annotation is found.
   - So, if a `compact` alternative table is being presented, facets are chosen for this alternative table.
4. All facet definitions MUST be expressed in terms of the results table from which they are derived. I.e. the `source` of the facet MUST be a column of the result table or a path beginning with a foreign key connected to the result table.
   - Since alternative tables have only one foreign key, a facet path from an alternative table MUST first traverse the foreign key connecting it to the base table, then continue on any further path through the model as desired.
5. Each facet which is in entity-selection mode will consider the `compact/select` context presentation instructions of the facet table (e.g. the rightmost table in the facet's source path). This MAY introduce another alternative table used to present the choices visible in the facet widget and the entity selection modal.

## ERMrestJS Restrictions

> The `filter` context is not supported under the `alternative-table` annotation.

## Faceting

### 1. Alternative Table For Main Table

The following sections are based on this Entity Relationship diagram, and also the `table-alternatives` annotation on `base` table:

![ER Diagram 01](https://github.com/informatics-isi-edu/ermrestjs/raw/master/docs/resources/table-alt/alt_in_main_2.png)

```json
"tag:isrd.isi.edu,2016:table-alternatives": {
    "compact": [ "schema", "compact alt"],
    "detailed": [ "schema", "alternative alt"]
}
```
Therefore we have to show `compact alt` in `compact`, and `detailed alt` in `detailed` context.

#### Scenario 1 - Faceting Annotation

In chaise, we are using `compact` context for recordset app, which has the faceting features. If an alternative table is defined for the `compact` context, when users navigate to the base table in the URL, the facet list will be derived from the list defined on the alternative table. Therefore you **MUST** define the facet list on the **alternative table**. The facet list on the base table will be ignored.

The following is an example of how we can define facet annotation in alternative tables. As you can see the source path starts from `compact alt`.
```json
"annotations": {
    "tag:isrd.isi.edu,2016:visible-columns": {
        "filter": {
            "and": [
                {
                    "source": [{"outbound": ["schema", "fk1"]},  "col"],
                    "markdown_name": "Column in Main Table"
                },
                {
                    "source": [{"outbound": ["schema", "fk1"]},  {"inbound": ["schema", "fk3"]}, "baseID"],
                    "markdown_name": "Related Entity"
                },
                {
                    "source": "compact col",
                    "markdown_name": "Column in Alternative Table"
                }
            ]
        }
    }
}
```
This will result in showing three facets: `col` (from `base` table), `baseID` (from `related_table` table) , `compact col` (from `comp alt` table).

#### Scenario 2 - Heuristics (Without Faceting annotation)

If the annotation was not defined, ermrsetjs will apply the following heuristics for generating the facet list:

   1. Create facets for visible columns in `compact` context. Columns participating in outbound fks will be presented as an entity facet (instead of scalar facet).
   2. Create facets for related entities in `detailed` context. For each of the related tables R,

        2.1. If there isn't an alternative table defined for `detailed` context: Create an entity facet based on R.

        2.2. If there is an alternative table defined for `detailed` context: Since alternative tables don't have any related entities, no extra facet control will be added (until we change the heuristics to automatically derived proper related tables based on the base table mentioned above).

##### Example: scenario 2.1---Heuristics, without `detailed` alternative table

![ER Diagram 01](https://github.com/informatics-isi-edu/ermrestjs/raw/master/docs/resources/table-alt/alt_in_main_1.png)

```json
"tag:isrd.isi.edu,2016:table-alternatives": {
    "compact": [ "schema", "compact alt"]
}
```

In our example for 2.1, with no facet annotation, you will see two facets:  `compact col` (from `comp alt` table), `baseID` (from `related_table` table).


##### Example: scenario 2.2---Heuristics, with `detailed` alternative table

![ER Diagram 01](https://github.com/informatics-isi-edu/ermrestjs/raw/master/docs/resources/table-alt/alt_in_main_2.png)

```json
"tag:isrd.isi.edu,2016:table-alternatives": {
    "compact": [ "schema", "compact alt"],
    "detailed": [ "schema", "alternative alt"]
}
```

Based on the explanation of previous scenario, *since alternative tables don't have any related entities, no extra facet control will be added (until we change the heuristics to automatically derived proper related tables based on the base table mentioned above)*. So you will only see `compact col` (`comp alt` table) in the list of facets.

### 2. Alternative Table in Facet List

**In entity mode**, what users will see is some rows from the table that you have defined a path to in the annotation. The context that is being used to generate these rows is **compact/select**. Therefore, if you have defined an alternative table for one of the facet tables in this context, we are going to show the alternative table.

If the wrong tables are used in the facet list, this might cause a problem. To better understand this issue, let's explain based on different scenarios.

> This is just for entity mode. In scalar mode we're not changing the table and alternative table logic is not going to be applied.

#### Scenario 1: Entity facet with alternative table for compact/select

In the annotation, you can either use the facet `base` table or `compact alt` in your path. Regardless, ermrestjs will apply the facet on `compact/select` table of the facet `base` table. In order for Ermrest to generate the facet correctly, the facet of the `base` table has to be defined on the key column that is being used by the alternative table. If the facet is defined on a different key column, Ermrestjs will treat this as an ERROR case and will ignore this facet.

##### Example: Proper facet source path  
![ER Diagram](https://github.com/informatics-isi-edu/ermrestjs/raw/master/docs/resources/table-alt/alt_in_facet_1_1.png)

Facet List for table `main`:
```json
"filter": {
    "and": [
        {"source": [{"inbound": ["schema", "FK1"]}, "ID_base"]}
    ]
}
```

Since we're going to show the table in `compact/select`, you will see `compact alt` in your list of facets.

##### Example: Invalid facet source path
In the following scenario, ERMrestjs cannot change the table and will just ignore this entry from facet list.

![ER Diagram 03](https://github.com/informatics-isi-edu/ermrestjs/raw/master/docs/resources/table-alt/alt_in_facet_1_2.png)
```json
"filter": {
    "and": [
        {"source": [{"inbound": ["schema", "FK1"]}, "mainanother ID"]}
    ]
}
```

#### Scenario 2: Table With Alternative For compact/select, Facet on Another Alternative Table (Not supported)

Entity Relationship Diagram:

![ER Diagram 04](https://github.com/informatics-isi-edu/ermrestjs/raw/master/docs/resources/table-alt/alt_in_facet_3.png)
```json
"filter": {
    "and": [
        {"source": [{"inbound": ["schema", "FK1"]}, "ID"]}
    ]
}
```
In this scenario, we are faceting based on `detailed alt` table. ERMrestjs is not supporting this case, and if encounters this scenario will ignore this entry from facet list.

#### Scenario 3: Table Without Alternative For compact/select, Facet on Another Alternative Table (Not supported)

Entity Relationship Diagram:
![ER Diagram 04](https://github.com/informatics-isi-edu/ermrestjs/raw/master/docs/resources/table-alt/alt_in_facet_2.png)
```json
"filter": {
    "and": [
        {"source": [{"inbound": ["schema", "FK1"]}, "ID"]}
    ]
}
```
In this scenario, we are faceting based on `detailed alt` table. ERMrestjs is not supporting this case, and if encounters this scenario will ignore this entry from facet list.

**All not-supported cases and invalid cases will be ignored!**
