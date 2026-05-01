const connectDB = require('../config/db');
const { projects: projectsDB, tasks: tasksDB } = connectDB.db;
const { makeUserRef } = require('./User');

const now = () => new Date().toISOString();

async function getUsersMap(ids) {
  const { users: usersDB } = require('../config/db').db;
  const rows = await usersDB.findAsync({ _id: { $in: ids } });
  const map = {};
  rows.forEach((r) => { map[r._id] = r; });
  return map;
}

async function populateProject(raw) {
  if (!raw) return null;
  const memberIds = (raw.members || []).map((m) => m.user);
  const allIds = [...new Set([raw.owner, ...memberIds])];
  const uMap = await getUsersMap(allIds);
  return {
    _id: raw._id,
    name: raw.name,
    description: raw.description || '',
    status: raw.status,
    owner: makeUserRef(uMap[raw.owner]),
    members: (raw.members || []).map((m) => ({ _id: m._id, user: makeUserRef(uMap[m.user]), role: m.role, joinedAt: m.joinedAt })),
    dueDate: raw.dueDate || null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    toString() { return this._id; },
  };
}

const Project = {
  async findById(id) {
    const raw = await projectsDB.findOneAsync({ _id: id });
    return populateProject(raw);
  },

  async findAll({ userId, isAdmin }) {
    let raws;
    if (isAdmin) {
      raws = await projectsDB.findAsync({});
    } else {
      raws = await projectsDB.findAsync({ $or: [{ owner: userId }, { 'members.user': userId }] });
    }
    raws.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Promise.all(raws.map(populateProject));
  },

  async create({ name, description = '', dueDate = null, ownerId }) {
    const ts = now();
    const memberId = Math.random().toString(36).slice(2);
    const raw = await projectsDB.insertAsync({
      name: name.trim(), description: description.trim(), status: 'active',
      owner: ownerId, dueDate: dueDate || null,
      members: [{ _id: memberId, user: ownerId, role: 'admin', joinedAt: ts }],
      createdAt: ts, updatedAt: ts,
    });
    return populateProject(raw);
  },

  async update(id, changes) {
    const raw = await projectsDB.findOneAsync({ _id: id });
    if (!raw) return null;
    const update = { $set: { updatedAt: now() } };
    if (changes.name        !== undefined) update.$set.name        = changes.name.trim();
    if (changes.description !== undefined) update.$set.description = changes.description.trim();
    if (changes.status      !== undefined) update.$set.status      = changes.status;
    if (changes.dueDate     !== undefined) update.$set.dueDate     = changes.dueDate || null;
    await projectsDB.updateAsync({ _id: id }, update, {});
    return this.findById(id);
  },

  async deleteById(id) {
    await tasksDB.removeAsync({ projectId: id }, { multi: true });
    await projectsDB.removeAsync({ _id: id }, {});
  },

  async addMember(projectId, userId, role = 'member') {
    const memberId = Math.random().toString(36).slice(2);
    const member = { _id: memberId, user: userId, role, joinedAt: now() };
    await projectsDB.updateAsync({ _id: projectId }, { $push: { members: member }, $set: { updatedAt: now() } }, {});
    return this.findById(projectId);
  },

  async removeMember(projectId, userId) {
    const raw = await projectsDB.findOneAsync({ _id: projectId });
    if (!raw) return null;
    const members = (raw.members || []).filter((m) => m.user !== userId);
    await projectsDB.updateAsync({ _id: projectId }, { $set: { members, updatedAt: now() } }, {});
    return this.findById(projectId);
  },

  async getTaskCounts(projectIds) {
    if (!projectIds.length) return {};
    const tasks = await tasksDB.findAsync({ projectId: { $in: projectIds } });
    const map = {};
    tasks.forEach((t) => {
      if (!map[t.projectId]) map[t.projectId] = { total: 0, done: 0 };
      map[t.projectId].total++;
      if (t.status === 'done') map[t.projectId].done++;
    });
    return map;
  },
};

module.exports = Project;
