const express = require("express");
const { PrintingServiceContext } = require("../../context");
const VALID_NAMESPACE_PATTERN = /^\/printing-(\d{11})(-\d{1})?$/m;
const VALID_RUC_PATTERN = /^(\d{11})$/m;
const VALID_BRANCH_PATTERN = /^(\d{1})$/m;

const managerStorage = PrintingServiceContext.getManagerStorage();
const logger = PrintingServiceContext.getLogger();
const PrintingRouter = express.Router();

PrintingRouter.get("/", (_, res) => {
  res.send("SERVICIO DE IMPRESIÓN ONLINE");
});

PrintingRouter.use(express.json());
PrintingRouter.post(
  "/",
  validateParams,
  requestNamespace,
  validateNamespace,
  async (req, res) => {
    try {
      logger.debug(
        [
          `event: controlador POST para api/v1/print`,
          `namespace ${namespace}`,
          `data: ${JSON.stringify(req.body.data)}`
        ],
        `Llega datos para imprimir`
      );
      const namespace = req.namespace;
      const storage = managerStorage.provideStorage(namespace);
      const storageInfo = await storage.enqueue(namespace, req.body.data);
      if (!storageInfo.success)
        throw "memcached no pudo almacenar la data, memcached no funcionó";
      res
        .status(200)
        .json(makeResponse("success", "Exito al almacenar el ticket", ""));
      const instancesStorage = managerStorage.tryDetach(namespace);
      logger.debug(
        [
          `namespace: ${namespace}`,
          `instancias de storage: ${instancesStorage}`
        ],
        "Se logro almacenar correctamente la data para imprimir"
      );
    } catch (error) {
      logger.error(
        [
          `event: controlador POST para api/v1/print`,
          `namespace: ${namespace}`,
          `error: ${error}`,
        ],
        "Excepción al registrar un ticket"
      );
      res
        .status(500)
        .json(makeResponse("error", "Excepción al guardar un ticket", error));
    }
  }
);

function validateParams(req, res, next) {
  try {
    const ruc = req.query.r;
    const branch = req.query.b;
    if (!ruc) {
      return res
        .status(400)
        .json(
          makeResponse(
            "error",
            "El número de ruc no puede estar vacio",
            "ruc is undefined"
          )
        );
    }
    if (!VALID_RUC_PATTERN.test(ruc)) {
      return res
        .status(400)
        .json(
          makeResponse(
            "error",
            `El ruc: ${ruc} no cumple con un formato valido`,
            "ruc incorrecto"
          )
        );
    }
    if (branch && !VALID_BRANCH_PATTERN.test(branch)) {
      return res
        .status(400)
        .json(
          makeResponse(
            "error",
            "Número de sucursal invalido",
            "branch incorrecto"
          )
        );
    }
    if (!req.body || !req.body.data) {
      return res
        .status(400)
        .json(
          makeResponse(
            "error",
            "No se envio información para imprimir",
            "body.data is undefined"
          )
        );
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json(
        makeResponse(
          "error",
          "Excepción al validar los parametros de consulta",
          error
        )
      );
  }
}

function validateNamespace(req, res, next) {
  try {
    if (!req.namespace) {
      return res
        .status(500)
        .json(
          makeResponse(
            "error",
            "Error al validar el namespace",
            "namespace is undefined"
          )
        );
    }
    if (!VALID_NAMESPACE_PATTERN.test(req.namespace)) {
      return res
        .status(500)
        .json(
          makeResponse(
            "error",
            `El namespace ${req.namespace} es invalido`,
            "namespace mal formado"
          )
        );
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json(makeResponse("error", "Excepción al validar namespace", error));
  }
}

function requestNamespace(req, _, next) {
  const ruc = req.query.r || "";
  const branch = req.query.b ? "-" + req.query.b : "";
  const service = "/printing";
  req.namespace = service + "-" + ruc + branch;
  next();
}

function makeResponse(status, message, error) {
  return {
    status,
    message,
    error: error.toString(),
  };
}

module.exports = {
  PrintingRouter,
};
