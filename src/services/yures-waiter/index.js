const { Socket } = require("socket.io");
const { ConsoleLogger } = require("../../util/logger/console");

const logger = new ConsoleLogger("SERVICIO YURES WAITER");

/**
 * @param {Socket} socket
 */
function YuresWaiterService(socket) {
  const namespace = socket.nsp;
  logger.debug([`namespace: ${namespace.name}`], "Nueva Conexión");
  // evento que debe ser emitido por mesero
  socket.on("change-status-table", (data) => {
    logger.debug(`data: ${JSON.stringify(data)}`, "Se modifica estado mesa");
    socket.broadcast.emit("change-status-table", data);
  });
}

// yures:waiter-{ruc}-{sufijo_sucursal}
const yuresWaiterNamespacePattern = /^\/yures:waiter-(\d{11})(-\d{1})?$/m;

function init_yureswaiter_service(io) {
  const yuresWaiterNamespace = io.of(yuresWaiterNamespacePattern);
  yuresWaiterNamespace.on("connection", YuresWaiterService);
}

module.exports = {
	init_yureswaiter_service
};
