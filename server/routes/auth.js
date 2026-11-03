import express from 'express';
import { User, USER_ROLES, USER_LANGUAGES } from '../models/User.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Create a new user account with schema validation & password hashing
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, primaryLanguage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    const passwordHash = User.hashPassword(password);
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: USER_ROLES.includes(role) ? role : 'Developer',
      primaryLanguage: USER_LANGUAGES.includes(primaryLanguage) ? primaryLanguage : 'javascript'
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to BugSense AI.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        primaryLanguage: newUser.primaryLanguage,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user with email and password
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const isMatch = user.verifyPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        primaryLanguage: user.primaryLanguage,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/demo
 * Instant Demo / Guest access for visitors
 */
router.post('/demo', async (req, res, next) => {
  try {
    const demoUser = {
      id: 'demo-dev-' + Date.now().toString(36),
      name: 'Guest Developer',
      email: 'demo@bugsense.ai',
      role: 'Developer',
      primaryLanguage: 'python',
      isGuest: true,
      createdAt: new Date()
    };

    res.json({
      success: true,
      message: 'Logged in as Demo Developer!',
      user: demoUser
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/meta
 * Returns supported roles and languages for registration forms
 */
router.get('/meta', (req, res) => {
  res.json({
    success: true,
    roles: USER_ROLES,
    languages: USER_LANGUAGES
  });
});

export default router;

