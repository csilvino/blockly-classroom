
import { Router } from 'express';
import { db } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../lib/auth.js';
import { z } from 'zod';

export const authRouter = Router();

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['TEACHER','STUDENT'])
});

authRouter.post('/register', (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const { name, email, password, role } = parsed.data;
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if(existing) return res.status(409).json({ error: 'email in use' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name, email, passwordHash, role) VALUES (?,?,?,?)')
    .run(name, email, hash, role);
  const id = info.lastInsertRowid;
  const token = signToken({ id, name, email, role });
  res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ id, name, email, role });
});

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

authRouter.post('/login', (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const { email, password } = parsed.data;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if(!user) return res.status(400).json({ error: 'invalid credentials' });
  if(!bcrypt.compareSync(password, user.passwordHash)) return res.status(400).json({ error: 'invalid credentials' });
  const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
  res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  const token = req.cookies['session'];
  if(!token) return res.json(null);
  try{
    const user = jwt.verify(token, config.JWT_SECRET);
    res.json(user);
  }catch(e){ res.json(null); }
});
