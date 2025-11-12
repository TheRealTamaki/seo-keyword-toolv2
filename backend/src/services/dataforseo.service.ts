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
