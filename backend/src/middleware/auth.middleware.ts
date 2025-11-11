import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import * as UserModel from '../models/user.model';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        created_at: string;
      };
      userId?: string;
      token?: string;
    }
  }
}

/**
 * Middleware to authenticate Supabase JWT token
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

    // Verify token with Supabase
    let supabaseUser;
    try {
      supabaseUser = await verifyToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid token',
      });
      return;
    }

    // Sync user to our database if not exists
    let dbUser = await UserModel.findUserById(supabaseUser.id);
    if (!dbUser && supabaseUser.email) {
      await UserModel.createUserFromSupabase(supabaseUser.id, supabaseUser.email);
      dbUser = await UserModel.findUserByIdSafe(supabaseUser.id);
    }

    if (!dbUser) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Attach user and token to request
    req.user = {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      created_at: supabaseUser.created_at,
    };
    req.userId = supabaseUser.id;
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

    // Verify token
    try {
      const supabaseUser = await verifyToken(token);

      // Sync user to our database if not exists
      let dbUser = await UserModel.findUserById(supabaseUser.id);
      if (!dbUser && supabaseUser.email) {
        await UserModel.createUserFromSupabase(supabaseUser.id, supabaseUser.email);
        dbUser = await UserModel.findUserByIdSafe(supabaseUser.id);
      }

      if (dbUser) {
        req.user = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          created_at: supabaseUser.created_at,
        };
        req.userId = supabaseUser.id;
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
export function getAuthUser(req: Request): typeof req.user | null {
  return req.user || null;
}

/**
 * Helper function to get user ID from request
 */
export function getAuthUserId(req: Request): string | null {
  return req.userId || null;
}
