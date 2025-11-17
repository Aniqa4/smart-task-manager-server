import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export default function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'No token provided' });
  const parts = header.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'Token error' });
  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ message: 'Malformed token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: payload.id };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
