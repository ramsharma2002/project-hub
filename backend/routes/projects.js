const express = require('express');
const { body } = require('express-validator');
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { isProjectMember, isProjectAdmin } = require('../middleware/projectAccess');
const { getTasksByProject, createTask } = require('../controllers/taskController');

const router = express.Router();

const projectRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2–100 characters'),
  body('description').optional({ checkFalsy: true }).isLength({ max: 500 }).withMessage('Description max 500 chars'),
  body('status').optional({ checkFalsy: true }).isIn(['active', 'completed', 'on-hold', 'cancelled']),
  body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
];

const taskRules = [
  body('title').trim().isLength({ min: 2, max: 150 }).withMessage('Title must be 2–150 characters'),
  body('description').optional({ checkFalsy: true }).isLength({ max: 1000 }),
  body('priority').optional({ checkFalsy: true }).isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional({ checkFalsy: true }).isIn(['todo', 'in-progress', 'review', 'done']),
  body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
];

// Project CRUD
router.get('/', protect, getProjects);
router.post('/', protect, projectRules, createProject);
router.get('/:id', protect, getProject);
router.put('/:id', protect, isProjectAdmin, projectRules, updateProject);
router.delete('/:id', protect, isProjectAdmin, deleteProject);

// Member management
router.post('/:id/members', protect, isProjectAdmin, addMember);
router.delete('/:id/members/:userId', protect, isProjectAdmin, removeMember);

// Tasks within a project
router.get('/:projectId/tasks', protect, isProjectMember, getTasksByProject);
router.post('/:projectId/tasks', protect, taskRules, createTask);

module.exports = router;
