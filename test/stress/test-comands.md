# Comandos y sugerencias para ejecutar las pruebas de estres

## Consideraciones iniciales
- Los comandos para lanzar las pruebas tiene en cuenta que se estan realizando desde la raiz del proyecto.
- Si no esta instalado artillery revise artillery-docs.md
- Se asume que se tiene instaldo artillery de manera global, si estan instalados a nivel de proyecto entonces anteponer npx a los comandos donde artillery esta presente.
	- Ejm. npx artillery ...
- Esta claro mencionar que el servidor tiene que estar levantado ya sea de manera local o en produccion para poder realizar las pruebas.

## Deshabilitar memcached, opcional solo si se haran pruebas sobre si las pruebas funcionan :)

Ejm.
```
sudo systemctl stop memcached
```
Ideal si no queremos llenar la memoria de datos basura


## Si se pretende realizar las pruebas reales, habilitar memcached 
Ejm
```
sudo systemctl start memcached
```
Ideal si ya estamos dispuestos a realizar la pruebas reales, para probar si el servidor podria llegar a desbordar en memoria, algo quisas no tan probable, manejar con cuidado.


## Comentar o descomentar el target
Dentro del archivo test-script.yml se tiene que comentar el objetivo o dominio hacia donde se realizaran las pruebas

- http://localhost:3001 pruebas en local
- https://bifrost-io.puyu.pe pruebas en produccion


## Ejecutar prueba de estres
Ideal si esta apurado. de lo contrario puede generar un reporte html opcional explicado en la siguiente sección.

```
npx artillery run test/stress/test-script.yml
```

## Opcionalmente se puede generar un reporte html

### 1. Generar .json
Primero debe generar un reporte en formato json
```
artillery run --output test/stress/report.json test/stress/test-script.yml
```
### 2. Generar .html para mostrarlo en un navegador
Luego generamos el html
```
artillery report test/stress/report.json
```
Esto crea un archivo test/stress/report.json.html


