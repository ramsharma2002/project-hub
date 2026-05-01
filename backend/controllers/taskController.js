const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

const getTasksByProject = async (req, res, next) => {
  try {
    const { status, priority, assignee, search } = req.query;
    const tasks = await Task.findByProject(req.params.projectId, { status, priority, assignee, search });
    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { title, description, assignee, priority, dueDate, tags } = req.body;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const isMember = project.members.some((m) => m.user._id === req.user._id);
    const isOwner = project.owner._id === req.user._id;
    if (!isMember && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (assignee) {
      const validAssignee = project.members.some((m) => m.user._id === assignee) || project.owner._id === assignee;
      if (!validAssignee && req.user.role !== 'admin') {
        return res.status(400).json({ success: false, message: 'Assignee must be a member of this project.' });
      }
    }
    const task = await Task.create({ title, description, projectId, assigneeId: assignee || null, createdById: req.user._id, priority: priority || 'medium', dueDate, tags });
    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await Project.findById(task.projectId);
    const isMember = project.members.some((m) => m.user._id === req.user._id);
    const isOwner = project.owner._id === req.user._id;
    if (!isMember && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await Project.findById(task.projectId);
    const isMember = project.members.some((m) => m.user._id === req.user._id);
    const isOwner = project.owner._id === req.user._id;
    const isTaskCreator = task.createdBy._id === req.user._id;
    const isAssignee = task.assignee && task.assignee._id === req.user._id;
    if (!isMember && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { title, description, status, priority, dueDate, assignee, tags } = req.body;
    const memberEntry = project.members.find((m) => m.user._id === req.user._id);
    const isProjectAdmin = memberEntry && memberEntry.role === 'admin';

    let changes = {};
    if (!isOwner && !isProjectAdmin && !isTaskCreator && req.user.role !== 'admin') {
      if (!isAssignee) return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you.' });
      if (status !== undefined) changes.status = status;
    } else {
      if (title !== undefined)       changes.title = title;
      if (description !== undefined) changes.description = description;
      if (status !== undefined)      changes.status = status;
      if (priority !== undefined)    changes.priority = priority;
      if (dueDate !== undefined)     changes.dueDate = dueDate;
      if (assignee !== undefined)    changes.assigneeId = assignee || null;
      if (tags !== undefined)        changes.tags = tags;
    }
    const updated = await Task.update(req.params.id, changes);
    res.json({ success: true, task: updated });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await Project.findById(task.projectId);
    const isOwner = project.owner._id === req.user._id;
    const memberEntry = project.members.find((m) => m.user._id === req.user._id);
    const isProjectAdmin = memberEntry && memberEntry.role === 'admin';
    const isTaskCreator = task.createdBy._id === req.user._id;
    if (!isOwner && !isProjectAdmin && !isTaskCreator && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only the task creator or project admin can delete tasks.' });
    }
    await Task.deleteById(task._id);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasksByProject, createTask, getTask, updateTask, deleteTask };
