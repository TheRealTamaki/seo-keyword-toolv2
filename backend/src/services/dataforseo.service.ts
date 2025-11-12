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

    // Make a simple request to check user info/status
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/appendix/user_data`,
      null,
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

    // DataForSEO returns status_code in response
    if (response.data && response.data.status_code === 20000) {
      return {
        valid: true,
        message: 'API key is valid',
        details: {
          tasksCount: response.data.tasks_count || 0,
          tasksError: response.data.tasks_error || 0,
        },
      };
    }

    return {
      valid: false,
      message: response.data?.status_message || 'Invalid API key',
      details: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

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

      return {
        valid: false,
        message: axiosError.message || 'Failed to validate API key',
      };
    }

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

  const response = await axios.post(
    `${DATAFORSEO_API_BASE}/appendix/user_data`,
    null,
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
  locationName?: string;
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
      location_name: options.locationName || 'United States',
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
      location_name: options.locationName || 'United States',
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
      `${DATAFORSEO_API_BASE}/serp/youtube/video/live/advanced`,
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
