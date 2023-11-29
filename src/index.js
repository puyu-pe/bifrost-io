const config = require("../config.js");

const {
  init_printingwebsocket_service,
} = require("./services/printing-websocket/index.js");
const { init_yureswaiter_service } = require("./services/yures-waiter");
const { init_printing_service } = require("./services/printing");
const { ConsoleLogger } = require("./util/logger/console");
const { io, httpServer, app } = require("./server");
const { init_yuresmovement_service } = require("./services/yures-movement/index.js");

init_printing_service(app, io);
init_yureswaiter_service(io);
init_yuresmovement_service(io)
// init_printingwebsocket_service(io);

const SERVER_PORT = config.PORT;
// WARN: remove specific ip before release
httpServer.listen(SERVER_PORT, "192.168.1.52", () => {
  const logger = new ConsoleLogger("SERVIDOR BIFROST");
  logger.info(
    [`NODE_ENV: ${config.NODE_ENV}`, `PORT: ${config.PORT}`],
    "Bifrost GO!!!"
  );
});
