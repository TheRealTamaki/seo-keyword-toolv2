import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireApiKey } from '../middleware/api-key.middleware';
import { projectExists } from '../models/project.model';
import {
  scheduleRankCheck,
  queueRankCheck,
  cancelScheduledRankCheck,
  getScheduledRankCheck,
  updateRankCheckSchedule,
  getJobStatus,
  listScheduledJobs,
  ScheduleConfig,
} from '../services/schedule.service';
import { getQueueStats, cleanOldJobs } from '../config/queue';

const router = Router();

// All job routes require authentication
router.use(authenticate);

/**
 * POST /api/jobs/rank-check/schedule
 * Schedule recurring rank checks for a project
 */
router.post('/rank-check/schedule', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId, searchEngines, devices, locations, schedule } = req.body;

    // Validation
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId is required',
      });
    }

    if (!schedule) {
      return res.status(400).json({
        success: false,
        error: 'schedule (cron expression) is required',
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

    const config: ScheduleConfig = {
      projectId,
      userId,
      searchEngines: searchEngines || ['google'],
      devices: devices || ['desktop'],
      locations: locations || ['United States'],
      schedule,
    };

    const job = await scheduleRankCheck(config);

    res.status(201).json({
      success: true,
      data: {
        jobId: job.id,
        projectId,
        schedule,
        status: 'scheduled',
      },
    });
  } catch (error: any) {
    console.error('Error scheduling rank check:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to schedule rank check',
    });
  }
});

/**
 * POST /api/jobs/rank-check/queue
 * Queue an immediate one-time rank check
 */
router.post('/rank-check/queue', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { keywordIds, searchEngines, devices, locations, projectId } = req.body;

    // Validation
    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'keywordIds array is required',
      });
    }

    // Verify project ownership if projectId is provided
    if (projectId) {
      const projectBelongsToUser = await projectExists(projectId, userId);
      if (!projectBelongsToUser) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }
    }

    const job = await queueRankCheck(userId, keywordIds, {
      searchEngines: searchEngines || ['google'],
      devices: devices || ['desktop'],
      locations: locations || ['United States'],
      projectId,
    });

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: 'queued',
        keywordCount: keywordIds.length,
      },
    });
  } catch (error: any) {
    console.error('Error queuing rank check:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to queue rank check',
    });
  }
});

/**
 * GET /api/jobs/rank-check/schedule/:projectId
 * Get scheduled rank check for a project
 */
router.get('/rank-check/schedule/:projectId', async (req: Request, res: Response) => {
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

    const job = await getScheduledRankCheck(projectId);

    if (!job) {
      return res.json({
        success: true,
        data: null,
        message: 'No scheduled rank check found for this project',
      });
    }

    const repeatOptions = job.opts.repeat as any;

    res.json({
      success: true,
      data: {
        jobId: job.id,
        projectId,
        schedule: repeatOptions?.cron || null,
        nextRun: repeatOptions?.next ? new Date(repeatOptions.next) : null,
        settings: {
          searchEngines: job.data.searchEngines,
          devices: job.data.devices,
          locations: job.data.locations,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting scheduled rank check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduled rank check',
    });
  }
});

/**
 * PUT /api/jobs/rank-check/schedule/:projectId
 * Update schedule for a project's rank checks
 */
router.put('/rank-check/schedule/:projectId', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.params;
    const { schedule } = req.body;

    if (!schedule) {
      return res.status(400).json({
        success: false,
        error: 'schedule is required',
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

    const job = await updateRankCheckSchedule(projectId, schedule);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'No existing schedule found to update',
      });
    }

    res.json({
      success: true,
      data: {
        jobId: job.id,
        projectId,
        schedule,
        status: 'updated',
      },
    });
  } catch (error: any) {
    console.error('Error updating rank check schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update schedule',
    });
  }
});

/**
 * DELETE /api/jobs/rank-check/schedule/:projectId
 * Cancel scheduled rank checks for a project
 */
router.delete('/rank-check/schedule/:projectId', async (req: Request, res: Response) => {
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

    const cancelled = await cancelScheduledRankCheck(projectId);

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'No scheduled rank check found',
      });
    }

    res.json({
      success: true,
      message: 'Scheduled rank check cancelled',
    });
  } catch (error: any) {
    console.error('Error cancelling scheduled rank check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel scheduled rank check',
    });
  }
});

/**
 * GET /api/jobs/:jobId/status
 * Get status of a specific job
 */
router.get('/:jobId/status', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { jobId } = req.params;

    const status = await getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Verify the job belongs to the user
    if (status.data.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
    });
  }
});

/**
 * GET /api/jobs/scheduled
 * List all scheduled jobs for the user
 */
router.get('/scheduled', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const jobs = await listScheduledJobs();

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error: any) {
    console.error('Error listing scheduled jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list scheduled jobs',
    });
  }
});

/**
 * GET /api/jobs/stats
 * Get queue statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const stats = await getQueueStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue stats',
    });
  }
});

export default router;
