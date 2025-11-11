import { Request, Response, NextFunction } from 'express';
import { verifyToken, isTokenBlacklisted, TokenPayload } from '../services/auth.service';
import * as UserModel from '../models/user.model';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserModel.UserDTO;
      userId?: string;
      token?: string;
    }
  }
}

/**
 * Middleware to authenticate JWT token
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      res.status(401).json({
        success: false,
        error: 'Token has been revoked',
      });
      return;
    }

    // Verify token
    let decoded: TokenPayload;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid token',
      });
      return;
    }

    // Get user from database
    const user = await UserModel.findUserByIdSafe(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Attach user and token to request
    req.user = user;
    req.userId = user.id;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication',
    });
  }
}

/**
 * Middleware to optionally authenticate (doesn't fail if no token)
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      next();
      return;
    }

    // Verify token
    try {
      const decoded = verifyToken(token);
      const user = await UserModel.findUserByIdSafe(decoded.userId);

      if (user) {
        req.user = user;
        req.userId = user.id;
        req.token = token;
      }
    } catch (error) {
      // Invalid token, continue without user
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue without user on error
  }
}

/**
 * Middleware to check if user is authenticated
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  next();
}

/**
 * Helper function to get user from request
 */
export function getAuthUser(req: Request): UserModel.UserDTO | null {
  return req.user || null;
}

/**
 * Helper function to get user ID from request
 */
export function getAuthUserId(req: Request): string | null {
  return req.userId || null;
}
