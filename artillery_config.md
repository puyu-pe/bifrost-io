# 1. Instalación
Instalar la libreria para test de cargas 'artilly' con el siguiente comando:
```
npm install artillery artillery-engine-socketio-v3
```
# 2. Lanzar Prueba
Ejecutar el siguiente comando:
```
npx artillery run \
    --variables '{ "namespace": ["432423232-ab", "23432423-ac", "34234234-ad","234234234-ae","324234324-af","432423232-ag", "23432423-ak", "34234234-al","234234234-am","324234324-an"]}' \
    load-test.yml
```
nota: la ejecución del mismo puede tardar unos minutos, influye tambien la duración de cada fase

# 3. Descripcion codigo yaml 

- Se describen 3 fases una fase de calentamiento y 2 de carga pesada
- En cada fase se crea un cierto numero de usuario virtuales (arrivalRate) por segundo durante determinado tiempo (duration)
- Las fases no son necesariamente sincronas, pero si se ejecutan segun el orden descrito en el script yaml
- Se describen 2 escenarios, uno de YURES y otro de PRINTER
- Cada usuario virtual seleccionara un escenario y lo ejecutara
- Cuando todos los usuario terminen de ejecutar sus escenarios entonces culmina la prueba
- Interpretar entonces resultados de la prueba


# 4. Conceptos Artillery

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