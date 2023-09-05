const config = require('../../../config')


const colors = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  purple: "\x1b[35m",
  cyan: "\x1b[36m",
  none: "\x1b[0m",
}

class ConsoleLogger {

  constructor(title) {
    this.count = 1;
    this.title = title;
    this.env = config.NODE_ENV;
  }

  info(message, context) {
    this.logWrapper("info", message, colors.blue, context);
  }

  error(message, context) {
    this.logWrapper("error", message, colors.red, context);
  }

  warning(message, context) {
    this.logWrapper("warning", message, colors.yellow, context);
  }

  debug(message, context) {
    if (this.env === "development") {
      this.logWrapper("debug", message, colors.purple, context);
    }
  }

  logWrapper(level, message, color, context) {
    if (context === undefined) {
      context = "";
    }
    if (typeof message === "string") {
      message = [message]
    }
    console.log(colors.cyan, `\nHora: ${formatDate(new Date())}`);
    console.log(`LOG ${this.title} N° ${this.count}`);
    console.log(color, `\n- ${level} ${context}:`);
    for (let i = 0; i < message.length; ++i) {
      console.log(color, "\t* ", colors.none, message[i]);
    }
    console.log(colors.cyan, `\n-- end --\n`, colors.none);
    this.count += 1;
  }
}

/**
 * @param {Date} date - namespace socket.io
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds} - ${day}-${month}-${year}`;
}

module.exports = {
  ConsoleLogger,
}
