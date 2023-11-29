const config = require("../../config.js");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const express = require("express");
const cors = require("cors");

const MAX_LISTENERS = 100;

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  },
});

io.sockets.setMaxListeners(MAX_LISTENERS);

instrument(io, {
  auth: false,
  mode: config.NODE_ENV,
});

app.use(cors());

app.get("/", (_, res) => {
  res.send("Bifrost online");
});

module.exports = {
  io,
  httpServer,
  app,
};
