const express = require('express');
const { body } = require('express-validator');
const { getTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const taskUpdateRules = [
  body('title').optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 150 }),
  body('description').optional({ values: 'undefined' }).isLength({ max: 1000 }),
  body('priority').optional({ checkFalsy: true }).isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional({ checkFalsy: true }).isIn(['todo', 'in-progress', 'review', 'done']),
  body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
];

router.get('/:id', protect, getTask);
router.put('/:id', protect, taskUpdateRules, updateTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
