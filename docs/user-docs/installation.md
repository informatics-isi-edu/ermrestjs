# Installing

This pages documents how to install ERMrestJS, a Javascript client API for the
[ERMrest](http://github.com/informatics-isi-edu/ermrest) service. It provides a higher-level, simplified interface for working with the entity-relationship concepts that are native to ERMrest.

## Development Dependencies

1. [make](https://en.wikipedia.org/wiki/Makefile): Make is required for any build or development. With `make` only the non-minified package can be built and installed.
2. [Node.js](https://www.nodejs.org) (v 6.x): Node is required for most development operations including linting, minifying, and testing.
3. []
4. [ErmrestDataUtils](https://github.com/informatics-isi-edu/ermrestdatautils): This package is only used in test framework. If you just want to install ERMrestJS, you won't need it.


## Building The Package

To build the non-minified and angular binding packages run:
```
$ make package
```

If you want to build the minified package, you will need to have `Node.js` installed and on your path. The build script will pull in all of the
dependencies into the `/build/` directory.

```
$ make all
```

## Deploying

1. First you need to set `ERMRESTJSDIR` to specify a target deployment location. By default, the
install target is `/var/www/html/ermrestjs`. If this directory does not exist,
it will first create it. You may need to run `make install` with _super user_
privileges depending on the installation directory you choose.

    **Important Note**: A very silly thing to do would be to set your deployment directory to root `/` and run `make install` with `sudo`. This would be very silly indeed, and would probably result in some corruption of your operating system. Surely, no one would ever do this. But, in the off chance that one might attempt such silliness, the `make install` rule specifies a `dont_install_in_root` prerequisite that attempts to put a stop to any such silliness before it goes to far.

2. Run the following command,

    ```
    $ make install
    ```

## Updating API Documentation

The API documentation is automatically generated. Source code is documented with
[jsdoc](http://usejsdoc.org/) comments. We use `jsdoc2md` to generate the
markdown API documentation.

```
$ make doc
```

## Unit Testing

Before running the test cases you need to set the environment variables.
- `ERMREST_URL`: the URL to the ermrest service on a (possibly, remote) host.
- `AUTH_COOKIE`: a primary user cookie valid to the (possibly, remote) host running the ermrest service.
- `RESTRICTED_AUTH_COOKIE`: a secondary user cookie valid to the (possibly, remote) host running the ermrest service.

```
export ERMREST_URL=https://hostname/ermrest
export AUTH_COOKIE=YOUR_ERMREST_COOKIE
export RESTRICTED_AUTH_COOKIE=YOUR_SECOND_USER_ERMREST_COOKIE
```

To execute the tests, run the following command:

```
$ make test
```

This command internally invokes the `node test/jasmine-runner.js` script. To find more information about unit testing see the [Unit Testing documentation](../dev-docs/unit-test.md).



## Code Quality

We use [static analysis programs](https://en.wikipedia.org/wiki/Static_program_analysis),
including jshint, and Google Closure Compiler (as part of the minification
step).

To run jshint:
```
$ make lint
```

To check with Closure compiler run `make all`.

## More Help

See `make help` for more supported build tools.
