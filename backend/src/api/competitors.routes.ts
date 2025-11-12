import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { projectExists } from '../models/project.model';
import {
  createCompetitor,
  bulkCreateCompetitors,
  getProjectCompetitors,
  getCompetitorById,
  updateCompetitor,
  deleteCompetitor,
  getCompetitorCount
} from '../models/competitor.model';

const router = Router();

// All competitor routes require authentication
router.use(authenticate);

/**
 * GET /api/competitors/project/:projectId
 * List all competitors for a project
 */
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { projectId } = req.params;

    // Check if project exists and belongs to user
    const projectBelongsToUser = await projectExists(projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const competitors = await getProjectCompetitors(projectId);

    res.json({
      success: true,
      data: competitors
    });
  } catch (error: any) {
    console.error('Error fetching competitors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitors'
    });
  }
});

/**
 * GET /api/competitors/:id
 * Get a single competitor by ID
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

    const competitor = await getCompetitorById(id);
    if (!competitor) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found'
      });
    }

    // Verify the competitor's project belongs to the user
    const projectBelongsToUser = await projectExists(competitor.projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found'
      });
    }

    res.json({
      success: true,
      data: competitor
    });
  } catch (error: any) {
    console.error('Error fetching competitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitor'
    });
  }
});

/**
 * POST /api/competitors
 * Add a single competitor or multiple competitors to a project
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

    const { projectId, domain, name, competitors } = req.body;

    // Validation
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // Check if project exists and belongs to user
    const projectBelongsToUser = await projectExists(projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Handle bulk creation
    if (competitors && Array.isArray(competitors)) {
      if (competitors.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Competitors array cannot be empty'
        });
      }

      if (competitors.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Cannot add more than 20 competitors at once'
        });
      }

      // Check if this would exceed the 10 competitor limit
      const currentCount = await getCompetitorCount(projectId);
      if (currentCount + competitors.length > 10) {
        return res.status(400).json({
          success: false,
          error: `Cannot exceed 10 competitors per project. Current: ${currentCount}, attempting to add: ${competitors.length}`
        });
      }

      const result = await bulkCreateCompetitors(projectId, competitors);

      return res.status(201).json({
        success: true,
        data: result,
        message: `Created ${result.created.length} competitors. ${result.errors.length} errors.`
      });
    }

    // Handle single competitor creation
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain or competitors array is required'
      });
    }

    if (domain.length < 1 || domain.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Domain must be between 1 and 255 characters'
      });
    }

    // Check if this would exceed the 10 competitor limit
    const currentCount = await getCompetitorCount(projectId);
    if (currentCount >= 10) {
      return res.status(400).json({
        success: false,
        error: 'Cannot exceed 10 competitors per project'
      });
    }

    const newCompetitor = await createCompetitor({
      projectId,
      domain,
      name
    });

    res.status(201).json({
      success: true,
      data: newCompetitor
    });
  } catch (error: any) {
    console.error('Error creating competitor:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create competitor'
    });
  }
});

/**
 * PUT /api/competitors/:id
 * Update a competitor
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
    const { domain, name } = req.body;

    // Get competitor to verify ownership
    const existingCompetitor = await getCompetitorById(id);
    if (!existingCompetitor) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found'
      });
    }

    // Verify the competitor's project belongs to the user
    const projectBelongsToUser = await projectExists(existingCompetitor.projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found'
      });
    }

    // Validation
    if (!domain && !name) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update'
      });
    }

    if (domain !== undefined && (domain.length < 1 || domain.length > 255)) {
      return res.status(400).json({
        success: false,
        error: 'Domain must be between 1 and 255 characters'
      });
    }

    const updates: any = {};
    if (domain !== undefined) updates.domain = domain;
    if (name !== undefined) updates.name = name;

    const updatedCompetitor = await updateCompetitor(id, updates);

    res.json({
      success: true,
      data: updatedCompetitor
    });
  } catch (error: any) {
    console.error('Error updating competitor:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update competitor'
    });
  }
});

/**
 * DELETE /api/competitors/:id
 * Delete a competitor
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

    // Get competitor to verify ownership
    const existingCompetitor = await getCompetitorById(id);
    if (!existingCompetitor) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found'
      });
    }

    // Verify the competitor's project belongs to the user
    const projectBelongsToUser = await projectExists(existingCompetitor.projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found'
      });
    }

    const deleted = await deleteCompetitor(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found'
      });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting competitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete competitor'
    });
  }
});

export default router;
