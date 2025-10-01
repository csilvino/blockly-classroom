
import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';

export const challengesRouter = Router();

// Criar challenge ligando lição + cenário
challengesRouter.post('/', authRequired('TEACHER'), (req, res) => {
  const { lessonId, scenarioId, requiredBlocks, orderIndex, isPublished } = req.body;
  const info = db.prepare(`INSERT INTO challenges (lessonId, scenarioId, requiredBlocks, orderIndex, isPublished)
    VALUES (?,?,?,?,?)`).run(lessonId, scenarioId, JSON.stringify(requiredBlocks||[]), orderIndex||0, isPublished?1:0);
  res.json({ id: info.lastInsertRowid });
});

// Listar challenges publicados (aluno)
challengesRouter.get('/published', (req, res) => {
  const rows = db.prepare(`SELECT c.id, c.lessonId, c.scenarioId, c.requiredBlocks, l.title, l.description,
                                  l.ageRange, l.toolboxPreset, l.customToolboxXml, l.startingXml,
                                  l.expectedType, l.expectedData
                           FROM challenges c JOIN lessons l ON c.lessonId=l.id
                           WHERE c.isPublished=1 ORDER BY c.orderIndex ASC, c.id ASC`).all();
  const mapped = rows.map(r => ({
    id: r.id,
    lessonId: r.lessonId,
    scenarioId: r.scenarioId,
    requiredBlocks: JSON.parse(r.requiredBlocks||'[]'),
    lesson: {
      title: r.title, description: r.description, ageRange: r.ageRange,
      toolboxPreset: r.toolboxPreset, customToolboxXml: r.customToolboxXml, startingXml: r.startingXml,
      expectedType: r.expectedType, expectedData: JSON.parse(r.expectedData||'{}')
    }
  }));
  res.json(mapped);
});
