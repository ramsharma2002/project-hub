const connectDB = require('../config/db');
const { tasks: tasksDB, users: usersDB, projects: projectsDB } = connectDB.db;

const now = () => new Date().toISOString();

async function populateTask(raw) {
  if (!raw) return null;
  const ids = [raw.createdById, raw.assigneeId, raw.projectId].filter(Boolean);
  const [users, project] = await Promise.all([
    usersDB.findAsync({ _id: { $in: [raw.createdById, raw.assigneeId].filter(Boolean) } }),
    projectsDB.findOneAsync({ _id: raw.projectId }),
  ]);
  const uMap = {};
  users.forEach((u) => { uMap[u._id] = u; });
  const dueDate = raw.dueDate || null;
  const isOverdue = !!(dueDate && raw.status !== 'done' && new Date(dueDate) < new Date());
  const makeRef = (u) => u ? { _id: u._id, name: u.name, email: u.email, toString() { return this._id; } } : null;
  return {
    _id: raw._id,
    title: raw.title,
    description: raw.description || '',
    project: project ? { _id: project._id, name: project.name, toString() { return this._id; } } : { _id: raw.projectId, toString() { return this._id; } },
    projectId: raw.projectId,
    assignee: makeRef(uMap[raw.assigneeId]),
    createdBy: makeRef(uMap[raw.createdById]),
    status: raw.status,
    priority: raw.priority,
    dueDate,
    completedAt: raw.completedAt || null,
    tags: raw.tags || [],
    isOverdue,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    toString() { return this._id; },
  };
}

const Task = {
  async findById(id) {
    const raw = await tasksDB.findOneAsync({ _id: id });
    return populateTask(raw);
  },

  async findByProject(projectId, filters = {}) {
    const query = { projectId };
    if (filters.status)   query.status     = filters.status;
    if (filters.priority) query.priority   = filters.priority;
    if (filters.assignee) query.assigneeId = filters.assignee;
    if (filters.search)   query.title      = new RegExp(filters.search, 'i');
    const raws = await tasksDB.findAsync(query);
    raws.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Promise.all(raws.map(populateTask));
  },

  async create({ title, description = '', projectId, assigneeId = null, createdById, status = 'todo', priority = 'medium', dueDate = null, tags = [] }) {
    const ts = now();
    const completedAt = status === 'done' ? ts : null;
    const raw = await tasksDB.insertAsync({
      title: title.trim(), description: description.trim(), projectId,
      assigneeId: assigneeId || null, createdById, status, priority,
      dueDate: dueDate || null, completedAt, tags: tags || [],
      createdAt: ts, updatedAt: ts,
    });
    return populateTask(raw);
  },

  async update(id, changes) {
    const raw = await tasksDB.findOneAsync({ _id: id });
    if (!raw) return null;
    const ts = now();
    const set = { updatedAt: ts };
    if (changes.title       !== undefined) set.title       = changes.title.trim();
    if (changes.description !== undefined) set.description = changes.description.trim();
    if (changes.status      !== undefined) set.status      = changes.status;
    if (changes.priority    !== undefined) set.priority    = changes.priority;
    if (changes.dueDate     !== undefined) set.dueDate     = changes.dueDate || null;
    if (changes.assigneeId  !== undefined) set.assigneeId  = changes.assigneeId || null;
    if (changes.tags        !== undefined) set.tags        = changes.tags;
    if (changes.status !== undefined) {
      if (changes.status === 'done' && !raw.completedAt) set.completedAt = ts;
      else if (changes.status !== 'done')               set.completedAt = null;
    }
    await tasksDB.updateAsync({ _id: id }, { $set: set }, {});
    return this.findById(id);
  },

  async deleteById(id)       { await tasksDB.removeAsync({ _id: id }, {}); },
  async deleteByProject(pId) { await tasksDB.removeAsync({ projectId: pId }, { multi: true }); },

  async getStatsByProjects(projectIds) {
    if (!projectIds.length) return { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    const tasks = await tasksDB.findAsync({ projectId: { $in: projectIds } });
    const map = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    tasks.forEach((t) => { if (map[t.status] !== undefined) map[t.status]++; });
    return map;
  },

  async getOverdue(projectIds) {
    if (!projectIds.length) return [];
    const tasks = await tasksDB.findAsync({ projectId: { $in: projectIds }, status: { $ne: 'done' } });
    const now_ = new Date();
    const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now_);
    overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return Promise.all(overdue.slice(0, 10).map(populateTask));
  },

  async getMyTasks(projectIds, userId) {
    if (!projectIds.length) return [];
    const tasks = await tasksDB.findAsync({ projectId: { $in: projectIds }, assigneeId: userId, status: { $ne: 'done' } });
    tasks.sort((a, b) => (a.dueDate || 'z').localeCompare(b.dueDate || 'z'));
    return Promise.all(tasks.slice(0, 10).map(populateTask));
  },

  async getRecent(projectIds) {
    if (!projectIds.length) return [];
    const tasks = await tasksDB.findAsync({ projectId: { $in: projectIds } });
    tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Promise.all(tasks.slice(0, 5).map(populateTask));
  },
};

module.exports = Task;
