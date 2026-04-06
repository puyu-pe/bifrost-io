# Bifrost IO

Servidor genérico de **Socket.IO** para todos los servicios de **Puyu**. Actúa como hub de comunicación en tiempo real entre aplicaciones cliente y servicios backend, distinguiendo cada servicio mediante namespaces dinámicos.

![Bifrost](public/bifrost.png)

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Servicios disponibles](#servicios-disponibles)
- [API REST](#api-rest)
- [API WebSocket — eventos por servicio](#api-websocket--eventos-por-servicio)
- [Configuración del entorno](#configuración-del-entorno)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Pruebas de estrés](#pruebas-de-estrés)
- [Estructura del proyecto](#estructura-del-proyecto)

---

## Arquitectura

Bifrost es un servidor **Express + Socket.IO** que expone:

- Un endpoint REST para encolar trabajos de impresión.
- Namespaces dinámicos de Socket.IO para cada empresa (RUC) y sucursal.
- Un admin UI de Socket.IO en `/admin` (sin autenticación en desarrollo).

```
Cliente HTTP  ──POST /api/v1/print──▶  Express Router
                                            │
                                            ▼
                                      Memcached (cola)
                                            │ on_queue callback
                                            ▼
Cliente WS  ◀──printer:emit-item──  Namespace /printing-{ruc}[-{branch}]

Cliente WS  ──change-status-table──▶  Namespace /yures:waiter-{ruc}[-{branch}]  ──broadcast──▶ otros clientes
Cliente WS  ──movement─────────────▶  Namespace /yures:movement-{ruc}[-{branch}] ──broadcast──▶ otros clientes
Cliente WS  ──items-limit──────────▶  Namespace /yures:items-{ruc}[-{branch}]   ──broadcast──▶ otros clientes
```

**Dependencias clave:**

| Paquete | Rol |
|---|---|
| `socket.io` | Servidor WebSocket |
| `express` | Servidor HTTP / REST |
| `memjs` | Cliente Memcached (cola de impresión) |
| `async-mutex` | Exclusión mutua en enqueue/dequeue |
| `pm2` | Gestor de procesos en producción |
| `@socket.io/admin-ui` | Panel de administración |

---

## Servicios disponibles

| Servicio | Namespace (regex) | Ejemplo |
|---|---|---|
| Impresión | `/printing-{ruc}[-{branch}]` | `/printing-20600995801-1` |
| Mesero (waiter) | `/yures:waiter-{ruc}[-{branch}]` | `/yures:waiter-20600995801` |
| Movimientos | `/yures:movement-{ruc}[-{branch}]` | `/yures:movement-20600995801-2` |
| Límite de ítems | `/yures:items-{ruc}[-{branch}]` | `/yures:items-20600995801` |

- `{ruc}` — 11 dígitos numéricos obligatorio.
- `{branch}` — 1 dígito, opcional. Si se omite el namespace no lleva sufijo.

---

## API REST

### `GET /`

Verifica que el servidor está online.

**Respuesta:** `200 OK` — `"Bifrost online"`

---

### `GET /api/v1/print`

Verifica que el servicio de impresión está online.

**Respuesta:** `200 OK` — `"SERVICIO DE IMPRESIÓN ONLINE"`

---

### `POST /api/v1/print?r={ruc}&b={branch}`

Encola un trabajo de impresión en Memcached y notifica vía WebSocket a los clientes conectados al namespace correspondiente.

**Query params:**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `r` | string (11 dígitos) | Sí | RUC de la empresa |
| `b` | string (1 dígito) | No | Número de sucursal |

**Body JSON:**

```json
{
  "data": { }
}
```

`data` puede ser cualquier objeto serializable — representa el contenido del ticket a imprimir.

**Respuestas:**

| Código | Descripción |
|---|---|
| `200` | Ticket encolado exitosamente |
| `400` | Parámetros inválidos (ruc faltante, formato incorrecto, body vacío) |
| `500` | Error interno (Memcached no disponible, namespace mal formado) |

**Respuesta exitosa:**

```json
{
  "status": "success",
  "message": "Exito al almacenar el ticket",
  "error": ""
}
```

---

## API WebSocket — eventos por servicio

### Servicio de Impresión (`/printing-{ruc}[-{branch}]`)

#### Eventos que el cliente ESCUCHA (emitidos por el servidor)

| Evento | Payload | Descripción |
|---|---|---|
| `printer:emit-item` | `{ message, data: memObject }` | Se emite cuando llega un nuevo ticket a la cola |
| `printer:send-printing-queue` | `{ message, data: queue, status }` | Respuesta a `printer:get-printing-queue` |
| `printer:send-number-items-queue` | `number` | Cantidad actual de items en cola |

#### Eventos que el cliente EMITE (escuchados por el servidor)

| Evento | Payload | Descripción |
|---|---|---|
| `printer:get-printing-queue` | — | Solicita el estado completo de la cola |
| `printer:print-item` | `{ key: timestamp }` | Confirma que un item fue impreso (lo elimina de la cola) |
| `printer:release-queue` | — | Vacía toda la cola de impresión |
| `printer:request-items-queue` | — | Solicita el número de items en cola |

**Estructura de `memObject`:**

```json
{
  "{timestamp_ms}": "{\"tickets\": {...}, \"created_at\": \"...\", \"namespace\": \"/printing-...\"}"
}
```

El `key` para `printer:print-item` es el timestamp en milisegundos (número como string).

---

### Servicio Yures Waiter (`/yures:waiter-{ruc}[-{branch}]`)

Relay simple: rebroadcastea el evento a todos los demás clientes del namespace (excepto al emisor).

| Evento | Dirección | Descripción |
|---|---|---|
| `change-status-table` | cliente → servidor → broadcast | Notifica cambio de estado de una mesa |

---

### Servicio Yures Movement (`/yures:movement-{ruc}[-{branch}]`)

Relay simple de movimientos.

| Evento | Dirección | Descripción |
|---|---|---|
| `movement` | cliente → servidor → broadcast | Notifica un movimiento |

---

### Servicio Yures Items Limit (`/yures:items-{ruc}[-{branch}]`)

Relay simple de límite de ítems.

| Evento | Dirección | Descripción |
|---|---|---|
| `items-limit` | cliente → servidor → broadcast | Notifica actualización del límite de ítems |

---

## Configuración del entorno

Los archivos `.env` viven en la carpeta `env/` con el nombre `{NODE_ENV}.env`.

Copiar el ejemplo correspondiente:

```bash
cp env/example-development.env env/development.env
cp env/example-production.env env/production.env
```

**Variables disponibles:**

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Entorno (`development` / `production`) |
| `PORT` | `3001` | Puerto en que escucha el servidor |
| `PRINTING_SERVICE_ENABLED` | `false` | Activa el servicio de impresión. Requiere Memcached cuando es `true`. |
| `MEMCACHIER_SERVERS` | `127.0.0.1:11211` | Host:puerto de Memcached. **Solo requerido si `PRINTING_SERVICE_ENABLED=true`.** |
| `MEMCACHIER_USERNAME` | — | Usuario Memcached (opcional en local). |
| `MEMCACHIER_PASSWORD` | — | Contraseña Memcached (opcional en local). |

> **Memcached es opcional.** Solo es necesario cuando `PRINTING_SERVICE_ENABLED=true`. Si no usás impresión, el servidor arranca sin ninguna dependencia externa.

---

## Instalación y ejecución

### Prerrequisitos

- Node.js >= 16
- Memcached corriendo en `localhost:11211` _(solo si `PRINTING_SERVICE_ENABLED=true`)_

#### Instalar Memcached

**Arch Linux:**
```bash
sudo pacman -S memcached libmemcached
sudo systemctl enable --now memcached
```

**Ubuntu/Debian:**
```bash
sudo apt install memcached
sudo systemctl enable --now memcached
```

**Windows:** ver [instrucciones en Stack Overflow](https://stackoverflow.com/questions/59476616/install-memcached-on-windows)

### Instalar dependencias

```bash
npm ci
```

> Usar `npm ci` en lugar de `npm install` para reproducibilidad (ver issue #20).

### Ejecutar en desarrollo

```bash
npm run dev
# o directamente sin pm2:
npm run node_dev
```

### Ejecutar en producción

```bash
npm run prod
```

### Gestión con PM2

```bash
npx pm2 logs        # Ver logs en tiempo real
npx pm2 status      # Estado de los procesos
npx pm2 stop all    # Detener
npx pm2 restart all # Reiniciar
```

---

## Pruebas de estrés

Ver `test/stress/artillery-docs.md` para instrucciones detalladas sobre las pruebas de carga con Artillery.

```bash
# Namespaces de prueba disponibles en:
test/stress/namespaces.csv
```

---

## Estructura del proyecto

```
bifrost-io/
├── src/
│   ├── index.js                        # Entry point — inicializa todos los servicios
│   ├── server/
│   │   └── index.js                    # Express + Socket.IO + Admin UI
│   ├── services/
│   │   ├── printing/
│   │   │   ├── index.js                # Inicializa router REST + namespace WS
│   │   │   ├── context.js              # Singleton: logger + managerStorage
│   │   │   └── api/v1/
│   │   │       ├── index.js            # Router REST POST /api/v1/print
│   │   │       └── websocket.js        # PrintingWorker — lógica de eventos WS
│   │   ├── yures-waiter/
│   │   │   └── index.js                # Relay change-status-table
│   │   ├── yures-movement/
│   │   │   └── index.js                # Relay movement
│   │   └── yures-items/
│   │       └── index.js                # Relay items-limit
│   ├── storage/
│   │   └── memcached/
│   │       ├── index.js                # BifrostPrinterStorage (enqueue/dequeue)
│   │       └── manager.js              # BifrostManagerStorage (pool de storages por namespace)
│   └── util/
│       └── logger/
│           └── console.js              # ConsoleLogger (debug solo en development)
├── env/
│   ├── example-development.env
│   └── example-production.env
├── config.js                           # Lee .env según NODE_ENV
├── ecosystem.config.js                 # Configuración PM2
├── scripts/
│   ├── StartServer.sh
│   ├── StopServer.sh
│   └── InstallDependencies.sh
└── test/
    └── stress/
        ├── artillery-docs.md
        ├── test-script.yml
        └── namespaces.csv
```
