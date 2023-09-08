module.exports = {
  apps: [{
    name: "Bifrost-socket",
    script: 'src/index.js',
    restart_delay: 4000,
    env: {
      NODE_ENV: "development",
    },
		env_production: {
			NODE_ENV: "production"
		}
  }]
};
