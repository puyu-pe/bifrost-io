# Pruebas de estres en bifrost

## Indice
1. Conceptos de artillery
2. Instalación de artillery
3. Ejecutar pruebas de estres
4. Interpretar pruebas de estres
5. Recomendaciones y conclusiones
6. Referencias

## 1. Conceptos Artillery

### 1.1 Funcionamiento
Una prueba de carga en artillery es descrita por fases de carga + usarios virtuales.

### 1.2 Usuario virtuales
Los usuarios virtuales emulan a usuarios reales que interactuaran con la aplicación, dicha interacción es descrita a traves de escenarios (conjunto de acciones).
Cada usuario es completamente independiente, no conparten estado.

### 1.3 fases de carga
Las fases de carga se utilizan para describir cuantos usuarios virtuales deben crearse durante un periodo de tiempo, puede haber varias fases, como una fase de calentamiento y otras de carga pesada.
```
phases:
  - duration: 300 # duración de la fase
    arrivalRate: 10 # cuantos usuarios por segundo sera creado
```
### 1.4 En accion
Empezara ejecutando cada fase de carga empezando desde el primero definido en el script yaml. Cada usuario virtual ejecutará uno de los escenarios en la definición de prueba.

## 2. Instalar Artillery
```
npm install -g artillery@latest
npm install -g artillery-engine-socketio-v3@latest
```
Nota: No se recomienda descargar artillery en un entorno de producción.

## 3. Ejecutar pruebas de estres

Para realizar las pruebas se tiene que revisar lo siguientes archivos en orden:

### 3.1. test-comands.md
- Contiene los comandos para el lanzamiento de las pruebas de estres

### 3.2. namespaces.csv
- Contiene una lista de namespaces de prueba que se cargaran de manera dinamica al test-script.yml.
- Cada namespace sigue el formato ruc-sufijo donde ruc es de 11 digitos y sufijo es de un digito opcional
	y luego esto se concatena a los prefijos correspondientes en el test-script.yml todo esto para respetar.
	las expresiones regulares definidos de los namespaces para los servicios yures:printer y yures:waiter.
- Se puede modificar este archivo, pero a mayor cantidad de namespace no se garantiza que se utilicen todos a la hora de ejecutar los test, en todo cado de manera proporcional tambien se tendria que aumentar el numero de fases con mayor cantidad de usuarios virtuales en test-script.yml.

### 3.3. test-script.yml
#### En este archivo se describe las pruebas de estres en lenguaje yaml y esta compuesto de la siguiente forma
- Se describe primeramente el objetivo de las pruebas , https://bifrost-io.puyu.pe o http://localhost:3001
- Se carga el archivo namespaces.csv
- Se describen 3 grupos de fases, fases de calentamiento, carga pesada y bajada 
- En cada fase se comienza con un cierto numero de usuarios virtuales y va aumentando segun los grupos de fases, empieza con un pequeño numero de usuarios, luego empieza a aumentar rapidamente para finalmente disminuir el numero de usuarios virtuales por segundo
- Cada usuario virtual seleccionara y ejecutara unos de los siguientes escenarios
	- Un usuario YURES emite una factura
	- Un usuario YURES emite una boleta
	- Un usuario PRITNER solicita cola de impresión e imprime
	- Un usuario YURES-WAITER modifica el estado de una mesa


## 4. Interpretar pruebas de estres 

### Cada 10 segundos se manda un reporte, llamadas metricas por periodo
Que nos indica lo siguiente 
- engine.socketio.emit : Número de eventos emitidos durante la prueba
- engine.socketio.emit_rate: Numero de eventos emitidos por segundo
- vusers.completed: Numero de usuarios virtuales que completaron la prueba
- vusers.failed: Número de usuarios virtuales que fallaron la prueba
- vusers.session_length: Metricas sobre la duración de una sesión de un usuario virtual
 - min: duración de sesión minima reportada
 - max: duración de sesión maxima reportada
 - median: duración de sesión en promedio reportada 
 - p95: Indica que el 95% de la duración de las sesiones estan por debajo de un valor determinado 
 - p99: Indica que el 99% de la duración de las sesiones estan por debajo de un valor determinado 

### Al final se da un reporte general 
Similar a las metricas reportadas por periodo, pero añade lo siguiente

- vusers.created: Numero de usuarios virtuales creados en total
Los siguiente representan los numeros de usuarios creados por escenario
- vusers.created_by_name.Un Cliente YURES-WAITER modifica el estado de una mesa
- vusers.created_by_name.Un usuario PRINTER solicita cola de impresión e imprime 
- vusers.created_by_name.Un usuario YURES emite una boleta 
- vusers.created_by_name.Un usuario YURES emite una factura

### ¿Que indica todo esto?
Todas la metricas a excepción de vusers.session_length se utilizaran para calibrar las pruebas de estres en funcion de las necesidades y requerimientos del negocio, por ejemplo para el escenario de un mesero modifica el estado de una mesa, se pudo haber creado 100 usuarios virtuales, en otras palabras 100 conexiónes socket.io para poder modificar el estado de una mesa, nos tenemos que plantear si esto puede llegar a ser posible, si la respuesta es si entonces se deja como esta y pasamos a la siguiente seccion, de lo contrario podemos concluir que en realidad pueden aver muchas mas conexiónes o talvez menos, esto se puede balancear en las fases de test-script.yml cuantos usuarios virtuales por segundo queremos crear. 

Las metricas de vusers.session_length reflejan cuanto tiempo demoro en realizar una accion un usuario virtual esto puede aumentar considerablemente si se aumenta mas cantidad de usuarios virtuales, es por eso que es importante trabajar con cantidades realeas para no sobreestimar. 

Las metricas de vusers.session_length esta dividida en 5 metricas estadisticas, min, max, median , p95, p99
los cuales reflejan la duración minima, maxima y en promedio de una session de un usuario virtual en milisegundos el p95 indica que un 95% esta por debajo de la medida reportada, y el p99 indica que el 99% esta por debajo de la medida reportada


### Ejemplo 
- Se registraron 444 eventos emitidos
	- engine.socketio.emit: .......................................................... 444

- Se registraron 6 eventos emitidos por segundo
  - engine.socketio.emit_rate: ..................................................... 6/sec

- 300 usuarios completaron la prueba
  - vusers.completed: .............................................................. 300

- 300 usuarios fueron creados
  - vusers.created: ................................................................ 300

- 75 usuarios para el escenario "Cliente YURES-WAITER modifica el estado de una mesa" fueron creados
  - vusers.created_by_name.Un Cliente YURES-WAITER modifica el estado de una mesa: . 75

- 69 usuarios para el escenario "Un usuario PRINTER solicita cola de impresión e imprime" fueron creados
  - vusers.created_by_name.Un usuario PRINTER solicita cola de impresión e imprime:  69

- 81 usuarios para el escenario "Un usuario YURES emite una boleta:" fueron creados
  - vusers.created_by_name.Un usuario YURES emite una boleta: ...................... 81

- 75 usuarios para el escenario "Un usuario YURES emite una factura" fueron creados
  - vusers.created_by_name.Un usuario YURES emite una factura: ..................... 75

- 0 usuarios no han completado la prueba
  - vusers.failed: ................................................................. 0

- metricas de duración de la session para cada usuario virtual
  - vusers.session_length:

- se registro que un usuario demoro 2000 ms en completar su escenario, es el registor mas bajo
  - min: ......................................................................... 2004.9

- se registro que un usuario demoro 22071.9 ms en completar su escenario, es el registor mas alto
  - max: ......................................................................... 22071.9

- En promedio un usuario demora 4065.2ms en completar su escenario
  - median: ...................................................................... 4065.2

- El 95% de los usuarios demora menos que 21813.5ms en completar su escenario, el otro 5 por ciento esta por encima de este valor registrado
  - p95: ......................................................................... 21813.5

- El 99% de los usuarios demora menos que 21813.5ms en completar su escenario, el otro 1 por ciento esta por encima de este valor registrado 
  - p99: ......................................................................... 21813.5


## 5. Recomendaciones y conclusiones
A la hora de realizar este documento surgieron varias dudas sobre la interpretación de las metricas de rendimiento, muchas de ellas estan interpretadas a criterio propio con ayuda de uno que otro blog debido a que no se encontro este tipo de información en la documenación de artillery. Asi mismo se podria recomendar dividir las pruebas de estres segun la cantidad de servicios para tener una mejor representacion de las cosas y calibrar mejor los test. Aunque la idea de estas pruebas en si es ver si el servidor puede soportar todas estas cargas, independientemente de los servicios que se ejecuten.

## 6. Referencias
- Ejemplo de script de test .yml socket.io https://socket.io/docs/v4/load-testing
- Artillery Documentation https://www.artillery.io/docs/reference/cli/run
- Guía más sencilla: pruebas de carga de Artillery.io  https://www.linkedin.com/pulse/simpler-guide-artilleryio-load-testing-gabriel-lantin
- Introduction to Load Testing With Artillery https://www.atlantbh.com/load-testing-with-artillery/
- Conversación con chatgpt sobre las metricas de rendimiento https://chat.openai.com/share/68e70714-61c4-4048-9f10-56413eb76665