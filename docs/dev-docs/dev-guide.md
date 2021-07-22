# Dev Guidelines

## Logging 

- Using console.log is discouraged as those logs could flood the console and we cannot suppress them at once and the exact type of log is not conveyed. We have our own logger that should be used instead, present [here](https://github.com/informatics-isi-edu/ermrestjs/blob/master/js/utils/logger.js), the function to be used is module._log.*level_of_log*(message) for example, module._log.info, module._log.error etc.
- We can suppress logs as per the logging level desired using module._log.setLevel(*log_level*) or module._log.enableAll() or module._log.disableAll().
- The appropriate logging level should be used for each function call.