const { Socket } = require('socket.io');

/**
 * @param {Socket} socket 
 */
function YuresWaiterService(socket) {

  // evento que debe ser emitido por mesero
  socket.on("change-status-table", data => {
    //emitir al cajero y los demas meseros
    socket.broadcast.emit("change-status-table", data);
  })

}

// yures:waiter-{ruc}-{sufijo_sucursal}
const yuresWaiterNamespacePattern = /^yures:waiter-(\d+)-([a-zA-Z]+)$/gm;

module.exports = {
  YuresWaiterService,
  yuresWaiterNamespacePattern
};