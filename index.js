require('dotenv').config();

const { io, httpServer } = require('./server');
const { YuresWaiterService, yuresWaiterNamespacePattern } = require('./services/yures-waiter-service');
const { YuresPrinterService, yuresPrinterNamespacePattern } = require('./services/yures-printer-service');
const { ConsoleLogger } = require('./util/console-logger');


const logger = new ConsoleLogger("Servidor Bifrost.io");
const yuresWaiterNamespace = io.of(yuresWaiterNamespacePattern);
const yuresPrinterNamespace = io.of(yuresPrinterNamespacePattern);

yuresWaiterNamespace.on("connection", YuresWaiterService)
yuresPrinterNamespace.on("connection", YuresPrinterService);


httpServer.on("onerror", (error) => {
	logger.error(`A ocurrido un error en el servidor: ${error}`);
})


const SERVER_PORT = 3001;
httpServer.listen(SERVER_PORT, () => {
	logger.info(`Bifrost habilitado en el puerto ${SERVER_PORT}!!!`);
});
