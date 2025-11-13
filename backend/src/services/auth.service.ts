import { supabase } from '../config/supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import * as UserModel from '../models/user.model';

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session: Session;
}

/**
 * Register a new user with Supabase Auth
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const { email, password } = input;

  // Validate password strength before attempting registration
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.errors.join(', '));
  }

  // Register with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.FRONTEND_URL,
    },
  });

  if (error) {
    // Check for common Supabase errors
    if (error.message.includes('already registered')) {
      throw new Error('Email already registered');
    }
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Registration failed - no user returned');
  }

  // Sync user to our database
  await syncUserToDatabase(data.user);

  // If no session is returned, it means email confirmation is required
  // Create a mock session for the response (user needs to verify email)
  if (!data.session) {
    // Return user info without session - frontend should handle this
    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
      },
      session: null as any, // Email confirmation required
    };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      created_at: data.user.created_at,
    },
    session: data.session,
  };
}

/**
 * Login user with Supabase Auth
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  // Sign in with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error('Invalid email or password');
  }

  if (!data.user || !data.session) {
    throw new Error('Login failed - no user or session returned');
  }

  // Sync user to our database (in case they were created elsewhere)
  await syncUserToDatabase(data.user);

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      created_at: data.user.created_at,
    },
    session: data.session,
  };
}

/**
 * Logout user with Supabase
 */
export async function logout(accessToken: string): Promise<void> {
  try {
    // Supabase handles token invalidation
    const { error } = await supabase.auth.admin.signOut(accessToken);

    if (error) {
      console.error('Logout error:', error);
    }
  } catch (error) {
    console.error('Error during logout:', error);
    // Don't throw - logout should be best-effort
  }
}

/**
 * Verify Supabase JWT token and get user
 */
export async function verifyToken(token: string): Promise<SupabaseUser> {
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Invalid or expired token');
  }

  return data.user;
}

/**
 * Change user password with Supabase
 */
export async function changePassword(
  _accessToken: string,
  newPassword: string
): Promise<void> {
  // Validate password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.errors.join(', '));
  }

  // Update password using the user's access token
  const { error } = await supabase.auth.updateUser(
    { password: newPassword },
  );

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string, _email: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email',
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Sync Supabase user to our local database
 * This allows us to maintain application-specific user data
 */
async function syncUserToDatabase(supabaseUser: SupabaseUser): Promise<void> {
  try {
    // Check if user exists in our database
    const existingUser = await UserModel.findUserById(supabaseUser.id);

    if (!existingUser && supabaseUser.email) {
      // Create user in our database (without password hash since Supabase manages auth)
      await UserModel.createUserFromSupabase(supabaseUser.id, supabaseUser.email);
    }
  } catch (error) {
    console.error('Error syncing user to database:', error);
    // Don't throw - auth should succeed even if sync fails
  }
}

/**
 * Get user session from access token
 */
export async function getSession(_accessToken: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  return data.session;
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.user || !data.session) {
    throw new Error('Failed to refresh token');
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      created_at: data.user.created_at,
    },
    session: data.session,
  };
}

/**
 * Validate password strength
 * Supabase has built-in password rules, but we add extra validation
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
