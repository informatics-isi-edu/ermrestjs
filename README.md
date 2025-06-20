# ERMrestJS [![Build Status](https://github.com/informatics-isi-edu/ermrestjs/actions/workflows/unit-test.yml/badge.svg?branch=master)](https://github.com/informatics-isi-edu/ermrestjs/actions?query=workflow%3A%22ERmrestJS+tests%22+branch%3Amaster)

ERMrestJS is a javascript client library for interacting with the [ERMrest](http://github.com/informatics-isi-edu/ermrest) service. It provides higher-level, simplified application programming interfaces (APIs) for working with the Entity-Relationship concepts native to ERMrest. 

The library has been extended to also support [Hatrac](https://github.com/informatics-isi-edu/hatrac) (an object store service), and [deriva-web export](https://github.com/informatics-isi-edu/deriva-web). ERMrestJS is a part of [Deriva Platform](http://isrd.isi.edu/deriva).

## Prerequisites

As described, ERMrestJS provides a Javascript API to ERMrest, Hatrac, and deriva-web export. Therefore, you need those services to be available on your server to use this API.


## Installation

See [ERMrestJS installation](docs/user-docs/installation.md).

## Usage

See [ERMrestJS usage](docs/user-docs/usage.md).

## Resources

Documents are categorized based on their audience.

- [User Docs](docs/user-docs): contains documents and examples of configuring and using ERMrestJS, most notably the [annotation guide](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/annotation.md).

- [Developer Docs](docs/dev-docs): contains development guides such as how to write unit tests.

## How to Contribute

When developing new code for ERMrestJS, please make sure you're following these steps:

1. create a new branch and make your updates to the code in the branch (avoid changing the `master` branch directly);
2. do your own quality assurance;
3. update all relevant documentation (Please refer to [this page](docs/dev-docs/update-docs.md) for more information);
4. update the unit tests (if applicable);
5. make sure there are no warnings or errors from static analysis programs (`make all` should be free of warnings and errors);
6. make sure you can deploy your code without any issues (`make dist && make deploy` should not fail);
7. make sure that all tests are passing before submitting the request (`make test` should be free of errors);
8. make your pull request, assign it to yourself, and ask someone to review your code.
  - Try to provide as much information as you can on your PR. Explain the issues that the PR is fixing and the changes that you've made in the PR.
  - Provide examples if applicable.
  - Resolve the conflicts with the `master` before merging the code (and ensure documentation and tests are good to go).

## Help and Contact

Please direct questions and comments to the [project issue tracker](https://github.com/informatics-isi-edu/ermrestjs/issues) at GitHub.

## License

ERMrestJS is made available as open source under the Apache License, Version 2.0. Please see the [LICENSE file](LICENSE) for more information.

## About Us

ERMrestJS is developed in the [Informatics Systems Research group](https://www.isi.edu/isr/) at the [USC Information Sciences Institute](http://www.isi.edu).

