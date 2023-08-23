# Instalar Artillery
```
npm install -g artillery@latest
npm install -g artillery-engine-socketio-v3@latest
```
Nota: Se recomienda no descargar artillery en un entorno de producción

# 1. Conceptos Artillery

## Funcionamiento
Una prueba de carga en artillery es descrita por fases de carga + usarios virtuales.

## Usuario virtuales
Los usuarios virtuales emulan a usuarios reales que interactuaran con la aplicación, dicha interacción es descrita a traves de escenarios (conjunto de acciones).
Cada usuario es completamente independiente, no conparten estado.

## fases de carga
Las fases de carga se utilizan para describir cuantos usuarios virtuales deben crearse durante un periodo de tiempo, puede haber varias fases, como una fase de calentamiento y otras de carga pesada.
```
phases:
  - duration: 300 # duración de la fase
    arrivalRate: 10 # cuantos usuarios por segundo sera creado
```

## En accion
Empezara ejecutando cada fase de carga empezando desde el primero definido en el script yaml. Cada usuario virtual ejecutará uno de los escenarios en la definición de prueba.

## Referencias
- Socket.io ejemplo de prueba https://socket.io/docs/v4/load-testing/#manual-client-creation
- Artillery Documentation https://www.artillery.io/docs/reference/cli/run