import { Router, Request, Response } from 'express';
import * as AuthService from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  handleValidationErrors,
} from '../middleware/validation.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const result = await AuthService.register({ email, password });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
        },
        message: 'Registration successful',
      });
    } catch (error) {
      console.error('Registration error:', error);

      if (error instanceof Error && error.message === 'Email already registered') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
        },
        message: 'Login successful',
      });
    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof Error && error.message === 'Invalid email or password') {
        res.status(401).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Login failed',
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user (blacklist token)
 */
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.token;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      await AuthService.logout(token);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);

      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
      });
    }
  }
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  authenticate,
  changePasswordValidation,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      await AuthService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);

      if (error instanceof Error) {
        if (error.message === 'Current password is incorrect') {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }

        if (error.message === 'User not found') {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to change password',
      });
    }
  }
);

/**
 * POST /api/auth/verify
 * Verify if token is valid
 */
router.post(
  '/verify',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    // If authenticate middleware passes, token is valid
    res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: req.user,
      },
    });
  }
);

module.exports = router;
