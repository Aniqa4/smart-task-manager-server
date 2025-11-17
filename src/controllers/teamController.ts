import { Request, Response } from 'express';
import Team from '../models/Team';
import { Types } from 'mongoose';
import Project from '../models/Project';
import Task from '../models/Task';
import Activity from '../models/Activity';

export const createTeam = async (req: Request, res: Response) => {
  const ownerId = req.user?.id;
  const { name, members } = req.body;
  if (!name) return res.status(400).json({ message: 'Team name required' });
  const team = new Team({ name, owner: ownerId, members: [] });
  if (Array.isArray(members)) {
    for (const m of members) {
      const cap = Number(m.capacity) || 0;
      if (cap < 0 || cap > 5) return res.status(400).json({ message: 'capacity must be between 0 and 5' });
      team.members.push({ name: m.name, role: m.role, capacity: cap } as any);
    }
  }
  await team.save();
  res.status(201).json(team);
};

export const listTeams = async (req: Request, res: Response) => {
  const ownerId = req.user?.id;
  const teams = await Team.find({ owner: ownerId });
  res.json(teams);
};

export const getTeam = async (req: Request, res: Response) => {
  const ownerId = req.user?.id;
  const team = await Team.findOne({ _id: req.params.id, owner: ownerId });
  if (!team) return res.status(404).json({ message: 'Not found' });
  res.json(team);
};

export const addMember = async (req: Request, res: Response) => {
  const ownerId = req.user?.id;
  const { name, role, capacity } = req.body;
  if (!name) return res.status(400).json({ message: 'Member name required' });
  const cap = Number(capacity) || 0;
  if (cap < 0 || cap > 5) return res.status(400).json({ message: 'capacity must be between 0 and 5' });
  const team = await Team.findOne({ _id: req.params.id, owner: ownerId });
  if (!team) return res.status(404).json({ message: 'Not found' });
  const member = { name, role, capacity: cap } as any;
  team.members.push(member);
  await team.save();
  res.status(201).json(team);
};

export const removeMember = async (req: Request, res: Response) => {
  const ownerId = req.user?.id;
  const { id, memberId } = req.params;
  const team = await Team.findOne({ _id: id, owner: ownerId });
  if (!team) return res.status(404).json({ message: 'Not found' });
  const idx = team.members.findIndex((m) => m._id?.toString() === memberId);
  if (idx === -1) return res.status(404).json({ message: 'Member not found' });
  team.members.splice(idx, 1);
  await team.save();
  res.status(204).send();
};

// Auto reassign tasks for a team according to capacities and priority rules
export const reassignTasks = async (req: Request, res: Response) => {
  const ownerId = req.user?.id;
  const teamId = req.params.id;
  if (!Types.ObjectId.isValid(teamId)) return res.status(400).json({ message: 'Invalid team id' });
  const team = await Team.findOne({ _id: teamId, owner: ownerId });
  if (!team) return res.status(404).json({ message: 'Team not found or not owned' });

  // Gather project ids for this team
  const projects = await Project.find({ team: team._id }).select('_id');
  const projectIds = projects.map((p) => p._id);

  // Fetch tasks assigned to members of this team that belong to these projects
  const tasks = await Task.find({ project: { $in: projectIds }, assignedMember: { $exists: true, $ne: null } });

  // Map memberId -> tasks assigned
  const memberTasks = new Map<string, any[]>();
  for (const m of team.members) memberTasks.set(m._id!.toString(), []);
  for (const t of tasks) {
    const mid = t.assignedMember?.toString();
    if (mid && memberTasks.has(mid)) memberTasks.get(mid)!.push(t);
  }

  // Compute available capacity per member
  const memberInfo = team.members.map((m) => {
    const id = m._id!.toString();
    const assigned = memberTasks.get(id)?.length || 0;
    return { id, name: m.name, capacity: m.capacity, assigned, available: Math.max(0, m.capacity - assigned) };
  });

  // Members over capacity -> need to move tasks
  const overMembers = memberInfo.filter((mi) => mi.assigned > mi.capacity);

  const activities: any[] = [];

  // Helper to find target member with available capacity (prefer most available)
  const findTarget = () => {
    const targets = memberInfo.filter((mi) => mi.available > 0);
    if (targets.length === 0) return null;
    targets.sort((a, b) => b.available - a.available);
    return targets[0];
  };

  // For each overMember, select tasks to reassign (only Low and Medium; keep High)
  for (const om of overMembers) {
    const assignedList = memberTasks.get(om.id) || [];
    // Candidate tasks: Low first, then Medium, exclude High
    const candidates = assignedList
      .filter((t) => t.priority === 'Low' || t.priority === 'Medium')
      .sort((a, b) => {
        const pri = { Low: 0, Medium: 1 } as any;
        if (pri[a.priority] !== pri[b.priority]) return pri[a.priority] - pri[b.priority];
        return a.createdAt - b.createdAt;
      });

    let overflow = om.assigned - om.capacity;
    while (overflow > 0 && candidates.length > 0) {
      const task = candidates.shift();
      const target = findTarget();
      const fromId = om.id;
      if (!target) {
        // No targets available -> unassign the task
        const prev = task.assignedMember;
        task.assignedMember = undefined;
        await task.save();
        activities.push({
          team: team._id,
          performedBy: ownerId,
          task: task._id,
          fromMember: prev,
          toMember: null,
          message: `Auto-unassigned task ${task._id} due to capacity limits`
        });
        overflow -= 1;
        // update counts
        const mi = memberInfo.find((x) => x.id === fromId);
        if (mi) mi.assigned -= 1;
        continue;
      }

      // Reassign to target
      const prev = task.assignedMember;
      task.assignedMember = target.id;
      await task.save();
      activities.push({
        team: team._id,
        performedBy: ownerId,
        task: task._id,
        fromMember: prev,
        toMember: target.id,
        message: `Auto-reassigned task ${task._id} from ${fromId} to ${target.id}`
      });

      // update counts
      const miFrom = memberInfo.find((x) => x.id === fromId);
      if (miFrom) miFrom.assigned -= 1;
      target.available -= 1;
      overflow -= 1;
    }
  }

  // Persist activities
  if (activities.length > 0) {
    const docs = activities.map((a) => ({ ...a }));
    await Activity.insertMany(docs);
  }

  res.json({ moved: activities.length, details: activities });
};
