import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { userQueries, sessionQueries } from './databaseService.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET not set in environment. Using random secret. This will invalidate tokens on restart!');
}

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.debug('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Plain text password
 * @returns {Promise<Object>} Created user object (without password)
 */
export async function registerUser({ username, email, password }) {
  // Validate input
  if (!username || username.length < 3) {
    throw new Error('Username must be at least 3 characters long');
  }

  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Check if user already exists
  const existingUser = userQueries.findByEmail.get(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const existingUsername = userQueries.findByUsername.get(username);
  if (existingUsername) {
    throw new Error('Username already taken');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  try {
    const result = userQueries.create.run(username, email, passwordHash);
    const user = userQueries.findById.get(result.lastInsertRowid);

    logger.info(`User registered: ${username} (${email})`);

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    logger.error('User registration failed:', error);
    throw new Error('Failed to create user');
  }
}

/**
 * Authenticate a user with email and password
 * @param {string} email - Email address
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} Object containing user and token
 */
export async function loginUser(email, password) {
  // Find user by email
  const user = userQueries.findByEmail.get(email);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.is_active) {
    throw new Error('Account is deactivated');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken(user);

  // Store session in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  sessionQueries.create.run(user.id, token, expiresAt.toISOString());

  logger.info(`User logged in: ${user.username} (${user.email})`);

  // Return user (without password) and token
  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token
  };
}

/**
 * Logout a user (invalidate session)
 * @param {string} token - JWT token
 */
export function logoutUser(token) {
  try {
    sessionQueries.delete.run(token);
    logger.info('User logged out');
  } catch (error) {
    logger.error('Logout failed:', error);
  }
}

/**
 * Get user from token
 * @param {string} token - JWT token
 * @returns {Object|null} User object or null if invalid
 */
export function getUserFromToken(token) {
  const session = sessionQueries.findByToken.get(token);

  if (!session) {
    return null;
  }

  if (!session.is_active) {
    return null;
  }

  // Return user without sensitive data
  return {
    id: session.user_id,
    username: session.username,
    email: session.email,
    is_active: session.is_active
  };
}

/**
 * Refresh a user's token
 * @param {string} oldToken - Current JWT token
 * @returns {string} New JWT token
 */
export function refreshToken(oldToken) {
  const user = getUserFromToken(oldToken);

  if (!user) {
    throw new Error('Invalid or expired token');
  }

  // Delete old session
  sessionQueries.delete.run(oldToken);

  // Create new token and session
  const newToken = generateToken(user);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  sessionQueries.create.run(user.id, newToken, expiresAt.toISOString());

  logger.info(`Token refreshed for user: ${user.username}`);

  return newToken;
}
