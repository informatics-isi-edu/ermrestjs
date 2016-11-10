# ermrestjs [![Build Status](https://travis-ci.org/informatics-isi-edu/ermrestjs.svg?branch=master)](https://travis-ci.org/informatics-isi-edu/ermrestjs) -- ERMrest client library in JavaScript

The ermrestjs library is a client API for the
[ERMrest](http://github.com/informatics-isi-edu/ermrest) service. _This
project is a work in progress. The API is undergoing frequent changes._

## Runtime environments

We intend for ermrestjs to be usable in browser and node environments.
- Browsers: ermrestjs should work in current versions of Firefox, Chrome,
    Safari, Edge, and Internet Explorer (10+).
- Node: while not the main target of ermrestjs, it includes bindings for 
    node.
- Angular: while ermrestjs is intended to be framework-neutral, it includes
    bindings for angular 1.x.

## Library

The library consists of the following scripts:
- `ermrest.js`: a complete, non-minified script.
- `ermrest.min.js`: a complete, minified script.

## Documention

See the [API reference](doc/api.md).

See the [Angular Bindings](doc/angular.md).

## Development dependencies

We use a combination of [nodejs](https://www.nodejs.org), npm, and good old
fashioned [make](https://en.wikipedia.org/wiki/Makefile). However, you only
need `make` to build the non-minified package and run the install command.

Developers using Mac OS X should see this limitation [issue 207](https://github.com/informatics-isi-edu/ermrestjs/issues/207).

In addition ermrestjs is also dependent on another gituhub repo [ErmrestDataUtils](https://github.com/informatics-isi-edu/ErmrestDataUtils). You will need to pull that repo first in the same directory where you plan to pull ermrestjs

```sh

# Clone the ErmrestDatautils repo
$ git clone https://github.com/informatics-isi-edu/ErmrestDataUtils.git

# Change directory to ErmrestDataUtils
$ cd ErmrestDataUtils

# Install npm dependencies
$ npm install

# Change directory to parent
$ cd ..
```

## How to get ermrestjs

Clone the repo from GitHub.
```
$ git clone https://github.com/informatics-isi-edu/ermrestjs.git
$ cd ermrestjs
```

## How to build the packages

To build the non-minified and angular binding packages run:
```
$ make package
```

If you want to build the minified package, you will need to have `nodejs` and
`npm` installed and on your path. The build script will pull in all of the
dependencies into a local directory.

```
$ make all
```

## How to deploy ermrestjs

To deploy the packages run the following command and _optionally_ you may set
the `ERMRESTJSDIR` variable to an alternative deployment directory:

```
$ make [ERMRESTJSDIR=dir] install
```

Set `ERMRESTJSDIR` to specify a target deployment location. By default, it the
install target is `/var/www/html/ermrestjs`. If this directory does not exist,
it will first create it. You may need to run `make install` with _super user_
privileges depending on the installation directory you chose.

Note that the `Makefile` **will not** create the base directory of the
deployment directory. For example, if the default `/var/www/html` directory
does not exist, you must create it first before running the install command. If
it does not exist, you will get an error like this:

```
make: *** No rule to make target `/var/www/html', needed by `/var/www/html/ermrestjs'.  Stop.
```

## How to update the documentation

The API documentation is automatically generated. Source code is documented with
[jsdoc](http://usejsdoc.org/) comments. We use `jsdoc2md` to generate the
markdown API documentation.

```
$ make doc
```

## How to test the package

Before running the test cases you need to set the environment variables.

```
export ERMREST_URL=https://YOUR_ERMREST_URL/ermrest
export AUTH_COOKIE=YOUR_ERMREST_COOKIE
```

To execute test case run the following command

```
$ make test
```

This command internally invokes the `node test/jasmine-runner.js` script.


## How to check your code quality

We use [static analysis programs](https://en.wikipedia.org/wiki/Static_program_analysis),
including jshint, and Google Closure Compiler (as part of the minification
step).

To run jshint:
```
$ make lint
```

To check with Closure compiler run `make all`.

## How to contribute

When developing new code for ermrestjs, please remember to run the build tools
_before_ submitting Pull Requests (PR).

Steps to make a contribution:

1. make your updates to the code;
2. do your own quality assurance;
3. update the documentation (if applicable);
4. update the unit tests (if applicable);
5. make sure there are no warnings or errors from static analysis programs
  (`make all` should be free of warnings and errors);
6. make sure that all tests are passing before submitting the request
  (`make test` should be free of errors);
7. make your pull request, and prepare for comments.

## More help

See `make help` for more supported build tools:
```
$ make help
Available 'make' targets:
    all       - build and docs
    deps      - local install of node and bower dependencies
    updeps    - update local dependencies
    install   - installs the package (ERMRESTJSDIR=/var/www/html/ermrestjs)
    lint      - lint the source
    build     - lint, package and minify
    package   - concatenate into package
    test      - run tests
    doc       - make autogenerated markdown docs
    jsdoc     - make autogenerated html docs
    clean     - cleans the build environment
    distclean - cleans and removes dependencies
```
