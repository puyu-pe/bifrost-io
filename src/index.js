const config = require('../config.js');
const { printingNamespacePattern, PrintingService } = require('./services/printing/index.js');

const { yuresPrinterNamespacePattern, YuresPrinterService } = require('./services/yures-printing/index.js');
const { yuresWaiterNamespacePattern, YuresWaiterService } = require('./services/yures-waiter');
const { ConsoleLogger } = require('./util/logger/console');
const { io, httpServer } = require('./websocket');

const logger = new ConsoleLogger("SERVIDOR BIFROST");
const yuresWaiterNamespace = io.of(yuresWaiterNamespacePattern);
const yuresPrinterNamespace = io.of(yuresPrinterNamespacePattern);
const printingNamespace = io.of(printingNamespacePattern);

yuresWaiterNamespace.on("connection", YuresWaiterService)
yuresPrinterNamespace.on("connection", YuresPrinterService);
printingNamespace.on("connection", PrintingService);

httpServer.on("onerror", (error) => {
  logger.error([
    `location: httpServer.on("onerror")`
    `error: ${error}`
  ],'Error detectado');
})

const SERVER_PORT = config.PORT;
httpServer.listen(SERVER_PORT, () => {
  logger.info([
    `NODE_ENV: ${config.NODE_ENV}`,
    `PORT: ${config.PORT}`
  ],'Bifrost GO!!!');
});

