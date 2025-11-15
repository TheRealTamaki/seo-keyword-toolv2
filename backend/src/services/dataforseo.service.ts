import axios, { AxiosError } from 'axios';

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';

export interface DataForSEOCredentials {
  login: string;
  password: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: any;
}

/**
 * Parse DataForSEO API key into login and password
 * Format can be either:
 * - "login:password"
 * - Just the key (we'll try to use it as-is)
 */
export function parseApiKey(apiKey: string): DataForSEOCredentials {
  const trimmed = apiKey.trim();

  if (trimmed.includes(':')) {
    const [login, password] = trimmed.split(':', 2);
    return { login, password };
  }

  // If no colon, assume it's a token-based key
  return { login: trimmed, password: '' };
}

/**
 * Validate DataForSEO API key by making a test request
 * Uses the /status endpoint which is lightweight
 */
export async function validateApiKey(apiKey: string): Promise<ValidationResult> {
  try {
    const credentials = parseApiKey(apiKey);

    console.log('Starting DataForSEO validation...');

    // Make a simple request to check user info/status
    // DataForSEO requires an empty array for POST requests, not null
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/appendix/user_data`,
      [],
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log('Validation result:', {
      valid: response.data.status_code === 20000,
      message: response.data.status_message || 'API key is valid',
      details: response.data,
    });

    // DataForSEO returns status_code in response
    if (response.data && response.data.status_code === 20000) {
      console.log('✓ API key validated successfully');
      return {
        valid: true,
        message: 'API key is valid',
        details: {
          tasksCount: response.data.tasks_count || 0,
          tasksError: response.data.tasks_error || 0,
        },
      };
    }

    console.log('Validation failed:', response.data?.status_message);
    return {
      valid: false,
      message: response.data?.status_message || 'Invalid API key',
      details: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      console.log('Validation failed:', axiosError.message);

      // 401 means invalid credentials
      if (axiosError.response?.status === 401) {
        return {
          valid: false,
          message: 'Invalid API credentials',
        };
      }

      // Network or timeout errors
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return {
          valid: false,
          message: 'Request timeout - DataForSEO API may be unavailable',
        };
      }

      // Include response data for debugging
      if (axiosError.response?.data) {
        console.log('Validation failed:', axiosError.response.data);
        return {
          valid: false,
          message: (axiosError.response.data as any)?.status_message || axiosError.message || 'Failed to validate API key',
          details: axiosError.response.data,
        };
      }

      return {
        valid: false,
        message: axiosError.message || 'Failed to validate API key',
      };
    }

    console.log('Unexpected validation error:', error);
    return {
      valid: false,
      message: 'Unexpected error during validation',
    };
  }
}

/**
 * Get user account information from DataForSEO
 */
export async function getUserInfo(apiKey: string): Promise<any> {
  const credentials = parseApiKey(apiKey);

  // DataForSEO requires an empty array for POST requests, not null
  const response = await axios.post(
    `${DATAFORSEO_API_BASE}/appendix/user_data`,
    [],
    {
      auth: {
        username: credentials.login,
        password: credentials.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

/**
 * Get pricing information for DataForSEO services
 */
export async function getPricing(apiKey: string): Promise<any> {
  const credentials = parseApiKey(apiKey);

  const response = await axios.get(
    `${DATAFORSEO_API_BASE}/appendix/keywords_data/prices`,
    {
      auth: {
        username: credentials.login,
        password: credentials.password,
      },
    }
  );

  return response.data;
}

/**
 * Check if user has sufficient credits for a task
 * This is a helper to prevent running expensive queries
 */
export async function checkCredits(apiKey: string, estimatedCost: number): Promise<boolean> {
  try {
    const userInfo = await getUserInfo(apiKey);

    if (userInfo.tasks && userInfo.tasks[0]) {
      const task = userInfo.tasks[0];
      const balance = task.result?.money?.balance || 0;

      return balance >= estimatedCost;
    }

    return false;
  } catch (error) {
    console.error('Error checking credits:', error);
    return false;
  }
}

/**
 * Interfaces for SERP API
 */
export interface SerpTaskOptions {
  keyword: string;
  locationName?: string; // Deprecated: use locationCode instead
  locationCode?: number;
  languageCode?: string;
  device?: 'desktop' | 'mobile';
  os?: string;
  depth?: number; // Max 100 results
}

export interface SerpResult {
  type: string;
  rank_group: number;
  rank_absolute: number;
  domain: string;
  title: string;
  url: string;
  description?: string;
  breadcrumb?: string;
  is_featured_snippet?: boolean;
  is_paid?: boolean;
  serp_features?: string[];
}

export interface SerpResponse {
  keyword: string;
  location_code: number;
  language_code: string;
  device: string;
  type: string;
  se_results_count: number;
  items: SerpResult[];
  check_url?: string;
  datetime: string;
}

/**
 * Check SERP rankings for a keyword using Google Organic Live API
 */
export async function checkGoogleRankings(
  apiKey: string,
  options: SerpTaskOptions
): Promise<SerpResponse> {
  const credentials = parseApiKey(apiKey);

  const payload = [
    {
      keyword: options.keyword,
      location_code: options.locationCode || 2840, // Default to United States
      language_code: options.languageCode || 'en',
      device: options.device || 'desktop',
      os: options.device === 'mobile' ? 'android' : undefined,
      depth: options.depth || 100,
      calculate_rectangles: false,
    },
  ];

  try {
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/serp/google/organic/live/advanced`,
      payload,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout for SERP requests
      }
    );

    if (response.data?.tasks?.[0]?.result?.[0]) {
      return response.data.tasks[0].result[0];
    }

    throw new Error('Invalid response from DataForSEO API');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('DataForSEO SERP API error:', axiosError.response?.data || axiosError.message);
      throw new Error(`DataForSEO API error: ${axiosError.message}`);
    }
    throw error;
  }
}

/**
 * Check SERP rankings for Bing
 */
export async function checkBingRankings(
  apiKey: string,
  options: SerpTaskOptions
): Promise<SerpResponse> {
  const credentials = parseApiKey(apiKey);

  const payload = [
    {
      keyword: options.keyword,
      location_code: options.locationCode || 2840, // Default to United States
      language_code: options.languageCode || 'en',
      device: options.device || 'desktop',
      depth: options.depth || 100,
    },
  ];

  try {
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/serp/bing/organic/live/advanced`,
      payload,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    if (response.data?.tasks?.[0]?.result?.[0]) {
      return response.data.tasks[0].result[0];
    }

    throw new Error('Invalid response from DataForSEO Bing API');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('DataForSEO Bing API error:', axiosError.response?.data || axiosError.message);
      throw new Error(`DataForSEO Bing API error: ${axiosError.message}`);
    }
    throw error;
  }
}

/**
 * Check SERP rankings for YouTube
 */
export async function checkYoutubeRankings(
  apiKey: string,
  options: SerpTaskOptions
): Promise<SerpResponse> {
  const credentials = parseApiKey(apiKey);

  const payload = [
    {
      keyword: options.keyword,
      location_code: options.locationCode || 2840, // United States
      language_code: options.languageCode || 'en',
      depth: options.depth || 100,
    },
  ];

  try {
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/serp/youtube/organic/live/advanced`,
      payload,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    if (response.data?.tasks?.[0]?.result?.[0]) {
      return response.data.tasks[0].result[0];
    }

    throw new Error('Invalid response from DataForSEO YouTube API');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('DataForSEO YouTube API error:', axiosError.response?.data || axiosError.message);
      throw new Error(`DataForSEO YouTube API error: ${axiosError.message}`);
    }
    throw error;
  }
}

/**
 * Extract SERP features from results
 */
export function extractSerpFeatures(items: SerpResult[]): string[] {
  const features = new Set<string>();

  items.forEach((item) => {
    // Check item type for SERP features
    if (item.type) {
      if (item.type === 'featured_snippet') features.add('featured_snippet');
      if (item.type === 'people_also_ask') features.add('people_also_ask');
      if (item.type === 'images') features.add('images');
      if (item.type === 'video') features.add('video');
      if (item.type === 'local_pack') features.add('local_pack');
      if (item.type === 'knowledge_graph') features.add('knowledge_graph');
      if (item.type === 'shopping') features.add('shopping');
      if (item.type === 'top_stories') features.add('top_stories');
    }

    // Check if specific result has featured snippet
    if (item.is_featured_snippet) {
      features.add('featured_snippet');
    }
  });

  return Array.from(features);
}

/**
 * Interfaces for Keyword Research API
 */
export interface KeywordIdea {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  trends?: number[];
}

export interface KeywordSuggestionsOptions {
  keywords: string[];
  locationName?: string;
  locationCode?: number;
  languageCode?: string;
  includeAdults?: boolean;
  limit?: number;
}

export interface KeywordSuggestionsResponse {
  keyword: string;
  suggestions: KeywordIdea[];
  totalCount: number;
}

/**
 * Get keyword suggestions for seed keywords
 * Uses Google Ads API via DataForSEO
 */
export async function getKeywordSuggestions(
  apiKey: string,
  options: KeywordSuggestionsOptions
): Promise<KeywordSuggestionsResponse[]> {
  const credentials = parseApiKey(apiKey);

  const payload = options.keywords.map((keyword) => ({
    keyword,
    location_code: options.locationCode || 2840, // United States
    language_code: options.languageCode || 'en',
    include_adult_keywords: options.includeAdults || false,
    sort_by: 'search_volume',
    limit: options.limit || 1000,
  }));

  try {
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/keywords_data/google_ads/keywords_for_keywords/live`,
      payload,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    if (!response.data?.tasks) {
      throw new Error('Invalid response from DataForSEO API');
    }

    return response.data.tasks.map((task: any) => {
      const result = task.result?.[0];
      if (!result) {
        return {
          keyword: task.data?.keyword || '',
          suggestions: [],
          totalCount: 0,
        };
      }

      const suggestions: KeywordIdea[] = (result.items || []).map((item: any) => ({
        keyword: item.keyword,
        searchVolume: item.search_volume || 0,
        cpc: item.cpc || 0,
        competition: item.competition || 0,
        difficulty: item.keyword_difficulty || 0,
        trends: item.monthly_searches?.map((m: any) => m.search_volume) || [],
      }));

      return {
        keyword: result.keyword || task.data?.keyword || '',
        suggestions,
        totalCount: result.total_count || suggestions.length,
      };
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('DataForSEO Keyword API error:', axiosError.response?.data || axiosError.message);
      throw new Error(`DataForSEO Keyword API error: ${axiosError.message}`);
    }
    throw error;
  }
}

/**
 * Get keyword ideas based on a website domain
 */
export async function getKeywordIdeasFromDomain(
  apiKey: string,
  domain: string,
  options: {
    locationCode?: number;
    languageCode?: string;
    limit?: number;
  } = {}
): Promise<KeywordIdea[]> {
  const credentials = parseApiKey(apiKey);

  const payload = [
    {
      target: domain,
      location_code: options.locationCode || 2840,
      language_code: options.languageCode || 'en',
      sort_by: 'search_volume',
      limit: options.limit || 1000,
    },
  ];

  try {
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/keywords_data/google_ads/keywords_for_site/live`,
      payload,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const result = response.data?.tasks?.[0]?.result?.[0];
    if (!result) {
      return [];
    }

    return (result.items || []).map((item: any) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume || 0,
      cpc: item.cpc || 0,
      competition: item.competition || 0,
      difficulty: item.keyword_difficulty || 0,
      trends: item.monthly_searches?.map((m: any) => m.search_volume) || [],
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('DataForSEO Keyword from Domain API error:', axiosError.response?.data || axiosError.message);
      throw new Error(`DataForSEO Keyword from Domain API error: ${axiosError.message}`);
    }
    throw error;
  }
}

/**
 * Get autocomplete suggestions (Google autocomplete)
 */
export async function getAutocompleteSuggestions(
  apiKey: string,
  keyword: string,
  options: {
    locationCode?: number;
    languageCode?: string;
  } = {}
): Promise<string[]> {
  const credentials = parseApiKey(apiKey);

  const payload = [
    {
      keyword,
      location_code: options.locationCode || 2840,
      language_code: options.languageCode || 'en',
    },
  ];

  try {
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/serp/google/autocomplete/live/advanced`,
      payload,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const result = response.data?.tasks?.[0]?.result?.[0];
    if (!result || !result.items) {
      return [];
    }

    return result.items
      .map((item: any) => item.keyword || item.title)
      .filter(Boolean);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('DataForSEO Autocomplete API error:', axiosError.response?.data || axiosError.message);
      throw new Error(`DataForSEO Autocomplete API error: ${axiosError.message}`);
    }
    throw error;
  }
}

/**
 * Get related keywords using DataForSEO's Keywords For Keywords API
 * This reuses the same endpoint as getKeywordSuggestions for cost efficiency
 */
export async function getRelatedKeywords(
  apiKey: string,
  keyword: string,
  options: {
    locationCode?: number;
    languageCode?: string;
    limit?: number;
  } = {}
): Promise<KeywordIdea[]> {
  const credentials = parseApiKey(apiKey);

  const payload = [
    {
      keyword,
      location_code: options.locationCode || 2840,
      language_code: options.languageCode || 'en',
      include_adult_keywords: false,
      sort_by: 'search_volume',
      limit: options.limit || 100,
    },
  ];

  try {
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/keywords_data/google_ads/keywords_for_keywords/live`,
      payload,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const result = response.data?.tasks?.[0]?.result?.[0];
    if (!result) {
      return [];
    }

    return (result.items || []).map((item: any) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume || 0,
      cpc: item.cpc || 0,
      competition: item.competition || 0,
      difficulty: item.keyword_difficulty || 0,
      trends: item.monthly_searches?.map((m: any) => m.search_volume) || [],
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('DataForSEO Related Keywords API error:', axiosError.response?.data || axiosError.message);
      throw new Error(`DataForSEO Related Keywords API error: ${axiosError.message}`);
    }
    throw error;
  }
}

/**
 * Check DataForSEO response for errors
 * DataForSEO returns structured error codes:
 * - 20000: Success
 * - 40xxx: Client errors (bad request, auth, etc.)
 * - 50xxx: Server errors
 */
export function checkDataForSEOResponse(response: any): void {
  if (!response.data) {
    throw new Error('Invalid response from DataForSEO API');
  }

  // Check for API-level status code
  const statusCode = response.data.status_code;
  if (statusCode && statusCode !== 20000) {
    const statusMessage = response.data.status_message || 'Unknown error';
    throw new Error(`DataForSEO API error (${statusCode}): ${statusMessage}`);
  }

  // Check task-level status
  if (response.data.tasks && response.data.tasks[0]) {
    const task = response.data.tasks[0];
    if (task.status_code && task.status_code !== 20000) {
      const taskMessage = task.status_message || 'Unknown task error';
      throw new Error(`DataForSEO task error (${task.status_code}): ${taskMessage}`);
    }
  }
}

/**
 * Check when Google Ads keyword data was last updated
 * Google typically updates keyword data in the middle of each month
 * If data was updated in October, you'll see September's data
 */
export async function checkGoogleAdsStatus(apiKey: string): Promise<{
  updated: boolean;
  updateDate: string | null;
  message: string;
  details?: any;
}> {
  const credentials = parseApiKey(apiKey);

  try {
    const response = await axios.get(
      `${DATAFORSEO_API_BASE}/keywords_data/google_ads/status`,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
      }
    );

    checkDataForSEOResponse(response);

    if (response.data?.tasks?.[0]?.result?.[0]) {
      const result = response.data.tasks[0].result[0];
      return {
        updated: result.updated || false,
        updateDate: result.update_date || null,
        message: result.updated
          ? `Google Ads data updated on ${result.update_date}`
          : 'Waiting for monthly Google Ads data update',
        details: result,
      };
    }

    return {
      updated: false,
      updateDate: null,
      message: 'Unable to determine Google Ads update status',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error checking Google Ads status:', axiosError.response?.data || axiosError.message);
      return {
        updated: false,
        updateDate: null,
        message: 'Error checking Google Ads status',
      };
    }
    throw error;
  }
}

/**
 * Get available locations for SERP API
 * This helps you get accurate location codes for rank tracking
 */
export async function getAvailableLocations(
  apiKey: string,
  searchEngine: 'google' | 'bing' | 'youtube' = 'google'
): Promise<any[]> {
  const credentials = parseApiKey(apiKey);

  const endpoint =
    searchEngine === 'google'
      ? '/serp/google/locations'
      : searchEngine === 'bing'
      ? '/serp/bing/locations'
      : '/serp/youtube/locations';

  try {
    const response = await axios.get(`${DATAFORSEO_API_BASE}${endpoint}`, {
      auth: {
        username: credentials.login,
        password: credentials.password,
      },
    });

    checkDataForSEOResponse(response);

    return response.data?.tasks?.[0]?.result || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(
        `Error fetching ${searchEngine} locations:`,
        axiosError.response?.data || axiosError.message
      );
      throw new Error(`Failed to fetch ${searchEngine} locations: ${axiosError.message}`);
    }
    throw error;
  }
}

/**
 * Get available languages for SERP API
 */
export async function getAvailableLanguages(
  apiKey: string,
  searchEngine: 'google' | 'bing' | 'youtube' = 'google'
): Promise<any[]> {
  const credentials = parseApiKey(apiKey);

  const endpoint =
    searchEngine === 'google'
      ? '/serp/google/languages'
      : searchEngine === 'bing'
      ? '/serp/bing/languages'
      : '/serp/youtube/languages';

  try {
    const response = await axios.get(`${DATAFORSEO_API_BASE}${endpoint}`, {
      auth: {
        username: credentials.login,
        password: credentials.password,
      },
    });

    checkDataForSEOResponse(response);

    return response.data?.tasks?.[0]?.result || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(
        `Error fetching ${searchEngine} languages:`,
        axiosError.response?.data || axiosError.message
      );
      throw new Error(`Failed to fetch ${searchEngine} languages: ${axiosError.message}`);
    }
    throw error;
  }
}
