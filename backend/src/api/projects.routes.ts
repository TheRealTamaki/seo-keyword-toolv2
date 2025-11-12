import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { verifyProjectOwnership } from '../middleware/project.middleware';
import {
  createProjectValidation,
  updateProjectValidation,
  handleValidationErrors,
} from '../middleware/validation.middleware';
import * as ProjectModel from '../models/project.model';
import { sanitizeProjectInput } from '../services/validation.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const result = await ProjectModel.getProjectsByUserId(userId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve projects',
    });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post(
  '/',
  createProjectValidation,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Sanitize input (normalizes domain, trims strings)
      const sanitized = sanitizeProjectInput(req.body);

      // Check if domain already exists for this user
      const existingProject = await ProjectModel.findProjectByDomain(
        userId,
        sanitized.domain
      );

      if (existingProject) {
        res.status(409).json({
          success: false,
          error: 'A project with this domain already exists',
          data: {
            existingProject: {
              id: existingProject.id,
              name: existingProject.name,
              domain: existingProject.domain,
            },
          },
        });
        return;
      }

      const project = await ProjectModel.createProject(userId, sanitized);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project',
      });
    }
  }
);

/**
 * GET /api/projects/:id
 * Get a specific project by ID
 */
router.get(
  '/:id',
  verifyProjectOwnership,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Project is already loaded by verifyProjectOwnership middleware
      const project = req.project;

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve project',
      });
    }
  }
);

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put(
  '/:id',
  verifyProjectOwnership,
  updateProjectValidation,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      const projectId = req.projectId;

      if (!userId || !projectId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Check if updating domain to one that already exists
      if (req.body.domain) {
        const sanitized = sanitizeProjectInput({
          name: req.body.name || '',
          domain: req.body.domain,
          description: req.body.description,
        });

        const existingProject = await ProjectModel.findProjectByDomain(
          userId,
          sanitized.domain
        );

        if (existingProject && existingProject.id !== projectId) {
          res.status(409).json({
            success: false,
            error: 'A project with this domain already exists',
          });
          return;
        }

        req.body.domain = sanitized.domain;
      }

      const updatedProject = await ProjectModel.updateProject(
        projectId,
        userId,
        req.body
      );

      res.status(200).json({
        success: true,
        data: updatedProject,
        message: 'Project updated successfully',
      });
    } catch (error) {
      console.error('Update project error:', error);

      if (error instanceof Error && error.message === 'No fields to update') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update project',
      });
    }
  }
);

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete(
  '/:id',
  verifyProjectOwnership,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      const projectId = req.projectId;

      if (!userId || !projectId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      await ProjectModel.deleteProject(projectId, userId);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete project',
      });
    }
  }
);

/**
 * GET /api/projects/:id/stats
 * Get project statistics (keyword count, competitor count, etc.)
 */
router.get(
  '/:id/stats',
  verifyProjectOwnership,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      const projectId = req.projectId;

      if (!userId || !projectId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Get project with stats
      const result = await ProjectModel.getProjectsByUserId(userId, 1, 100);
      const project = result.projects.find(p => p.id === projectId);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          projectId: project.id,
          keywordCount: project.keyword_count || 0,
          competitorCount: project.competitor_count || 0,
        },
      });
    } catch (error) {
      console.error('Get project stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve project statistics',
      });
    }
  }
);

module.exports = router;
