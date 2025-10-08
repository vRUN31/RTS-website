"use client";
import { usePathname } from 'next/navigation';
import UserMenu from './_user-menu.client';

export default function TopShell() {
  const pathname = usePathname();
  // Hide the topbar on specific pages where it's unnecessary
  if (pathname === '/' || pathname === '/register' || pathname === '/login') return null;
  
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="/">RTS</a>
        <UserMenu />
      </div>
    </header>
  );
}