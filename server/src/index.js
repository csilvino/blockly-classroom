
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './lib/config.js';
import { db } from './lib/db.js';
import { authRouter } from './routes/auth.js';
import { lessonsRouter } from './routes/lessons.js';
import { scenariosRouter } from './routes/scenarios.js';
import { challengesRouter } from './routes/challenges.js';
import { progressRouter } from './routes/progress.js';

const app = express();
app.use(express.json({limit: '2mb'}));
app.use(cookieParser());
app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/scenarios', scenariosRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/progress', progressRouter);

const port = config.PORT;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
