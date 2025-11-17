# Smart Task Manager — Server

Express + TypeScript + Mongoose minimal setup.

Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB running locally or a connection URI

Quick start (PowerShell on Windows)

```powershell
cd g:/Projects/Smart-task-manager/server
npm install
# copy .env.example to .env and edit MONGO_URI if needed
cp .env.example .env
npm run dev
```

API
- `GET /` - health
- `GET /api/tasks` - list tasks
- `POST /api/tasks` - create task (JSON body `{ "title": "..." }`)
- `GET /api/tasks/:id` - get task
- `PUT /api/tasks/:id` - update task
- `DELETE /api/tasks/:id` - delete task

Authentication & Teams
- `POST /api/auth/register` - register a new user (`username`, `password`, optional `name`) -> returns JWT
- `POST /api/auth/login` - login (`username`, `password`) -> returns JWT
- `GET /api/teams` - list teams for the authenticated user (requires `Authorization: Bearer <token>`)
- `POST /api/teams` - create a team (`name`, optional `members` array) (requires auth)
- `GET /api/teams/:id` - get a team (owner only)
- `POST /api/teams/:id/members` - add a member to a team (`name`, `role`, `capacity` 0-5) (owner only)
- `DELETE /api/teams/:id/members/:memberId` - remove a member (owner only)

- `POST /api/teams/:id/reassign` - auto-reassign tasks within a team according to member capacities. Rules: High-priority tasks are not moved; only Low/Medium tasks can be reassigned; changes are recorded in Activity Log.

Projects & Tasks
- `POST /api/projects` - create a project (`name`, `team`) (team owner only)
- `GET /api/projects` - list projects (optionally `?team=`)
- `GET /api/projects/:id` - get a project (owner only)
- `PUT /api/projects/:id` - update a project (owner only)
- `DELETE /api/projects/:id` - delete a project (owner only)

- `POST /api/tasks` - create a task (must include `project` id). Optional `assignedMember` must belong to the project's team. Body: `{ "project": "<id>", "title": "...", "description": "...", "assignedMember": "<memberId?>", "priority": "Low|Medium|High", "status": "Pending|In Progress|Done" }`
- `GET /api/tasks?project=<id>&member=<memberId>` - list tasks filtered by project or member
- `PUT /api/tasks/:id` - update task (validates assigned member belongs to project team)
- `DELETE /api/tasks/:id` - delete task

Build & production
```powershell
npm run build
npm start
```

If you'd like, I can run `npm install` and start the dev server for you locally. Say "run it now" and I'll proceed (requires Node installed on your machine).
