import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { projectExists } from '../models/project.model';
import {
  exportData,
  exportKeywords,
  exportProjectRankings,
  exportCompetitors,
  exportKeywordList,
  exportAlertHistory,
  exportProjects,
  ExportType,
  ExportOptions,
} from '../services/export.service';

const router = Router();

// All export routes require authentication
router.use(authenticate);

/**
 * POST /api/exports/keywords/:projectId
 * Export keywords for a project to CSV
 */
router.post('/keywords/:projectId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.params;

    // Verify project ownership
    const projectBelongsToUser = await projectExists(projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const options: ExportOptions = {
      filters: req.body.filters || {},
      columns: req.body.columns,
      sortBy: req.body.sortBy,
      sortOrder: req.body.sortOrder,
      limit: req.body.limit,
    };

    const csv = await exportKeywords(userId, projectId, options);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="keywords_${projectId}.csv"`);

    return res.send(csv);
  } catch (error: any) {
    console.error('Error exporting keywords:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to export keywords',
    });
  }
});

/**
 * POST /api/exports/rankings/:projectId
 * Export all rankings for a project to CSV
 */
router.post('/rankings/:projectId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.params;

    // Verify project ownership
    const projectBelongsToUser = await projectExists(projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const options: ExportOptions = {
      filters: req.body.filters || {},
      columns: req.body.columns,
      dateRange: req.body.dateRange
        ? {
            start: new Date(req.body.dateRange.start),
            end: new Date(req.body.dateRange.end),
          }
        : undefined,
      limit: req.body.limit,
    };

    const csv = await exportProjectRankings(userId, projectId, options);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="rankings_${projectId}.csv"`);

    return res.send(csv);
  } catch (error: any) {
    console.error('Error exporting rankings:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to export rankings',
    });
  }
});

/**
 * POST /api/exports/competitors/:projectId
 * Export competitors for a project to CSV
 */
router.post('/competitors/:projectId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.params;

    // Verify project ownership
    const projectBelongsToUser = await projectExists(projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const options: ExportOptions = {
      columns: req.body.columns,
    };

    const csv = await exportCompetitors(userId, projectId, options);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="competitors_${projectId}.csv"`);

    return res.send(csv);
  } catch (error: any) {
    console.error('Error exporting competitors:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to export competitors',
    });
  }
});

/**
 * POST /api/exports/keyword-list/:listId
 * Export keyword list to CSV
 */
router.post('/keyword-list/:listId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { listId } = req.params;

    const options: ExportOptions = {
      filters: req.body.filters || {},
      columns: req.body.columns,
      limit: req.body.limit,
    };

    const csv = await exportKeywordList(userId, listId, options);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="keyword_list_${listId}.csv"`);

    return res.send(csv);
  } catch (error: any) {
    console.error('Error exporting keyword list:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to export keyword list',
    });
  }
});

/**
 * POST /api/exports/alert-history
 * Export alert history to CSV
 */
router.post('/alert-history', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.body;

    const options: ExportOptions = {
      columns: req.body.columns,
      dateRange: req.body.dateRange
        ? {
            start: new Date(req.body.dateRange.start),
            end: new Date(req.body.dateRange.end),
          }
        : undefined,
      limit: req.body.limit,
    };

    const csv = await exportAlertHistory(userId, projectId, options);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="alert_history.csv"');

    return res.send(csv);
  } catch (error: any) {
    console.error('Error exporting alert history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to export alert history',
    });
  }
});

/**
 * POST /api/exports/projects
 * Export all projects to CSV
 */
router.post('/projects', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const options: ExportOptions = {
      columns: req.body.columns,
    };

    const csv = await exportProjects(userId, options);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="projects.csv"');

    return res.send(csv);
  } catch (error: any) {
    console.error('Error exporting projects:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to export projects',
    });
  }
});

/**
 * POST /api/exports/generic
 * Generic export endpoint that routes to specific exporters
 */
router.post('/generic', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { exportType, entityId, options } = req.body;

    if (!exportType || !entityId) {
      return res.status(400).json({
        success: false,
        error: 'exportType and entityId are required',
      });
    }

    const csv = await exportData(exportType as ExportType, userId, entityId, options || {});

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${exportType}_${entityId}.csv"`);

    return res.send(csv);
  } catch (error: any) {
    console.error('Error performing generic export:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform export',
    });
  }
});

export default router;
