# Contribuir a Bifrost IO

## Convenciones del proyecto

### Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar servicio de notificaciones push
fix: corregir race condition en dequeue de Memcached
refactor: extraer validaciones de namespace a helper
chore: actualizar dependencias
```

### Nombrado de archivos y módulos

- Archivos en `kebab-case`: `yures-waiter`, `printing-websocket`.
- Funciones de inicialización: `init_{servicio}_service(io)`.
- Funciones de worker (handler de conexión): `{Servicio}Service(socket)` o `{Servicio}Worker(socket)`.
- Regex de namespace: `{servicio}NamespacePattern`.

### Estructura de un servicio nuevo

Cada servicio vive en `src/services/{nombre}/index.js` y exporta:

```js
function init_{nombre}_service(io) {
  const ns = io.of({nombre}NamespacePattern);
  ns.on("connection", {Nombre}Service);
}

module.exports = { init_{nombre}_service };
```

Luego se registra en `src/index.js`.

### Patrones de namespace

Los namespaces siguen el formato:

```
/{servicio}-{ruc}[-{branch}]
```

- `ruc`: exactamente 11 dígitos numéricos.
- `branch`: exactamente 1 dígito, opcional.
- Separador: `-` para servicios de impresión, `:` como prefijo para servicios Yures.

Ejemplos válidos:
- `/printing-20600995801`
- `/printing-20600995801-1`
- `/yures:waiter-20600995801-2`

### Variables de entorno

Agregar nuevas variables siempre en:
- `env/example-development.env`
- `env/example-production.env`

Nunca commitear archivos `.env` con valores reales.

---

## Setup local

```bash
# 1. Instalar Memcached y levantarlo
sudo systemctl start memcached

# 2. Copiar env de ejemplo
cp env/example-development.env env/development.env

# 3. Instalar dependencias
npm ci

# 4. Levantar en desarrollo
npm run dev
```

---

## Sin tests unitarios automatizados

El proyecto no tiene suite de tests unitarios en este momento. Las pruebas de integración y estrés están en `test/stress/` usando Artillery.

Para agregar tests en el futuro, el punto de entrada recomendado es mockear `socket.io` y `memjs`.
