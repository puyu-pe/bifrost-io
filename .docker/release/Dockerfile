FROM node:18.17.1-alpine3.18
ARG BIFROST_FOLDER=bifrost-io
ENV PM2_MODE=prod

WORKDIR /service
COPY ${BIFROST_FOLDER} .

RUN apk update \
  && apk add memcached

# Se verifica que ya se tiene lo archivos development.env y production.env dentro de env/
RUN if [ ! -e  env/production.env ] || [ ! -e env/development.env ]; then \
      echo "ADVERTENCIA: env/production.env o env/development.env no estan configurados"; \
      exit 1; \
    fi 

RUN touch start.sh && \
  echo  "#!/bin/bash"  >> start.sh &&\ 
  echo "echo 'Iniciando memcached...'" >> start.sh &&\
  echo "memcached -d -u daemon" >> start.sh  &&\
  echo "echo 'Iniciando bifrost pm2 modo ${PM2_MODE}'" >> start.sh &&\
  echo "npm run \${PM2_MODE}" >> start.sh &&\
  echo "echo 'Monstrando logs de bifrost'" >> start.sh &&\
  echo "npx pm2 logs" >> start.sh
RUN chmod +x start.sh 

CMD sh start.sh ${PM2_MODE}

EXPOSE 3001
