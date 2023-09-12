const { ConsoleLogger } = require("../../util/logger/console");
const { BifrostManagerStorage } = require('../../storage/memcached/manager');

const EXPIRES_TIME_FROM_DATA = 300 * 60;
let logger = undefined;
let managerStorage = undefined;

class PrintingServiceContext {
  static getLogger() {
    if (logger === undefined) {
      logger = new ConsoleLogger("PRINTING SERVICE");
    }
    return logger;
  }
  static getManagerStorage() {
    if (managerStorage === undefined) {
      managerStorage = new BifrostManagerStorage(EXPIRES_TIME_FROM_DATA);
    }
    return managerStorage;
  }
}

module.exports = {
  PrintingServiceContext
}
