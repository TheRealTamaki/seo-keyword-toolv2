import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { validateEmail, validatePasswordStrength } from '../services/auth.service';
import { validateDomain, validateProjectName, validateProjectDescription } from '../services/validation.service';

/**
 * Middleware to handle validation results
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      })),
    });
    return;
  }

  next();
}

/**
 * Validation rules for user registration
 */
export const registerValidation: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .custom((value) => {
      if (!validateEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
];

/**
 * Validation rules for user login
 */
export const loginValidation: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation rules for password change
 */
export const changePasswordValidation: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    })
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
];

/**
 * Validation rules for email update
 */
export const updateEmailValidation: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .custom((value) => {
      if (!validateEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),
];

/**
 * Validation rules for creating a project
 */
export const createProjectValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .custom((value) => {
      const validation = validateProjectName(value);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),

  body('domain')
    .trim()
    .notEmpty()
    .withMessage('Domain is required')
    .custom((value) => {
      const validation = validateDomain(value);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .custom((value) => {
      const validation = validateProjectDescription(value);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
];

/**
 * Validation rules for updating a project
 */
export const updateProjectValidation: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .custom((value) => {
      if (value) {
        const validation = validateProjectName(value);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }
      }
      return true;
    }),

  body('domain')
    .optional()
    .trim()
    .custom((value) => {
      if (value) {
        const validation = validateDomain(value);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .custom((value) => {
      if (value) {
        const validation = validateProjectDescription(value);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }
      }
      return true;
    }),
];
