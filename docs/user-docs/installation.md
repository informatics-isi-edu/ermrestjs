# Installing

This pages documents how to install ERMrestJS, a Javascript client API for the
[ERMrest](http://github.com/informatics-isi-edu/ermrest/) service. It provides a higher-level, simplified interface for working with the entity-relationship concepts that are native to ERMrest.

## Development Dependencies

1. [make](https://en.wikipedia.org/wiki/Makefile): Make is required for any build or development. With `make` only the non-minified package can be built and installed.
2. [Node.js](https://www.nodejs.org): Node is required for most development operations including linting, minifying, and testing.
3. [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm): used for installing dependencies used for both building and testing ERMrestJS.


## Building The Package

If you want to build the package, you will need to have `Node.js` installed and on your path. The build script will pull in all of the
dependencies into the `dist/` directory.

```sh
make dist
```

Even though this command will not deploy the package, during build we will inject some build-related parameters into the code. So you should make sure these environment variables are properly defined. You can find more information about these variables in the next section.


## Deploying

1. First you need to setup some environment variables to tell ERMRestJS where it should install the package. The following are the variables and their default values:

    ```sh
    WEB_URL_ROOT=/
    WEB_INSTALL_ROOT=/var/www/html/
    ERMRESTJS_REL_PATH=ermrestjs/
    ```
    Which means EMRrestJS build folder will be copied to `/var/www/html/ermrestjs/` location by default. And ERMrestJS will be access by `/ermrestjs/` URL path when deployed. If that is not the case in your deployment, you should modify the variables accordingly.

    Notes:
    - All the variables MUST have a trailing `/`.

    - If you're deploying remotely, since we're using the `WEB_INSTALL_ROOT` in `rsync` command, you can use a remote location `username@host:public_html/` for this variable.

    - A very silly thing to do would be to set your deployment directory to root `/` and run `make deploy` with `sudo`. This would be very silly indeed, and would probably result in some corruption of your operating system. Surely, no one would ever do this. But, in the off chance that one might attempt such silliness, the `make deploy` rule specifies a `dont_deploy_in_root` prerequisite that attempts to put a stop to any such silliness before it goes too far.


2. Build the ERMrestJS bundles by running the following command:

    ```sh
    make dist
    ```

    Notes:
    - Make sure to run this command with the owner of the current folder. If you attempt to run this with a different user, it will complain.

3. To deploy the package, run the following:

    ```sh
    make deploy
    ```

    Notes:
    - If the given directory does not exist, it will first create it. So you may need to run `make deploy` with _super user_ privileges depending on the deployment directory you choose (by default it's `/var/www/html/`).

## Unit Testing

Before running the test cases you need to set the environment variables.
- `ERMREST_URL`: the URL to the ERMrest service on a (possibly, remote) host.
- `AUTH_COOKIE`: a primary user cookie valid to the (possibly, remote) host running the ERMrest service.
- `RESTRICTED_AUTH_COOKIE`: a secondary user cookie valid to the (possibly, remote) host running the ERMrest service.

```sh
export ERMREST_URL=https://hostname/ermrest
export AUTH_COOKIE=YOUR_WEBAUTHN_COOKIE
export RESTRICTED_AUTH_COOKIE=YOUR_SECOND_USER_WEBAUTHN_COOKIE
```


You also need to ensure all dependencies are installed (`make dist` only installed modules needed for build) by running the following:

```sh
make deps-test
```

To execute the tests, run the following command:

```sh
make test
```


## More Help

See `make help` for more supported build tools.
