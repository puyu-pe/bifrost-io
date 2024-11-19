const config = require("../config.js");

const {
  init_printingwebsocket_service,
} = require("./services/printing-websocket/index.js");
const { init_yureswaiter_service } = require("./services/yures-waiter");
const { init_printing_service } = require("./services/printing");
const { ConsoleLogger } = require("./util/logger/console");
const { io, httpServer, app } = require("./server");
const { init_yuresmovement_service } = require("./services/yures-movement/index.js");
const { init_yuresitemslimit_service } = require("./services/yures-items/index.js");

init_printing_service(app, io);
init_yureswaiter_service(io);
init_yuresmovement_service(io)
init_yuresitemslimit_service(io)
// init_printingwebsocket_service(io);

const SERVER_PORT = config.PORT;
httpServer.listen(SERVER_PORT, () => {
  const logger = new ConsoleLogger("SERVIDOR BIFROST");
  logger.info(
    [`NODE_ENV: ${config.NODE_ENV}`, `PORT: ${config.PORT}`],
    "Bifrost GO!!!"
  );
});
