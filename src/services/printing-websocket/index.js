const { Socket } = require("socket.io");
const { ConsoleLogger } = require("../../util/logger/console");
const { BifrostManagerStorage } = require("../../storage/memcached/manager");

const EXPIRES_TIME_FROM_DATA = 300 * 60;
const managerStorage = new BifrostManagerStorage(EXPIRES_TIME_FROM_DATA);
const logger = new ConsoleLogger("PRINTING SERVICE");

const events = {
  browserSaveItem: "browser:save-item",
  printerGetPrintingQueue: "printer:get-printing-queue",
  printerPrintItem: "printer:print-item",
  printerReleaseQueue: "printer:release-queue",
};

const emitters = {
  browserItemSaveStatus: "browser:item-save-status",
  printerEmitItem: "printer:emit-item",
  printerSendPrintingQueue: "printer:send-printing-queue",
  printerSendNumberOfItemsInQueue: "printer:send-number-items-queue",
};

/**
 * @param {Socket} socket
 */
function PrintingService(socket) {
  const namespace = socket.nsp;
  const storage = managerStorage.provideStorage(namespace.name);

  logger.debug([`namespace: ${namespace.name}`], "Nueva conexión");

  socket.on(events.browserSaveItem, async (dataToPrint) => {
    try {
      const storageInfo = await storage.enqueue(namespace.name, dataToPrint);
      const wasSavedSuccess = storageInfo.success;
      if (wasSavedSuccess) {
        namespace.emit(emitters.printerEmitItem, {
          message: "Se obtuvo un ticket para imprimir",
          data: storageInfo.memObject,
        });
      }
      namespace.emit(emitters.browserItemSaveStatus, {
        message: wasSavedSuccess
          ? "Impresion almacenada correctamente"
          : "No se persistio la información",
        success: wasSavedSuccess ? "success" : "error",
      });
      logger.debug(
        [
          `status: ${wasSavedSuccess ? "exito" : "fallido"}`,
          `event: ${events.browserSaveItem}`,
          `namespace ${namespace.name}`,
          `dataToPrint: ${JSON.stringify(dataToPrint)}`,
        ],
        `Se intenta guardar un ticket`
      );
      await emitNumberItemsQueue(namespace, storage);
    } catch (error) {
      namespace.emit(emitters.browserItemSaveStatus, {
        message: "El servidor a fallado, vuelve a intentarlo despues.",
        success: "error",
      });
      logger.error(
        [
          `event: ${events.browserSaveItem}`,
          `namespace: ${namespace.name}`,
          `error: ${error}`,
        ],
        "Ocurrio un error"
      );
    }
  });

  socket.on(events.printerGetPrintingQueue, async (dataFromPrinter) => {
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

function init_printingwebsocket_service(io) {
  const printingNamespace = io.of(printingNamespacePattern);
  printingNamespace.on("connection", PrintingService);
}

module.exports = {
	init_printingwebsocket_service
};
