"use client";
import { useEffect } from 'react';

export default function ThemeInit() {
  useEffect(() => {
    // Initialize theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (savedTheme === 'auto' || !savedTheme) {
      // Auto mode or no saved preference - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  return null;
}
