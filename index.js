const express = require('express');
const app = express();

const { createServer } = require('http');
const { Server } = require('socket.io');
const { instrument } = require('@socket.io/admin-ui');

const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: [
			"http://yubiz.puyu.pe",
			"http://yubiz-development.puyu.pe",
			"http://localhost:9091"
		],
		methods: ["GET", "POST"]
	}
});

instrument(io, {
	auth: false
});

let namespace = io.of(/^\/client-\d+$/);

namespace.on("connection", socket => {
	socket.on("item_operation", item => {
		socket.broadcast.emit("update_item_operation", item);
	});

	socket.on("session_config", item => {
		socket.broadcast.emit("update_session_config", item);
	});
});

httpServer.listen(3001);