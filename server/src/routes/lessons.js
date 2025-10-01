
import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';

export const lessonsRouter = Router();

// Criar lição (professor)
lessonsRouter.post('/', authRequired('TEACHER'), (req, res) => {
  const u = req.user;
  const {
    title, description, ageRange, toolboxPreset, customToolboxXml,
    startingXml, expectedType, expectedData
  } = req.body;
  const info = db.prepare(`INSERT INTO lessons
    (title, description, ageRange, toolboxPreset, customToolboxXml, startingXml, expectedType, expectedData, createdBy)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
      title||'Lição', description||'', ageRange||'6-8', toolboxPreset||'starter', customToolboxXml||null,
      startingXml||'', expectedType||'OUTPUT_MATCH', expectedData?JSON.stringify(expectedData):JSON.stringify({lines:[]}), u.id
    );
  res.json({ id: info.lastInsertRowid });
});

// Listar lições do professor
lessonsRouter.get('/mine', authRequired('TEACHER'), (req, res) => {
  const u = req.user;
  const rows = db.prepare('SELECT * FROM lessons WHERE createdBy=? ORDER BY id DESC').all(u.id);
  res.json(rows.map(r => ({...r, expectedData: JSON.parse(r.expectedData||'{}')})));
});

// Obter lição
lessonsRouter.get('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM lessons WHERE id=?').get(req.params.id);
  if(!r) return res.status(404).json({error:'not found'});
  r.expectedData = JSON.parse(r.expectedData||'{}');
  res.json(r);
});

// Atualizar lição
lessonsRouter.put('/:id', authRequired('TEACHER'), (req, res) => {
  const u = req.user; const id = req.params.id;
  const exists = db.prepare('SELECT * FROM lessons WHERE id=? AND createdBy=?').get(id, u.id);
  if(!exists) return res.status(404).json({error:'not found'});
  const {
    title, description, ageRange, toolboxPreset, customToolboxXml,
    startingXml, expectedType, expectedData
  } = req.body;
  db.prepare(`UPDATE lessons SET
    title=?, description=?, ageRange=?, toolboxPreset=?, customToolboxXml=?, startingXml=?, expectedType=?, expectedData=?
    WHERE id=?`).run(
      title, description, ageRange, toolboxPreset, customToolboxXml,
      startingXml, expectedType, JSON.stringify(expectedData||{}), id
    );
  res.json({ ok: true });
});
