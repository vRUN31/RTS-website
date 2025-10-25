"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BackButtonProps {
  label?: string;
  fallbackUrl?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'icon';
}

export default function BackButton({ 
  label = 'Back', 
  fallbackUrl = '/',
  className = '',
  variant = 'default'
}: BackButtonProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleBack = () => {
    setIsNavigating(true);
    
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to a specific URL if no history
      router.push(fallbackUrl);
    }
    
    // Reset state after navigation
    setTimeout(() => setIsNavigating(false), 500);
  };

  const baseClasses = 'back-button';
  const variantClasses = {
    default: 'back-button-default',
    minimal: 'back-button-minimal',
    icon: 'back-button-icon'
  };

  return (
    <button
      onClick={handleBack}
      disabled={isNavigating}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label={label}
      title={label}
    >
      <span className="back-button-icon">←</span>
      {variant !== 'icon' && <span className="back-button-text">{label}</span>}
    </button>
  );
}
