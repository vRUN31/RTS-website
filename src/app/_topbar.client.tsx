"use client";
import React from 'react';
import UserMenu from './_user-menu.client';
import MainNav from './_main-nav.client';

export default function TopBar() {
  const [show, setShow] = React.useState(true);

  React.useEffect(() => {
    const check = () => {
      try {
        const p = window.location.pathname || '/';
        setShow(p !== '/');
      } catch {
        setShow(true);
      }
    };
    check();
    const onPop = () => check();
    window.addEventListener('popstate', onPop);
    window.addEventListener('pushstate' as any, onPop);
    window.addEventListener('replacestate' as any, onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('pushstate' as any, onPop);
      window.removeEventListener('replacestate' as any, onPop);
    };
  }, []);

  if (!show) return null;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/">RTS</a>
          <UserMenu />
        </div>
      </header>
      <div className="topnav-row">
        <MainNav />
      </div>
    </>
  );
}
