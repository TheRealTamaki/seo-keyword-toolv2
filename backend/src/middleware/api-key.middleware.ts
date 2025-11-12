import { Request, Response, NextFunction } from 'express';
import * as ApiKeyModel from '../models/api-key.model';

/**
 * Middleware to ensure user has an active API key
 * Should be used after authenticate middleware
 */
export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const hasApiKey = await ApiKeyModel.hasActiveApiKey(userId);

    if (!hasApiKey) {
      res.status(403).json({
        success: false,
        error: 'DataForSEO API key required',
        message: 'Please add your DataForSEO API key to use this feature',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('API key check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify API key',
    });
  }
}

/**
 * Middleware to check if API key is validated
 * Allows access but warns if key hasn't been validated
 */
export async function warnIfKeyNotValidated(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      next();
      return;
    }

    const apiKeyInfo = await ApiKeyModel.getApiKeyInfo(userId);

    if (apiKeyInfo && !apiKeyInfo.validated_successfully) {
      // Attach warning to response (can be used by frontend)
      res.locals.apiKeyWarning = 'Your DataForSEO API key has not been validated. Some features may not work correctly.';
    }

    next();
  } catch (error) {
    console.error('API key validation check error:', error);
    // Don't block the request, just log the error
    next();
  }
}
