
import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';

export const progressRouter = Router();

// Progresso do aluno logado
progressRouter.get('/my', authRequired('STUDENT'), (req, res) => {
  const u = req.user;
  const rows = db.prepare('SELECT * FROM progress WHERE studentId=?').all(u.id);
  res.json(rows);
});

// Submeter resultado de um desafio
progressRouter.post('/submit', authRequired('STUDENT'), (req, res) => {
  const u = req.user; const { challengeId, success, outputs, starsAwarded } = req.body;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM progress WHERE studentId=? AND challengeId=?').get(u.id, challengeId);
  if(existing){
    const status = success ? 'COMPLETED' : 'IN_PROGRESS';
    const stars = Math.max(existing.stars, success ? (starsAwarded||1) : existing.stars);
    db.prepare('UPDATE progress SET status=?, attempts=attempts+1, stars=?, lastOutput=?, updatedAt=? WHERE id=?')
      .run(status, stars, (outputs||[]).join('
'), now, existing.id);
  } else {
    db.prepare('INSERT INTO progress (studentId, challengeId, status, attempts, stars, lastOutput, updatedAt) VALUES (?,?,?,?,?,?,?)')
      .run(u.id, challengeId, success?'COMPLETED':'IN_PROGRESS', 1, success?(starsAwarded||1):0, (outputs||[]).join('
'), now);
  }
  res.json({ ok: true });
});

// Painel do professor: progresso por challenge
progressRouter.get('/challenge/:id', authRequired('TEACHER'), (req, res) => {
  const challengeId = req.params.id;
  const rows = db.prepare(`SELECT p.*, u.name as studentName, u.email as studentEmail
                           FROM progress p JOIN users u ON p.studentId=u.id
                           WHERE p.challengeId=?`).all(challengeId);
  res.json(rows);
});
