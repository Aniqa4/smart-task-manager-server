(async () => {
  const base = 'http://localhost:' + (process.env.PORT || 3000);
  const log = (label, obj) => console.log('\n== ' + label + ' ==\n', JSON.stringify(obj, null, 2));
  const fetchJson = async (url, opts) => {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch (e) {}
    return { status: res.status, body };
  };

  // wait for server
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(base + '/');
      if (r.ok) { ready = true; break; }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  if (!ready) return console.error('Server did not become ready');

  // 1) Register or login
  const username = 'smoketest_user';
  const password = 'pass1234';
  let token = null;

  let r = await fetchJson(base + '/api/auth/register', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, password, name: 'Smoke Tester' })
  });
  if (r.status === 201) {
    token = r.body.token;
    log('registered', r.body);
  } else if (r.status === 409) {
    // already exists -> login
    r = await fetchJson(base + '/api/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, password })
    });
    if (r.status === 200) { token = r.body.token; log('login', r.body); } else { console.error('Login failed', r); return process.exit(1); }
  } else {
    console.error('Register failed', r); return process.exit(1);
  }

  const auth = { Authorization: 'Bearer ' + token };

  // 2) Create team with members
  const teamBody = { name: 'Smoke Team', members: [ { name: 'Alice', capacity: 3 }, { name: 'Bob', capacity: 1 }, { name: 'Charlie', capacity: 2 } ] };
  r = await fetchJson(base + '/api/teams', { method: 'POST', headers: { ...auth, 'Content-Type':'application/json' }, body: JSON.stringify(teamBody) });
  if (r.status !== 201) { console.error('Create team failed', r); return process.exit(1); }
  const team = r.body; log('team created', team);

  const memberIds = team.members.map(m => m._id);

  // 3) Create a project linked to this team
  r = await fetchJson(base + '/api/projects', { method: 'POST', headers: { ...auth, 'Content-Type':'application/json' }, body: JSON.stringify({ name: 'Project X', team: team._id }) });
  if (r.status !== 201) { console.error('Create project failed', r); return process.exit(1); }
  const project = r.body; log('project created', project);

  // 4) Create tasks and assign many to Alice to exceed capacity
  const tasksToCreate = [];
  // Alice (memberIds[0]) capacity 3 -> assign 6 tasks to overflow
  for (let i = 0; i < 6; i++) tasksToCreate.push({ project: project._id, title: `Alice task ${i+1}`, assignedMember: memberIds[0], priority: i % 3 === 0 ? 'High' : (i%3===1?'Medium':'Low') });
  // Bob (capacity 1) assign 1 task
  tasksToCreate.push({ project: project._id, title: 'Bob task 1', assignedMember: memberIds[1], priority: 'Low' });
  // Charlie none

  const created = [];
  for (const t of tasksToCreate) {
    r = await fetchJson(base + '/api/tasks', { method: 'POST', headers: { ...auth, 'Content-Type':'application/json' }, body: JSON.stringify(t) });
    if (r.status !== 201) { console.error('Create task failed', r); return process.exit(1); }
    created.push(r.body);
  }
  log('tasks created count', { count: created.length });

  // 5) Call reassign endpoint
  r = await fetchJson(base + `/api/teams/${team._id}/reassign`, { method: 'POST', headers: auth });
  log('reassign result', r);

  // 6) Fetch tasks list to check assignments
  r = await fetchJson(base + `/api/tasks?project=${project._id}`, { method: 'GET', headers: auth });
  log('tasks after reassign', r.body.map(t => ({ id: t._id, title: t.title, assignedMember: t.assignedMember, priority: t.priority })));

  console.log('\nSmoke test completed');
  process.exit(0);
})();
