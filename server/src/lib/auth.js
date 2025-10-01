
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export function signToken(payload){
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
}

export function authRequired(role){
  return (req, res, next) => {
    const token = req.cookies['session'];
    if(!token) return res.status(401).json({ error: 'unauthorized' });
    try{
      const user = jwt.verify(token, config.JWT_SECRET);
      if(role && user.role !== role) return res.status(403).json({ error: 'forbidden' });
      req.user = user;
      next();
    } catch(e){
      return res.status(401).json({ error: 'invalid token' });
    }
  };
}
