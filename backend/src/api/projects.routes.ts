import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats
} from '../models/project.model';

const router = Router();

// All project routes require authentication
router.use(authenticate);

/**
 * GET /api/projects
 * List all projects for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const result = await getUserProjects(userId, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { name, domain, description } = req.body;

    // Validation
    if (!name || !domain) {
      return res.status(400).json({
        success: false,
        error: 'Name and domain are required'
      });
    }

    if (name.length < 1 || name.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Name must be between 1 and 255 characters'
      });
    }

    if (domain.length < 1 || domain.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Domain must be between 1 and 255 characters'
      });
    }

    // Clean domain (remove protocol and trailing slashes)
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .toLowerCase();

    const project = await createProject({
      userId,
      name,
      domain: cleanDomain,
      description
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error: any) {
    console.error('Error creating project:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

/**
 * GET /api/projects/:id
 * Get a single project by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { id } = req.params;

    const project = await getProjectById(id, userId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

/**
 * GET /api/projects/:id/stats
 * Get project statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { id } = req.params;

    const stats = await getProjectStats(id, userId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project statistics'
    });
  }
});

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const { name, domain, description } = req.body;

    // Validation
    if (!name && !domain && description === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update'
      });
    }

    const updates: any = {};

    if (name !== undefined) {
      if (name.length < 1 || name.length > 255) {
        return res.status(400).json({
          success: false,
          error: 'Name must be between 1 and 255 characters'
        });
      }
      updates.name = name;
    }

    if (domain !== undefined) {
      if (domain.length < 1 || domain.length > 255) {
        return res.status(400).json({
          success: false,
          error: 'Domain must be between 1 and 255 characters'
        });
      }
      // Clean domain
      updates.domain = domain
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .toLowerCase();
    }

    if (description !== undefined) {
      updates.description = description;
    }

    const project = await updateProject(id, userId, updates);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error: any) {
    console.error('Error updating project:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project (cascades to all related data)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { id } = req.params;

    const deleted = await deleteProject(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

export default router;
