# Test Idioms

In this document we try to summarize what are the best practices while writing test cases in ERMrestJS and Chaise.

- Try to keep your schema definitions as simple as possible. It only needs to cover the cases that you want to test. Avoid duplicating other existing schemas/tables.
- Don't rely on ERMrestJS heuristics for the parts of the code that you are not testing, and define annotations. The heuristics change more regularly than the annotation won't. For example if you are testing the presentation of record app, define your own visible-columns and visible-foreignkeys annotation.
- Be specific about the scenario that you are testing. If you want to test a very specific scenario, you don't have to test all the other features. For instance, if you want to test recordset page in a specific scenario, you don't have to test all the facet data and main data (The more general case should already be tested and should be separate from this specific test).
- Use names that describe the situation you are trying to recreate. For instance if you are testing the annotations and you want to create a table with annotation 'x' just name the table `table_w_x`. This way we can easily look at the schema and understand which cases are covered in that schema.
- If your test case is related to one of the currently implemented test specs,
	- If they can share the same schema, you can modify its schema to cover your case too and add your test case to the corresponding test spec (Instead of creating a new configuration and test spec).
	- (More applicable in ERMrestJS)Although it's preferable to not modify other schemas and create your very own schema that covers some specific test cases.
- If you have multiple expect in your `it`, make sure they have their own error message.

- Separate specific test cases into different `it` functions.
	- In E2E tests you might find some test units that are huge, previously they were written that way because of the promise chaining. But you actually can break the chain, and resume again in the next spec. To do so, you should use `done`. Use your judgement on when you should break the test into different `it`s.
		```javascript
		// before breaking the chain:

		it ("test", function () {
		   doTest().then(function () {
			  // test feature 1
			  return doOne();
		   }).then(function () {
			  // test feature 2 that is dependent on feature 1
			  return doTwo();
		   }).then(function () {
			  // test feature 3 that is dependent on feature 2
			  return doThree();
		   }).then(function () {
		      // test feature 4
		   }).catch(function () {
			  console.log("something bad happened");
		   });
		});

		// the better version:

		it ("test1", function (done) {
		   doTest().then(function () {
			  // test feature 1
			  return doOne();
		   }).then(function () {
			  // test feature 2
			  return doTwo();
		   }).then(function () {
			  done();
		   }).catch(function (err) {
			  done.fail(err);
		   });
		});

		it ("test2", function (done) {
		   doTest().then(function () {
			  // test feature 3
			  return doThree();
		   }).then(function () {
			  // test feature 4
			  done();
		   }).catch(function (err) {
			  done.fail(err);
		   });
		});
		```
