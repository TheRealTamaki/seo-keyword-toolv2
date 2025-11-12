import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { projectExists } from '../models/project.model';
import {
  createReportTemplate,
  getReportTemplates,
  getReportTemplateById,
  updateReportTemplate,
  deleteReportTemplate,
  createReportSchedule,
  getReportSchedules,
  getReportScheduleById,
  updateReportSchedule,
  deleteReportSchedule,
  createReportHistory,
  getReportHistory,
  ReportType,
  ReportFormat,
} from '../models/report.model';
import {
  generateHTMLReport,
  fetchReportData,
  ReportConfig,
} from '../services/report.service';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Report Templates

/**
 * POST /api/reports/templates
 * Create a new report template
 */
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId, name, description, reportType, config, format, branding } = req.body;

    // Validation
    if (!name || !reportType || !format) {
      return res.status(400).json({
        success: false,
        error: 'name, reportType, and format are required',
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

    const template = await createReportTemplate({
      userId,
      projectId,
      name,
      description,
      reportType: reportType as ReportType,
      config: config || {},
      format: format as ReportFormat,
      branding,
    });

    return res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Error creating report template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create report template',
    });
  }
});

/**
 * GET /api/reports/templates
 * Get all report templates for user
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.query;

    const templates = await getReportTemplates(userId, projectId as string);

    return res.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('Error fetching report templates:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report templates',
    });
  }
});

/**
 * GET /api/reports/templates/:id
 * Get specific report template
 */
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const template = await getReportTemplateById(id, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found',
      });
    }

    return res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Error fetching report template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report template',
    });
  }
});

/**
 * PUT /api/reports/templates/:id
 * Update report template
 */
router.put('/templates/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const template = await updateReportTemplate(id, userId, req.body);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found',
      });
    }

    return res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Error updating report template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update report template',
    });
  }
});

/**
 * DELETE /api/reports/templates/:id
 * Delete report template
 */
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const deleted = await deleteReportTemplate(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found',
      });
    }

    return res.json({
      success: true,
      message: 'Report template deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting report template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete report template',
    });
  }
});

// Report Schedules

/**
 * POST /api/reports/schedules
 * Create a new report schedule
 */
router.post('/schedules', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const {
      templateId,
      name,
      description,
      enabled,
      frequency,
      cronExpression,
      timezone,
      executionTime,
      executionDayOfWeek,
      executionDayOfMonth,
      deliveryMethod,
      deliveryConfig,
    } = req.body;

    // Validation
    if (!templateId || !name || !frequency || !deliveryConfig) {
      return res.status(400).json({
        success: false,
        error: 'templateId, name, frequency, and deliveryConfig are required',
      });
    }

    // Verify template ownership
    const template = await getReportTemplateById(templateId, userId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found',
      });
    }

    const schedule = await createReportSchedule({
      userId,
      templateId,
      name,
      description,
      enabled,
      frequency,
      cronExpression,
      timezone,
      executionTime,
      executionDayOfWeek,
      executionDayOfMonth,
      deliveryMethod,
      deliveryConfig,
    });

    return res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error('Error creating report schedule:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create report schedule',
    });
  }
});

/**
 * GET /api/reports/schedules
 * Get all report schedules for user
 */
router.get('/schedules', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const schedules = await getReportSchedules(userId);

    return res.json({
      success: true,
      data: schedules,
      count: schedules.length,
    });
  } catch (error: any) {
    console.error('Error fetching report schedules:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report schedules',
    });
  }
});

/**
 * GET /api/reports/schedules/:id
 * Get specific report schedule
 */
router.get('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const schedule = await getReportScheduleById(id, userId);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Report schedule not found',
      });
    }

    return res.json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error('Error fetching report schedule:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report schedule',
    });
  }
});

/**
 * PUT /api/reports/schedules/:id
 * Update report schedule
 */
router.put('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const schedule = await updateReportSchedule(id, userId, req.body);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Report schedule not found',
      });
    }

    return res.json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error('Error updating report schedule:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update report schedule',
    });
  }
});

/**
 * DELETE /api/reports/schedules/:id
 * Delete report schedule
 */
router.delete('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const deleted = await deleteReportSchedule(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Report schedule not found',
      });
    }

    return res.json({
      success: true,
      message: 'Report schedule deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting report schedule:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete report schedule',
    });
  }
});

// Report Generation

/**
 * POST /api/reports/generate/:projectId
 * Generate a report on-demand
 */
router.post('/generate/:projectId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.params;
    const { reportType, format, config } = req.body;

    // Validation
    if (!reportType) {
      return res.status(400).json({
        success: false,
        error: 'reportType is required',
      });
    }

    // Verify project ownership
    const projectBelongsToUser = await projectExists(projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const startTime = Date.now();

    // Fetch data for report
    const reportData = await fetchReportData(
      reportType as ReportType,
      projectId,
      config?.dateRange
    );

    // Generate HTML report
    const reportConfig: ReportConfig = {
      ...config,
      title: config?.title || `${reportType} Report`,
      subtitle: config?.subtitle || `Generated for Project ${projectId}`,
    };

    const html = await generateHTMLReport(reportType as ReportType, reportData, reportConfig);

    const generationTime = Date.now() - startTime;

    // Create report history entry
    await createReportHistory({
      userId,
      projectId,
      reportType: reportType as ReportType,
      format: format || 'pdf',
      generationTimeMs: generationTime,
      status: 'completed',
      reportData: { summary: reportData.summary },
    });

    // Return HTML (can be converted to PDF on frontend using libraries like jsPDF or html2pdf)
    if (format === 'html' || !format) {
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    return res.json({
      success: true,
      data: {
        html,
        generationTimeMs: generationTime,
      },
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate report',
    });
  }
});

/**
 * GET /api/reports/history
 * Get report generation history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId, limit } = req.query;

    const history = await getReportHistory(
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
    console.error('Error fetching report history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report history',
    });
  }
});

export default router;
