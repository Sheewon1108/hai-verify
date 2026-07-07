module.exports = {
  apps: [
    {
      name: "hai-ic-server",
      script: "scripts/start-hai-ic-dev.cjs",
      cwd: __dirname,
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_restarts: 50,
      restart_delay: 5000,
    },
    {
      name: "hai-ic-automation",
      script: "scripts/hai-ic-automation-daemon.cjs",
      cwd: __dirname,
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_restarts: 20,
      restart_delay: 10000,
    },
  ],
};