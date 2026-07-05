module.exports = {
  apps: [
    {
      name: "hai-verify",
      script: "scripts/start-dev.cjs",
      cwd: __dirname,
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_restarts: 10,
    },
  ],
};