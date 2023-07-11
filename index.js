require('dotenv').config();

const { createServer } = require('http');
const { Server, Namespace } = require('socket.io');
const { instrument } = require('@socket.io/admin-ui');
const { BifrostPrinterStorage } = require('./printer-storage');

const EXPIRES_TIME_FROM_DATA = 20 * 60;
const MAX_LISTENERS = 20;
const SERVER_PORT = 3001;

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
	mode: "production"
});


const storage = new BifrostPrinterStorage(EXPIRES_TIME_FROM_DATA);
const configuredNamespaces = new Set();

io.on("connection", socket => {
	log(`Nueva Conexión: \n\t\tip-address -> ${socket.handshake.address} \n\t\tsocket-id -> ${socket.id}`, "io event: 'connection'");

	socket.on("yures-printer", data => {
		if (!data || !data.namespace) {
			log(`Warning: \n\tEl cliente ${data.clientname} no envio información necesaria para configurar la conexión.`, "socket event: 'yures-printer'");
			socket.emit("yures-printer-status", {
				message: `Fallo al conectarse al namespace: '${data.namespace}' namespace incorrecto`,
				status: "error",
			});
			return;
		}
		log(`Una instancia de ${data.clientname || "No Specified"} conectado con ${data.namespace} `, 'socket event: "yures-printer"');
		if (!configuredNamespaces.has(data.namespace)) {
			const namespace = io.of(data.namespace);
			configWorkflowYuresPrinter(namespace, data.clientname);
			configuredNamespaces.add(data.namespace);
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
function configWorkflowYuresPrinter(namespace, clientname) {
	namespace.on("connection", (socket) => {

		log(`"${namespace.name}" ha entrado en actividad`, "namespace-event: 'connection'");

		socket.on("yures:save-print", async (dataToPrint) => {
			try {
				log(`Se recibio información para imprimir de ${namespace.name}`, "namespace-event: yures:save_print");
				const storageInfo = await storage.enqueue(namespace.name, dataToPrint);
				if (storageInfo.success) {
					log(`Se almaceno información de ${namespace.name} listo para imprimir`, "namespace-event: yures:save-print");
					namespace.emit("printer:to-print", { data: storageInfo.memObject });
					namespace.emit("yures:save-print-status", { message: "Impresion almacenada correctamente", success: "success" });
				}
				else {
					log(`Danger:\n\tFallo al almacenar información de ${namespace.name}`, "namespace-event: yures:save-print");
					namespace.emit("yures:save-print-status", { message: "No se persistio la información", success: "error" });
				}
			} catch (error) {
				log(`error en ejecución: ${error.toString()}`, "namespace-event: yures:save-print");
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

		socket.on("disconnect", () => {
			log(`Una instancia de ${clientname} en el namespace ${namespace.name} se desconecto!!`, "namespace-event: disconnect");
		})

	})
}

httpServer.on("onerror", (error) => {
	log(`A ocurrido un error en el servidor: ${error}`, "httpServer.on('onerror')");
})


let count_log = 1;
function log(message, scope) {
	console.log(`\n---------------------------- LOG N° ${count_log} ----------------------------`);
	console.log(`Hora: ${formatDate(new Date())}`);
	console.log(`\tinfo: ${message || ' '}`);
	console.log(`\tscope: ${scope || 'scope no especificado'}`);
	console.log(`--------------------------------- end -----------------------------------------\n`);
	++count_log;
};



/**
 * @param {Date} date - namespace socket.io
 */
function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${hours}:${minutes}:${seconds} - ${day}-${month}-${year}`;
}

httpServer.listen(SERVER_PORT, () => {
	console.log(`Bifrost habilitado en el puerto ${SERVER_PORT}!!!`);
});
