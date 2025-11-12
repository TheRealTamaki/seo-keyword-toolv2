import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createKeywordList,
  getKeywordListById,
  getUserKeywordLists,
  updateKeywordList,
  deleteKeywordList,
  addKeywordsToList,
  getKeywordListItems,
  updateKeywordListItem,
  deleteKeywordListItem,
  deleteKeywordListItems,
  exportKeywordListAsCSV,
} from '../models/keyword-list.model';
import { projectExists } from '../models/project.model';

const router = Router();

// All keyword list routes require authentication
router.use(authenticate);

/**
 * POST /api/keyword-lists
 * Create a new keyword list
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

    const { name, description, projectId } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'name is required',
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

    const list = await createKeywordList({
      userId,
      projectId,
      name: name.trim(),
      description: description?.trim(),
    });

    return res.status(201).json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    console.error('Error creating keyword list:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create keyword list',
    });
  }
});

/**
 * GET /api/keyword-lists
 * Get all keyword lists for the authenticated user
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

    // Verify project ownership if projectId is provided
    if (projectId) {
      const projectBelongsToUser = await projectExists(projectId as string, userId);
      if (!projectBelongsToUser) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }
    }

    const lists = await getUserKeywordLists(userId, projectId as string | undefined);

    return res.json({
      success: true,
      data: lists,
      count: lists.length,
    });
  } catch (error: any) {
    console.error('Error getting keyword lists:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get keyword lists',
    });
  }
});

/**
 * GET /api/keyword-lists/:id
 * Get a specific keyword list
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

    const list = await getKeywordListById(id, userId);

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'Keyword list not found',
      });
    }

    return res.json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    console.error('Error getting keyword list:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get keyword list',
    });
  }
});

/**
 * PUT /api/keyword-lists/:id
 * Update a keyword list
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
    const { name, description, projectId } = req.body;

    // Verify list ownership
    const existingList = await getKeywordListById(id, userId);
    if (!existingList) {
      return res.status(404).json({
        success: false,
        error: 'Keyword list not found',
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

    const updatedList = await updateKeywordList(id, userId, {
      name: name?.trim(),
      description: description?.trim(),
      projectId,
    });

    return res.json({
      success: true,
      data: updatedList,
    });
  } catch (error: any) {
    console.error('Error updating keyword list:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update keyword list',
    });
  }
});

/**
 * DELETE /api/keyword-lists/:id
 * Delete a keyword list
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

    // Verify list ownership
    const existingList = await getKeywordListById(id, userId);
    if (!existingList) {
      return res.status(404).json({
        success: false,
        error: 'Keyword list not found',
      });
    }

    const deleted = await deleteKeywordList(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Keyword list not found',
      });
    }

    return res.json({
      success: true,
      message: 'Keyword list deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting keyword list:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete keyword list',
    });
  }
});

/**
 * POST /api/keyword-lists/:id/keywords
 * Add keywords to a list
 */
router.post('/:id/keywords', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const { keywords } = req.body;

    // Validation
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'keywords array is required',
      });
    }

    // Verify list ownership
    const list = await getKeywordListById(id, userId);
    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'Keyword list not found',
      });
    }

    const addedKeywords = await addKeywordsToList(id, keywords);

    return res.status(201).json({
      success: true,
      data: addedKeywords,
      count: addedKeywords.length,
    });
  } catch (error: any) {
    console.error('Error adding keywords to list:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to add keywords to list',
    });
  }
});

/**
 * GET /api/keyword-lists/:id/keywords
 * Get keywords from a list with filtering and pagination
 */
router.get('/:id/keywords', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const {
      minSearchVolume,
      maxSearchVolume,
      minDifficulty,
      maxDifficulty,
      intent,
      questionsOnly,
      searchTerm,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    // Verify list ownership
    const list = await getKeywordListById(id, userId);
    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'Keyword list not found',
      });
    }

    const filters = {
      minSearchVolume: minSearchVolume ? parseInt(minSearchVolume as string) : undefined,
      maxSearchVolume: maxSearchVolume ? parseInt(maxSearchVolume as string) : undefined,
      minDifficulty: minDifficulty ? parseInt(minDifficulty as string) : undefined,
      maxDifficulty: maxDifficulty ? parseInt(maxDifficulty as string) : undefined,
      intent: intent as string | undefined,
      questionsOnly: questionsOnly === 'true',
      searchTerm: searchTerm as string | undefined,
    };

    const result = await getKeywordListItems(
      id,
      filters,
      (sortBy as string) || 'opportunity_score',
      (sortOrder as 'ASC' | 'DESC') || 'DESC',
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50
    );

    return res.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error getting keywords from list:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get keywords from list',
    });
  }
});

/**
 * PATCH /api/keyword-lists/:id/keywords/:itemId
 * Update a keyword item
 */
router.patch('/:id/keywords/:itemId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id, itemId } = req.params;
    const { notes, searchVolume, difficulty, opportunityScore } = req.body;

    // Verify list ownership
    const list = await getKeywordListById(id, userId);
    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'Keyword list not found',
      });
    }

    const updatedItem = await updateKeywordListItem(itemId, {
      notes,
      searchVolume,
      difficulty,
      opportunityScore,
    });

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found',
      });
    }

    return res.json({
      success: true,
      data: updatedItem,
    });
  } catch (error: any) {
    console.error('Error updating keyword:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update keyword',
    });
  }
});

/**
 * DELETE /api/keyword-lists/:id/keywords/:itemId
 * Delete a keyword from a list
 */
router.delete('/:id/keywords/:itemId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id, itemId } = req.params;

    // Verify list ownership
    const list = await getKeywordListById(id, userId);
    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'Keyword list not found',
      });
    }

    const deleted = await deleteKeywordListItem(itemId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found',
      });
    }

    return res.json({
      success: true,
      message: 'Keyword deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting keyword:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete keyword',
    });
  }
});

/**
 * POST /api/keyword-lists/:id/keywords/bulk-delete
 * Delete multiple keywords from a list
 */
router.post('/:id/keywords/bulk-delete', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const { itemIds } = req.body;

    // Validation
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'itemIds array is required',
      });
    }

    // Verify list ownership
    const list = await getKeywordListById(id, userId);
    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'Keyword list not found',
      });
    }

    const deletedCount = await deleteKeywordListItems(itemIds);

    return res.json({
      success: true,
      message: `${deletedCount} keyword(s) deleted successfully`,
      deletedCount,
    });
  } catch (error: any) {
    console.error('Error bulk deleting keywords:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete keywords',
    });
  }
});

/**
 * GET /api/keyword-lists/:id/export
 * Export keyword list as CSV
 */
router.get('/:id/export', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { id } = req.params;

    // Verify list ownership
    const list = await getKeywordListById(id, userId);
    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'Keyword list not found',
      });
    }

    const csv = await exportKeywordListAsCSV(id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${list.name}-keywords.csv"`);
    return res.send(csv);
  } catch (error: any) {
    console.error('Error exporting keyword list:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export keyword list',
    });
  }
});

export default router;
