# Bifrost IO 🌈
Servidor de socket io para todos los servicios de puyu  
![alt text](bifrost.png "Bifrost")
## Como funciona
Se levanta por el puerto `3001` y los distingue a cada servicio por el namespace. 

Se levanta en un servidor independiente.
### Ejecutar en Development
Se levanta un contenedor que escuchara por el puerto 3001, y devolvera el evento a todos los clientes excepto al que lo envio


### Ejecutar en Production
Funcionara en una instancia Ec2 independiente, que funcionara por el momento detras del load balancer de yubiz por el puerto `3001`