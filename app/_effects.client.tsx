"use client";
import { useEffect } from 'react';

export default function Effects() {
  useEffect(() => {
    document.body.classList.add('fade-on-load');
    requestAnimationFrame(() => {
      document.body.classList.add('ready');
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest('a[data-transition]') as HTMLAnchorElement | null;
      if (link && link.href) {
        e.preventDefault();
        const overlay = document.querySelector('.page-transition');
        if (overlay) (overlay as HTMLElement).classList.add('active');
        setTimeout(() => { window.location.href = link.href; }, 300);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return <div className="page-transition" aria-hidden />;
}


