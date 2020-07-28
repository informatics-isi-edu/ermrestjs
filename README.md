# ERMrestJS [![Build Status](https://travis-ci.org/informatics-isi-edu/ermrestjs.svg?branch=master)](https://travis-ci.org/informatics-isi-edu/ermrestjs) -- ERMrest client library in JavaScript

The ERMrestJS is a javascript client library for interacting with the [ERMrest](http://github.com/informatics-isi-edu/ermrest) service. It provides higher-level, simplified application programming interfaces (APIs) for working with the Entity-Relationship (ER) concepts that are native to ERMrest. The library has been extended to also support [Hatrac](http://github.com/informatics-isi-edu/hatrac)---an object store service, and [ioboxd](http://github.com/informatics-isi-edu/ioboxd)---an export service. ERMrestJS is a part of [Deriva Platform](http://isrd.isi.edu/deriva).

## Documention

Documents are categorized based on their audience.

- [Developer Docs](docs/dev-docs): contains [API docs](docs/dev-docs/api.md) and development guides such as how to write unit tests.

- [User Docs](docs/user-docs): contains documents and examples on how you can configure and use ERMrestJS.


## Prerequisites
As described, ERMrestJS is providing a Javascript API to ERMrest, Hatract, and iboxod. Therefore, to use this API you need those services to be available in your server.


## Installation

See [ERMrestJS installation](docs/user-docs/installation.md).

## Usage

ERMrestJS can be used in browser, nodeJS, or AngularJS environments. See [ERMrestJS usage](docs/user-docs/usage.md) for more detail.

## Code Contribute

When developing new code for ERMrestJS, please make sure you're following these steps:

1. create a new branch and make your updates to the code in the branch (avoid changing master branch directly);
2. do your own quality assurance;
3. update the API documentation (running `make all` will take care of that);
4. update the unit tests (if applicable);
5. make sure there are no warnings or errors from static analysis programs
  (`make all` should be free of warnings and errors);
6. make sure you can deploy your code without any issues (`make install` should not fail);
7. make sure that all tests are passing before submitting the request (`make test` should be free of errors);
8. make your pull request, assign it to yourself, and ask someone to review your code. 
  - Try to provide as much information as you can on your PR. Explain the issues that the PR is fixing, and the changes that you've done in the PR.
  - Provide examples if applicable.
  - Resolve the conflicts with master before merging the code (and go through the process of making sure documentation and tests are good to go).

## Help and Contact

Please direct questions and comments to the [project issue tracker](https://github.com/informatics-isi-edu/ermrestjs/issues) at GitHub.

## License

ERMrestJS is made available as open source under the Apache License, Version 2.0. Please see the [LICENSE file](LICENSE) for more information.

## About Us

ERMrestJS is developed in the
[Informatics group](http://www.isi.edu/research_groups/informatics/home)
at the [USC Information Sciences Institute](http://www.isi.edu).
