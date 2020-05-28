# Installing

This pages documents how to install ERMrestJS, a Javascript client API for the
[ERMrest](http://github.com/informatics-isi-edu/ermrest/) service. It provides a higher-level, simplified interface for working with the entity-relationship concepts that are native to ERMrest.

## Development Dependencies

1. [make](https://en.wikipedia.org/wiki/Makefile): Make is required for any build or development. With `make` only the non-minified package can be built and installed.
2. [Node.js](https://www.nodejs.org) (v 6.x): Node is required for most development operations including linting, minifying, and testing.
3. [ErmrestDataUtils](https://github.com/informatics-isi-edu/ermrestdatautils): This package is only used in test framework. If you just want to install ERMrestJS, you won't need it.


## Building The Package

If you want to build the package, you will need to have `Node.js` installed and on your path. The build script will pull in all of the
dependencies into the `/dist/` directory.

```
$ make all
```

Even though this command will not deploy the package, during build we will inject some build-related parameters into the code. So you should make sure these environment variables are properly defined. You can find more information about these variables in the next section.


## Deploying


1. First you need to setup some environment variables to tell ERMRestJS where it should install the package. The following are the variables and their default values:

    ```
    WEB_URL_ROOT=/
    WEB_INSTALL_ROOT=/var/www/html/
    ERMRESTJS_REL_PATH=ermrestjs/
    ```
    Which means EMRrestJS build folder will be copied to `/var/www/html/ermrestjs/` location by default. And ERMrestJS will be access by `/ermrestjs/` URL path when deployed. If that is not the case in your deployment, you should modify the variables accordingly.

    Notes:
    - All the variables MUST have a trailing `/`.

    - If you're installing remotely, since we're using the `WEB_INSTALL_ROOT` in `rsync` command, you can use a remote location `username@host:public_html/` for this variable.

    - A very silly thing to do would be to set your deployment directory to root `/` and run `make install` with `sudo`. This would be very silly indeed, and would probably result in some corruption of your operating system. Surely, no one would ever do this. But, in the off chance that one might attempt such silliness, the `make install` rule specifies a `dont_install_in_root` prerequisite that attempts to put a stop to any such silliness before it goes too far.

2. After making sure the variables are properly set, run the following command:

    ```
    $ make install
    ```

    > If the given directory does not exist, it will first create it. So you may need to run `make install` with _super user_ privileges depending on the installation directory you choose.




## Updating API Documentation

The API documentation is automatically generated. Source code is documented with
[jsdoc](http://usejsdoc.org/) comments. We use `jsdoc2md` to generate the
markdown API documentation.

```
$ make doc
```

By doing `make all`, it will automatically create the API documentation for you.
So you don't necessarily need to run `make doc`.

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
