# Null Facet

## Providing Null Option

In faceting a `null` filter could mean any of the following:

- Scalar value being `null`. In terms of ermrest, this will be a simple `col::null::` query.
- No value exists in the given path (checking presence of a value in the path). The query for getting this could be complicated. We have to use outer join in the path. One way of doing this is using right outer join which I will explain in the last section of this description. Because of the implementation limitation we cannot have more than two of these path existence checks (we cannot have two right outer joins on different tables).

Since we're not going to show two different options for these two, we have to make sure to offer `null` option when only one of these two meanings would make sense. Based on this, we can categorize facets into these tgroups:

1. (G1) Facets without any hops (columns of the same table).

2. (G2) Facets with hops where column is nullable. In this case `null` could mean both scalar value `null` and path existence check. Therefore we cannot offer `null` for them.

3. (G3) For other cases `null` can only mean the path existence check and therefore we can offer that option to the users. Since this is path existence check, we have to use the outer join and therefore multiple of them cannot co-exist.

4. (G3.1) If the facet has only one hop and it's the same column that is used in the foreignkey relationship, we can do the filtering on the column of main table. This will eliminate that hop and therefore we don't need right outer join in this case.

Based on this, we will offer null option if:
- Facet has already `null` filter.
- Facet is in G1 or G3.1 group.
- Facet is G3 and no other G3 has `null`.

## ERMrest Query

### Example 1

Assume that the following is the ERD of the database:

![image](https://dev.isrd.isi.edu/~ashafaei/wiki-images/check_presence_right_join.png)

And we're navigating to recordset for table `A` which is showing three facets for table `C`, `E`, and `F`. Assume that we want to generate the request when the following filters are selected for each facet:

- For E: `id::null::` or `id=1`
- For C: `id=2`
- For F: `id=3`

These will be the requests that we should send to ermrest:

- For getting the main result (A):
```
    entity/schema:E/id::null::;id=1/(fk)=(D:id)/M:=right(fk)=(A:id)/(id)=(B:fk)/(id)=(C:fk)/id=2/$M/(id)=(F:fk)/id=3/$M
  ```
  Which is in the following format:
```
    entity/<start from facet that has null>/<filters of the facet with null>/<path to main table with last join being right outer>/<the rest of facets)
```
- For getting the available values of C:
```
    entity/schema:E/id::null;id=1/(fk)=(D:id)/T:=right(fk)=(A:id)/(id)=(F:fk)/id=2/$T/(id)=(B:fk)/M:=(id)=(C:fk)
```
  Which is in this format:
   ```
    entity/<start from facet that has null>/<filters of the facet with null>/<path to main table with last join being right outer>/<all the other facets except from the facet that we want to get the value of>/<path to the current facet>
  ```

### Example 2

To better understand this, in the following you can see a more complicated example. In here, we tried to summarize the queries that ERMrestJS will generate in a facet within facet UX.

![](https://dev.isrd.isi.edu/~ashafaei/wiki-images/null_facet_example.png)


### Summary

Assuming that the following is a general url syntax (F means the `<facets>/<filter>/<cfacets>` combination):

![](https://dev.isrd.isi.edu/~ashafaei/wiki-images/PR736_01.png)

When we're parsing the facets, we need to add alias to the tables so we can use that alias in the facets. So the actual request to ermrest would be:

![](https://dev.isrd.isi.edu/~ashafaei/wiki-images/PR736_02.png)

Now if the `Fi` has actually has a null filter, the url should start with its parsed value which will include the right join to the table before it. And then url would be in the following format:

![](https://dev.isrd.isi.edu/~ashafaei/wiki-images/PR736_03.png)
