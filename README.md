# Bifrost IO 🌈
Servidor de socket io para todos los servicios de puyu  
![alt text](bifrost.png "Bifrost")
## Como funciona
Se levanta por el puerto `3001` y los distingue a cada servicio por el namespace. 

Se levanta en un servidor independiente.
### Ejecutar en Development
Se levanta un contenedor que escuchara por el puerto 3001, y devolvera el evento a todos los clientes excepto al que lo envio


### Ejecutar en Production
1. Primero instalar las dependencias necesarias
```
npm install --only=production 
```
2. Levantar el servidor en pm2
```
npx pm2 start 
```

