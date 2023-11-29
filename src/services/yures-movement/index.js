const { Socket } = require("socket.io");
const { ConsoleLogger } = require("../../util/logger/console");

const logger = new ConsoleLogger("SERVICIO YURES MOVEMENT");

/**
 * @param {Socket} socket
 */
function YuresMovementService(socket) {
  const namespace = socket.nsp;
  logger.debug([`namespace: ${namespace.name}`], "Nueva Conexión");
  // evento que debe ser emitido por mesero
  socket.on("movement", (data) => {
    logger.debug(`data: ${JSON.stringify(data)}`, "Se emite un movimiento");
    socket.broadcast.emit("movement", data);
  });
}

// yures:waiter-{ruc}-{sufijo_sucursal}
const yuresMovementNamespacePattern = /^\/yures:movement-(\d{11})(-\d{1})?$/m;

function init_yuresmovement_service(io) {
  const yuresMovementNamespace = io.of(yuresMovementNamespacePattern);
  yuresMovementNamespace.on("connection", YuresMovementService);
}

module.exports = {
	init_yuresmovement_service
};
