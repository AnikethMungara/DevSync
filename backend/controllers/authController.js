import { registerUser, loginUser, logoutUser, getUserFromToken, refreshToken } from '../services/authService.js';
import logger from '../utils/logger.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }

    const user = await registerUser({ username, email, password });

    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
}

/**
 * Login a user
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await loginUser(email, password);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
}

/**
 * Logout a user
 * POST /api/auth/logout
 */
export function logout(req, res) {
  try {
    const token = req.token;

    if (token) {
      logoutUser(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
}

/**
 * Get current user
 * GET /api/auth/me
 */
export function getCurrentUser(req, res) {
  try {
    const user = req.user;

    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
}

/**
 * Refresh authentication token
 * POST /api/auth/refresh
 */
export function refresh(req, res) {
  try {
    const oldToken = req.token;

    if (!oldToken) {
      return res.status(401).json({
        success: false,
        error: 'No token to refresh'
      });
    }

    const newToken = refreshToken(oldToken);

    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Token refresh failed'
    });
  }
}
