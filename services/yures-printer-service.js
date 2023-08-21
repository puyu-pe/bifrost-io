const { Socket } = require("socket.io");
const { ConsoleLogger } = require("../util/console-logger");
const { BifrostManagerStorage } = require("../util/manager-storage");

const EXPIRES_TIME_FROM_DATA = 300 * 60;
const managerStorage = new BifrostManagerStorage(EXPIRES_TIME_FROM_DATA);
const logger = new ConsoleLogger("YURES PRINTER SERVICE");

/**
 * @param {Socket} socket
 */
function YuresPrinterService(socket) {
  const namespace = socket.nsp;
  const storage = managerStorage.provideStorage(namespace.name);

  logger.info(`Nueva Conexión en ${namespace.name}`);

  socket.on("yures:save-print", async (dataToPrint) => {
    try {
      const storageInfo = await storage.enqueue(namespace.name, dataToPrint);
      if (storageInfo.success) {
        logger.info(
          `Nuevo item guardado en cola de impresión en ${namespace.name}`
        );
        namespace.emit("printer:to-print", {
          message: "Se obtuvo un ticket para imprimir",
          data: storageInfo.memObject,
        });
        namespace.emit("yures:save-print-status", {
          message: "Impresion almacenada correctamente",
          success: "success",
        });
      } else {
        logger.warning(
          `No se pudo persistir item en la cola de impresión en ${namespace.name}`
        );
        namespace.emit("yures:save-print-status", {
          message: "No se persistio la información",
          success: "error",
        });
      }
    } catch (error) {
      namespace.emit("yures:save-print-status", {
        message: "El servidor a fallado, vuelve a intentarlo despues.",
        success: "error",
      });
      logger.error(
        `Fallo en ejecución en el servidor en ${namespace.name}: ${error}`
      );
    }
  });

  socket.on("printer:start", async (dataFromPrinter) => {
    try {
      const queue = await storage.getQueue(namespace.name);
      const numberOfItemsPrintQueue = Object.keys(queue).length;
      namespace.emit("printer:load-queue", {
        message: `Se obtuvo ${numberOfItemsPrintQueue} elementos de la cola de impresión`,
        data: queue,
        status: "success",
      });
      if (numberOfItemsPrintQueue > 0) {
        logger.info(
          `Se solicito cola de impresión y se respondio con ${numberOfItemsPrintQueue} tickets en ${namespace.name}`
        );
      } else {
        logger.info(
          `Se solicito cola de impresión, pero no hay tickets en cola. ${namespace.name}`
        );
      }
    } catch (error) {
      namespace.emit("printer:load-queue", {
        message: `El servidor tuvo un fallo: ${error.toString()}`,
        data: {},
        status: "error",
      });
      logger.error(
        `Solicitud FALLIDA de extración de cola de impresión en ${namespace.name}`
      );
    }
  });

  socket.on("printer:printed", async (data) => {
    try {
      const success = await storage.dequeue(namespace.name, data.key);
      if (success) {
        logger.info(
          `Se libero un ticket de la cola de impresión en ${namespace.name}`
        );
      } else {
        logger.warning(
          `No se pudo liberar un ticket de la cola de impresión en ${namespace.name}`
        );
      }
    } catch (error) {
      logger.error(
        `Error del servidor en ejecución en ${namespace.name}: ${error}`
      );
    }
  });

  socket.on("disconnect", () => {
    logger.info(`Hubo una desconexión en ${namespace.name}`);
  });
}

// yures:printer-{ruc}-{sufijo_sucursal}
const yuresPrinterNamespacePattern = /^\/yures:printer-(\d{11})(-\d{1})?$/gm;

module.exports = {
  YuresPrinterService,
  yuresPrinterNamespacePattern,
};
