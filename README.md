# ermrestjs [![Build Status](https://travis-ci.org/informatics-isi-edu/ermrestjs.svg?branch=master)](https://travis-ci.org/informatics-isi-edu/ermrestjs) -- ERMrest client library in JavaScript

The ermrestjs library is a client API for the
[ERMrest](http://github.com/informatics-isi-edu/ermrest) service. It provides a higher-level, simplified interface for working with the entity-relationship concepts that are native to ERMrest.

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

- [API reference](doc/api.md)
- [Angular Bindings](doc/angular.md)

## Development dependencies

1. [make](https://en.wikipedia.org/wiki/Makefile): Make is required for any build or development. With `make` only the non-minified package can be built and installed.
2.
2. [nodejs](https://www.nodejs.org) (v 6.x): Node is required for most development operations including linting, minifying, and testing.
3. [ErmrestDataUtils](#ErmrestDataUtils): see discussion below.

### Limitations

- Developers using Mac OS X should see this limitation [issue 207](https://github.com/informatics-isi-edu/ermrestjs/issues/207).
- Also on Mac, we have found problems with the nodejs installed by Homebrew, so we recommend downloading directly from the nodejs site.

### ErmrestDataUtils

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

### Set the deployment directory (optional)

Set `ERMRESTJSDIR` to specify a target deployment location. By default, it the
install target is `/var/www/html/ermrestjs`. If this directory does not exist,
it will first create it. You may need to run `make install` with _super user_
privileges depending on the installation directory you chose.

**Important Note**: A very silly thing to do would be to set your deployment directory to root `/` and run `make install` with `sudo`. This would be very silly indeed, and would probably result in some corruption of your operating system. Surely, no one would ever do this. But, in the off chance that one might attempt such silliness, the `make install` rule specifies a `dont_install_in_root` prerequisite that attempts to put a stop to any such silliness before it goes to far.

### Production deployment installs

This example is for **production** deployments or other deployments to the document root of a Web server. As noted above, this will install to `/var/www/html/ermrestjs`.

```
# make install
```

### Test and other personal deployment installs

This example is how you would install the software on a remote server, for example a test server. Replacing `username` and `hostname` with real values.

```
$ export ERMRESTJSDIR=username@hostname:public_html/ermrestjs
$ make install
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
export ERMREST_URL=https://hostname/ermrest
export AUTH_COOKIE=YOUR_ERMREST_COOKIE
```

To execute the tests, run the following command:

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
