const express = require('express');
const cors = require('cors');
const prisma = require('./prisma/client');

const playersRouter = require('./routes/players');
const matchesRouter = require('./routes/matches');
const scoresRouter = require('./routes/scores');
const pointsRouter = require('./routes/points');
const expensesRouter = require('./routes/expenses');
const newsRouter = require('./routes/news');
const quizRouter = require('./routes/quiz');
const wordleRouter = require('./routes/wordle');
const collegesRouter = require('./routes/colleges');
const userProfilesRouter = require('./routes/userProfiles');
const performanceRouter = require('./routes/performance');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://tennis-app-olive.vercel.app',
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/matches', scoresRouter);
app.use('/api/matches', pointsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/news', newsRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/wordle', wordleRouter);
app.use('/api/colleges', collegesRouter);
app.use('/api/user-profiles', userProfilesRouter);
app.use('/api/performance', performanceRouter);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

const server = app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`TennisApp server running on http://localhost:${PORT} — DB connected`);
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
  }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});
