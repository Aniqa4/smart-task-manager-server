import { Request, Response } from 'express';
import Project from '../models/Project';
import Team from '../models/Team';
import { Types } from 'mongoose';

export const createProject = async (req: Request, res: Response) => {
  const { name, description, team: teamId } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name required' });
  if (!teamId || !Types.ObjectId.isValid(teamId)) return res.status(400).json({ message: 'Valid team id required' });
  const team = await Team.findById(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  // only owner can create projects for their team
  if (team.owner.toString() !== req.user?.id) return res.status(403).json({ message: 'Not allowed' });
  const project = new Project({ name, description, team: teamId });
  await project.save();
  res.status(201).json(project);
};

export const listProjects = async (req: Request, res: Response) => {
  const { team } = req.query;
  const filter: any = {};
  if (team && typeof team === 'string' && Types.ObjectId.isValid(team)) filter.team = team;
  // Return projects that belong to teams owned by the user or specific team if provided.
  if (!filter.team) {
    // find teams owned by user
    const teams = await Team.find({ owner: req.user?.id }).select('_id');
    filter.team = { $in: teams.map((t) => t._id) };
  }
  const projects = await Project.find(filter).sort({ createdAt: -1 });
  res.json(projects);
};

export const getProject = async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Not found' });
  const team = await Team.findById(project.team);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (team.owner.toString() !== req.user?.id) return res.status(403).json({ message: 'Not allowed' });
  res.json(project);
};

export const updateProject = async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Not found' });
  const team = await Team.findById(project.team);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (team.owner.toString() !== req.user?.id) return res.status(403).json({ message: 'Not allowed' });
  project.name = req.body.name || project.name;
  project.description = req.body.description || project.description;
  await project.save();
  res.json(project);
};

export const deleteProject = async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Not found' });
  const team = await Team.findById(project.team);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (team.owner.toString() !== req.user?.id) return res.status(403).json({ message: 'Not allowed' });
  await project.deleteOne();
  res.status(204).send();
};
