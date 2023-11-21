FROM node:18.17.1-alpine3.18
LABEL org.opencontainers.image.source="https://github.com/puyu-pe/bifrost-io"
ENV MODE=node_prod

WORKDIR /service
COPY ./ .

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
  echo "echo 'Iniciando bifrost modo ${MODE}'" >> start.sh &&\
  echo "npm run \${MODE}" >> start.sh 

RUN chmod +x start.sh 

CMD sh start.sh ${MODE}

EXPOSE 3001
