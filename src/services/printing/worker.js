const { Socket } = require("socket.io");
const { PrintingServiceContext } = require("./context");

const managerStorage = PrintingServiceContext.getManagerStorage();
const logger = PrintingServiceContext.getLogger();

const events = {
  printerGetPrintingQueue: "printer:get-printing-queue",
  printerPrintItem: "printer:print-item",
  printerReleaseQueue: "printer:release-queue"
};

const emitters = {
  printerEmitItem: "printer:emit-item",
  printerSendPrintingQueue: "printer:send-printing-queue",
  printerSendNumberOfItemsInQueue: "printer:send-number-items-queue"
};

/**
 * @param {Socket} socket
 */
function PrintingService(socket) {
  const namespace = socket.nsp;
  const storage = managerStorage.provideStorage(namespace.name);
  logger.debug([`namespace: ${namespace.name}`], "Nueva conexión");

  storage.setOnQueue(async (memObject) => {
    try {
      namespace.emit(emitters.printerEmitItem, {
        message: "Se obtuvo un ticket para imprimir",
        data: memObject,
      });
      await emitNumberItemsQueue(namespace, storage);
    } catch (error) {
      logger.error([
        "event: printer-emit-item",
        `error: ${error}`,
        `namespace: ${namespace.name}`
      ],"Excepción al emitir un ticket de la cola de impresión");
    }
  });

  socket.on(events.printerGetPrintingQueue, async () => {
    try {
      const queue = await storage.getQueue(namespace.name);
      const numberOfItemsPrintQueue = Object.keys(queue).length;
      namespace.emit(emitters.printerSendPrintingQueue, {
        message: `Se obtuvo ${numberOfItemsPrintQueue} elementos de la cola de impresión`,
        data: queue,
        status: "success",
      });
      logger.debug(
        [
          `cola de impresión: ${numberOfItemsPrintQueue}`,
          `namespace: ${namespace.name}`,
          `event: ${events.printerGetPrintingQueue}`,
        ],
        "Se solicita cola de impresión"
      );
      await emitNumberItemsQueue(namespace, storage);
    } catch (error) {
      namespace.emit(emitters.printerSendPrintingQueue, {
        message: `El servidor tuvo un fallo: ${error.toString()}`,
        data: {},
        status: "error",
      });
      logger.error(
        [
          `namespace: ${namespace.name}`,
          `event: ${events.printerGetPrintingQueue}`,
          `error: ${error}`,
        ],
        "Error solicitud cola de impresión"
      );
    }
  });

  socket.on(events.printerPrintItem, async (data) => {
    try {
      const success = await storage.dequeue(namespace.name, data.key);
      logger.debug(
        [
          `status: ${success ? "exito" : "fallido"}`,
          `namespace: ${namespace.name}`,
          `event: ${events.printerPrintItem}`,
        ],
        "Se intenta liberar un ticket de cola de impresión"
      );
      await emitNumberItemsQueue(namespace, storage);
    } catch (error) {
      logger.error(
        [
          `event: ${events.printerPrintItem}`,
          `namespace: ${namespace.name}`,
          `error: ${error}`,
        ],
        "Ocurrio un error"
      );
    }
  });

  socket.on(events.printerReleaseQueue, async () => {
    try {
      const success = await storage.emptyPrintQueue(namespace.name);
      logger.debug(
        [
          `status: ${success ? "exito" : "fallido"}`,
          `namespace: ${namespace.name}`,
        ],
        "Se intenta liberar cola de impresión"
      );
      await emitNumberItemsQueue(namespace, storage);
    } catch (error) {
      logger.error(
        [
          `namespace: ${namespace.name}`,
          `event: ${events.printerReleaseQueue}`,
          `error: ${error}`,
        ],
        "Error al liberar cola de impresión"
      );
    }
  });

  socket.on("disconnect", () => {
    const instancesStorage = managerStorage.tryDetach(namespace.name);
    logger.debug(
      [
        `namespace: ${namespace.name}`,
        `instancias de storage: ${instancesStorage}`,
      ],
      "Se desconecta un cliente"
    );
  });
}

async function emitNumberItemsQueue(namespace, storage) {
  const numberItemsInQueue = await storage.numberItemsInQueue(namespace.name);
  namespace.emit(emitters.printerSendNumberOfItemsInQueue, numberItemsInQueue);
  logger.debug(
    [
      `event: ${emitters.printerSendNumberOfItemsInQueue}`,
      `namespace: ${namespace.name}`,
      `Elementos en cola: ${numberItemsInQueue}`,
    ],
    "Se emite elementos en cola"
  );
}

//printing-{ruc}-{sufijo_sucursal}
const printingNamespacePattern = /^\/printing-(\d{11})(-\d{1})?$/m;

module.exports = {
  PrintingService,
  printingNamespacePattern,
};
