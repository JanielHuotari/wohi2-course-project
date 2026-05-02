const express = require('express');

const app = express();

const questionsRouter = require('./routes/questions');

const authRouter = require('./routes/auth');

const prisma = require('./lib/prisma');

const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "..", "public")));

// Middleware to parse JSON bodies (will be useful in later steps)
app.use(express.json());
app.use("/api/questions", questionsRouter);
app.use("/api/auth", authRouter);



// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
}   );

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});