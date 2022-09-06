#!/bin/bash

# Break execution script if something go wrong  
set -eu

# Start server
sudo systemctl stop nginx || true

## go to project
cd ~/$APPLICATION_NAME

#Start node server
npx pm2 stop
