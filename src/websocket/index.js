const { createServer } = require('http');
const { Server } = require('socket.io');
const { instrument } = require('@socket.io/admin-ui');
const config = require('../../config.js');

const MAX_LISTENERS = 20;

const httpServer = createServer((req, res) => {
	if (req.method === 'GET') {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');

		res.end('Bifrost online');
	} else {
		res.statusCode = 405;
		res.end();
	}
});

const io = new Server(httpServer, {
	cors: {
		origin: [
			"http://yubiz.puyu.pe",
			"http://yubiz-development.puyu.pe",
			"http://localhost:9091",
		],
		methods: ["GET", "POST"]
	}
});

io.sockets.setMaxListeners(MAX_LISTENERS);



instrument(io, {
	auth: false,
	mode: config.NODE_ENV
});

module.exports = {
  io,
  httpServer
}
