
import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';

export const scenariosRouter = Router();

// Criar cenário (professor)
scenariosRouter.post('/', authRequired('TEACHER'), (req, res) => {
  const u = req.user; const { type, config } = req.body;
  const info = db.prepare('INSERT INTO scenarios (type, config, createdBy) VALUES (?,?,?)')
    .run(type||'MAZE', JSON.stringify(config||{}), u.id);
  res.json({ id: info.lastInsertRowid });
});

// Obter cenário
scenariosRouter.get('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM scenarios WHERE id=?').get(req.params.id);
  if(!r) return res.status(404).json({error:'not found'});
  r.config = JSON.parse(r.config||'{}');
  res.json(r);
});
