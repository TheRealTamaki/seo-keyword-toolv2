import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { setCache, deleteCache, cacheExists } from '../config/redis';
import * as UserModel from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const SALT_ROUNDS = 10;

// Token blacklist cache prefix
const TOKEN_BLACKLIST_PREFIX = 'token:blacklist:';

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: UserModel.UserDTO;
  token: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Register a new user
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const { email, password } = input;

  // Check if user already exists
  const existingUser = await UserModel.findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await UserModel.createUser(email, passwordHash);

  // Generate token
  const token = generateToken({ userId: user.id, email: user.email });

  return { user, token };
}

/**
 * Login user
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  // Find user
  const user = await UserModel.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = generateToken({ userId: user.id, email: user.email });

  // Return user without password hash
  const userDTO = UserModel.toUserDTO(user);

  return { user: userDTO, token };
}

/**
 * Logout user (blacklist token)
 */
export async function logout(token: string): Promise<void> {
  try {
    // Decode token to get expiration
    const decoded = jwt.decode(token) as TokenPayload;

    if (!decoded || !decoded.exp) {
      return; // Token is invalid or doesn't have expiration
    }

    // Calculate TTL (time until token expires)
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;

    if (ttl > 0) {
      // Add token to blacklist with TTL
      await setCache(`${TOKEN_BLACKLIST_PREFIX}${token}`, true, ttl);
    }
  } catch (error) {
    console.error('Error during logout:', error);
    throw new Error('Failed to logout');
  }
}

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    return await cacheExists(`${TOKEN_BLACKLIST_PREFIX}${token}`);
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    return false; // Fail open to avoid blocking valid requests
  }
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Find user
  const user = await UserModel.findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await UserModel.updateUserPassword(userId, newPasswordHash);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
