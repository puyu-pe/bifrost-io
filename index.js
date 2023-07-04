require('dotenv').config();

const { createServer } = require('http');
const { Server } = require('socket.io');
const { instrument } = require('@socket.io/admin-ui');
const { Client: ClientMemcached } = require('memjs');

const memcached = ClientMemcached.create();

const httpServer = createServer();
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

io.sockets.setMaxListeners(15);

instrument(io, { 
	auth: false,
	mode: "development"
});

function configYuresSocket(namespace_io, namespace) {

	namespace_io.on("connection", (socket) => {

		socket.on("to_print", async (to_print_object) => {
			try {
				console.log(`Se recibio pakqete de yures - ${new Date().toString()}`)
				const data = await memcached.get(namespace);

				let queue_object = {};
				if (data.value)
					queue_object = JSON.parse(data.value.toString());

				const created_at = Date.now();
				const data_object = {
					data_str: JSON.stringify(to_print_object),
					created_at: new Date(created_at).toString(),
					namespace,
				};

				const memjs_object = {}
				memjs_object[`${created_at}`] = JSON.stringify(data_object);

				const success = await memcached.set(
					namespace,
					JSON.stringify({ ...queue_object, ...memjs_object }),
					{ expires: 1200 }
				);

				socket.emit("onsave", { success });
				socket.emit("onprint", memjs_object);

			} catch (error) {
				console.log("error en ejecución en configYuresSocket(): ", error.toString());
			}
		});

	})
}

function configPrinterSocket(namespace_io, namespace) {
	namespace_io.on("connection", async (socket) => {

		try {
			const data = await memcached.get(namespace);

			if (data.value)
				socket.emit("load-queue", JSON.parse(data.value.toString()));
			else
				socket.emit("load-queue", {});

			socket.on("printed", async function (data) {
				await memcached.delete(data.namespace);
			});
		} catch (error) {
			console.log("error en ejecución en configPrinterSocket(): ", error.toString());
		}

	});
}

io.on("connection", (socket) => {

	//a la escucha de yures
	socket.on('connect-yures', (dataClient) => {
		const namespace_io = io.of(dataClient.namespace);
		console.log(`from YuRes: ${dataClient.namespace} connected! at ${new Date().toString()}`);
		configYuresSocket(namespace_io, dataClient.namespace);
		socket.emit("connect-yures-success", {});
	});

	// a la escucha del printer
	socket.on('connect-printer', (dataClient) => {
		const namespace_io = io.of(dataClient.namespace);
		console.log(`from PRINTER: ${dataClient.namespace} connected! ${new Date().toString()}`);
		configPrinterSocket(namespace_io, dataClient.namespace);
		socket.emit("connect-printer-success", {});
	})


	socket.on('disconnect', () => {
		console.log("disconnected");
	})

})

const SERVER_PORT = 3001;

httpServer.listen(SERVER_PORT, () => {
	console.log(`Servidor de sockets escuchando en el puerto ${SERVER_PORT}`);
});