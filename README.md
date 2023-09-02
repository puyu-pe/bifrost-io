# Bifrost IO 🌈
Servidor de socket io para todos los servicios de puyu  
![alt text](bifrost.png "Bifrost")
## Como funciona
Se levanta por el puerto `3001` y los distingue a cada servicio por el namespace. 
Se levanta en un servidor independiente.

### Configuración general antes de levantar el proyecto
#### 1. Configurar archivo .env segun el env.example

#### 2. Instalar memcached

##### 2.1 Linux

###### 2.1.1 Arch linux
```
pacman -Ss memcached
pacman -S memcached libmemcached
```

###### 2.1.2 Ubuntu o derivados
```
sudo apt update
sudo apt install memcached
```

###### 2.1.3 Levantar servicio de memcached
Despues de haber instalado memcached ejecutar los siguientes comandos
```
sudo systemctl start memcached
sudo systemctl enable memcached
```

##### 2.2 En Windows
[click aqui y seguir las instrucciones](https://stackoverflow.com/questions/59476616/install-memcached-on-windows)

### Levantar el proyecto 

Nota: Seguir las mimsas instrucciones para un entorno de producción y desarrollo (artillery esta desacoplado), en un futuro se configurara con entornos de desarrollo mas avanzado.

1. Instalar dependencias 
```
npm ci
```

Nota: preferir npm ci antes que npm install issue #20 bifrost project

2. Levantar el servidor en pm2
```
npx pm2 start 
```

3. Ver logs 
```
npx pm2 logs
```

### Pruebas de estres
Para las pruebas de estres revisar el archivo artillery-docs.md 
que esta en la carpeta test/stress en el actual proyecto
