const { Socket } = require('socket.io');
const { ConsoleLogger } = require('../util/console-logger');

const logger = new ConsoleLogger("YURES WAITER SERVICE");

/**
 * @param {Socket} socket 
 */
function YuresWaiterService(socket) {
  const namespace = socket.nsp;
  logger.info(`Nueva conexión en ${namespace.name}`);
  // evento que debe ser emitido por mesero
  socket.on("change-status-table", data => {
    //emitir al cajero y los demas meseros
    socket.broadcast.emit("change-status-table", data);
  })

}

// yures:waiter-{ruc}-{sufijo_sucursal}
const yuresWaiterNamespacePattern = /^\/yures:waiter-(\d{11})(-\d{1})?$/m;

module.exports = {
  YuresWaiterService,
  yuresWaiterNamespacePattern
};