require('dotenv').config();

const { yuresPrinterNamespacePattern, YuresPrinterService } = require('./services/printing');
const { yuresWaiterNamespacePattern, YuresWaiterService } = require('./services/yures-waiter');
const { ConsoleLogger } = require('./util/logger/console');
const { io, httpServer } = require('./websocket');

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
