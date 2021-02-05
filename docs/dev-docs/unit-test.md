# Unit Testing

## Setup

- The test framework uses [Jasmine](http://jasmine.github.io/2.4/introduction.html) to write and run the test-cases.
- It also depends on [ermrest-data-utils](https://www.npmjs.com/package/ermrest-data-utils) package to import and delete data for test-cases.
- To start, first you need to install all npm dependencies. Run following command
```sh
# Install npm dependencies
$ npm install

# Update npm dependencies
$ npm update
```

## Terminology
- Test Spec: Another name for [Test Suite](https://en.wikipedia.org/wiki/Test_suite). In jasmine terminology, test spec is a `describe` that can contains hierarchy of `describe` and multiple `it`.
- [Test Case](https://en.wikipedia.org/wiki/Test_case): The small unit tests. In definition each test spec contains several test cases. In jasmine terminology, test case can be several`it`, or a `describe` that contains several `it`.
- Schema: The exact schema that we have in ermrest. It contains the definition of all tables. You can find some example of schema documents [here].

# File Structure
All files that are related to automated testing can be found under [`test`](https://github.com/informatics-isi-edu/ermrestjs/tree/testframework_changes/test) folder. UPPER CASE are actual developer-defined names while lower cases are literal values and should not be changed. You can have multiple of these UPPER CASE files and folders.

**Please exactly follow this file structure.**
```
test/
|-- specs
|   |-- SPEC_NAME
|   |   |-- conf
|   |   |   |-- SCHEMA_NAME
|   |   |   |   |-- data                # Data
|   |   |   |   |   `-- TABLE_NAME.json
|   |   |   |   `-- schema.json         # Schema Definition
|   |   |   `-- SCHEMA_NAME.conf.json   # schema configuration files
|   |   |-- tests                       # All the possible test cases for a spec should be in this folder
|   |   |   |-- 01.TEST_NAME1.js
|   |   |   `-- 02.TEST_NAME2.js
|   |   `-- spec.js                     # include configuration and tests to be run here                 
|-- support
|   `-- jasmine.json                    # change spec_files to include your spec
|-- utils
|   `-- ermrest-init.js
`-- jasmine-runner.js                   # run this file with node, to run all test specs
```

## How to write Tests

To write a new test case, use following instructions.

### 1. Configuration

You need to create a schema and data that will be used in your test cases. Use [this](https://github.com/informatics-isi-edu/ermrestjs/blob/master/test/specs/sample/conf/product.conf.json) sample to setup your schema and data. Use the [File Structure](#file-structure) to create the appropriate conf folder. [Here](https://github.com/informatics-isi-edu/ermrestjs/tree/master/test/specs/sample/conf) is a sample conf folder and here is list of available options in `SCHEMA_NAME.conf.js`:
```javascript
{
  "catalog": {
    //"id": 1  //existing id of a catalog
  },
  "schema": {
    "name": "product",
    "createNew": true, // change this to false to avoid creating new schema
    "path": "schema/product.json" // path of the schema json file in the current working directory folder
  },
  "tables": {
    "createNew": true, // Mention this to be true to allow creating new tables
  },
  "entities": {
    "createNew": true, // Mention this to be true to allow creating new entities
    "path": "data/product", // This is the path from where the json for the entities will be picked for import
  },
}
```

Things to consider while creating schema:
- Cover as much different scenarios as possible.
- Keep your schema as simple as possible.
- Use names that describe the situation you are trying to recreate. For instance if you are testing the annotations and you want to create a table with annotation 'x' just name the table `table_with_x`. This way we can easily look at the schema and understand which cases are covered in that schema.
- If your test case is related to one of the currently implemented test specs,
  - If they can share the same schema, you can modify its schema to cover your case too and add your test case to the corresponding test spec (Instead of creating a new configuration and test spec).
  - Although it's preferable to not modify other schemas and create your very own schema that covers some specific test cases.

**NOTE** : If your test spec is data-independent, i.e. it doesn't depends on any data to be imported, you can simply ignore above configuration rules and don't create the `conf` folder.


### 2. Test Spec
Now that you have your sample data, you can go ahead and create your unit tests. Create a `spec.js` file in the spec folder that you created using the following template. Take a look at [this](https://github.com/informatics-isi-edu/ermrestjs/blob/master/test/specs/sample/spec.js) example.
```javascript
require('./../../utils/starter.spec.js').runTests({
    description: 'In SPEC_NAME spec, ',
    testCases: [
        "/SPEC_NAME/tests/01.TEST_NAME1.js",
        "/SPEC_NAME/tests/02.TEST_NAME2.js"
    ],
    schemaConfigurations: [
        "/SPEC_NAME/conf/SCHEMA_NAME.conf.json" // Pass this as an empty array if you don't have any conf
    ]
});

```
Once you're done creating `spec.js` file, you can start adding your test files to the **tests** folder. These files will contain the actual `it's` and `describe's`. For reference you can take a look at [this](https://github.com/informatics-isi-edu/ermrestjs/blob/master/test/specs/sample/tests/01.sample.js)

```javascript
exports.execute = function (options) {

    describe('For determining server, ', function () {
        var server, ermRest, catalogId, schemaName = "product";

        beforeAll(function () {
            server = options.server;
            catalogId = options.catalogId
        });

        // Test Cases:
        it('should introspect catalog', function(done) {
            expect(server.catalogs).toBeDefined("catalogs undefined");
            expect(server.catalogs.get).toBeDefined("catalogs.get undefined");
            server.catalogs.get(catalogId).then(function(response) {
                catalog = response;
                expect(catalog).toBeDefined("catalog undefined");
                expect(catalog.schemas).toBeDefined("schemas undefined");
                expect(catalog.schemas.get).toBeDefined("schemas.get undefined");
                schema = catalog.schemas.get(schemaName);
                done();
            }, function(err) {
                done.fail(err);
            });
        });

        it('Should have schema name', function () {
            expect(schema).toBeDefined("schema undefined");
            expect(schema.name).toBe(schemaName, "schema name missmatch");
        });

        it('should have catalog id', function () {
            expect(catalog.id).toBe(catalogId);
        });
    });
};
```

Once your suite creates the catalog, you will find its **id** in `process.env.DEFAULT_CATALOG`. This can be accessed across any file and you should avoid changing it.

`options` is another object, in which you will find all useful variables and objects sent by the `spec.js`. But it will be only populated once your tests start running, i.e. the values will be accessible in `it's`, `beforeAll` and `afterAll` blocks only.
```javascript
options = {
   server:      // ERMrest server,
   importUtils: // ermrest-import reference,
   description: // description of this spec,
   schemaConfs: // all filepaths of schema configurations used in this spec,
   ermRest:     // reference to ERMrest object,
   url:         // ermRest url,
   authCookie:  // authn includes.authCookie
}
```

**Don't forget to add your spec to `spec_files` in [`support/jasmin.json`](https://github.com/informatics-isi-edu/ermrestjs/blob/master/test/support/jasmine.json).**

Notes:
- Separate specific test cases into different `it` functions.
- If you have multiple `expect` in your `it`, make sure they have their own error message.
- Avoid using too generic or too specific descriptions for test cases.

  ```javascript
  it('schema should use heuristics', function(){}); //too generic
  it('`schema_with_underline` displayname should be `schema with underline` because it has only `underline_space` in its `tag:misd.isi.edu,2015:display` annotation.', function(){}); //too specific
  it('schema should use name styles (`underline_space`, `title_case`) that are defined in its display annotations.', function(){}); //✓
  ```
- If your test case is not asynchronous,
  - You don't need to specify `done` as the parameter of your callback in `it`. Leave it blank like [this](https://github.com/informatics-isi-edu/ermrestjs/blob/master/test/specs/sample/tests/01.sample.js#L29,L32) function.
- If your test case is asynchronous,
  -  You have to put `done` as a parameter.  Don't forget to call the `done()` function at the end of your test case. You can also call `done.fail()` to avoid other test cases from running. Take a look at [this](https://github.com/informatics-isi-edu/ermrestjs/blob/master/test/specs/sample/tests/01.sample.js#L13,L27) example.
  - `done` is used to specify that all asynchronous calls in this test case have completed and the text test with `done` defined as a parameter will be started.
  - At the end of an asynchronous callback or set of chained callbacks, a `.catch(function (error) {...})` should be defined. This prevents the callback from swallowing up any jasmine errors.
- You can use `toHaveSameItems` matcher to compare arrays.
  ```javascript
  expect([1,2,3]).toHaveSameItems([1,3,2], true);   // match arrays without ordering
expect([1,2,3]).toHaveSameItems([1,2,3]);            // match arrays with ordering

// Match array of objects without ordering
expect([schema, catalog, 213]).toHaveSameItems([schema, 213, catalog], true);
  ```
- You can use `toBeAnyOf` matcher to test whether the value is any of the expected values.

  ```javascript
  expect(1).toBeAnyOf([2,1]); // the expected value must be an array
  expect(["Value"]).toBeyAnyOf([["Value"], ["Not the Value"]]);
  ```
- If you think that the existing matchers are not enough. You can add your new matcher in [`jasmine-matcher.js`](https://github.com/informatics-isi-edu/ermrestjs/blob/master/test/utils/jasmine-matchers.js).
- You can find more info about how to write unit tests with jasmine in [its documentation page](http://jasmine.github.io/edge/introduction.html).


## How To Run Tests

Before running the test cases you need to set `ERMREST_URL`, `AUTH_COOKIE`, and `RESTRICTED_AUTH_COOKIE`  environment variables.

```sh
export ERMREST_URL=YOUR_ERMREST_URL
export AUTH_COOKIE=YOUR_ERMREST_COOKIE
export RESTRICTED_AUTH_COOKIE=YOUR_SECOND_USER_ERMREST_COOKIE
```

The build needs to be generated for the tests to work, which means running the following commands to execute the test cases.

```sh
$ make install
$ make test
```
or

```sh
$ make install
$ node test/jasmine-runner.js
```

### How To Get Your AUTH_COOKIE

1. Open up [https://dev.isrd.isi.edu/chaise/search/](https://dev.isrd.isi.edu/chaise/search/) website.
2. Login. The account that you are using must have delete and create access. We use this cookie to create and delete catalogs.
3. Open the Developer tools in your browser.
4. Go to the console section and write `$.cookie("webauthn")`.
6. voilà! :satisfied:

### Sample Enviroment Variables
```sh
export ERMREST_URL="https://dev.isrd.isi.edu/ermrest" # No trailing `/`
export AUTH_COOKIE="webauthn=PutYourCookieHere;"; # You have to put `webauthn=` at the beginging and `;` at the end.
export RESTRICTED_AUTH_COOKIE="webauthn=AnotherCookie;"
```

## Debugging

You can debug your specs using [node inspector](https://github.com/node-inspector/node-inspector), [node built-in inspector](https://nodejs.org/docs/latest-v7.x/api/debugger.html#debugger_v8_inspector_integration_for_node_js), or simply logging.

### Test Single Spec File

Whenever you run the `node jasmine-runner.js` , it picks up all the specs defined in **support/jasmine.json** and runs them. To avoid running all specs while development, you can run
```sh
node test/single-test-runner.js
```

The `single-test-runner.js` picks and runs the **support/single.spec.js** file. This file is similar to any spec file, which contains the `testCases` to be run and the `schemaConfigurations` to be used. Change these parameters to execute specific test cases.


## Other Useful Information

1. You might come across some test cases that are specific to CI environment or local. To enforce some test cases to just run in a specific environment, you can do the following:
```javascript
if (process.env.CI) {
  // anything that is specific to CI
}

if (!process.env.CI) {
  // these test cases will only run locally and not on CI.
}
```
