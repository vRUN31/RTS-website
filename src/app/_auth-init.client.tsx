"use client";

import { useEffect } from 'react';
import { initAuthListener } from '../utils/supabase/auth-helpers';

/**
 * Auth initialization component
 * Handles auth state changes and token cleanup
 */
export default function AuthInit() {
  useEffect(() => {
    // Initialize auth listener on mount
    initAuthListener();
  }, []);

  return null; // This component doesn't render anything
}
