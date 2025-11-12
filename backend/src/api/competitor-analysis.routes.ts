import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireApiKey } from '../middleware/api-key.middleware';
import { projectExists } from '../models/project.model';
import { getDecryptedApiKey } from '../models/api-key.model';
import {
  analyzeKeywordGap,
  calculateVisibilityScores,
  identifyQuickWins,
  discoverCompetitorKeywords,
  generateCompetitorOpportunities,
  analyzeKeywordOverlap,
} from '../services/competitor-analysis.service';

const router = Router();

// All competitor analysis routes require authentication
router.use(authenticate);

/**
 * GET /api/competitor-analysis/keyword-gap/:projectId
 * Analyze keyword gaps between project and competitors
 */
router.get('/keyword-gap/:projectId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.params;
    const { competitorIds } = req.query;

    // Verify project ownership
    const projectBelongsToUser = await projectExists(projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Parse competitor IDs if provided
    const competitorIdsArray = competitorIds
      ? (competitorIds as string).split(',')
      : undefined;

    const gaps = await analyzeKeywordGap(projectId, competitorIdsArray);

    // Group by gap type for easier consumption
    const missing = gaps.filter((g) => g.gapType === 'missing');
    const losing = gaps.filter((g) => g.gapType === 'losing');
    const winning = gaps.filter((g) => g.gapType === 'winning');

    return res.json({
      success: true,
      data: {
        all: gaps,
        byType: {
          missing,
          losing,
          winning,
        },
        summary: {
          total: gaps.length,
          missingCount: missing.length,
          losingCount: losing.length,
          winningCount: winning.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error analyzing keyword gap:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze keyword gap',
    });
  }
});

/**
 * GET /api/competitor-analysis/visibility/:projectId
 * Calculate visibility scores for project and competitors
 */
router.get('/visibility/:projectId', async (req: Request, res: Response) => {
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

    const scores = await calculateVisibilityScores(projectId);

    // Separate project from competitors
    const projectScore = scores[0]; // First one is usually the project
    const competitorScores = scores.slice(1);

    return res.json({
      success: true,
      data: {
        project: projectScore,
        competitors: competitorScores,
        comparison: {
          totalDomains: scores.length,
          highestVisibility: Math.max(...scores.map((s) => s.visibilityScore)),
          lowestVisibility: Math.min(...scores.map((s) => s.visibilityScore)),
          avgVisibility: Math.round(
            scores.reduce((sum, s) => sum + s.visibilityScore, 0) / scores.length
          ),
        },
      },
    });
  } catch (error: any) {
    console.error('Error calculating visibility scores:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate visibility scores',
    });
  }
});

/**
 * GET /api/competitor-analysis/quick-wins/:projectId
 * Identify quick win opportunities
 */
router.get('/quick-wins/:projectId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.params;
    const {
      maxProjectRank,
      minSearchVolume,
      maxDifficulty,
    } = req.query;

    // Verify project ownership
    const projectBelongsToUser = await projectExists(projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const options = {
      maxProjectRank: maxProjectRank ? parseInt(maxProjectRank as string) : undefined,
      minSearchVolume: minSearchVolume ? parseInt(minSearchVolume as string) : undefined,
      maxDifficulty: maxDifficulty ? parseInt(maxDifficulty as string) : undefined,
    };

    const quickWins = await identifyQuickWins(projectId, options);

    // Calculate summary stats
    const totalTrafficPotential = quickWins.reduce(
      (sum, win) => sum + win.potentialTrafficGain,
      0
    );

    return res.json({
      success: true,
      data: {
        opportunities: quickWins,
        summary: {
          total: quickWins.length,
          totalTrafficPotential: Math.round(totalTrafficPotential),
          avgWinScore: Math.round(
            quickWins.reduce((sum, w) => sum + w.winScore, 0) / (quickWins.length || 1)
          ),
          highImpact: quickWins.filter((w) => w.searchVolume > 1000).length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error identifying quick wins:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to identify quick wins',
    });
  }
});

/**
 * GET /api/competitor-analysis/discover-keywords
 * Discover keywords from a competitor domain
 */
router.get('/discover-keywords', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { domain, locationCode, languageCode, limit } = req.query;

    // Validation
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'domain query parameter is required',
      });
    }

    // Get user's API key
    const apiKey = await getDecryptedApiKey(userId);
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'No API key found. Please add a DataForSEO API key first.',
      });
    }

    const keywords = await discoverCompetitorKeywords(apiKey, domain, {
      locationCode: locationCode ? parseInt(locationCode as string) : undefined,
      languageCode: languageCode as string,
      limit: limit ? parseInt(limit as string) : 100,
    });

    return res.json({
      success: true,
      data: {
        domain,
        keywords,
        count: keywords.length,
        summary: {
          avgSearchVolume: Math.round(
            keywords.reduce((sum, k) => sum + k.searchVolume, 0) / (keywords.length || 1)
          ),
          avgDifficulty: Math.round(
            keywords.reduce((sum, k) => sum + k.difficulty, 0) / (keywords.length || 1)
          ),
          avgOpportunityScore: Math.round(
            keywords.reduce((sum, k) => sum + k.opportunityScore, 0) / (keywords.length || 1)
          ),
        },
      },
    });
  } catch (error: any) {
    console.error('Error discovering competitor keywords:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to discover competitor keywords',
    });
  }
});

/**
 * GET /api/competitor-analysis/opportunities/:projectId
 * Get prioritized competitor opportunities (gaps + quick wins)
 */
router.get('/opportunities/:projectId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { projectId } = req.params;
    const { includeGaps, includeQuickWins, limit } = req.query;

    // Verify project ownership
    const projectBelongsToUser = await projectExists(projectId, userId);
    if (!projectBelongsToUser) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const options = {
      includeGaps: includeGaps !== 'false',
      includeQuickWins: includeQuickWins !== 'false',
      limit: limit ? parseInt(limit as string) : 50,
    };

    const opportunities = await generateCompetitorOpportunities(projectId, options);

    // Group by effort and impact
    const byEffort = {
      low: opportunities.filter((o) => o.effort === 'low'),
      medium: opportunities.filter((o) => o.effort === 'medium'),
      high: opportunities.filter((o) => o.effort === 'high'),
    };

    const byImpact = {
      low: opportunities.filter((o) => o.impact === 'low'),
      medium: opportunities.filter((o) => o.impact === 'medium'),
      high: opportunities.filter((o) => o.impact === 'high'),
    };

    return res.json({
      success: true,
      data: {
        opportunities,
        groupedByEffort: byEffort,
        groupedByImpact: byImpact,
        summary: {
          total: opportunities.length,
          keywordGaps: opportunities.filter((o) => o.type === 'keyword_gap').length,
          quickWins: opportunities.filter((o) => o.type === 'quick_win').length,
          lowEffortHighImpact: opportunities.filter(
            (o) => o.effort === 'low' && o.impact === 'high'
          ).length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error generating opportunities:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate opportunities',
    });
  }
});

/**
 * GET /api/competitor-analysis/overlap/:projectId
 * Analyze keyword overlap with competitors
 */
router.get('/overlap/:projectId', async (req: Request, res: Response) => {
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

    const overlapData = await analyzeKeywordOverlap(projectId);

    return res.json({
      success: true,
      data: {
        competitors: overlapData,
        summary: {
          totalCompetitors: overlapData.length,
          avgOverlap: overlapData.length > 0
            ? Math.round(
                overlapData.reduce((sum, c) => sum + c.overlapPercentage, 0) /
                  overlapData.length
              )
            : 0,
          mostSimilar: overlapData.length > 0
            ? overlapData.reduce((max, c) =>
                c.overlapPercentage > max.overlapPercentage ? c : max
              )
            : null,
        },
      },
    });
  } catch (error: any) {
    console.error('Error analyzing keyword overlap:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze keyword overlap',
    });
  }
});

export default router;
