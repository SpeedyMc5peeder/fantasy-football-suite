module.exports = {
  apps: [{
    name: 'sleeper-bot',
    script: 'index.js',
    args: '--check-transactions --daemon',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
