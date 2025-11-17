import { Request, Response } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';
import Team from '../models/Team';
import { Types } from 'mongoose';

export const getTasks = async (req: Request, res: Response) => {
  const filter: any = {};
  const { project, member } = req.query;
  if (project && typeof project === 'string' && Types.ObjectId.isValid(project)) filter.project = project;
  if (member && typeof member === 'string' && Types.ObjectId.isValid(member)) filter.assignedMember = member;
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json(tasks);
};

export const createTask = async (req: Request, res: Response) => {
  const { project: projectId, assignedMember } = req.body;
  if (!projectId || !Types.ObjectId.isValid(projectId)) return res.status(400).json({ message: 'Valid project id required' });
  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  if (assignedMember) {
    if (!Types.ObjectId.isValid(assignedMember)) return res.status(400).json({ message: 'Invalid assignedMember id' });
    const team = await Team.findById(project.team);
    if (!team) return res.status(400).json({ message: 'Project team not found' });
    const exists = team.members.some((m) => m._id?.toString() === assignedMember.toString());
    if (!exists) return res.status(400).json({ message: 'Assigned member must belong to project team' });
  }

  const task = new Task({
    project: projectId,
    title: req.body.title,
    description: req.body.description,
    assignedMember: assignedMember || undefined,
    priority: req.body.priority || 'Medium',
    status: req.body.status || 'Pending'
  });
  await task.save();
  res.status(201).json(task);
};

export const getTask = async (req: Request, res: Response) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Not found' });
  res.json(task);
};

export const updateTask = async (req: Request, res: Response) => {
  const updates: any = req.body;
  if (updates.project && !Types.ObjectId.isValid(updates.project)) return res.status(400).json({ message: 'Invalid project id' });
  if (updates.assignedMember && !Types.ObjectId.isValid(updates.assignedMember)) return res.status(400).json({ message: 'Invalid assignedMember id' });

  if (updates.assignedMember && updates.project) {
    const project = await Project.findById(updates.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const team = await Team.findById(project.team);
    if (!team) return res.status(400).json({ message: 'Project team not found' });
    const exists = team.members.some((m) => m._id?.toString() === updates.assignedMember.toString());
    if (!exists) return res.status(400).json({ message: 'Assigned member must belong to project team' });
  } else if (updates.assignedMember && !updates.project) {
    // verify against existing task's project
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    const project = await Project.findById(task.project);
    const team = project ? await Team.findById(project.team) : null;
    if (!team) return res.status(400).json({ message: 'Project team not found' });
    const exists = team.members.some((m) => m._id?.toString() === updates.assignedMember.toString());
    if (!exists) return res.status(400).json({ message: 'Assigned member must belong to project team' });
  }

  const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!task) return res.status(404).json({ message: 'Not found' });
  res.json(task);
};

export const deleteTask = async (req: Request, res: Response) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ message: 'Not found' });
  res.status(204).send();
};
