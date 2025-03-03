module.exports = {
    apps: [{
      name: "ceoportal",
      script: "./start-nextjs.js",
      cwd: "./", // Ensure this points to your project root
      env: {
        NODE_ENV: "production",
        PORT: 9090, // Specify the port if needed
      },
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      log_file: "logs/combined.log",
      time: true
    }]
  };