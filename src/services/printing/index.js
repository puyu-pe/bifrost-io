const { Socket } = require("socket.io");
const { ConsoleLogger } = require("../../util/logger/console");
const { BifrostManagerStorage } = require("../../storage/memcached/manager");

const EXPIRES_TIME_FROM_DATA = 300 * 60;
const managerStorage = new BifrostManagerStorage(EXPIRES_TIME_FROM_DATA);
const logger = new ConsoleLogger("PRINTER SERVICE");

/**
 * @param {Socket} socket
 */
function YuresPrinterService(socket) {
  const namespace = socket.nsp;
  const storage = managerStorage.provideStorage(namespace.name);

  logger.debug([
    `namespace: ${namespace.name}`
  ], "Nueva conexión")

  socket.on("yures:save-print", async (dataToPrint) => {
    try {
      const storageInfo = await storage.enqueue(namespace.name, dataToPrint);
      if (storageInfo.success) {
        namespace.emit("printer:to-print", {
          message: "Se obtuvo un ticket para imprimir",
          data: storageInfo.memObject,
        });
        namespace.emit("yures:save-print-status", {
          message: "Impresion almacenada correctamente",
          success: "success",
        });
      } else {
        namespace.emit("yures:save-print-status", {
          message: "No se persistio la información",
          success: "error",
        });
      }
      logger.debug([
        `status: ${storageInfo.success ? 'exito' : 'fallido'}`,
        'event: save-print',
        `namespace ${namespace.name}`,
        `dataToPrint: ${JSON.stringify(dataToPrint)}`
      ], `Se intenta guardar un ticket`);
      await emitNumberItemsQueue(namespace, storage)
    } catch (error) {
      namespace.emit("yures:save-print-status", {
        message: "El servidor a fallado, vuelve a intentarlo despues.",
        success: "error",
      });
      logger.error([
        'event: save-print',
        `namespace: ${namespace.name}`,
        `error: ${error}`
      ], "Ocurrio un error");
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
      logger.debug([
        `cola de impresión: ${numberOfItemsPrintQueue}`,
        `namespace: ${namespace.name}`,
        `event: printer-start`
      ], "Se solicita cola de impresión")
      await emitNumberItemsQueue(namespace, storage);
    } catch (error) {
      namespace.emit("printer:load-queue", {
        message: `El servidor tuvo un fallo: ${error.toString()}`,
        data: {},
        status: "error",
      });
      logger.error([
        `namespace: ${namespace.name}`,
        `event: printer-start`,
        `error: ${error}`
      ], "Error solicitud cola de impresión");
    }
  });

  socket.on("printer:printed", async (data) => {
    try {
      const success = await storage.dequeue(namespace.name, data.key);
      logger.debug([
        `status: ${success ? 'exito' : 'fallido'}`,
        `namespace: ${namespace.name}`,
        'event: printer-printed'
      ], "Se intenta liberar un ticket de cola de impresión")
      await emitNumberItemsQueue(namespace, storage);
    } catch (error) {
      logger.error([
        `event: printer-printed`,
        `namespace: ${namespace.name}`,
        `error: ${error}`
      ], 'Ocurrio un error')
    }
  });

  socket.on("printer:release-queue", async () => {
    try {
      const success = await storage.emptyPrintQueue(namespace.name);
      logger.debug([
        `status: ${success ? 'exito' : 'fallido'}`,
        `namespace: ${namespace.name}`,
      ], "Se intenta liberar cola de impresión")
      await emitNumberItemsQueue(namespace, storage)
    } catch (error) {
      logger.error([
        `namespace: ${namespace.name}`,
        'event: printer-release-queue',
        `error: ${error}`
      ], "Error al liberar cola de impresión");
    }
  });

  socket.on("disconnect", () => {
    const instancesStorage = managerStorage.tryDetach(namespace.name)
    logger.debug([
      `namespace: ${namespace.name}`,
      `instancias de storage: ${instancesStorage}`
    ], 'Se desconecta un cliente')
  });
}

async function emitNumberItemsQueue(namespace, storage) {
  const numberItemsInQueue = await storage.numberItemsInQueue(namespace.name)
  namespace.emit(
    "printer:number-items-queue",
    numberItemsInQueue
  );
  logger.debug([
    'event: save-print',
    `namespace: ${namespace.name}`,
    `Elementos en cola: ${numberItemsInQueue}`
  ], "Se emite elementos en cola")
}

// yures:printer-{ruc}-{sufijo_sucursal}
const yuresPrinterNamespacePattern = /^\/yures:printer-(\d{11})(-\d{1})?$/m;

module.exports = {
  YuresPrinterService,
  yuresPrinterNamespacePattern,
};
