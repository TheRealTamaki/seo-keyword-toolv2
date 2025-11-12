import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { projectExists } from '../models/project.model';
import {
  createAlert,
  getUserAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
  getAlertHistory,
  getNotificationPreferences,
  updateNotificationPreferences,
  CreateAlertInput,
  UpdateAlertInput,
  AlertType,
} from '../models/alert.model';
import { evaluateAlertsForKeyword } from '../services/alert.service';

const router = Router();

// All alert routes require authentication
router.use(authenticate);

/**
 * POST /api/alerts
 * Create a new alert configuration
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const {
      projectId,
      name,
      description,
      alertType,
      conditions,
      keywordFilters,
      enabled,
      emailEnabled,
      emailAddresses,
      webhookEnabled,
      webhookUrl,
      webhookType,
      webhookConfig,
      notificationFrequency,
    } = req.body;

    // Validation
    if (!name || !alertType) {
      return res.status(400).json({
        success: false,
        error: 'name and alertType are required',
      });
    }

    const validAlertTypes: AlertType[] = [
      'rank_change',
      'rank_improvement',
      'rank_drop',
      'serp_feature',
      'competitor_movement',
      'new_ranking',
      'lost_ranking',
    ];

    if (!validAlertTypes.includes(alertType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid alertType. Must be one of: ${validAlertTypes.join(', ')}`,
      });
    }

    // Verify project ownership if projectId provided
    if (projectId) {
      const projectBelongsToUser = await projectExists(projectId, userId);
      if (!projectBelongsToUser) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }
    }

    const alertInput: CreateAlertInput = {
      userId,
      projectId,
      name,
      description,
      alertType,
      conditions: conditions || {},
      keywordFilters,
      enabled,
      emailEnabled,
      emailAddresses,
      webhookEnabled,
      webhookUrl,
      webhookType,
      webhookConfig,
      notificationFrequency,
    };

    const alert = await createAlert(alertInput);

    return res.status(201).json({
      success: true,
      data: alert,
    });
  } catch (error: any) {
    console.error('Error creating alert:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create alert',
    });
  }
});

/**
 * GET /api/alerts
 * Get all alerts for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.query;

    // Verify project ownership if projectId provided
    if (projectId) {
      const projectBelongsToUser = await projectExists(projectId as string, userId);
      if (!projectBelongsToUser) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }
    }

    const alerts = await getUserAlerts(userId, projectId as string);

    return res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch alerts',
    });
  }
});

/**
 * GET /api/alerts/:id
 * Get a specific alert by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const alert = await getAlertById(id, userId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    return res.json({
      success: true,
      data: alert,
    });
  } catch (error: any) {
    console.error('Error fetching alert:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch alert',
    });
  }
});

/**
 * PUT /api/alerts/:id
 * Update an alert configuration
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const updateData: UpdateAlertInput = req.body;

    const alert = await updateAlert(id, userId, updateData);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    return res.json({
      success: true,
      data: alert,
    });
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update alert',
    });
  }
});

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const deleted = await deleteAlert(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    return res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting alert:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete alert',
    });
  }
});

/**
 * GET /api/alerts/history/all
 * Get alert history for user
 */
router.get('/history/all', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId, limit } = req.query;

    // Verify project ownership if projectId provided
    if (projectId) {
      const projectBelongsToUser = await projectExists(projectId as string, userId);
      if (!projectBelongsToUser) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }
    }

    const history = await getAlertHistory(
      userId,
      projectId as string,
      limit ? parseInt(limit as string) : 50
    );

    return res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error: any) {
    console.error('Error fetching alert history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch alert history',
    });
  }
});

/**
 * GET /api/alerts/preferences
 * Get user's notification preferences
 */
router.get('/preferences/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const preferences = await getNotificationPreferences(userId);

    return res.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch notification preferences',
    });
  }
});

/**
 * PUT /api/alerts/preferences
 * Update user's notification preferences
 */
router.put('/preferences/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const preferences = await updateNotificationPreferences(userId, req.body);

    return res.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update notification preferences',
    });
  }
});

/**
 * POST /api/alerts/test/:id
 * Test an alert (manually trigger evaluation)
 */
router.post('/test/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const { keywordId } = req.body;

    // Verify alert ownership
    const alert = await getAlertById(id, userId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    if (!keywordId) {
      return res.status(400).json({
        success: false,
        error: 'keywordId is required for testing',
      });
    }

    // Evaluate alerts for the specified keyword
    const triggeredCount = await evaluateAlertsForKeyword(keywordId);

    return res.json({
      success: true,
      message: `Alert evaluation completed. ${triggeredCount} alert(s) triggered.`,
      triggeredCount,
    });
  } catch (error: any) {
    console.error('Error testing alert:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to test alert',
    });
  }
});

export default router;
