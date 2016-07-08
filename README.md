# ermrestjs

ERMrest client library in JavaScript

This project is a work in progress. The API is in an early design stage.


## How to Build

Get the source and run `make`. See `make help` for information on alternative make targets.

```sh
git clone https://github.com/informatics-isi-edu/ermrestjs.git
cd ermrestjs
make all
```

## How to Test

Before running the test cases you need to set the environment variables.

```sh
export ERMREST_URL=https://dev.isrd.isi.edu/ermrest
export AUTH_COOKIE=YOUR_ERMREST_COOKIE
```

To execute test case run following command

```sh
make test
```

This command internally invokes the `node test/jasmine-runner.js` script.
