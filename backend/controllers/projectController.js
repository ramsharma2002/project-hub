const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.findAll({ userId: req.user._id, isAdmin: req.user.role === 'admin' });
    const projectIds = projects.map((p) => p._id);
    const countMap = await Project.getTaskCounts(projectIds);
    const result = projects.map((p) => ({ ...p, taskStats: countMap[p._id] || { total: 0, done: 0 } }));
    res.json({ success: true, count: result.length, projects: result });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, description, dueDate } = req.body;
    const project = await Project.create({ name, description, dueDate, ownerId: req.user._id });
    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isOwner = project.owner._id === req.user._id;
    const isMember = project.members.some((m) => m.user._id === req.user._id);
    if (!isOwner && !isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, description, status, dueDate } = req.body;
    const project = await Project.update(req.project._id, { name, description, status, dueDate });
    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = req.project;
    const isOwner = project.owner._id === req.user._id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the project owner or a global admin can delete this project.' });
    }
    await Project.deleteById(project._id);
    res.json({ success: true, message: 'Project and all its tasks deleted.' });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required.' });

    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ success: false, message: 'User not found.' });

    const project = req.project;
    const alreadyMember = project.members.some((m) => m.user._id === userId);
    if (alreadyMember) return res.status(409).json({ success: false, message: 'User is already a member.' });

    const updated = await Project.addMember(project._id, userId, role || 'member');
    res.json({ success: true, message: 'Member added.', project: updated });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const project = req.project;
    if (project.owner._id === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner.' });
    }
    const isMember = project.members.some((m) => m.user._id === userId);
    if (!isMember) return res.status(404).json({ success: false, message: 'Member not found in project.' });

    const updated = await Project.removeMember(project._id, userId);
    res.json({ success: true, message: 'Member removed.', project: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
