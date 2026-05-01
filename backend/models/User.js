const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const { users: usersDB } = connectDB.db;

const now = () => new Date().toISOString();

function makeUserRef(row) {
  if (!row) return null;
  return { _id: row._id, name: row.name, email: row.email, role: row.role, toString() { return this._id; } };
}

function makeUser(row, includePassword = false) {
  if (!row) return null;
  const user = {
    _id: row._id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    toString() { return this._id; },
    toJSON() {
      return { _id: this._id, name: this.name, email: this.email, role: this.role, avatar: this.avatar, createdAt: this.createdAt, updatedAt: this.updatedAt };
    },
  };
  if (includePassword && row.password) {
    user.password = row.password;
    user.comparePassword = (candidate) => bcrypt.compare(candidate, row.password);
  }
  return user;
}

const User = {
  async findById(id) {
    const row = await usersDB.findOneAsync({ _id: id });
    return makeUser(row);
  },
  async findOne({ email }) {
    const row = await usersDB.findOneAsync({ email: email.toLowerCase() });
    return makeUser(row);
  },
  async findOneWithPassword({ email }) {
    const row = await usersDB.findOneAsync({ email: email.toLowerCase() });
    return makeUser(row, true);
  },
  async findAll() {
    const rows = await usersDB.findAsync({});
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows.map((r) => makeUser(r));
  },
  async create({ name, email, password, role = 'member', avatar = '' }) {
    const hashed = await bcrypt.hash(password, 12);
    const ts = now();
    const doc = await usersDB.insertAsync({ name: name.trim(), email: email.toLowerCase().trim(), password: hashed, role, avatar, createdAt: ts, updatedAt: ts });
    return makeUser(doc);
  },
  async updateById(id, { name }) {
    await usersDB.updateAsync({ _id: id }, { $set: { name: name.trim(), updatedAt: now() } }, {});
    return this.findById(id);
  },
  makeUserRef,
};

module.exports = User;
