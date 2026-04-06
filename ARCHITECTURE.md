# Arquitectura — Bifrost IO

Este documento describe la arquitectura interna del proyecto para que cualquier agente IA o desarrollador pueda entender cómo está organizado el código, qué patrones se usan y cómo fluye la información.

---

## Visión general

Bifrost es un **servidor de mensajería en tiempo real** construido sobre Express + Socket.IO. Su responsabilidad es:

1. Recibir trabajos de impresión via HTTP y encolárlos en Memcached.
2. Notificar a los clientes WebSocket conectados cuando hay trabajo nuevo.
3. Hacer relay de eventos de negocio (estado de mesas, movimientos, límite de ítems) entre clientes del mismo namespace.

No contiene lógica de negocio propia — es una capa de transporte y encolado.

---

## Diagrama de módulos

```
src/index.js  (entry point)
    │
    ├── server/index.js          ← Express + Socket.IO + Admin UI
    │
    ├── services/printing/
    │   ├── context.js           ← Singleton: logger + managerStorage
    │   ├── index.js             ← Monta router REST y namespace WS
    │   └── api/v1/
    │       ├── index.js         ← POST /api/v1/print (HTTP)
    │       └── websocket.js     ← PrintingWorker (WS events)
    │
    ├── services/yures-waiter/   ← Relay change-status-table
    ├── services/yures-movement/ ← Relay movement
    ├── services/yures-items/    ← Relay items-limit
    │
    └── storage/memcached/
        ├── index.js             ← BifrostPrinterStorage
        └── manager.js           ← BifrostManagerStorage (pool)
```

---

## Patrón de namespaces

Cada empresa (RUC) y sucursal tiene su propio namespace aislado. El servidor usa **regex dinámicos** para matchear namespaces en lugar de rutas estáticas:

```
/printing-{11 dígitos}[-{1 dígito}]
/yures:waiter-{11 dígitos}[-{1 dígito}]
/yures:movement-{11 dígitos}[-{1 dígito}]
/yures:items-{11 dígitos}[-{1 dígito}]
```

Esto permite que cualquier empresa se conecte sin necesidad de configurar el servidor previamente.

---

## Flujo de impresión

```
POST /api/v1/print?r={ruc}&b={branch}
    │
    ▼
validateParams()         → valida ruc, branch, body.data
requestNamespace()       → construye "/printing-{ruc}[-{branch}]"
validateNamespace()      → verifica formato del namespace
    │
    ▼
managerStorage.provideStorage(namespace)
    │ crea BifrostPrinterStorage si no existe
    ▼
storage.enqueue(namespace, data)
    │ mutex enqueueMutex
    │ lee cola actual de Memcached
    │ agrega { timestamp: { tickets, created_at, namespace } }
    │ escribe cola actualizada en Memcached (TTL: 300 min)
    │ llama on_queue(memObject)
    ▼
PrintingWorker.on_queue callback
    │
    ▼
namespace.emit("printer:emit-item", { message, data: memObject })
    │
    ▼
Clientes WS del namespace reciben el ticket
```

---

## Pool de storages (BifrostManagerStorage)

`BifrostManagerStorage` mantiene un `Map<namespace, { storage, instances }>`:

- `provideStorage(name)` — retorna el storage existente o crea uno nuevo, incrementa `instances` (máx 2).
- `tryDetach(name)` — decrementa `instances`. Cuando llega a 0, elimina el storage del mapa (libera memoria).

Esto evita crear instancias de Memcached redundantes para el mismo namespace.

---

## Servicios relay (waiter / movement / items)

Estos tres servicios siguen el mismo patrón minimalista:

```
socket.on("{evento}", (data) => {
  socket.broadcast.emit("{evento}", data)
})
```

`broadcast.emit` envía a todos los clientes del namespace **excepto al emisor**. No hay lógica adicional ni persistencia.

---

## Singleton de contexto (PrintingServiceContext)

El servicio de impresión usa un patrón Singleton lazy para compartir el logger y el managerStorage entre el router REST y el worker WebSocket sin acoplamiento directo:

```js
class PrintingServiceContext {
  static getLogger()        { /* instancia única de ConsoleLogger */ }
  static getManagerStorage(){ /* instancia única de BifrostManagerStorage */ }
}
```

---

## Logger

`ConsoleLogger` wrappea `console.log` con:
- Colores ANSI por nivel (`info`, `error`, `warning`, `debug`).
- Los logs de `debug` solo se emiten cuando `NODE_ENV === 'development'`.
- Contador de logs por instancia para trazabilidad.

---

## Configuración de entornos

`config.js` carga `env/{NODE_ENV}.env` via `dotenv`. El `NODE_ENV` se setea desde el proceso (scripts npm o PM2 `ecosystem.config.js`).

---

## Agregar un nuevo servicio

1. Crear `src/services/{nombre}/index.js` con:
   - Una función `{nombre}Service(socket)` que maneje los eventos.
   - Un regex `{nombre}NamespacePattern` para el namespace.
   - Una función `init_{nombre}_service(io)` que monte el namespace.
2. Importar y llamar `init_{nombre}_service(io)` en `src/index.js`.

Ver `src/services/yures-waiter/index.js` como template mínimo.
