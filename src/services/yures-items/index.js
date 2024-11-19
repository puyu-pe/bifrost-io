const { Socket } = require("socket.io");
const { ConsoleLogger } = require("../../util/logger/console");

const logger = new ConsoleLogger("SERVICIO YURES ITEMS LIMIT");

/**
 * @param {Socket} socket
 */
function YuresItemsLimitService(socket) {
  const namespace = socket.nsp;
  logger.debug([`namespace: ${namespace.name}`], "Nueva Conexión");
  // evento que debe ser emitido por mesero
  socket.on("items-limit", (data) => {
    logger.debug(`data: ${JSON.stringify(data)}`, "registro items-limit");
    socket.broadcast.emit("items-limit", data);
  });
}

// yures:items-limit-{ruc}-{sufijo_sucursal}
const yuresItemsLimitNamespacePattern = /^\/yures:items-limit-(\d{11})(-\d{1})?$/m;

function init_yuresitemslimit_service(io) {
  const yuresItemsLimitNamespace = io.of(yuresItemsLimitNamespacePattern);
  yuresItemsLimitNamespace.on("connection", YuresItemsLimitService);
}

module.exports = {
	init_yuresitemslimit_service
};
