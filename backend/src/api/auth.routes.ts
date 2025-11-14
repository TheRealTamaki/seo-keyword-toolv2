import { Router, Request, Response } from 'express';
import * as AuthService from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} from '../middleware/validation.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with Supabase Auth
 */
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const result = await AuthService.register({ email, password });

      // Check if email confirmation is required (no session returned)
      if (!result.session) {
        res.status(201).json({
          success: true,
          data: {
            user: result.user,
            requiresEmailVerification: true,
          },
          message: 'Registration successful! Please check your email to verify your account before logging in.',
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          session: result.session,
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        },
        message: 'Registration successful. You are now logged in.',
      });
    } catch (error) {
      console.error('Registration error:', error);

      if (error instanceof Error) {
        if (error.message.includes('already registered')) {
          res.status(409).json({
            success: false,
            error: error.message,
          });
          return;
        }

        if (error.message.includes('Password')) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
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
 * Login user with Supabase Auth
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
          session: result.session,
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
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
 * Logout user (invalidate Supabase session)
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { newPassword } = req.body;
      const token = req.token;

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      if (!newPassword) {
        res.status(400).json({
          success: false,
          error: 'New password is required',
        });
        return;
      }

      await AuthService.changePassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to change password',
      });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Send password reset email
 */
router.post(
  '/reset-password',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      await AuthService.sendPasswordResetEmail(email);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      });
    } catch (error) {
      console.error('Reset password error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to send reset email',
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

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const result = await AuthService.refreshToken(refresh_token);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          session: result.session,
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      console.error('Refresh token error:', error);

      res.status(401).json({
        success: false,
        error: 'Failed to refresh token',
      });
    }
  }
);

/**
 * POST /api/auth/resend-verification
 * Resend email verification
 */
router.post(
  '/resend-verification',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      await AuthService.resendVerificationEmail(email);

      res.status(200).json({
        success: true,
        message: 'Verification email sent. Please check your inbox.',
      });
    } catch (error) {
      console.error('Resend verification error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to resend verification email',
      });
    }
  }
);

module.exports = router;
