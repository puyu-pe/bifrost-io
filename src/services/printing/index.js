const { PrintingRouter } = require("./api/v1");
const { PrintingWorker, WorkerNamespacePattern } = require("./api/v1/websocket");

/**
 * @param {Express} app 
 * @param {Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} io 
 */
function init_printing_service(app, io){
	app.use('/api/v1/print', PrintingRouter);
	const printingWorkerNamespace = io.of(WorkerNamespacePattern);
	printingWorkerNamespace.on("connection",PrintingWorker);
}

module.exports = {
	init_printing_service
};
