require("express-async-errors");

const express = require('express');

const app = require('./app');

const PORT = process.env.PORT || 3000;

const logger = require("./lib/logger");

const prisma = require('./lib/prisma');



// Start the server
app.listen(PORT, () => {
  logger.info({port: PORT}, "Server listening");
});


process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});