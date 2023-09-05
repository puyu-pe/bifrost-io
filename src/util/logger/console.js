
class ConsoleLogger {

  constructor(title) {
    this.count = 1;
    this.title = title;
  }


  info(message) {
    this.logWrapper("info: " + message, '\x1b[34m');
  }

  error(message) {
    this.logWrapper("error: " + message, '\x1b[31m');
  }

  warning(message) {
    this.logWrapper("warning: " + message, '\x1b[33m');
  }

  logWrapper(message, color) {
    console.log(`\n---------------------------- LOG ${this.title} N° ${this.count} ----------------------------`);
    console.log('\x1b[36m',`Hora: ${formatDate(new Date())}`);
    console.log(color, `\t-${message}`,"\x1b[0m");
    console.log(`--------------------------------- end -------------------------------------------------------\n`);
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