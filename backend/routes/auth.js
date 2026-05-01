const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe, getAllUsers, updateProfile } = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const signupRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
];

router.post('/signup', signupRules, signup);
router.post('/login', loginRules, login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfileRules, updateProfile);
router.get('/users', protect, restrictTo('admin'), getAllUsers);

module.exports = router;
