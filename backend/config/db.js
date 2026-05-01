const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = {
  users:    new Datastore({ filename: path.join(DATA_DIR, 'users.db'),    autoload: true }),
  projects: new Datastore({ filename: path.join(DATA_DIR, 'projects.db'), autoload: true }),
  tasks:    new Datastore({ filename: path.join(DATA_DIR, 'tasks.db'),    autoload: true }),
};

// Indexes
db.users.ensureIndex({ fieldName: 'email', unique: true });
db.tasks.ensureIndex({ fieldName: 'projectId' });

const connectDB = () => {
  console.log('NeDB file-based database ready at', DATA_DIR);
};

module.exports = connectDB;
module.exports.db = db;
