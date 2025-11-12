import {
  KeywordIdea,
  getKeywordSuggestions,
  getKeywordIdeasFromDomain,
  getAutocompleteSuggestions,
  getRelatedKeywords,
  KeywordSuggestionsOptions,
} from './dataforseo.service';

export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';
export type QuestionType = 'what' | 'how' | 'why' | 'when' | 'where' | 'who' | 'which' | 'other';

export interface EnrichedKeywordIdea extends KeywordIdea {
  intent: SearchIntent;
  isQuestion: boolean;
  questionType?: QuestionType;
  opportunityScore: number;
  wordCount: number;
}

/**
 * Classify search intent based on keyword patterns
 */
export function classifyIntent(keyword: string): SearchIntent {
  const lowerKeyword = keyword.toLowerCase();

  // Transactional indicators
  const transactionalKeywords = [
    'buy',
    'purchase',
    'order',
    'shop',
    'cart',
    'checkout',
    'price',
    'cost',
    'deal',
    'discount',
    'coupon',
    'sale',
    'cheap',
    'affordable',
    'subscription',
    'download',
    'get',
    'hire',
    'book',
    'reserve',
  ];

  // Commercial investigation indicators
  const commercialKeywords = [
    'best',
    'top',
    'review',
    'comparison',
    'vs',
    'versus',
    'alternative',
    'compare',
    'option',
    'recommendation',
    'affordable',
    'quality',
    'rating',
    'recommended',
  ];

  // Navigational indicators
  const navigationalKeywords = [
    'login',
    'signin',
    'sign in',
    'account',
    'dashboard',
    'portal',
    'website',
    'official',
    'homepage',
  ];

  // Check for transactional intent
  if (transactionalKeywords.some((word) => lowerKeyword.includes(word))) {
    return 'transactional';
  }

  // Check for commercial intent
  if (commercialKeywords.some((word) => lowerKeyword.includes(word))) {
    return 'commercial';
  }

  // Check for navigational intent
  if (navigationalKeywords.some((word) => lowerKeyword.includes(word))) {
    return 'navigational';
  }

  // Default to informational
  return 'informational';
}

/**
 * Detect if a keyword is a question and classify its type
 */
export function detectQuestion(keyword: string): {
  isQuestion: boolean;
  questionType?: QuestionType;
} {
  const lowerKeyword = keyword.toLowerCase().trim();

  const questionPatterns: { pattern: RegExp; type: QuestionType }[] = [
    { pattern: /^what\b/, type: 'what' },
    { pattern: /^how\b/, type: 'how' },
    { pattern: /^why\b/, type: 'why' },
    { pattern: /^when\b/, type: 'when' },
    { pattern: /^where\b/, type: 'where' },
    { pattern: /^who\b/, type: 'who' },
    { pattern: /^which\b/, type: 'which' },
  ];

  for (const { pattern, type } of questionPatterns) {
    if (pattern.test(lowerKeyword)) {
      return { isQuestion: true, questionType: type };
    }
  }

  // Check for question marks or other question indicators
  if (lowerKeyword.includes('?') || lowerKeyword.match(/^(can|should|will|would|could|is|are|does|do)\b/)) {
    return { isQuestion: true, questionType: 'other' };
  }

  return { isQuestion: false };
}

/**
 * Calculate opportunity score (0-100)
 * Higher score = better opportunity
 */
export function calculateOpportunityScore(
  keyword: KeywordIdea,
  options: {
    volumeWeight?: number;
    difficultyWeight?: number;
    cpcWeight?: number;
  } = {}
): number {
  const { volumeWeight = 0.5, difficultyWeight = 0.3, cpcWeight = 0.2 } = options;

  // Normalize search volume (logarithmic scale)
  // 0-10 = 0, 10-100 = 20, 100-1000 = 40, 1000-10000 = 60, 10000+ = 80-100
  let volumeScore = 0;
  if (keyword.searchVolume > 0) {
    volumeScore = Math.min(100, Math.log10(keyword.searchVolume + 1) * 20);
  }

  // Difficulty score (inverse - lower difficulty = higher score)
  const difficultyScore = 100 - keyword.difficulty;

  // CPC score (logarithmic scale)
  // Higher CPC = more commercial value = higher score
  let cpcScore = 0;
  if (keyword.cpc > 0) {
    cpcScore = Math.min(100, Math.log10(keyword.cpc * 100 + 1) * 25);
  }

  // Weighted average
  const opportunityScore =
    volumeScore * volumeWeight + difficultyScore * difficultyWeight + cpcScore * cpcWeight;

  return Math.round(opportunityScore);
}

/**
 * Get word count for a keyword
 */
export function getWordCount(keyword: string): number {
  return keyword.trim().split(/\s+/).length;
}

/**
 * Enrich keyword ideas with intent, questions, and opportunity scores
 */
export function enrichKeywordIdeas(
  keywords: KeywordIdea[],
  scoringOptions?: {
    volumeWeight?: number;
    difficultyWeight?: number;
    cpcWeight?: number;
  }
): EnrichedKeywordIdea[] {
  return keywords.map((keyword) => {
    const intent = classifyIntent(keyword.keyword);
    const questionInfo = detectQuestion(keyword.keyword);
    const opportunityScore = calculateOpportunityScore(keyword, scoringOptions);
    const wordCount = getWordCount(keyword.keyword);

    return {
      ...keyword,
      intent,
      isQuestion: questionInfo.isQuestion,
      questionType: questionInfo.questionType,
      opportunityScore,
      wordCount,
    };
  });
}

/**
 * Filter keywords by various criteria
 */
export function filterKeywords(
  keywords: EnrichedKeywordIdea[],
  filters: {
    minSearchVolume?: number;
    maxSearchVolume?: number;
    minDifficulty?: number;
    maxDifficulty?: number;
    minCpc?: number;
    maxCpc?: number;
    intent?: SearchIntent[];
    questionsOnly?: boolean;
    questionType?: QuestionType[];
    minWordCount?: number;
    maxWordCount?: number;
    minOpportunityScore?: number;
    searchTerm?: string;
  }
): EnrichedKeywordIdea[] {
  return keywords.filter((keyword) => {
    // Search volume filter
    if (filters.minSearchVolume !== undefined && keyword.searchVolume < filters.minSearchVolume) {
      return false;
    }
    if (filters.maxSearchVolume !== undefined && keyword.searchVolume > filters.maxSearchVolume) {
      return false;
    }

    // Difficulty filter
    if (filters.minDifficulty !== undefined && keyword.difficulty < filters.minDifficulty) {
      return false;
    }
    if (filters.maxDifficulty !== undefined && keyword.difficulty > filters.maxDifficulty) {
      return false;
    }

    // CPC filter
    if (filters.minCpc !== undefined && keyword.cpc < filters.minCpc) {
      return false;
    }
    if (filters.maxCpc !== undefined && keyword.cpc > filters.maxCpc) {
      return false;
    }

    // Intent filter
    if (filters.intent && filters.intent.length > 0 && !filters.intent.includes(keyword.intent)) {
      return false;
    }

    // Question filter
    if (filters.questionsOnly && !keyword.isQuestion) {
      return false;
    }
    if (
      filters.questionType &&
      filters.questionType.length > 0 &&
      keyword.questionType &&
      !filters.questionType.includes(keyword.questionType)
    ) {
      return false;
    }

    // Word count filter
    if (filters.minWordCount !== undefined && keyword.wordCount < filters.minWordCount) {
      return false;
    }
    if (filters.maxWordCount !== undefined && keyword.wordCount > filters.maxWordCount) {
      return false;
    }

    // Opportunity score filter
    if (
      filters.minOpportunityScore !== undefined &&
      keyword.opportunityScore < filters.minOpportunityScore
    ) {
      return false;
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      if (!keyword.keyword.toLowerCase().includes(searchTermLower)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort keywords by a specific field
 */
export function sortKeywords(
  keywords: EnrichedKeywordIdea[],
  sortBy:
    | 'searchVolume'
    | 'difficulty'
    | 'cpc'
    | 'opportunityScore'
    | 'keyword'
    | 'wordCount' = 'opportunityScore',
  order: 'asc' | 'desc' = 'desc'
): EnrichedKeywordIdea[] {
  const sorted = [...keywords].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'searchVolume':
        comparison = a.searchVolume - b.searchVolume;
        break;
      case 'difficulty':
        comparison = a.difficulty - b.difficulty;
        break;
      case 'cpc':
        comparison = a.cpc - b.cpc;
        break;
      case 'opportunityScore':
        comparison = a.opportunityScore - b.opportunityScore;
        break;
      case 'wordCount':
        comparison = a.wordCount - b.wordCount;
        break;
      case 'keyword':
        comparison = a.keyword.localeCompare(b.keyword);
        break;
      default:
        comparison = a.opportunityScore - b.opportunityScore;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Get keyword insights and statistics
 */
export function getKeywordInsights(keywords: EnrichedKeywordIdea[]): {
  totalKeywords: number;
  avgSearchVolume: number;
  avgDifficulty: number;
  avgCpc: number;
  avgOpportunityScore: number;
  intentDistribution: Record<SearchIntent, number>;
  questionCount: number;
  questionTypeDistribution: Record<QuestionType, number>;
  wordCountDistribution: Record<number, number>;
} {
  const totalKeywords = keywords.length;

  if (totalKeywords === 0) {
    return {
      totalKeywords: 0,
      avgSearchVolume: 0,
      avgDifficulty: 0,
      avgCpc: 0,
      avgOpportunityScore: 0,
      intentDistribution: {
        informational: 0,
        commercial: 0,
        transactional: 0,
        navigational: 0,
      },
      questionCount: 0,
      questionTypeDistribution: {
        what: 0,
        how: 0,
        why: 0,
        when: 0,
        where: 0,
        who: 0,
        which: 0,
        other: 0,
      },
      wordCountDistribution: {},
    };
  }

  // Calculate averages
  const avgSearchVolume =
    keywords.reduce((sum, k) => sum + k.searchVolume, 0) / totalKeywords;
  const avgDifficulty = keywords.reduce((sum, k) => sum + k.difficulty, 0) / totalKeywords;
  const avgCpc = keywords.reduce((sum, k) => sum + k.cpc, 0) / totalKeywords;
  const avgOpportunityScore =
    keywords.reduce((sum, k) => sum + k.opportunityScore, 0) / totalKeywords;

  // Intent distribution
  const intentDistribution: Record<SearchIntent, number> = {
    informational: 0,
    commercial: 0,
    transactional: 0,
    navigational: 0,
  };
  keywords.forEach((k) => {
    intentDistribution[k.intent]++;
  });

  // Question statistics
  const questionKeywords = keywords.filter((k) => k.isQuestion);
  const questionCount = questionKeywords.length;
  const questionTypeDistribution: Record<QuestionType, number> = {
    what: 0,
    how: 0,
    why: 0,
    when: 0,
    where: 0,
    who: 0,
    which: 0,
    other: 0,
  };
  questionKeywords.forEach((k) => {
    if (k.questionType) {
      questionTypeDistribution[k.questionType]++;
    }
  });

  // Word count distribution
  const wordCountDistribution: Record<number, number> = {};
  keywords.forEach((k) => {
    wordCountDistribution[k.wordCount] = (wordCountDistribution[k.wordCount] || 0) + 1;
  });

  return {
    totalKeywords,
    avgSearchVolume: Math.round(avgSearchVolume),
    avgDifficulty: Math.round(avgDifficulty),
    avgCpc: Math.round(avgCpc * 100) / 100,
    avgOpportunityScore: Math.round(avgOpportunityScore),
    intentDistribution,
    questionCount,
    questionTypeDistribution,
    wordCountDistribution,
  };
}

/**
 * Discover keywords from multiple sources
 */
export async function discoverKeywords(
  apiKey: string,
  options: {
    seedKeywords?: string[];
    domain?: string;
    includeAutocomplete?: boolean;
    includeRelated?: boolean;
    locationCode?: number;
    languageCode?: string;
    limit?: number;
  }
): Promise<EnrichedKeywordIdea[]> {
  const allKeywords: KeywordIdea[] = [];

  // Get keyword suggestions from seed keywords
  if (options.seedKeywords && options.seedKeywords.length > 0) {
    const suggestions = await getKeywordSuggestions(apiKey, {
      keywords: options.seedKeywords,
      locationCode: options.locationCode,
      languageCode: options.languageCode,
      limit: options.limit,
    });

    suggestions.forEach((response) => {
      allKeywords.push(...response.suggestions);
    });
  }

  // Get keywords from domain
  if (options.domain) {
    const domainKeywords = await getKeywordIdeasFromDomain(apiKey, options.domain, {
      locationCode: options.locationCode,
      languageCode: options.languageCode,
      limit: options.limit,
    });

    allKeywords.push(...domainKeywords);
  }

  // Get autocomplete suggestions
  if (options.includeAutocomplete && options.seedKeywords) {
    for (const seed of options.seedKeywords) {
      const autocompleteSuggestions = await getAutocompleteSuggestions(apiKey, seed, {
        locationCode: options.locationCode,
        languageCode: options.languageCode,
      });

      // Convert autocomplete suggestions to KeywordIdea format (minimal data)
      autocompleteSuggestions.forEach((keyword) => {
        allKeywords.push({
          keyword,
          searchVolume: 0, // Autocomplete doesn't provide this
          cpc: 0,
          competition: 0,
          difficulty: 0,
          trends: [],
        });
      });
    }
  }

  // Get related keywords
  if (options.includeRelated && options.seedKeywords) {
    for (const seed of options.seedKeywords) {
      const relatedKeywords = await getRelatedKeywords(apiKey, seed, {
        locationCode: options.locationCode,
        languageCode: options.languageCode,
        limit: 100,
      });

      allKeywords.push(...relatedKeywords);
    }
  }

  // Remove duplicates
  const uniqueKeywords = Array.from(
    new Map(allKeywords.map((k) => [k.keyword.toLowerCase(), k])).values()
  );

  // Enrich and return
  return enrichKeywordIdeas(uniqueKeywords);
}
