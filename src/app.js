require("express-async-errors");

const express = require('express');

const app = express();

const questionsRouter = require('./routes/questions');

const pinoHttp = require("pino-http");

const authRouter = require('./routes/auth');

const prisma = require('./lib/prisma');

const path = require('path');

const PORT = process.env.PORT || 3000;

const logger = require("./lib/logger");

app.use(pinoHttp({logger,
  autoLogging: {ignore: req => req.url.startsWith("/uploads/")}
}));

const { NotFoundError } = require("./lib/errors");

const errorHandler = require('./middleware/errorHandler');

app.use(express.static(path.join(__dirname, "..", "public")));

// Middleware to parse JSON bodies (will be useful in later steps)
app.use(express.json());
app.use("/api/questions", questionsRouter);
app.use("/api/auth", authRouter);


app.use((req, res) => {
throw new NotFoundError();
}   );

app.use(errorHandler);

module.exports = app;