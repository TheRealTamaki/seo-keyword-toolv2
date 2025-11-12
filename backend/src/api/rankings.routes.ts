import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireApiKey } from '../middleware/api-key.middleware';
import { getKeywordById } from '../models/keyword.model';
import { projectExists } from '../models/project.model';
import { getProjectCompetitors } from '../models/competitor.model';
import {
  getKeywordRankingHistory,
  getLatestRanking,
  getRankingChanges,
  getCompetitorRankings,
  getSerpFeatures,
  getAverageRank,
  RankingFilters
} from '../models/ranking.model';
import {
  performBulkRankChecks,
  storeRankCheckResults
} from '../services/rank-check.service';

const router = Router();

// All ranking routes require authentication
router.use(authenticate);

/**
 * GET /api/rankings/keyword/:keywordId/history
 * Get ranking history for a keyword
 */
router.get('/keyword/:keywordId/history', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { keywordId } = req.params;

    // Get keyword to verify ownership
    const keyword = await getKeywordById(keywordId);
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

    // Build filters
    const filters: RankingFilters = {};
    if (req.query.searchEngine) filters.searchEngine = req.query.searchEngine as string;
    if (req.query.device) filters.device = req.query.device as string;
    if (req.query.location) filters.location = req.query.location as string;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

    const rankings = await getKeywordRankingHistory(keywordId, filters, limit);

    res.json({
      success: true,
      data: {
        keyword: keyword.keyword,
        rankings
      }
    });
  } catch (error: any) {
    console.error('Error fetching ranking history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ranking history'
    });
  }
});

/**
 * GET /api/rankings/keyword/:keywordId/latest
 * Get latest ranking for a keyword
 */
router.get('/keyword/:keywordId/latest', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { keywordId } = req.params;

    // Get keyword to verify ownership
    const keyword = await getKeywordById(keywordId);
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

    const searchEngine = (req.query.searchEngine as string) || 'google';
    const device = (req.query.device as string) || 'desktop';
    const location = (req.query.location as string) || 'United States';

    const ranking = await getLatestRanking(keywordId, searchEngine, device, location);

    if (!ranking) {
      return res.json({
        success: true,
        data: null,
        message: 'No rankings found for this keyword'
      });
    }

    res.json({
      success: true,
      data: ranking
    });
  } catch (error: any) {
    console.error('Error fetching latest ranking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest ranking'
    });
  }
});

/**
 * GET /api/rankings/keyword/:keywordId/changes
 * Get ranking changes (comparison with previous)
 */
router.get('/keyword/:keywordId/changes', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { keywordId } = req.params;

    // Get keyword to verify ownership
    const keyword = await getKeywordById(keywordId);
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

    const searchEngine = (req.query.searchEngine as string) || 'google';
    const device = (req.query.device as string) || 'desktop';
    const location = (req.query.location as string) || 'United States';

    const changes = await getRankingChanges(keywordId, searchEngine, device, location);

    res.json({
      success: true,
      data: changes
    });
  } catch (error: any) {
    console.error('Error fetching ranking changes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ranking changes'
    });
  }
});

/**
 * GET /api/rankings/keyword/:keywordId/competitors
 * Get competitor rankings for a keyword
 */
router.get('/keyword/:keywordId/competitors', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { keywordId } = req.params;

    // Get keyword to verify ownership
    const keyword = await getKeywordById(keywordId);
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

    // Get competitors for the project
    const competitors = await getProjectCompetitors(keyword.projectId);
    const competitorDomains = competitors.map((c) => c.domain);

    if (competitorDomains.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No competitors configured for this project'
      });
    }

    const searchEngine = (req.query.searchEngine as string) || 'google';
    const device = (req.query.device as string) || 'desktop';
    const location = (req.query.location as string) || 'United States';

    const rankings = await getCompetitorRankings(
      keywordId,
      competitorDomains,
      searchEngine,
      device,
      location
    );

    res.json({
      success: true,
      data: rankings
    });
  } catch (error: any) {
    console.error('Error fetching competitor rankings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitor rankings'
    });
  }
});

/**
 * GET /api/rankings/keyword/:keywordId/serp-features
 * Get SERP features for a keyword
 */
router.get('/keyword/:keywordId/serp-features', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { keywordId } = req.params;

    // Get keyword to verify ownership
    const keyword = await getKeywordById(keywordId);
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

    const searchEngine = (req.query.searchEngine as string) || 'google';
    const device = (req.query.device as string) || 'desktop';
    const location = (req.query.location as string) || 'United States';

    const serpFeatures = await getSerpFeatures(keywordId, searchEngine, device, location);

    res.json({
      success: true,
      data: serpFeatures
    });
  } catch (error: any) {
    console.error('Error fetching SERP features:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SERP features'
    });
  }
});

/**
 * GET /api/rankings/keyword/:keywordId/average
 * Get average rank over a time period
 */
router.get('/keyword/:keywordId/average', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { keywordId } = req.params;

    // Get keyword to verify ownership
    const keyword = await getKeywordById(keywordId);
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

    // Validate date range
    if (!req.query.startDate || !req.query.endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    const searchEngine = (req.query.searchEngine as string) || 'google';
    const device = (req.query.device as string) || 'desktop';
    const location = (req.query.location as string) || 'United States';

    const avgRank = await getAverageRank(
      keywordId,
      startDate,
      endDate,
      searchEngine,
      device,
      location
    );

    res.json({
      success: true,
      data: {
        averageRank: avgRank,
        startDate,
        endDate,
        searchEngine,
        device,
        location
      }
    });
  } catch (error: any) {
    console.error('Error fetching average rank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch average rank'
    });
  }
});

/**
 * POST /api/rankings/check
 * Trigger a rank check for keywords (requires DataForSEO API key)
 */
router.post('/check', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { keywordIds, searchEngines, devices, locations } = req.body;

    // Validation
    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'keywordIds array is required'
      });
    }

    if (keywordIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot check more than 100 keywords at once'
      });
    }

    // Verify all keywords belong to user's projects
    for (const keywordId of keywordIds) {
      const keyword = await getKeywordById(keywordId);
      if (!keyword) {
        return res.status(404).json({
          success: false,
          error: `Keyword ${keywordId} not found`
        });
      }

      const projectBelongsToUser = await projectExists(keyword.projectId, userId);
      if (!projectBelongsToUser) {
        return res.status(404).json({
          success: false,
          error: `Keyword ${keywordId} not found`
        });
      }
    }

    // Get the DataForSEO API key from middleware
    const apiKey = req.apiKey;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'DataForSEO API key is required'
      });
    }

    // Default values
    const engines = searchEngines || ['google'];
    const devicesArr = devices || ['desktop'];
    const locationsArr = locations || ['United States'];

    // Validate search engines
    const validEngines = ['google', 'bing', 'youtube'];
    for (const engine of engines) {
      if (!validEngines.includes(engine)) {
        return res.status(400).json({
          success: false,
          error: `Invalid search engine: ${engine}. Valid options: ${validEngines.join(', ')}`
        });
      }
    }

    // Validate devices
    const validDevices = ['desktop', 'mobile'];
    for (const device of devicesArr) {
      if (!validDevices.includes(device)) {
        return res.status(400).json({
          success: false,
          error: `Invalid device: ${device}. Valid options: ${validDevices.join(', ')}`
        });
      }
    }

    // Perform rank checks
    const bulkResult = await performBulkRankChecks(
      apiKey,
      userId,
      keywordIds,
      engines,
      devicesArr,
      locationsArr
    );

    // Store results in database
    const storedCount = await storeRankCheckResults(bulkResult.results);

    res.json({
      success: true,
      data: {
        totalChecks: bulkResult.success + bulkResult.failed,
        successfulChecks: bulkResult.success,
        failedChecks: bulkResult.failed,
        rankingsStored: storedCount,
        errors: bulkResult.errors,
        summary: {
          keywordCount: keywordIds.length,
          searchEngines: engines,
          devices: devicesArr,
          locations: locationsArr
        }
      }
    });
  } catch (error: any) {
    console.error('Error performing rank check:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform rank check'
    });
  }
});

export default router;
