import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as ApiKeyModel from '../models/api-key.model';
import * as DataForSEOService from '../services/dataforseo.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/api-keys
 * Get current user's API key info (without exposing the actual key)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const apiKeyInfo = await ApiKeyModel.getApiKeyInfo(userId);

    if (!apiKeyInfo) {
      res.status(404).json({
        success: false,
        error: 'No API key found',
        message: 'Please add your DataForSEO API key to use SEO features',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: apiKeyInfo,
    });
  } catch (error) {
    console.error('Get API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve API key information',
    });
  }
});

/**
 * POST /api/api-keys
 * Create or update API key for current user
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Debug logging
    console.log('API Key POST request received');
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);

    const { apiKey, skipValidation } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        error: 'Post data is empty',
        message: 'No data was received in the request body'
      });
      return;
    }

    if (!apiKey || typeof apiKey !== 'string') {
      res.status(400).json({
        success: false,
        error: 'API key is required',
      });
      return;
    }

    // Validate the API key with DataForSEO unless skipped
    if (!skipValidation) {
      console.log('Starting DataForSEO validation...');
      try {
        const validation = await DataForSEOService.validateApiKey(apiKey);
        console.log('Validation result:', validation);

        if (!validation.valid) {
          console.log('Validation failed:', validation.message);
          res.status(400).json({
            success: false,
            error: 'Invalid DataForSEO API key',
            message: validation.message,
          });
          return;
        }
        console.log('Validation passed');
      } catch (validationError) {
        console.error('Validation error occurred:', validationError);
        throw validationError;
      }
    }

    // Store encrypted API key
    console.log('Storing API key in database...');
    const result = await ApiKeyModel.upsertApiKey(userId, apiKey);
    console.log('API key stored successfully');

    // Update validation status
    console.log('Updating validation status...');
    await ApiKeyModel.updateValidationStatus(userId, !skipValidation);
    console.log('Validation status updated');

    res.status(201).json({
      success: true,
      data: result,
      message: 'API key saved successfully',
    });
  } catch (error) {
    console.error('Save API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save API key',
    });
  }
});

/**
 * POST /api/api-keys/validate
 * Validate the current user's API key
 */
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const apiKey = await ApiKeyModel.getDecryptedApiKey(userId);

    if (!apiKey) {
      res.status(404).json({
        success: false,
        error: 'No API key found',
        message: 'Please add your DataForSEO API key first',
      });
      return;
    }

    // Validate with DataForSEO
    const validation = await DataForSEOService.validateApiKey(apiKey);

    // Update validation status in database
    await ApiKeyModel.updateValidationStatus(userId, validation.valid);

    if (validation.valid) {
      res.status(200).json({
        success: true,
        data: {
          valid: true,
          message: validation.message,
          details: validation.details,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        data: {
          valid: false,
          message: validation.message,
        },
      });
    }
  } catch (error) {
    console.error('Validate API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key',
    });
  }
});

/**
 * GET /api/api-keys/account-info
 * Get DataForSEO account information for current user
 */
router.get('/account-info', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const apiKey = await ApiKeyModel.getDecryptedApiKey(userId);

    if (!apiKey) {
      res.status(404).json({
        success: false,
        error: 'No API key found',
      });
      return;
    }

    const accountInfo = await DataForSEOService.getUserInfo(apiKey);

    res.status(200).json({
      success: true,
      data: accountInfo,
    });
  } catch (error) {
    console.error('Get account info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve account information',
    });
  }
});

/**
 * DELETE /api/api-keys
 * Delete current user's API key
 */
router.delete('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    await ApiKeyModel.deleteApiKey(userId);

    res.status(200).json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Delete API key error:', error);

    if (error instanceof Error && error.message === 'API key not found') {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete API key',
    });
  }
});

/**
 * POST /api/api-keys/deactivate
 * Deactivate current user's API key (soft delete)
 */
router.post('/deactivate', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    await ApiKeyModel.deactivateApiKey(userId);

    res.status(200).json({
      success: true,
      message: 'API key deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate API key',
    });
  }
});

module.exports = router;
