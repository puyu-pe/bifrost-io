require('dotenv').config();

const { createServer } = require('http');
const { Server, Namespace } = require('socket.io');
const { instrument } = require('@socket.io/admin-ui');
const { BifrostPrinterStorage } = require('./printer-storage');

const EXPIRES_TIME_FROM_DATA = 20 * 60;
const MAX_LISTENERS = 20;
const SERVER_PORT = 3001;

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

io.sockets.setMaxListeners(MAX_LISTENERS);

instrument(io, {
	auth: false,
	mode: "development"
});


const storage = new BifrostPrinterStorage(EXPIRES_TIME_FROM_DATA);

const setNamespace = new Set();
io.on("connection", socket => {
	log(`Cliente conectado: \n\tip: ${socket.handshake.address} \n\tsocket_id:${socket.id}`, "io.on('connection')");

	socket.on("yures-printer", data => {
		if (!data || !data.namespace) {
			log(`Warning: \n\tEl cliente ${data.clientname} no envio información necesaria para configurar la conexión.`, "socket.on('yures-printer')");
			socket.emit("yures-printer-status", {
				message: `Fallo al conectarse al namespace: '${data.namespace}' namespace incorrecto`,
				status: "error",
			});
			return;
		}
		log(`El Cliente ${data.clientname || "No Specified"} conectado a ${data.namespace} `, 'socket.on("yures-printer")');
		if (!setNamespace.has(data.namespace)) {
			const namespace = io.of(data.namespace);
			configWorkflowYuresPrinter(namespace);
			setNamespace.add(data.namespace);
		}
		socket.emit("yures-printer-status", {
			message: "Namespace configurado exitosamente",
			status: "success",
		});
	})

})

/**
 * @param {Namespace} namespace - namespace socket.io
 */
function configWorkflowYuresPrinter(namespace) {
	namespace.on("connection", (socket) => {

		log(`NAMESPACE: ${namespace.name} ACTIVO`, "namespace.on('connection')");

		socket.on("yures:save-print", async (dataToPrint) => {
			try {
				log(`Se recibio información para imprimir de ${namespace.name}`, "namespace-event: yures:save_print");
				const storageInfo = await storage.enqueue(namespace.name, dataToPrint);
				if (storageInfo.success) {
					log(`Se almaceno información para imprimir en ${namespace.name}`, "namespace-event: yures:save-print");
					namespace.emit("printer:to-print", { data: storageInfo.memObject });
					namespace.emit("yures:save-print-status", { message: "Impresion almacenada correctamente", success: "success" });
				}
				else {
					log(`Danger:\n\t hubo un fallo al almacenar información en ${namespace.name}`, "namespace-event: yures:save-print");
					namespace.emit("yures:save-print-status", { message: "No se persistio la información", success: "error" });
				}
			} catch (error) {
				log(`error en ejecución en : ${error.toString()}`, "namespace-event: yures:save-print");
				namespace.emit("yures:save-print-status", { message: "El servidor a fallado, vuelve a intentarlo despues.", success: "error" });
			}
		})

		socket.on("printer:start", async (dataFromPrinter) => {
			try {
				const queue = await storage.getQueue(namespace.name);
				namespace.emit("printer:load-queue", { message: "Se recupero los datos correctamente", data: queue, status: "success" });
			} catch (error) {
				log(`error en ejecución : ${error.toString()}`, "namespace-event: printer:start");
				namespace.emit("printer:load-queue", { message: `El servidor tuvo un fallo: ${error.toString()}`, data: {}, status: "error" });
			}
		})

		socket.on("printer:printed", async (data) => {
			try {
				const success = await storage.dequeue(namespace.name, data.key);
				if (success) {
					log(`El Printer de ${namespace.name} imprimio correctamente los datos de ${data.key}`, "namespace-event: printer:printed")
				} else {
					log(`El Printer de ${namespace.name} no pudo imprimir los datos de ${data.key}`, "namespace-event: printer:printed");
				}
			} catch (error) {
				log(`error en ejecución: ${error.toString()}`, "namespace-event: printer:printed");
			}
		})

	})
}


let count_log = 1;
function log(message, scope) {
	console.log(`\nN°${count_log} LOG-REGISTER AT ${new Date().toString()}:\n`);
	console.log(`\tscope: ${scope || 'Not Specified'} \n\tlog: ${message || 'Not Specified'}\n`);
	console.log(`############# ---end---  ##############\n`);
	++count_log;
};

httpServer.listen(SERVER_PORT, () => {
	console.log(`Bifrost habilitado en el puerto ${SERVER_PORT}!!!`);
});
