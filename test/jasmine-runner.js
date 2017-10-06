var jasmineWrapper = require('./utils/jasmine-wrapper.js');

// function to run all test specs
jasmineWrapper.run(require('./support/jasmine.json'));
