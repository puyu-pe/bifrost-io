const config = require('../config.js');

const { printingNamespacePattern, PrintingService } = require('./services/printing-websocket/index.js');
const { yuresWaiterNamespacePattern, YuresWaiterService } = require('./services/yures-waiter');
const { PrintingRouter } = require('./services/printing/index.js');
const { ConsoleLogger } = require('./util/logger/console');
const cors = require('cors');
const { io, httpServer, app } = require('./server');

//init express-service
app.use(cors())
app.get('/', (_, res) => { res.send('Bifrost online') })
app.use('/api/v1/print', PrintingRouter);

//init socket.io-service
const yuresWaiterNamespace = io.of(yuresWaiterNamespacePattern);
const printingNamespace = io.of(printingNamespacePattern);
yuresWaiterNamespace.on("connection", YuresWaiterService)
printingNamespace.on("connection", PrintingService);

const SERVER_PORT = config.PORT;
httpServer.listen(SERVER_PORT, () => {
  const logger = new ConsoleLogger("SERVIDOR BIFROST");
  logger.info([
    `NODE_ENV: ${config.NODE_ENV}`,
    `PORT: ${config.PORT}`
  ], 'Bifrost GO!!!');
});

