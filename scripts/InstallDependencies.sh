#!/bin/bash

# Break execution script if something go wrong  
set -eu

## go to project
cd ~/$APPLICATION_NAME

## Set env node
export NODE_ENV=$DEPLOYMENT_GROUP_NAME

## Run npm
npm install