module.exports = {
  apps: [
    {
      name: "spl-trading",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
