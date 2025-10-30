import express from 'express';
import { register, login, logout, getCurrentUser, refresh } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', login);

/**
 * POST /api/auth/logout
 * Logout (invalidate session)
 * Requires authentication
 */
router.post('/logout', authenticate, logout);

/**
 * GET /api/auth/me
 * Get current user information
 * Requires authentication
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 * Requires authentication
 */
router.post('/refresh', authenticate, refresh);

export default router;
