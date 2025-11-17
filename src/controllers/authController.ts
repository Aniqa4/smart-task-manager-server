import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export const register = async (req: Request, res: Response) => {
  const { username, password, name } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });
  const existing = await User.findOne({ username });
  if (existing) return res.status(409).json({ message: 'username already taken' });
  const user = new User({ username, password, name });
  await user.save();
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user._id, username: user.username, name: user.name } });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, username: user.username, name: user.name } });
};
