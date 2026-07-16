const express = require('express');
const cors = require('cors');

const playersRouter = require('./routes/players');
const matchesRouter = require('./routes/matches');
const scoresRouter = require('./routes/scores');
const pointsRouter = require('./routes/points');
const expensesRouter = require('./routes/expenses');
const newsRouter = require('./routes/news');
const quizRouter = require('./routes/quiz');
const wordleRouter = require('./routes/wordle');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/matches', scoresRouter);
app.use('/api/matches', pointsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/news', newsRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/wordle', wordleRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`TennisApp server running on http://localhost:${PORT}`);
});
