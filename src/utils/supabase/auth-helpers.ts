/**
 * Auth Error Handler Utility
 * Handles common Supabase authentication errors gracefully
 */

import { createClient } from './client';

/**
 * Clear invalid auth tokens from storage
 * Use this when encountering "Invalid Refresh Token" or similar errors
 */
export async function clearInvalidAuthTokens() {
  if (typeof window === 'undefined') return;
  
  try {
    const supabase = createClient();
    // Sign out to clear all auth state
    await supabase.auth.signOut();
    
    // Also clear from localStorage manually as backup
    const keys = ['supabase.auth.token', 'supabase-auth-token'];
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore storage errors
      }
    });
    
    console.log('[Auth] Cleared invalid tokens');
  } catch (error) {
    console.error('[Auth] Error clearing tokens:', error);
  }
}

/**
 * Check if user is authenticated with valid token
 * Returns true if user is properly authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // If we get an auth error, clear invalid tokens
      if (error.message?.includes('refresh') || error.message?.includes('token')) {
        await clearInvalidAuthTokens();
      }
      return false;
    }
    
    return !!user;
  } catch (error) {
    console.error('[Auth] Error checking authentication:', error);
    return false;
  }
}

/**
 * Safe auth getter that handles token errors
 * Returns user if authenticated, null if not (without throwing)
 */
export async function getSafeUser() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Clear invalid tokens on auth errors
      if (error.message?.includes('refresh') || error.message?.includes('token')) {
        await clearInvalidAuthTokens();
      }
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('[Auth] Error getting user:', error);
    return null;
  }
}

/**
 * Initialize auth state listener
 * Automatically clears invalid tokens when auth state changes
 */
export function initAuthListener() {
  if (typeof window === 'undefined') return;
  
  const supabase = createClient();
  
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] State changed:', event);
    
    // Clear tokens on sign out or token refresh failure
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      if (!session) {
        await clearInvalidAuthTokens();
      }
    }
    
    // If we get a user updated event but no session, clear tokens
    if (event === 'USER_UPDATED' && !session) {
      await clearInvalidAuthTokens();
    }
  });
}
