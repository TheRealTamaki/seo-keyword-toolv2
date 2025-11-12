import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { projectExists } from '../models/project.model';
import {
  createKeyword,
  bulkCreateKeywords,
  getProjectKeywords,
  getKeywordById,
  updateKeyword,
  deleteKeyword,
  getKeywordWithLatestRank,
  getUntrackedKeywords,
  KeywordFilters
} from '../models/keyword.model';

const router = Router();

// All keyword routes require authentication
router.use(authenticate);

/**
 * GET /api/keywords/project/:projectId
 * List all keywords for a project with filtering and pagination
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

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const order = ((req.query.order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';

    // Build filters
    const filters: KeywordFilters = {};
    if (req.query.searchVolumeMin) filters.searchVolumeMin = parseInt(req.query.searchVolumeMin as string);
    if (req.query.searchVolumeMax) filters.searchVolumeMax = parseInt(req.query.searchVolumeMax as string);
    if (req.query.difficultyMin) filters.difficultyMin = parseInt(req.query.difficultyMin as string);
    if (req.query.difficultyMax) filters.difficultyMax = parseInt(req.query.difficultyMax as string);
    if (req.query.cpcMin) filters.cpcMin = parseFloat(req.query.cpcMin as string);
    if (req.query.cpcMax) filters.cpcMax = parseFloat(req.query.cpcMax as string);
    if (req.query.intent) filters.intent = req.query.intent as string;
    if (req.query.search) filters.search = req.query.search as string;

    const result = await getProjectKeywords(projectId, filters, page, limit, sortBy, order);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching keywords:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch keywords'
    });
  }
});

/**
 * GET /api/keywords/:id
 * Get a single keyword with latest ranking data
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
    const includeRankings = req.query.includeRankings === 'true';

    let keyword;
    if (includeRankings) {
      keyword = await getKeywordWithLatestRank(id);
    } else {
      keyword = await getKeywordById(id);
    }

    if (!keyword) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    // Verify the keyword's project belongs to the user
    const projectBelongsToUser = await projectExists(keyword.projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    res.json({
      success: true,
      data: keyword
    });
  } catch (error: any) {
    console.error('Error fetching keyword:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch keyword'
    });
  }
});

/**
 * GET /api/keywords/project/:projectId/untracked
 * Get keywords that have never been checked for rankings
 */
router.get('/project/:projectId/untracked', async (req: Request, res: Response) => {
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

    const keywords = await getUntrackedKeywords(projectId);

    res.json({
      success: true,
      data: keywords
    });
  } catch (error: any) {
    console.error('Error fetching untracked keywords:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch untracked keywords'
    });
  }
});

/**
 * POST /api/keywords
 * Add a single keyword or multiple keywords to a project
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

    const { projectId, keyword, keywords, searchVolume, difficulty, cpc, intent } = req.body;

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
    if (keywords && Array.isArray(keywords)) {
      if (keywords.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Keywords array cannot be empty'
        });
      }

      if (keywords.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Cannot add more than 100 keywords at once'
        });
      }

      const result = await bulkCreateKeywords(projectId, keywords);

      return res.status(201).json({
        success: true,
        data: result,
        message: `Created ${result.created.length} keywords. ${result.errors.length} errors.`
      });
    }

    // Handle single keyword creation
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword or keywords array is required'
      });
    }

    if (keyword.length < 1 || keyword.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Keyword must be between 1 and 500 characters'
      });
    }

    // Validate numeric fields
    if (difficulty !== undefined && (difficulty < 0 || difficulty > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Difficulty must be between 0 and 100'
      });
    }

    if (cpc !== undefined && cpc < 0) {
      return res.status(400).json({
        success: false,
        error: 'CPC must be a positive number'
      });
    }

    if (searchVolume !== undefined && searchVolume < 0) {
      return res.status(400).json({
        success: false,
        error: 'Search volume must be a positive number'
      });
    }

    // Validate intent
    const validIntents = ['informational', 'commercial', 'transactional', 'navigational'];
    if (intent !== undefined && !validIntents.includes(intent)) {
      return res.status(400).json({
        success: false,
        error: `Intent must be one of: ${validIntents.join(', ')}`
      });
    }

    const newKeyword = await createKeyword({
      projectId,
      keyword,
      searchVolume,
      difficulty,
      cpc,
      intent
    });

    res.status(201).json({
      success: true,
      data: newKeyword
    });
  } catch (error: any) {
    console.error('Error creating keyword:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create keyword'
    });
  }
});

/**
 * PUT /api/keywords/:id
 * Update keyword metrics
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
    const { searchVolume, difficulty, cpc, intent } = req.body;

    // Get keyword to verify ownership
    const existingKeyword = await getKeywordById(id);
    if (!existingKeyword) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    // Verify the keyword's project belongs to the user
    const projectBelongsToUser = await projectExists(existingKeyword.projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    // Validation
    if (difficulty !== undefined && (difficulty < 0 || difficulty > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Difficulty must be between 0 and 100'
      });
    }

    if (cpc !== undefined && cpc < 0) {
      return res.status(400).json({
        success: false,
        error: 'CPC must be a positive number'
      });
    }

    if (searchVolume !== undefined && searchVolume < 0) {
      return res.status(400).json({
        success: false,
        error: 'Search volume must be a positive number'
      });
    }

    const validIntents = ['informational', 'commercial', 'transactional', 'navigational'];
    if (intent !== undefined && !validIntents.includes(intent)) {
      return res.status(400).json({
        success: false,
        error: `Intent must be one of: ${validIntents.join(', ')}`
      });
    }

    const updates: any = {};
    if (searchVolume !== undefined) updates.searchVolume = searchVolume;
    if (difficulty !== undefined) updates.difficulty = difficulty;
    if (cpc !== undefined) updates.cpc = cpc;
    if (intent !== undefined) updates.intent = intent;

    const updatedKeyword = await updateKeyword(id, updates);

    res.json({
      success: true,
      data: updatedKeyword
    });
  } catch (error: any) {
    console.error('Error updating keyword:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update keyword'
    });
  }
});

/**
 * DELETE /api/keywords/:id
 * Delete a keyword (cascades to rankings)
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

    // Get keyword to verify ownership
    const existingKeyword = await getKeywordById(id);
    if (!existingKeyword) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    // Verify the keyword's project belongs to the user
    const projectBelongsToUser = await projectExists(existingKeyword.projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    const deleted = await deleteKeyword(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting keyword:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete keyword'
    });
  }
});

export default router;
