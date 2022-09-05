module.exports = {
  apps: [{
    name: "Bifrost-socket",
    script: 'index.js',
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
};
