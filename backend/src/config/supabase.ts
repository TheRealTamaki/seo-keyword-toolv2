import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
}

/**
 * Supabase client for general use (respects RLS)
 * Use this for client-side operations and user-specific queries
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side, don't persist
      detectSessionInUrl: false,
    },
  }
);

/**
 * Supabase admin client (bypasses RLS)
 * Use this for admin operations that need to bypass Row Level Security
 * BE VERY CAREFUL with this client - it has full database access
 */
export const supabaseAdmin: SupabaseClient | null = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Initialize Supabase connection
 */
export async function initializeSupabase(): Promise<void> {
  try {
    // Test connection by checking auth settings
    const { error } = await supabase.auth.getSession();

    if (error && error.message !== 'Auth session missing!') {
      throw error;
    }

    console.log('✓ Supabase client initialized successfully');
    console.log(`  URL: ${SUPABASE_URL}`);
    console.log(`  Admin client: ${supabaseAdmin ? 'Available' : 'Not configured'}`);
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    throw error;
  }
}

/**
 * Get Supabase client for a specific user's session
 */
export function getSupabaseClientForUser(accessToken: string): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Health check for Supabase
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  details?: any;
}> {
  try {
    // Simple health check - try to access auth
    const { error } = await supabase.auth.getSession();

    // "Auth session missing!" is expected and means Supabase is working
    if (!error || error.message === 'Auth session missing!') {
      return {
        status: 'healthy',
        message: 'Supabase connection is healthy',
        details: {
          url: SUPABASE_URL,
          adminConfigured: !!supabaseAdmin,
        },
      };
    }

    return {
      status: 'unhealthy',
      message: error.message,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
