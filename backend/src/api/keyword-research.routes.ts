import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireApiKey } from '../middleware/api-key.middleware';
import { getDecryptedApiKey } from '../models/api-key.model';
import {
  getKeywordSuggestions,
  getKeywordIdeasFromDomain,
  getAutocompleteSuggestions,
  getRelatedKeywords,
} from '../services/dataforseo.service';
import {
  enrichKeywordIdeas,
  filterKeywords,
  sortKeywords,
  getKeywordInsights,
  discoverKeywords,
  EnrichedKeywordIdea,
} from '../services/keyword-research.service';

const router = Router();

// All keyword research routes require authentication
router.use(authenticate);

/**
 * POST /api/keyword-research/discover
 * Discover keywords from multiple sources
 */
router.post('/discover', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const {
      seedKeywords,
      domain,
      includeAutocomplete = false,
      includeRelated = false,
      locationCode,
      languageCode,
      limit,
    } = req.body;

    // Validation
    if (!seedKeywords && !domain) {
      return res.status(400).json({
        success: false,
        error: 'Either seedKeywords or domain is required',
      });
    }

    if (seedKeywords && !Array.isArray(seedKeywords)) {
      return res.status(400).json({
        success: false,
        error: 'seedKeywords must be an array',
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

    // Discover keywords
    const keywords = await discoverKeywords(apiKey, {
      seedKeywords,
      domain,
      includeAutocomplete,
      includeRelated,
      locationCode,
      languageCode,
      limit,
    });

    // Get insights
    const insights = getKeywordInsights(keywords);

    return res.json({
      success: true,
      data: {
        keywords,
        insights,
        count: keywords.length,
      },
    });
  } catch (error: any) {
    console.error('Error discovering keywords:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to discover keywords',
    });
  }
});

/**
 * POST /api/keyword-research/analyze
 * Analyze and enrich a list of keywords
 */
router.post('/analyze', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { keywords, locationCode, languageCode, scoringOptions } = req.body;

    // Validation
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'keywords array is required',
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

    // Get keyword suggestions with metrics
    const suggestions = await getKeywordSuggestions(apiKey, {
      keywords,
      locationCode,
      languageCode,
      limit: keywords.length,
    });

    // Flatten suggestions
    const allKeywordIdeas = suggestions.flatMap((s) => s.suggestions);

    // Enrich with intent, questions, and scores
    const enrichedKeywords = enrichKeywordIdeas(allKeywordIdeas, scoringOptions);

    // Get insights
    const insights = getKeywordInsights(enrichedKeywords);

    return res.json({
      success: true,
      data: {
        keywords: enrichedKeywords,
        insights,
        count: enrichedKeywords.length,
      },
    });
  } catch (error: any) {
    console.error('Error analyzing keywords:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze keywords',
    });
  }
});

/**
 * GET /api/keyword-research/autocomplete
 * Get autocomplete suggestions for a keyword
 */
router.get('/autocomplete', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { keyword, locationCode, languageCode } = req.query;

    // Validation
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'keyword query parameter is required',
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

    // Get autocomplete suggestions
    const suggestions = await getAutocompleteSuggestions(apiKey, keyword, {
      locationCode: locationCode ? parseInt(locationCode as string) : undefined,
      languageCode: languageCode as string,
    });

    return res.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting autocomplete suggestions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get autocomplete suggestions',
    });
  }
});

/**
 * GET /api/keyword-research/related
 * Get related keywords for a seed keyword
 */
router.get('/related', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { keyword, locationCode, languageCode, limit } = req.query;

    // Validation
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'keyword query parameter is required',
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

    // Get related keywords
    const relatedKeywords = await getRelatedKeywords(apiKey, keyword, {
      locationCode: locationCode ? parseInt(locationCode as string) : undefined,
      languageCode: languageCode as string,
      limit: limit ? parseInt(limit as string) : 100,
    });

    // Enrich keywords
    const enrichedKeywords = enrichKeywordIdeas(relatedKeywords);

    // Get insights
    const insights = getKeywordInsights(enrichedKeywords);

    return res.json({
      success: true,
      data: {
        keywords: enrichedKeywords,
        insights,
        count: enrichedKeywords.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting related keywords:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get related keywords',
    });
  }
});

/**
 * POST /api/keyword-research/filter
 * Filter and sort enriched keywords
 */
router.post('/filter', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { keywords, filters, sortBy, sortOrder } = req.body;

    // Validation
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'keywords array is required',
      });
    }

    // Validate keywords have required EnrichedKeywordIdea properties
    const validKeywords = keywords.every(
      (k) =>
        k.keyword &&
        typeof k.searchVolume === 'number' &&
        typeof k.difficulty === 'number' &&
        typeof k.cpc === 'number' &&
        k.intent &&
        typeof k.isQuestion === 'boolean' &&
        typeof k.opportunityScore === 'number' &&
        typeof k.wordCount === 'number'
    );

    if (!validKeywords) {
      return res.status(400).json({
        success: false,
        error: 'Invalid keyword format. Keywords must be enriched first.',
      });
    }

    // Apply filters
    let filteredKeywords: EnrichedKeywordIdea[] = keywords;
    if (filters) {
      filteredKeywords = filterKeywords(keywords, filters);
    }

    // Apply sorting
    if (sortBy) {
      filteredKeywords = sortKeywords(
        filteredKeywords,
        sortBy,
        sortOrder || 'desc'
      );
    }

    // Get insights
    const insights = getKeywordInsights(filteredKeywords);

    return res.json({
      success: true,
      data: {
        keywords: filteredKeywords,
        insights,
        count: filteredKeywords.length,
      },
    });
  } catch (error: any) {
    console.error('Error filtering keywords:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to filter keywords',
    });
  }
});

/**
 * POST /api/keyword-research/insights
 * Get statistical insights for a list of keywords
 */
router.post('/insights', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { keywords } = req.body;

    // Validation
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'keywords array is required',
      });
    }

    // Validate keywords have required EnrichedKeywordIdea properties
    const validKeywords = keywords.every(
      (k) =>
        k.keyword &&
        typeof k.searchVolume === 'number' &&
        typeof k.difficulty === 'number' &&
        typeof k.cpc === 'number' &&
        k.intent &&
        typeof k.isQuestion === 'boolean' &&
        typeof k.opportunityScore === 'number' &&
        typeof k.wordCount === 'number'
    );

    if (!validKeywords) {
      return res.status(400).json({
        success: false,
        error: 'Invalid keyword format. Keywords must be enriched first.',
      });
    }

    // Get insights
    const insights = getKeywordInsights(keywords);

    return res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    console.error('Error getting keyword insights:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get keyword insights',
    });
  }
});

/**
 * GET /api/keyword-research/domain
 * Get keywords for a competitor domain
 */
router.get('/domain', requireApiKey, async (req: Request, res: Response) => {
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

    // Get keywords from domain
    const domainKeywords = await getKeywordIdeasFromDomain(apiKey, domain, {
      locationCode: locationCode ? parseInt(locationCode as string) : undefined,
      languageCode: languageCode as string,
      limit: limit ? parseInt(limit as string) : 100,
    });

    // Enrich keywords
    const enrichedKeywords = enrichKeywordIdeas(domainKeywords);

    // Get insights
    const insights = getKeywordInsights(enrichedKeywords);

    return res.json({
      success: true,
      data: {
        keywords: enrichedKeywords,
        insights,
        count: enrichedKeywords.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting domain keywords:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get domain keywords',
    });
  }
});

export default router;
